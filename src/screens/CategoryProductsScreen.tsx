import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    FlatList,
    TouchableOpacity,
    StatusBar,
    RefreshControl,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../theme';
import { ProductCard, Loading, ImageCarousel } from '../components';
import { getProducts, getWishlist, toggleWishlist, getCategories } from '../services/endpoints';
import type { Product, RootStackParamList, Category } from '../types';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context';
import { useTranslation } from '../context';

type RouteProps = RouteProp<RootStackParamList, 'CategoryProducts'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function CategoryProductsScreen() {
    const navigation = useNavigation<NavigationProp>();
    const route = useRoute<RouteProps>();
    const { categoryId, categoryName } = route.params;
    const { isAuthenticated } = useAuth();
    const { setWishlistCount } = useWishlist();
    const { t } = useTranslation();

    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [wishlistIds, setWishlistIds] = useState<Set<number>>(new Set());
    const [categoryImages, setCategoryImages] = useState<string[]>([]);

    const fetchProducts = useCallback(async (pageNum: number = 1, refresh: boolean = false) => {
        try {
            if (refresh) {
                setIsRefreshing(true);
            } else if (pageNum === 1) {
                setIsLoading(true);
            } else {
                setIsLoadingMore(true);
            }

            const response = await getProducts({
                category_id: categoryId,
                page: pageNum,
                per_page: 10,
            });

            if (pageNum === 1) {
                setProducts(response.data);
            } else {
                setProducts(prev => [...prev, ...response.data]);
            }

            setHasMore(response.meta.current_page < response.meta.last_page);
            setPage(pageNum);
        } catch (err: any) {
            console.error('Failed to fetch products:', err);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
            setIsLoadingMore(false);
        }
    }, [categoryId]);

    useEffect(() => {
        fetchProducts(1);
    }, [fetchProducts]);

    useEffect(() => {
        let isMounted = true;
        const fetchCategory = async () => {
            try {
                const categories = await getCategories();
                const match = categories.find((item: Category) => item.id === categoryId);
                if (match) {
                    const images = Array.isArray(match.hero_images) && match.hero_images.length > 0
                        ? match.hero_images
                        : match.image
                            ? [match.image]
                            : [];
                    if (isMounted) {
                        setCategoryImages(images.filter(Boolean));
                    }
                }
            } catch {
                // ignore
            }
        };
        fetchCategory();
        return () => {
            isMounted = false;
        };
    }, [categoryId]);

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
        fetchProducts(1, true);
    };

    const handleLoadMore = () => {
        if (!isLoadingMore && hasMore) {
            fetchProducts(page + 1);
        }
    };

    const handleProductPress = (product: Product) => {
        navigation.navigate('ProductDetail', { slug: product.slug });
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

    const renderProduct = ({ item, index }: { item: Product; index: number }) => (
        <View style={[styles.productWrapper, index % 2 === 0 ? styles.productLeft : styles.productRight]}>
            <ProductCard
                product={item}
                onPress={() => handleProductPress(item)}
                onWishlistPress={() => handleWishlistToggle(item)}
                isInWishlist={wishlistIds.has(item.id)}
                style={styles.productCard}
            />
        </View>
    );

    const renderFooter = () => {
        if (!isLoadingMore) return null;
        return (
            <View style={styles.footer}>
                <Loading fullScreen={false} message={t('common.loading_more', 'Loading more...')} />
            </View>
        );
    };

    if (isLoading) {
        return <Loading message={t('products.loading', 'Loading products...')} />;
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>{categoryName}</Text>
                <TouchableOpacity style={styles.filterButton}>
                    <Ionicons name="filter-outline" size={22} color={colors.textPrimary} />
                </TouchableOpacity>
            </View>

            {/* Products Count */}
            <View style={styles.countContainer}>
                <Text style={styles.countText}>
                    {t('category.products_count', '{{count}} Products').replace('{{count}}', String(products.length))}
                </Text>
            </View>

            {products.length === 0 ? (
                <View style={styles.emptyState}>
                    <Ionicons name="cube-outline" size={64} color={colors.textLight} />
                    <Text style={styles.emptyTitle}>{t('category.empty_title', 'No products found')}</Text>
                    <Text style={styles.emptyText}>{t('category.empty_subtitle', "This category doesn't have any products yet")}</Text>
                </View>
            ) : (
                <FlatList
                    data={products}
                    renderItem={renderProduct}
                    keyExtractor={(item) => item.id.toString()}
                    numColumns={2}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefreshing}
                            onRefresh={handleRefresh}
                            colors={[colors.primary]}
                            tintColor={colors.primary}
                        />
                    }
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={renderFooter}
                    ListHeaderComponent={
                        categoryImages.length > 0 ? (
                            <View style={styles.carouselWrapper}>
                                <ImageCarousel images={categoryImages} />
                            </View>
                        ) : null
                    }
                />
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
        flex: 1,
        fontSize: fontSize.xl,
        fontWeight: fontWeight.bold,
        color: colors.textPrimary,
        textAlign: 'center',
    },
    filterButton: {
        width: 40,
        alignItems: 'flex-end',
    },
    countContainer: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        backgroundColor: colors.background,
    },
    countText: {
        fontSize: fontSize.sm,
        color: colors.textSecondary,
    },
    listContent: {
        padding: spacing.sm,
        paddingBottom: spacing.xxl,
    },
    productWrapper: {
        width: '50%',
        padding: spacing.xs,
    },
    productLeft: {
        paddingRight: spacing.xs,
    },
    productRight: {
        paddingLeft: spacing.xs,
    },
    productCard: {
        width: '100%',
    },
    footer: {
        paddingVertical: spacing.lg,
    },
    carouselWrapper: {
        marginBottom: spacing.md,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    emptyTitle: {
        fontSize: fontSize.lg,
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
});
