import React from 'react';
import { ChevronRight } from 'lucide-react';
import { TableItem } from './Table';

interface MobileTableProps<T extends TableItem> {
  columns: Array<{
    id: string;
    label: string;
  }>;
  data: T[];
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  priorityFields?: string[]; // Fields to always show in the preview
}

function MobileTable<T extends TableItem>({
  columns,
  data,
  onRowClick,
  emptyMessage = "No data available",
  priorityFields = ['name', 'studentId'] // Default priority fields
}: MobileTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="flex justify-center items-center h-32 bg-white rounded-lg shadow">
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  // Create a map of column IDs to labels for easy lookup
  const columnMap = columns.reduce((acc, col) => {
    acc[col.id] = col.label;
    return acc;
  }, {} as Record<string, string>);

  return (
    <div className="space-y-4">
      {data.map((item, index) => {
        // Get priority fields to display in the card header
        const priorityValues = priorityFields.map(field => ({
          label: columnMap[field] || field,
          value: item[field]
        })).filter(f => f.value !== undefined);

        return (
          <div 
            key={`mobile-row-${index}`}
            className="bg-white rounded-lg shadow overflow-hidden"
            onClick={onRowClick ? () => onRowClick(item) : undefined}
          >
            <div className="p-4 border-b flex justify-between items-center">
              <div>
                {priorityValues.map((field, i) => (
                  <div key={`priority-${i}`} className={i === 0 ? "font-medium text-gray-900" : "text-sm text-gray-500"}>
                    {renderValue(field.value)}
                  </div>
                ))}
              </div>
              {onRowClick && (
                <ChevronRight className="h-5 w-5 text-gray-400" />
              )}
            </div>
            
            <div className="p-4 space-y-2">
              {columns
                .filter(col => !priorityFields.includes(col.id) && item[col.id] !== undefined && item[col.id] !== '')
                .slice(0, 5) // Limit to 5 additional fields to avoid overwhelming
                .map(col => (
                  <div key={`detail-${col.id}`} className="flex justify-between text-sm">
                    <span className="text-gray-500">{col.label}:</span>
                    <span className="text-gray-900 font-medium">{renderValue(item[col.id])}</span>
                  </div>
                ))}
              
              {columns.filter(col => !priorityFields.includes(col.id) && item[col.id] !== undefined && item[col.id] !== '').length > 5 && (
                <div className="text-center text-xs text-blue-600 mt-2">
                  {onRowClick ? "Tap to view more details" : "More details available"}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Helper function to render different types of values
function renderValue(value: unknown): React.ReactNode {
  if (value === null || value === undefined) {
    return '-';
  }
  
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  
  if (typeof value === 'object') {
    if (React.isValidElement(value)) {
      return value;
    }
    return JSON.stringify(value);
  }
  
  return String(value);
}

export default MobileTable; 