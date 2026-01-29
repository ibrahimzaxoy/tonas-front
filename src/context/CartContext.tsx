import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { getCart, addToCart as apiAddToCart, updateCartItem, removeFromCart, clearCart as apiClearCart } from '../services/endpoints';
import { useAuth } from './AuthContext';
import type { Cart, CartItem } from '../types';

interface CartContextType {
    cart: Cart | null;
    isLoading: boolean;
    itemsCount: number;
    addToCart: (productId: number, variantId?: number, quantity?: number) => Promise<void>;
    updateQuantity: (itemId: number, quantity: number) => Promise<void>;
    removeItem: (itemId: number) => Promise<void>;
    clearCart: () => Promise<void>;
    refreshCart: () => Promise<void>;
    syncCart: (cartData: Cart) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const emptyCart: Cart = {
    items: [],
    items_count: 0,
    subtotal: '0.00',
    total: '0.00',
};

export function CartProvider({ children }: { children: ReactNode }) {
    const { isAuthenticated } = useAuth();
    const [cart, setCart] = useState<Cart | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const refreshCart = useCallback(async () => {
        if (!isAuthenticated) {
            setCart(emptyCart);
            return;
        }

        try {
            setIsLoading(true);
            const cartData = await getCart();
            setCart(cartData);
        } catch (error) {
            console.error('Failed to fetch cart:', error);
            setCart(emptyCart);
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        refreshCart();
    }, [refreshCart]);

    const addToCart = async (productId: number, variantId?: number, quantity: number = 1) => {
        try {
            setIsLoading(true);
            const updatedCart = await apiAddToCart(productId, variantId, quantity);
            setCart(updatedCart);
        } catch (error) {
            console.error('Failed to add to cart:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const updateQuantity = async (itemId: number, quantity: number) => {
        try {
            setIsLoading(true);
            const updatedCart = await updateCartItem(itemId, quantity);
            setCart(updatedCart);
        } catch (error) {
            console.error('Failed to update cart:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const removeItem = async (itemId: number) => {
        try {
            setIsLoading(true);
            const updatedCart = await removeFromCart(itemId);
            setCart(updatedCart);
        } catch (error) {
            console.error('Failed to remove from cart:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const clearCart = async () => {
        try {
            setIsLoading(true);
            await apiClearCart();
            setCart(emptyCart);
        } catch (error) {
            console.error('Failed to clear cart:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <CartContext.Provider
            value={{
                cart,
                isLoading,
                itemsCount: cart?.items_count || 0,
                addToCart,
                updateQuantity,
                removeItem,
                clearCart,
                refreshCart,
                syncCart: setCart,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
