import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, User, Menu, X } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import Button from '../ui/Button';

const Navbar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-blue-600 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <User className="h-8 w-8 mr-2" />
              <span className="font-bold text-xl hidden md:block">Brilliant Student Management System</span>
              <span className="font-bold text-xl md:hidden">Brilliant SMS</span>
            </Link>
          </div>
          
          <div className="flex items-center">
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center">
              {user && (
                <>
                  <div className="mr-4">
                    <span className="text-sm mr-2">Logged in as:</span>
                    <span className="font-medium">{user.name}</span>
                    <span className="ml-2 bg-blue-700 px-2 py-1 rounded-full text-xs">
                      {user.role === 'ADMIN' ? 'Admin' : 'Mentor'}
                    </span>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleLogout}
                    className="flex items-center"
                  >
                    <LogOut size={16} className="mr-1" />
                    Logout
                  </Button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-md hover:bg-blue-700 focus:outline-none"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-blue-700 py-3">
            {user && (
              <div className="px-2 space-y-3">
                <div className="text-sm">
                  <span className="block">Logged in as:</span>
                  <span className="font-medium">{user.name}</span>
                  <span className="ml-2 bg-blue-700 px-2 py-1 rounded-full text-xs">
                    {user.role === 'ADMIN' ? 'Admin' : 'Mentor'}
                  </span>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleLogout}
                  className="flex items-center w-full justify-center"
                >
                  <LogOut size={16} className="mr-1" />
                  Logout
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;