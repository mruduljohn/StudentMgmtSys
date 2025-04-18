import React from 'react';
import { File, ExternalLink } from 'lucide-react';

interface PDFViewerProps {
  title: string;
  filePath: string;
  description?: string;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ title, filePath, description }) => {
  const fullPath = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}${filePath}`;
  
  const openPDF = () => {
    window.open(fullPath, '_blank');
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-gray-800 mb-1">{title}</h3>
            {description && (
              <p className="text-gray-600 text-sm mb-3">{description}</p>
            )}
          </div>
          <div className="flex-shrink-0 ml-2">
            <File size={24} className="text-red-500" />
          </div>
        </div>
      </div>
      <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
        <button
          onClick={openPDF}
          className="w-full flex items-center justify-center text-blue-600 hover:text-blue-800 font-medium text-sm"
        >
          <ExternalLink size={16} className="mr-2" />
          Open PDF
        </button>
      </div>
    </div>
  );
};

export default PDFViewer; 