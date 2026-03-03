import { Link } from "react-router-dom";
import { ShoppingCart, Share2 } from "lucide-react";
import { useCart } from "../contexts/CartContext";
import { Product, StorePrice } from "../types";
import { stores } from "../constants/stores";

interface ProductCardProps {
  product: Product;
  storePath?: string;
}

const ProductCard = ({ product, storePath }: ProductCardProps) => {
  const { addToCart } = useCart();
  const { id, name, price, image, storePrices, promotionalBanners, storeSlug } =
    product;

  // Generate product URL based on context
  // Priority: 1. storePath (from Products page), 2. storeSlug (from search results), 3. generic product page
  const productUrl = storePath
    ? `${storePath}/${id}`
    : storeSlug
      ? `/stores/${storeSlug}/${id}`
      : `/product/${id}`;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addToCart({ id, name, price, image });
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}${productUrl}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: name,
          text: `Check out ${name} on Grocy`,
          url: url,
        });
      } catch (err) {
        // User cancelled or error occurred
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(url);
      alert("Link copied to clipboard!");
    }
  };

  // Get top 2-3 stores for display
  const displayStores = storePrices
    ? [...storePrices].sort((a, b) => a.price - b.price).slice(0, 3)
    : [];
  const moreStores = storePrices
    ? storePrices.length - displayStores.length
    : 0;

  const getStoreInitials = (storeName: string) => {
    return storeName
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Get store logo by store name
  const getStoreLogo = (storeName: string) => {
    const store = stores.find((s) => s.name === storeName);
    return store?.logo;
  };

  return (
    <div className="card-hover group animate-fade-in bg-white">
      <Link to={productUrl}>
        <div className="aspect-square overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50 relative">
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />

          {/* Promotional Banners - top center/right */}
          {promotionalBanners && promotionalBanners.length > 0 && (
            <div className="absolute top-0 left-0 right-0 flex flex-col gap-1.5 p-2 z-10">
              {promotionalBanners.map((banner, idx) => (
                <div
                  key={idx}
                  className="bg-black/90 text-white text-xs font-bold px-3 py-1.5 rounded-sm w-fit"
                >
                  {banner.text}
                </div>
              ))}
            </div>
          )}
        </div>
      </Link>

      <div className="p-4">
        <Link to={productUrl}>
          <h3 className="font-bold text-base mb-3 hover:text-primary-600 transition-colors line-clamp-2 leading-tight">
            {name}
          </h3>
        </Link>

        {/* Available at section */}
        {displayStores.length > 0 && (
          <div className="mb-3 pb-3 border-b border-gray-200">
            <p className="text-xs font-bold text-gray-900 mb-2.5">
              Available at
            </p>
            <div className="space-y-2.5">
              {displayStores.map((store: StorePrice, idx: number) => {
                const isLowest = idx === 0;
                const highestPrice =
                  displayStores[displayStores.length - 1].price;
                const savings = highestPrice - store.price;
                const storeLogo = getStoreLogo(store.storeName);

                const content = (
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2.5">
                      {storeLogo ? (
                        <img
                          src={storeLogo}
                          alt={store.storeName}
                          className={`w-10 h-10 rounded-lg object-contain shadow-sm ${
                            isLowest ? "ring-2 ring-primary-600" : ""
                          }`}
                        />
                      ) : (
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold text-white shadow-sm ${
                            isLowest ? "bg-primary-600" : "bg-gray-500"
                          }`}
                        >
                          {getStoreInitials(store.storeName)}
                        </div>
                      )}
                      <span className="text-xs font-bold text-gray-900 group-hover/store:text-primary-600 transition-colors">
                        {store.storeName}
                      </span>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-sm font-bold ${
                          isLowest ? "text-primary-600" : "text-gray-900"
                        }`}
                      >
                        Rs. {store.price.toFixed(0)}
                      </div>
                      {idx === 0 && displayStores.length > 1 && savings > 0 && (
                        <div className="text-xs">
                          <span className="text-gray-500 line-through">
                            Rs. {highestPrice.toFixed(0)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );

                return store.link ? (
                  <a
                    key={store.storeId}
                    href={store.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-1 -m-1 rounded-lg hover:bg-gray-50 transition-colors group/store"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {content}
                  </a>
                ) : (
                  <div key={store.storeId}>{content}</div>
                );
              })}
              {moreStores > 0 && (
                <div className="text-xs text-gray-600 font-semibold text-right pt-1">
                  +{moreStores} STORES
                </div>
              )}
            </div>
          </div>
        )}

        {/* Price and Actions */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-2xl font-extrabold gradient-text">
              Rs. {price.toFixed(0)}
            </span>
          </div>
          <button
            onClick={handleAddToCart}
            className="bg-gradient-to-r from-primary-600 to-primary-500 text-white p-2.5 rounded-lg hover:shadow-lg hover:shadow-primary-500/40 hover:scale-110 active:scale-100 transition-all duration-300"
            aria-label={`Add ${name} to cart`}
          >
            <ShoppingCart size={18} />
          </button>
        </div>

        {/* Share button */}
        <div className="flex items-center gap-4 pt-3 border-t border-gray-200">
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-primary-600 transition-colors"
          >
            <Share2 size={14} />
            <span>Share</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
