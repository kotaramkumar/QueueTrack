import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { getApiKey, getScanHistory, saveScanHistory } from '../utils/storage';

const AppContext = createContext(null);

const MAX_HISTORY = 50;

function reducer(state, action) {
  switch (action.type) {
    case 'SET_API_KEY':
      return { ...state, apiKey: action.payload };
    case 'SET_HISTORY':
      return { ...state, scanHistory: action.payload };
    case 'ADD_SCAN': {
      const updated = [action.payload, ...state.scanHistory].slice(0, MAX_HISTORY);
      saveScanHistory(updated);
      return { ...state, scanHistory: updated };
    }
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, {
    apiKey: '',
    scanHistory: [],
  });

  useEffect(() => {
    (async () => {
      const apiKey = await getApiKey();
      const scanHistory = await getScanHistory();
      if (apiKey) dispatch({ type: 'SET_API_KEY', payload: apiKey });
      if (scanHistory?.length) dispatch({ type: 'SET_HISTORY', payload: scanHistory });
    })();
  }, []);

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}

export function useApp() {
  return useContext(AppContext);
}
