import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, CartProvider, LocalizationProvider, WishlistProvider } from './src/context';
import ErrorBoundary from './src/components/ErrorBoundary';
import RootNavigator from './src/navigation';

export default function App() {
  return (
    <LocalizationProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <StatusBar style="auto" />
            <ErrorBoundary>
              <RootNavigator />
            </ErrorBoundary>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </LocalizationProvider>
  );
}
