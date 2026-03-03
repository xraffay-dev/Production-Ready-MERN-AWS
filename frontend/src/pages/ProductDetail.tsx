import { useParams, Link } from "react-router-dom";
import {
  ShoppingCart,
  Minus,
  Plus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useCart } from "../contexts/CartContext";
import ProductCard from "../components/ProductCard";
import PriceComparison from "../components/PriceComparison";
import { Product, StorePrice } from "../types";
import {
  fetchProductMatches,
  fetchYouMayAlsoLike,
  ProductWithMatches,
  FeaturedRecommendation,
  fetchProductByIdFromStore,
  BackendProduct,
} from "../services/api";

const ProductDetail = () => {
  const { id, store } = useParams<{ id: string; store?: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();

  useEffect(() => {
    const loadProduct = async () => {
      if (!id) {
        setError("Product ID not found");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Map store slug to store name
        const storeNameMap: Record<string, string> = {
          "al-fatah": "Al-Fatah",
          metro: "Metro",
          "jalal-sons": "Jalal Sons",
          "raja-sahib": "Raja Sahib",
          "rahim-store": "Rahim Store",
        };

        // If we have a store parameter, fetch from store-specific endpoint
        if (store && storeNameMap[store]) {
          const storeName = storeNameMap[store];
          const storeResponse = await fetchProductByIdFromStore(id, storeName);

          if (storeResponse.success && storeResponse.data) {
            const item: BackendProduct = storeResponse.data;

            const transformedProduct: Product = {
              id: item._id,
              name: item.productName,
              price: item.discountedPrice || item.originalPrice,
              image: item.productImage || "https://via.placeholder.com/400",
              category: "general",
              description: `Available at ${item.availableAt}`,
              storeUrl: item.productURL || undefined,
              inStock: true,
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

            setProduct(transformedProduct);

            // Fetch recommendations for store-specific products
            try {
              const recsResponse = await fetchYouMayAlsoLike(
                id,
                item.productName,
              );
              if (
                recsResponse.success &&
                recsResponse.data?.recommendations?.length > 0
              ) {
                const transformedRelated = recsResponse.data.recommendations
                  .slice(0, 10)
                  .map((rec: FeaturedRecommendation) => ({
                    id: rec.product_id,
                    name: rec.name,
                    price: rec.price,
                    image: rec.image || "https://via.placeholder.com/400",
                    category: rec.category || "general",
                    description: `Available at ${rec.store}`,
                    storeUrl: rec.url || undefined,
                    inStock: true,
                    storePrices: [
                      {
                        storeId: rec.product_id,
                        storeName: rec.store,
                        price: rec.price,
                        inStock: true,
                        link: rec.url,
                      },
                    ],
                  }));
                setRelatedProducts(transformedRelated);
              }
            } catch {
              console.log("No recommendations available for this product");
            }

            setLoading(false);
            return;
          } else {
            setError("Product not found in this store");
            setLoading(false);
            return;
          }
        }

        // Otherwise, fetch from product matches endpoint
        const matchesResponse = await fetchProductMatches(id);

        if (matchesResponse.success && matchesResponse.data) {
          const item: ProductWithMatches = matchesResponse.data;

          const storePrices: StorePrice[] = [
            {
              storeId: item.product_id,
              storeName: item.store,
              price: item.price,
              inStock: true,
              link: item.url,
            },
            ...item.exact_matches.map((match) => ({
              storeId: match.product_id,
              storeName: match.store,
              price: match.price,
              inStock: true,
              link: match.url,
            })),
            ...item.semantic_matches.map((match) => ({
              storeId: match.product_id,
              storeName: match.store,
              price: match.price,
              inStock: true,
              link: match.url,
            })),
          ].sort((a, b) => a.price - b.price);

          const transformedProduct: Product = {
            id: item.product_id,
            name: item.product_name,
            price: item.price,
            image: item.image || "https://via.placeholder.com/400",
            category: "general",
            description: `Available at ${item.store}`,
            storeUrl: item.url || undefined,
            inStock: true,
            storePrices,
          };

          setProduct(transformedProduct);

          try {
            const recsResponse = await fetchYouMayAlsoLike(
              id,
              item.product_name,
            );
            if (
              recsResponse.success &&
              recsResponse.data?.recommendations?.length > 0
            ) {
              const transformedRelated = recsResponse.data.recommendations
                .slice(0, 10)
                .map((rec: FeaturedRecommendation) => ({
                  id: rec.product_id,
                  name: rec.name,
                  price: rec.price,
                  image: rec.image || "https://via.placeholder.com/400",
                  category: rec.category || "general",
                  description: `Available at ${rec.store}`,
                  storeUrl: rec.url || undefined,
                  inStock: true,
                  storePrices: [
                    {
                      storeId: rec.product_id,
                      storeName: rec.store,
                      price: rec.price,
                      inStock: true,
                      link: rec.url,
                    },
                  ],
                }));
              setRelatedProducts(transformedRelated);
            }
          } catch {
            console.log("No recommendations available for this product");
          }
        } else {
          setError("Product not found");
        }
      } catch (err) {
        console.error("Error fetching product:", err);
        setError("Failed to load product");
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id, store]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
        <p className="mt-4 text-gray-600">Loading product...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">Product Not Found</h1>
        <p className="text-gray-600 mb-4">{error}</p>
        <Link to="/products" className="text-primary-600 hover:underline">
          Continue Shopping
        </Link>
      </div>
    );
  }

  const handleAddToCart = () => {
    const priceToUse =
      product.storePrices && product.storePrices.length > 0
        ? Math.min(...product.storePrices.map((sp: StorePrice) => sp.price))
        : product.price;

    for (let i = 0; i < quantity; i++) {
      addToCart({
        id: product.id,
        name: product.name,
        price: priceToUse,
        image: product.image,
      });
    }
  };

  const getSavingsInfo = () => {
    if (!product.storePrices || product.storePrices.length === 0) return null;

    const prices = product.storePrices.map((sp: StorePrice) => sp.price);
    const lowestPrice = Math.min(...prices);
    const highestPrice = Math.max(...prices);

    if (lowestPrice === highestPrice) return null;

    const savings = highestPrice - lowestPrice;
    const percentage = Math.round((savings / highestPrice) * 100);

    return { amount: savings, percentage, lowestPrice, highestPrice };
  };

  const savingsInfo = getSavingsInfo();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-4">
        <Link to="/products" className="text-primary-600 hover:underline">
          ← Back to Products
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
        <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          {savingsInfo && (
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              <div className="bg-green-600 text-white px-4 py-2 rounded-full font-semibold text-sm shadow-lg">
                Save Rs. {savingsInfo.amount.toFixed(0)}
              </div>
              <div className="bg-purple-600 text-white px-4 py-2 rounded-full font-semibold text-sm shadow-lg">
                {savingsInfo.percentage}% Cheaper
              </div>
            </div>
          )}
        </div>

        <div>
          <h1 className="text-4xl font-bold mb-4">{product.name}</h1>

          <div className="mb-6">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-primary-600">
                Rs.{" "}
                {(product.storePrices && product.storePrices.length > 0
                  ? Math.min(
                      ...product.storePrices.map((sp: StorePrice) => sp.price),
                    )
                  : product.price
                ).toFixed(0)}
              </span>
              {savingsInfo && (
                <span className="text-lg text-gray-500 line-through">
                  Rs. {savingsInfo.highestPrice.toFixed(0)}
                </span>
              )}
            </div>
            {savingsInfo && (
              <p className="text-green-600 font-medium mt-1">
                Best price available - Save up to Rs.{" "}
                {savingsInfo.amount.toFixed(0)}
              </p>
            )}
          </div>

          {product.storeUrl ? (
            <a
              href={product.storeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-primary-600 hover:text-primary-700 mb-8 text-lg font-medium underline decoration-2 underline-offset-4 hover:decoration-primary-700 transition-colors"
            >
              {product.description} ↗
            </a>
          ) : (
            <p className="text-gray-700 mb-8 text-lg leading-relaxed">
              {product.description}
            </p>
          )}

          <div className="mb-8">
            <div className="flex items-center gap-4 mb-6">
              <span className="font-semibold">Quantity:</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                >
                  <Minus size={20} />
                </button>
                <span className="text-xl font-semibold w-12 text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>

            <button
              onClick={handleAddToCart}
              className="w-full btn-primary flex items-center justify-center gap-2 py-4 text-lg"
            >
              <ShoppingCart size={24} />
              Add to Cart
            </button>
          </div>

          <div className="border-t pt-6">
            <h3 className="font-semibold mb-2">Product Details</h3>
            <ul className="space-y-2 text-gray-600">
              <li>
                Category:{" "}
                {product.category
                  .split("-")
                  .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
                  .join(" & ")}
              </li>
              <li>Status: {product.inStock ? "In Stock" : "Out of Stock"}</li>
              <li>
                Available at {product.storePrices?.length || 1}{" "}
                {product.storePrices?.length === 1 ? "store" : "stores"}
              </li>
            </ul>
          </div>
        </div>
      </div>

      {product.storePrices && product.storePrices.length > 0 && (
        <div className="mb-16">
          <PriceComparison
            storePrices={product.storePrices}
            defaultPrice={product.price}
          />
        </div>
      )}

      {relatedProducts.length > 0 && (
        <section className="mt-16">
          <h2 className="text-3xl font-bold mb-8">You May Also Like</h2>
          <div className="relative group">
            <button
              onClick={() => {
                const container = document.getElementById(
                  "recommendations-carousel",
                );
                if (container) {
                  container.scrollBy({ left: -320, behavior: "smooth" });
                }
              }}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/90 hover:bg-primary-600 hover:text-white text-gray-700 transition-all duration-300 shadow-lg border border-gray-200 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0"
              aria-label="Previous recommendations"
            >
              <ChevronLeft size={28} />
            </button>

            <button
              onClick={() => {
                const container = document.getElementById(
                  "recommendations-carousel",
                );
                if (container) {
                  container.scrollBy({ left: 320, behavior: "smooth" });
                }
              }}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/90 hover:bg-primary-600 hover:text-white text-gray-700 transition-all duration-300 shadow-lg border border-gray-200 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0"
              aria-label="Next recommendations"
            >
              <ChevronRight size={28} />
            </button>

            <div
              id="recommendations-carousel"
              className="flex gap-6 overflow-x-auto scroll-smooth pb-4 px-2 snap-x snap-mandatory"
              style={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            >
              {relatedProducts.map((relatedProduct) => (
                <div
                  key={relatedProduct.id}
                  className="flex-shrink-0 w-[280px] snap-start"
                >
                  <ProductCard product={relatedProduct} />
                </div>
              ))}
            </div>

            <div className="absolute left-0 top-0 bottom-4 w-12 bg-gradient-to-r from-white to-transparent pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-4 w-12 bg-gradient-to-l from-white to-transparent pointer-events-none" />
          </div>
        </section>
      )}
    </div>
  );
};

export default ProductDetail;
