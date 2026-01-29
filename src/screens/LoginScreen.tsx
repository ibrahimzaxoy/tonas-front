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
    Modal,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { BASE_URL } from '../services/api';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../theme';
import { Loading } from '../components';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context';

export default function LoginScreen() {
    const navigation = useNavigation();
    const { login, requiresTwoFactor, verifyTwoFactor, processExternalToken } = useAuth();
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
    const [showTwoFactor, setShowTwoFactor] = useState(false);
    const [twoFactorCode, setTwoFactorCode] = useState('');
    const [twoFactorEmail, setTwoFactorEmail] = useState('');
    const [isVerifyingTwoFactor, setIsVerifyingTwoFactor] = useState(false);

    // Watch for 2FA requirement
    React.useEffect(() => {
        if (requiresTwoFactor) {
            setTwoFactorEmail(email);
            setShowTwoFactor(true);
        }
    }, [requiresTwoFactor]);

    const handleGoogleLogin = async () => {
        try {
            const redirectUrl = Linking.createURL('auth-callback');
            // Remove /api from BASE_URL if present, as OAuth routes are usually in web routes (root)
            const rootUrl = BASE_URL.replace(/\/api$/, '');
            const authUrl = `${rootUrl}/auth/google/redirect?mobile=true&redirect_uri=${encodeURIComponent(redirectUrl)}`;

            // For simplicity, we assume the backend handles the redirect correctly.
            // Ideally, backend should redirect to `tonas://auth-callback?token=...`
            // If running on emulator/simulator, standard localhost redirection might fail if not proxying.
            // Here we hope the user configured the backend to redirect to the custom scheme.

            const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);

            if (result.type === 'success' && result.url) {
                // Parse token from URL
                // Format: tonas://auth-callback?token=xyz
                const url = new URL(result.url);
                const token = url.searchParams.get('token');

                if (token) {
                    setIsLoading(true); // show loading on main screen while processing
                    try {
                        await processExternalToken(token);
                        // Navigate home
                        if (navigation.canGoBack()) {
                            navigation.goBack();
                        } else {
                            navigation.navigate('Main' as never);
                        }
                    } finally {
                        setIsLoading(false);
                    }
                } else {
                    Alert.alert(t('auth.login_failed', 'Login Failed'), t('auth.google_no_token', 'No token received from Google login'));
                }
            }
        } catch (error: any) {
            Alert.alert(t('auth.login_error', 'Login Error'), error.message || t('auth.google_failed', 'Failed to start Google login'));
        }
    };

    const handleVerifyTwoFactor = async () => {
        if (!twoFactorCode || twoFactorCode.length < 6) {
            Alert.alert(t('common.error', 'Error'), t('auth.2fa_invalid_code', 'Please enter a valid 6-digit code'));
            return;
        }

        setIsVerifyingTwoFactor(true);
        try {
            await verifyTwoFactor(twoFactorEmail || email, twoFactorCode);
            setShowTwoFactor(false);
            setTwoFactorCode('');
            if (navigation.canGoBack()) {
                navigation.goBack();
            } else {
                navigation.navigate('Main' as never);
            }
        } catch (error: any) {
            const message = error.response?.data?.message || t('auth.2fa_invalid', 'Invalid code');
            Alert.alert(t('auth.2fa_failed', 'Verification Failed'), message);
        } finally {
            setIsVerifyingTwoFactor(false);
        }
    };

    const validate = () => {
        const newErrors: { email?: string; password?: string } = {};

        if (!email.trim()) {
            newErrors.email = t('auth.email_required', 'Email is required');
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = t('auth.email_invalid', 'Please enter a valid email');
        }

        if (!password) {
            newErrors.password = t('auth.password_required', 'Password is required');
        } else if (password.length < 6) {
            newErrors.password = t('auth.password_min', 'Password must be at least 6 characters');
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleLogin = async () => {
        if (!validate()) return;

        try {
            setIsLoading(true);
            await login(email.trim(), password);

            // Navigate back or to home
            if (navigation.canGoBack()) {
                navigation.goBack();
            } else {
                navigation.navigate('Main' as never);
            }
        } catch (err: any) {
            console.error('Login error:', err);
            const errorMessage = err.response?.data?.message || err.message || t('auth.invalid_credentials', 'Invalid email or password');
            Alert.alert(t('auth.login_failed', 'Login Failed'), errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegisterPress = () => {
        navigation.navigate('Register' as never);
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
                    <Text style={styles.title}>{t('auth.welcome_back', 'Welcome Back!')}</Text>
                    <Text style={styles.subtitle}>{t('auth.sign_in_continue', 'Sign in to continue shopping')}</Text>

                    {/* Form */}
                    <View style={styles.form}>
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
                                    placeholder={t('auth.password_placeholder', 'Enter your password')}
                                    placeholderTextColor={colors.textLight}
                                    value={password}
                                    onChangeText={(text) => {
                                        setPassword(text);
                                        if (errors.password) setErrors({ ...errors, password: undefined });
                                    }}
                                    secureTextEntry={!showPassword}
                                    autoComplete="password"
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

                        {/* Forgot Password */}
                        <TouchableOpacity style={styles.forgotPassword}>
                            <Text style={styles.forgotPasswordText}>{t('auth.forgot_password', 'Forgot Password?')}</Text>
                        </TouchableOpacity>

                        {/* Login Button */}
                        <TouchableOpacity
                            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                            onPress={handleLogin}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <Loading fullScreen={false} />
                            ) : (
                                <Text style={styles.loginButtonText}>{t('auth.sign_in', 'Sign In')}</Text>
                            )}
                        </TouchableOpacity>

                        {/* Divider */}
                        <View style={styles.divider}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>{t('common.or', 'OR')}</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        {/* Social Login */}
                        <TouchableOpacity style={styles.socialButton} onPress={handleGoogleLogin}>
                            <Ionicons name="logo-google" size={20} color={colors.textPrimary} />
                            <Text style={styles.socialButtonText}>{t('auth.continue_google', 'Continue with Google')}</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Register Link */}
                    <View style={styles.registerLink}>
                        <Text style={styles.registerText}>{t('auth.no_account', "Don't have an account?") + ' '}</Text>
                        <TouchableOpacity onPress={handleRegisterPress}>
                            <Text style={styles.registerLinkText}>{t('auth.sign_up', 'Sign Up')}</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* 2FA Modal */}
            <Modal
                visible={showTwoFactor}
                transparent
                animationType="slide"
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{t('auth.2fa_title', 'Two-Factor Authentication')}</Text>
                        <Text style={styles.modalSubtitle}>
                            {t('auth.2fa_prompt', 'Please enter the code from your authenticator app')}
                        </Text>

                        <View style={styles.modalInputContainer}>
                            <TextInput
                                style={styles.modalInput}
                                placeholder={t('auth.2fa_placeholder', '000000')}
                                placeholderTextColor={colors.textLight}
                                value={twoFactorCode}
                                onChangeText={setTwoFactorCode}
                                keyboardType="number-pad"
                                maxLength={6}
                                autoFocus
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.modalButton, isVerifyingTwoFactor && styles.modalButtonDisabled]}
                            onPress={handleVerifyTwoFactor}
                            disabled={isVerifyingTwoFactor}
                        >
                            {isVerifyingTwoFactor ? (
                                <Loading fullScreen={false} />
                            ) : (
                                <Text style={styles.modalButtonText}>{t('auth.verify', 'Verify')}</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.modalCloseButton}
                            onPress={() => {
                                setShowTwoFactor(false);
                                setTwoFactorCode('');
                            }}
                        >
                            <Text style={styles.modalCloseText}>{t('common.cancel', 'Cancel')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
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
        marginTop: spacing.lg,
        marginBottom: spacing.xl,
    },
    logo: {
        width: 120,
        height: 60,
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
        marginBottom: spacing.xl,
    },
    form: {
        marginTop: spacing.md,
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
    forgotPassword: {
        alignSelf: 'flex-end',
        marginBottom: spacing.lg,
    },
    forgotPasswordText: {
        fontSize: fontSize.sm,
        color: colors.primary,
        fontWeight: fontWeight.medium,
    },
    loginButton: {
        backgroundColor: colors.primary,
        borderRadius: borderRadius.lg,
        paddingVertical: spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 50,
    },
    loginButtonDisabled: {
        opacity: 0.7,
    },
    loginButtonText: {
        color: colors.white,
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: spacing.lg,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: colors.borderLight,
    },
    dividerText: {
        marginHorizontal: spacing.md,
        fontSize: fontSize.sm,
        color: colors.textLight,
    },
    socialButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.white,
        borderRadius: borderRadius.lg,
        paddingVertical: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    socialButtonText: {
        marginLeft: spacing.sm,
        fontSize: fontSize.md,
        fontWeight: fontWeight.medium,
        color: colors.textPrimary,
    },
    registerLink: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: spacing.xl,
    },
    registerText: {
        fontSize: fontSize.md,
        color: colors.textSecondary,
    },
    registerLinkText: {
        fontSize: fontSize.md,
        color: colors.primary,
        fontWeight: fontWeight.bold,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: spacing.xl,
    },
    modalContent: {
        backgroundColor: colors.white,
        borderRadius: borderRadius.xl,
        padding: spacing.xl,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: fontSize.xl,
        fontWeight: fontWeight.bold,
        color: colors.textPrimary,
        marginBottom: spacing.sm,
    },
    modalSubtitle: {
        fontSize: fontSize.md,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: spacing.lg,
    },
    modalInputContainer: {
        width: '100%',
        backgroundColor: colors.background,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.borderLight,
        paddingVertical: spacing.md,
        marginBottom: spacing.lg,
    },
    modalInput: {
        fontSize: fontSize.xxl,
        fontWeight: fontWeight.bold,
        textAlign: 'center',
        color: colors.textPrimary,
        letterSpacing: 8,
    },
    modalButton: {
        width: '100%',
        backgroundColor: colors.primary,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    modalButtonDisabled: {
        opacity: 0.7,
    },
    modalButtonText: {
        color: colors.white,
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
    },
    modalCloseButton: {
        padding: spacing.sm,
    },
    modalCloseText: {
        color: colors.textSecondary,
        fontSize: fontSize.md,
    },
});
