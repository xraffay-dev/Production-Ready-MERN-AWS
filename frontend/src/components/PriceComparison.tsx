import { Store, ExternalLink, TrendingDown } from "lucide-react";

export interface StorePrice {
  storeId: string;
  storeName: string;
  storeLogo?: string;
  price: number;
  inStock: boolean;
  link?: string;
}

interface PriceComparisonProps {
  storePrices: StorePrice[];
  defaultPrice: number;
}

const PriceComparison = ({
  storePrices,
  defaultPrice,
}: PriceComparisonProps) => {
  if (!storePrices || storePrices.length === 0) {
    return null;
  }

  const sortedStores = [...storePrices].sort((a, b) => a.price - b.price);
  const lowestPrice = sortedStores[0]?.price || defaultPrice;
  const highestPrice =
    sortedStores[sortedStores.length - 1]?.price || defaultPrice;

  const getSavings = (price: number) => {
    if (highestPrice === price) return null;
    const savings = highestPrice - price;
    const percentage = Math.round((savings / highestPrice) * 100);
    return { amount: savings, percentage };
  };

  const visibleStores = sortedStores.slice(0, 3);
  const moreStores = sortedStores.length - 3;

  const getStoreInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="card p-8 animate-fade-in">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-gradient-to-br from-primary-500 to-primary-600 p-3 rounded-xl shadow-lg shadow-primary-500/30">
          <Store size={24} className="text-white" />
        </div>
        <h2 className="text-3xl font-extrabold">Available at</h2>
      </div>

      <div className="space-y-3">
        {visibleStores.map((store, index) => {
          const savings = getSavings(store.price);
          const isLowest = index === 0;

          return (
            <div
              key={store.storeId}
              className={`flex items-center justify-between p-5 rounded-2xl border-2 ${
                isLowest
                  ? "border-primary-500 bg-gradient-to-br from-primary-50 to-primary-100/50 shadow-lg shadow-primary-500/20"
                  : "border-gray-200 hover:border-primary-300 hover:bg-primary-50/30"
              } transition-all duration-300 hover:scale-[1.02]`}
            >
              <div className="flex items-center gap-4 flex-1">
                <div
                  className={`w-14 h-14 rounded-xl flex items-center justify-center font-bold text-white shadow-lg ${
                    isLowest
                      ? "bg-gradient-to-br from-primary-600 to-primary-500"
                      : "bg-gradient-to-br from-gray-600 to-gray-500"
                  }`}
                >
                  {store.storeLogo ? (
                    <img
                      src={store.storeLogo}
                      alt={store.storeName}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <span className="text-base font-extrabold">
                      {getStoreInitials(store.storeName)}
                    </span>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-lg">
                      {store.storeName}
                    </span>
                    {isLowest && (
                      <span className="bg-gradient-to-r from-primary-600 to-primary-500 text-white text-xs px-3 py-1 rounded-full font-bold shadow-md">
                        Best Price
                      </span>
                    )}
                  </div>
                  {savings && (
                    <div className="flex items-center gap-2 text-sm">
                      <TrendingDown size={14} className="text-green-600" />
                      <span className="text-green-600 font-medium">
                        Save Rs. {savings.amount.toFixed(0)} (
                        {savings.percentage}% cheaper)
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-3xl font-extrabold gradient-text">
                    Rs. {store.price.toFixed(0)}
                  </div>
                  {store.inStock ? (
                    <span className="text-xs font-semibold text-primary-600">
                      In Stock
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-red-600">
                      Out of Stock
                    </span>
                  )}
                </div>
                {store.link && (
                  <a
                    href={store.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    aria-label={`Buy from ${store.storeName}`}
                  >
                    <ExternalLink size={20} />
                  </a>
                )}
              </div>
            </div>
          );
        })}

        {moreStores > 0 && (
          <div className="text-center pt-2">
            <button className="text-primary-600 font-semibold hover:underline">
              +{moreStores} more stores
            </button>
          </div>
        )}
      </div>

      {sortedStores.length > 1 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Price Range:</span>
            <span className="font-semibold">
              Rs. {lowestPrice.toFixed(0)} - Rs. {highestPrice.toFixed(0)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PriceComparison;
