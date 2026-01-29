import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, spacing, fontSize, fontWeight } from '../theme';

interface ErrorBoundaryState {
    hasError: boolean;
    message: string;
    stack?: string;
}

export default class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
    state: ErrorBoundaryState = {
        hasError: false,
        message: '',
        stack: undefined,
    };

    static getDerivedStateFromError(error: Error) {
        return {
            hasError: true,
            message: error.message || 'Unexpected error',
        };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error('ErrorBoundary caught:', error);
        console.error('Component stack:', info.componentStack);
        this.setState({
            stack: info.componentStack,
        });
    }

    render() {
        if (!this.state.hasError) {
            return this.props.children;
        }

        return (
            <View style={styles.container}>
                <Text style={styles.title}>App Error</Text>
                <Text style={styles.message}>{this.state.message}</Text>
                {this.state.stack ? (
                    <ScrollView style={styles.stackContainer}>
                        <Text style={styles.stackText}>{this.state.stack}</Text>
                    </ScrollView>
                ) : null}
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.white,
        padding: spacing.lg,
        justifyContent: 'center',
    },
    title: {
        fontSize: fontSize.xl,
        fontWeight: fontWeight.bold,
        color: colors.error,
        marginBottom: spacing.md,
        textAlign: 'center',
    },
    message: {
        fontSize: fontSize.md,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: spacing.md,
    },
    stackContainer: {
        marginTop: spacing.md,
        maxHeight: 240,
        backgroundColor: colors.background,
        borderRadius: 8,
        padding: spacing.md,
    },
    stackText: {
        fontSize: fontSize.xs,
        color: colors.textSecondary,
    },
});
