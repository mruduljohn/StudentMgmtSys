import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Users, 
  UserCog, 
  Home, 
  Settings, 
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  BarChart2,
  ClipboardList
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const Sidebar: React.FC = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Modified linkClass to center icons when collapsed
  const linkClass = ({ isActive }: { isActive: boolean }) => 
    `flex ${isCollapsed ? 'justify-center' : 'items-center'} px-4 py-2 my-1 text-sm rounded-md transition-colors ${
      isActive 
        ? 'bg-blue-700 text-white' 
        : 'text-gray-700 hover:bg-blue-100'
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
              <Home className="h-5 w-5" />
              {!isCollapsed && <span className="ml-3">Dashboard</span>}
            </NavLink>
            
            <NavLink to="/students" className={linkClass}>
              <Users className="h-5 w-5" />
              {!isCollapsed && <span className="ml-3">Students</span>}
            </NavLink>
            
            <NavLink to="/analytics" className={linkClass}>
              <BarChart2 className="h-5 w-5" />
              {!isCollapsed && <span className="ml-3">Analytics</span>}
            </NavLink>
            
            {isAdmin && (
              <>
                <NavLink to="/mentors" className={linkClass}>
                  <UserCog className="h-5 w-5" />
                  {!isCollapsed && <span className="ml-3">Mentors</span>}
                </NavLink>
                
                <NavLink to="/import-export" className={linkClass}>
                  <FileSpreadsheet className="h-5 w-5" />
                  {!isCollapsed && <span className="ml-3">Import/Export</span>}
                </NavLink>
                
                <NavLink to="/audit-logs" className={linkClass}>
                  <ClipboardList className="h-5 w-5" />
                  {!isCollapsed && <span className="ml-3">Audit Logs</span>}
                </NavLink>
                
                <NavLink to="/settings" className={linkClass}>
                  <Settings className="h-5 w-5" />
                  {!isCollapsed && <span className="ml-3">Settings</span>}
                </NavLink>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="grid grid-cols-4 gap-1 p-2">
          <NavLink to="/" className={({ isActive }) => 
            `flex flex-col items-center justify-center p-2 rounded-md ${
              isActive ? 'text-blue-600' : 'text-gray-600'
            }`
          }>
            <Home className="h-5 w-5" />
            <span className="text-xs mt-1">Dashboard</span>
          </NavLink>
          
          <NavLink to="/students" className={({ isActive }) => 
            `flex flex-col items-center justify-center p-2 rounded-md ${
              isActive ? 'text-blue-600' : 'text-gray-600'
            }`
          }>
            <Users className="h-5 w-5" />
            <span className="text-xs mt-1">Students</span>
          </NavLink>
          
          <NavLink to="/analytics" className={({ isActive }) => 
            `flex flex-col items-center justify-center p-2 rounded-md ${
              isActive ? 'text-blue-600' : 'text-gray-600'
            }`
          }>
            <BarChart2 className="h-5 w-5" />
            <span className="text-xs mt-1">Analytics</span>
          </NavLink>
          
          {isAdmin ? (
            <NavLink to="/settings" className={({ isActive }) => 
              `flex flex-col items-center justify-center p-2 rounded-md ${
                isActive ? 'text-blue-600' : 'text-gray-600'
              }`
            }>
              <Settings className="h-5 w-5" />
              <span className="text-xs mt-1">Settings</span>
            </NavLink>
          ) : (
            <NavLink to="/settings" className={({ isActive }) => 
              `flex flex-col items-center justify-center p-2 rounded-md ${
                isActive ? 'text-blue-600' : 'text-gray-600'
              }`
            }>
              <Settings className="h-5 w-5" />
              <span className="text-xs mt-1">Settings</span>
            </NavLink>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar; 