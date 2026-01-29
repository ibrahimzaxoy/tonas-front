import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    Image,
    ActivityIndicator,
    TouchableOpacity,
    StatusBar,
    FlatList
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../theme';
import { getVendorBySlug } from '../services/endpoints';
import { ProductCard, Loading } from '../components';
import type { Product, Vendor, RootStackParamList } from '../types';
import { useTranslation } from '../context';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function VendorStoreScreen() {
    const route = useRoute();
    const navigation = useNavigation<NavigationProp>();
    const { slug } = route.params as { slug: string };
    const { t } = useTranslation();

    const [vendor, setVendor] = useState<Vendor | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const mountedRef = useRef(true);

    useEffect(() => {
        const fetchVendorData = async () => {
            try {
                const data = await getVendorBySlug(slug);
                if (mountedRef.current) {
                    setVendor(data.vendor);
                    setProducts(data.products || []);
                }
            } catch (error: any) {
                const errorMessage = error.response?.status === 404
                    ? t('vendor.not_found', 'Vendor not found')
                    : t('vendor.load_failed', 'Failed to load vendor data');
                if (mountedRef.current) {
                    setError(errorMessage);
                }
            } finally {
                if (mountedRef.current) {
                    setIsLoading(false);
                }
            }
        };

        fetchVendorData();

        return () => {
            mountedRef.current = false;
        };
    }, [slug]);

    if (isLoading) {
        return <Loading />;
    }

    if (error || !vendor) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error || 'Vendor not found'}</Text>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Text style={styles.backText}>{t('common.go_back', 'Go Back')}</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Banner & Header */}
                <View style={styles.bannerContainer}>
                    <Image
                        source={{ uri: vendor.banner || 'https://via.placeholder.com/800x400' }}
                        style={styles.banner}
                        resizeMode="cover"
                    />
                    <View style={styles.overlay} />

                    {/* Header Content */}
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={24} color={colors.white} />
                    </TouchableOpacity>

                    <View style={styles.vendorHeader}>
                        <Image
                            source={{ uri: vendor.logo || 'https://via.placeholder.com/100' }}
                            style={styles.logo}
                        />
                        <View style={styles.headerInfo}>
                            <View style={styles.nameRow}>
                                <Text style={styles.vendorName}>{vendor.name}</Text>
                                {vendor.is_verified && (
                                    <Ionicons name="checkmark-circle" size={20} color={colors.success} style={{ marginLeft: 4 }} />
                                )}
                            </View>
                            <Text style={styles.vendorDescription} numberOfLines={2}>
                                {vendor.description}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Stats / Info Bar */}
                <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{products.length}</Text>
                        <Text style={styles.statLabel}>{t('products.title', 'Products')}</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>N/A</Text>
                        <Text style={styles.statLabel}>{t('vendor.rating', 'Rating')}</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>N/A</Text>
                        <Text style={styles.statLabel}>{t('vendor.positive', 'Positive')}</Text>
                    </View>
                </View>

                {/* Products Grid */}
                <View style={styles.productsSection}>
                    <Text style={styles.sectionTitle}>{t('vendor.all_products', 'All Products')}</Text>
                    <View style={styles.productsGrid}>
                        {products.map((product) => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                onPress={() => navigation.navigate('ProductDetail', { slug: product.slug })}
                            />
                        ))}
                    </View>
                    {products.length === 0 && (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>{t('products.empty', 'No products available')}</Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    bannerContainer: {
        height: 200,
        position: 'relative',
    },
    banner: {
        width: '100%',
        height: '100%',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    backButton: {
        position: 'absolute',
        top: 40,
        left: 20,
        zIndex: 10,
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    vendorHeader: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    logo: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 2,
        borderColor: colors.white,
    },
    headerInfo: {
        marginLeft: spacing.md,
        flex: 1,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    vendorName: {
        fontSize: fontSize.xl,
        fontWeight: fontWeight.bold,
        color: colors.white,
    },
    vendorDescription: {
        fontSize: fontSize.sm,
        color: 'rgba(255,255,255,0.9)',
        marginTop: 4,
    },
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: colors.white,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderLight,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statDivider: {
        width: 1,
        height: '60%',
        backgroundColor: colors.borderLight,
        alignSelf: 'center',
    },
    statValue: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        color: colors.textPrimary,
    },
    statLabel: {
        fontSize: fontSize.xs,
        color: colors.textSecondary,
        marginTop: 2,
    },
    productsSection: {
        padding: spacing.md,
    },
    sectionTitle: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        color: colors.textPrimary,
        marginBottom: spacing.md,
    },
    productsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    emptyContainer: {
        padding: spacing.xl,
        alignItems: 'center',
    },
    emptyText: {
        color: colors.textSecondary,
        fontSize: fontSize.md,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        fontSize: fontSize.lg,
        color: colors.textSecondary,
        marginBottom: spacing.md,
    },
    backText: {
        fontSize: fontSize.md,
        color: colors.primary,
        fontWeight: fontWeight.bold,
    },
});
