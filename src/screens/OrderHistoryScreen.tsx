// src/screens/OrderHistoryScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, TouchableOpacity, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, fontSize, fontWeight, borderRadius, shadows } from '../theme';
import { getOrders } from '../services/endpoints';
import type { Order } from '../types';
import { useTranslation } from '../context';

export default function OrderHistoryScreen() {
    const navigation = useNavigation();
    const { t } = useTranslation();
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchOrders = useCallback(async () => {
        try {
            const data = await getOrders();
            setOrders(data);
        } catch (e) {
            console.error('Failed to load orders', e);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const handleRefresh = () => {
        setIsRefreshing(true);
        fetchOrders();
    };

    const handlePressOrder = (orderId: number) => {
        navigation.navigate('OrderDetail' as never, { orderId });
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
                <Text style={styles.headerTitle}>{t('orders.history', 'Order History')}</Text>
                <View style={styles.headerRight} />
            </View>
            <ScrollView
                style={styles.scrollView}
                refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
                contentContainerStyle={styles.scrollContent}
            >
                {orders.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>{t('orders.empty', 'No orders found.')}</Text>
                    </View>
                ) : (
                    orders.map((order) => (
                        <TouchableOpacity key={order.id} style={styles.orderItem} onPress={() => handlePressOrder(order.id)}>
                            <View style={styles.orderInfo}>
                                <Text style={styles.orderNumber}>#{order.order_number}</Text>
                                <Text style={styles.orderStatus}>{order.status}</Text>
                            </View>
                            <Text style={styles.orderDate}>{new Date(order.created_at).toLocaleDateString()}</Text>
                        </TouchableOpacity>
                    ))
                )}
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
    orderItem: { backgroundColor: colors.white, padding: spacing.md, marginBottom: spacing.sm, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm },
    orderInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
    orderNumber: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: colors.textPrimary },
    orderStatus: { fontSize: fontSize.md, color: colors.textSecondary },
    orderDate: { fontSize: fontSize.sm, color: colors.textSecondary },
    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
    emptyText: { fontSize: fontSize.lg, color: colors.textSecondary },
});
