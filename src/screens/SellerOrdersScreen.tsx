import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, fontSize, fontWeight, borderRadius, shadows } from '../theme';
import { getSellerOrders, updateOrderStatus } from '../services/endpoints';
import { Loading } from '../components';
import { useTranslation } from '../context';

interface OrderItem {
    id: number;
    product: {
        id: number;
        name: string;
        base_price: string;
    };
    quantity: number;
    price: string;
}

interface Order {
    id: number;
    order_number: string;
    total: string;
    status: string;
    created_at: string;
    items: OrderItem[];
    user: {
        name: string;
    };
}

export default function SellerOrdersScreen() {
    const navigation = useNavigation();
    const { t } = useTranslation();
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);

    const fetchOrders = useCallback(async () => {
        try {
            const data = await getSellerOrders();
            setOrders(data);
        } catch (error) {
            console.error('Fetch seller orders error:', error);
            Alert.alert(t('common.error', 'Error'), t('orders.load_failed', 'Failed to load orders'));
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

    const handleStatusUpdate = async (orderId: number, newStatus: string) => {
        setUpdatingOrderId(orderId);
        try {
            await updateOrderStatus(orderId, newStatus);
            // Optimistic update or refresh
            setOrders(prev => prev.map(o =>
                o.id === orderId ? { ...o, status: newStatus } : o
            ));
            Alert.alert(t('common.success', 'Success'), t('orders.marked_as', 'Order marked as {{status}}').replace('{{status}}', newStatus));
        } catch (error) {
            console.error('Update status error:', error);
            Alert.alert(t('common.error', 'Error'), t('orders.update_status_failed', 'Failed to update order status'));
        } finally {
            setUpdatingOrderId(null);
        }
    };

    if (isLoading) {
        return <Loading message={t('orders.loading', 'Loading orders...')} />;
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('seller.manage_orders', 'Manage Orders')}</Text>
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
                {orders.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="clipboard-outline" size={64} color={colors.textLight} />
                        <Text style={styles.emptyText}>{t('orders.empty', 'No orders yet')}</Text>
                    </View>
                ) : (
                    orders.map((order) => (
                        <View key={order.id} style={styles.orderCard}>
                            <View style={styles.orderHeader}>
                                <View>
                                    <Text style={styles.orderNumber}>{order.order_number}</Text>
                                    <Text style={styles.orderDate}>{order.created_at}</Text>
                                    <Text style={styles.customerName}>
                                        {t('orders.customer', 'Customer')}: {order.user?.name || t('orders.customer_unknown', 'Unknown Customer')}
                                    </Text>
                                </View>
                                <View style={[
                                    styles.statusBadge,
                                    order.status === 'delivered' ? styles.statusSuccess :
                                        order.status === 'processing' || order.status === 'shipped' ? styles.statusInfo :
                                            order.status === 'cancelled' ? styles.statusError :
                                                styles.statusWarning
                                ]}>
                                    <Text style={[
                                        styles.statusText,
                                        order.status === 'delivered' ? styles.statusTextSuccess :
                                            order.status === 'processing' || order.status === 'shipped' ? styles.statusTextInfo :
                                                order.status === 'cancelled' ? styles.statusTextError :
                                                    styles.statusTextWarning
                                    ]}>{order.status}</Text>
                                </View>
                            </View>

                            <View style={styles.divider} />

                            <View style={styles.itemsList}>
                                {order.items?.map((item) => (
                                    <View key={item.id} style={styles.itemRow}>
                                        <Text style={styles.itemName}>
                                            {item.quantity}x {item.product?.name}
                                        </Text>
                                        <Text style={styles.itemPrice}>${item.price}</Text>
                                    </View>
                                ))}
                            </View>

                            <View style={styles.totalRow}>
                                <Text style={styles.totalLabel}>{t('orders.total', 'Total')}</Text>
                                <Text style={styles.totalValue}>${order.total}</Text>
                            </View>

                            {/* Actions */}
                            {order.status !== 'cancelled' && order.status !== 'delivered' && (
                                <View style={styles.actionsRow}>
                                    {order.status === 'pending' && (
                                        <TouchableOpacity
                                            style={[styles.actionBtn, styles.processBtn]}
                                            onPress={() => handleStatusUpdate(order.id, 'processing')}
                                            disabled={updatingOrderId === order.id}
                                        >
                                            <Text style={styles.actionBtnText}>{t('orders.process', 'Process')}</Text>
                                        </TouchableOpacity>
                                    )}

                                    {order.status === 'processing' && (
                                        <TouchableOpacity
                                            style={[styles.actionBtn, styles.completeBtn]}
                                            onPress={() => handleStatusUpdate(order.id, 'shipped')}
                                            disabled={updatingOrderId === order.id}
                                        >
                                            <Text style={styles.actionBtnText}>{t('orders.ship', 'Ship')}</Text>
                                        </TouchableOpacity>
                                    )}

                                    {order.status === 'shipped' && (
                                        <TouchableOpacity
                                            style={[styles.actionBtn, styles.completeBtn]}
                                            onPress={() => handleStatusUpdate(order.id, 'delivered')}
                                            disabled={updatingOrderId === order.id}
                                        >
                                            <Text style={styles.actionBtnText}>{t('orders.deliver', 'Deliver')}</Text>
                                        </TouchableOpacity>
                                    )}

                                    <TouchableOpacity
                                        style={[styles.actionBtn, styles.cancelBtn]}
                                        onPress={() => handleStatusUpdate(order.id, 'cancelled')}
                                        disabled={updatingOrderId === order.id}
                                    >
                                        <Text style={[styles.actionBtnText, { color: colors.error }]}>{t('common.cancel', 'Cancel')}</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                            {updatingOrderId === order.id && (
                                <ActivityIndicator style={{ marginTop: 10 }} color={colors.primary} />
                            )}
                        </View>
                    ))
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        backgroundColor: colors.white,
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
        paddingBottom: 40,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 60,
    },
    emptyText: {
        marginTop: spacing.md,
        fontSize: fontSize.lg,
        color: colors.textSecondary,
    },
    orderCard: {
        backgroundColor: colors.white,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.md,
        ...shadows.sm,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    orderNumber: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.bold,
        color: colors.textPrimary,
    },
    orderDate: {
        fontSize: fontSize.sm,
        color: colors.textLight,
        marginTop: 2,
    },
    customerName: {
        fontSize: fontSize.sm,
        color: colors.textSecondary,
        marginTop: 2,
        fontWeight: fontWeight.medium,
    },
    statusBadge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: borderRadius.sm,
    },
    statusSuccess: { backgroundColor: '#E8F5E9' },
    statusInfo: { backgroundColor: '#E3F2FD' },
    statusWarning: { backgroundColor: '#FFF3E0' },
    statusError: { backgroundColor: '#FCE4EC' },
    statusText: { fontSize: fontSize.xs, fontWeight: fontWeight.bold },
    statusTextSuccess: { color: '#2E7D32' },
    statusTextInfo: { color: '#1565C0' },
    statusTextWarning: { color: '#EF6C00' },
    statusTextError: { color: '#C2185B' },
    divider: {
        height: 1,
        backgroundColor: colors.borderLight,
        marginVertical: spacing.md,
    },
    itemsList: {
        marginBottom: spacing.md,
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    itemName: {
        fontSize: fontSize.md,
        color: colors.textPrimary,
        flex: 1,
    },
    itemPrice: {
        fontSize: fontSize.md,
        color: colors.textPrimary,
        fontWeight: fontWeight.bold,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: colors.borderLight,
        paddingTop: spacing.sm,
        marginBottom: spacing.md,
    },
    totalLabel: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        color: colors.textPrimary,
    },
    totalValue: {
        fontSize: fontSize.xl,
        fontWeight: fontWeight.bold,
        color: colors.primary,
    },
    actionsRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: spacing.sm,
    },
    actionBtn: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
        borderWidth: 1,
    },
    processBtn: {
        backgroundColor: '#E3F2FD',
        borderColor: '#1565C0',
    },
    completeBtn: {
        backgroundColor: '#E8F5E9',
        borderColor: '#2E7D32',
    },
    cancelBtn: {
        backgroundColor: '#FFF',
        borderColor: colors.error,
    },
    actionBtnText: {
        fontSize: fontSize.sm,
        fontWeight: fontWeight.bold,
        color: colors.textPrimary,
    },
});
