import React, { useState, useRef } from 'react';
import { Upload, Download, FileSpreadsheet, AlertCircle } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import { useStudentStore } from '../store/studentStore';
import { excelToStudents, studentsToExcel, downloadExcel } from '../utils/excelUtils';

const ImportExport: React.FC = () => {
  const studentStore = useStudentStore();
  console.log('Store Students:', studentStore.students);
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
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const data = event.target?.result as ArrayBuffer;
          const parsedStudents = excelToStudents(data);
          
          if (parsedStudents.length === 0) {
            setUploadError('No student data found in the file');
            return;
          }
          
          // Check for required fields
          const missingFields = parsedStudents.some(
            student => !student.name || !student.studentId
          );
          
          if (missingFields) {
            setUploadError('Some students are missing required fields (Name or Student ID)');
            return;
          }
          
          console.log('Parsed students:', parsedStudents); // Debug log
          console.log('First student:', parsedStudents[0]); // Debug log
          studentStore.importStudents(parsedStudents);
          setUploadSuccess(`Successfully imported ${parsedStudents.length} students`);
        } catch (err) {
          console.error('Error parsing Excel file:', err);
          setUploadError('Failed to parse the Excel file. Please check the format.');
        } finally {
          setIsUploading(false);
          // Reset file input
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      };
      
      reader.onerror = () => {
        setUploadError('Error reading the file');
        setIsUploading(false);
      };
      
      reader.readAsArrayBuffer(file);
    } catch (err) {
      console.error('Error handling file:', err);
      setUploadError('An unexpected error occurred');
      setIsUploading(false);
    }
  };
  
  const handleExport = () => {
    if (studentStore.students.length === 0) {
      alert('No students to export');
      return;
    }
    
    try {
      const excelData = studentsToExcel(studentStore.students);
      downloadExcel(excelData, 'students_export.xlsx');
    } catch (err) {
      console.error('Error exporting to Excel:', err);
      alert('Failed to export students data');
    }
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
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
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
          </div>
          
          <div className="mt-4 text-sm text-gray-500">
            <p className="font-medium">Required columns:</p>
            <ul className="list-disc pl-5 mt-1">
              <li>NAME - Student name</li>
              <li>STUDENT ID - Unique identifier</li>
              <li>PHONE NUMBER - Contact number</li>
              <li>GENDER - MALE/FEMALE/DIFFERENT</li>
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
              disabled={studentStore.students.length === 0}
            >
              <FileSpreadsheet size={16} className="mr-2" />
              Export to Excel
            </Button>
          </div>
          
          <div className="mt-4 text-sm text-gray-500">
            <p>Total students: {studentStore.students.length}</p>
            {studentStore.students.length === 0 && (
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