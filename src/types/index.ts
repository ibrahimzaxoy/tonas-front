// API Response Types

export interface Slide {
    id: number;
    title: string;
    subtitle: string;
    image: string;
    title_en?: string;
    title_ar?: string;
    title_ku?: string;
    title_ku_sorani?: string;
    title_ku_badini?: string;
    subtitle_en?: string;
    subtitle_ar?: string;
    subtitle_ku?: string;
    subtitle_ku_sorani?: string;
    subtitle_ku_badini?: string;
    link_type?: string;
    link_value?: string;
}

export interface Category {
    id: number;
    name: string;
    slug: string;
    icon?: string;
    image?: string;
    hero_images?: string[];
    name_en?: string;
    name_ar?: string;
    name_ku?: string;
    name_ku_sorani?: string;
    name_ku_badini?: string;
    parent_id: number | null;
    children?: Category[];
    products_count?: number;
}

export interface ProductVariant {
    id: number;
    name: string;
    sku: string;
    price: string;
    compare_price?: string | null;
    stock: number;
    attributes: Record<string, string>;
}

export interface Vendor {
    id: number;
    name: string;
    slug: string;
    description: string;
    logo?: string;
    banner?: string;
    is_verified?: boolean;
}

export interface Product {
    id: number;
    name: string;
    slug: string;
    description: string;
    short_description?: string;
    name_en?: string;
    name_ar?: string;
    name_ku?: string;
    name_ku_sorani?: string;
    name_ku_badini?: string;
    description_en?: string;
    description_ar?: string;
    description_ku?: string;
    description_ku_sorani?: string;
    description_ku_badini?: string;
    price: string;
    compare_price?: string | null;
    discount_percentage?: number | null;
    is_wishlisted?: boolean;
    status?: string;
    is_active?: boolean;
    images: string[];
    thumbnail?: string | null;
    category?: Category;
    vendor?: Vendor;
    variants?: ProductVariant[];
    in_stock?: boolean;
    average_rating?: number;
    reviews_count?: number;
}

export interface CartItem {
    id: number;
    product: Product;
    variant: ProductVariant | null;
    quantity: number;
    unit_price: string;
    subtotal: string;
}

export interface Cart {
    items: CartItem[];
    items_count?: number;
    subtotal: string;
    total: string;
}

export interface Address {
    id: number;
    label: string;
    recipient_name: string;
    phone: string;
    street_address: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    is_default: boolean;
    full_address: string;
}

export interface User {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    avatar: string | null;
    is_vendor: boolean;
}

export interface Order {
    id: number;
    order_number: string;
    status: string;
    items: OrderItem[];
    subtotal: string;
    total: string;
    created_at: string;
}

export interface OrderItem {
    id: number;
    product: Product;
    variant: ProductVariant | null;
    quantity: number;
    unit_price: string;
    subtotal: string;
}

export interface Coupon {
    id: number;
    code: string;
    type: 'fixed' | 'percent';
    value: string;
    expires_at: string | null;
    is_active: boolean;
}

// API Response wrappers
export interface PaginatedResponse<T> {
    data: T[];
    meta: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

export interface HomeResponse {
    slides: Slide[];
    categories: Category[];
    new_arrivals: Product[];
    featured_products: Product[];
    popular_products: Product[];
}

// Navigation types
export type RootStackParamList = {
    Main: undefined;
    ProductDetail: { slug: string };
    CategoryProducts: { categoryId: number; categoryName: string };
    VendorStore: { slug: string };
    Search: undefined;
    Login: undefined;
    Register: undefined;
    BecomeSeller: undefined;
    SellerDashboard: undefined;
    AddProduct: { productId?: number } | undefined;
    SellerProducts: undefined;
    SellerStoreProfile: undefined;
    SellerCoupons: undefined;
    Checkout: undefined;
    OrderSuccess: { orderId: number };
    OrderHistory: undefined;
    OrderDetail: { orderId: number };
    AddAddress: undefined;
    SellerOrders: undefined;
};

export type MainTabParamList = {
    Home: undefined;
    Categories: undefined;
    Cart: undefined;
    Wishlist: undefined;
    Profile: undefined;
};
