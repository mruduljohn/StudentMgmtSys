import React, { useState, useRef } from 'react';
import { Upload, Download, FileSpreadsheet, AlertCircle, FileDown, UserPlus, RefreshCw, Clock } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import { useStudentStore } from '../store/studentStore';
import { useHourStore } from '../store/hourStore';
import { useAuthStore } from '../store/authStore';
import { studentsToExcel, downloadExcel, studentsToCSV, studentsToPDF, downloadCSV, downloadPDF, hoursToExcel, hoursToCSV, hoursToPDF, hourStatsToExcel, hourStatsToCSV, hourStatsToPDF } from '../utils/excelUtils';
import * as XLSX from 'xlsx';
import FileNamePrompt from '../components/ui/FileNamePrompt';

const ImportExport: React.FC = () => {
  const studentStore = useStudentStore();
  const hourStore = useHourStore();
  const authStore = useAuthStore();
  const isAdmin = authStore.user?.role === 'ADMIN';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const newStudentsFileInputRef = useRef<HTMLInputElement>(null);
  const updateStudentsFileInputRef = useRef<HTMLInputElement>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<'combined' | 'new' | 'update'>('combined');
  const [isFileNamePromptOpen, setIsFileNamePromptOpen] = useState(false);
  const [exportData, setExportData] = useState<ArrayBuffer | string | null>(null);
  const [exportFormat, setExportFormat] = useState<'xlsx' | 'csv' | 'pdf'>('xlsx');
  const [exportType, setExportType] = useState<'students' | 'hours' | 'hourStats'>('students');
  const [isHourStatsPromptOpen, setIsHourStatsPromptOpen] = useState(false);
  const [hourStatsData, setHourStatsData] = useState<ArrayBuffer | string | null>(null);
  
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
    if (exportType === 'students') {
      if (studentStore.getAllStudents.length === 0) {
        alert('No students to export');
        return;
      }
      
      // Get custom labels from the store for remarks and flags
      const customLabels = {
        remarks: studentStore.remarksConfig.remarks,
        remarks1: studentStore.remarksConfig.remarks1,
        remarks2: studentStore.remarksConfig.remarks2,
        remarks3: studentStore.remarksConfig.remarks3,
        remarks4: studentStore.remarksConfig.remarks4,
        flag1: studentStore.flagsConfig.flag1,
        flag2: studentStore.flagsConfig.flag2,
        flag3: studentStore.flagsConfig.flag3,
        flag4: studentStore.flagsConfig.flag4
      };
      
      try {
        if (exportFormat === 'xlsx') {
          const excelData = studentsToExcel(studentStore.getAllStudents, customLabels);
          setExportData(excelData);
          setIsFileNamePromptOpen(true);
        } else if (exportFormat === 'csv') {
          const csvData = studentsToCSV(studentStore.getAllStudents, customLabels);
          setExportData(csvData);
          setIsFileNamePromptOpen(true);
        } else if (exportFormat === 'pdf') {
          const pdfDoc = studentsToPDF(studentStore.getAllStudents, customLabels);
          // For PDF we'll just save directly as it handles its own prompts
          downloadPDF(pdfDoc, `students-export-${new Date().toISOString().slice(0, 10)}.pdf`);
          setUploadSuccess(`Successfully exported ${studentStore.getAllStudents.length} students to PDF`);
        }
      } catch (err) {
        console.error('Error exporting student data:', err);
        alert('Failed to export students data');
      }
    } else if (exportType === 'hours') {
      // Security check - only allow admin to export hours data
      if (!isAdmin) {
        setUploadError('Only administrators can export hour data');
        return;
      }
      
      // Check if hourStore has been initialized
      if (!hourStore.isDataLoaded) {
        hourStore.init();
      }
      
      // Fetch all hours (not just current page) for export
      hourStore.fetchHours();
      
      const hours = hourStore.getHours;
      if (hours.length === 0) {
        alert('No hours data to export');
        return;
      }
      
      try {
        if (exportFormat === 'xlsx') {
          const excelData = hoursToExcel(hours);
          setExportData(excelData);
          setIsFileNamePromptOpen(true);
        } else if (exportFormat === 'csv') {
          const csvData = hoursToCSV(hours);
          setExportData(csvData);
          setIsFileNamePromptOpen(true);
        } else if (exportFormat === 'pdf') {
          const pdfDoc = hoursToPDF(hours);
          downloadPDF(pdfDoc, `hours-export-${new Date().toISOString().slice(0, 10)}.pdf`);
          setUploadSuccess(`Successfully exported ${hours.length} hour records to PDF`);
        }
      } catch (err) {
        console.error('Error exporting hours data:', err);
        alert('Failed to export hours data');
      }
    } else if (exportType === 'hourStats') {
      // Security check - only allow admin to export hour stats
      if (!isAdmin) {
        setUploadError('Only administrators can export hour statistics');
        return;
      }
      
      // Check if hourStore has been initialized
      if (!hourStore.isDataLoaded) {
        hourStore.init();
      }
      
      // Fetch stats if not already available
      if (!hourStore.getStats) {
        hourStore.fetchStats();
      }
      
      const stats = hourStore.getStats;
      if (!stats) {
        alert('No hour statistics available');
        return;
      }
      
      try {
        if (exportFormat === 'xlsx') {
          const excelData = hourStatsToExcel(stats);
          setHourStatsData(excelData);
          setIsHourStatsPromptOpen(true);
        } else if (exportFormat === 'csv') {
          const csvData = hourStatsToCSV(stats);
          setHourStatsData(csvData);
          setIsHourStatsPromptOpen(true);
        } else if (exportFormat === 'pdf') {
          const pdfDoc = hourStatsToPDF(stats);
          downloadPDF(pdfDoc, `hour-stats-export-${new Date().toISOString().slice(0, 10)}.pdf`);
          setUploadSuccess('Successfully exported hour statistics to PDF');
        }
      } catch (err) {
        console.error('Error exporting hour stats:', err);
        alert('Failed to export hour statistics');
      }
    }
  };
  
  const handleExportWithFilename = (filename: string) => {
    if (!exportData) return;
    
    if (exportType === 'students') {
      if (exportFormat === 'xlsx') {
        downloadExcel(exportData as ArrayBuffer, `${filename}.xlsx`);
        setUploadSuccess(`Successfully exported ${studentStore.getAllStudents.length} students to ${filename}.xlsx`);
      } else if (exportFormat === 'csv') {
        downloadCSV(exportData as string, `${filename}.csv`);
        setUploadSuccess(`Successfully exported ${studentStore.getAllStudents.length} students to ${filename}.csv`);
      }
    } else if (exportType === 'hours') {
      if (exportFormat === 'xlsx') {
        downloadExcel(exportData as ArrayBuffer, `${filename}.xlsx`);
        setUploadSuccess(`Successfully exported ${hourStore.getHours.length} hour records to ${filename}.xlsx`);
      } else if (exportFormat === 'csv') {
        downloadCSV(exportData as string, `${filename}.csv`);
        setUploadSuccess(`Successfully exported ${hourStore.getHours.length} hour records to ${filename}.csv`);
      }
    }
    
    // Clear export data
    setExportData(null);
  };
  
  const handleHourStatsExportWithFilename = (filename: string) => {
    if (!hourStatsData) return;
    
    if (exportFormat === 'xlsx') {
      downloadExcel(hourStatsData as ArrayBuffer, `${filename}.xlsx`);
      setUploadSuccess(`Successfully exported hour statistics to ${filename}.xlsx`);
    } else if (exportFormat === 'csv') {
      downloadCSV(hourStatsData as string, `${filename}.csv`);
      setUploadSuccess(`Successfully exported hour statistics to ${filename}.csv`);
    }
    
    // Clear export data
    setHourStatsData(null);
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
          Import or export data from the system
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
            <h2 className="text-lg font-semibold">Export Data</h2>
          </div>
          
          <p className="text-gray-600 mb-4">
            Export data from the system in various formats. Choose the type of data and format below.
          </p>
          
          <div className="mb-4">
            <label htmlFor="export-type" className="text-gray-700 font-medium block mb-2">
              Export Data Type:
            </label>
            <select
              id="export-type"
              value={exportType}
              onChange={(e) => setExportType(e.target.value as 'students' | 'hours' | 'hourStats')}
              className="p-2 border rounded-md w-full mb-4"
            >
              <option value="students">Students Data</option>
              {isAdmin && <option value="hours">Hours Data</option>}
              {isAdmin && <option value="hourStats">Hour Statistics</option>}
            </select>
            
            <label htmlFor="export-format" className="text-gray-700 font-medium block mb-2">
              Export Format:
            </label>
            <select
              id="export-format"
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as 'xlsx' | 'csv' | 'pdf')}
              className="p-2 border rounded-md w-full"
            >
              <option value="xlsx">Excel (.xlsx)</option>
              <option value="csv">CSV</option>
              <option value="pdf">PDF</option>
            </select>
          </div>
          
          <div className="mt-4">
            <Button
              variant="success"
              className="flex items-center"
              onClick={handleExport}
            >
              {exportType === 'students' ? (
                <FileSpreadsheet size={16} className="mr-2" />
              ) : (
                <Clock size={16} className="mr-2" />
              )}
              Export {exportType === 'students' ? 'Students' : exportType === 'hours' ? 'Hours' : 'Hour Statistics'} to {exportFormat.toUpperCase()}
            </Button>
          </div>
          
          <div className="mt-4 text-sm text-gray-500">
            {exportType === 'students' && (
              <>
                <p>Total students: {studentStore.getAllStudents.length}</p>
                {studentStore.getAllStudents.length === 0 && (
                  <p className="text-yellow-600 mt-2">
                    No students to export. Import students first.
                  </p>
                )}
              </>
            )}
            {exportType === 'hours' && isAdmin && (
              <>
                <p>Total hour records: {hourStore.getTotalHours}</p>
                {hourStore.getTotalHours === 0 && (
                  <p className="text-yellow-600 mt-2">
                    No hour records to export.
                  </p>
                )}
              </>
            )}
            {exportType === 'hourStats' && isAdmin && (
              <p>Export detailed statistics about hours and chapters across batches and subjects.</p>
            )}
          </div>
        </div>
      </div>
      
      {/* FileNamePrompt for Students and Hours */}
      <FileNamePrompt
        isOpen={isFileNamePromptOpen}
        onClose={() => setIsFileNamePromptOpen(false)}
        onConfirm={handleExportWithFilename}
        defaultFileName={
          exportType === 'students' 
            ? `students-export-${new Date().toISOString().slice(0, 10)}`
            : `hours-export-${new Date().toISOString().slice(0, 10)}`
        }
        title={`Export ${exportType === 'students' ? 'Students' : 'Hours'}`}
        fileType={exportFormat.toUpperCase()}
      />
      
      {/* FileNamePrompt for Hour Stats */}
      <FileNamePrompt
        isOpen={isHourStatsPromptOpen}
        onClose={() => setIsHourStatsPromptOpen(false)}
        onConfirm={handleHourStatsExportWithFilename}
        defaultFileName={`hour-stats-export-${new Date().toISOString().slice(0, 10)}`}
        title="Export Hour Statistics"
        fileType={exportFormat.toUpperCase()}
      />
    </Layout>
  );
};

export default ImportExport;