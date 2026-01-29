import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    Image,
    RefreshControl,
    Alert,
    TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, fontSize, fontWeight, borderRadius, shadows } from '../theme';
import { Loading } from '../components';
import { getCart, updateCartItem, removeFromCart, applyCoupon } from '../services/endpoints';
import { getAuthToken } from '../services/api';
import type { Cart, CartItem } from '../types';
import { useCart } from '../context';
import { useTranslation } from '../context';
import { getLocalizedField } from '../i18n/locale';

export default function CartScreen() {
    const navigation = useNavigation();
    const { syncCart } = useCart();
    const { t } = useTranslation();
    const [cart, setCart] = useState<Cart | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [updatingItemId, setUpdatingItemId] = useState<number | null>(null);
    const [couponCode, setCouponCode] = useState('');
    const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

    const calculateCartTotals = (items: CartItem[]) => {
        const itemsCount = items.reduce((total, item) => total + item.quantity, 0);
        const subtotalValue = items.reduce((total, item) => {
            const unitPrice = Number.parseFloat(item.unit_price);
            const safeUnitPrice = Number.isFinite(unitPrice) ? unitPrice : 0;
            return total + safeUnitPrice * item.quantity;
        }, 0);
        const subtotal = subtotalValue.toFixed(2);

        return {
            items_count: itemsCount,
            subtotal,
            total: subtotal,
        };
    };

    const updateCartState = (updater: (items: CartItem[]) => CartItem[]) => {
        setCart((prev) => {
            if (!prev) return prev;
            const items = updater(prev.items);
            const totals = calculateCartTotals(items);
            const nextCart = {
                ...prev,
                items,
                ...totals,
            };
            syncCart(nextCart);
            return nextCart;
        });
    };

    const checkAuth = async () => {
        const token = await getAuthToken();
        setIsAuthenticated(!!token);
        return !!token;
    };

    const fetchCart = useCallback(async () => {
        const hasAuth = await checkAuth();
        if (!hasAuth) {
            setIsLoading(false);
            setIsRefreshing(false);
            return;
        }

        try {
            const data = await getCart();
            setCart(data);
            syncCart(data);
        } catch (err: any) {
            console.error('Failed to fetch cart:', err);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchCart();
    }, [fetchCart]);

    const handleRefresh = () => {
        setIsRefreshing(true);
        fetchCart();
    };

    const handleUpdateQuantity = async (itemId: number, currentQuantity: number, change: number) => {
        const newQuantity = currentQuantity + change;
        if (newQuantity < 1) {
            handleRemoveItem(itemId);
            return;
        }

        updateCartState((items) =>
            items.map((item) => {
                if (item.id !== itemId) return item;
                const unitPrice = Number.parseFloat(item.unit_price);
                const safeUnitPrice = Number.isFinite(unitPrice) ? unitPrice : 0;
                return {
                    ...item,
                    quantity: newQuantity,
                    subtotal: (safeUnitPrice * newQuantity).toFixed(2),
                };
            })
        );

        try {
            setUpdatingItemId(itemId);
            const updatedCart = await updateCartItem(itemId, newQuantity);
            setCart(updatedCart);
            syncCart(updatedCart);
        } catch (err: any) {
            fetchCart();
            Alert.alert(t('common.error', 'Error'), err.message || t('cart.update_failed', 'Failed to update quantity'));
        } finally {
            setUpdatingItemId(null);
        }
    };

    const handleRemoveItem = async (itemId: number) => {
        updateCartState((items) => items.filter((item) => item.id !== itemId));

        try {
            setUpdatingItemId(itemId);
            const updatedCart = await removeFromCart(itemId);
            setCart(updatedCart);
            syncCart(updatedCart);
        } catch (err: any) {
            fetchCart();
            Alert.alert(t('common.error', 'Error'), err.message || t('cart.remove_failed', 'Failed to remove item'));
        } finally {
            setUpdatingItemId(null);
        }
    };

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) {
            Alert.alert(t('common.error', 'Error'), t('coupon.enter_code', 'Please enter a coupon code'));
            return;
        }

        setIsApplyingCoupon(true);
        try {
            const updatedCart = await applyCoupon(couponCode);
            setCart(updatedCart);
            syncCart(updatedCart);
            Alert.alert(t('common.success', 'Success'), t('coupon.applied', 'Coupon applied successfully!'));
            setCouponCode('');
        } catch (err: any) {
            const message = err.response?.data?.message || err.message || 'Failed to apply coupon';
            Alert.alert(t('common.error', 'Error'), message);
        } finally {
            setIsApplyingCoupon(false);
        }
    };

    const handleCheckout = () => {
        if (!cart || cart.items.length === 0) {
            Alert.alert(t('cart.empty_title', 'Empty Cart'), t('cart.empty_prompt', 'Please add items to your cart first'));
            return;
        }
        navigation.navigate('Checkout' as never);
    };

    if (isLoading) {
        return <Loading message={t('cart.loading', 'Loading cart...')} />;
    }

    if (!isAuthenticated) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('cart.title', 'Cart')}</Text>
                <View style={styles.headerRight} />
            </View>
            <View style={styles.authPrompt}>
                <Ionicons name="cart-outline" size={80} color={colors.textLight} />
                <Text style={styles.authTitle}>{t('cart.sign_in_title', 'Sign in to view your cart')}</Text>
                <Text style={styles.authText}>{t('cart.sign_in_subtitle', 'Your cart items will be saved and synced across devices')}</Text>
                <TouchableOpacity
                    style={styles.signInButton}
                    onPress={() => navigation.navigate('Login' as never)}
                >
                    <Text style={styles.signInButtonText}>{t('auth.sign_in', 'Sign In')}</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
    }

    const items = cart?.items || [];
    const subtotal = cart?.subtotal || '0.00';
    const total = cart?.total || '0.00';

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('cart.title', 'Cart')}</Text>
                <TouchableOpacity style={styles.cartButton}>
                    <Ionicons name="cart-outline" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
            </View>

            {items.length === 0 ? (
                <View style={styles.emptyCart}>
                    <Ionicons name="cart-outline" size={80} color={colors.textLight} />
                    <Text style={styles.emptyCartTitle}>{t('cart.empty_title', 'Your cart is empty')}</Text>
                    <Text style={styles.emptyCartText}>{t('cart.empty_subtitle', 'Start shopping to add items to your cart')}</Text>
                    <TouchableOpacity
                        style={styles.shopButton}
                        onPress={() => navigation.navigate('Home' as never)}
                    >
                        <Text style={styles.shopButtonText}>{t('cart.start_shopping', 'Start Shopping')}</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <>
                    <ScrollView
                        style={styles.scrollView}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                        refreshControl={
                            <RefreshControl
                                refreshing={isRefreshing}
                                onRefresh={handleRefresh}
                                colors={[colors.primary]}
                                tintColor={colors.primary}
                            />
                        }
                    >
                        {items.map((item) => (
                            <View key={item.id} style={styles.cartItem}>
                                {/* Product Image */}
                                <View style={styles.itemImage}>
                                    {item.product.thumbnail ? (
                                        <Image
                                            source={{ uri: item.product.thumbnail }}
                                            style={styles.itemImageContent}
                                            resizeMode="cover"
                                        />
                                    ) : (
                                        <Ionicons name="image-outline" size={32} color={colors.textLight} />
                                    )}
                                </View>

                                {/* Product Info */}
                                <View style={styles.itemInfo}>
                                    <Text style={styles.itemName} numberOfLines={2}>
                                        {getLocalizedField(item.product as any, 'name', item.product.name)}
                                    </Text>
                                    <Text style={styles.itemVariant}>
                                        {item.variant ? item.variant.name : t('cart.variant_standard', 'Standard')}
                                    </Text>

                                    {/* Quantity Controls */}
                                    <View style={styles.quantityContainer}>
                                        <TouchableOpacity
                                            style={styles.quantityButton}
                                            onPress={() => handleUpdateQuantity(item.id, item.quantity, -1)}
                                            disabled={updatingItemId === item.id}
                                        >
                                            <Ionicons name="remove" size={16} color={colors.textPrimary} />
                                        </TouchableOpacity>
                                        <Text style={styles.quantityText}>{item.quantity}</Text>
                                        <TouchableOpacity
                                            style={[styles.quantityButton, styles.quantityButtonActive]}
                                            onPress={() => handleUpdateQuantity(item.id, item.quantity, 1)}
                                            disabled={updatingItemId === item.id}
                                        >
                                            <Ionicons name="add" size={16} color={colors.white} />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* Price & Remove */}
                                <View style={styles.itemRight}>
                                    <TouchableOpacity
                                        style={styles.removeButton}
                                        onPress={() => handleRemoveItem(item.id)}
                                        disabled={updatingItemId === item.id}
                                    >
                                        <Ionicons name="close" size={20} color={colors.textSecondary} />
                                    </TouchableOpacity>
                                    <Text style={styles.itemPrice}>${parseFloat(item.subtotal).toFixed(2)}</Text>
                                </View>
                            </View>
                        ))}
                    </ScrollView>

                    {/* Bottom Section */}
                    <View style={styles.bottomSection}>
                        {/* Coupon Section */}
                        <View style={styles.couponContainer}>
                            <Ionicons name="pricetag-outline" size={20} color={colors.textSecondary} style={styles.couponIcon} />
                            <TextInput
                                style={styles.couponInput}
                                placeholder={t('coupon.placeholder', 'Enter coupon code')}
                                placeholderTextColor={colors.textLight}
                                value={couponCode}
                                onChangeText={setCouponCode}
                                autoCapitalize="characters"
                            />
                            <TouchableOpacity
                                style={[styles.applyButton, isApplyingCoupon && styles.applyButtonDisabled]}
                                onPress={handleApplyCoupon}
                                disabled={isApplyingCoupon || !couponCode.trim()}
                            >
                                <Text style={styles.applyButtonText}>{t('common.apply', 'Apply')}</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Subtotal */}
                        <View style={styles.subtotalRow}>
                            <Text style={styles.subtotalLabel}>{t('cart.subtotal', 'Subtotal')}</Text>
                            <Text style={styles.subtotalValue}>${parseFloat(subtotal).toFixed(2)}</Text>
                        </View>

                        {/* Total */}
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>{t('cart.total', 'Total')}</Text>
                            <Text style={styles.totalValue}>${parseFloat(total).toFixed(2)}</Text>
                        </View>

                        {/* Checkout Button */}
                        <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout}>
                            <Text style={styles.checkoutButtonText}>{t('checkout.title', 'Checkout')}</Text>
                        </TouchableOpacity>
                    </View>
                </>
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
        fontSize: fontSize.xl,
        fontWeight: fontWeight.bold,
        color: colors.textPrimary,
    },
    headerRight: {
        width: 40,
    },
    cartButton: {
        width: 40,
        alignItems: 'flex-end',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: spacing.md,
        paddingBottom: spacing.lg,
    },
    cartItem: {
        flexDirection: 'row',
        backgroundColor: colors.white,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.borderLight,
        ...shadows.sm,
    },
    itemImage: {
        width: 70,
        height: 70,
        backgroundColor: colors.background,
        borderRadius: borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
        overflow: 'hidden',
    },
    itemImageContent: {
        width: '100%',
        height: '100%',
    },
    itemInfo: {
        flex: 1,
        justifyContent: 'space-between',
    },
    itemName: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.semibold,
        color: colors.textPrimary,
        marginBottom: spacing.xs,
    },
    itemVariant: {
        fontSize: fontSize.sm,
        color: colors.textSecondary,
        marginBottom: spacing.sm,
    },
    quantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    quantityButton: {
        width: 28,
        height: 28,
        borderRadius: borderRadius.sm,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.white,
    },
    quantityButtonActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    quantityText: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.medium,
        color: colors.textPrimary,
        marginHorizontal: spacing.md,
    },
    itemRight: {
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        marginLeft: spacing.sm,
    },
    removeButton: {
        padding: spacing.xs,
    },
    itemPrice: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        color: colors.textPrimary,
    },
    bottomSection: {
        borderTopWidth: 1,
        borderTopColor: colors.borderLight,
        padding: spacing.md,
        backgroundColor: colors.white,
    },
    subtotalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    subtotalLabel: {
        fontSize: fontSize.md,
        color: colors.textSecondary,
    },
    subtotalValue: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.medium,
        color: colors.textPrimary,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    totalLabel: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.semibold,
        color: colors.textPrimary,
    },
    totalValue: {
        fontSize: fontSize.xl,
        fontWeight: fontWeight.bold,
        color: colors.textPrimary,
    },
    checkoutButton: {
        backgroundColor: colors.primary,
        borderRadius: borderRadius.lg,
        paddingVertical: spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkoutButtonText: {
        color: colors.white,
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
    },
    emptyCart: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    emptyCartTitle: {
        fontSize: fontSize.xl,
        fontWeight: fontWeight.bold,
        color: colors.textPrimary,
        marginTop: spacing.md,
    },
    emptyCartText: {
        fontSize: fontSize.md,
        color: colors.textSecondary,
        marginTop: spacing.sm,
        textAlign: 'center',
    },
    shopButton: {
        backgroundColor: colors.primary,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.xl,
        borderRadius: borderRadius.lg,
        marginTop: spacing.lg,
    },
    shopButtonText: {
        color: colors.white,
        fontSize: fontSize.md,
        fontWeight: fontWeight.semibold,
    },
    authPrompt: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    authTitle: {
        fontSize: fontSize.xl,
        fontWeight: fontWeight.bold,
        color: colors.textPrimary,
        marginTop: spacing.md,
    },
    authText: {
        fontSize: fontSize.md,
        color: colors.textSecondary,
        marginTop: spacing.sm,
        textAlign: 'center',
    },
    signInButton: {
        backgroundColor: colors.primary,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.xl,
        borderRadius: borderRadius.lg,
        marginTop: spacing.lg,
    },
    signInButtonText: {
        color: colors.white,
        fontSize: fontSize.md,
        fontWeight: fontWeight.semibold,
    },
    couponContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background,
        borderRadius: borderRadius.lg,
        paddingHorizontal: spacing.sm,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.borderLight,
    },
    couponIcon: {
        marginRight: spacing.xs,
    },
    couponInput: {
        flex: 1,
        paddingVertical: spacing.sm,
        fontSize: fontSize.md,
        color: colors.textPrimary,
    },
    applyButton: {
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.md,
    },
    applyButtonDisabled: {
        opacity: 0.5,
    },
    applyButtonText: {
        color: colors.primary,
        fontWeight: fontWeight.bold,
        fontSize: fontSize.md,
    },
});
