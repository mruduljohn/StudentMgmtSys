import React, { useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import Input from './Input';

interface FileNamePromptProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (filename: string) => void;
  defaultFileName: string;
  title?: string;
  fileType?: string;
}

const FileNamePrompt: React.FC<FileNamePromptProps> = ({
  isOpen,
  onClose,
  onConfirm,
  defaultFileName,
  title = 'Save File',
  fileType = 'Excel (.xlsx)'
}) => {
  const [filename, setFilename] = useState(defaultFileName);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!filename.trim()) {
      setError('Please enter a filename');
      return;
    }
    
    // Remove file extension if user included it
    let cleanFilename = filename.trim();
    if (cleanFilename.endsWith('.xlsx') || cleanFilename.endsWith('.xls') || cleanFilename.endsWith('.csv')) {
      cleanFilename = cleanFilename.substring(0, cleanFilename.lastIndexOf('.'));
    }
    
    onConfirm(cleanFilename);
    onClose();
  };

  // Get file extension from fileType
  const getFileExtension = (): string => {
    if (fileType.includes('Excel') || fileType === 'XLSX') return '.xlsx';
    if (fileType === 'CSV') return '.csv';
    if (fileType === 'PDF') return '.pdf';
    return '';
  };
  
  const fileExtension = getFileExtension();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <form onSubmit={handleSubmit}>
        <p className="mb-4 text-gray-600">Please enter a name for your {fileType} file:</p>
        
        <div className="relative">
          <Input
            type="text"
            value={filename}
            onChange={(e) => {
              setFilename(e.target.value);
              setError('');
            }}
            placeholder={`Enter filename (${fileExtension})`}
            error={error}
            fullWidth
            autoFocus
          />
          <div className="text-xs text-gray-500 mt-1">
            File will be saved as: {filename}{fileExtension}
          </div>
        </div>
        
        <div className="mt-6 flex justify-end space-x-3">
          <Button
            variant="secondary"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
          >
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default FileNamePrompt; 