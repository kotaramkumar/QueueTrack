import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ref, set, onValue, off } from 'firebase/database';
import { db } from '../firebase';

const STORAGE_KEY = '@QueueTrack:state';

const initialState = {
  mode: null, // 'restaurant' | 'hospital'
  queues: {
    restaurant: [],
    hospital: [],
  },
  settings: {
    restaurant: {
      availableSeats: 4,
      totalCapacity: 20,
      avgWaitMinutes: 15,
      businessName: 'Our Restaurant',
    },
    hospital: {
      doctors: [
        { id: 'd1', name: 'Dr. Smith', specialty: 'General', available: true },
        { id: 'd2', name: 'Dr. Johnson', specialty: 'Cardiology', available: true },
        { id: 'd3', name: 'Dr. Williams', specialty: 'Pediatrics', available: false },
      ],
      avgWaitMinutes: 20,
      businessName: 'City Hospital',
    },
  },
  counters: {
    restaurant: 0,
    hospital: 0,
  },
};

function queueReducer(state, action) {
  switch (action.type) {
    case 'SET_MODE':
      return { ...state, mode: action.payload };

    case 'LOAD_STATE':
      return { ...initialState, ...action.payload };

    case 'ADD_TO_QUEUE': {
      const { mode, customer } = action.payload;
      const counter = (state.counters[mode] || 0) + 1;
      const prefix = mode === 'restaurant' ? 'R' : 'H';
      const queueNumber = `${prefix}${String(counter).padStart(3, '0')}`;
      const newCustomer = {
        id: Date.now().toString(),
        queueNumber,
        name: customer.name,
        phone: customer.phone,
        doctor: customer.doctor || null,
        status: 'waiting',
        addedAt: new Date().toISOString(),
      };
      return {
        ...state,
        counters: { ...state.counters, [mode]: counter },
        queues: {
          ...state.queues,
          [mode]: [...state.queues[mode], newCustomer],
        },
      };
    }

    case 'CALL_NEXT': {
      const { mode } = action.payload;
      const queue = state.queues[mode];
      const nextIndex = queue.findIndex((c) => c.status === 'waiting');
      if (nextIndex === -1) return state;
      const updated = queue.map((c, i) =>
        i === nextIndex ? { ...c, status: 'called' } : c
      );
      return { ...state, queues: { ...state.queues, [mode]: updated } };
    }

    case 'CALL_SPECIFIC': {
      const { mode, id } = action.payload;
      const updated = state.queues[mode].map((c) =>
        c.id === id ? { ...c, status: 'called' } : c
      );
      return { ...state, queues: { ...state.queues, [mode]: updated } };
    }

    case 'MARK_SERVED': {
      const { mode, id } = action.payload;
      const updated = state.queues[mode].map((c) =>
        c.id === id ? { ...c, status: 'served' } : c
      );
      return { ...state, queues: { ...state.queues, [mode]: updated } };
    }

    case 'REMOVE_FROM_QUEUE': {
      const { mode, id } = action.payload;
      const updated = state.queues[mode].filter((c) => c.id !== id);
      return { ...state, queues: { ...state.queues, [mode]: updated } };
    }

    case 'CLEAR_SERVED': {
      const { mode } = action.payload;
      const updated = state.queues[mode].filter((c) => c.status !== 'served');
      return { ...state, queues: { ...state.queues, [mode]: updated } };
    }

    case 'UPDATE_SETTINGS': {
      const { mode, settings } = action.payload;
      return {
        ...state,
        settings: {
          ...state.settings,
          [mode]: { ...state.settings[mode], ...settings },
        },
      };
    }

    case 'UPDATE_DOCTOR': {
      const { id, available } = action.payload;
      const doctors = (state.settings.hospital?.doctors || []).map((d) =>
        d.id === id ? { ...d, available } : d
      );
      return {
        ...state,
        settings: {
          ...state.settings,
          hospital: { ...state.settings.hospital, doctors },
        },
      };
    }

    case 'RESET_QUEUE': {
      const { mode } = action.payload;
      return {
        ...state,
        queues: { ...state.queues, [mode]: [] },
        counters: { ...state.counters, [mode]: 0 },
      };
    }

    default:
      return state;
  }
}

// Convert queue array to Firebase-friendly object keyed by queueNumber
function queuesToFirebase(queues) {
  const result = {};
  for (const mode of ['restaurant', 'hospital']) {
    result[mode] = {};
    for (const customer of queues[mode] || []) {
      result[mode][customer.queueNumber] = customer;
    }
  }
  return result;
}

// Convert doctors array to Firebase-friendly object keyed by id
function settingsToFirebase(settings) {
  const result = { restaurant: { ...settings.restaurant }, hospital: {} };
  const hosp = settings.hospital || {};
  result.hospital = {
    avgWaitMinutes: hosp.avgWaitMinutes,
    businessName: hosp.businessName,
    doctors: {},
  };
  for (const doc of hosp.doctors || []) {
    result.hospital.doctors[doc.id] = doc;
  }
  return result;
}

// Restore arrays from Firebase snapshot
function queuesFromFirebase(fbQueues) {
  const result = { restaurant: [], hospital: [] };
  for (const mode of ['restaurant', 'hospital']) {
    const entries = fbQueues?.[mode] || {};
    result[mode] = Object.values(entries).sort(
      (a, b) => new Date(a.addedAt) - new Date(b.addedAt)
    );
  }
  return result;
}

function settingsFromFirebase(fbSettings, fallback) {
  if (!fbSettings) return fallback;
  const hosp = fbSettings.hospital || {};
  return {
    restaurant: fbSettings.restaurant || fallback.restaurant,
    hospital: {
      avgWaitMinutes: hosp.avgWaitMinutes ?? fallback.hospital.avgWaitMinutes,
      businessName: hosp.businessName ?? fallback.hospital.businessName,
      doctors: Object.values(hosp.doctors || {}).length > 0
        ? Object.values(hosp.doctors)
        : fallback.hospital.doctors,
    },
  };
}

const QueueContext = createContext(null);

export function QueueProvider({ children }) {
  const [state, dispatch] = useReducer(queueReducer, initialState);
  // Track whether we have loaded initial state (to avoid writing before reading)
  const initialLoadDone = useRef(false);
  // Prevent feedback loop when Firebase update triggers a local dispatch
  const isFirebaseUpdate = useRef(false);

  // On mount: subscribe to Firebase for real-time updates
  useEffect(() => {
    const dbRef = ref(db, '/');
    const unsubscribe = onValue(dbRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        // Firebase empty — fall back to AsyncStorage for first-run migration
        AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
          if (saved) {
            dispatch({ type: 'LOAD_STATE', payload: JSON.parse(saved) });
          }
          initialLoadDone.current = true;
        }).catch(() => {
          initialLoadDone.current = true;
        });
        return;
      }

      isFirebaseUpdate.current = true;
      const loaded = {
        mode: data.mode ?? null,
        queues: queuesFromFirebase(data.queues),
        settings: settingsFromFirebase(data.settings, initialState.settings),
        counters: data.counters || initialState.counters,
      };
      dispatch({ type: 'LOAD_STATE', payload: loaded });
      initialLoadDone.current = true;
    }, (error) => {
      // Firebase unavailable — fall back to AsyncStorage
      console.warn('Firebase unavailable, using local storage:', error.message);
      AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
        if (saved) {
          dispatch({ type: 'LOAD_STATE', payload: JSON.parse(saved) });
        }
        initialLoadDone.current = true;
      }).catch(() => {
        initialLoadDone.current = true;
      });
    });

    return () => off(dbRef);
  }, []);

  // On every state change: sync to Firebase + AsyncStorage
  useEffect(() => {
    if (!initialLoadDone.current) return;
    if (isFirebaseUpdate.current) {
      isFirebaseUpdate.current = false;
      return;
    }

    // Write to AsyncStorage (local backup)
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});

    // Write to Firebase
    const fbData = {
      mode: state.mode,
      queues: queuesToFirebase(state.queues),
      settings: settingsToFirebase(state.settings),
      counters: state.counters,
    };
    set(ref(db, '/'), fbData).catch((err) => {
      console.warn('Firebase write failed:', err.message);
    });
  }, [state]);

  // Helpers
  const getActiveQueue = (mode) =>
    (state.queues[mode] || []).filter((c) => c.status !== 'served');

  const getWaitingQueue = (mode) =>
    (state.queues[mode] || []).filter((c) => c.status === 'waiting');

  const getQueuePosition = (mode, id) => {
    const waiting = getWaitingQueue(mode);
    const idx = waiting.findIndex((c) => c.id === id);
    return idx === -1 ? null : idx + 1;
  };

  const getEstimatedWait = (mode, id) => {
    const pos = getQueuePosition(mode, id);
    if (pos === null) return null;
    const avg = state.settings[mode]?.avgWaitMinutes || 15;
    return (pos - 1) * avg;
  };

  const findByQueueNumber = (mode, queueNumber) =>
    state.queues[mode]?.find(
      (c) => c.queueNumber.toLowerCase() === queueNumber.toLowerCase()
    ) || null;

  const findByPhone = (mode, phone) =>
    state.queues[mode]?.find((c) => c.phone === phone) || null;

  return (
    <QueueContext.Provider
      value={{
        state,
        dispatch,
        getActiveQueue,
        getWaitingQueue,
        getQueuePosition,
        getEstimatedWait,
        findByQueueNumber,
        findByPhone,
      }}
    >
      {children}
    </QueueContext.Provider>
  );
}

export function useQueue() {
  const ctx = useContext(QueueContext);
  if (!ctx) throw new Error('useQueue must be used within QueueProvider');
  return ctx;
}
