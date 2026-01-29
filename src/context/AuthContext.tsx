import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAuthToken, removeAuthToken, getAuthToken } from '../services/api';
import { login as apiLogin, register as apiRegister, logout as apiLogout, getProfile, verifyTwoFactor as verifyTwoFactorApi } from '../services/endpoints';
import { normalizeUser } from '../services/normalizers';
import type { User } from '../types';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
    verifyTwoFactor: (email: string, code: string) => Promise<void>;
    processExternalToken: (token: string) => Promise<void>;
    requiresTwoFactor: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_KEY = '@tonas_user';

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);

    const handleAndStoreToken = async (response: any) => {
        const token = response.token || (response as any).access_token || (response as any).bearer_token;
        if (!token) {
            throw new Error('No token received from backend');
        }
        const tokenSaved = await setAuthToken(token);
        if (!tokenSaved) {
            throw new Error('Failed to save authentication token');
        }
        return token;
    };

    useEffect(() => {
        // Check for existing session on app start
        checkAuthStatus();
    }, []);

    const checkAuthStatus = async () => {
        try {
            const token = await getAuthToken();
            if (token) {
                // Try to get user profile
                const userData = await getProfile();
                setUser(userData);
            }
        } catch (error) {
            // Token invalid or expired
            await removeAuthToken();
            await AsyncStorage.removeItem(USER_KEY);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (email: string, password: string) => {
        try {
            const response = await apiLogin({ email, password });

            // Check if 2FA is required (response might be different depending on backend implementation)
            // If API returns a flag:
            if ((response as any).two_factor) {
                setRequiresTwoFactor(true);
                return;
            }

            await handleAndStoreToken(response);
            const normalizedUser = normalizeUser(response.user);
            await AsyncStorage.setItem(USER_KEY, JSON.stringify(normalizedUser));
            setUser(normalizedUser);
            setRequiresTwoFactor(false);
        } catch (error: any) {
            if (error.response?.data?.two_factor) {
                setRequiresTwoFactor(true);
                return;
            }
            throw error;
        }
    };

    const register = async (name: string, email: string, password: string) => {
        try {
            const response = await apiRegister({
                name,
                email,
                password,
                password_confirmation: password,
            });

            await handleAndStoreToken(response);
            const normalizedUser = normalizeUser(response.user);
            await AsyncStorage.setItem(USER_KEY, JSON.stringify(normalizedUser));
            setUser(normalizedUser);
        } catch (error) {
            throw error;
        }
    };

    const logout = async () => {
        try {
            await apiLogout();
        } catch (error) {
            // Ignore logout API errors
        } finally {
            await removeAuthToken();
            await AsyncStorage.removeItem(USER_KEY);
            setUser(null);
            setRequiresTwoFactor(false);
        }
    };

    const refreshUser = async () => {
        try {
            const userData = await getProfile();
            setUser(userData);
            await AsyncStorage.setItem(USER_KEY, JSON.stringify(userData));
        } catch (error) {
            console.error('Failed to refresh user:', error);
        }
    };

    const verifyTwoFactor = async (email: string, code: string) => {
        try {
            const response = await verifyTwoFactorApi(email, code);
            const token =
                (response as any).token ||
                (response as any).access_token ||
                (response as any).bearer_token;
            if (!token) {
                throw new Error('2FA verification failed: missing token');
            }

            await setAuthToken(token);
            const normalizedUser = normalizeUser((response as any).user);
            await AsyncStorage.setItem(USER_KEY, JSON.stringify(normalizedUser));
            setUser(normalizedUser);
            setRequiresTwoFactor(false);
        } catch (error) {
            throw error;
        }
    };

    const processExternalToken = async (token: string) => {
        try {
            await setAuthToken(token);
            const profileData = await getProfile();
            await AsyncStorage.setItem(USER_KEY, JSON.stringify(profileData));
            setUser(profileData);
        } catch (error) {
            console.error('Failed to process external token:', error);
            await removeAuthToken();
            await AsyncStorage.removeItem(USER_KEY);
            throw error;
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                isAuthenticated: !!user,
                login,
                register,
                logout,
                refreshUser,
                verifyTwoFactor,
                requiresTwoFactor,
                processExternalToken,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
