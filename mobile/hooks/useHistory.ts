import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApi } from './useApi';

const CACHE_KEY = 'cache:history';
const TTL_MS = 24 * 60 * 60 * 1000;

export interface FertilizerItem {
  id: string;
  cropType: string;
  soilType: string;
  temperature: number;
  humidity: number;
  moisture: number;
  nitrogen: number;
  phosphorous: number;
  potassium: number;
  result: string;
  createdAt: string;
}

export interface YieldItem {
  id: string;
  crop: string;
  year: number;
  rainfallMm: number;
  pesticidesTonnes: number;
  avgTemp: number;
  area: string;
  predictedYield: number;
  createdAt: string;
}

export interface MapItem {
  id: string;
  latitude: number;
  longitude: number;
  district: string | null;
  maizeScore: number;
  beansScore: number;
  irishPotatoScore: number;
  sorghumScore: number;
  cassavaScore: number;
  createdAt: string;
}

interface HistoryState {
  fertilizer: FertilizerItem[];
  yields: YieldItem[];
  map: MapItem[];
  lastUpdated: number | null;
  isOffline: boolean;
  loading: boolean;
}

const INITIAL: HistoryState = {
  fertilizer: [],
  yields: [],
  map: [],
  lastUpdated: null,
  isOffline: false,
  loading: false,
};

export function useHistory() {
  const api = useApi();
  const [state, setState] = useState<HistoryState>(INITIAL);

  const load = useCallback(async (force = false) => {
    setState((s) => ({ ...s, loading: true }));
    try {
      const raw = await AsyncStorage.getItem(CACHE_KEY);
      if (raw && !force) {
        const cached = JSON.parse(raw) as { data: Omit<HistoryState, 'loading' | 'isOffline' | 'lastUpdated'>; timestamp: number };
        if (Date.now() - cached.timestamp < TTL_MS) {
          setState({ ...INITIAL, ...cached.data, lastUpdated: cached.timestamp });
          return;
        }
      }
      const { data } = await api.get<{ fertilizer: FertilizerItem[]; yields: YieldItem[]; map: MapItem[] }>('/api/history');
      const entry = { data, timestamp: Date.now() };
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(entry));
      setState({ ...INITIAL, ...data, lastUpdated: entry.timestamp });
    } catch {
      const raw = await AsyncStorage.getItem(CACHE_KEY);
      if (raw) {
        const cached = JSON.parse(raw);
        setState({ ...INITIAL, ...cached.data, lastUpdated: cached.timestamp, isOffline: true });
      } else {
        setState((s) => ({ ...s, isOffline: true }));
      }
    } finally {
      setState((s) => ({ ...s, loading: false }));
    }
  }, [api]);

  return { ...state, load };
}
