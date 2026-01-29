import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../theme';
import type { Product } from '../types';
import { getImageUrl } from '../services/api';
import { useTranslation } from '../context';
import { getLocalizedField } from '../i18n/locale';

interface ProductCardProps {
    product: Product;
    onPress: () => void;
    onWishlistPress?: () => void;
    isInWishlist?: boolean;
    style?: object;
}

export default function ProductCard({
    product,
    onPress,
    onWishlistPress,
    isInWishlist = false,
    style
}: ProductCardProps) {
    useTranslation();
    const hasDiscount = product.discount_percentage && product.discount_percentage > 0;
    const imageUrl = getImageUrl(product.thumbnail);
    const priceValue = Number.parseFloat(product.price);
    const displayPrice = Number.isFinite(priceValue) ? priceValue : 0;
    const comparePriceValue = Number.parseFloat(product.compare_price || '');
    const displayComparePrice = Number.isFinite(comparePriceValue) ? comparePriceValue : null;
    const displayName = getLocalizedField(product as any, 'name', product.name);
    const displayDescription = getLocalizedField(
        product as any,
        'short_description',
        product.short_description || product.category?.name || ''
    );

    return (
        <TouchableOpacity
            style={[styles.container, style]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            {/* Wishlist Button */}
            {onWishlistPress && (
                <TouchableOpacity
                    style={styles.wishlistButton}
                    onPress={onWishlistPress}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons
                        name={isInWishlist ? 'heart' : 'heart-outline'}
                        size={18}
                        color={isInWishlist ? colors.primary : colors.textSecondary}
                    />
                </TouchableOpacity>
            )}

            {/* Discount Badge */}
            {hasDiscount && (
                <View style={styles.discountBadge}>
                    <Text style={styles.discountText}>-{product.discount_percentage}%</Text>
                </View>
            )}

            {/* Product Image */}
            <View style={styles.imageContainer}>
                {imageUrl ? (
                    <Image
                        source={{ uri: imageUrl }}
                        style={styles.image}
                        resizeMode="cover"
                        onError={(e) => console.log('Image load error:', imageUrl, e.nativeEvent.error)}
                    />
                ) : (
                    <Ionicons name="image-outline" size={40} color={colors.textLight} />
                )}
            </View>

            {/* Product Info */}
            <Text style={styles.name} numberOfLines={2}>{displayName}</Text>
            <Text style={styles.description} numberOfLines={1}>
                {displayDescription}
            </Text>

            {/* Price */}
            <View style={styles.priceContainer}>
                <Text style={styles.price}>${displayPrice.toFixed(2)}</Text>
                {hasDiscount && displayComparePrice !== null && (
                    <Text style={styles.comparePrice}>${displayComparePrice.toFixed(2)}</Text>
                )}
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        width: 140,
        backgroundColor: colors.white,
        borderRadius: borderRadius.lg,
        padding: spacing.sm,
        borderWidth: 1,
        borderColor: colors.borderLight,
        position: 'relative',
    },
    wishlistButton: {
        position: 'absolute',
        top: spacing.sm,
        right: spacing.sm,
        zIndex: 1,
        backgroundColor: colors.white,
        borderRadius: borderRadius.full,
        padding: spacing.xs,
        ...Platform.select({
            web: {
                boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.12)',
            },
            default: {
                shadowColor: colors.black,
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
                elevation: 2,
            },
        }),
    },
    discountBadge: {
        position: 'absolute',
        top: spacing.sm,
        left: spacing.sm,
        backgroundColor: colors.error,
        borderRadius: borderRadius.sm,
        paddingHorizontal: spacing.xs,
        paddingVertical: 2,
        zIndex: 1,
    },
    discountText: {
        color: colors.white,
        fontSize: fontSize.xs,
        fontWeight: fontWeight.bold,
    },
    imageContainer: {
        height: 80,
        backgroundColor: colors.background,
        borderRadius: borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.sm,
        marginTop: spacing.md,
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    name: {
        fontSize: fontSize.sm,
        fontWeight: fontWeight.medium,
        color: colors.textPrimary,
        marginBottom: spacing.xs,
        lineHeight: 18,
    },
    description: {
        fontSize: fontSize.xs,
        color: colors.textSecondary,
        marginBottom: spacing.xs,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    price: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.bold,
        color: colors.textPrimary,
    },
    comparePrice: {
        fontSize: fontSize.xs,
        color: colors.textLight,
        textDecorationLine: 'line-through',
    },
});
