import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    Image,
    TouchableOpacity,
    StatusBar,
    RefreshControl,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../theme';
import { ProductCard, CategoryCard, HeroBanner, Loading } from '../components';
import { getHome, getWishlist, toggleWishlist } from '../services/endpoints';
import type { HomeResponse, Product, Category, Slide } from '../types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';
import { useAuth } from '../context/AuthContext';
import { useCart, useWishlist } from '../context';
import { useTranslation } from '../context';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
    const navigation = useNavigation<NavigationProp>();
    const { isAuthenticated } = useAuth();
    const { itemsCount } = useCart();
    const { setWishlistCount } = useWishlist();
    const { t } = useTranslation();
    const [homeData, setHomeData] = useState<HomeResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [wishlistIds, setWishlistIds] = useState<Set<number>>(new Set());

    const fetchHomeData = useCallback(async () => {
        try {
            setError(null);
            const data = await getHome();
            setHomeData(data);
        } catch (err: any) {
            console.error('Failed to fetch home data:', err);
            setError(err.message || t('home.error_load', 'Failed to load data. Please try again.'));
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchHomeData();
    }, [fetchHomeData]);

    const refreshWishlist = useCallback(async () => {
        if (!isAuthenticated) {
            setWishlistIds(new Set());
            return;
        }
        try {
            const wishlist = await getWishlist();
            setWishlistIds(new Set(wishlist.map((item) => item.id)));
            setWishlistCount(wishlist.length);
        } catch (err) {
            console.error('Failed to load wishlist:', err);
        }
    }, [isAuthenticated, setWishlistCount]);

    useFocusEffect(
        useCallback(() => {
            refreshWishlist();
        }, [refreshWishlist])
    );

    const handleRefresh = () => {
        setIsRefreshing(true);
        fetchHomeData();
    };

    const handleProductPress = (product: Product) => {
        navigation.navigate('ProductDetail', { slug: product.slug });
    };

    const handleCategoryPress = (category: Category) => {
        navigation.navigate('CategoryProducts', {
            categoryId: category.id,
            categoryName: category.name
        });
    };

    const handleSlidePress = (slide: Slide) => {
        // Handle slide navigation based on link_type and link_value
        console.log('Slide pressed:', slide);
    };

    const handleWishlistToggle = async (product: Product) => {
        if (!isAuthenticated) {
            Alert.alert(
                t('auth.sign_in_required', 'Sign In Required'),
                t('wishlist.sign_in_prompt', 'Please sign in to add items to your wishlist'),
                [
                    { text: t('common.cancel', 'Cancel'), style: 'cancel' },
                    { text: t('auth.sign_in', 'Sign In'), onPress: () => navigation.navigate('Login' as never) },
                ]
            );
            return;
        }

        try {
            const result = await toggleWishlist(product.id);
            setWishlistIds((prev) => {
                const next = new Set(prev);
                if (result.added) {
                    next.add(product.id);
                } else {
                    next.delete(product.id);
                }
                setWishlistCount(next.size);
                return next;
            });
        } catch (err: any) {
            Alert.alert(t('common.error', 'Error'), err.message || t('wishlist.update_failed', 'Failed to update wishlist'));
        }
    };

    const handleSearchPress = () => {
        navigation.navigate('Search' as never);
    };

    if (isLoading) {
        return <Loading message={t('common.loading', 'Loading...')} />;
    }

    if (error && !homeData) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <Ionicons name="cloud-offline-outline" size={64} color={colors.textLight} />
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={fetchHomeData}>
                        <Text style={styles.retryButtonText}>{t('common.try_again', 'Try Again')}</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const slides = homeData?.slides || [];
    const categories = homeData?.categories || [];
    const newArrivals = homeData?.new_arrivals || [];
    const featuredProducts = homeData?.featured_products || [];

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity>
                    <Ionicons name="menu" size={24} color={colors.textPrimary} />
                </TouchableOpacity>

                <View style={styles.logoContainer}>
                    <Image
                        source={require('../assets/logo.jpg')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                </View>

                <TouchableOpacity
                    style={styles.cartButton}
                    onPress={() => navigation.navigate('Cart' as never)}
                >
                    <Ionicons name="cart-outline" size={24} color={colors.textPrimary} />
                    {itemsCount > 0 && (
                        <View style={styles.cartBadge}>
                            <Text style={styles.cartBadgeText}>
                                {itemsCount > 99 ? '99+' : itemsCount}
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <TouchableOpacity style={styles.searchBar} onPress={handleSearchPress}>
                <Ionicons name="search" size={20} color={colors.textLight} />
                <Text style={styles.searchPlaceholder}>{t('search.placeholder_products', 'Search products...')}</Text>
            </TouchableOpacity>

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
                {/* Hero Banner */}
                <HeroBanner
                    slides={slides}
                    onSlidePress={handleSlidePress}
                />

                {/* New Arrivals Section */}
                {newArrivals.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>{t('home.new_arrivals', 'New Arrivals')}</Text>
                            <TouchableOpacity>
                                <Text style={styles.seeAllText}>{t('common.see_all', 'See All')}</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {newArrivals.map((product) => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    onPress={() => handleProductPress(product)}
                                    onWishlistPress={() => handleWishlistToggle(product)}
                                    isInWishlist={wishlistIds.has(product.id)}
                                    style={styles.productCard}
                                />
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* Featured Products Section */}
                {featuredProducts.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>{t('home.featured_products', 'Featured Products')}</Text>
                            <TouchableOpacity>
                                <Text style={styles.seeAllText}>{t('common.see_all', 'See All')}</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {featuredProducts.map((product) => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    onPress={() => handleProductPress(product)}
                                    onWishlistPress={() => handleWishlistToggle(product)}
                                    isInWishlist={wishlistIds.has(product.id)}
                                    style={styles.productCard}
                                />
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* Popular Categories Section */}
                {categories.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>{t('home.popular_categories', 'Popular Categories')}</Text>
                            <TouchableOpacity>
                                <Text style={styles.seeAllText}>{t('common.see_all', 'See All')}</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.categoriesGrid}>
                            {categories.slice(0, 6).map((category) => (
                                <View key={category.id} style={styles.categoryWrapper}>
                                    <CategoryCard
                                        category={category}
                                        onPress={() => handleCategoryPress(category)}
                                        size="medium"
                                    />
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Fallback if no data from API */}
                {slides.length === 0 && newArrivals.length === 0 && categories.length === 0 && (
                    <View style={styles.emptyState}>
                        <Ionicons name="storefront-outline" size={64} color={colors.textLight} />
                        <Text style={styles.emptyStateTitle}>{t('home.empty_title', 'No products available')}</Text>
                        <Text style={styles.emptyStateText}>{t('home.empty_subtitle', 'Check back later for new arrivals!')}</Text>
                    </View>
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
        paddingVertical: spacing.sm,
        backgroundColor: colors.white,
    },
    logoContainer: {
        flex: 1,
        alignItems: 'center',
    },
    logo: {
        width: 100,
        height: 40,
    },
    cartButton: {
        position: 'relative',
    },
    cartBadge: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: colors.primary,
        borderRadius: borderRadius.full,
        width: 16,
        height: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cartBadgeText: {
        color: colors.white,
        fontSize: fontSize.xs,
        fontWeight: fontWeight.bold,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background,
        marginHorizontal: spacing.md,
        marginVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.lg,
    },
    searchPlaceholder: {
        marginLeft: spacing.sm,
        color: colors.textLight,
        fontSize: fontSize.md,
    },
    scrollContent: {
        paddingBottom: spacing.xxl,
    },
    section: {
        marginTop: spacing.lg,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
        paddingHorizontal: spacing.md,
    },
    sectionTitle: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        color: colors.textPrimary,
    },
    seeAllText: {
        fontSize: fontSize.md,
        color: colors.primary,
        fontWeight: fontWeight.medium,
    },
    productCard: {
        marginLeft: spacing.md,
    },
    categoriesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: spacing.sm,
    },
    categoryWrapper: {
        width: '33.33%',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    errorText: {
        fontSize: fontSize.md,
        color: colors.textSecondary,
        textAlign: 'center',
        marginTop: spacing.md,
        marginBottom: spacing.lg,
    },
    retryButton: {
        backgroundColor: colors.primary,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.xl,
        borderRadius: borderRadius.lg,
    },
    retryButtonText: {
        color: colors.white,
        fontSize: fontSize.md,
        fontWeight: fontWeight.semibold,
    },
    emptyState: {
        alignItems: 'center',
        padding: spacing.xxl,
        marginTop: spacing.xl,
    },
    emptyStateTitle: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        color: colors.textPrimary,
        marginTop: spacing.md,
    },
    emptyStateText: {
        fontSize: fontSize.md,
        color: colors.textSecondary,
        marginTop: spacing.sm,
    },
});
