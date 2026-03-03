import { Link } from "react-router-dom";
import {
  Facebook,
  Twitter,
  Instagram,
  Mail,
  MapPin,
} from "lucide-react";

const Footer = () => {
  const handleSocialClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    // Prevent default behavior that causes random page spawning
  };

  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-300 mt-auto border-t border-gray-700/50">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* About */}
          <div>
            <h3 className="text-white text-3xl font-extrabold mb-4 gradient-text">
              Grocy
            </h3>
            <p className="text-gray-400 mb-6 leading-relaxed">
              AI-powered grocery price comparison platform aggregating products
              from Al-Fatah, Metro, Jalal Sons, Raja Sahib, and Rahim Store -
              helping you find the best deals across Pakistan.
            </p>
            <div className="flex gap-3">
              <a
                href="#"
                onClick={handleSocialClick}
                className="bg-gray-800 hover:bg-primary-600 p-3 rounded-xl transition-all duration-300 hover:scale-110"
              >
                <Facebook size={20} />
              </a>
              <a
                href="#"
                onClick={handleSocialClick}
                className="bg-gray-800 hover:bg-primary-600 p-3 rounded-xl transition-all duration-300 hover:scale-110"
              >
                <Twitter size={20} />
              </a>
              <a
                href="#"
                onClick={handleSocialClick}
                className="bg-gray-800 hover:bg-primary-600 p-3 rounded-xl transition-all duration-300 hover:scale-110"
              >
                <Instagram size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold text-lg mb-6">Quick Links</h4>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/"
                  className="text-gray-400 hover:text-primary-400 transition-colors duration-200 hover:translate-x-1 inline-block"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/products"
                  className="text-gray-400 hover:text-primary-400 transition-colors duration-200 hover:translate-x-1 inline-block"
                >
                  Compare Prices
                </Link>
              </li>
              <li>
                <Link
                  to="/products/al-fatah"
                  className="text-gray-400 hover:text-primary-400 transition-colors duration-200 hover:translate-x-1 inline-block"
                >
                  Browse by Store
                </Link>
              </li>
              <li>
                <Link
                  to="/cart"
                  className="text-gray-400 hover:text-primary-400 transition-colors duration-200 hover:translate-x-1 inline-block"
                >
                  Shopping Cart
                </Link>
              </li>
            </ul>
          </div>

          {/* Features */}
          <div>
            <h4 className="text-white font-bold text-lg mb-6">Features</h4>
            <ul className="space-y-3">
              <li className="text-gray-400">AI-Powered Recommendations</li>
              <li className="text-gray-400">Real-time Price Comparison</li>
              <li className="text-gray-400">Smart Product Matching</li>
              <li className="text-gray-400">Savings Analytics</li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-white font-bold text-lg mb-6">Contact Us</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="bg-primary-600/20 p-2 rounded-lg">
                  <MapPin size={18} className="text-primary-400" />
                </div>
                <span className="text-gray-400">
                  Remote-based operation, Lahore, Pakistan
                </span>
              </li>
              <li className="flex items-center gap-3">
                <div className="bg-primary-600/20 p-2 rounded-lg">
                  <Mail size={18} className="text-primary-400" />
                </div>
                <span className="text-gray-400">contact@grocy.pk</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700/50 mt-12 pt-8 text-center">
          <p className="text-gray-500">
            &copy; 2024 Grocy. Intelligent grocery shopping powered by AI.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
