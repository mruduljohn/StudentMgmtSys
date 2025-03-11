import React, { useState } from 'react';

export interface FilterOption {
  id: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'boolean' | 'number';
  options?: { value: string; label: string }[];
  placeholder?: string;
}

export interface FilterValue {
  [key: string]: string | boolean | number | null;
}

interface FilterPanelProps {
  filters: FilterOption[];
  onApplyFilters: (filters: FilterValue) => void;
  onResetFilters: () => void;
  initialValues?: FilterValue;
  isOpen: boolean;
  onClose: () => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onApplyFilters,
  onResetFilters,
  initialValues = {},
  isOpen,
  onClose,
}) => {
  const [filterValues, setFilterValues] = useState<FilterValue>(initialValues);

  const handleInputChange = (id: string, value: string | boolean | number | null) => {
    setFilterValues((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleApplyFilters = () => {
    onApplyFilters(filterValues);
    onClose();
  };

  const handleResetFilters = () => {
    setFilterValues({});
    onResetFilters();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="filter-panel-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>

        {/* Panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900" id="filter-panel-title">
                  Filter Options
                </h3>
                <div className="mt-4 space-y-4">
                  {filters.map((filter) => (
                    <div key={filter.id} className="grid grid-cols-1 gap-2">
                      <label htmlFor={filter.id} className="block text-sm font-medium text-gray-700">
                        {filter.label}
                      </label>
                      {filter.type === 'text' && (
                        <input
                          type="text"
                          id={filter.id}
                          value={(filterValues[filter.id] as string) || ''}
                          onChange={(e) => handleInputChange(filter.id, e.target.value)}
                          placeholder={filter.placeholder}
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      )}
                      {filter.type === 'number' && (
                        <input
                          type="number"
                          id={filter.id}
                          value={(filterValues[filter.id] as number) || ''}
                          onChange={(e) => handleInputChange(filter.id, e.target.value ? Number(e.target.value) : null)}
                          placeholder={filter.placeholder}
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      )}
                      {filter.type === 'date' && (
                        <input
                          type="date"
                          id={filter.id}
                          value={(filterValues[filter.id] as string) || ''}
                          onChange={(e) => handleInputChange(filter.id, e.target.value)}
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      )}
                      {filter.type === 'select' && filter.options && (
                        <select
                          id={filter.id}
                          value={(filterValues[filter.id] as string) || ''}
                          onChange={(e) => handleInputChange(filter.id, e.target.value)}
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        >
                          <option value="">Select {filter.label}</option>
                          {filter.options.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      )}
                      {filter.type === 'boolean' && (
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id={filter.id}
                            checked={!!filterValues[filter.id]}
                            onChange={(e) => handleInputChange(filter.id, e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor={filter.id} className="ml-2 block text-sm text-gray-900">
                            {filter.placeholder || 'Yes'}
                          </label>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={handleApplyFilters}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Apply Filters
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterPanel; 