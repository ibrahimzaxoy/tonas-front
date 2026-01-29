import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import MainTabNavigator from './MainTabNavigator';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import CategoryProductsScreen from '../screens/CategoryProductsScreen';

import SearchScreen from '../screens/SearchScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import OrderSuccessScreen from '../screens/OrderSuccessScreen';
import OrderHistoryScreen from '../screens/OrderHistoryScreen';
import OrderDetailScreen from '../screens/OrderDetailScreen';
import AddAddressScreen from '../screens/AddAddressScreen';
import VendorStoreScreen from '../screens/VendorStoreScreen';
import BecomeSellerScreen from '../screens/BecomeSellerScreen';
import SellerDashboardScreen from '../screens/SellerDashboardScreen';
import AddProductScreen from '../screens/AddProductScreen';
import SellerOrdersScreen from '../screens/SellerOrdersScreen';
import SellerProductsScreen from '../screens/SellerProductsScreen';
import SellerStoreProfileScreen from '../screens/SellerStoreProfileScreen';
import SellerCouponsScreen from '../screens/SellerCouponsScreen';

import type { RootStackParamList } from '../types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
    return (
        <NavigationContainer>
            <Stack.Navigator
                screenOptions={{
                    headerShown: false,
                }}
            >
                <Stack.Screen name="Main" component={MainTabNavigator} />
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Register" component={RegisterScreen} />
                <Stack.Screen name="BecomeSeller" component={BecomeSellerScreen} />
                <Stack.Screen name="SellerDashboard" component={SellerDashboardScreen} />
                <Stack.Screen name="AddProduct" component={AddProductScreen} />
                <Stack.Screen name="SellerOrders" component={SellerOrdersScreen} />
                <Stack.Screen name="SellerProducts" component={SellerProductsScreen} />
                <Stack.Screen name="SellerStoreProfile" component={SellerStoreProfileScreen} />
                <Stack.Screen name="SellerCoupons" component={SellerCouponsScreen} />
                <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
                <Stack.Screen name="VendorStore" component={VendorStoreScreen} />
                <Stack.Screen name="CategoryProducts" component={CategoryProductsScreen} />
                <Stack.Screen name="Search" component={SearchScreen} />
                <Stack.Screen name="Checkout" component={CheckoutScreen} />
                <Stack.Screen name="OrderSuccess" component={OrderSuccessScreen} />
                <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} />
                <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
                <Stack.Screen name="AddAddress" component={AddAddressScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
