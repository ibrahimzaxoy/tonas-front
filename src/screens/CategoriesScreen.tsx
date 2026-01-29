import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    RefreshControl,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../theme';
import { CategoryCard, Loading } from '../components';
import { getCategories } from '../services/endpoints';
import type { Category } from '../types';
import { useTranslation } from '../context';

export default function CategoriesScreen() {
    const navigation = useNavigation();
    const { t } = useTranslation();
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchCategories = useCallback(async () => {
        try {
            setError(null);
            const data = await getCategories();
            setCategories(data);
        } catch (err: any) {
            console.error('Failed to fetch categories:', err);
            setError(err.message || t('categories.load_failed', 'Failed to load categories.'));
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const handleRefresh = () => {
        setIsRefreshing(true);
        fetchCategories();
    };

    const handleCategoryPress = (category: Category) => {
        navigation.navigate('CategoryProducts', {
            categoryId: category.id,
            categoryName: category.name,
        });
    };

    if (isLoading) {
        return <Loading message={t('categories.loading', 'Loading categories...')} />;
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
                <Text style={styles.headerTitle}>{t('categories.title', 'Categories')}</Text>
                <View style={styles.headerRight} />
            </View>

            {error && !categories.length ? (
                <View style={styles.errorContainer}>
                    <Ionicons name="cloud-offline-outline" size={64} color={colors.textLight} />
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={fetchCategories}>
                        <Text style={styles.retryButtonText}>{t('common.try_again', 'Try Again')}</Text>
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
                        {categories.map((category) => (
                            <View key={category.id} style={styles.categoryWrapper}>
                                <CategoryCard
                                    category={category}
                                    onPress={() => handleCategoryPress(category)}
                                    size="large"
                                />
                                {category.products_count !== undefined && (
                                    <Text style={styles.productCount}>
                                        {t('categories.products_count', '{{count}} products').replace('{{count}}', String(category.products_count))}
                                    </Text>
                                )}
                            </View>
                        ))}
                    </View>

                    {categories.length === 0 && (
                        <View style={styles.emptyState}>
                            <Ionicons name="grid-outline" size={64} color={colors.textLight} />
                            <Text style={styles.emptyStateTitle}>{t('categories.empty_title', 'No categories yet')}</Text>
                            <Text style={styles.emptyStateText}>{t('categories.empty_subtitle', 'Categories will appear here')}</Text>
                        </View>
                    )}
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
    },
    categoryWrapper: {
        width: '33.33%',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    productCount: {
        fontSize: fontSize.xs,
        color: colors.textSecondary,
        marginTop: -spacing.sm,
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
