import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, User, Search, Menu, X } from "lucide-react";
import { useState } from "react";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { stores } from "../constants/stores";
import CountdownTimer from "./CountdownTimer";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { getTotalItems } = useCart();
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="glass sticky top-0 z-50 border-b border-gray-200/50 backdrop-blur-xl">
      <div className="container mx-auto px-4">
        {/* Top Bar */}
        <div className="flex items-center justify-between py-5">
          {/* Logo */}
          <Link
            to="/"
            className="text-4xl font-extrabold gradient-text hover:scale-105 transition-transform duration-300"
          >
            Grocy
          </Link>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-8">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search for products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleSearchKeyPress}
                className="input-field pl-12 pr-4"
              />
              <Search
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
            </div>
          </div>

          {/* Right Icons */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Link
                  to="/account"
                  className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl text-gray-700 hover:text-primary-600 hover:bg-primary-50/50 transition-all duration-200"
                >
                  <User size={22} />
                  <span className="font-medium">Account</span>
                </Link>
                <button
                  onClick={logout}
                  className="hidden md:block px-4 py-2 rounded-xl text-gray-700 hover:text-primary-600 hover:bg-primary-50/50 transition-all duration-200 font-medium"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl text-gray-700 hover:text-primary-600 hover:bg-primary-50/50 transition-all duration-200"
              >
                <User size={22} />
                <span className="font-medium">Login</span>
              </Link>
            )}

            <Link
              to="/cart"
              className="relative flex items-center gap-2 px-4 py-2 rounded-xl text-gray-700 hover:text-primary-600 hover:bg-primary-50/50 transition-all duration-200 group"
            >
              <ShoppingCart
                size={22}
                className="group-hover:scale-110 transition-transform"
              />
              {getTotalItems() > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-primary-600 to-primary-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg animate-scale-in">
                  {getTotalItems()}
                </span>
              )}
              <span className="hidden md:inline font-medium">Cart</span>
            </Link>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden text-gray-700"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden pb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search for products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleSearchKeyPress}
              className="input-field pl-12 pr-4"
            />
            <Search
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
          </div>
        </div>

        {/* Navigation - Stores with Logos and Countdown Timer */}
        <nav className="hidden md:flex items-center justify-between gap-3 py-4 border-t border-gray-200/50">
          <div className="flex items-center gap-3">
            {stores.map((store) => (
              <Link
                key={store.path}
                to={store.path}
                className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-primary-50/50 transition-all duration-200 hover:scale-105 group"
              >
                <img
                  src={store.logo}
                  alt={store.name}
                  className="w-8 h-8 object-contain rounded-md"
                />
                <span className="text-gray-700 group-hover:text-primary-600 font-medium transition-colors">
                  {store.name}
                </span>
              </Link>
            ))}
          </div>
          <CountdownTimer />
        </nav>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col gap-4">
              {stores.map((store) => (
                <Link
                  key={store.path}
                  to={store.path}
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 text-gray-700 hover:text-primary-600 font-medium"
                >
                  <img
                    src={store.logo}
                    alt={store.name}
                    className="w-8 h-8 object-contain rounded-md"
                  />
                  <span>{store.name}</span>
                </Link>
              ))}
              {isAuthenticated ? (
                <>
                  <Link
                    to="/account"
                    onClick={() => setIsMenuOpen(false)}
                    className="text-gray-700 hover:text-primary-600 font-medium"
                  >
                    Account
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setIsMenuOpen(false);
                    }}
                    className="text-left text-gray-700 hover:text-primary-600 font-medium"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="text-gray-700 hover:text-primary-600 font-medium"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
