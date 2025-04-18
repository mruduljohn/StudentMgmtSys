import React, { useState, useEffect, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { useDashboardStore } from '../../store/dashboardStore';
import { X, Trash, Plus, Upload } from 'lucide-react';
import toast from 'react-hot-toast';

interface PDFConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PDFItem {
  title: string;
  file?: File;
  description: string;
  id: string;
  existingFilePath?: string;
}

const PDFConfigModal: React.FC<PDFConfigModalProps> = observer(({ isOpen, onClose }) => {
  const dashboardStore = useDashboardStore();
  const [pdfs, setPdfs] = useState<PDFItem[]>([]);
  const [saving, setSaving] = useState(false);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Initialize PDFs from store
  useEffect(() => {
    if (isOpen) {
      const existingPdfs = dashboardStore.getDashboardPDFs;
      setPdfs(
        existingPdfs.map(pdf => ({
          title: pdf.title,
          description: pdf.description || '',
          existingFilePath: pdf.filePath,
          id: Math.random().toString(36).substr(2, 9) // Generate temp ID for UI
        }))
      );
      
      // Reset file input refs
      fileInputRefs.current = [];
    }
  }, [isOpen, dashboardStore]);

  const handleAddPDF = () => {
    setPdfs([
      ...pdfs,
      {
        title: '',
        description: '',
        id: Math.random().toString(36).substr(2, 9)
      }
    ]);
    
    // Add a new slot for file input ref
    fileInputRefs.current.push(null);
  };

  const handleRemovePDF = (id: string) => {
    const index = pdfs.findIndex(pdf => pdf.id === id);
    if (index !== -1) {
      const newPdfs = [...pdfs];
      newPdfs.splice(index, 1);
      setPdfs(newPdfs);
      
      // Remove the corresponding file input ref
      fileInputRefs.current.splice(index, 1);
    }
  };

  const handleFieldChange = (id: string, field: keyof PDFItem, value: string) => {
    setPdfs(
      pdfs.map(pdf =>
        pdf.id === id ? { ...pdf, [field]: value } : pdf
      )
    );
  };
  
  const handleFileChange = (id: string, file: File | null) => {
    setPdfs(
      pdfs.map(pdf =>
        pdf.id === id ? { ...pdf, file: file || undefined } : pdf
      )
    );
  };
  
  const triggerFileInput = (index: number) => {
    if (fileInputRefs.current[index]) {
      fileInputRefs.current[index]?.click();
    }
  };

  const handleDeletePDF = async (existingFilePath: string, id: string) => {
    if (!existingFilePath) return;
    
    try {
      setSaving(true);
      console.log(`Attempting to delete PDF with path: ${existingFilePath}`);
      
      await dashboardStore.deleteDashboardPDF(existingFilePath);
      
      // Remove from the local state
      const updatedPdfs = pdfs.filter(pdf => pdf.id !== id);
      setPdfs(updatedPdfs);
      
      toast.success('PDF deleted successfully');
    } catch (error) {
      console.error('Failed to delete PDF:', error);
      toast.error('Failed to delete PDF');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    // Validate entries
    const invalidItems = pdfs.filter(pdf => !pdf.title);
    if (invalidItems.length > 0) {
      toast.error('All PDFs must have a title');
      return;
    }
    
    // Check if we have at least one file or one existing file
    const hasFiles = pdfs.some(pdf => pdf.file || pdf.existingFilePath);
    if (!hasFiles) {
      toast.error('You must upload at least one PDF file');
      return;
    }

    setSaving(true);
    try {
      // Create form data for file upload
      const formData = new FormData();
      
      // Add titles and descriptions
      formData.append('titles', JSON.stringify(pdfs.map(pdf => pdf.title)));
      formData.append('descriptions', JSON.stringify(pdfs.map(pdf => pdf.description)));
      formData.append('existingFiles', JSON.stringify(pdfs.map(pdf => pdf.existingFilePath || null)));
      
      // Add files
      pdfs.forEach((pdf, index) => {
        if (pdf.file) {
          formData.append(`files`, pdf.file);
          formData.append(`fileIndices`, index.toString());
        }
      });
      
      await dashboardStore.uploadDashboardPDFs(formData);
      toast.success('Dashboard PDFs updated successfully');
      onClose();
    } catch (error) {
      console.error('Failed to save dashboard PDFs:', error);
      toast.error('Failed to update dashboard PDFs');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">Configure Dashboard Documents</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-grow">
          <p className="text-gray-600 mb-4">
            Configure up to 3 PDF documents to display on the dashboard. These will be visible to all users. 
            <span className="text-sm font-medium text-red-500"> Maximum file size: 25MB per PDF.</span>
          </p>

          {pdfs.map((pdf, index) => (
            <div 
              key={pdf.id} 
              className="mb-4 p-4 border rounded-lg bg-gray-50"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium">Document {index + 1}</h3>
                <button
                  onClick={() => handleRemovePDF(pdf.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash size={16} />
                </button>
              </div>

              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={pdf.title}
                  onChange={(e) => handleFieldChange(pdf.id, 'title', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Document title"
                  required
                />
              </div>

              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  PDF File {!pdf.existingFilePath && '*'}
                </label>
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  ref={el => fileInputRefs.current[index] = el}
                  onChange={(e) => handleFileChange(pdf.id, e.target.files?.[0] || null)}
                />
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => triggerFileInput(index)}
                    className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-4 py-2 rounded-md flex items-center"
                  >
                    <Upload size={16} className="mr-2" />
                    {pdf.file ? 'Change File' : 'Upload File'}
                  </button>
                  <span className="ml-3 text-sm text-gray-600">
                    {pdf.file ? pdf.file.name : pdf.existingFilePath ? 'Using existing file' : 'No file selected'}
                  </span>
                  
                  {pdf.existingFilePath && (
                    <button
                      type="button"
                      onClick={() => handleDeletePDF(pdf.existingFilePath!, pdf.id)}
                      className="ml-3 text-red-500 hover:text-red-700"
                      disabled={saving}
                    >
                      <Trash size={16} />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={pdf.description}
                  onChange={(e) => handleFieldChange(pdf.id, 'description', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Brief description of the document"
                  rows={2}
                />
              </div>
            </div>
          ))}

          {pdfs.length < 3 && (
            <button
              onClick={handleAddPDF}
              className="flex items-center text-blue-600 hover:text-blue-800 mt-2"
            >
              <Plus size={16} className="mr-1" />
              Add Document
            </button>
          )}
        </div>

        <div className="p-4 border-t flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
});

export default PDFConfigModal; 