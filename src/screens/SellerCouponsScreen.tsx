import React, { useCallback, useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    RefreshControl,
    Switch,
    ActivityIndicator,
    Platform,
    Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, fontSize, fontWeight, borderRadius, shadows } from '../theme';
import { createSellerCoupon, deleteSellerCoupon, getSellerCoupons, updateSellerCoupon } from '../services/endpoints';
import { toBool } from '../services/normalizers';
import type { Coupon } from '../types';
import { Loading } from '../components';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTranslation } from '../context';

const formatDate = (value: string | null, fallback: string) => {
    if (!value) return fallback;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toISOString().split('T')[0];
};

export default function SellerCouponsScreen() {
    const navigation = useNavigation();
    const { t } = useTranslation();
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [updatingId, setUpdatingId] = useState<number | null>(null);

    const [code, setCode] = useState('');
    const [type, setType] = useState<'fixed' | 'percent'>('percent');
    const [value, setValue] = useState('');
    const [expiresAt, setExpiresAt] = useState('');
    const [expiryDateValue, setExpiryDateValue] = useState<Date | null>(null);
    const [isActive, setIsActive] = useState(true);
    const [showDatePicker, setShowDatePicker] = useState(false);

    const fetchCoupons = useCallback(async () => {
        try {
            const data = await getSellerCoupons();
            setCoupons(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to load coupons:', error);
            Alert.alert(t('common.error', 'Error'), t('seller.coupons_load_failed', 'Failed to load coupons'));
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchCoupons();
    }, [fetchCoupons]);

    const handleRefresh = () => {
        setIsRefreshing(true);
        fetchCoupons();
    };

    const validateForm = () => {
        if (!code.trim()) {
            Alert.alert(t('common.error', 'Error'), t('coupon.code_required', 'Coupon code is required'));
            return false;
        }
        const numericValue = Number.parseFloat(value);
        if (!Number.isFinite(numericValue) || numericValue <= 0) {
            Alert.alert(t('common.error', 'Error'), t('coupon.value_invalid', 'Enter a valid discount value'));
            return false;
        }
        if (!expiresAt.trim()) {
            Alert.alert(t('common.error', 'Error'), t('coupon.expiry_required', 'Expiry date is required'));
            return false;
        }
        return true;
    };

    const handleOpenDatePicker = () => {
        setShowDatePicker(true);
    };

    const handleDateChange = (_event: any, date?: Date) => {
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
        }
        if (!date) return;
        setExpiryDateValue(date);
        setExpiresAt(date.toISOString().split('T')[0]);
    };

    const handleCreate = async () => {
        if (!validateForm()) return;

        setIsSaving(true);
        try {
            const payload = {
                code: code.trim().toUpperCase(),
                type,
                value: value.trim(),
                expires_at: expiresAt.trim(),
                is_active: isActive,
            };
            const coupon = await createSellerCoupon(payload);
            setCoupons((prev) => [coupon, ...prev]);
            setCode('');
            setValue('');
            setExpiresAt('');
            setExpiryDateValue(null);
            setType('percent');
            setIsActive(true);
            Alert.alert(t('common.success', 'Success'), t('coupon.created', 'Coupon created'));
        } catch (error: any) {
            Alert.alert(t('common.error', 'Error'), error.message || t('coupon.create_failed', 'Failed to create coupon'));
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggleActive = async (coupon: Coupon, nextValue: boolean) => {
        setUpdatingId(coupon.id);
        try {
            const updated = await updateSellerCoupon(coupon.id, { is_active: nextValue });
            setCoupons((prev) => prev.map((item) => (item.id === coupon.id ? updated : item)));
        } catch (error: any) {
            Alert.alert(t('common.error', 'Error'), error.message || t('coupon.update_failed', 'Failed to update coupon'));
        } finally {
            setUpdatingId(null);
        }
    };

    const handleDelete = (couponId: number) => {
        Alert.alert(t('coupon.delete', 'Delete Coupon'), t('coupon.delete_confirm', 'Are you sure you want to delete this coupon?'), [
            { text: t('common.cancel', 'Cancel'), style: 'cancel' },
            {
                text: t('common.delete', 'Delete'),
                style: 'destructive',
                onPress: async () => {
                    try {
                        setUpdatingId(couponId);
                        await deleteSellerCoupon(couponId);
                        setCoupons((prev) => prev.filter((item) => item.id !== couponId));
                    } catch (error: any) {
                        Alert.alert(t('common.error', 'Error'), error.message || t('coupon.delete_failed', 'Failed to delete coupon'));
                    } finally {
                        setUpdatingId(null);
                    }
                },
            },
        ]);
    };

    if (isLoading) {
        return <Loading message={t('coupon.loading', 'Loading coupons...')} />;
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('coupon.title', 'Coupons')}</Text>
                <View style={styles.headerRight} />
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={handleRefresh}
                        colors={[colors.primary]}
                        tintColor={colors.primary}
                    />
                }
            >
                <View style={styles.formCard}>
                    <Text style={styles.formTitle}>{t('coupon.create', 'Create Coupon')}</Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>{t('coupon.code', 'Code')}</Text>
                        <TextInput
                            style={styles.input}
                            value={code}
                            onChangeText={(text) => setCode(text.toUpperCase())}
                            placeholder={t('coupon.code_placeholder', 'SAVE10')}
                            placeholderTextColor={colors.textLight}
                            autoCapitalize="characters"
                        />
                    </View>

                    <View style={styles.typeRow}>
                        <TouchableOpacity
                            style={[styles.typeButton, type === 'percent' && styles.typeButtonActive]}
                            onPress={() => setType('percent')}
                        >
                            <Text style={[styles.typeText, type === 'percent' && styles.typeTextActive]}>{t('coupon.percent', 'Percent %')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.typeButton, type === 'fixed' && styles.typeButtonActive]}
                            onPress={() => setType('fixed')}
                        >
                            <Text style={[styles.typeText, type === 'fixed' && styles.typeTextActive]}>{t('coupon.amount', 'Amount')}</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>{t('coupon.value', 'Value')}</Text>
                        <TextInput
                            style={styles.input}
                            value={value}
                            onChangeText={setValue}
                            placeholder={type === 'percent' ? '10' : '25'}
                            placeholderTextColor={colors.textLight}
                            keyboardType="numeric"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>{t('coupon.expiry', 'Expiry Date')}</Text>
                        {Platform.OS === 'web' ? (
                            <View style={styles.webDateInput}>
                                <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
                                <TextInput
                                    style={styles.webDateField}
                                    value={expiresAt}
                                    onChangeText={setExpiresAt}
                                    placeholder={t('coupon.select_date', 'Select date')}
                                    placeholderTextColor={colors.textLight}
                                    // @ts-ignore - web-only input type
                                    type="date"
                                />
                            </View>
                        ) : (
                            <TouchableOpacity style={styles.dateInput} onPress={handleOpenDatePicker}>
                                <Text style={expiresAt ? styles.dateText : styles.datePlaceholder}>
                                    {expiresAt || t('coupon.select_date', 'Select date')}
                                </Text>
                                <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={styles.switchRow}>
                        <Text style={styles.switchLabel}>{t('coupon.active', 'Active')}</Text>
                        <Switch
                            value={isActive}
                            onValueChange={setIsActive}
                            trackColor={{ false: colors.borderLight, true: colors.primary }}
                            thumbColor={colors.white}
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.createButton, isSaving && styles.createButtonDisabled]}
                        onPress={handleCreate}
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <ActivityIndicator color={colors.white} />
                        ) : (
                            <Text style={styles.createButtonText}>{t('coupon.create', 'Create Coupon')}</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <View style={styles.listHeader}>
                    <Text style={styles.sectionTitle}>{t('coupon.my_coupons', 'My Coupons')}</Text>
                </View>

                {coupons.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="pricetag-outline" size={64} color={colors.textLight} />
                        <Text style={styles.emptyText}>{t('coupon.empty', 'No coupons yet')}</Text>
                    </View>
                ) : (
                    coupons.map((coupon) => (
                        <View key={coupon.id} style={styles.couponCard}>
                            <View style={styles.couponInfo}>
                                <Text style={styles.couponCode}>{coupon.code}</Text>
                                <Text style={styles.couponMeta}>
                                    {coupon.type === 'percent'
                                        ? `${coupon.value}% ${t('coupon.off', 'off')}`
                                        : `$${Number.parseFloat(coupon.value).toFixed(2)} ${t('coupon.off', 'off')}`}
                                </Text>
                                <Text style={styles.couponMeta}>
                                    {t('coupon.expires', 'Expires')}: {formatDate(coupon.expires_at, t('coupon.no_expiry', 'No expiry'))}
                                </Text>
                            </View>
                            <View style={styles.couponActions}>
                                <Switch
                                    value={toBool(coupon.is_active, 'coupon.is_active')}
                                    onValueChange={(value) => handleToggleActive(coupon, value)}
                                    trackColor={{ false: colors.borderLight, true: colors.primary }}
                                    thumbColor={colors.white}
                                    disabled={updatingId === coupon.id}
                                />
                                <TouchableOpacity
                                    style={styles.deleteButton}
                                    onPress={() => handleDelete(coupon.id)}
                                    disabled={updatingId === coupon.id}
                                >
                                    <Ionicons name="trash-outline" size={20} color={colors.error} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>

            {Platform.OS === 'ios' && showDatePicker && (
                <Modal transparent animationType="slide" onRequestClose={() => setShowDatePicker(false)}>
                    <View style={styles.dateModalOverlay}>
                        <View style={styles.dateModalContent}>
                            <DateTimePicker
                                value={expiryDateValue || new Date()}
                                mode="date"
                                display="inline"
                                onChange={handleDateChange}
                                minimumDate={new Date()}
                            />
                            <TouchableOpacity style={styles.dateDoneButton} onPress={() => setShowDatePicker(false)}>
                                <Text style={styles.dateDoneText}>{t('common.done', 'Done')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            )}

            {Platform.OS === 'android' && showDatePicker && (
                <DateTimePicker
                    value={expiryDateValue || new Date()}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                    minimumDate={new Date()}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.white,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderLight,
    },
    backButton: {
        width: 40,
    },
    headerTitle: {
        flex: 1,
        fontSize: fontSize.xl,
        fontWeight: fontWeight.bold,
        color: colors.textPrimary,
        textAlign: 'center',
    },
    headerRight: {
        width: 40,
    },
    content: {
        padding: spacing.md,
        paddingBottom: spacing.xl,
    },
    formCard: {
        backgroundColor: colors.white,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.borderLight,
        marginBottom: spacing.lg,
        ...shadows.sm,
    },
    formTitle: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        color: colors.textPrimary,
        marginBottom: spacing.md,
    },
    inputGroup: {
        marginBottom: spacing.md,
    },
    label: {
        fontSize: fontSize.sm,
        color: colors.textSecondary,
        marginBottom: spacing.xs,
        fontWeight: fontWeight.medium,
    },
    input: {
        borderWidth: 1,
        borderColor: colors.borderLight,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        fontSize: fontSize.md,
        color: colors.textPrimary,
        backgroundColor: colors.background,
    },
    dateInput: {
        borderWidth: 1,
        borderColor: colors.borderLight,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        backgroundColor: colors.background,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    webDateInput: {
        borderWidth: 1,
        borderColor: colors.primary,
        borderRadius: borderRadius.lg,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        backgroundColor: colors.white,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    webDateField: {
        flex: 1,
        fontSize: fontSize.md,
        color: colors.textPrimary,
        backgroundColor: 'transparent',
        paddingVertical: 4,
    },
    dateText: {
        fontSize: fontSize.md,
        color: colors.textPrimary,
    },
    datePlaceholder: {
        fontSize: fontSize.md,
        color: colors.textLight,
    },
    typeRow: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    typeButton: {
        flex: 1,
        borderWidth: 1,
        borderColor: colors.borderLight,
        borderRadius: borderRadius.md,
        paddingVertical: spacing.sm,
        alignItems: 'center',
        backgroundColor: colors.background,
    },
    typeButtonActive: {
        borderColor: colors.primary,
        backgroundColor: 'rgba(230, 126, 34, 0.1)',
    },
    typeText: {
        fontSize: fontSize.sm,
        color: colors.textSecondary,
        fontWeight: fontWeight.medium,
    },
    typeTextActive: {
        color: colors.primary,
        fontWeight: fontWeight.bold,
    },
    switchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.md,
    },
    switchLabel: {
        fontSize: fontSize.sm,
        color: colors.textSecondary,
    },
    createButton: {
        backgroundColor: colors.primary,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
    },
    createButtonDisabled: {
        opacity: 0.7,
    },
    createButtonText: {
        color: colors.white,
        fontSize: fontSize.md,
        fontWeight: fontWeight.bold,
    },
    listHeader: {
        marginBottom: spacing.sm,
    },
    sectionTitle: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        color: colors.textPrimary,
    },
    couponCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.white,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: colors.borderLight,
        ...shadows.sm,
    },
    couponInfo: {
        flex: 1,
        marginRight: spacing.md,
    },
    couponCode: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.bold,
        color: colors.textPrimary,
    },
    couponMeta: {
        fontSize: fontSize.sm,
        color: colors.textSecondary,
        marginTop: 2,
    },
    couponActions: {
        alignItems: 'center',
        gap: spacing.sm,
    },
    deleteButton: {
        padding: spacing.xs,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: spacing.xl,
    },
    emptyText: {
        fontSize: fontSize.md,
        color: colors.textSecondary,
        marginTop: spacing.md,
    },
    dateModalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    dateModalContent: {
        backgroundColor: colors.white,
        padding: spacing.md,
        borderTopLeftRadius: borderRadius.lg,
        borderTopRightRadius: borderRadius.lg,
    },
    dateDoneButton: {
        alignSelf: 'flex-end',
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
    },
    dateDoneText: {
        color: colors.primary,
        fontSize: fontSize.md,
        fontWeight: fontWeight.bold,
    },
});
