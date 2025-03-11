import React, { useState } from 'react';
import { Search, X, ChevronDown, ChevronUp } from 'lucide-react';
import Input from './Input';
import Button from './Button';

export interface SearchField {
  id: string;
  label: string;
  type: 'text' | 'select' | 'number' | 'date';
  options?: { value: string; label: string }[];
  placeholder?: string;
}

interface AdvancedSearchProps {
  onSearch: (query: string, fields: Record<string, string>) => void;
  searchFields: SearchField[];
  initialQuery?: string;
}

const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  onSearch,
  searchFields,
  initialQuery = '',
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});

  const handleBasicSearch = () => {
    onSearch(query, {});
  };

  const handleAdvancedSearch = () => {
    onSearch(query, fieldValues);
  };

  const handleInputChange = (id: string, value: string) => {
    setFieldValues((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleClearSearch = () => {
    setQuery('');
    setFieldValues({});
    onSearch('', {});
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleBasicSearch();
    }
  };

  return (
    <div className="w-full">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <Input
          type="text"
          placeholder="Search..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          className="pl-10 pr-24"
          fullWidth
        />
        <div className="absolute inset-y-0 right-0 flex items-center">
          {query && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="p-2 text-gray-400 hover:text-gray-600 flex items-center"
          >
            {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            <span className="sr-only">
              {showAdvanced ? 'Hide advanced search' : 'Show advanced search'}
            </span>
          </button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleBasicSearch}
            className="mr-2"
          >
            Search
          </Button>
        </div>
      </div>

      {showAdvanced && (
        <div className="mt-3 p-4 bg-gray-50 rounded-md border border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Advanced Search</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {searchFields.map((field) => (
              <div key={field.id} className="space-y-1">
                <label htmlFor={field.id} className="block text-xs font-medium text-gray-700">
                  {field.label}
                </label>
                {field.type === 'text' && (
                  <Input
                    id={field.id}
                    type="text"
                    placeholder={field.placeholder}
                    value={fieldValues[field.id] || ''}
                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                    fullWidth
                  />
                )}
                {field.type === 'number' && (
                  <Input
                    id={field.id}
                    type="number"
                    placeholder={field.placeholder}
                    value={fieldValues[field.id] || ''}
                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                    fullWidth
                  />
                )}
                {field.type === 'date' && (
                  <Input
                    id={field.id}
                    type="date"
                    value={fieldValues[field.id] || ''}
                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                    fullWidth
                  />
                )}
                {field.type === 'select' && field.options && (
                  <select
                    id={field.id}
                    value={fieldValues[field.id] || ''}
                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    <option value="">Select {field.label}</option>
                    {field.options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-end">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleClearSearch}
              className="mr-2"
            >
              Clear
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleAdvancedSearch}
            >
              Search
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedSearch; 