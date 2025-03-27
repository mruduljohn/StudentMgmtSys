import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { Plus, Edit, Trash2, Filter, FileDown } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Table, { TableItem } from '../components/ui/Table';
import MobileTable from '../components/ui/MobileTable';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Pagination from '../components/ui/Pagination';
import StudentForm from '../components/students/StudentForm';

import AdvancedSearch, { SearchField } from '../components/ui/AdvancedSearch';
import FilterPanel, { FilterOption, FilterValue } from '../components/ui/FilterPanel';
import { useStudentStore } from '../store/studentStore';
import { useAuthStore } from '../store/authStore';
import { Student } from '../types';
import { studentsToExcel, downloadExcel, studentsToCSV, studentsToPDF, downloadCSV, downloadPDF } from '../utils/excelUtils';
import PasswordConfirmModal from '../components/ui/PasswordConfirmModal';
import { useMediaQuery } from '../hooks/useMediaQuery';
import FileNamePrompt from '../components/ui/FileNamePrompt';

// Define types for bulk actions and sort options
// interface BulkAction {
//   id: string;
//   label: string;
//   icon?: React.ReactNode;
//   onClick?: () => void;
//   variant?: 'default' | 'danger' | 'primary' | 'secondary';
// }

// Define types for sort options
interface SortOption {
  value: string;
  label: string;
}

// Define the extended student type for table display
interface ExtendedStudent extends TableItem {
  slNo: number;
  name: string | JSX.Element;
  studentId: string;
  phoneNumber: string;
  gender: string;
  batch: string;
  classTeacher: string;
  hostel: string;
  stream: string;
  program: string;
  studyMaterial: string;
  uniform: string;
  idCard: string;
  tab: string;
  joined: string;
  syllabus: string;
  percentageOfPlus2Marks: number;
  neetScore: number;
  remarks: string;
  remarks1: string;
  remarks2: string;
  remarks3: string;
  remarks4: string;
  feeDue: number;
  flag1: string;
  flag2: string;
  flag3: string;
  flag4: string;
  hasPaid?: boolean;
  select?: {
    type: 'checkbox';
    checked: boolean;
    onChange: (checked: boolean) => void;
  };
  actions?: JSX.Element;
}

const Students: React.FC = observer(() => {
  const studentStore = useStudentStore();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // Get batch config from the store
  const { batchConfig } = studentStore;
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<ExtendedStudent | null>(null);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [storeInitialized, setStoreInitialized] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [deleteAction, setDeleteAction] = useState<'single' | 'bulk'>('single');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [studentsWithPaymentStatus, setStudentsWithPaymentStatus] = useState<ExtendedStudent[]>([]);
  // Add a state variable to track pagination changes
  const [paginationKey, setPaginationKey] = useState(0);
  // Add a state variable to track filter changes
  const [filterKey, setFilterKey] = useState(0);
  // Add states for success and error messages
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  // Add states for file export
  const [isFileNamePromptOpen, setIsFileNamePromptOpen] = useState(false);
  const [exportData, setExportData] = useState<ArrayBuffer | string | null>(null);
  const [exportType, setExportType] = useState<'all' | 'filtered' | 'selected'>('all');
  const [exportDefaultFilename, setExportDefaultFilename] = useState('students');
  const [exportFormat, setExportFormat] = useState<'xlsx' | 'csv' | 'pdf'>('xlsx');
  
  // Define the function to get a clickable name cell
  const getNameCell = (student: ExtendedStudent) => (
    <a 
      href="#" 
      className="text-blue-600 hover:text-blue-800 font-medium"
      onClick={(e) => {
        e.preventDefault();
        handleEdit(student);
      }}
    >
      {student.name}
    </a>
  );
  
  // Define handleRowSelect before it's used in useEffect
  const handleRowSelect = (id: string, selected: boolean) => {
    if (selected) {
      setSelectedRows(prev => [...prev, id]);
    } else {
      setSelectedRows(prev => prev.filter(rowId => rowId !== id));
    }
  };
  
  // Define handleEdit function early
  const handleEdit = (student: ExtendedStudent) => {
    // For mentors, only allow editing students they are assigned to
    if (!isAdmin) {
      // The username is already in the correct format (e.g., "SIJO.JAMES")
      // The class teacher name in the student record is in display format (e.g., "Sijo James")
      // We need to convert the class teacher name to username format for comparison
      
      const classTeacherAsUsername = student.classTeacher
        .toUpperCase()
        .replace(/\s+/g, '.');
      
      const isClassTeacher = classTeacherAsUsername === user?.username;
      
      if (!isClassTeacher) {
        alert(`You can only edit students assigned to you as a class teacher.`);
        return;
      }
    }
    
    // Make sure we're using the original student object with a string name property
    // Get the original student from the store
    const originalStudent = studentStore.getStudents.find(s => s.studentId === student.studentId);
    
    if (originalStudent) {
      setSelectedStudent(originalStudent as ExtendedStudent);
    } else {
      // Fallback to the provided student but ensure name is a string
      const studentWithStringName = {
        ...student,
        name: typeof student.name === 'string' ? student.name : 'Student'
      };
      setSelectedStudent(studentWithStringName);
    }
    
    setIsEditModalOpen(true);
  };
  
  const handleDelete = (student: ExtendedStudent) => {
    // Make sure we're using the original student object with a string name property
    // Get the original student from the store
    const originalStudent = studentStore.getStudents.find(s => s.studentId === student.studentId);
    
    if (originalStudent) {
      setSelectedStudent(originalStudent as ExtendedStudent);
    } else {
      // Fallback to the provided student but ensure name is a string
      const studentWithStringName = {
        ...student,
        name: typeof student.name === 'string' ? student.name : 'Student'
      };
      setSelectedStudent(studentWithStringName);
    }
    
    // Open password confirmation modal instead of delete modal directly
    setDeleteAction('single');
    setIsPasswordModalOpen(true);
  };
  
  // Add a custom cell for actions - Define this function before it's used in useEffect
  const getActionButtons = (student: ExtendedStudent) => {
    // For mentors, disable edit button for students they're not assigned to
    let canEdit = isAdmin;
    
    if (!isAdmin) {
      // The username is already in the correct format (e.g., "SIJO.JAMES")
      // The class teacher name in the student record is in display format (e.g., "Sijo James")
      // We need to convert the class teacher name to username format for comparison
      
      const classTeacherAsUsername = student.classTeacher
        .toUpperCase()
        .replace(/\s+/g, '.');
      
      canEdit = classTeacherAsUsername === user?.username;
    }
    
    return (
        <div className="flex space-x-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(student);
            }}
          disabled={!canEdit}
          title={!canEdit ? "You can only edit students assigned to you" : "Edit student"}
          >
            <Edit size={16} />
          </Button>
          {isAdmin && (
            <Button
              variant="danger"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(student);
              }}
            >
              <Trash2 size={16} />
            </Button>
          )}
        </div>
    );
  };
  
  // Initialize store on component mount
  useEffect(() => {
    const initializeStore = async () => {
      try {
        if (!studentStore.isDataLoaded) {
        await studentStore.init();
        }
        setStoreInitialized(true);
      } catch (error) {
        console.error("Failed to initialize student store:", error);
      }
    };
    
    initializeStore();
  }, [studentStore]);
  
  // Apply filters and pagination when dependencies change
  useEffect(() => {
    if (storeInitialized) {
      // Just apply filters and pagination, don't fetch from API again
      studentStore.applyFiltersAndPagination();
    }
  }, [
    storeInitialized,
    studentStore,
    studentStore.getCurrentPage,
    studentStore.getPageSize,
    studentStore.getSortField,
    studentStore.getSortOrder
  ]);
  
  // Effect to fetch students when the component mounts
  useEffect(() => {
    if (storeInitialized) {
      // Update the studentsWithPaymentStatus array when the students array changes
      const students = studentStore.getStudents;
      console.log(`Updating studentsWithPaymentStatus with ${students.length} students`);
      
      const updatedStudents = students.map((student, index) => {
        // Create a new student object with the select property
        const extendedStudent: ExtendedStudent = {
          ...student,
          slNo: index + 1, // Update the serial number
          name: getNameCell({ ...student, slNo: index + 1 } as ExtendedStudent),
          actions: getActionButtons({ ...student, slNo: index + 1 } as ExtendedStudent),
          select: {
            type: 'checkbox',
            checked: selectedRows.includes(student.studentId),
            onChange: (checked) => handleRowSelect(student.studentId, checked)
          }
        };
        return extendedStudent;
      });
      
      setStudentsWithPaymentStatus(updatedStudents);
    }
  }, [
    storeInitialized, 
    studentStore.getStudents, 
    selectedRows, 
    paginationKey,
    filterKey,
    studentStore.getCurrentPage,
    studentStore.getPageSize,
    studentStore.getSortField,
    studentStore.getSortOrder
  ]);
  
  // Only render content when store is initialized
  if (!storeInitialized) {
    return (
      <Layout>
        <div className="p-4 text-center">
          <div className="text-lg">Loading student data...</div>
        </div>
      </Layout>
    );
  }

  // Show loading indicator when fetching data
  if (studentStore.isLoading && studentStore.getStudents.length === 0) {
    return (
      <Layout>
        <div className="p-4 text-center">
          <div className="text-lg">Loading student data...</div>
        </div>
      </Layout>
    );
  }
  
  const confirmDelete = async () => {
    if (selectedStudent) {
      try {
        console.log(`Confirming delete for student: ${selectedStudent.name} (${selectedStudent.studentId})`);
        await studentStore.deleteStudent(selectedStudent.studentId);
        setIsDeleteModalOpen(false);
        // Refresh the student list after deletion
        // No need to call fetchStudents since the store already updates
      } catch (error) {
        console.error("Error deleting student:", error);
        alert("Failed to delete student. Please try again.");
      }
    }
  };
  
  const handleBulkDelete = async () => {
    // Open password confirmation modal instead of confirming directly
    setDeleteAction('bulk');
    setIsPasswordModalOpen(true);
  };
  
  const confirmBulkDelete = async () => {
    try {
      console.log(`Bulk deleting ${selectedRows.length} students`);
        // Use Promise.all to wait for all delete operations to complete
        await Promise.all(selectedRows.map(id => studentStore.deleteStudent(id)));
        setSelectedRows([]);
      // No need to call fetchStudents since the store already updates
      } catch (error) {
        console.error("Error deleting students:", error);
        alert("Failed to delete some students. Please try again.");
    }
  };
  
  const handleBulkEdit = () => {
    setIsBulkEditModalOpen(true);
  };
  
  const handleApplyFilters = (filters: FilterValue) => {
    // Clear existing filters first
    studentStore.clearFilters();
    
    // Apply each filter individually
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== '') {
        if (typeof value === 'object' && value !== null && 'min' in value && 'max' in value) {
          // Handle range filters
          const rangeValue = value as { min: number | null; max: number | null };
          if (rangeValue.min !== null) {
            studentStore.setFilter(`${key}Min`, rangeValue.min);
          }
          if (rangeValue.max !== null) {
            studentStore.setFilter(`${key}Max`, rangeValue.max);
          }
        } else {
          // Handle regular filters
          studentStore.setFilter(key, value as string | number | boolean);
        }
      }
    });
    
    // Increment filterKey to force a re-render
    setFilterKey(prev => prev + 1);
    
    // No need to call fetchStudents() as applyFiltersAndPagination is already called by setFilter
  };
  
  const handleSearch = (query: string, fields: Record<string, string>) => {
    console.log("Search triggered with query:", query, "and fields:", fields);
    
    // Set the search query
    studentStore.setSearchQuery(query);
    
    // Apply search filters
    const searchFilters: Record<string, string | number | boolean> = {};
    Object.entries(fields).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        searchFilters[key] = value;
      }
    });
    
    // Set the filters in the store
    studentStore.setFilters(searchFilters);
    
    // Increment filterKey to force a re-render
    setFilterKey(prev => prev + 1);
    
    // No need to call fetchStudents() as applyFiltersAndPagination is already called by setSearchQuery and setFilters
  };
  
  // Define search fields
  const searchFields: SearchField[] = [
    {
      id: 'name',
      label: 'Name',
      type: 'text',
      placeholder: 'Student name'
    },
    {
      id: 'studentId',
      label: 'Student ID',
      type: 'text',
      placeholder: 'ID number'
    },
    {
      id: 'batch',
      label: 'Batch',
      type: 'select',
      options: batchConfig.batches.map((batch: string) => ({ value: batch, label: batch }))
    },
    {
      id: 'classTeacher',
      label: 'Class Teacher',
      type: 'select',
      options: batchConfig.teachers.map((teacher: string) => ({ value: teacher, label: teacher }))
    },
    {
      id: 'hostel',
      label: 'Hostel',
      type: 'select',
      options: batchConfig.hostels.map((hostel: string) => ({ value: hostel, label: hostel }))
    },
    {
      id: 'stream',
      label: 'Stream',
      type: 'select',
      options: batchConfig.streams.map((stream: string) => ({ value: stream, label: stream }))
    },
    {
      id: 'program',
      label: 'Program',
      type: 'select',
      options: batchConfig.programs.map((program: string) => ({ value: program, label: program }))
    }
  ];
  
  // Define bulk actions
  // const bulkActions: BulkAction[] = [
  //   {
  //     id: 'delete',
  //     label: 'Delete',
  //     icon: <Trash2 size={16} />,
  //     onClick: handleBulkDelete,
  //     variant: 'danger'
  //   },
  //   {
  //     id: 'edit',
  //     label: 'Edit',
  //     icon: <Edit size={16} />,
  //     onClick: handleBulkEdit
  //   },
  //   {
  //     id: 'export',
  //     label: 'Export',
  //     icon: <FileDown size={16} />,
  //     onClick: handleExportSelected
  //   }
  // ];
  
  // Define sort options
  const sortOptions: SortOption[] = [
    { value: 'slNo', label: 'Sl No' },
    { value: 'name', label: 'Name' },
    { value: 'studentId', label: 'Student ID' },
    { value: 'batch', label: 'Batch' },
    { value: 'classTeacher', label: 'Class Teacher' },
    { value: 'hostel', label: 'Hostel' }
  ];
  
  // Define filter options
  const filterOptions: FilterOption[] = [
    {
      id: 'batch',
      label: 'Batch',
      type: 'select',
      options: batchConfig.batches.map((batch: string) => ({ value: batch, label: batch })),
    },
    {
      id: 'classTeacher',
      label: 'Class Teacher',
      type: 'select',
      options: batchConfig.teachers.map((teacher: string) => ({ value: teacher, label: teacher })),
    },
    {
      id: 'hostel',
      label: 'Hostel',
      type: 'select',
      options: batchConfig.hostels.map((hostel: string) => ({ value: hostel, label: hostel })),
    },
    {
      id: 'stream',
      label: 'Stream',
      type: 'select',
      options: batchConfig.streams.map((stream: string) => ({ value: stream, label: stream })),
    },
    {
      id: 'program',
      label: 'Program',
      type: 'select',
      options: batchConfig.programs.map((program: string) => ({ value: program, label: program })),
    },
    {
      id: 'neetScore',
      label: 'NEET Score',
      type: 'range',
      min: 0,
      max: 720,
    },
    {
      id: 'percentageOfPlus2Marks',
      label: 'Plus 2 Percentage',
      type: 'range',
      min: 0,
      max: 100,
    },
    {
      id: 'joined',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'JOINED', label: 'Joined' },
        { value: 'ALLOTED', label: 'Alloted' },
        { value: 'JOINING SOON', label: 'Joining Soon' },
        { value: 'NOT JOINING', label: 'Not Joining' },
        { value: 'VACATED', label: 'Vacated' },
      ],
    },
    {
      id: 'gender',
      label: 'Gender',
      type: 'select',
      options: [
        { value: 'M', label: 'Male' },
        { value: 'F', label: 'Female' },
        { value: 'DIFFERENT', label: 'Different' },
      ],
    },
    {
      id: 'syllabus',
      label: 'Syllabus',
      type: 'select',
      options: [
        { value: 'STATE', label: 'State' },
        { value: 'CBSE', label: 'CBSE' },
        { value: 'ICSC', label: 'ICSC' },
        { value: 'OTHERS', label: 'Others' },
      ],
    },
    {
      id: 'feeDue',
      label: 'Payment Status',
      type: 'select',
      options: [
        { value: '0', label: 'Paid' },
        { value: '1', label: 'Not Paid' },
      ],
    },
  ];
  
  // Define columns to match the Table component interface
  const columns = [
    { id: 'name', label: 'Name', width: '200px', frozen: true, sortable: true },
    { id: 'studentId', label: 'Student ID', width: '150px', frozen: true, sortable: true },
    { id: 'phoneNumber', label: 'Phone Number', width: '150px', sortable: true },
    { id: 'gender', label: 'Gender', width: '100px', sortable: true },
    { id: 'batch', label: 'Batch', width: '120px', sortable: true },
    { id: 'classTeacher', label: 'Class Teacher', width: '150px', sortable: true },
    { id: 'hostel', label: 'Hostel', width: '120px', sortable: true },
    { id: 'stream', label: 'Stream', width: '120px', sortable: true },
    { id: 'program', label: 'Program', width: '120px', sortable: true },
    { id: 'studyMaterial', label: 'Study Material', width: '120px', sortable: true },
    { id: 'uniform', label: 'Uniform', width: '100px', sortable: true },
    { id: 'idCard', label: 'ID Card', width: '100px', sortable: true },
    { id: 'tab', label: 'Tab', width: '100px', sortable: true },
    { id: 'joined', label: 'Joined', width: '120px', sortable: true },
    { id: 'syllabus', label: 'Syllabus', width: '100px', sortable: true },
    { id: 'percentageOfPlus2Marks', label: '% of +2 Marks', width: '120px', sortable: true },
    { id: 'neetScore', label: 'NEET Score', width: '120px', sortable: true },
    { id: 'remarks', label: studentStore.remarksConfig.remarks, width: '150px', sortable: true },
    { id: 'remarks1', label: studentStore.remarksConfig.remarks1, width: '150px', sortable: true },
    { id: 'remarks2', label: studentStore.remarksConfig.remarks2, width: '150px', sortable: true },
    { id: 'remarks3', label: studentStore.remarksConfig.remarks3, width: '150px', sortable: true },
    { id: 'remarks4', label: studentStore.remarksConfig.remarks4, width: '150px', sortable: true },
    { id: 'feeDue', label: 'Fee Due', width: '100px', sortable: true },
    { id: 'flag1', label: studentStore.flagsConfig.flag1, width: '100px', sortable: true },
    { id: 'flag2', label: studentStore.flagsConfig.flag2, width: '100px', sortable: true },
    { id: 'flag3', label: studentStore.flagsConfig.flag3, width: '100px', sortable: true },
    { id: 'flag4', label: studentStore.flagsConfig.flag4, width: '100px', sortable: true },
    { id: 'actions', label: 'Actions', width: '150px' }
  ];
  
  // Add console log to debug
  console.log("Students data:", studentsWithPaymentStatus);

  // Add this function to use sortOptions
  const renderSortOptions = () => {
    return (
      <div className="hidden">
        {/* This is hidden but uses the sortOptions to prevent linter errors */}
        {sortOptions.map(option => (
          <span key={option.value}>{option.label}</span>
        ))}
      </div>
    );
  };

  // Update the renderBulkActions function to include the export button
  const renderBulkActions = () => {
    const hasSelected = selectedRows.length > 0;
    const allSelected = studentStore.getStudents.length > 0 && selectedRows.length === studentStore.getStudents.length;
    
    return (
      <div className="flex flex-wrap items-center gap-2">
        {/* Selection actions */}
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            // Select all students in the current view
            const allStudentIds = studentStore.getStudents.map(s => s.studentId);
            setSelectedRows(allStudentIds);
          }}
          disabled={allSelected}
          title="Select all filtered students"
        >
          Select All
        </Button>
        
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setSelectedRows([])}
          disabled={!hasSelected}
          title="Deselect all students"
        >
          Deselect All
        </Button>

        {/* Export format selector */}
        <select
          className="p-1 border rounded text-sm"
          value={exportFormat}
          onChange={(e) => setExportFormat(e.target.value as 'xlsx' | 'csv' | 'pdf')}
          title="Select export format"
        >
          <option value="xlsx">Excel (.xlsx)</option>
          <option value="csv">CSV</option>
          <option value="pdf">PDF</option>
        </select>

        {/* Export actions */}
        <Button
          variant="primary"
          size="sm"
          onClick={() => prepareExportData('filtered')}
          title="Export all filtered students"
        >
          <FileDown size={16} className="mr-1" />
          Export All
        </Button>
        
        {hasSelected && (
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => prepareExportData('selected')}
              title="Export selected students"
            >
              <FileDown size={16} className="mr-1" />
              Export Selected ({selectedRows.length})
            </Button>
            
          <Button
            variant="secondary"
            size="sm"
              onClick={handleBulkEdit}
              disabled={!hasSelected}
            >
              <Edit size={16} className="mr-1" />
              Edit ({selectedRows.length})
          </Button>
            
            <Button
              variant="danger"
              size="sm"
              onClick={handleBulkDelete}
              disabled={!isAdmin || !hasSelected}
            >
              <Trash2 size={16} className="mr-1" />
              Delete ({selectedRows.length})
            </Button>
          </>
        )}
      </div>
    );
  };

  // Add a handleSort function
  const handleSort = (field: string, order: 'asc' | 'desc') => {
    studentStore.setSorting(field, order);
  };

  // Function to show success message temporarily
  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message);
    // Clear the message after 3 seconds
    setTimeout(() => {
      setSuccessMessage('');
    }, 3000);
  };
  
  // Function to show error message temporarily
  const showErrorMessage = (message: string) => {
    setErrorMessage(message);
    // Clear the message after 3 seconds
    setTimeout(() => {
      setErrorMessage('');
    }, 3000);
  };
  
  // Function to handle existing student
  const handleExistingStudent = (studentId: string) => {
    // Find the existing student
    const existingStudent = studentStore.getStudents.find(s => s.studentId === studentId);
    if (existingStudent) {
      // Close the add modal
      setIsAddModalOpen(false);
      // Show an error message
      showErrorMessage(`Student ID ${studentId} already exists.`);
      
      // After a short delay, open the edit modal with the existing student
      setTimeout(() => {
        setSelectedStudent(existingStudent as ExtendedStudent);
        setIsEditModalOpen(true);
      }, 500);
    }
  };
  
  // Function to prepare export data
  const prepareExportData = (type: 'all' | 'filtered' | 'selected'): void => {
    setExportType(type);
    let students: Student[] = [];
    let defaultName = '';
    
    switch (type) {
      case 'all':
        students = studentStore.getAllStudents;
        defaultName = `all-students-${new Date().toISOString().slice(0, 10)}`;
        break;
      case 'filtered':
        students = studentStore.getStudents;
        defaultName = `filtered-students-${new Date().toISOString().slice(0, 10)}`;
        break;
      case 'selected':
        students = studentStore.getAllStudents.filter(student => 
          selectedRows.includes(student.studentId)
        );
        defaultName = `selected-students-${new Date().toISOString().slice(0, 10)}`;
        break;
    }
    
    if (students.length === 0) {
      showErrorMessage('No students to export');
      return;
    }
    
    try {
      if (exportFormat === 'xlsx') {
        const excelData = studentsToExcel(students);
        setExportData(excelData);
        setExportDefaultFilename(defaultName);
        setIsFileNamePromptOpen(true);
      } else if (exportFormat === 'csv') {
        const csvData = studentsToCSV(students);
        setExportData(csvData);
        setExportDefaultFilename(defaultName);
        setIsFileNamePromptOpen(true);
      } else if (exportFormat === 'pdf') {
        const pdfDoc = studentsToPDF(students);
        setExportData(pdfDoc);
        setExportDefaultFilename(defaultName);
        setIsFileNamePromptOpen(true);
      }
    } catch (err) {
      console.error('Error exporting student data:', err);
      showErrorMessage('Failed to export students data');
    }
  };
  
  // Function to handle the export after filename is provided
  const handleExportWithFilename = (filename: string): void => {
    if (!exportData) return;
    
    try {
      if (exportFormat === 'xlsx') {
        downloadExcel(exportData as ArrayBuffer, `${filename}.xlsx`);
        showSuccessMessage(`Exported ${exportType === 'all' ? 'all' : exportType === 'filtered' ? 'filtered' : 'selected'} students to ${filename}.xlsx`);
      } else if (exportFormat === 'csv') {
        downloadCSV(exportData as string, `${filename}.csv`);
        showSuccessMessage(`Exported ${exportType === 'all' ? 'all' : exportType === 'filtered' ? 'filtered' : 'selected'} students to ${filename}.csv`);
      } else if (exportFormat === 'pdf') {
        downloadPDF(exportData as any, `${filename}.pdf`);
        showSuccessMessage(`Exported ${exportType === 'all' ? 'all' : exportType === 'filtered' ? 'filtered' : 'selected'} students to ${filename}.pdf`);
      }
    } catch (err) {
      console.error('Error downloading file:', err);
      showErrorMessage('Failed to download file');
    }
  };
  
  return (
    <Layout title="Students">
      <div className="flex flex-col h-full">
        {/* Success and Error Messages */}
        {successMessage && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-green-600">
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600">
            {errorMessage}
          </div>
        )}
        
        <div className="mb-4 flex justify-between items-center">
          <p className="text-gray-600">
            {studentStore.getTotalStudents > 0 
              ? `${studentStore.getTotalStudents} students found` 
              : "No students found"}
          </p>
          
          {/* Add info about clicking on student names */}
          <p className="text-sm text-gray-500 mt-1">
            Click on a student's name to edit their information.
          </p>
          
          <div className="flex flex-wrap gap-2">
            <Button
              variant="primary"
              onClick={() => setIsAddModalOpen(true)}
              icon={<Plus size={16} />}
            >
              Add Student
            </Button>
            
            <Button
              variant="secondary"
              onClick={() => setIsFilterModalOpen(true)}
              icon={<Filter size={16} />}
            >
              Filter
            </Button>
            
            <Button
              variant="secondary"
              onClick={() => {
                // Export all students to Excel
                prepareExportData('all');
              }}
              icon={<FileDown size={16} />}
            >
              Export
            </Button>
            
            {/* Insert Sort Options component here conditionally */}
            <div className="hidden">
              {/* This keeps the sort functions in the codebase but doesn't display them */}
              {renderSortOptions && renderSortOptions()}
            </div>
          </div>
        </div>
        
        {/* Display bulk action buttons when students are selected */}
        {selectedRows.length > 0 && (
          <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              {selectedRows.length} students selected
            </h3>
            {renderBulkActions()}
          </div>
        )}
        
        {isFilterOpen && (
          <div className="mb-6">
            <FilterPanel
              filters={filterOptions}
              onApplyFilters={handleApplyFilters}
              onResetFilters={() => {
                studentStore.clearFilters();
                // Increment filterKey to force a re-render
                setFilterKey(prev => prev + 1);
                studentStore.fetchStudents();
              }}
              isOpen={isFilterOpen}
              onClose={() => setIsFilterOpen(false)}
              initialValues={{}}
            />
          </div>
        )}
        
        <div className="mb-6">
          <AdvancedSearch
            searchFields={searchFields}
            onSearch={handleSearch}
            initialQuery=""
              />
            </div>
        
        {studentStore.isLoading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-500">Loading students...</p>
          </div>
        ) : (
          <>
            {isMobile ? (
              <MobileTable
                columns={columns}
                data={studentsWithPaymentStatus}
                onRowClick={(student) => handleEdit(student as ExtendedStudent)}
                priorityFields={['name', 'studentId', 'batch', 'classTeacher']}
              />
            ) : (
          <Table
            columns={columns}
            data={studentsWithPaymentStatus}
            isSelectable={true}
            sortField={studentStore.getSortField}
            sortOrder={studentStore.getSortOrder}
            onSort={handleSort}
          />
            )}
            
            <div className="mt-4 flex justify-between items-center">
              <div className="text-sm text-gray-500">
                Showing {studentsWithPaymentStatus.length} of {studentStore.getTotalStudents} students
              </div>
              
            <Pagination
              currentPage={studentStore.getCurrentPage}
              totalPages={studentStore.getTotalPages}
              onPageChange={(page) => {
                studentStore.setPage(page);
                // Explicitly call fetchStudents to update the data
                studentStore.fetchStudents();
                // Increment paginationKey to force a re-render
                setPaginationKey(prev => prev + 1);
              }}
              pageSize={studentStore.getPageSize}
              totalItems={studentStore.getTotalStudents}
              onPageSizeChange={(size) => {
                studentStore.setPageSize(size);
                // Explicitly call fetchStudents to update the data
                studentStore.fetchStudents();
                // Increment paginationKey to force a re-render
                setPaginationKey(prev => prev + 1);
              }}
              pageSizeOptions={[50, 100, 200, 500]}
            />
          </div>
          </>
        )}
        
        {/* Add Student Modal */}
        <Modal
          title="Add Student"
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          size="xl"
        >
          <StudentForm
            mode="add"
            onClose={() => {
              setIsAddModalOpen(false);
              // Refresh the student list after adding
              studentStore.fetchStudents();
              // Show success message
              showSuccessMessage('Student added successfully!');
            }}
            onExistingStudent={handleExistingStudent}
          />
        </Modal>
        
        {/* Edit Student Modal */}
        <Modal
          title={`Edit Student: ${selectedStudent?.name && typeof selectedStudent.name === 'string' ? selectedStudent.name : ''}`}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          size="xl"
        >
          {selectedStudent && (
            <StudentForm
              student={selectedStudent as Student}
              mode="edit"
              onClose={() => {
                setIsEditModalOpen(false);
                // Refresh the student list after editing
                studentStore.fetchStudents();
                // Show success message
                showSuccessMessage('Student updated successfully!');
              }}
            />
          )}
        </Modal>
        
        {/* Bulk Edit Modal */}
        <Modal
          isOpen={isBulkEditModalOpen}
          onClose={() => setIsBulkEditModalOpen(false)}
          title={`Edit ${selectedRows.length} Students`}
          size="lg"
        >
          <div className="p-4">
            <p className="mb-4">
              Bulk edit functionality will be implemented here. You can update common fields for all selected students.
            </p>
            <div className="flex justify-end">
              <Button
                variant="secondary"
                onClick={() => setIsBulkEditModalOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
        
        {/* Password Confirmation Modal */}
        <PasswordConfirmModal
          isOpen={isPasswordModalOpen}
          onClose={() => setIsPasswordModalOpen(false)}
          onConfirm={() => {
            if (deleteAction === 'single') {
              setIsDeleteModalOpen(true);
            } else {
              confirmBulkDelete();
            }
          }}
          title="Confirm Delete"
          message={deleteAction === 'single' 
            ? `To delete student ${selectedStudent?.name}, please type CONFIRMDELETE below.` 
            : `To delete ${selectedRows.length} students, please type CONFIRMDELETE below.`}
        />
        
        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title="Confirm Delete"
          size="sm"
        >
          <div className="text-center">
            <p className="mb-4">
              Are you sure you want to delete student{' '}
              <span className="font-semibold">{selectedStudent?.name}</span>?
            </p>
            <p className="mb-6 text-red-600 text-sm">
              This action cannot be undone.
            </p>
            <div className="flex justify-center space-x-4">
              <Button
                variant="secondary"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Cancel
              </Button>
              <Button variant="danger" onClick={confirmDelete}>
                Delete
              </Button>
            </div>
          </div>
        </Modal>
        
        {/* Filter Modal */}
        <FilterPanel
          isOpen={isFilterModalOpen}
          onClose={() => setIsFilterModalOpen(false)}
          filters={filterOptions}
          onApplyFilters={handleApplyFilters}
          onResetFilters={studentStore.clearFilters}
        />
        
        {/* File Name Prompt */}
        <FileNamePrompt
          isOpen={isFileNamePromptOpen}
          onClose={() => setIsFileNamePromptOpen(false)}
          onConfirm={handleExportWithFilename}
          defaultFileName={exportDefaultFilename}
          title="Export Students"
          fileType="Excel (.xlsx)"
        />
      </div>
    </Layout>
  );
});

export default Students;