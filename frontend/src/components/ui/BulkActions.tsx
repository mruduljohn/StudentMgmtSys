import React, { useState } from 'react';
import {ChevronDown } from 'lucide-react';
import Button from './Button';

export interface BulkAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  onClick: () => void;
}

interface BulkActionsProps {
  selectedCount: number;
  actions: BulkAction[];
}

const BulkActions: React.FC<BulkActionsProps> = ({ selectedCount, actions }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="relative">
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium text-gray-700">
          {selectedCount} selected
        </span>
        
        {/* Show the first action as a primary button */}
        {actions.length > 0 && (
          <Button
            variant={actions[0].variant || 'primary'}
            size="sm"
            onClick={actions[0].onClick}
            className="flex items-center"
          >
            {actions[0].icon}
            <span className="ml-1">{actions[0].label}</span>
          </Button>
        )}
        
        {/* Show dropdown for additional actions */}
        {actions.length > 1 && (
          <div className="relative">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center"
            >
              More Actions
              <ChevronDown size={16} className="ml-1" />
            </Button>
            
            {isOpen && (
              <div 
                className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 py-1"
                onBlur={() => setIsOpen(false)}
              >
                {actions.slice(1).map((action) => (
                  <button
                    key={action.id}
                    onClick={() => {
                      action.onClick();
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center ${
                      action.variant === 'danger' ? 'text-red-600' : 'text-gray-700'
                    }`}
                  >
                    {action.icon}
                    <span className="ml-2">{action.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Overlay to close dropdown when clicking outside */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default BulkActions; 