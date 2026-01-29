import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    RefreshControl,
    Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, fontSize, fontWeight, borderRadius, shadows } from '../theme';
import { useAuth } from '../context/AuthContext';
import { getSellerDashboard, getSellerProfile } from '../services/endpoints';
import { Loading } from '../components';
import type { Vendor } from '../types';
import { useTranslation } from '../context';

interface DashboardStats {
    total_revenue: string;
    total_orders: number;
    total_products: number;
    pending_orders: number;
    completed_orders: number;
}

interface RecentOrder {
    id: number;
    order_number: string;
    status: string;
    total?: string;
    total_amount?: string;
    created_at: string;
}

interface SalesPoint {
    date: string;
    total: number;
}

interface TopProduct {
    product_id: number;
    name: string;
    units_sold: number;
    revenue: number;
}

export default function SellerDashboardScreen() {
    const navigation = useNavigation();
    const { user } = useAuth();
    const { t } = useTranslation();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
    const [salesOverview, setSalesOverview] = useState<SalesPoint[]>([]);
    const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
    const [vendorProfile, setVendorProfile] = useState<Vendor | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchDashboardData = useCallback(async () => {
        try {
            const [dashboard, profile] = await Promise.all([
                getSellerDashboard(),
                getSellerProfile(),
            ]);

            // Backend returns { stats: {...}, recent_orders: [...] }
            if (dashboard) {
                setStats(dashboard.stats);
                setRecentOrders(dashboard.recent_orders || []);
                setSalesOverview(dashboard.sales_overview || []);
                setTopProducts(dashboard.top_products || []);
            }

            setVendorProfile(profile.vendor);

        } catch (error: any) {
            const errorMessage = error.message || t('seller.dashboard_load_failed', 'Failed to load dashboard data');
            setError(errorMessage);
            Alert.alert(t('common.error', 'Error'), errorMessage);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    const handleRefresh = () => {
        setIsRefreshing(true);
        fetchDashboardData();
    };

    if (isLoading) {
        return <Loading message={t('seller.dashboard_loading', 'Loading dashboard...')} />;
    }

    if (error && !isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Ionicons name="chevron-back" size={24} color={colors.white} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t('seller.dashboard', 'Seller Dashboard')}</Text>
                    <View style={styles.headerRight} />
                </View>
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={() => { setError(null); fetchDashboardData(); }}>
                        <Text style={styles.retryText}>{t('common.retry', 'Retry')}</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const maxSales = salesOverview.length > 0
        ? Math.max(...salesOverview.map((point) => point.total), 1)
        : 1;

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={24} color={colors.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('seller.dashboard', 'Seller Dashboard')}</Text>
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
                {/* Welcome Section */}
                <View style={styles.welcomeSection}>
                    <Text style={styles.welcomeText}>{t('seller.hello', 'Hello')}, {user?.name}</Text>
                    <Text style={styles.storeName}>{vendorProfile?.name || `${user?.name}'s ${t('seller.store', 'Store')}`}</Text>
                    {vendorProfile?.slug && (
                        <TouchableOpacity
                            style={styles.viewStoreButton}
                            onPress={() => navigation.navigate('VendorStore' as never, { slug: vendorProfile.slug } as never)}
                        >
                            <Text style={styles.viewStoreText}>{t('seller.view_store', 'View Store')}</Text>
                            <Ionicons name="arrow-forward" size={14} color={colors.primary} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    <View style={styles.statsCard}>
                        <View style={[styles.iconContainer, { backgroundColor: '#E3F2FD' }]}>
                            <Ionicons name="cash-outline" size={24} color="#1565C0" />
                        </View>
                        <Text style={styles.statsValue}>${stats?.total_revenue || '0.00'}</Text>
                        <Text style={styles.statsLabel}>{t('seller.total_revenue', 'Total Revenue')}</Text>
                    </View>

                    <View style={styles.statsCard}>
                        <View style={[styles.iconContainer, { backgroundColor: '#E8F5E9' }]}>
                            <Ionicons name="cart-outline" size={24} color="#2E7D32" />
                        </View>
                        <Text style={styles.statsValue}>{stats?.total_orders || 0}</Text>
                        <Text style={styles.statsLabel}>{t('orders.title', 'Orders')}</Text>
                    </View>

                    <View style={styles.statsCard}>
                        <View style={[styles.iconContainer, { backgroundColor: '#FFF3E0' }]}>
                            <Ionicons name="cube-outline" size={24} color="#EF6C00" />
                        </View>
                        <Text style={styles.statsValue}>{stats?.total_products || 0}</Text>
                        <Text style={styles.statsLabel}>{t('products.title', 'Products')}</Text>
                    </View>

                    <View style={styles.statsCard}>
                        <View style={[styles.iconContainer, { backgroundColor: '#FCE4EC' }]}>
                            <Ionicons name="time-outline" size={24} color="#C2185B" />
                        </View>
                        <Text style={styles.statsValue}>{stats?.pending_orders || 0}</Text>
                        <Text style={styles.statsLabel}>{t('orders.pending', 'Pending')}</Text>
                    </View>
                </View>

                {/* Quick Actions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('seller.quick_actions', 'Quick Actions')}</Text>
                    <View style={styles.actionRow}>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => navigation.navigate('AddProduct' as never)}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: colors.primary }]}>
                                <Ionicons name="add" size={24} color={colors.white} />
                            </View>
                            <Text style={styles.actionLabel}>{t('seller.add_product', 'Add Product')}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => navigation.navigate('SellerOrders' as never)}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: colors.secondary }]}>
                                <Ionicons name="list" size={24} color={colors.white} />
                            </View>
                            <Text style={styles.actionLabel}>{t('seller.manage_orders', 'Manage Orders')}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => navigation.navigate('SellerProducts' as never)}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: colors.info }]}>
                                <Ionicons name="cube" size={24} color={colors.white} />
                            </View>
                            <Text style={styles.actionLabel}>{t('products.title', 'Products')}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => navigation.navigate('SellerStoreProfile' as never)}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: colors.textSecondary }]}>
                                <Ionicons name="image" size={24} color={colors.white} />
                            </View>
                            <Text style={styles.actionLabel}>{t('seller.edit_store', 'Edit Store')}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => navigation.navigate('SellerCoupons' as never)}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: colors.success }]}>
                                <Ionicons name="pricetag" size={24} color={colors.white} />
                            </View>
                            <Text style={styles.actionLabel}>{t('seller.coupons', 'Coupons')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Sales Overview */}
                {salesOverview.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('seller.sales_last_7', 'Sales (Last 7 Days)')}</Text>
                        <View style={styles.chartContainer}>
                            {salesOverview.map((point) => (
                                <View key={point.date} style={styles.chartItem}>
                                    <View style={styles.chartBarContainer}>
                                        <View
                                            style={[
                                                styles.chartBar,
                                                { height: Math.max(6, (point.total / maxSales) * 80) },
                                            ]}
                                        />
                                    </View>
                                    <Text style={styles.chartLabel}>
                                        {new Date(point.date).getDate()}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Top Products */}
                {topProducts.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>{t('seller.top_products', 'Top Products')}</Text>
                            <TouchableOpacity onPress={() => navigation.navigate('SellerProducts' as never)}>
                                <Text style={styles.seeAllText}>{t('seller.manage', 'Manage')}</Text>
                            </TouchableOpacity>
                        </View>
                        {topProducts.map((product) => (
                            <View key={product.product_id} style={styles.topProductRow}>
                                <View style={styles.topProductInfo}>
                                    <Text style={styles.topProductName} numberOfLines={1}>{product.name}</Text>
                                    <Text style={styles.topProductMeta}>
                                        {t('seller.units_sold', '{{count}} sold').replace('{{count}}', String(product.units_sold))} - ${product.revenue.toFixed(2)}
                                    </Text>
                                </View>
                                <Ionicons name="trending-up" size={18} color={colors.primary} />
                            </View>
                        ))}
                    </View>
                )}

                {/* Recent Orders */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>{t('orders.recent', 'Recent Orders')}</Text>
                        <TouchableOpacity onPress={() => Alert.alert(t('orders.title', 'Orders'), t('common.coming_soon', 'See all coming soon'))}>
                            <Text style={styles.seeAllText}>{t('common.see_all', 'See All')}</Text>
                        </TouchableOpacity>
                    </View>

                    {recentOrders.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="receipt-outline" size={48} color={colors.textLight} />
                            <Text style={styles.emptyStateText}>{t('orders.empty_recent', 'No recent orders')}</Text>
                        </View>
                    ) : (
                        recentOrders.map((order) => (
                        <View key={order.id} style={styles.orderCard}>
                            <View style={styles.orderLeft}>
                                <Text style={styles.orderNumber}>{order.order_number || `#${order.id}`}</Text>
                                <Text style={styles.orderDate}>{order.created_at}</Text>
                            </View>
                            <View style={styles.orderRight}>
                                <Text style={styles.orderTotal}>
                                    ${Number(order.total ?? order.total_amount ?? 0).toFixed(2)}
                                </Text>
                                <View style={[
                                    styles.statusBadge,
                                    order.status === 'delivered' ? styles.statusSuccess :
                                        order.status === 'processing' || order.status === 'shipped' ? styles.statusInfo : styles.statusWarning
                                ]}>
                                    <Text style={[
                                        styles.statusText,
                                        order.status === 'delivered' ? styles.statusTextSuccess :
                                            order.status === 'processing' || order.status === 'shipped' ? styles.statusTextInfo : styles.statusTextWarning
                                    ]}>{order.status}</Text>
                                </View>
                            </View>
                        </View>
                    )))}
                </View>
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
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        backgroundColor: colors.primary,
    },
    backButton: {
        width: 40,
    },
    headerTitle: {
        fontSize: fontSize.xl,
        fontWeight: fontWeight.bold,
        color: colors.white,
    },
    headerRight: {
        width: 40,
    },
    content: {
        padding: spacing.md,
    },
    welcomeSection: {
        marginBottom: spacing.lg,
    },
    welcomeText: {
        fontSize: fontSize.lg,
        color: colors.textSecondary,
    },
    storeName: {
        fontSize: fontSize.xxl,
        fontWeight: fontWeight.bold,
        color: colors.textPrimary,
    },
    viewStoreButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        marginTop: spacing.sm,
    },
    viewStoreText: {
        fontSize: fontSize.sm,
        color: colors.primary,
        fontWeight: fontWeight.medium,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: spacing.xl,
    },
    statsCard: {
        width: '48%',
        backgroundColor: colors.white,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.md,
        ...shadows.sm,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.sm,
    },
    statsValue: {
        fontSize: fontSize.xl,
        fontWeight: fontWeight.bold,
        color: colors.textPrimary,
        marginBottom: 2,
    },
    statsLabel: {
        fontSize: fontSize.sm,
        color: colors.textSecondary,
    },
    section: {
        marginBottom: spacing.xl,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    sectionTitle: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        color: colors.textPrimary,
        marginBottom: spacing.md,
    },
    seeAllText: {
        fontSize: fontSize.sm,
        color: colors.primary,
        fontWeight: fontWeight.medium,
    },
    actionRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        rowGap: spacing.md,
    },
    actionButton: {
        alignItems: 'center',
        width: '30%',
    },
    actionIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.xs,
        ...shadows.sm,
    },
    actionLabel: {
        fontSize: fontSize.xs,
        color: colors.textPrimary,
        fontWeight: fontWeight.medium,
        textAlign: 'center',
    },
    chartContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.md,
        backgroundColor: colors.white,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.borderLight,
    },
    chartItem: {
        alignItems: 'center',
        flex: 1,
    },
    chartBarContainer: {
        width: 10,
        height: 90,
        justifyContent: 'flex-end',
        backgroundColor: colors.background,
        borderRadius: borderRadius.sm,
        overflow: 'hidden',
    },
    chartBar: {
        width: '100%',
        backgroundColor: colors.primary,
        borderRadius: borderRadius.sm,
    },
    chartLabel: {
        marginTop: spacing.xs,
        fontSize: fontSize.xs,
        color: colors.textSecondary,
    },
    topProductRow: {
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
    topProductInfo: {
        flex: 1,
        marginRight: spacing.md,
    },
    topProductName: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.semibold,
        color: colors.textPrimary,
    },
    topProductMeta: {
        fontSize: fontSize.sm,
        color: colors.textSecondary,
        marginTop: 2,
    },
    orderCard: {
        backgroundColor: colors.white,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.sm,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        ...shadows.sm,
    },
    orderLeft: {
        flex: 1,
    },
    orderRight: {
        alignItems: 'flex-end',
    },
    orderNumber: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.bold,
        color: colors.textPrimary,
        marginBottom: 2,
    },
    orderDate: {
        fontSize: fontSize.sm,
        color: colors.textLight,
    },
    orderTotal: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.bold,
        color: colors.primary,
        marginBottom: 4,
    },
    statusBadge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: borderRadius.sm,
    },
    statusSuccess: { backgroundColor: '#E8F5E9' },
    statusInfo: { backgroundColor: '#E3F2FD' },
    statusWarning: { backgroundColor: '#FFF3E0' },
    statusText: { fontSize: fontSize.xs, fontWeight: fontWeight.bold },
    statusTextSuccess: { color: '#2E7D32' },
    statusTextInfo: { color: '#1565C0' },
    statusTextWarning: { color: '#EF6C00' },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.lg,
    },
    errorText: {
        fontSize: fontSize.lg,
        color: colors.textSecondary,
        textAlign: 'center',
        marginVertical: spacing.md,
    },
    retryButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
    },
    retryText: {
        color: colors.white,
        fontSize: fontSize.md,
        fontWeight: fontWeight.medium,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: spacing.xl,
    },
    emptyStateText: {
        fontSize: fontSize.md,
        color: colors.textLight,
        marginTop: spacing.sm,
    },
});
