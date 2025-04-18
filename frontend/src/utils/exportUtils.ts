/**
 * Utility functions for exporting data
 */
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

/**
 * Converts an array of objects to a CSV string
 * @param data Array of objects to convert
 * @param headers Optional custom headers mapping (object key to display name)
 * @returns CSV string
 */
export const convertToCSV = <T extends Record<string, any>>(
  data: T[],
  headers?: Record<string, string>
): string => {
  if (data.length === 0) return '';

  // Get all keys from the first object
  const keys = Object.keys(data[0]);
  
  // Create header row using custom headers if provided
  const headerRow = keys.map(key => 
    headers && headers[key] ? headers[key] : key
  ).join(',');
  
  // Create data rows
  const rows = data.map(obj => {
    return keys.map(key => {
      const value = obj[key];
      
      // Handle special values like null, undefined, etc.
      if (value === null || value === undefined) {
        return '';
      }
      
      // If value is a string that contains commas, newlines, or quotes, wrap in quotes and escape any quotes
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      
      return stringValue;
    }).join(',');
  });
  
  // Combine header and data rows
  return [headerRow, ...rows].join('\n');
};

/**
 * Exports data as a CSV file
 * @param data Array of objects to export
 * @param filename Filename without extension
 * @param headers Optional custom headers mapping (object key to display name)
 */
export const exportToCSV = <T extends Record<string, any>>(
  data: T[],
  filename: string,
  headers?: Record<string, string>
): void => {
  // Convert data to CSV
  const csvString = convertToCSV(data, headers);
  
  // Create a Blob with the CSV data
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  
  // Create a temporary link element
  const link = document.createElement('a');
  
  // Create a URL for the Blob
  const url = URL.createObjectURL(blob);
  
  // Set link attributes
  link.href = url;
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  
  // Add link to document
  document.body.appendChild(link);
  
  // Click the link to start download
  link.click();
  
  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Exports data as a PDF file
 * @param data Array of objects to export
 * @param filename Filename without extension
 * @param headers Optional custom headers mapping (object key to display name)
 * @param title Optional title for the PDF document
 */
export const exportToPDF = <T extends Record<string, any>>(
  data: T[],
  filename: string,
  headers?: Record<string, string>,
  title?: string
): void => {
  if (data.length === 0) return;

  // Get all keys from the first object
  const keys = Object.keys(data[0]);

  // Create header row using custom headers if provided
  const headerRow = keys.map(key => 
    headers && headers[key] ? headers[key] : key
  );
  
  // Create data rows
  const bodyRows = data.map(obj => {
    return keys.map(key => {
      const value = obj[key];
      
      // Handle special values like null, undefined, etc.
      if (value === null || value === undefined) {
        return '';
      }
      
      return String(value);
    });
  });

  // Create PDF document
  const doc = new jsPDF();
  
  // Add title if provided
  if (title) {
    doc.text(title, 14, 15);
  }
  
  // Add date
  const now = new Date();
  doc.setFontSize(10);
  doc.text(`Generated on: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`, 14, title ? 22 : 15);
  
  // Add table
  autoTable(doc, {
    head: [headerRow],
    body: bodyRows,
    startY: title ? 25 : 20,
    theme: 'grid',
    headStyles: { fillColor: [66, 66, 66] },
    margin: { top: 20 }
  });
  
  // Save the PDF
  doc.save(`${filename}.pdf`);
};

/**
 * Exports data as an Excel (XLSX) file
 * @param data Array of objects to export
 * @param filename Filename without extension
 * @param headers Optional custom headers mapping (object key to display name)
 * @param sheetName Optional name for the Excel sheet
 */
export const exportToExcel = <T extends Record<string, any>>(
  data: T[],
  filename: string,
  headers?: Record<string, string>,
  sheetName = 'Sheet1'
): void => {
  if (data.length === 0) return;

  // Get all keys from the first object
  const keys = Object.keys(data[0]);
  
  // Prepare the data for Excel
  const excelData: any[][] = [];
  
  // Add header row
  const headerRow = keys.map(key => 
    headers && headers[key] ? headers[key] : key
  );
  excelData.push(headerRow);
  
  // Add data rows
  data.forEach(obj => {
    const row = keys.map(key => {
      const value = obj[key];
      
      // Handle special values like null, undefined, etc.
      if (value === null || value === undefined) {
        return '';
      }
      
      return value;
    });
    excelData.push(row);
  });
  
  // Create a worksheet
  const ws = XLSX.utils.aoa_to_sheet(excelData);
  
  // Create a workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  
  // Save the Excel file
  XLSX.writeFile(wb, `${filename}.xlsx`);
}; 