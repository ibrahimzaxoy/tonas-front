import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { colors, spacing, fontSize } from '../theme';

interface LoadingProps {
    message?: string;
    fullScreen?: boolean;
}

export default function Loading({ message, fullScreen = true }: LoadingProps) {
    if (!fullScreen) {
        return (
            <View style={styles.inline}>
                <ActivityIndicator size="small" color={colors.primary} />
                {message && <Text style={styles.inlineMessage}>{message}</Text>}
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color={colors.primary} />
            {message && <Text style={styles.message}>{message}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },
    message: {
        marginTop: spacing.md,
        fontSize: fontSize.md,
        color: colors.textSecondary,
    },
    inline: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.md,
    },
    inlineMessage: {
        marginLeft: spacing.sm,
        fontSize: fontSize.sm,
        color: colors.textSecondary,
    },
});
