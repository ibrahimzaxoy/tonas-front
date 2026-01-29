// src/screens/OrderSuccessScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, RouteProp, useRoute } from '@react-navigation/native';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../theme';
import type { RootStackParamList } from '../types';
import { useTranslation } from '../context';

type OrderSuccessRouteProp = RouteProp<RootStackParamList, 'OrderSuccess'>;

export default function OrderSuccessScreen() {
    const navigation = useNavigation();
    const route = useRoute<OrderSuccessRouteProp>();
    const { orderId } = route.params;
    const { t } = useTranslation();

    const handleContinueShopping = () => {
        navigation.navigate('Main' as never);
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
            <View style={styles.content}>
                <Ionicons name="checkmark-circle" size={96} color={colors.success} />
                <Text style={styles.title}>{t('orders.placed', 'Order Placed!')}</Text>
                <Text style={styles.message}>
                    {t('orders.placed_message', 'Your order #{{id}} has been successfully placed.')
                        .replace('{{id}}', String(orderId))}
                </Text>
                <TouchableOpacity style={styles.button} onPress={handleContinueShopping}>
                    <Text style={styles.buttonText}>{t('orders.continue_shopping', 'Continue Shopping')}</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.white },
    content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
    title: { fontSize: fontSize.xxxl, fontWeight: fontWeight.bold, color: colors.textPrimary, marginTop: spacing.md },
    message: { fontSize: fontSize.md, color: colors.textSecondary, textAlign: 'center', marginVertical: spacing.md },
    button: { backgroundColor: colors.primary, paddingVertical: spacing.md, paddingHorizontal: spacing.xl, borderRadius: borderRadius.lg, marginTop: spacing.lg },
    buttonText: { color: colors.white, fontSize: fontSize.lg, fontWeight: fontWeight.bold },
});
