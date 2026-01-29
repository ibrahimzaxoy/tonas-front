import type {
    Address,
    Cart,
    CartItem,
    Category,
    Coupon,
    Order,
    Product,
    ProductVariant,
    Slide,
    User,
    Vendor,
} from '../types';
import { getImageUrl } from './api';
import { getLocalizedField } from '../i18n/locale';

const safeString = (value: unknown, fallback = '') => {
    if (value === null || value === undefined) return fallback;
    return String(value);
};

const safeNumber = (value: unknown, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

/**
 * Safely converts any value to a strict boolean.
 * This is critical for React Native Fabric which requires exact boolean types.
 */
export const toBool = (value: unknown, label?: string): boolean => {
    // Handle explicit boolean
    if (value === true) return true;
    if (value === false) return false;

    // Handle numeric values
    if (value === 1 || value === '1') return true;
    if (value === 0 || value === '0') return false;

    // Handle string values
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        if (normalized === 'true' || normalized === 'yes' || normalized === 'on') return true;
        if (normalized === 'false' || normalized === 'no' || normalized === 'off' || normalized === '') return false;
        if (label) {
            console.warn(`[toBool] ${label} expected boolean, received "${value}"`);
        }
        // Default to false for unknown strings to avoid type errors
        return false;
    }

    // Handle null/undefined explicitly
    if (value === null || value === undefined) return false;

    // Any other truthy value
    return value ? true : false;
};

const unwrapCollection = (value: any): any[] => {
    if (Array.isArray(value)) return value;
    if (value && Array.isArray(value.data)) return value.data;
    return [];
};

export const normalizeSlide = (slide: any): Slide => {
    return {
        id: slide?.id ?? 0,
        title: getLocalizedField(slide, 'title', safeString(slide?.title)),
        subtitle: getLocalizedField(slide, 'subtitle', safeString(slide?.subtitle)),
        image: getImageUrl(slide?.image_url ?? slide?.image) || '',
        title_en: safeString(slide?.title_en ?? slide?.title),
        title_ar: safeString(slide?.title_ar),
        title_ku: safeString(slide?.title_ku),
        title_ku_sorani: safeString(slide?.title_ku_sorani),
        title_ku_badini: safeString(slide?.title_ku_badini),
        subtitle_en: safeString(slide?.subtitle_en ?? slide?.subtitle),
        subtitle_ar: safeString(slide?.subtitle_ar),
        subtitle_ku: safeString(slide?.subtitle_ku),
        subtitle_ku_sorani: safeString(slide?.subtitle_ku_sorani),
        subtitle_ku_badini: safeString(slide?.subtitle_ku_badini),
        link_type: slide?.link_type ?? 'url',
        link_value: slide?.link_value ?? slide?.link ?? '',
    };
};

export const normalizeCategory = (category: any): Category => {
    return {
        id: category?.id ?? 0,
        name: getLocalizedField(category, 'name', safeString(category?.name)),
        slug: safeString(category?.slug),
        icon: safeString(category?.icon),
        image: getImageUrl(category?.image_url ?? category?.image) || '',
        hero_images: Array.isArray(category?.hero_images)
            ? category.hero_images.map((item: string) => getImageUrl(item)).filter(Boolean)
            : [],
        name_en: safeString(category?.name_en ?? category?.name),
        name_ar: safeString(category?.name_ar),
        name_ku: safeString(category?.name_ku),
        name_ku_sorani: safeString(category?.name_ku_sorani),
        name_ku_badini: safeString(category?.name_ku_badini),
        parent_id: category?.parent_id ?? null,
        products_count: category?.products_count,
        children: unwrapCollection(category?.children).map(normalizeCategory),
    };
};

export const normalizeVendor = (vendor: any): Vendor => {
    const status = vendor?.status ?? '';
    const hasIsVerified = vendor?.is_verified !== undefined && vendor?.is_verified !== null;

    return {
        id: vendor?.id ?? 0,
        name: safeString(vendor?.store_name ?? vendor?.name),
        slug: safeString(vendor?.slug),
        description: safeString(vendor?.description),
        logo: getImageUrl(vendor?.profile_image_url ?? vendor?.logo ?? vendor?.profile_image) || '',
        banner: getImageUrl(vendor?.cover_image_url ?? vendor?.banner ?? vendor?.cover_image) || '',
        is_verified: hasIsVerified ? toBool(vendor.is_verified, 'vendor.is_verified') : status === 'approved',
    };
};

export const normalizeProductVariant = (variant: any): ProductVariant => {
    const attributes: Record<string, string> = {};
    if (variant?.size) attributes.size = safeString(variant.size);
    if (variant?.color) attributes.color = safeString(variant.color);

    const nameParts = [variant?.name, variant?.size, variant?.color]
        .filter(Boolean)
        .map((part) => safeString(part));
    const fallbackName = nameParts.length > 0 ? nameParts.join(' ') : `Variant ${variant?.id ?? ''}`.trim();

    return {
        id: variant?.id ?? 0,
        name: safeString(fallbackName),
        sku: safeString(variant?.sku),
        price: safeString(variant?.effective_price ?? variant?.price ?? '0'),
        compare_price: variant?.compare_price ?? null,
        stock: safeNumber(variant?.stock, 0),
        attributes,
    };
};

export const normalizeProduct = (product: any): Product => {
    const rawImages = Array.isArray(product?.images) ? product.images : [];
    const images = rawImages
        .map((image: string) => getImageUrl(image))
        .filter(Boolean) as string[];
    const thumbnail =
        getImageUrl(product?.thumbnail) ||
        getImageUrl(product?.image_url ?? product?.image) ||
        images[0] ||
        '';
    const variants = unwrapCollection(product?.variants).map(normalizeProductVariant);
    const inStock =
        product?.in_stock !== undefined
            ? toBool(product.in_stock, 'product.in_stock')
            : variants.some((variant) => variant.stock > 0);
    const hasIsWishlisted = product?.is_wishlisted !== undefined && product?.is_wishlisted !== null;
    const hasIsActive = product?.is_active !== undefined && product?.is_active !== null;

    return {
        id: product?.id ?? 0,
        name: getLocalizedField(product, 'name', safeString(product?.name)),
        slug: safeString(product?.slug),
        description: getLocalizedField(product, 'description', safeString(product?.description)),
        short_description: safeString(
            getLocalizedField(product, 'short_description', safeString(product?.short_description ?? product?.description))
        ),
        name_en: safeString(product?.name_en ?? product?.name),
        name_ar: safeString(product?.name_ar),
        name_ku: safeString(product?.name_ku),
        name_ku_sorani: safeString(product?.name_ku_sorani),
        name_ku_badini: safeString(product?.name_ku_badini),
        description_en: safeString(product?.description_en ?? product?.description),
        description_ar: safeString(product?.description_ar),
        description_ku: safeString(product?.description_ku),
        description_ku_sorani: safeString(product?.description_ku_sorani),
        description_ku_badini: safeString(product?.description_ku_badini),
        price: safeString(product?.price ?? product?.base_price ?? product?.min_price ?? '0'),
        compare_price: product?.compare_price ?? null,
        discount_percentage: product?.discount_percentage ?? null,
        is_wishlisted: hasIsWishlisted ? toBool(product.is_wishlisted, 'product.is_wishlisted') : undefined,
        status: safeString(product?.status ?? ''),
        is_active: hasIsActive ? toBool(product.is_active, 'product.is_active') : undefined,
        images,
        thumbnail,
        category: product?.category ? normalizeCategory(product.category) : undefined,
        vendor: product?.vendor ? normalizeVendor(product.vendor) : undefined,
        variants,
        in_stock: inStock,
        average_rating: safeNumber(product?.average_rating, 0),
        reviews_count: safeNumber(product?.reviews_count, 0),
    };
};

export const normalizeCartItem = (item: any): CartItem => {
    return {
        id: item?.id ?? 0,
        product: normalizeProduct(item?.product ?? {}),
        variant: item?.variant ? normalizeProductVariant(item.variant) : null,
        quantity: safeNumber(item?.quantity, 0),
        unit_price: safeString(item?.unit_price ?? item?.price ?? '0'),
        subtotal: safeString(item?.subtotal ?? '0'),
    };
};

export const normalizeCart = (payload: any): Cart => {
    const items = unwrapCollection(payload?.items).map(normalizeCartItem);
    const summary = payload?.summary ?? {};
    const itemsCount =
        summary.items_count ??
        items.reduce((total, item) => total + (item.quantity || 0), 0);
    const subtotal = summary.subtotal ?? summary.total ?? '0';
    const total = summary.total ?? subtotal ?? '0';

    return {
        items,
        items_count: safeNumber(itemsCount, 0),
        subtotal: safeString(subtotal),
        total: safeString(total),
    };
};

export const normalizeAddress = (address: any): Address => {
    return {
        id: address?.id ?? 0,
        label: safeString(address?.label),
        recipient_name: safeString(address?.recipient_name ?? address?.full_name),
        phone: safeString(address?.phone),
        street_address: safeString(address?.street_address ?? address?.address_line_1),
        city: safeString(address?.city),
        state: safeString(address?.state),
        postal_code: safeString(address?.postal_code),
        country: safeString(address?.country),
        is_default: toBool(address?.is_default, 'address.is_default'),
        full_address: safeString(address?.full_address),
    };
};

export const normalizeOrder = (order: any): Order => {
    const total = order?.total ?? order?.total_amount ?? order?.subtotal ?? '0';

    return {
        id: order?.id ?? 0,
        order_number: safeString(order?.order_number ?? order?.order_no ?? ''),
        status: safeString(order?.status),
        items: [],
        subtotal: safeString(order?.subtotal ?? total),
        total: safeString(total),
        created_at: safeString(order?.created_at),
    };
};

export const normalizeUser = (user: any): User => {
    const hasIsVendor = user?.is_vendor !== undefined && user?.is_vendor !== null;
    const isVendor = hasIsVendor ? toBool(user.is_vendor, 'user.is_vendor') : user?.role === 'vendor';

    return {
        id: user?.id ?? 0,
        name: safeString(user?.name),
        email: safeString(user?.email),
        phone: user?.phone ?? null,
        avatar: user?.avatar ?? null,
        is_vendor: isVendor,
    };
};

export const normalizeCoupon = (coupon: any): Coupon => {
    const type = coupon?.type === 'fixed' ? 'fixed' : 'percent';
    return {
        id: coupon?.id ?? 0,
        code: safeString(coupon?.code),
        type,
        value: safeString(coupon?.value ?? '0'),
        expires_at: coupon?.expires_at ?? null,
        is_active: toBool(coupon?.is_active, 'coupon.is_active'),
    };
};

export const unwrapResource = (value: any) => {
    if (value && typeof value === 'object' && 'data' in value) {
        return value.data;
    }
    return value;
};

export const normalizeSellerOrders = (payload: any) => {
    const data = unwrapCollection(payload?.data ?? payload);
    return data.map((order: any) => ({
        id: order?.id ?? 0,
        order_number: safeString(order?.order_number ?? `#${order?.id ?? ''}`),
        total: safeString(order?.total ?? order?.total_amount ?? '0'),
        status: safeString(order?.status),
        created_at: safeString(order?.created_at),
        user: order?.user ? { name: safeString(order.user.name) } : undefined,
        items: Array.isArray(order?.items)
            ? order.items.map((item: any, index: number) => ({
                id: item?.id ?? index,
                product: {
                    id: item?.product_id ?? index,
                    name: safeString(item?.name ?? item?.product?.name),
                    base_price: safeString(item?.price ?? item?.product?.base_price ?? '0'),
                },
                quantity: safeNumber(item?.quantity, 0),
                price: safeString(item?.price ?? '0'),
            }))
            : [],
    }));
};
