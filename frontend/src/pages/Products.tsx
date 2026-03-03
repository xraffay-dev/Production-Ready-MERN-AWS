import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import ProductCard from "../components/ProductCard";
import { Product, Store } from "../types";
import { stores } from "../constants/stores";
import { Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { getStoreFetcher, BackendProduct } from "../services/api";

const PRODUCTS_PER_PAGE = 12;

const BACKEND_STORES = [
  "al-fatah",
  "metro",
  "jalal-sons",
  "raja-sahib",
  "rahim-store",
];

const Products = () => {
  const { store } = useParams<{ store?: string }>();
  const [sortBy, setSortBy] = useState<"name" | "price-asc" | "price-desc">(
    "name",
  );
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [apiProducts, setApiProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const isBackendStore = store ? BACKEND_STORES.includes(store) : false;

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  useEffect(() => {
    if (isBackendStore && store) {
      const fetcher = getStoreFetcher(store);
      if (!fetcher) return;

      setLoading(true);
      setError(null);
      setCurrentPage(1);
      setApiProducts([]);

      fetcher()
        .then((response) => {
          if (response.success) {
            const transformedProducts: Product[] = response.data.map(
              (item: BackendProduct) => ({
                id: item._id,
                name: item.productName,
                price: item.discountedPrice || item.originalPrice,
                image: item.productImage || "https://via.placeholder.com/400",
                category: "general",
                description: `Available at ${item.availableAt}`,
                inStock: true,
                storePrices: [
                  {
                    storeId: "1",
                    storeName: item.availableAt,
                    price: item.discountedPrice || item.originalPrice,
                    inStock: true,
                    link: item.productURL,
                  },
                ],
              }),
            );
            setApiProducts(shuffleArray(transformedProducts));
          } else {
            setError("Failed to fetch products");
          }
        })
        .catch((err) => {
          setError(err.message || "Failed to fetch products");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isBackendStore, store]);

  const products = isBackendStore ? apiProducts : [];

  let filteredProducts = products;

  filteredProducts = filteredProducts.filter(
    (p: Product) => p.price >= priceRange[0] && p.price <= priceRange[1],
  );

  filteredProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === "name") {
      return a.name.localeCompare(b.name);
    } else if (sortBy === "price-asc") {
      return a.price - b.price;
    } else {
      return b.price - a.price;
    }
  });

  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const endIndex = startIndex + PRODUCTS_PER_PAGE;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [sortBy, priceRange, store]);

  const storeName =
    store && store !== "all"
      ? stores.find((s: Store) => s.path.includes(store))?.name ||
        store
          .split("-")
          .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ")
      : "All Products";

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">{storeName}</h1>
        <p className="text-gray-600">
          {filteredProducts.length} products found
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Filters Sidebar */}
        <aside
          className={`md:w-64 ${showFilters ? "block" : "hidden md:block"}`}
        >
          <div className="card p-6 sticky top-24">
            <div className="flex items-center justify-between mb-4 md:hidden">
              <h2 className="text-xl font-semibold">Filters</h2>
              <button
                onClick={() => setShowFilters(false)}
                className="text-gray-500"
              >
                ✕
              </button>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold mb-3">Price Range</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={priceRange[0]}
                    onChange={(e) =>
                      setPriceRange([Number(e.target.value), priceRange[1]])
                    }
                    className="input-field"
                    placeholder="Min"
                  />
                  <span>-</span>
                  <input
                    type="number"
                    value={priceRange[1]}
                    onChange={(e) =>
                      setPriceRange([priceRange[0], Number(e.target.value)])
                    }
                    className="input-field"
                    placeholder="Max"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Stores</h3>
              <div className="space-y-2">
                <Link
                  to="/products"
                  className={`block py-2 px-3 rounded ${
                    !store
                      ? "bg-primary-100 text-primary-700"
                      : "hover:bg-gray-100"
                  }`}
                >
                  All Stores
                </Link>
                {stores.map((s: Store) => {
                  const storeSlug = s.path.split("/").pop();
                  return (
                    <Link
                      key={s.id}
                      to={s.path}
                      className={`flex items-center gap-2 py-2 px-3 rounded ${
                        store === storeSlug
                          ? "bg-primary-100 text-primary-700"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      <img
                        src={s.logo}
                        alt={s.name}
                        className="w-6 h-6 object-contain"
                      />
                      <span>{s.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </aside>

        {/* Products Grid */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setShowFilters(true)}
              className="md:hidden flex items-center gap-2 btn-secondary"
            >
              <Filter size={20} />
              Filters
            </button>

            <div className="flex items-center gap-2">
              <span className="text-gray-600">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="input-field w-auto"
              >
                <option value="name">Name</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
              <p className="text-gray-500 text-lg mt-4">Loading products...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500 text-lg">{error}</p>
              <p className="text-gray-500 mt-2">
                Make sure the backend server is running on port 8000
              </p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                No products found matching your criteria.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedProducts.map((product: Product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    storePath={store ? `/stores/${store}` : undefined}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-8 flex flex-col items-center gap-4">
                  <p className="text-sm text-gray-600">
                    Showing {startIndex + 1}-
                    {Math.min(endIndex, filteredProducts.length)} of{" "}
                    {filteredProducts.length} products
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft size={20} />
                    </button>

                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-10 h-10 rounded-lg font-medium ${
                            currentPage === pageNum
                              ? "bg-primary-600 text-white"
                              : "border border-gray-300 hover:bg-gray-100"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    <button
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Products;
