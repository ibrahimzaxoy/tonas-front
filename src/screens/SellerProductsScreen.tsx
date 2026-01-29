import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, fontSize, fontWeight, borderRadius, shadows } from '../theme';
import { deleteSellerProduct, getSellerDashboard, getSellerProducts } from '../services/endpoints';
import { Loading } from '../components';
import type { Product } from '../types';
import { useTranslation } from '../context';
import { getLocalizedField } from '../i18n/locale';

export default function SellerProductsScreen() {
    const navigation = useNavigation();
    const { t } = useTranslation();
    const [products, setProducts] = useState<Product[]>([]);
    const [salesByProduct, setSalesByProduct] = useState<Record<number, { unitsSold: number; revenue: number }>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const fetchProducts = useCallback(async () => {
        try {
            const data = await getSellerProducts();
            setProducts(data);

            try {
                const dashboard = await getSellerDashboard();
                const revenueItems = Array.isArray(dashboard?.product_revenue) ? dashboard.product_revenue : [];
                const nextSales: Record<number, { unitsSold: number; revenue: number }> = {};
                revenueItems.forEach((item: any) => {
                    const productId = Number(item?.product_id);
                    if (!Number.isFinite(productId) || productId <= 0) return;
                    nextSales[productId] = {
                        unitsSold: Number(item?.units_sold) || 0,
                        revenue: Number(item?.revenue) || 0,
                    };
                });
                setSalesByProduct(nextSales);
            } catch (error) {
                console.error('Failed to load product revenue:', error);
                setSalesByProduct({});
            }
        } catch (error) {
            console.error('Failed to load products:', error);
            Alert.alert(t('common.error', 'Error'), t('seller.products_load_failed', 'Failed to load products'));
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const handleRefresh = () => {
        setIsRefreshing(true);
        fetchProducts();
    };

    const handleDelete = (productId: number) => {
        Alert.alert(
            t('seller.delete_product', 'Delete Product'),
            t('seller.delete_product_confirm', 'Are you sure you want to delete this product?'),
            [
                { text: t('common.cancel', 'Cancel'), style: 'cancel' },
                {
                    text: t('common.delete', 'Delete'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setDeletingId(productId);
                            await deleteSellerProduct(productId);
                            setProducts((prev) => prev.filter((item) => item.id !== productId));
                        } catch (error) {
                            console.error('Delete product error:', error);
                            Alert.alert(t('common.error', 'Error'), t('seller.delete_product_failed', 'Failed to delete product'));
                        } finally {
                            setDeletingId(null);
                        }
                    },
                },
            ]
        );
    };

    if (isLoading) {
        return <Loading message={t('products.loading', 'Loading products...')} />;
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('seller.my_products', 'My Products')}</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => navigation.navigate('AddProduct' as never)}
                >
                    <Ionicons name="add" size={22} color={colors.white} />
                </TouchableOpacity>
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
                {products.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="cube-outline" size={64} color={colors.textLight} />
                        <Text style={styles.emptyTitle}>{t('seller.no_products', 'No products yet')}</Text>
                        <Text style={styles.emptyText}>{t('seller.add_first_product', 'Add your first product to start selling.')}</Text>
                    </View>
                ) : (
                    products.map((product) => (
                        <View key={product.id} style={styles.productCard}>
                            <View style={styles.productImage}>
                                {product.thumbnail ? (
                                    <Image
                                        source={{ uri: product.thumbnail }}
                                        style={styles.productImageContent}
                                        resizeMode="cover"
                                    />
                                ) : (
                                    <Ionicons name="image-outline" size={28} color={colors.textLight} />
                                )}
                            </View>
                            <View style={styles.productInfo}>
                                <Text style={styles.productName} numberOfLines={1}>
                                    {getLocalizedField(product as any, 'name', product.name)}
                                </Text>
                                <Text style={styles.productPrice}>
                                    ${Number.parseFloat(product.price || '0').toFixed(2)}
                                </Text>
                                {salesByProduct[product.id] && (
                                    <Text style={styles.productSales}>
                                        {t('seller.sold', 'Sold')}: {salesByProduct[product.id].unitsSold}, {t('seller.revenue', 'Revenue')}: ${salesByProduct[product.id].revenue.toFixed(2)}
                                    </Text>
                                )}
                                {product.status && (
                                    <Text style={styles.productStatus}>{product.status}</Text>
                                )}
                            </View>
                            <View style={styles.actions}>
                                <TouchableOpacity
                                    style={styles.editButton}
                                    onPress={() => navigation.navigate('AddProduct' as never, { productId: product.id } as never)}
                                    disabled={deletingId === product.id}
                                >
                                    <Ionicons name="pencil-outline" size={20} color={colors.primary} />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.deleteButton}
                                    onPress={() => handleDelete(product.id)}
                                    disabled={deletingId === product.id}
                                >
                                    <Ionicons name="trash-outline" size={20} color={colors.error} />
                                </TouchableOpacity>
                            </View>
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
        backgroundColor: colors.white,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
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
    addButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        padding: spacing.md,
        paddingBottom: spacing.xl,
    },
    productCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.white,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: colors.borderLight,
        ...shadows.sm,
    },
    productImage: {
        width: 56,
        height: 56,
        borderRadius: borderRadius.md,
        backgroundColor: colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        marginRight: spacing.md,
    },
    productImageContent: {
        width: '100%',
        height: '100%',
    },
    productInfo: {
        flex: 1,
    },
    productName: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.semibold,
        color: colors.textPrimary,
    },
    productPrice: {
        fontSize: fontSize.sm,
        color: colors.textSecondary,
        marginTop: 2,
    },
    productStatus: {
        fontSize: fontSize.xs,
        color: colors.textLight,
        marginTop: 2,
    },
    productSales: {
        fontSize: fontSize.xs,
        color: colors.textSecondary,
        marginTop: 2,
    },
    deleteButton: {
        padding: spacing.xs,
    },
    editButton: {
        padding: spacing.xs,
    },
    actions: {
        alignItems: 'center',
        gap: spacing.xs,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: spacing.xl,
    },
    emptyTitle: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        color: colors.textPrimary,
        marginTop: spacing.md,
    },
    emptyText: {
        fontSize: fontSize.sm,
        color: colors.textSecondary,
        marginTop: spacing.sm,
        textAlign: 'center',
    },
});
