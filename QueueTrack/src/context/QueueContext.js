import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

const QueueContext = createContext(null);

export function QueueProvider({ children }) {
  const [state, dispatch] = useReducer(queueReducer, initialState);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          dispatch({ type: 'LOAD_STATE', payload: JSON.parse(saved) });
        }
      } catch (_) {}
    })();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
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
