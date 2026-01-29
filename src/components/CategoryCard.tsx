import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../theme';
import type { Category } from '../types';
import { getImageUrl } from '../services/api';
import { useTranslation } from '../context';
import { getLocalizedField } from '../i18n/locale';

interface CategoryCardProps {
    category: Category;
    onPress: () => void;
    size?: 'small' | 'medium' | 'large';
    style?: object;
}

const categoryIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
    'electronics': 'laptop-outline',
    'fashion': 'shirt-outline',
    'men': 'man-outline',
    'women': 'woman-outline',
    'beauty': 'sparkles-outline',
    'home': 'home-outline',
    'sports': 'football-outline',
    'toys': 'game-controller-outline',
    'books': 'book-outline',
    'food': 'fast-food-outline',
    'health': 'fitness-outline',
    'automotive': 'car-outline',
    'jewelry': 'diamond-outline',
    'baby': 'happy-outline',
    'pet': 'paw-outline',
    'office': 'briefcase-outline',
    'garden': 'leaf-outline',
    'music': 'musical-notes-outline',
    'art': 'color-palette-outline',
    'default': 'cube-outline',
};

function getIconForCategory(name: string): keyof typeof Ionicons.glyphMap {
    const lowercaseName = name.toLowerCase();
    for (const [key, icon] of Object.entries(categoryIcons)) {
        if (lowercaseName.includes(key)) {
            return icon;
        }
    }
    return categoryIcons.default;
}

export default function CategoryCard({ category, onPress, size = 'medium', style }: CategoryCardProps) {
    useTranslation();
    const sizeConfig = {
        small: { container: 60, icon: 24, fontSize: fontSize.xs },
        medium: { container: 70, icon: 32, fontSize: fontSize.sm },
        large: { container: 80, icon: 40, fontSize: fontSize.md },
    };

    const config = sizeConfig[size];
    const displayName = getLocalizedField(category as any, 'name', category.name);

    const imageUrl = getImageUrl(category.image);

    return (
        <TouchableOpacity
            style={[styles.container, style]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={[styles.iconContainer, { width: config.container, height: config.container }]}>
                {category.image ? (
                    <Image
                        source={{ uri: imageUrl }}
                        style={styles.image}
                        resizeMode="cover"
                    />
                ) : (
                    <Ionicons
                        name={getIconForCategory(category.name)}
                        size={config.icon}
                        color={colors.primary}
                    />
                )}
            </View>
            <Text style={[styles.name, { fontSize: config.fontSize }]} numberOfLines={2}>
                {displayName}
            </Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        padding: spacing.sm,
    },
    iconContainer: {
        backgroundColor: colors.background,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.sm,
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    name: {
        color: colors.textPrimary,
        fontWeight: fontWeight.medium,
        textAlign: 'center',
        lineHeight: 18,
    },
});
