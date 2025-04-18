import React, { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import PDFViewer from './PDFViewer';
import { useDashboardStore } from '../../store/dashboardStore';
import { useAuthStore } from '../../store/authStore';
import { Pencil, Plus } from 'lucide-react';

interface PDFSectionProps {
  onConfigClick?: () => void;
}

const PDFSection: React.FC<PDFSectionProps> = observer(({ onConfigClick }) => {
  const dashboardStore = useDashboardStore();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    const loadPDFs = async () => {
      try {
        await dashboardStore.fetchDashboardPDFs();
      } catch (error) {
        console.error('Failed to load dashboard PDFs:', error);
      }
    };

    loadPDFs();
  }, [dashboardStore]);

  if (dashboardStore.isLoading) {
    return (
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Important Documents</h2>
        </div>
        <div className="bg-white p-8 rounded-lg shadow-md flex justify-center items-center">
          <div className="animate-pulse">Loading documents...</div>
        </div>
      </div>
    );
  }

  const pdfs = dashboardStore.getDashboardPDFs;

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Important Documents</h2>
        {isAdmin && onConfigClick && (
          <button
            onClick={onConfigClick}
            className="flex items-center text-sm bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1 rounded"
          >
            {pdfs.length === 0 ? (
              <>
                <Plus size={16} className="mr-1" />
                Add Documents
              </>
            ) : (
              <>
                <Pencil size={16} className="mr-1" />
                Configure
              </>
            )}
          </button>
        )}
      </div>

      {pdfs.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-md flex justify-center items-center">
          <p className="text-gray-500">No documents available</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pdfs.slice(0, 3).map((pdf, index) => (
            <PDFViewer
              key={index}
              title={pdf.title}
              filePath={pdf.filePath}
              description={pdf.description}
            />
          ))}
        </div>
      )}
    </div>
  );
});

export default PDFSection; 