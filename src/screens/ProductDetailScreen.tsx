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
    Dimensions,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, fontSize, fontWeight, borderRadius, shadows } from '../theme';
import { ProductCard, Loading, ImageCarousel } from '../components';
import { getProductBySlug, addToCart, getWishlist, toggleWishlist } from '../services/endpoints';
import { getAuthToken } from '../services/api';
import type { Product, ProductVariant, RootStackParamList } from '../types';
import { useAuth } from '../context/AuthContext';
import { useCart, useWishlist } from '../context';
import { useTranslation } from '../context';
import { getLocalizedField } from '../i18n/locale';

type RouteProps = RouteProp<RootStackParamList, 'ProductDetail'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ProductDetailScreen() {
    const navigation = useNavigation<NavigationProp>();
    const route = useRoute<RouteProps>();
    const { slug } = route.params;
    const { isAuthenticated } = useAuth();
    const { syncCart } = useCart();
    const { wishlistCount, setWishlistCount } = useWishlist();
    const { t } = useTranslation();

    const [product, setProduct] = useState<Product | null>(null);
    const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const [isInWishlist, setIsInWishlist] = useState(false);

    const fetchProduct = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await getProductBySlug(slug);
            setProduct(response.product);
            setRelatedProducts(response.related || []);

            // Select first variant by default if available
            if (response.product.variants?.length > 0) {
                setSelectedVariant(response.product.variants[0]);
            }
        } catch (err: any) {
            console.error('Failed to fetch product:', err);
            Alert.alert(t('common.error', 'Error'), t('product.details_load_failed', 'Failed to load product details'));
            navigation.goBack();
        } finally {
            setIsLoading(false);
        }
    }, [slug, navigation]);

    useEffect(() => {
        fetchProduct();
    }, [fetchProduct]);

    const productId = product?.id;
    const productWishlisted = product?.is_wishlisted;

    useEffect(() => {
        let isMounted = true;
        const syncWishlist = async () => {
            if (!productId || !isAuthenticated) {
                if (isMounted) {
                    setIsInWishlist(false);
                }
                return;
            }

            if (typeof productWishlisted === 'boolean') {
                if (isMounted) {
                    setIsInWishlist(productWishlisted);
                }
                return;
            }

            try {
                const wishlist = await getWishlist();
                if (isMounted) {
                    setIsInWishlist(wishlist.some((item) => item.id === productId));
                    setWishlistCount(wishlist.length);
                }
            } catch (err) {
                console.error('Failed to load wishlist status:', err);
            }
        };

        syncWishlist();

        return () => {
            isMounted = false;
        };
    }, [productId, productWishlisted, isAuthenticated, setWishlistCount]);

    const handleAddToCart = async () => {
        const token = await getAuthToken();
        if (!token) {
            Alert.alert(
                t('auth.sign_in_required', 'Sign In Required'),
                t('cart.sign_in_prompt', 'Please sign in to add items to your cart'),
                [
                    { text: t('common.cancel', 'Cancel'), style: 'cancel' },
                    { text: t('auth.sign_in', 'Sign In'), onPress: () => navigation.navigate('Login') },
                ]
            );
            return;
        }

        if (!product) return;

        try {
            setIsAddingToCart(true);
            const cart = await addToCart(product.id, selectedVariant?.id, quantity);
            syncCart(cart);
            const productName = getLocalizedField(product as any, 'name', product.name);
            Alert.alert(t('common.success', 'Success'), `${productName} ${t('cart.added_to_cart', 'added to cart!')}`);
        } catch (err: any) {
            Alert.alert(t('common.error', 'Error'), err.message || t('cart.add_failed', 'Failed to add to cart'));
        } finally {
            setIsAddingToCart(false);
        }
    };

    const handleWishlistToggle = async () => {
        const token = await getAuthToken();
        if (!token) {
            Alert.alert(
                t('auth.sign_in_required', 'Sign In Required'),
                t('wishlist.sign_in_prompt', 'Please sign in to add items to your wishlist'),
                [
                    { text: t('common.cancel', 'Cancel'), style: 'cancel' },
                    { text: t('auth.sign_in', 'Sign In'), onPress: () => navigation.navigate('Login') },
                ]
            );
            return;
        }

        if (!product) return;

        try {
            const result = await toggleWishlist(product.id);
            setIsInWishlist(result.added);
            setWishlistCount(Math.max(0, wishlistCount + (result.added ? 1 : -1)));
        } catch (err: any) {
            Alert.alert(t('common.error', 'Error'), err.message || t('wishlist.update_failed', 'Failed to update wishlist'));
        }
    };

    const handleRelatedProductPress = (relatedProduct: Product) => {
        navigation.push('ProductDetail', { slug: relatedProduct.slug });
    };

    const incrementQuantity = () => {
        setQuantity(prev => prev + 1);
    };

    const decrementQuantity = () => {
        if (quantity > 1) {
            setQuantity(prev => prev - 1);
        }
    };

    if (isLoading) {
        return <Loading message={t('product.loading', 'Loading product...')} />;
    }

    if (!product) {
        return null;
    }

    const productImages = (product.images || []).filter((image) => !!image);
    const images = productImages.length > 0
        ? productImages
        : product.thumbnail
            ? [product.thumbnail]
            : [];
    const priceValue = selectedVariant ? Number.parseFloat(selectedVariant.price) : Number.parseFloat(product.price);
    const price = Number.isFinite(priceValue) ? priceValue : 0;
    const compareValue = selectedVariant?.compare_price
        ? Number.parseFloat(selectedVariant.compare_price)
        : product.compare_price
            ? Number.parseFloat(product.compare_price)
            : NaN;
    const comparePrice = Number.isFinite(compareValue) ? compareValue : null;
    const productName = getLocalizedField(product as any, 'name', product.name);
    const productDescription = getLocalizedField(
        product as any,
        'description',
        product.description || product.short_description || t('product.no_description', 'No description available.')
    );

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
                <Text style={styles.headerTitle}>{t('product.details_title', 'Product Details')}</Text>
                <TouchableOpacity style={styles.cartButton}>
                    <Ionicons name="cart-outline" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Product Image */}
                <View style={styles.imageContainer}>
                    <ImageCarousel
                        images={images}
                        height={Math.round(SCREEN_WIDTH * 0.5)}
                        onIndexChange={setSelectedImageIndex}
                    />

                    {/* Wishlist Button */}
                    <TouchableOpacity
                        style={styles.wishlistButton}
                        onPress={handleWishlistToggle}
                    >
                        <Ionicons
                            name={isInWishlist ? 'heart' : 'heart-outline'}
                            size={24}
                            color={isInWishlist ? colors.primary : colors.textSecondary}
                        />
                    </TouchableOpacity>
                </View>

                {/* Image Thumbnails */}
                {images.length > 1 && (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.thumbnailContainer}
                    >
                        {images.map((image, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.thumbnail,
                                    selectedImageIndex === index && styles.thumbnailActive,
                                ]}
                                onPress={() => setSelectedImageIndex(index)}
                            >
                                <Image
                                    source={{ uri: image }}
                                    style={styles.thumbnailImage}
                                    resizeMode="cover"
                                />
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                )}

                {/* Product Info */}
                <View style={styles.infoContainer}>
                    <Text style={styles.productName}>{productName}</Text>

                    {/* Price */}
                    <View style={styles.priceContainer}>
                        <Text style={styles.price}>${price.toFixed(2)}</Text>
                        {comparePrice && comparePrice > price && (
                            <Text style={styles.comparePrice}>${comparePrice.toFixed(2)}</Text>
                        )}
                        {product.discount_percentage && product.discount_percentage > 0 && (
                            <View style={styles.discountBadge}>
                                <Text style={styles.discountText}>-{product.discount_percentage}%</Text>
                            </View>
                        )}
                    </View>

                    {/* Rating */}
                    <View style={styles.ratingContainer}>
                        <Ionicons name="star" size={16} color="#FFD700" />
                        <Text style={styles.ratingText}>
                            {product.average_rating?.toFixed(1) || '0.0'} ({product.reviews_count || 0} {t('product.reviews', 'reviews')})
                        </Text>
                    </View>

                    {/* Description */}
                    <Text style={styles.description}>
                        {productDescription}
                    </Text>

                    {/* Vendor Link */}
                    {product.vendor && product.vendor.slug && (
                        <TouchableOpacity
                            style={styles.vendorLink}
                            onPress={() => navigation.navigate('VendorStore', { slug: product.vendor.slug })}
                        >
                            <Text style={styles.vendorLabel}>{t('product.sold_by', 'Sold by:')} </Text>
                            <Text style={styles.vendorName}>{product.vendor.name}</Text>
                        </TouchableOpacity>
                    )}

                    {/* Variants */}
                    {product.variants && product.variants.length > 0 && (
                        <View style={styles.variantsSection}>
                            <Text style={styles.sectionTitle}>{t('product.options', 'Options')}</Text>
                            <View style={styles.variantsContainer}>
                                {product.variants.map((variant) => (
                                    <TouchableOpacity
                                        key={variant.id}
                                        style={[
                                            styles.variantButton,
                                            selectedVariant?.id === variant.id && styles.variantButtonActive,
                                        ]}
                                        onPress={() => setSelectedVariant(variant)}
                                    >
                                        <Text style={[
                                            styles.variantText,
                                            selectedVariant?.id === variant.id && styles.variantTextActive,
                                        ]}>
                                            {variant.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Quantity */}
                    <View style={styles.quantitySection}>
                        <Text style={styles.sectionTitle}>{t('cart.quantity', 'Quantity')}</Text>
                        <View style={styles.quantityContainer}>
                            <TouchableOpacity
                                style={styles.quantityButton}
                                onPress={decrementQuantity}
                            >
                                <Ionicons name="remove" size={20} color={colors.textPrimary} />
                            </TouchableOpacity>
                            <Text style={styles.quantityText}>{quantity}</Text>
                            <TouchableOpacity
                                style={[styles.quantityButton, styles.quantityButtonActive]}
                                onPress={incrementQuantity}
                            >
                                <Ionicons name="add" size={20} color={colors.white} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Related Products */}
                {relatedProducts.length > 0 && (
                    <View style={styles.relatedSection}>
                        <Text style={styles.relatedTitle}>{t('product.related_products', 'Related Products')}</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {relatedProducts.map((item) => (
                                <ProductCard
                                    key={item.id}
                                    product={item}
                                    onPress={() => handleRelatedProductPress(item)}
                                    style={styles.relatedProduct}
                                />
                            ))}
                        </ScrollView>
                    </View>
                )}
            </ScrollView>

            {/* Add to Cart Button */}
            <View style={styles.bottomBar}>
                <TouchableOpacity
                    style={[styles.addToCartButton, isAddingToCart && styles.addToCartButtonDisabled]}
                    onPress={handleAddToCart}
                    disabled={isAddingToCart}
                >
                    {isAddingToCart ? (
                        <Loading fullScreen={false} />
                    ) : (
                        <>
                            <Ionicons name="cart-outline" size={22} color={colors.white} />
                            <Text style={styles.addToCartText}>{t('cart.add_to_cart', 'Add to Cart')}</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
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
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        color: colors.textPrimary,
    },
    cartButton: {
        width: 40,
        alignItems: 'flex-end',
    },
    imageContainer: {
        width: SCREEN_WIDTH,
        position: 'relative',
    },
    wishlistButton: {
        position: 'absolute',
        top: spacing.md,
        right: spacing.md,
        backgroundColor: colors.white,
        borderRadius: borderRadius.full,
        padding: spacing.sm,
        ...shadows.md,
    },
    thumbnailContainer: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
    },
    thumbnail: {
        width: 60,
        height: 60,
        borderRadius: borderRadius.md,
        marginRight: spacing.sm,
        borderWidth: 2,
        borderColor: colors.borderLight,
        overflow: 'hidden',
    },
    thumbnailActive: {
        borderColor: colors.primary,
    },
    thumbnailImage: {
        width: '100%',
        height: '100%',
    },
    infoContainer: {
        padding: spacing.md,
    },
    productName: {
        fontSize: fontSize.xxl,
        fontWeight: fontWeight.bold,
        color: colors.textPrimary,
        marginBottom: spacing.sm,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    price: {
        fontSize: fontSize.xxl,
        fontWeight: fontWeight.bold,
        color: colors.primary,
    },
    comparePrice: {
        fontSize: fontSize.lg,
        color: colors.textLight,
        textDecorationLine: 'line-through',
        marginLeft: spacing.sm,
    },
    discountBadge: {
        backgroundColor: colors.error,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.sm,
        marginLeft: spacing.sm,
    },
    discountText: {
        color: colors.white,
        fontSize: fontSize.sm,
        fontWeight: fontWeight.bold,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    ratingText: {
        marginLeft: spacing.xs,
        fontSize: fontSize.sm,
        color: colors.textSecondary,
    },
    description: {
        fontSize: fontSize.md,
        color: colors.textSecondary,
        lineHeight: 22,
        marginBottom: spacing.lg,
    },
    vendorLink: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.lg,
        padding: spacing.sm,
        backgroundColor: colors.background,
        borderRadius: borderRadius.md,
        alignSelf: 'flex-start',
    },
    vendorLabel: {
        fontSize: fontSize.sm,
        color: colors.textSecondary,
    },
    vendorName: {
        fontSize: fontSize.sm,
        color: colors.primary,
        fontWeight: fontWeight.bold,
    },
    variantsSection: {
        marginBottom: spacing.lg,
    },
    sectionTitle: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.semibold,
        color: colors.textPrimary,
        marginBottom: spacing.sm,
    },
    variantsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
    },
    variantButton: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.white,
    },
    variantButtonActive: {
        borderColor: colors.primary,
        backgroundColor: 'rgba(230, 126, 34, 0.1)',
    },
    variantText: {
        fontSize: fontSize.sm,
        color: colors.textSecondary,
    },
    variantTextActive: {
        color: colors.primary,
        fontWeight: fontWeight.semibold,
    },
    quantitySection: {
        marginBottom: spacing.lg,
    },
    quantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    quantityButton: {
        width: 36,
        height: 36,
        borderRadius: borderRadius.md,
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
        fontSize: fontSize.lg,
        fontWeight: fontWeight.semibold,
        color: colors.textPrimary,
        marginHorizontal: spacing.lg,
    },
    relatedSection: {
        paddingVertical: spacing.md,
    },
    relatedTitle: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        color: colors.textPrimary,
        paddingHorizontal: spacing.md,
        marginBottom: spacing.md,
    },
    relatedProduct: {
        marginLeft: spacing.md,
    },
    bottomBar: {
        padding: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.borderLight,
        backgroundColor: colors.white,
    },
    addToCartButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary,
        borderRadius: borderRadius.lg,
        paddingVertical: spacing.md,
        minHeight: 50,
    },
    addToCartButtonDisabled: {
        opacity: 0.7,
    },
    addToCartText: {
        color: colors.white,
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        marginLeft: spacing.sm,
    },
});
