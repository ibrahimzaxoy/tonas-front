import axios, { AxiosError, AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { getLocale } from '../i18n/locale';

const normalizeApiUrl = (url: string) => {
    const trimmed = url.replace(/\/+$/, '');
    return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};

// Base URL configuration
// For development, use appropriate URL based on platform
const getBaseUrl = () => {
    const envUrl = process.env.EXPO_PUBLIC_API_URL;
    if (envUrl) {
        return normalizeApiUrl(envUrl);
    }

    if (__DEV__) {
        // Development mode
        if (Platform.OS === 'android') {
            // Android emulator uses 10.0.2.2 to access host machine
            return 'http://10.0.2.2:8000/api';
        } else if (Platform.OS === 'web') {
            // Web browser on same machine -> use localhost
            return 'http://localhost:8000/api';
        } else {
            // iOS simulator -> localhost. Physical device should use EXPO_PUBLIC_API_URL.
            return 'http://localhost:8000/api';
        }
    }
    // Production URL - update this when deploying
    return 'https://your-production-api.com/api';
};

export const getImageUrl = (path: string | null | undefined): string | undefined => {
    if (!path) return undefined;
    const baseUrl = getBaseUrl().replace('/api', '');

    if (path.startsWith('http')) {
        try {
            const parsed = new URL(path);
            if (['localhost', '127.0.0.1', '10.0.2.2'].includes(parsed.hostname)) {
                return `${baseUrl}${parsed.pathname}`;
            }
        } catch {
            return path;
        }
        return path;
    }
    // Remove /api from base url for images
    // Ensure path starts with /
    let cleanPath = path.startsWith('/') ? path : `/${path}`;

    // If path doesn't start with /storage, add it (assuming Laravel storage link)
    if (!cleanPath.startsWith('/storage')) {
        cleanPath = `/storage${cleanPath}`;
    }

    return `${baseUrl}${cleanPath}`;
};

export const BASE_URL = getBaseUrl();
const TOKEN_KEY = '@tonas_auth_token';

// Create axios instance
const api: AxiosInstance = axios.create({
    baseURL: BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// Request interceptor - add auth token
api.interceptors.request.use(
    async (config) => {
        if (config.data instanceof FormData) {
            if (config.headers && typeof (config.headers as any).set === 'function') {
                (config.headers as any).set('Content-Type', undefined);
            } else if (config.headers) {
                delete (config.headers as any)['Content-Type'];
                delete (config.headers as any)['content-type'];
            }
        }

        const locale = getLocale();
        if (locale) {
            config.headers['Accept-Language'] = locale;
        }

        try {
            const token = await AsyncStorage.getItem(TOKEN_KEY);
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
                console.log('[API] Request with auth token attached');
            } else {
                console.log('[API] Request WITHOUT auth token - user not logged in');
            }
        } catch (error) {
            console.log('Error getting token:', error);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - handle errors
api.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        if (error.response?.status === 401) {
            // Token expired or invalid - clear storage
            AsyncStorage.removeItem(TOKEN_KEY);
            // You might want to navigate to login here
        }

        // Extract error message from response
        const errorMessage = (error.response?.data as any)?.message || error.message;
        console.error('API Error:', errorMessage);

        return Promise.reject(new Error(errorMessage));
    }
);

// Auth helpers
export const setAuthToken = async (token: string): Promise<boolean> => {
    try {
        await AsyncStorage.setItem(TOKEN_KEY, token);
        console.log('[API] Token saved to storage');
        // Verify it was saved
        const saved = await AsyncStorage.getItem(TOKEN_KEY);
        console.log('[API] Token verification:', saved ? 'OK' : 'FAILED');
        return true;
    } catch (error) {
        console.error('[API] Failed to save token:', error);
        return false;
    }
};

export const getAuthToken = async () => {
    return await AsyncStorage.getItem(TOKEN_KEY);
};

export const removeAuthToken = async () => {
    await AsyncStorage.removeItem(TOKEN_KEY);
};

export const isAuthenticated = async () => {
    const token = await getAuthToken();
    return !!token;
};

export default api;
