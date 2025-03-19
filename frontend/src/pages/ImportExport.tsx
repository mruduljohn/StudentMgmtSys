import React, { useState, useRef } from 'react';
import { Upload, Download, FileSpreadsheet, AlertCircle, FileDown, UserPlus, RefreshCw } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import { useStudentStore } from '../store/studentStore';
import { studentsToExcel, downloadExcel } from '../utils/excelUtils';
import * as XLSX from 'xlsx';
import FileNamePrompt from '../components/ui/FileNamePrompt';

const ImportExport: React.FC = () => {
  const studentStore = useStudentStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const newStudentsFileInputRef = useRef<HTMLInputElement>(null);
  const updateStudentsFileInputRef = useRef<HTMLInputElement>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<'combined' | 'new' | 'update'>('combined');
  const [isFileNamePromptOpen, setIsFileNamePromptOpen] = useState(false);
  const [exportData, setExportData] = useState<ArrayBuffer | null>(null);
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, mode: 'combined' | 'new' | 'update') => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);
    
    try {
      let result;
      
      if (mode === 'new') {
        // Use the uploadNewStudentsCSV method for adding new students only
        result = await studentStore.uploadNewStudentsCSV(file);
      } else if (mode === 'update') {
        // Use the uploadUpdateStudentsCSV method for updating existing students
        result = await studentStore.uploadUpdateStudentsCSV(file);
      } else {
        // Use the original uploadCSV method for combined functionality
        result = await studentStore.uploadCSV(file);
      }
      
      if (result && result.results) {
        // Check if the result includes details about created vs updated students
        if (result.details) {
          let successMessage = `Successfully processed ${result.results.successful} students `;
          
          if (mode === 'new') {
            successMessage += `(${result.details.created || 0} created, ${result.results.failed} failed)`;
          } else if (mode === 'update') {
            successMessage += `(${result.details.updated || 0} updated, ${result.results.failed} failed)`;
          } else {
            successMessage += `(${result.details.created || 0} created, ${result.details.updated || 0} updated, ${result.results.failed} failed)`;
          }
          
          setUploadSuccess(successMessage);
        } else {
          setUploadSuccess(`Successfully processed ${result.results.successful} students (${result.results.failed} failed)`);
        }
        
        // If there's an error log, provide a message about it
        if (result.errorLog) {
          setUploadSuccess(prev => `${prev}. Error details have been logged on the server.`);
        }
      } else {
        setUploadError('Failed to upload file');
      }
    } catch (err) {
      console.error('Error uploading file:', err);
      setUploadError('An unexpected error occurred');
    } finally {
      setIsUploading(false);
      // Reset file input
      if (mode === 'new' && newStudentsFileInputRef.current) {
        newStudentsFileInputRef.current.value = '';
      } else if (mode === 'update' && updateStudentsFileInputRef.current) {
        updateStudentsFileInputRef.current.value = '';
      } else if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  const handleExport = () => {
    if (studentStore.getAllStudents.length === 0) {
      alert('No students to export');
      return;
    }
    
    try {
      const excelData = studentsToExcel(studentStore.getAllStudents);
      setExportData(excelData);
      setIsFileNamePromptOpen(true);
    } catch (err) {
      console.error('Error exporting to Excel:', err);
      alert('Failed to export students data');
    }
  };
  
  const handleExportWithFilename = (filename: string) => {
    if (!exportData) return;
    
    downloadExcel(exportData, `${filename}.xlsx`);
    setUploadSuccess(`Successfully exported ${studentStore.getAllStudents.length} students to ${filename}.xlsx`);
  };
  
  const handleDownloadTemplate = () => {
    // Sample data for template
    const sampleData = {
      'Sl No': '1',
      'NAME': 'John Doe',
      'STUDENT ID': '12345',
      'PHONE NUMBER': '9876543210',
      'GENDER': 'M',
      'BATCH': '25TSRFIX',
      'CLASS TEACHER': 'DEEPA.MD.(WB)',
      'Hostel': 'DS',
      'Stream': 'FOUNDATION',
      'PROGRAM': 'FOUNDATION',
      'Study Material': 'NOT RECEIVED',
      'Uniform': 'RECEIVED',
      'ID Card': 'NOT RECEIVED',
      'Tab': 'REQUESTED NOT PAID',
      'JOINED': 'ALLOTED',
      'Syllabus': 'STATE',
      'Percentage of +2 Marks': '89',
      'NEET Score': '605',
      'Remarks': 'REMARK 1',
      'Remarks 1': 'REMARK 2',
      'Remarks 2': '',
      'Remarks 3': '',
      'Remarks 4': '',
      'Fee Due': '11300',
      'Flag1': '1',
      'Flag2': '',
      'Flag3': '',
      'Flag4': ''
    };
    
    // Create a workbook
    const workbook = XLSX.utils.book_new();
    
    // Choose filename based on import mode
    let fileName = 'student_template.xlsx';
    if (importMode === 'new') {
      fileName = 'new_students_template.xlsx';
      sampleData['STUDENT ID'] = '12345 (must be new)';
    } else if (importMode === 'update') {
      fileName = 'update_students_template.xlsx';
      sampleData['STUDENT ID'] = '12345 (must exist)';
    }
    
    // Create a template with header row and one sample row
    const templateData = [sampleData, {}];
    
    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');
    
    // Create instructions worksheet
    const instructions = [
      { Field: 'NAME', Required: 'Yes', Description: 'Student full name' },
      { Field: 'STUDENT ID', Required: 'Yes', Description: importMode === 'new' ? 'Must be new and unique' : importMode === 'update' ? 'Must already exist in system' : 'Unique identifier (updates if exists)' },
      { Field: 'GENDER', Required: 'Yes', Description: 'M, F, or DIFFERENT' },
      { Field: 'BATCH', Required: 'Yes', Description: 'Class batch' },
      { Field: 'CLASS TEACHER', Required: 'Yes', Description: 'Teacher username' },
      { Field: 'PHONE NUMBER', Required: 'No', Description: 'Contact number' },
      { Field: 'Hostel', Required: 'No', Description: 'DS for Day Scholar or hostel name' },
      { Field: 'Stream', Required: 'No', Description: 'MEDICAL, ENGINEERING, FOUNDATION' },
      { Field: 'PROGRAM', Required: 'No', Description: 'FOUNDATION, EVENING, SPECIAL, etc.' }
    ];
    
    const instructionSheet = XLSX.utils.json_to_sheet(instructions);
    XLSX.utils.book_append_sheet(workbook, instructionSheet, 'Instructions');
    
    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    // Download file
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(data);
    link.download = fileName;
    link.click();
    setTimeout(() => {
      window.URL.revokeObjectURL(link.href);
    }, 100);
  };
  
  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Import/Export</h1>
        <p className="text-gray-600">
          Import students from Excel or export current students to Excel
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Import Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <Upload className="h-6 w-6 text-blue-500 mr-2" />
            <h2 className="text-lg font-semibold">Import Students</h2>
          </div>
          
          <div className="mb-6">
            <div className="flex flex-col gap-2 mb-4">
              <div className="flex items-center">
                <input 
                  type="radio" 
                  id="combined-import" 
                  name="import-mode" 
                  value="combined" 
                  checked={importMode === 'combined'} 
                  onChange={() => setImportMode('combined')}
                  className="mr-2"
                />
                <label htmlFor="combined-import" className="text-gray-700 font-medium">
                  Combined Import (Add new & update existing)
                </label>
              </div>
              
              <div className="flex items-center">
                <input 
                  type="radio" 
                  id="new-import" 
                  name="import-mode" 
                  value="new" 
                  checked={importMode === 'new'} 
                  onChange={() => setImportMode('new')}
                  className="mr-2"
                />
                <label htmlFor="new-import" className="text-gray-700 font-medium">
                  Add New Students Only
                </label>
              </div>
              
              <div className="flex items-center">
                <input 
                  type="radio" 
                  id="update-import" 
                  name="import-mode" 
                  value="update" 
                  checked={importMode === 'update'} 
                  onChange={() => setImportMode('update')}
                  className="mr-2"
                />
                <label htmlFor="update-import" className="text-gray-700 font-medium">
                  Update Existing Students Only
                </label>
              </div>
            </div>
            
            {importMode === 'combined' && (
              <p className="text-gray-600 mb-4">
                Upload an Excel file with student data. If the Excel file contains students with IDs that already exist in the system, 
                their information will be updated. New student IDs will be added as new records.
              </p>
            )}
            
            {importMode === 'new' && (
              <p className="text-gray-600 mb-4">
                Upload an Excel file with <strong>new students only</strong>. All student IDs must be unique and not already exist in the system.
                Any records with duplicate student IDs will be rejected and logged.
              </p>
            )}
            
            {importMode === 'update' && (
              <p className="text-gray-600 mb-4">
                Upload an Excel file to <strong>update existing students only</strong>. All student IDs must already exist in the system.
                Any records with non-existent student IDs will be rejected and logged.
              </p>
            )}
          </div>
          
          {uploadError && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
              <p>{uploadError}</p>
            </div>
          )}
          
          {uploadSuccess && (
            <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
              {uploadSuccess}
            </div>
          )}
          
          <div className="mt-4">
            {/* Combined import file input */}
            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx,.xls,.csv"
              onChange={(e) => handleFileChange(e, 'combined')}
              className="hidden"
              id="file-upload"
              disabled={importMode !== 'combined'}
            />
            
            {/* New students file input */}
            <input
              type="file"
              ref={newStudentsFileInputRef}
              accept=".xlsx,.xls,.csv"
              onChange={(e) => handleFileChange(e, 'new')}
              className="hidden"
              id="new-students-upload"
              disabled={importMode !== 'new'}
            />
            
            {/* Update students file input */}
            <input
              type="file"
              ref={updateStudentsFileInputRef}
              accept=".xlsx,.xls,.csv"
              onChange={(e) => handleFileChange(e, 'update')}
              className="hidden"
              id="update-students-upload"
              disabled={importMode !== 'update'}
            />
            
            <div className="flex flex-col sm:flex-row gap-3">
              {importMode === 'combined' && (
                <label htmlFor="file-upload">
                  <Button
                    variant="primary"
                    className="flex items-center"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    <FileSpreadsheet size={16} className="mr-2" />
                    {isUploading ? 'Uploading...' : 'Select Excel File'}
                  </Button>
                </label>
              )}
              
              {importMode === 'new' && (
                <label htmlFor="new-students-upload">
                  <Button
                    variant="primary"
                    className="flex items-center"
                    onClick={() => newStudentsFileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    <UserPlus size={16} className="mr-2" />
                    {isUploading ? 'Uploading...' : 'Select New Students File'}
                  </Button>
                </label>
              )}
              
              {importMode === 'update' && (
                <label htmlFor="update-students-upload">
                  <Button
                    variant="primary"
                    className="flex items-center"
                    onClick={() => updateStudentsFileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    <RefreshCw size={16} className="mr-2" />
                    {isUploading ? 'Uploading...' : 'Select Update File'}
                  </Button>
                </label>
              )}
              
              <Button
                variant="secondary"
                className="flex items-center"
                onClick={handleDownloadTemplate}
              >
                <FileDown size={16} className="mr-2" />
                Download Template
              </Button>
            </div>
          </div>
          
          <div className="mt-4 text-sm text-gray-500">
            <p className="font-medium">Required columns:</p>
            <ul className="list-disc pl-5 mt-1">
              <li>NAME - Student name</li>
              <li>STUDENT ID - Unique identifier</li>
              <li>PHONE NUMBER - Contact number</li>
              <li>GENDER - M/F/DIFFERENT</li>
              <li>BATCH - Class batch</li>
              <li>And other fields as needed</li>
            </ul>
          </div>
        </div>
        
        {/* Export Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <Download className="h-6 w-6 text-green-500 mr-2" />
            <h2 className="text-lg font-semibold">Export Students</h2>
          </div>
          
          <p className="text-gray-600 mb-4">
            Export all student data to an Excel file. The file will include all student fields.
          </p>
          
          <div className="mt-4">
            <Button
              variant="success"
              className="flex items-center"
              onClick={handleExport}
              disabled={studentStore.getAllStudents.length === 0}
            >
              <FileSpreadsheet size={16} className="mr-2" />
              Export to Excel
            </Button>
          </div>
          
          <div className="mt-4 text-sm text-gray-500">
            <p>Total students: {studentStore.getAllStudents.length}</p>
            {studentStore.getAllStudents.length === 0 && (
              <p className="text-yellow-600 mt-2">
                No students to export. Import students first.
              </p>
            )}
          </div>
        </div>
      </div>
      
      {/* Add the FileNamePrompt component */}
      <FileNamePrompt
        isOpen={isFileNamePromptOpen}
        onClose={() => setIsFileNamePromptOpen(false)}
        onConfirm={handleExportWithFilename}
        defaultFileName={`students-export-${new Date().toISOString().slice(0, 10)}`}
        title="Export Students"
        fileType="Excel (.xlsx)"
      />
    </Layout>
  );
};

export default ImportExport;