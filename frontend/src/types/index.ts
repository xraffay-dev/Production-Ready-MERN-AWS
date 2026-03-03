// Product types
export interface StorePrice {
    storeId: string;
    storeName: string;
    price: number;
    inStock: boolean;
    link?: string;
}

export interface PromotionalBanner {
    text: string;
    color?: string;
}

export interface Product {
    id: string;
    name: string;
    price: number;
    image: string;
    category: string;
    description: string;
    inStock: boolean;
    storeUrl?: string;
    storeSlug?: string; // Store slug for routing (e.g., "metro", "al-fatah")
    storePrices?: StorePrice[];
    promotionalBanners?: PromotionalBanner[];
}

// Store types
export interface Store {
    id: string;
    name: string;
    logo: string;
    path: string;
}
