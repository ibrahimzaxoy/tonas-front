import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    TextInput,
    StatusBar,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../theme';
import { Loading } from '../components';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context';

export default function RegisterScreen() {
    const navigation = useNavigation();
    const { register } = useAuth();
    const { t } = useTranslation();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<{
        name?: string;
        email?: string;
        password?: string;
        confirmPassword?: string;
    }>({});

    const validate = () => {
        const newErrors: typeof errors = {};

        if (!name.trim()) {
            newErrors.name = t('auth.name_required', 'Name is required');
        } else if (name.trim().length < 2) {
            newErrors.name = t('auth.name_min', 'Name must be at least 2 characters');
        }

        if (!email.trim()) {
            newErrors.email = t('auth.email_required', 'Email is required');
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = t('auth.email_invalid', 'Please enter a valid email');
        }

        if (!password) {
            newErrors.password = t('auth.password_required', 'Password is required');
        } else if (password.length < 8) {
            newErrors.password = t('auth.password_min_8', 'Password must be at least 8 characters');
        }

        if (!confirmPassword) {
            newErrors.confirmPassword = t('auth.password_confirm_required', 'Please confirm your password');
        } else if (password !== confirmPassword) {
            newErrors.confirmPassword = t('auth.password_mismatch', 'Passwords do not match');
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleRegister = async () => {
        if (!validate()) return;

        try {
            setIsLoading(true);
            // Used auth context register which updates global state
            await register(name.trim(), email.trim(), password);

            Alert.alert(
                t('auth.welcome', 'Welcome!'),
                t('auth.account_created', 'Your account has been created successfully.'),
                [{ text: t('common.ok', 'OK'), onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Main' as never }] }) }]
            );
        } catch (err: any) {
            console.error('Registration error:', err);
            const errorMessage = err.response?.data?.message || err.message || t('auth.register_failed_generic', 'Could not create account');
            Alert.alert(t('auth.register_failed', 'Registration Failed'), errorMessage);

            // If validation errors from backend
            if (err.response?.data?.errors) {
                const backendErrors = err.response.data.errors;
                const formattedErrors: any = {};
                if (backendErrors.email) formattedErrors.email = backendErrors.email[0];
                if (backendErrors.password) formattedErrors.password = backendErrors.password[0];
                if (backendErrors.name) formattedErrors.name = backendErrors.name[0];
                setErrors(prev => ({ ...prev, ...formattedErrors }));
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleLoginPress = () => {
        navigation.navigate('Login' as never);
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Back Button */}
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
                    </TouchableOpacity>

                    {/* Logo */}
                    <View style={styles.logoContainer}>
                        <Image
                            source={require('../assets/logo.jpg')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                    </View>

                    {/* Title */}
                    <Text style={styles.title}>{t('auth.create_account', 'Create Account')}</Text>
                    <Text style={styles.subtitle}>{t('auth.sign_up_subtitle', 'Sign up to start shopping')}</Text>

                    {/* Form */}
                    <View style={styles.form}>
                        {/* Name Input */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>{t('auth.full_name', 'Full Name')}</Text>
                            <View style={[styles.inputWrapper, errors.name && styles.inputError]}>
                                <Ionicons name="person-outline" size={20} color={colors.textLight} />
                                <TextInput
                                    style={styles.input}
                                    placeholder={t('auth.name_placeholder', 'Enter your name')}
                                    placeholderTextColor={colors.textLight}
                                    value={name}
                                    onChangeText={(text) => {
                                        setName(text);
                                        if (errors.name) setErrors({ ...errors, name: undefined });
                                    }}
                                    autoCapitalize="words"
                                    autoComplete="name"
                                />
                            </View>
                            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
                        </View>

                        {/* Email Input */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>{t('auth.email', 'Email')}</Text>
                            <View style={[styles.inputWrapper, errors.email && styles.inputError]}>
                                <Ionicons name="mail-outline" size={20} color={colors.textLight} />
                                <TextInput
                                    style={styles.input}
                                    placeholder={t('auth.email_placeholder', 'Enter your email')}
                                    placeholderTextColor={colors.textLight}
                                    value={email}
                                    onChangeText={(text) => {
                                        setEmail(text);
                                        if (errors.email) setErrors({ ...errors, email: undefined });
                                    }}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoComplete="email"
                                />
                            </View>
                            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
                        </View>

                        {/* Password Input */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>{t('auth.password', 'Password')}</Text>
                            <View style={[styles.inputWrapper, errors.password && styles.inputError]}>
                                <Ionicons name="lock-closed-outline" size={20} color={colors.textLight} />
                                <TextInput
                                    style={styles.input}
                                    placeholder={t('auth.password_create', 'Create a password')}
                                    placeholderTextColor={colors.textLight}
                                    value={password}
                                    onChangeText={(text) => {
                                        setPassword(text);
                                        if (errors.password) setErrors({ ...errors, password: undefined });
                                    }}
                                    secureTextEntry={!showPassword}
                                    autoComplete="password-new"
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                    <Ionicons
                                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                        size={20}
                                        color={colors.textLight}
                                    />
                                </TouchableOpacity>
                            </View>
                            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
                        </View>

                        {/* Confirm Password Input */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>{t('auth.password_confirm', 'Confirm Password')}</Text>
                            <View style={[styles.inputWrapper, errors.confirmPassword && styles.inputError]}>
                                <Ionicons name="lock-closed-outline" size={20} color={colors.textLight} />
                                <TextInput
                                    style={styles.input}
                                    placeholder={t('auth.password_confirm_placeholder', 'Confirm your password')}
                                    placeholderTextColor={colors.textLight}
                                    value={confirmPassword}
                                    onChangeText={(text) => {
                                        setConfirmPassword(text);
                                        if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: undefined });
                                    }}
                                    secureTextEntry={!showPassword}
                                    autoComplete="password-new"
                                />
                            </View>
                            {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
                        </View>

                        {/* Register Button */}
                        <TouchableOpacity
                            style={[styles.registerButton, isLoading && styles.registerButtonDisabled]}
                            onPress={handleRegister}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <Loading fullScreen={false} />
                            ) : (
                                <Text style={styles.registerButtonText}>{t('auth.create_account', 'Create Account')}</Text>
                            )}
                        </TouchableOpacity>

                        {/* Terms */}
                        <Text style={styles.termsText}>
                            {t('auth.terms_prefix', 'By signing up, you agree to our') + ' '}
                            <Text style={styles.termsLink}>{t('auth.terms_service', 'Terms of Service')}</Text>
                            {' ' + t('auth.terms_and', 'and') + ' '}
                            <Text style={styles.termsLink}>{t('auth.terms_privacy', 'Privacy Policy')}</Text>
                        </Text>
                    </View>

                    {/* Login Link */}
                    <View style={styles.loginLink}>
                        <Text style={styles.loginText}>{t('auth.have_account', 'Already have an account?') + ' '}</Text>
                        <TouchableOpacity onPress={handleLoginPress}>
                            <Text style={styles.loginLinkText}>{t('auth.sign_in', 'Sign In')}</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.white,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        padding: spacing.lg,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
    },
    logoContainer: {
        alignItems: 'center',
        marginTop: spacing.md,
        marginBottom: spacing.lg,
    },
    logo: {
        width: 100,
        height: 50,
    },
    title: {
        fontSize: fontSize.xxxl,
        fontWeight: fontWeight.bold,
        color: colors.textPrimary,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: fontSize.md,
        color: colors.textSecondary,
        textAlign: 'center',
        marginTop: spacing.sm,
        marginBottom: spacing.lg,
    },
    form: {
        marginTop: spacing.sm,
    },
    inputContainer: {
        marginBottom: spacing.md,
    },
    label: {
        fontSize: fontSize.sm,
        fontWeight: fontWeight.medium,
        color: colors.textPrimary,
        marginBottom: spacing.sm,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background,
        borderRadius: borderRadius.lg,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderWidth: 1,
        borderColor: colors.borderLight,
    },
    inputError: {
        borderColor: colors.error,
    },
    input: {
        flex: 1,
        fontSize: fontSize.md,
        color: colors.textPrimary,
        marginLeft: spacing.sm,
        paddingVertical: spacing.xs,
    },
    errorText: {
        fontSize: fontSize.sm,
        color: colors.error,
        marginTop: spacing.xs,
    },
    registerButton: {
        backgroundColor: colors.primary,
        borderRadius: borderRadius.lg,
        paddingVertical: spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: spacing.md,
        minHeight: 50,
    },
    registerButtonDisabled: {
        opacity: 0.7,
    },
    registerButtonText: {
        color: colors.white,
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
    },
    termsText: {
        fontSize: fontSize.sm,
        color: colors.textSecondary,
        textAlign: 'center',
        marginTop: spacing.lg,
        lineHeight: 20,
    },
    termsLink: {
        color: colors.primary,
        fontWeight: fontWeight.medium,
    },
    loginLink: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: spacing.xl,
    },
    loginText: {
        fontSize: fontSize.md,
        color: colors.textSecondary,
    },
    loginLinkText: {
        fontSize: fontSize.md,
        color: colors.primary,
        fontWeight: fontWeight.bold,
    },
});
