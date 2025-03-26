import React, { useEffect, useRef } from 'react';

interface MenuItem {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
}

interface MenuProps {
  items: MenuItem[];
  onClose: () => void;
  className?: string;
}

const Menu: React.FC<MenuProps> = ({ items, onClose, className = '' }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div 
      ref={menuRef}
      className={`absolute z-50 bg-white shadow-lg rounded-md py-1 w-48 ${className}`}
    >
      {items.map((item, index) => (
        <button
          key={index}
          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
          onClick={() => {
            item.onClick();
            onClose();
          }}
        >
          {item.icon && <span className="mr-2">{item.icon}</span>}
          {item.label}
        </button>
      ))}
    </div>
  );
};

export default Menu; 