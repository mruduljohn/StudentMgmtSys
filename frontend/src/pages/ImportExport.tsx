import React, { useState, useRef } from 'react';
import { Upload, Download, FileSpreadsheet, AlertCircle, FileDown } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import { useStudentStore } from '../store/studentStore';
import { studentsToExcel, downloadExcel } from '../utils/excelUtils';
import * as XLSX from 'xlsx';

const ImportExport: React.FC = () => {
  const studentStore = useStudentStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);
    
    try {
      // Use the uploadCSV method from studentStore
      const result = await studentStore.uploadCSV(file);
      
      if (result && result.results) {
        // Check if the result includes details about created vs updated students
        if (result.details && (result.details.created || result.details.updated)) {
          setUploadSuccess(
            `Successfully processed ${result.results.successful} students ` +
            `(${result.details.created || 0} created, ${result.details.updated || 0} updated, ` +
            `${result.results.failed} failed)`
          );
        } else {
          setUploadSuccess(`Successfully processed ${result.results.successful} students (${result.results.failed} failed)`);
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
      if (fileInputRef.current) {
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
      downloadExcel(excelData, 'students_export.xlsx');
    } catch (err) {
      console.error('Error exporting to Excel:', err);
      alert('Failed to export students data');
    }
  };
  
  const handleDownloadTemplate = () => {
    // Create a template with all required fields and a sample row
    const templateData = [
      {
        'Sl No': '391',
        'NAME': 'John Doe',
        'STUDENT ID': '111111',
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
        'Syllabus': 'OTHER',
        '% of +2 Marks': '89',
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
      },
      {
        'Sl No': '',
        'NAME': '',
        'STUDENT ID': '',
        'PHONE NUMBER': '',
        'GENDER': '',
        'BATCH': '',
        'CLASS TEACHER': '',
        'Hostel': '',
        'Stream': '',
        'PROGRAM': '',
        'Study Material': '',
        'Uniform': '',
        'ID Card': '',
        'Tab': '',
        'JOINED': '',
        'Syllabus': '',
        '% of +2 Marks': '',
        'NEET Score': '',
        'Remarks': '',
        'Remarks 1': '',
        'Remarks 2': '',
        'Remarks 3': '',
        'Remarks 4': '',
        'Fee Due': '',
        'Flag1': '',
        'Flag2': '',
        'Flag3': '',
        'Flag4': ''
      }
    ];
    
    // Convert to Excel and download
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Student Template');
    
    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    // Download file
    const fileName = 'student_template.xlsx';
    
    // Create a download link and trigger it
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
          
          <p className="text-gray-600 mb-4">
            Upload an Excel file with student data. The file should have columns matching the student fields.
            <br /><br />
            <strong>Note:</strong> If the Excel file contains students with IDs that already exist in the system, 
            their information will be updated with the new values from the file. Only the fields included in the 
            Excel file will be updated; other fields will remain unchanged.
          </p>
          
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
            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <div className="flex flex-col sm:flex-row gap-3">
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
    </Layout>
  );
};

export default ImportExport;