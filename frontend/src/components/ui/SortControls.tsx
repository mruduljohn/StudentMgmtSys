import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

export interface SortOption {
  value: string;
  label: string;
}

interface SortControlsProps {
  options: SortOption[];
  currentSortField: string;
  currentSortOrder: 'asc' | 'desc';
  onSortChange: (field: string, order: 'asc' | 'desc') => void;
}

const SortControls: React.FC<SortControlsProps> = ({
  options,
  currentSortField,
  currentSortOrder,
  onSortChange,
}) => {
  const handleSortFieldChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onSortChange(e.target.value, currentSortOrder);
  };

  const toggleSortOrder = () => {
    const newOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
    onSortChange(currentSortField, newOrder);
  };

  return (
    <div className="flex items-center space-x-2">
      <label htmlFor="sortField" className="text-sm font-medium text-gray-700">
        Sort by:
      </label>
      <div className="relative">
        <select
          id="sortField"
          value={currentSortField}
          onChange={handleSortFieldChange}
          className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <button
        type="button"
        onClick={toggleSortOrder}
        className="inline-flex items-center p-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        {currentSortOrder === 'asc' ? (
          <ArrowUp size={16} />
        ) : (
          <ArrowDown size={16} />
        )}
        <span className="sr-only">
          {currentSortOrder === 'asc' ? 'Sort ascending' : 'Sort descending'}
        </span>
      </button>
    </div>
  );
};

export default SortControls; 