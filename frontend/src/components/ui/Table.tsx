import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

// Define types for cell content
interface SelectCellProps {
  type: 'checkbox';
  checked: boolean;
  onChange: (checked: boolean) => void;
}

interface StatusCellProps {
  type: 'status';
  value: string;
  options: Record<string, { label: string; color: string }>;
}

interface ActionItem {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'danger';
}

interface ActionsCellProps {
  type: 'actions';
  items: ActionItem[];
}

// Define a generic type for table data items
export interface TableItem {
  [key: string]: unknown;
  select?: SelectCellProps;
}

interface TableColumn {
  id: string;
  label: string;
  width?: string;
  frozen?: boolean;
  sortable?: boolean;
}

interface TableProps<T extends TableItem> {
  columns: TableColumn[];
  data: T[];
  onRowClick?: (item: T) => void;
  isSelectable?: boolean;
  emptyMessage?: string;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (field: string, order: 'asc' | 'desc') => void;
}

function Table<T extends TableItem>({
  columns,
  data,
  onRowClick,
  isSelectable = false,
  emptyMessage = "No data available",
  sortField,
  sortOrder,
  onSort
}: TableProps<T>) {
  // Always make the first two columns (ID and Name) frozen
  const enhancedColumns = columns.map((col, index) => ({
    ...col,
    frozen: index < 2 ? true : col.frozen
  }));
  
  const frozenColumns = enhancedColumns.filter(col => col.frozen);
  const scrollableColumns = enhancedColumns.filter(col => !col.frozen);

  // Calculate left position for frozen columns
  const getLeftPosition = (index: number): string => {
    let position = 0;
    
    // If selectable, add checkbox width
    if (isSelectable && index > 0) {
      position += 40;
    }
    
    // Add width of previous frozen columns
    for (let i = 0; i < index; i++) {
      const colWidth = parseInt(frozenColumns[i].width || '100px');
      position += colWidth;
    }
    
    return `${position}px`;
  };

  if (data.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden border border-gray-200 rounded-lg">
      <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
        <table className="min-w-full divide-y divide-gray-200 table-fixed">
          <thead className="bg-gray-50 sticky top-0 z-20">
            <tr>
              {isSelectable && (
                <th className="sticky left-0 z-30 w-10 px-4 py-3 bg-gray-50 border-r border-gray-200">
                  <span className="sr-only">Select</span>
                </th>
              )}
              
              {frozenColumns.map((column, index) => {
                const isFrozen = column.frozen;
                const leftPosition = getLeftPosition(index);
                
                // Determine if this column is currently being sorted
                const isSorted = sortField === column.id;
                const currentSortOrder = sortOrder || 'asc';
                
                return (
                  <th
                    key={`frozen-${column.id}`}
                    scope="col"
                    className={`sticky z-30 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                      isFrozen ? 'bg-gray-50' : ''
                    }`}
                    style={{
                      width: column.width || '100px',
                      left: isFrozen ? leftPosition : 'auto',
                      minWidth: isFrozen ? '120px' : '100px'
                    }}
                    onClick={() => {
                      if (column.sortable && onSort) {
                        // Toggle sort order if already sorting by this field
                        const newOrder = isSorted && currentSortOrder === 'asc' ? 'desc' : 'asc';
                        onSort(column.id, newOrder);
                      }
                    }}
                  >
                    <div className={`flex items-center ${column.sortable ? 'cursor-pointer hover:text-gray-700' : ''}`}>
                      {column.label}
                      
                      {column.sortable && (
                        <span className="ml-1">
                          {isSorted && currentSortOrder === 'asc' ? (
                            <ArrowUp size={14} />
                          ) : isSorted && currentSortOrder === 'desc' ? (
                            <ArrowDown size={14} />
                          ) : (
                            <span className="text-gray-300">
                              <ArrowUp size={14} />
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
              
              {scrollableColumns.map((column) => {
                // Determine if this column is currently being sorted
                const isSorted = sortField === column.id;
                const currentSortOrder = sortOrder || 'asc';
                
                return (
                  <th
                    key={column.id}
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    style={{ 
                      width: column.width || 'auto',
                      minWidth: '100px' // Ensure minimum width for mobile
                    }}
                    onClick={() => {
                      if (column.sortable && onSort) {
                        // Toggle sort order if already sorting by this field
                        const newOrder = isSorted && currentSortOrder === 'asc' ? 'desc' : 'asc';
                        onSort(column.id, newOrder);
                      }
                    }}
                  >
                    <div className={`flex items-center ${column.sortable ? 'cursor-pointer hover:text-gray-700' : ''}`}>
                      {column.label}
                      
                      {column.sortable && (
                        <span className="ml-1">
                          {isSorted && currentSortOrder === 'asc' ? (
                            <ArrowUp size={14} />
                          ) : isSorted && currentSortOrder === 'desc' ? (
                            <ArrowDown size={14} />
                          ) : (
                            <span className="text-gray-300">
                              <ArrowUp size={14} />
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item, rowIndex) => {
              const isSelected = item.select?.checked;
              
              return (
                <tr
                  key={`row-${rowIndex}`}
                  onClick={(e) => {
                    // Only trigger row click if not clicking on a checkbox
                    if (onRowClick && !e.defaultPrevented) {
                      onRowClick(item);
                    }
                  }}
                  className={`${onRowClick ? 'cursor-pointer' : ''} ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                >
                  {isSelectable && (
                    <td className="sticky left-0 z-20 w-10 px-4 py-4 whitespace-nowrap border-r border-gray-200"
                        style={{ backgroundColor: isSelected ? 'rgb(239 246 255)' : 'white' }}>
                      {item.select && (
                        <input
                          type="checkbox"
                          checked={item.select.checked}
                          onChange={(e) => {
                            e.preventDefault(); // Prevent the row click
                            e.stopPropagation(); // Stop event propagation
                            if (item.select?.onChange) {
                              item.select.onChange(e.target.checked);
                            }
                          }}
                          onClick={(e) => {
                            e.preventDefault(); // Prevent the row click
                            e.stopPropagation(); // Stop event propagation
                          }}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      )}
                    </td>
                  )}
                  
                  {frozenColumns.map((column, index) => {
                    const cellContent = renderCellContent(item[column.id]);
                    
                    return (
                      <td 
                        key={`frozen-${column.id}-${rowIndex}`} 
                        className="sticky z-20 px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-r border-gray-200"
                        style={{ 
                          left: getLeftPosition(index),
                          backgroundColor: isSelected ? 'rgb(239 246 255)' : 'white'
                        }}
                      >
                        {cellContent}
                      </td>
                    );
                  })}
                  
                  {scrollableColumns.map((column) => {
                    const cellContent = renderCellContent(item[column.id]);
                    
                    return (
                      <td 
                        key={`scrollable-${column.id}-${rowIndex}`} 
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                      >
                        {cellContent}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Helper function to render cell content based on type
function renderCellContent(content: unknown): React.ReactNode {
  if (!content) {
    return null;
  }
  
  if (typeof content === 'object' && content !== null) {
    if ('type' in content) {
      const typedContent = content as { type: string };
      
      if (typedContent.type === 'status') {
        const statusContent = content as StatusCellProps;
        const statusOption = statusContent.options[statusContent.value] || 
          { label: statusContent.value, color: 'bg-gray-100 text-gray-800' };
        
        return (
          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusOption.color}`}>
            {statusOption.label}
          </span>
        );
      }
      
      if (typedContent.type === 'actions') {
        const actionsContent = content as ActionsCellProps;
        return (
          <div className="flex space-x-2">
            {actionsContent.items.map((action, index) => (
              <button
                key={`action-${index}`}
                onClick={(e) => {
                  e.stopPropagation();
                  action.onClick();
                }}
                className={`p-1 rounded hover:bg-gray-100 ${action.variant === 'danger' ? 'text-red-600 hover:bg-red-50' : 'text-blue-600 hover:bg-blue-50'}`}
                title={action.label}
              >
                {action.icon}
              </button>
            ))}
          </div>
        );
      }
    }
  }
  
  return content as React.ReactNode;
}

export default Table;