import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { User, Package, MapPin, CreditCard } from 'lucide-react';

const Account = () => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">Please Login</h1>
        <p className="text-gray-600 mb-8">You need to be logged in to view your account.</p>
        <Link to="/login" className="btn-primary">
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">My Account</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Account Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-6">
              <User size={24} className="text-primary-600" />
              <h2 className="text-2xl font-semibold">Personal Information</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Full Name</label>
                <input
                  type="text"
                  value={user?.name || ''}
                  className="input-field"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  className="input-field"
                  readOnly
                />
              </div>
              <button className="btn-outline">
                Edit Information
              </button>
            </div>
          </div>

          {/* Address Book */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-6">
              <MapPin size={24} className="text-primary-600" />
              <h2 className="text-2xl font-semibold">Address Book</h2>
            </div>
            
            <p className="text-gray-600 mb-4">No saved addresses yet.</p>
            <button className="btn-outline">
              Add New Address
            </button>
          </div>

          {/* Payment Methods */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-6">
              <CreditCard size={24} className="text-primary-600" />
              <h2 className="text-2xl font-semibold">Payment Methods</h2>
            </div>
            
            <p className="text-gray-600 mb-4">No saved payment methods yet.</p>
            <button className="btn-outline">
              Add Payment Method
            </button>
          </div>
        </div>

        {/* Quick Links Sidebar */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-24">
            <h3 className="text-xl font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/orders"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Package size={20} />
                  <span>Order History</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/products"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Package size={20} />
                  <span>Continue Shopping</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Account;

