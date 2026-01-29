import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Alert,
    StatusBar,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../theme';
import { becomeVendor } from '../services/endpoints';
import { Loading } from '../components';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context';

export default function BecomeSellerScreen() {
    const navigation = useNavigation();
    const { refreshUser } = useAuth();
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);

    // Form State
    const [storeName, setStoreName] = useState('');
    const [description, setDescription] = useState('');
    const [bannerUrl, setBannerUrl] = useState('');
    const [logoUrl, setLogoUrl] = useState('');

    const handleSubmit = async () => {
        console.log('Submit button pressed - Become Seller');
        if (!storeName.trim() || !description.trim()) {
            const msg = t('seller.store_required', 'Store name and description are required');
            if (Platform.OS === 'web') {
                window.alert(msg);
            } else {
                Alert.alert(t('common.error', 'Error'), msg);
            }
            return;
        }

        setIsLoading(true);
        try {
            console.log('Submitting vendor application:', { store_name: storeName, description });
            const result = await becomeVendor({
                store_name: storeName,
                description: description,
                cover_image: bannerUrl || undefined,
                profile_image: logoUrl || undefined,
            });
            console.log('Vendor application result:', result);

            const successMsg = t('seller.application_submitted', 'Your seller application has been submitted. An admin will review it shortly.');
            if (Platform.OS === 'web') {
                window.alert(successMsg);
                await refreshUser();
                // Redirect to Home/Main
                navigation.navigate('Main' as never);
            } else {
                Alert.alert(
                    t('seller.application_title', 'Application Submitted!'),
                    successMsg,
                    [
                        {
                            text: t('common.ok', 'OK'),
                            onPress: async () => {
                                await refreshUser();
                                // Redirect to Home/Main
                                navigation.navigate('Main' as never);
                            },
                        },
                    ]
                );
            }
        } catch (error: any) {
            console.error('Become Seller Error:', error.message || 'Unknown error');
            const msg = error.response?.status
                ? `${t('common.request_failed', 'Request failed')} (${error.response.status})`
                : error.message || t('seller.application_failed', 'Failed to submit application. Please try again.');

            if (Platform.OS === 'web') {
                window.alert(`Error: ${msg}`);
            } else {
                Alert.alert(t('common.error', 'Error'), msg);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.content}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                            <Ionicons name="close" size={24} color={colors.textPrimary} />
                        </TouchableOpacity>
                        <Text style={styles.title}>{t('seller.become_title', 'Become a Seller')}</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    {/* Info Banner */}
                    <View style={styles.infoBanner}>
                        <Ionicons name="information-circle-outline" size={20} color={colors.info} />
                        <Text style={styles.infoText}>
                            {t('seller.info_banner', 'Submit your store details. An admin will review your application.')}
                        </Text>
                    </View>

                    {/* Form */}
                    <View style={styles.formContainer}>
                        <Text style={styles.sectionTitle}>Store Details</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>{t('seller.store_name', 'Store Name')} *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder={t('seller.store_name_placeholder', 'e.g. Tonas Fashion')}
                                placeholderTextColor={colors.textLight}
                                value={storeName}
                                onChangeText={setStoreName}
                                autoCorrect={false}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>{t('seller.description', 'Description')} *</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder={t('seller.description_placeholder', 'Tell customers about your store and what you sell...')}
                                placeholderTextColor={colors.textLight}
                                value={description}
                                onChangeText={setDescription}
                                multiline={true}
                                numberOfLines={4}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>{t('seller.banner_url', 'Banner Image URL (Optional)')}</Text>
                            <TextInput
                                style={styles.input}
                                placeholder={t('seller.banner_placeholder', 'https://example.com/banner.jpg')}
                                placeholderTextColor={colors.textLight}
                                value={bannerUrl}
                                onChangeText={setBannerUrl}
                                autoCapitalize="none"
                                keyboardType="url"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>{t('seller.logo_url', 'Logo URL (Optional)')}</Text>
                            <TextInput
                                style={styles.input}
                                placeholder={t('seller.logo_placeholder', 'https://example.com/logo.png')}
                                placeholderTextColor={colors.textLight}
                                value={logoUrl}
                                onChangeText={setLogoUrl}
                                autoCapitalize="none"
                                keyboardType="url"
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.button, isLoading && styles.buttonDisabled]}
                            onPress={handleSubmit}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <Loading fullScreen={false} />
                            ) : (
                                <Text style={styles.buttonText}>{t('seller.submit_application', 'Submit Application')}</Text>
                            )}
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
    content: {
        padding: spacing.md,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.lg,
    },
    backButton: {
        padding: spacing.xs,
    },
    title: {
        fontSize: fontSize.xl,
        fontWeight: fontWeight.bold,
        color: colors.textPrimary,
    },
    infoBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E3F2FD',
        padding: spacing.md,
        borderRadius: borderRadius.md,
        marginBottom: spacing.lg,
        gap: spacing.sm,
    },
    infoText: {
        flex: 1,
        fontSize: fontSize.sm,
        color: colors.info,
    },
    formContainer: {
        flex: 1,
    },
    sectionTitle: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        color: colors.textPrimary,
        marginBottom: spacing.md,
    },
    inputGroup: {
        marginBottom: spacing.lg,
    },
    label: {
        fontSize: fontSize.sm,
        fontWeight: fontWeight.medium,
        color: colors.textPrimary,
        marginBottom: spacing.xs,
    },
    input: {
        borderWidth: 1,
        borderColor: colors.borderLight,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        fontSize: fontSize.md,
        color: colors.textPrimary,
        backgroundColor: colors.background,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    button: {
        backgroundColor: colors.primary,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
        marginTop: spacing.md,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: colors.white,
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
    },
});
