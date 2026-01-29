// src/screens/OrderDetailScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { colors, spacing, fontSize, fontWeight, borderRadius, shadows } from '../theme';
import { getOrderById } from '../services/endpoints';
import type { Order } from '../types';
import type { RootStackParamList } from '../types';
import { useTranslation } from '../context';

type OrderDetailRouteProp = RouteProp<RootStackParamList, 'OrderDetail'>;

export default function OrderDetailScreen() {
    const navigation = useNavigation();
    const route = useRoute<OrderDetailRouteProp>();
    const { orderId } = route.params;
    const { t } = useTranslation();

    const [order, setOrder] = useState<Order | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchOrder = useCallback(async () => {
        try {
            const data = await getOrderById(orderId);
            setOrder(data);
        } catch (e) {
            console.error('Failed to load order', e);
        } finally {
            setIsLoading(false);
        }
    }, [orderId]);

    useEffect(() => {
        fetchOrder();
    }, [fetchOrder]);

    if (isLoading) {
        return <ActivityIndicator style={{ flex: 1 }} size="large" color={colors.primary} />;
    }

    if (!order) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
                <View style={styles.scrollContent}>
                    <Text style={styles.errorText}>{t('orders.not_found', 'Order not found.')}</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {t('orders.order', 'Order')} #{order.order_number}
                </Text>
                <View style={styles.headerRight} />
            </View>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('orders.status', 'Status')}</Text>
                    <Text style={styles.sectionValue}>{order.status}</Text>
                </View>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('orders.total', 'Total')}</Text>
                    <Text style={styles.sectionValue}>{order.total}</Text>
                </View>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('orders.created_at', 'Created At')}</Text>
                    <Text style={styles.sectionValue}>{new Date(order.created_at).toLocaleString()}</Text>
                </View>
                {/* Items list could be expanded here */}
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
    scrollView: { flex: 1 },
    scrollContent: { padding: spacing.md },
    section: { marginBottom: spacing.lg },
    sectionTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: colors.textPrimary },
    sectionValue: { fontSize: fontSize.md, color: colors.textSecondary, marginTop: spacing.sm },
    errorText: { fontSize: fontSize.lg, color: colors.error, textAlign: 'center', marginTop: spacing.lg },
});
