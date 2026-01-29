import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTranslations } from '../services/endpoints';
import { setCurrentLocale } from '../i18n/locale';

type Translations = Record<string, string>;

interface LocalizationContextType {
    locale: string;
    setLocale: (locale: string) => void;
    translations: Translations;
    isLoading: boolean;
    t: (key: string, fallback?: string) => string;
}

const DEFAULT_LOCALE = 'en';
const LOCALE_KEY = '@tonas_locale';

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

export function LocalizationProvider({ children }: { children: React.ReactNode }) {
    const [locale, setLocaleState] = useState(DEFAULT_LOCALE);
    const [translations, setTranslations] = useState<Translations>({});
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const loadLocale = async () => {
            try {
                const saved = await AsyncStorage.getItem(LOCALE_KEY);
                if (saved) {
                    setLocaleState(saved);
                }
            } catch (error) {
                console.warn('Failed to load locale:', error);
            }
        };
        loadLocale();
    }, []);

    useEffect(() => {
        setCurrentLocale(locale);

        const fetchTranslations = async () => {
            setIsLoading(true);
            try {
                const data = await getTranslations(locale);
                setTranslations(data || {});
            } catch (error) {
                console.warn('Failed to load translations:', error);
                setTranslations({});
            } finally {
                setIsLoading(false);
            }
        };

        fetchTranslations();
    }, [locale]);

    const setLocale = async (nextLocale: string) => {
        const normalized = nextLocale || DEFAULT_LOCALE;
        setLocaleState(normalized);
        try {
            await AsyncStorage.setItem(LOCALE_KEY, normalized);
        } catch (error) {
            console.warn('Failed to save locale:', error);
        }
    };

    const t = useMemo(
        () =>
            (key: string, fallback: string = key) =>
                translations[key] ?? fallback ?? key,
        [translations]
    );

    const value = useMemo(
        () => ({
            locale,
            setLocale,
            translations,
            isLoading,
            t,
        }),
        [locale, translations, isLoading, t]
    );

    return (
        <LocalizationContext.Provider value={value}>
            {children}
        </LocalizationContext.Provider>
    );
}

export function useLocalization() {
    const context = useContext(LocalizationContext);
    if (!context) {
        throw new Error('useLocalization must be used within a LocalizationProvider');
    }
    return context;
}

export function useTranslation() {
    return useLocalization();
}
