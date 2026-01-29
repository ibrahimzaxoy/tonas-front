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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../theme';
import { Loading } from '../components';
import { getWishlist, removeFromWishlist, addToCart } from '../services/endpoints';
import { useAuth } from '../context/AuthContext';
import { useCart, useWishlist } from '../context';
import type { Product } from '../types';
import { useTranslation } from '../context';
import { getLocalizedField } from '../i18n/locale';

export default function WishlistScreen() {
    const navigation = useNavigation();
    const { isAuthenticated, user } = useAuth();
    const { syncCart } = useCart();
    const { setWishlistCount } = useWishlist();
    const { t } = useTranslation();
    const [wishlistItems, setWishlistItems] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [processingId, setProcessingId] = useState<number | null>(null);

    const fetchWishlist = useCallback(async () => {
        if (!isAuthenticated) {
            setIsLoading(false);
            setIsRefreshing(false);
            return;
        }

        try {
            const data = await getWishlist();
            // Ensure data is array to prevent 'undefined.length' crash
            setWishlistItems(Array.isArray(data) ? data : []);
            setWishlistCount(Array.isArray(data) ? data.length : 0);
        } catch (err: any) {
            console.error('Failed to fetch wishlist:', err);
            setWishlistItems([]); // Fallback to empty array
            setWishlistCount(0);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        fetchWishlist();
    }, [fetchWishlist]);

    useFocusEffect(
        useCallback(() => {
            fetchWishlist();
        }, [fetchWishlist])
    );

    const handleRefresh = () => {
        setIsRefreshing(true);
        fetchWishlist();
    };

    const handleRemoveFromWishlist = async (productId: number) => {
        try {
            setProcessingId(productId);
            await removeFromWishlist(productId);
            setWishlistItems(prev => {
                const next = prev.filter(item => item.id !== productId);
                setWishlistCount(next.length);
                return next;
            });
        } catch (err: any) {
            Alert.alert(t('common.error', 'Error'), err.message || t('wishlist.remove_failed', 'Failed to remove from wishlist'));
        } finally {
            setProcessingId(null);
        }
    };

    const handleAddToCart = async (product: Product) => {
        try {
            setProcessingId(product.id);
            const cart = await addToCart(product.id);
            syncCart(cart);
            const productName = getLocalizedField(product as any, 'name', product.name);
            Alert.alert(t('common.success', 'Success'), `${productName} ${t('cart.added_to_cart', 'added to cart!')}`);
        } catch (err: any) {
            Alert.alert(t('common.error', 'Error'), err.message || t('cart.add_failed', 'Failed to add to cart'));
        } finally {
            setProcessingId(null);
        }
    };

    const handleProductPress = (product: Product) => {
        navigation.navigate('ProductDetail', { slug: product.slug });
    };

    if (isLoading) {
        return <Loading message={t('wishlist.loading', 'Loading wishlist...')} />;
    }

    if (!isAuthenticated) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('wishlist.title', 'Wishlist')}</Text>
                <View style={styles.headerRight} />
            </View>
            <View style={styles.authPrompt}>
                <Ionicons name="heart-outline" size={80} color={colors.textLight} />
                <Text style={styles.authTitle}>{t('wishlist.sign_in_title', 'Sign in to view your wishlist')}</Text>
                <Text style={styles.authText}>{t('wishlist.sign_in_subtitle', 'Save your favorite items and access them anytime')}</Text>
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

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('wishlist.title', 'Wishlist')}</Text>
                <View style={styles.headerRight} />
            </View>

            {wishlistItems.length === 0 ? (
                <View style={styles.emptyState}>
                    <Ionicons name="heart-outline" size={80} color={colors.textLight} />
                    <Text style={styles.emptyTitle}>{t('wishlist.empty_title', 'Your wishlist is empty')}</Text>
                    <Text style={styles.emptyText}>{t('wishlist.empty_subtitle', 'Start adding products you love!')}</Text>
                    <TouchableOpacity
                        style={styles.shopButton}
                        onPress={() => navigation.navigate('Home' as never)}
                    >
                        <Text style={styles.shopButtonText}>{t('wishlist.explore_products', 'Explore Products')}</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView
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
                    <View style={styles.grid}>
                        {wishlistItems.map((item) => (
                            <View key={item.id} style={styles.productCard}>
                                <TouchableOpacity
                                    style={styles.wishlistButton}
                                    onPress={() => handleRemoveFromWishlist(item.id)}
                                    disabled={processingId === item.id}
                                >
                                    <Ionicons name="heart" size={20} color={colors.primary} />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.productTouchable}
                                    onPress={() => navigation.navigate('ProductDetail' as never, { slug: item.slug } as never)}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.productImage}>
                                        {item.thumbnail ? (
                                            <Image
                                                source={{ uri: item.thumbnail }}
                                                style={styles.productImageContent}
                                                resizeMode="cover"
                                            />
                                        ) : (
                                            <Ionicons name="image-outline" size={48} color={colors.textLight} />
                                        )}
                                    </View>
                                    <Text style={styles.productName} numberOfLines={2}>
                                        {getLocalizedField(item as any, 'name', item.name)}
                                    </Text>
                                    <Text style={styles.productPrice}>${parseFloat(item.price).toFixed(2)}</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.addToCartButton,
                                        processingId === item.id && styles.addToCartButtonDisabled
                                    ]}
                                    onPress={() => handleAddToCart(item)}
                                    disabled={processingId === item.id}
                                >
                                    <Ionicons name="cart-outline" size={16} color={colors.white} />
                                    <Text style={styles.addToCartText}>{t('cart.add_to_cart', 'Add to Cart')}</Text>
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                </ScrollView>
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
    scrollContent: {
        padding: spacing.md,
        paddingBottom: spacing.xxl,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    productCard: {
        width: '48%',
        backgroundColor: colors.white,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.borderLight,
        position: 'relative',
    },
    wishlistButton: {
        position: 'absolute',
        top: spacing.sm,
        right: spacing.sm,
        zIndex: 1,
        backgroundColor: 'rgba(230, 126, 34, 0.1)',
        borderRadius: borderRadius.full,
        padding: spacing.xs,
    },
    productTouchable: {
        alignItems: 'flex-start',
    },
    productImage: {
        width: '100%',
        height: 100,
        backgroundColor: colors.background,
        borderRadius: borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.sm,
        marginTop: spacing.md,
        overflow: 'hidden',
    },
    productImageContent: {
        width: '100%',
        height: '100%',
    },
    productName: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.medium,
        color: colors.textPrimary,
        marginBottom: spacing.xs,
    },
    productPrice: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        color: colors.textPrimary,
        marginBottom: spacing.sm,
    },
    addToCartButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary,
        borderRadius: borderRadius.md,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
    },
    addToCartButtonDisabled: {
        opacity: 0.6,
    },
    addToCartText: {
        color: colors.white,
        fontSize: fontSize.sm,
        fontWeight: fontWeight.semibold,
        marginLeft: spacing.xs,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    emptyTitle: {
        fontSize: fontSize.xl,
        fontWeight: fontWeight.bold,
        color: colors.textPrimary,
        marginTop: spacing.md,
    },
    emptyText: {
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
});
