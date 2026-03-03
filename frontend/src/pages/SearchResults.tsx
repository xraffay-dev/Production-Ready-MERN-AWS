import { useSearchParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import ProductCard from "../components/ProductCard";
import { Product } from "../types";
import { searchProducts, BackendProduct } from "../services/api";
import { Search as SearchIcon } from "lucide-react";

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!query.trim()) {
        setProducts([]);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await searchProducts(query);

        if (response.success) {
          // Map store names to URL slugs
          const storeSlugMap: Record<string, string> = {
            "Al-Fatah": "al-fatah",
            Metro: "metro",
            "Jalal Sons": "jalal-sons",
            "Raja Sahib": "raja-sahib",
            "Rahim Store": "rahim-store",
          };

          const transformedProducts: Product[] = response.data.map(
            (item: BackendProduct) => {
              const storeSlug = storeSlugMap[item.availableAt] || "";

              return {
                id: item._id,
                name: item.productName,
                price: item.discountedPrice || item.originalPrice,
                image: item.productImage || "https://via.placeholder.com/400",
                category: "general",
                description: `Available at ${item.availableAt}`,
                inStock: true,
                storeSlug, // Add store slug for routing
                storePrices: [
                  {
                    storeId: item._id,
                    storeName: item.availableAt,
                    price: item.discountedPrice || item.originalPrice,
                    inStock: true,
                    link: item.productURL,
                  },
                ],
              };
            },
          );
          setProducts(transformedProducts);
        } else {
          setError("Failed to fetch search results");
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to search products",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [query]);

  if (!query.trim()) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <SearchIcon size={64} className="mx-auto text-gray-400 mb-4" />
        <h1 className="text-3xl font-bold mb-4">Search Products</h1>
        <p className="text-gray-600">
          Enter a search term to find products across all stores
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Link
          to="/"
          className="text-primary-600 hover:underline mb-4 inline-block"
        >
          ← Back to Home
        </Link>
        <h1 className="text-4xl font-bold mb-2">
          Search Results for "{query}"
        </h1>
        <p className="text-gray-600">
          {loading ? "Searching..." : `${products.length} products found`}
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
          <p className="text-gray-500 text-lg mt-4">Searching products...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-500 text-lg">{error}</p>
          <p className="text-gray-500 mt-2">
            Make sure the backend server is running on port 8000
          </p>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12">
          <SearchIcon size={64} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 text-lg">
            No products found for "{query}"
          </p>
          <p className="text-gray-400 mt-2">
            Try searching with different keywords
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product: Product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchResults;
