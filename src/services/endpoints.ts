import api from './api';
import type {
    Address,
    Cart,
    Category,
    Coupon,
    HomeResponse,
    Order,
    PaginatedResponse,
    Product,
    User,
    Vendor,
} from '../types';
import {
    normalizeAddress,
    normalizeCart,
    normalizeCategory,
    normalizeCoupon,
    normalizeOrder,
    normalizeProduct,
    normalizeSellerOrders,
    normalizeSlide,
    normalizeUser,
    normalizeVendor,
    unwrapResource,
} from './normalizers';

const unwrapCollection = (value: any): any[] => {
    if (Array.isArray(value)) return value;
    if (value && Array.isArray(value.data)) return value.data;
    return [];
};

// ============ HOME ============
export const getHome = async (): Promise<HomeResponse> => {
    const response = await api.get('/home');
    const data = response.data ?? {};
    return {
        slides: unwrapCollection(data.slides).map(normalizeSlide),
        categories: unwrapCollection(data.categories).map(normalizeCategory),
        new_arrivals: unwrapCollection(data.new_arrivals).map(normalizeProduct),
        featured_products: unwrapCollection(data.featured ?? data.featured_products).map(normalizeProduct),
        popular_products: unwrapCollection(data.popular_products).map(normalizeProduct),
    };
};

// ============ CATEGORIES ============
export const getCategories = async (): Promise<Category[]> => {
    const response = await api.get('/categories');
    return unwrapCollection(response.data).map(normalizeCategory);
};

export const getCategoryBySlug = async (slug: string): Promise<{ category: Category; products: Product[] }> => {
    const response = await api.get(`/categories/${slug}`);
    const data = response.data ?? {};
    return {
        category: normalizeCategory(unwrapResource(data.category) ?? {}),
        products: unwrapCollection(data.products).map(normalizeProduct),
    };
};

// ============ PRODUCTS ============
interface ProductFilters {
    category_id?: number;
    vendor_id?: number;
    min_price?: number;
    max_price?: number;
    q?: string;
    sort_by?: 'price' | 'name' | 'created_at';
    sort_order?: 'asc' | 'desc';
    per_page?: number;
    page?: number;
}

export const getProducts = async (filters: ProductFilters = {}): Promise<PaginatedResponse<Product>> => {
    const response = await api.get('/products', { params: filters });
    const payload = response.data ?? {};
    const data = unwrapCollection(payload).map(normalizeProduct);
    const meta = payload.meta ?? payload.pagination ?? {};

    return {
        data,
        meta: {
            current_page: meta.current_page ?? 1,
            last_page: meta.last_page ?? 1,
            per_page: meta.per_page ?? data.length,
            total: meta.total ?? data.length,
        },
    };
};

export const searchProducts = async (query: string): Promise<PaginatedResponse<Product>> => {
    const response = await api.get('/products/search', { params: { q: query } });
    const payload = response.data ?? {};
    const data = unwrapCollection(payload).map(normalizeProduct);
    const meta = payload.meta ?? payload.pagination ?? {};

    return {
        data,
        meta: {
            current_page: meta.current_page ?? 1,
            last_page: meta.last_page ?? 1,
            per_page: meta.per_page ?? data.length,
            total: meta.total ?? data.length,
        },
    };
};

export const getProductBySlug = async (slug: string): Promise<{ product: Product; related: Product[] }> => {
    const response = await api.get(`/products/${slug}`);
    const data = response.data ?? {};
    return {
        product: normalizeProduct(unwrapResource(data.product) ?? data),
        related: unwrapCollection(data.related).map(normalizeProduct),
    };
};

// ============ CART ============
export const getCart = async (): Promise<Cart> => {
    const response = await api.get('/cart');
    return normalizeCart(response.data);
};

export const addToCart = async (productId: number, variantId?: number, quantity: number = 1): Promise<Cart> => {
    await api.post('/cart', {
        product_id: productId,
        variant_id: variantId,
        quantity,
    });
    return getCart();
};

export const updateCartItem = async (itemId: number, quantity: number): Promise<Cart> => {
    await api.put(`/cart/${itemId}`, { quantity });
    return getCart();
};

export const removeFromCart = async (itemId: number): Promise<Cart> => {
    await api.delete(`/cart/${itemId}`);
    return getCart();
};

export const clearCart = async (): Promise<void> => {
    await api.delete('/cart');
};

export const applyCoupon = async (code: string): Promise<Cart> => {
    const [cartResponse, couponResponse] = await Promise.all([
        api.get('/cart'),
        api.post('/cart/coupon', { code }),
    ]);
    const cart = normalizeCart(cartResponse.data);
    const couponData = couponResponse.data ?? {};

    return {
        ...cart,
        subtotal: String(couponData.subtotal ?? cart.subtotal),
        total: String(couponData.total ?? cart.total),
    };
};

// ============ WISHLIST ============
export const getWishlist = async (): Promise<Product[]> => {
    const response = await api.get('/wishlist');
    const data = response.data ?? {};
    return unwrapCollection(data.products).map(normalizeProduct);
};

export const addToWishlist = async (productId: number): Promise<void> => {
    await api.post('/wishlist', { product_id: productId });
};

export const toggleWishlist = async (productId: number): Promise<{ added: boolean }> => {
    const response = await api.post('/wishlist/toggle', { product_id: productId });
    return { added: !!response.data?.wishlisted };
};

export const removeFromWishlist = async (productId: number): Promise<void> => {
    await api.delete(`/wishlist/${productId}`);
};

// ============ AUTH ============
interface LoginCredentials {
    email: string;
    password: string;
}

interface RegisterData {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
}

interface AuthResponse {
    user: User;
    token: string;
}

export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post('/login', credentials);
    return response.data;
};

export const register = async (data: RegisterData): Promise<AuthResponse> => {
    const response = await api.post('/register', data);
    return response.data;
};

export const logout = async (): Promise<void> => {
    await api.post('/logout');
};

export const verifyTwoFactor = async (email: string, code: string): Promise<AuthResponse> => {
    const response = await api.post('/verify-2fa', { email, code });
    return response.data;
};

// ============ PROFILE ============
export const getProfile = async (): Promise<User> => {
    const response = await api.get('/profile');
    return normalizeUser(unwrapResource(response.data));
};

export const updateProfile = async (data: Partial<User>): Promise<User> => {
    const response = await api.put('/profile', data);
    return normalizeUser(response.data?.user ?? unwrapResource(response.data));
};

export const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    await api.put('/profile/password', {
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: newPassword,
    });
};

// ============ ADDRESSES ============
export const getAddresses = async (): Promise<Address[]> => {
    const response = await api.get('/addresses');
    return unwrapCollection(response.data).map(normalizeAddress);
};

export const createAddress = async (address: Omit<Address, 'id' | 'full_address'>): Promise<Address> => {
    const response = await api.post('/addresses', address);
    return normalizeAddress(response.data?.address ?? unwrapResource(response.data));
};

export const updateAddress = async (id: number, address: Partial<Address>): Promise<Address> => {
    const response = await api.put(`/addresses/${id}`, address);
    return normalizeAddress(response.data?.address ?? unwrapResource(response.data));
};

export const deleteAddress = async (id: number): Promise<void> => {
    await api.delete(`/addresses/${id}`);
};

export const setDefaultAddress = async (id: number): Promise<Address> => {
    const response = await api.post(`/addresses/${id}/default`);
    return normalizeAddress(response.data?.address ?? unwrapResource(response.data));
};

// ============ ORDERS ============
export const getOrders = async (): Promise<Order[]> => {
    const response = await api.get('/orders');
    return unwrapCollection(response.data).map(normalizeOrder);
};

export const createOrder = async (addressId: number, paymentMethod: string = 'cod'): Promise<Order[]> => {
    const response = await api.post('/orders', {
        address_id: addressId,
        payment_method: paymentMethod,
    });
    return unwrapCollection(response.data?.orders).map(normalizeOrder);
};

export const getOrderById = async (id: number): Promise<Order> => {
    const response = await api.get(`/orders/${id}`);
    return normalizeOrder(unwrapResource(response.data));
};

export const cancelOrder = async (id: number): Promise<Order> => {
    const response = await api.post(`/orders/${id}/cancel`);
    return normalizeOrder(response.data?.order ?? unwrapResource(response.data));
};

// ============ VENDORS ============
export const getVendors = async (): Promise<Vendor[]> => {
    const response = await api.get('/vendors');
    return unwrapCollection(response.data).map(normalizeVendor);
};

export const getVendorBySlug = async (slug: string): Promise<{ vendor: Vendor; products: Product[] }> => {
    const response = await api.get(`/vendors/${slug}`);
    const data = response.data ?? {};
    return {
        vendor: normalizeVendor(unwrapResource(data.vendor) ?? {}),
        products: unwrapCollection(data.products).map(normalizeProduct),
    };
};

// NOTE: According to backend docs, vendor registration may require admin approval.
// This endpoint submits a vendor application. The backend may not have this route yet.
export const becomeVendor = async (data: {
    store_name: string;
    description?: string;
    profile_image?: string;
    cover_image?: string;
}): Promise<any> => {
    const response = await api.post('/vendors', data);
    return response.data?.vendor ? normalizeVendor(response.data.vendor) : response.data;
};

// ============ SELLER DASHBOARD ============
// These endpoints are for authenticated vendors (after becoming a seller)
export const sellerLogin = async (credentials: { email: string; password: string }): Promise<{ user: User; token: string }> => {
    const response = await api.post('/seller/login', credentials);
    return response.data;
};

export const getSellerDashboard = async (): Promise<any> => {
    const response = await api.get('/seller/dashboard');
    return response.data;
};

export const getSellerProfile = async (): Promise<{ user: User; vendor: Vendor }> => {
    const response = await api.get('/seller/me');
    return {
        user: normalizeUser(response.data?.user ?? {}),
        vendor: normalizeVendor(response.data?.vendor ?? {}),
    };
};

export const updateSellerProfile = async (data: FormData): Promise<Vendor> => {
    const response = await api.post('/seller/profile', data);
    return normalizeVendor(response.data?.vendor ?? response.data);
};

export const getSellerProducts = async (): Promise<Product[]> => {
    const response = await api.get('/seller/products');
    return unwrapCollection(response.data).map(normalizeProduct);
};

export const getSellerProductById = async (id: number): Promise<Product> => {
    const response = await api.get(`/seller/products/${id}`);
    return normalizeProduct(unwrapResource(response.data) ?? response.data);
};

export const deleteSellerProduct = async (id: number): Promise<void> => {
    await api.delete(`/seller/products/${id}`);
};

export const createSellerProduct = async (productData: FormData): Promise<any> => {
    const response = await api.post('/seller/products', productData);
    return response.data;
};

export const updateSellerProduct = async (id: number, productData: FormData): Promise<any> => {
    const response = await api.post(`/seller/products/${id}`, productData);
    return response.data;
};

export const updateOrderStatus = async (orderId: number, status: string): Promise<any> => {
    const response = await api.put(`/seller/orders/${orderId}/status`, { status });
    return response.data;
};

export const getSellerOrders = async (): Promise<any[]> => {
    const response = await api.get('/seller/orders');
    return normalizeSellerOrders(response.data);
};

export const getSellerOrderById = async (id: number): Promise<any> => {
    const response = await api.get(`/seller/orders/${id}`);
    return response.data;
};

export const getSellerCoupons = async (): Promise<Coupon[]> => {
    const response = await api.get('/seller/coupons');
    const payload = response.data ?? {};
    return unwrapCollection(payload.data ?? payload).map(normalizeCoupon);
};

export const createSellerCoupon = async (data: {
    code: string;
    type: 'fixed' | 'percent';
    value: string;
    expires_at: string;
    is_active?: boolean;
}): Promise<Coupon> => {
    const response = await api.post('/seller/coupons', data);
    return normalizeCoupon(response.data?.coupon ?? response.data);
};

export const updateSellerCoupon = async (id: number, data: Partial<{
    code: string;
    type: 'fixed' | 'percent';
    value: string;
    expires_at: string;
    is_active: boolean;
}>): Promise<Coupon> => {
    const response = await api.put(`/seller/coupons/${id}`, data);
    return normalizeCoupon(response.data?.coupon ?? response.data);
};

export const deleteSellerCoupon = async (id: number): Promise<void> => {
    await api.delete(`/seller/coupons/${id}`);
};

// ============ TRANSLATIONS ============
export const getTranslations = async (locale: string): Promise<Record<string, string>> => {
    const response = await api.get(`/translations/${locale}`);
    return response.data;
};

