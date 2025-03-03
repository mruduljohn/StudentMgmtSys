import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Users, 
  UserCog, 
  Home, 
  Settings, 
  FileSpreadsheet 
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const Sidebar: React.FC = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  const linkClass = ({ isActive }: { isActive: boolean }) => 
    `flex items-center px-4 py-2 my-1 text-sm rounded-md ${
      isActive 
        ? 'bg-blue-700 text-white' 
        : 'text-gray-700 hover:bg-blue-100'
    }`;

  return (
    <div className="w-64 bg-white h-full shadow-md">
      <div className="p-4">
        <div className="py-4">
          <NavLink to="/" className={linkClass}>
            <Home className="mr-3 h-5 w-5" />
            Dashboard
          </NavLink>
          
          <NavLink to="/students" className={linkClass}>
            <Users className="mr-3 h-5 w-5" />
            Students
          </NavLink>
          
          {isAdmin && (
            <>
              <NavLink to="/mentors" className={linkClass}>
                <UserCog className="mr-3 h-5 w-5" />
                Mentors
              </NavLink>
              
              <NavLink to="/import-export" className={linkClass}>
                <FileSpreadsheet className="mr-3 h-5 w-5" />
                Import/Export
              </NavLink>
              
              <NavLink to="/settings" className={linkClass}>
                <Settings className="mr-3 h-5 w-5" />
                Settings
              </NavLink>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;