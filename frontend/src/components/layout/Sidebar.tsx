import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Users, 
  Home, 
  Settings, 
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  BarChart2,
  History,
  UserPlus,
  Menu,
  X,
  Clock
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const Sidebar: React.FC = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const linkClass = ({ isActive }: { isActive: boolean }) => 
    `flex items-center ${isCollapsed ? 'justify-center' : 'px-4'} py-2 my-1 text-sm rounded-md transition-colors ${
      isActive 
        ? 'bg-blue-700 text-white' 
        : 'text-gray-700 hover:bg-blue-100'
    }`;

  const mobileLinkClass = ({ isActive }: { isActive: boolean }) => 
    `flex flex-col items-center justify-center p-2 rounded-md ${
      isActive ? 'text-blue-600' : 'text-gray-600'
    }`;

  return (
    <>
      {/* Desktop Sidebar */}
      <div className={`hidden md:block bg-white h-full shadow-md transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}>
        <div className="p-4">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="mb-4 p-2 rounded-full hover:bg-gray-100 float-right"
          >
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
          
          <div className="py-4 clear-both">
            <NavLink to="/" className={linkClass}>
              <Home className={`h-5 w-5 ${isCollapsed ? 'mx-auto' : ''}`} />
              {!isCollapsed && <span className="ml-3">Dashboard</span>}
            </NavLink>
            
            <NavLink to="/students" className={linkClass}>
              <Users className={`h-5 w-5 ${isCollapsed ? 'mx-auto' : ''}`} />
              {!isCollapsed && <span className="ml-3">Students</span>}
            </NavLink>
            
            <NavLink to="/analytics" className={linkClass}>
              <BarChart2 className={`h-5 w-5 ${isCollapsed ? 'mx-auto' : ''}`} />
              {!isCollapsed && <span className="ml-3">Analytics</span>}
            </NavLink>
            
            <NavLink to="/hours" className={linkClass}>
              <Clock className={`h-5 w-5 ${isCollapsed ? 'mx-auto' : ''}`} />
              {!isCollapsed && <span className="ml-3">Hour Dashboard</span>}
            </NavLink>
            
            {isAdmin && (
              <>
                <NavLink to="/users" className={linkClass}>
                  <UserPlus className={`h-5 w-5 ${isCollapsed ? 'mx-auto' : ''}`} />
                  {!isCollapsed && <span className="ml-3">Users</span>}
                </NavLink>
                
                <NavLink to="/import-export" className={linkClass}>
                  <FileSpreadsheet className={`h-5 w-5 ${isCollapsed ? 'mx-auto' : ''}`} />
                  {!isCollapsed && <span className="ml-3">Import/Export</span>}
                </NavLink>
                
                <NavLink to="/audit-logs" className={linkClass}>
                  <History className={`h-5 w-5 ${isCollapsed ? 'mx-auto' : ''}`} />
                  {!isCollapsed && <span className="ml-3">Audit Logs</span>}
                </NavLink>
                
                <NavLink to="/settings" className={linkClass}>
                  <Settings className={`h-5 w-5 ${isCollapsed ? 'mx-auto' : ''}`} />
                  {!isCollapsed && <span className="ml-3">Settings</span>}
                </NavLink>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="grid grid-cols-5 gap-1 p-2">
          <NavLink to="/" className={mobileLinkClass}>
            <Home className="h-5 w-5" />
            <span className="text-xs mt-1">Home</span>
          </NavLink>
          
          <NavLink to="/students" className={mobileLinkClass}>
            <Users className="h-5 w-5" />
            <span className="text-xs mt-1">Students</span>
          </NavLink>
          
          <NavLink to="/analytics" className={mobileLinkClass}>
            <BarChart2 className="h-5 w-5" />
            <span className="text-xs mt-1">Analytics</span>
          </NavLink>
          
          {isAdmin && (
            <NavLink to="/users" className={mobileLinkClass}>
              <UserPlus className="h-5 w-5" />
              <span className="text-xs mt-1">Users</span>
            </NavLink>
          )}
          
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center p-2 rounded-md text-gray-600"
          >
            <Menu className="h-5 w-5" />
            <span className="text-xs mt-1">More</span>
          </button>
        </div>
      </div>

      {/* Mobile Full Screen Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-white z-50 flex flex-col">
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="text-lg font-semibold">Menu</h2>
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <X size={24} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            <NavLink 
              to="/" 
              className="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 rounded-md"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Home className="h-5 w-5 mr-3" />
              <span>Dashboard</span>
            </NavLink>
            
            <NavLink 
              to="/students" 
              className="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 rounded-md"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Users className="h-5 w-5 mr-3" />
              <span>Students</span>
            </NavLink>
            
            <NavLink 
              to="/analytics" 
              className="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 rounded-md"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <BarChart2 className="h-5 w-5 mr-3" />
              <span>Analytics</span>
            </NavLink>
            
            <NavLink 
              to="/hours" 
              className="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 rounded-md"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Clock className="h-5 w-5 mr-3" />
              <span>Hour Dashboard</span>
            </NavLink>
            
            {isAdmin && (
              <>
                <NavLink 
                  to="/users" 
                  className="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 rounded-md"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <UserPlus className="h-5 w-5 mr-3" />
                  <span>Users</span>
                </NavLink>
                
                <NavLink 
                  to="/import-export" 
                  className="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 rounded-md"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <FileSpreadsheet className="h-5 w-5 mr-3" />
                  <span>Import/Export</span>
                </NavLink>
                
                <NavLink 
                  to="/audit-logs" 
                  className="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 rounded-md"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <History className="h-5 w-5 mr-3" />
                  <span>Audit Logs</span>
                </NavLink>
                
                <NavLink 
                  to="/settings" 
                  className="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 rounded-md"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Settings className="h-5 w-5 mr-3" />
                  <span>Settings</span>
                </NavLink>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;