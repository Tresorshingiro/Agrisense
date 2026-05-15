import axios, { AxiosInstance } from 'axios';
import { useAuth } from '@clerk/clerk-expo';
import { router } from 'expo-router';
import { useMemo } from 'react';

const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';

export function useApi(): AxiosInstance {
  const { getToken, signOut } = useAuth();

  const instance = useMemo(() => {
    const api = axios.create({ baseURL: BASE_URL });

    api.interceptors.request.use(async (config) => {
      const token = await getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          await signOut();
          router.replace('/(auth)/sign-in');
        }
        return Promise.reject(error);
      },
    );

    return api;
  }, [getToken, signOut]);

  return instance;
}
