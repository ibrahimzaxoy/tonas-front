// src/screens/SearchScreen.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TextInput,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    StatusBar,
    Alert,
    Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { colors, spacing, fontSize, fontWeight, borderRadius, shadows } from '../theme';
import { ProductCard } from '../components';
import { getWishlist, searchProducts, toggleWishlist } from '../services/endpoints';
import type { Product } from '../types';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context';
import { useTranslation } from '../context';

export default function SearchScreen() {
    const navigation = useNavigation();
    const { isAuthenticated } = useAuth();
    const { setWishlistCount } = useWishlist();
    const { t } = useTranslation();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [wishlistIds, setWishlistIds] = useState<Set<number>>(new Set());
    const searchTimeout = useRef<NodeJS.Timeout | null>(null);
    const inputRef = useRef<TextInput>(null);

    useEffect(() => {
        // Focus input on mount
        const timer = setTimeout(() => {
            inputRef.current?.focus();
        }, 100);
        return () => clearTimeout(timer);
    }, []);

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

    const performSearch = useCallback(async (text: string) => {
        if (!text.trim()) {
            setResults([]);
            setHasSearched(false);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setHasSearched(true);

        try {
            const response = await searchProducts(text);
            const data = response.data || [];
            // Handle pagination wrapper if response.data is paginated object
            // Assuming endpoints.ts returns PaginatedResponse<Product> so response.data is Product[]
            // Actually searchProducts returns PaginatedResponse<Product>, so we need response.data
            setResults(data);
        } catch (error) {
            console.error('Search failed:', error);
            // Optionally show error state
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleTextChange = (text: string) => {
        setQuery(text);

        if (searchTimeout.current) {
            clearTimeout(searchTimeout.current);
        }

        if (text.trim().length > 2) {
            searchTimeout.current = setTimeout(() => {
                performSearch(text);
            }, 600); // 600ms debounce
        } else if (text.trim().length === 0) {
            setResults([]);
            setHasSearched(false);
            setIsLoading(false);
        }
    };

    const handleSubmit = () => {
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        performSearch(query);
    };

    const handleClear = () => {
        setQuery('');
        setResults([]);
        setHasSearched(false);
        inputRef.current?.focus();
    };

    const handleProductPress = (product: Product) => {
        navigation.navigate('ProductDetail' as never, { slug: product.slug } as never);
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

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

            {/* Search Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color={colors.textLight} style={styles.searchIcon} />
                    <TextInput
                        ref={inputRef}
                        style={styles.input}
                        placeholder={t('search.placeholder_products', 'Search products...')}
                        placeholderTextColor={colors.textLight}
                        value={query}
                        onChangeText={handleTextChange}
                        onSubmitEditing={handleSubmit}
                        returnKeyType="search"
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                    {query.length > 0 && (
                        <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
                            <Ionicons name="close-circle" size={18} color={colors.textLight} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Results */}
            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={results}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                        <ProductCard
                            product={item}
                            onPress={() => handleProductPress(item)}
                            onWishlistPress={() => handleWishlistToggle(item)}
                            isInWishlist={wishlistIds.has(item.id)}
                            style={styles.card}
                        />
                    )}
                    numColumns={2}
                    contentContainerStyle={styles.listContent}
                    columnWrapperStyle={styles.columnWrapper}
                    ListEmptyComponent={
                        hasSearched && query.length > 2 ? (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="search-outline" size={64} color={colors.textLight} />
                                <Text style={styles.emptyTitle}>{t('search.no_results', 'No results found')}</Text>
                                <Text style={styles.emptySubtitle}>{t('search.adjust_terms', 'Try adjusting your search terms')}</Text>
                            </View>
                        ) : (
                            !hasSearched ? (
                                <View style={styles.emptyContainer}>
                                    <Ionicons name="pricetags-outline" size={64} color={colors.textLight} />
                                    <Text style={styles.emptySubtitle}>{t('search.hint', 'Search for items by name, category, or brand')}</Text>
                                </View>
                            ) : null
                        )
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
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderLight,
    },
    backButton: {
        padding: spacing.sm,
        marginRight: spacing.xs,
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background,
        borderRadius: borderRadius.lg,
        paddingHorizontal: spacing.sm,
        height: 44,
    },
    searchIcon: {
        marginLeft: spacing.xs,
    },
    input: {
        flex: 1,
        fontSize: fontSize.md,
        color: colors.textPrimary,
        marginLeft: spacing.sm,
        height: '100%',
    },
    clearButton: {
        padding: spacing.xs,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: spacing.sm,
        paddingTop: spacing.md,
    },
    columnWrapper: {
        justifyContent: 'space-between',
        marginBottom: spacing.md,
    },
    card: {
        width: '48%', // Ensure 2 columns fit
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.xxl,
        marginTop: spacing.xl,
    },
    emptyTitle: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        color: colors.textPrimary,
        marginTop: spacing.md,
    },
    emptySubtitle: {
        fontSize: fontSize.md,
        color: colors.textSecondary,
        marginTop: spacing.sm,
        textAlign: 'center',
    },
});
