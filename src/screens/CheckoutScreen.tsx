// src/screens/CheckoutScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../theme';
import { getAddresses, createOrder } from '../services/endpoints';
import { useAuth } from '../context/AuthContext';
import type { Address, Order } from '../types';
import { useTranslation } from '../context';

export default function CheckoutScreen() {
    const navigation = useNavigation();
    const { user } = useAuth();
    const { t } = useTranslation();
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isPlacing, setIsPlacing] = useState(false);

    useEffect(() => {
        const fetch = async () => {
            try {
                const data = await getAddresses();
                setAddresses(data);
                if (data.length > 0) setSelectedAddressId(data[0].id);
            } catch (e) {
                console.error('Failed to load addresses', e);
                Alert.alert(t('common.error', 'Error'), t('address.load_failed', 'Could not load addresses'));
            } finally {
                setIsLoading(false);
            }
        };
        fetch();
    }, []);

    // Refresh addresses when screen comes into focus
    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', async () => {
            try {
                const data = await getAddresses();
                setAddresses(data);
                // If no selection and addresses exist, select first
                if (data.length > 0 && !selectedAddressId) {
                    setSelectedAddressId(data[0].id);
                }
            } catch (e) {
                console.log('Error refreshing addresses', e);
            }
        });
        return unsubscribe;
    }, [navigation, selectedAddressId]);

    const handlePlaceOrder = async () => {
        if (!selectedAddressId) {
            Alert.alert(t('address.select_title', 'Select address'), t('address.select_prompt', 'Please select a delivery address'));
            return;
        }
        setIsPlacing(true);
        try {
            const orders = await createOrder(selectedAddressId, 'cod');
            // Assuming API returns array of orders, take the last one
            const order = orders[orders.length - 1];
            navigation.navigate('OrderSuccess' as never, { orderId: order.id });
        } catch (e: any) {
            console.error('Order error', e);
            Alert.alert(t('common.error', 'Error'), e.message || t('checkout.place_order_failed', 'Failed to place order'));
        } finally {
            setIsPlacing(false);
        }
    };

    if (isLoading) {
        return <ActivityIndicator style={{ flex: 1 }} size="large" color={colors.primary} />;
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('checkout.title', 'Checkout')}</Text>
                <View style={styles.headerRight} />
            </View>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.sectionTitle}>{t('address.select_delivery', 'Select Delivery Address')}</Text>
                {addresses.map((addr) => (
                    <TouchableOpacity
                        key={addr.id}
                        style={[styles.addressItem, selectedAddressId === addr.id && styles.addressItemSelected]}
                        onPress={() => setSelectedAddressId(addr.id)}
                    >
                        <Text style={styles.addressLabel}>{addr.label}</Text>
                        <Text style={styles.addressDetails}>{addr.full_address}</Text>
                    </TouchableOpacity>
                ))}

                <TouchableOpacity
                    style={styles.addAddressButton}
                    onPress={() => navigation.navigate('AddAddress' as never)}
                >
                    <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
                    <Text style={styles.addAddressText}>{t('address.add_new', 'Add New Address')}</Text>
                </TouchableOpacity>
                <Text style={styles.sectionTitle}>{t('checkout.payment_method', 'Payment Method')}</Text>
                <View style={styles.paymentPlaceholder}>
                    <Text style={styles.paymentText}>{t('checkout.payment_cod', 'Cash on Delivery (COD) - Coming soon')}</Text>
                </View>
                <TouchableOpacity style={styles.placeOrderButton} onPress={handlePlaceOrder} disabled={isPlacing}>
                    <Text style={styles.placeOrderButtonText}>
                        {isPlacing ? t('checkout.placing', 'Placing...') : t('checkout.place_order', 'Place Order')}
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.white },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
    backButton: { width: 40 },
    headerTitle: { flex: 1, fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.textPrimary, textAlign: 'center' },
    headerRight: { width: 40 },
    content: { padding: spacing.md },
    sectionTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: colors.textPrimary, marginBottom: spacing.sm },
    addressItem: { padding: spacing.sm, borderWidth: 1, borderColor: colors.borderLight, borderRadius: borderRadius.md, marginBottom: spacing.sm },
    addressItemSelected: { borderColor: colors.primary },
    addressLabel: { fontSize: fontSize.md, fontWeight: fontWeight.medium, color: colors.textPrimary },
    addressDetails: { fontSize: fontSize.sm, color: colors.textSecondary },
    paymentPlaceholder: { padding: spacing.sm, borderWidth: 1, borderColor: colors.borderLight, borderRadius: borderRadius.md, marginBottom: spacing.lg },
    paymentText: { fontSize: fontSize.sm, color: colors.textSecondary },
    placeOrderButton: { backgroundColor: colors.primary, paddingVertical: spacing.md, borderRadius: borderRadius.lg, alignItems: 'center' },
    placeOrderButtonText: { color: colors.white, fontSize: fontSize.lg, fontWeight: fontWeight.bold },
    addAddressButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        backgroundColor: colors.background,
        borderRadius: borderRadius.md,
        marginBottom: spacing.lg,
        borderWidth: 1,
        borderColor: colors.primary,
        borderStyle: 'dashed',
    },
    addAddressText: {
        marginLeft: spacing.sm,
        fontSize: fontSize.md,
        color: colors.primary,
        fontWeight: fontWeight.medium,
    },
});
