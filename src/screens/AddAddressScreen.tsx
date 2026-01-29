import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, TextInput, ScrollView, Alert, Switch, StatusBar, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../theme';
import { createAddress } from '../services/endpoints';
import { Loading } from '../components';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context';

interface CreateAddressPayload {
    label: string;
    full_name: string;
    phone: string;
    address_line_1: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    is_default: boolean;
}

export default function AddAddressScreen() {
    const navigation = useNavigation();
    const { user } = useAuth();
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);

    // Form state
    const [label, setLabel] = useState('Home'); // Default label
    const [fullAddress, setFullAddress] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [country, setCountry] = useState('');
    const [zipCode, setZipCode] = useState('');
    const [phone, setPhone] = useState('');
    const [isDefault, setIsDefault] = useState(false);

    const validate = () => {
        if (!fullAddress || !city || !state || !country || !zipCode || !phone) {
            const msg = t('address.fill_all', 'Please fill in all fields');
            if (Platform.OS === 'web') {
                window.alert(msg);
            } else {
                Alert.alert(t('common.error', 'Error'), msg);
            }
            return false;
        }
        return true;
    };

    const handleSave = async () => {
        console.log('Save button pressed');
        if (!validate()) {
            console.log('Validation failed');
            return;
        }

        setIsLoading(true);
        try {
            if (!user) {
                Alert.alert(t('common.error', 'Error'), t('auth.user_not_authenticated', 'User not authenticated'));
                return;
            }
            console.log('Saving address:', { label, fullAddress, city, state, country, zipCode, phone, isDefault });
            const payload: CreateAddressPayload = {
                label,
                full_name: user.name || '',
                phone,
                address_line_1: fullAddress,
                city,
                state,
                postal_code: zipCode,
                country,
                is_default: isDefault,
            };
            const result = await createAddress(payload);
            console.log('Address save result:', result);

            const successMsg = t('address.added', 'Address added successfully');
            if (Platform.OS === 'web') {
                window.alert(successMsg);
                navigation.goBack();
            } else {
                Alert.alert(t('common.success', 'Success'), successMsg, [
                    { text: t('common.ok', 'OK'), onPress: () => navigation.goBack() }
                ]);
            }
        } catch (error: any) {
            console.error('Add address error:', error);
            console.error('Error response:', error.response?.data);
            console.error('Error status:', error.response?.status);
            const msg = error.response?.data?.message || error.message || t('address.save_failed', 'Failed to save address');

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
            <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('address.add_new', 'Add New Address')}</Text>
                <View style={styles.headerRight} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* Label Selection */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>{t('address.label', 'Label')}</Text>
                    <View style={styles.labelRow}>
                        {[
                            { value: 'Home', label: t('address.label_home', 'Home') },
                            { value: 'Work', label: t('address.label_work', 'Work') },
                            { value: 'Other', label: t('address.label_other', 'Other') },
                        ].map((item) => (
                            <TouchableOpacity
                                key={item.value}
                                style={[styles.labelChip, label === item.value && styles.labelChipSelected]}
                                onPress={() => setLabel(item.value)}
                            >
                                <Text style={[styles.labelChipText, label === item.value && styles.labelChipTextSelected]}>
                                    {item.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Form Fields */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>{t('address.street', 'Street Address')}</Text>
                    <TextInput
                        style={styles.input}
                        value={fullAddress}
                        onChangeText={setFullAddress}
                        placeholder={t('address.street_placeholder', '123 Main St, Apt 4B')}
                        placeholderTextColor={colors.textLight}
                    />
                </View>

                <View style={styles.row}>
                    <View style={[styles.inputGroup, { flex: 1, marginRight: spacing.sm }]}>
                        <Text style={styles.label}>{t('address.city', 'City')}</Text>
                        <TextInput
                            style={styles.input}
                            value={city}
                            onChangeText={setCity}
                            placeholder={t('address.city_placeholder', 'New York')}
                            placeholderTextColor={colors.textLight}
                        />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1, marginLeft: spacing.sm }]}>
                        <Text style={styles.label}>{t('address.state', 'State')}</Text>
                        <TextInput
                            style={styles.input}
                            value={state}
                            onChangeText={setState}
                            placeholder={t('address.state_placeholder', 'NY')}
                            placeholderTextColor={colors.textLight}
                        />
                    </View>
                </View>

                <View style={styles.row}>
                    <View style={[styles.inputGroup, { flex: 1, marginRight: spacing.sm }]}>
                        <Text style={styles.label}>{t('address.zip', 'Zip Code')}</Text>
                        <TextInput
                            style={styles.input}
                            value={zipCode}
                            onChangeText={setZipCode}
                            placeholder={t('address.zip_placeholder', '10001')}
                            keyboardType="number-pad"
                            placeholderTextColor={colors.textLight}
                        />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1, marginLeft: spacing.sm }]}>
                        <Text style={styles.label}>{t('address.country', 'Country')}</Text>
                        <TextInput
                            style={styles.input}
                            value={country}
                            onChangeText={setCountry}
                            placeholder={t('address.country_placeholder', 'United States')}
                            placeholderTextColor={colors.textLight}
                        />
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>{t('address.phone', 'Phone Number')}</Text>
                    <TextInput
                        style={styles.input}
                        value={phone}
                        onChangeText={setPhone}
                        placeholder={t('address.phone_placeholder', '+1 234 567 8900')}
                        keyboardType="phone-pad"
                        placeholderTextColor={colors.textLight}
                    />
                </View>

                {/* Default Switch */}
                <View style={styles.switchRow}>
                    <Text style={styles.switchLabel}>{t('address.set_default', 'Set as default address')}</Text>
                    <Switch
                        value={isDefault}
                        onValueChange={setIsDefault}
                        trackColor={{ false: colors.borderLight, true: colors.primary }}
                        thumbColor={colors.white}
                    />
                </View>

                {/* Save Button */}
                <TouchableOpacity
                    style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
                    onPress={handleSave}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <Loading fullScreen={false} />
                    ) : (
                        <Text style={styles.saveButtonText}>{t('address.save', 'Save Address')}</Text>
                    )}
                </TouchableOpacity>

            </ScrollView>
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
    },
    inputGroup: {
        marginBottom: spacing.lg,
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
        paddingVertical: spacing.sm, // increased from standard input
        fontSize: fontSize.md,
        color: colors.textPrimary,
        backgroundColor: colors.background,
        height: 48,
    },
    row: {
        flexDirection: 'row',
    },
    labelRow: {
        flexDirection: 'row',
    },
    labelChip: {
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.full,
        borderWidth: 1,
        borderColor: colors.borderLight,
        marginRight: spacing.sm,
    },
    labelChipSelected: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    labelChipText: {
        fontSize: fontSize.sm,
        color: colors.textSecondary,
    },
    labelChipTextSelected: {
        color: colors.white,
        fontWeight: fontWeight.bold,
    },
    switchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.xl,
        marginTop: spacing.sm,
    },
    switchLabel: {
        fontSize: fontSize.md,
        color: colors.textPrimary,
    },
    saveButton: {
        backgroundColor: colors.primary,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
        justifyContent: 'center',
        height: 50,
    },
    saveButtonDisabled: {
        opacity: 0.7,
    },
    saveButtonText: {
        color: colors.white,
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
    },
});
