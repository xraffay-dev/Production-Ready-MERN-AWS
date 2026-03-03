const API_BASE_URL = "https://d12s8o2a1zt3pb.cloudfront.net/api";

export interface BackendProduct {
    _id: string;
    productID?: string;
    productName: string;
    productImage: string;
    productURL: string;
    originalPrice: number;
    discountedPrice: number;
    discount: number;
    availableAt: string;
}

export interface ApiResponse {
    success: boolean;
    status: number;
    count: number;
    data: BackendProduct[];
}

export interface SingleProductResponse {
    success: boolean;
    status: number;
    data: BackendProduct;
    message?: string;
}

export interface FeaturedRecommendation {
    product_id: string;
    name: string;
    store: string;
    price: number;
    category: string;
    url: string;
    image: string;
    similarity_score: number;
    savings: number;
    savings_percent: number;
}

export interface FeaturedProduct {
    _id: string;
    product_id: string;
    product_name: string;
    store: string;
    price: number;
    url: string;
    image: string;
    category: string;
    brand?: string;
    best_deal: FeaturedRecommendation | null;
    recommendations: FeaturedRecommendation[];
    total_recommendations: number;
}

export interface FeaturedApiResponse {
    success: boolean;
    status: number;
    count: number;
    data: FeaturedProduct[];
}

export interface SingleFeaturedResponse {
    success: boolean;
    status: number;
    data: FeaturedProduct;
    message?: string;
}

export const fetchAlFatahProducts = async (): Promise<ApiResponse> => {
    const response = await fetch(`${API_BASE_URL}/alfatah`);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
};

export const fetchMetroProducts = async (): Promise<ApiResponse> => {
    const response = await fetch(`${API_BASE_URL}/metro`);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
};

export const fetchJalalSonsProducts = async (): Promise<ApiResponse> => {
    const response = await fetch(`${API_BASE_URL}/jalalsons`);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
};

export const fetchRajaSahibProducts = async (): Promise<ApiResponse> => {
    const response = await fetch(`${API_BASE_URL}/rajasahib`);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
};

export const fetchRahimStoreProducts = async (): Promise<ApiResponse> => {
    const response = await fetch(`${API_BASE_URL}/rahimstore`);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
};

export const fetchFeaturedProducts = async (limit = 8): Promise<FeaturedApiResponse> => {
    const response = await fetch(`${API_BASE_URL}/featured/random?limit=${limit}`);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
};

export const fetchProductFromRecommendations = async (productId: string): Promise<SingleFeaturedResponse> => {
    const response = await fetch(`${API_BASE_URL}/featured/product/${productId}`);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
};

export const fetchRelatedProducts = async (productId: string, category: string, limit = 4): Promise<FeaturedApiResponse> => {
    const response = await fetch(`${API_BASE_URL}/featured/related/${productId}?category=${encodeURIComponent(category)}&limit=${limit}`);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
};

const storeEndpointMap: Record<string, string> = {
    "Al-Fatah": "alfatah",
    "Metro": "metro",
    "Jalal Sons": "jalalsons",
    "Raja Sahib": "rajasahib",
    "Rahim Store": "rahimstore",
};

export const fetchProductByIdFromStore = async (productId: string, storeName: string): Promise<SingleProductResponse> => {
    const endpoint = storeEndpointMap[storeName];
    if (!endpoint) {
        throw new Error(`Unknown store: ${storeName}`);
    }
    const response = await fetch(`${API_BASE_URL}/${endpoint}/${productId}`);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
};

export type StoreFetcher = () => Promise<ApiResponse>;

export const getStoreFetcher = (storeSlug: string): StoreFetcher | null => {
    const fetcherMap: Record<string, StoreFetcher> = {
        "al-fatah": fetchAlFatahProducts,
        "metro": fetchMetroProducts,
        "jalal-sons": fetchJalalSonsProducts,
        "raja-sahib": fetchRajaSahibProducts,
        "rahim-store": fetchRahimStoreProducts,
    };
    return fetcherMap[storeSlug] || null;
};

export interface ProductMatch {
    product_id: string;
    product_name: string;
    store: string;
    price: number;
    url: string;
    image: string;
    brand?: string;
    size?: number;
    unit?: string;
    price_per_unit?: number;
    unit_label?: string;
    match_type: 'exact' | 'semantic';
    similarity_score?: number;
    savings?: number;
    savings_percent?: number;
}

export interface ProductWithMatches {
    _id: string;
    product_id: string;
    product_name: string;
    store: string;
    price: number;
    discounted_price?: number;
    discount?: number;
    url: string;
    image: string;
    brand?: string;
    size?: number;
    unit?: string;
    price_per_unit?: number;
    unit_label?: string;
    exact_matches: ProductMatch[];
    semantic_matches: ProductMatch[];
    best_deal?: ProductMatch | null;
    savings_analysis?: {
        best_price: number;
        worst_price: number;
        potential_savings: number;
        savings_percent: number;
    } | null;
    total_exact_matches: number;
    total_semantic_matches: number;
    total_matches: number;
}

export interface ProductMatchesApiResponse {
    success: boolean;
    status: number;
    count: number;
    data: ProductWithMatches[];
}

export interface SingleProductMatchResponse {
    success: boolean;
    status: number;
    data: ProductWithMatches;
    message?: string;
}

export interface RecommendationsResponse {
    success: boolean;
    status: number;
    data: {
        recommendations: FeaturedRecommendation[];
        total_recommendations: number;
    };
    message?: string;
}

export const fetchProductsWithMatches = async (limit = 8): Promise<ProductMatchesApiResponse> => {
    const response = await fetch(`${API_BASE_URL}/matches?limit=${limit}`);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
};

export const fetchProductMatches = async (productId: string): Promise<SingleProductMatchResponse> => {
    const response = await fetch(`${API_BASE_URL}/matches/product/${productId}`);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
};

export const fetchYouMayAlsoLike = async (productId: string, productName?: string): Promise<RecommendationsResponse> => {
    let url = `${API_BASE_URL}/matches/recommendations/${productId}`;
    if (productName) {
        url += `?name=${encodeURIComponent(productName)}`;
    }
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
};

export const searchProductsWithMatches = async (query: string, limit = 20): Promise<ProductMatchesApiResponse> => {
    const response = await fetch(`${API_BASE_URL}/matches/search?q=${encodeURIComponent(query)}&limit=${limit}`);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
};

export const searchProducts = async (query: string, limit = 50): Promise<ApiResponse> => {
    const response = await fetch(`${API_BASE_URL}/search?query=${encodeURIComponent(query)}&limit=${limit}`);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
};

