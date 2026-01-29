import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getWishlist } from '../services/endpoints';
import { useAuth } from './AuthContext';

interface WishlistContextType {
    wishlistCount: number;
    isLoading: boolean;
    refreshWishlist: () => Promise<void>;
    setWishlistCount: (count: number) => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
    const { isAuthenticated } = useAuth();
    const [wishlistCount, setWishlistCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    const refreshWishlist = useCallback(async () => {
        if (!isAuthenticated) {
            setWishlistCount(0);
            return;
        }

        try {
            setIsLoading(true);
            const items = await getWishlist();
            setWishlistCount(items.length);
        } catch (error) {
            console.error('Failed to fetch wishlist:', error);
            setWishlistCount(0);
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        refreshWishlist();
    }, [refreshWishlist]);

    return (
        <WishlistContext.Provider
            value={{
                wishlistCount,
                isLoading,
                refreshWishlist,
                setWishlistCount,
            }}
        >
            {children}
        </WishlistContext.Provider>
    );
}

export function useWishlist() {
    const context = useContext(WishlistContext);
    if (!context) {
        throw new Error('useWishlist must be used within a WishlistProvider');
    }
    return context;
}
