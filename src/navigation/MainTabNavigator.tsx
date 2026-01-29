import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, fontWeight } from '../theme';
import { useCart, useWishlist, useTranslation } from '../context';

import HomeScreen from '../screens/HomeScreen';
import CategoriesScreen from '../screens/CategoriesScreen';
import CartScreen from '../screens/CartScreen';
import WishlistScreen from '../screens/WishlistScreen';
import ProfileScreen from '../screens/ProfileScreen';

import type { MainTabParamList } from '../types';

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabNavigator() {
    const { itemsCount } = useCart();
    const { wishlistCount } = useWishlist();
    const { t } = useTranslation();

    const getBadgeCount = (routeName: string) => {
        if (routeName === 'Cart') return itemsCount;
        if (routeName === 'Wishlist') return wishlistCount;
        return 0;
    };

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName: keyof typeof Ionicons.glyphMap;

                    switch (route.name) {
                        case 'Home':
                            iconName = focused ? 'home' : 'home-outline';
                            break;
                        case 'Categories':
                            iconName = focused ? 'grid' : 'grid-outline';
                            break;
                        case 'Cart':
                            iconName = focused ? 'cart' : 'cart-outline';
                            break;
                        case 'Wishlist':
                            iconName = focused ? 'heart' : 'heart-outline';
                            break;
                        case 'Profile':
                            iconName = focused ? 'person' : 'person-outline';
                            break;
                        default:
                            iconName = 'ellipse';
                    }

                    const badgeCount = getBadgeCount(route.name);
                    const badgeText = badgeCount > 99 ? '99+' : `${badgeCount}`;

                    return (
                        <View style={styles.iconWrapper}>
                            <Ionicons name={iconName} size={22} color={color} />
                            {badgeCount > 0 && (
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>{badgeText}</Text>
                                </View>
                            )}
                        </View>
                    );
                },
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.tabBarInactive,
                tabBarLabelStyle: styles.tabBarLabel,
                tabBarStyle: styles.tabBar,
            })}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{ tabBarLabel: t('tabs.home', 'Home') }}
            />
            <Tab.Screen
                name="Categories"
                component={CategoriesScreen}
                options={{ tabBarLabel: t('tabs.categories', 'Categories') }}
            />
            <Tab.Screen
                name="Cart"
                component={CartScreen}
                options={{ tabBarLabel: t('tabs.cart', 'Cart') }}
            />
            <Tab.Screen
                name="Wishlist"
                component={WishlistScreen}
                options={{ tabBarLabel: t('tabs.wishlist', 'Wishlist') }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{ tabBarLabel: t('tabs.profile', 'Profile') }}
            />
        </Tab.Navigator>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        backgroundColor: colors.white,
        borderTopWidth: 1,
        borderTopColor: colors.borderLight,
        paddingTop: 8,
        paddingBottom: 8,
        height: 60,
    },
    tabBarLabel: {
        fontSize: fontSize.xs,
        fontWeight: fontWeight.medium,
        marginTop: 2,
    },
    iconWrapper: {
        position: 'relative',
        width: 28,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    badge: {
        position: 'absolute',
        top: -6,
        right: -12,
        minWidth: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: colors.error,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 3,
    },
    badgeText: {
        color: colors.white,
        fontSize: 10,
        fontWeight: fontWeight.bold,
    },
});
