let currentLocale = 'en';

export const setCurrentLocale = (locale: string) => {
    currentLocale = locale || 'en';
};

export const getCurrentLocale = () => currentLocale;
// Backward-compatible alias for existing imports
export const getLocale = getCurrentLocale;

const readLocalizedValue = (value: any, locale: string) => {
    if (!value) return undefined;
    if (typeof value === 'string') return value;
    if (typeof value === 'object') {
        if (value[locale]) return value[locale];
        if (value.en) return value.en;
    }
    return undefined;
};

export const getLocalizedField = (source: any, field: string, fallback: string = '') => {
    const locale = getCurrentLocale();
    if (!source) return fallback;

    const localizedKey = `${field}_${locale}`;
    if (source[localizedKey]) return source[localizedKey];

    const fieldValue = source[field];
    const localizedValue = readLocalizedValue(fieldValue, locale);
    if (localizedValue) return localizedValue;

    const translations = source.translations || source.i18n;
    if (translations && translations[locale] && translations[locale][field]) {
        return translations[locale][field];
    }

    if (typeof fieldValue === 'string') return fieldValue;
    return fallback;
};
