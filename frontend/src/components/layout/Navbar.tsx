import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import Button from '../ui/Button';

const Navbar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

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
              <span className="font-bold text-xl">Student Management System</span>
            </Link>
          </div>
          
          {user && (
            <div className="flex items-center">
              <div className="mr-4">
                <span className="text-sm mr-2">Logged in as:</span>
                <span className="font-medium">{user.name}</span>
                <span className="ml-2 bg-blue-700 px-2 py-1 rounded-full text-xs">
                  {user.role === 'admin' ? 'Admin' : 'Mentor'}
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
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;