import React, { useState } from 'react';
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
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, fontSize, fontWeight, borderRadius, shadows } from '../theme';
import { Loading } from '../components';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context';

interface MenuItem {
    id: string;
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    showChevron?: boolean;
    onPress?: () => void;
}

export default function ProfileScreen() {
    const navigation = useNavigation();
    const { user, isAuthenticated, logout, refreshUser, isLoading: authLoading } = useAuth();
    const { t, locale, setLocale } = useTranslation();
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await refreshUser();
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleLogout = async () => {
        // On web, Alert.alert can be tricky with some browsers blocking it or styling issues
        // We'll use window.confirm for web, or just proceed
        if (Platform.OS === 'web') {
            const confirmed = window.confirm(t('profile.logout_confirm', 'Are you sure you want to logout?'));
            if (confirmed) {
                await performLogout();
            }
        } else {
            Alert.alert(
                t('profile.logout', 'Logout'),
                t('profile.logout_confirm', 'Are you sure you want to logout?'),
                [
                    { text: t('common.cancel', 'Cancel'), style: 'cancel' },
                    {
                        text: t('profile.logout', 'Logout'),
                        style: 'destructive',
                        onPress: performLogout,
                    },
                ]
            );
        }
    };

    const performLogout = async () => {
        try {
            await logout();
            // Reset navigation to ensure clean state
            navigation.reset({ index: 0, routes: [{ name: 'Main' as never }] });
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const menuItems: MenuItem[] = [
        {
            id: 'profile',
            icon: 'person-outline',
            label: t('profile.edit', 'Edit Profile'),
            showChevron: true,
            onPress: () => Alert.alert(t('profile.edit', 'Edit Profile'), t('common.coming_soon', 'Coming soon!'))
        },
        {
            id: 'orders',
            icon: 'receipt-outline',
            label: t('orders.history', 'Order History'),
            showChevron: true,
            onPress: () => navigation.navigate('OrderHistory' as never)
        },
        {
            id: 'addresses',
            icon: 'location-outline',
            label: t('address.add_new', 'Add New Address'),
            showChevron: true,
            onPress: () => navigation.navigate('AddAddress' as never)
        },
        {
            id: 'wishlist',
            icon: 'heart-outline',
            label: t('wishlist.title', 'Wishlist'),
            showChevron: true,
            onPress: () => navigation.navigate('Wishlist' as never)
        },
        {
            id: 'settings',
            icon: 'settings-outline',
            label: t('profile.settings', 'Settings'),
            showChevron: true,
            onPress: () => Alert.alert(t('profile.settings', 'Settings'), t('common.coming_soon', 'Coming soon!'))
        },
    ];

    if (authLoading) {
        return <Loading message={t('profile.loading', 'Loading profile...')} />;
    }

    if (!isAuthenticated) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
                <View style={styles.header}>
                    <View style={styles.backButton} />
                    <Text style={styles.headerTitle}>{t('profile.title', 'Profile')}</Text>
                    <View style={styles.headerRight} />
                </View>
                <View style={styles.profileSection}>
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatar}>
                            <Ionicons name="person" size={40} color={colors.primary} />
                        </View>
                    </View>
                    <Text style={styles.guestTitle}>{t('profile.guest_title', 'Welcome, Guest!')}</Text>
                    <Text style={styles.guestSubtitle}>{t('profile.guest_subtitle', 'Sign in to access your account')}</Text>
                </View>
                <View style={styles.authButtons}>
                    <TouchableOpacity
                        style={styles.signInButton}
                        onPress={() => navigation.navigate('Login' as never)}
                    >
                        <Text style={styles.signInButtonText}>{t('auth.sign_in', 'Sign In')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.registerButton}
                        onPress={() => navigation.navigate('Register' as never)}
                    >
                        <Text style={styles.registerButtonText}>{t('auth.create_account', 'Create Account')}</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

            {/* Orange Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={24} color={colors.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('profile.title', 'Profile')}</Text>
                <View style={styles.headerRight} />
            </View>

            {/* Profile Section */}
            <View style={styles.profileSection}>
                <View style={styles.avatarContainer}>
                    <View style={styles.avatar}>
                        {user?.avatar ? (
                            <Image
                                source={{ uri: user.avatar }}
                                style={styles.avatarImage}
                                resizeMode="cover"
                            />
                        ) : (
                            <Ionicons name="person" size={40} color={colors.primary} />
                        )}
                    </View>
                </View>
                <Text style={styles.userName}>{user?.name || t('profile.user_name', 'User Name')}</Text>
                <Text style={styles.userEmail}>{user?.email || t('profile.user_email', 'email@example.com')}</Text>
            </View>

            {/* Menu Items */}
            <ScrollView
                style={styles.menuContainer}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={handleRefresh}
                        colors={[colors.primary]}
                        tintColor={colors.primary}
                    />
                }
            >
                {menuItems.map((item) => (
                    <TouchableOpacity
                        key={item.id}
                        style={styles.menuItem}
                        activeOpacity={0.7}
                        onPress={item.onPress}
                    >
                        <View style={styles.menuItemLeft}>
                            <Ionicons
                                name={item.icon}
                                size={22}
                                color={colors.textSecondary}
                            />
                            <Text style={styles.menuItemLabel}>{item.label}</Text>
                        </View>
                        {item.showChevron && (
                            <Ionicons
                                name="chevron-forward"
                                size={22}
                                color={colors.textLight}
                            />
                        )}
                    </TouchableOpacity>
                ))}

                {/* Language Selector */}
                <View style={styles.languageSection}>
                    <Text style={styles.languageTitle}>{t('profile.language', 'Language')}</Text>
                    <View style={styles.languageOptions}>
                        {[
                            { code: 'en', label: t('languages.en', 'English') },
                            { code: 'ar', label: t('languages.ar', 'Arabic') },
                            { code: 'ku_sorani', label: t('languages.ku_sorani', 'Kurdish (Sorani)') },
                            { code: 'ku_badini', label: t('languages.ku_badini', 'Kurdish (Badini)') },
                        ].map((option) => (
                            <TouchableOpacity
                                key={option.code}
                                style={[
                                    styles.languageChip,
                                    locale === option.code && styles.languageChipActive,
                                ]}
                                onPress={() => setLocale(option.code as any)}
                            >
                                <Text
                                    style={[
                                        styles.languageChipText,
                                        locale === option.code && styles.languageChipTextActive,
                                    ]}
                                >
                                    {option.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Become a Seller Button */}
                {!user?.is_vendor && (
                    <TouchableOpacity
                        style={styles.becomeSellerButton}
                        onPress={() => navigation.navigate('BecomeSeller' as never)}
                    >
                        <Ionicons name="briefcase-outline" size={22} color={colors.white} />
                        <Text style={styles.becomeSellerText}>{t('profile.become_seller', 'Become a Seller')}</Text>
                    </TouchableOpacity>
                )}

                {/* Seller Dashboard Button */}
                {user?.is_vendor && (
                    <TouchableOpacity
                        style={[styles.becomeSellerButton, { backgroundColor: colors.info }]}
                        onPress={() => navigation.navigate('SellerDashboard' as never)}
                    >
                        <Ionicons name="storefront-outline" size={22} color={colors.white} />
                        <Text style={styles.becomeSellerText}>{t('profile.seller_dashboard', 'Seller Dashboard')}</Text>
                    </TouchableOpacity>
                )}

                {/* Logout Button */}
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={22} color={colors.error} />
                    <Text style={styles.logoutText}>{t('profile.logout', 'Logout')}</Text>
                </TouchableOpacity>

                {/* App Version */}
                <Text style={styles.versionText}>{t('profile.version', 'Version 1.0.0')}</Text>
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
        paddingVertical: spacing.md,
        backgroundColor: colors.primary,
    },
    backButton: {
        width: 40,
    },
    headerTitle: {
        fontSize: fontSize.xl,
        fontWeight: fontWeight.bold,
        color: colors.white,
    },
    headerRight: {
        width: 40,
    },
    profileSection: {
        backgroundColor: colors.primary,
        alignItems: 'center',
        paddingBottom: spacing.xl,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    avatarContainer: {
        marginBottom: spacing.md,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.white,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    userName: {
        fontSize: fontSize.xxl,
        fontWeight: fontWeight.bold,
        color: colors.white,
        marginBottom: spacing.xs,
    },
    userEmail: {
        fontSize: fontSize.md,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    guestTitle: {
        fontSize: fontSize.xxl,
        fontWeight: fontWeight.bold,
        color: colors.white,
        marginBottom: spacing.xs,
    },
    guestSubtitle: {
        fontSize: fontSize.md,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    authButtons: {
        padding: spacing.xl,
        gap: spacing.md,
    },
    signInButton: {
        backgroundColor: colors.primary,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
    },
    signInButtonText: {
        color: colors.white,
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
    },
    registerButton: {
        backgroundColor: colors.white,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.primary,
    },
    registerButtonText: {
        color: colors.primary,
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
    },
    menuContainer: {
        flex: 1,
        paddingHorizontal: spacing.md,
        paddingTop: spacing.xl,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.white,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.sm,
        ...shadows.sm,
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuItemLabel: {
        fontSize: fontSize.md,
        color: colors.textPrimary,
        marginLeft: spacing.md,
        fontWeight: fontWeight.medium,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.md,
        marginTop: spacing.lg,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.error,
    },
    logoutText: {
        fontSize: fontSize.md,
        color: colors.error,
        marginLeft: spacing.sm,
        fontWeight: fontWeight.semibold,
    },
    versionText: {
        textAlign: 'center',
        color: colors.textLight,
        fontSize: fontSize.sm,
        marginTop: spacing.xl,
        marginBottom: spacing.xl,
    },
    becomeSellerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.md,
        borderRadius: borderRadius.lg,
        backgroundColor: colors.success,
        marginTop: spacing.md,
        marginBottom: spacing.xs,
        ...shadows.sm,
    },
    becomeSellerText: {
        fontSize: fontSize.md,
        color: colors.white,
        marginLeft: spacing.sm,
        fontWeight: fontWeight.bold,
    },
    languageSection: {
        marginTop: spacing.md,
        marginBottom: spacing.sm,
    },
    languageTitle: {
        fontSize: fontSize.md,
        color: colors.textPrimary,
        marginBottom: spacing.sm,
        fontWeight: fontWeight.semibold,
    },
    languageOptions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
    },
    languageChip: {
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.full,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.white,
    },
    languageChipActive: {
        borderColor: colors.primary,
        backgroundColor: 'rgba(230, 126, 34, 0.1)',
    },
    languageChipText: {
        color: colors.textSecondary,
        fontSize: fontSize.sm,
    },
    languageChipTextActive: {
        color: colors.primary,
        fontWeight: fontWeight.semibold,
    },
});
