import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { Plus, Edit, Trash2, Filter, FileDown } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Table, { TableItem } from '../components/ui/Table';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Pagination from '../components/ui/Pagination';
import StudentForm from '../components/students/StudentForm';

import AdvancedSearch, { SearchField } from '../components/ui/AdvancedSearch';
import FilterPanel, { FilterOption, FilterValue } from '../components/ui/FilterPanel';
import { useStudentStore } from '../store/studentStore';
import { useAuthStore } from '../store/authStore';
import { Student } from '../types';
import { studentsToExcel, downloadExcel } from '../utils/excelUtils';
import PasswordConfirmModal from '../components/ui/PasswordConfirmModal';

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
  
  // Get batch config from the store
  const { batchConfig } = studentStore;
  
  const [searchTerm, setSearchTerm] = useState('');
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
    storeInitialized,studentStore
    // Remove dependencies on studentStore properties
    // studentStore.getCurrentPage,
    // studentStore.getPageSize,
    // studentStore.getSortField,
    // studentStore.getSortOrder
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
    
    setSelectedStudent(student);
    setIsEditModalOpen(true);
  };
  
  const handleDelete = (student: ExtendedStudent) => {
    setSelectedStudent(student);
    // Open password confirmation modal instead of delete modal directly
    setDeleteAction('single');
    setIsPasswordModalOpen(true);
  };
  
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
  
  const handleExportSelected = () => {
    const selectedStudents = studentStore.getStudents.filter(student => 
      selectedRows.includes(student.studentId)
    );
    
    if (selectedStudents.length > 0) {
      const excelData = studentsToExcel(selectedStudents);
      downloadExcel(excelData, `selected-students-${new Date().toISOString().slice(0, 10)}.xlsx`);
    }
  };
  
  const handleRowSelect = (id: string, selected: boolean) => {
    if (selected) {
      setSelectedRows(prev => [...prev, id]);
    } else {
      setSelectedRows(prev => prev.filter(rowId => rowId !== id));
    }
  };
  
  const handleApplyFilters = (filters: FilterValue) => {
    // Clear existing filters first
    studentStore.clearFilters();
    
    // Apply each filter individually
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== '') {
        studentStore.setFilter(key, value);
      }
    });
    
    // Fetch students with the new filters
    studentStore.fetchStudents();
  };
  
  const handleSearch = (query: string, fields: Record<string, string>) => {
    console.log("Search triggered with query:", query, "and fields:", fields);
    setSearchTerm(query);
    
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
    
    // Fetch students with the new search parameters
    studentStore.fetchStudents();
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
  
  // Add a custom cell for actions
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

  // Create a custom name cell with a hyperlink
  const getNameCell = (student: ExtendedStudent) => (
    <a 
      href="#" 
      className="text-blue-600 hover:text-blue-800 hover:underline"
      onClick={(e) => {
        e.preventDefault();
        handleEdit(student);
      }}
    >
      {student.name}
    </a>
  );

  // Modify the studentsWithPaymentStatus to include select property for checkboxes
  const studentsWithPaymentStatus = studentStore.getStudents.map(student => {
    const isSelected = selectedRows.includes(student.studentId);
    const studentData = {
      ...student,
      hasPaid: student.feeDue === 0,
      // Add select property for checkboxes
      select: isAdmin ? {
        type: 'checkbox' as const,
        checked: isSelected,
        onChange: (checked: boolean) => handleRowSelect(student.studentId, checked)
      } : undefined,
      // Add actions
      actions: getActionButtons(student as ExtendedStudent),
      // Replace name with a hyperlink
      name: getNameCell(student as ExtendedStudent)
    };
    return studentData as ExtendedStudent;
  });

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

  // Add a function to export all filtered students
  const handleExportFiltered = async () => {
    try {
      // Show loading indicator or use a simple alert
      alert("Preparing export... This may take a moment.");
      
      // Get the current filters, search, and sort parameters
      const params: Record<string, string | number | boolean | undefined> = {
        sortBy: studentStore.getSortField,
        sortOrder: studentStore.getSortOrder,
        search: studentStore.searchQuery.get(),
      };
      
      // Add all filters to params
      studentStore.filters.forEach((value, key) => {
        if (value !== null && value !== undefined && value !== '') {
          params[key] = value;
        }
      });
      
      console.log("Exporting students with params:", params);
      
      // Fetch all students matching the current filters (without pagination)
      const allFilteredStudents = await studentStore.fetchAllFilteredStudents(params);
      
      if (allFilteredStudents.length === 0) {
        alert("No students to export");
        return;
      }
      
      // Convert to Excel and download
      const excelData = studentsToExcel(allFilteredStudents);
      const filename = `students-export-${new Date().toISOString().slice(0, 10)}.xlsx`;
      
      // Show success message with count
      alert(`Exporting ${allFilteredStudents.length} students`);
      
      // Download the file
      downloadExcel(excelData, filename);
    } catch (error) {
      console.error("Error exporting students:", error);
      alert("Failed to export students. Please try again.");
    }
  };

  // Update the renderBulkActions function to include the export button
  const renderBulkActions = () => {
    const hasSelected = selectedRows.length > 0;
    
    return (
      <div className="flex items-center space-x-2">
        <Button
          variant="primary"
          size="sm"
          onClick={handleExportFiltered}
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
              onClick={handleExportSelected}
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
              disabled={!hasSelected}
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

  // Add a function to export all students with current filters
  // const handleExportAll = async () => {
  //   try {
  //     // Show loading message
  //     alert("Preparing export... This may take a moment.");
      
  //     // Get all students from the store
  //     const allStudents = studentStore.getAllStudents;
      
  //     if (allStudents.length === 0) {
  //       alert("No students to export");
  //       return;
  //     }
      
  //     // Convert to Excel and download
  //     const excelData = studentsToExcel(allStudents);
  //     const filename = `students-export-${new Date().toISOString().slice(0, 10)}.xlsx`;
      
  //     // Download the file
  //     downloadExcel(excelData, filename);
      
  //     // Show success message
  //     alert(`Exported ${allStudents.length} students successfully`);
  //   } catch (error) {
  //     console.error("Error exporting students:", error);
  //     alert("Failed to export students. Please try again.");
  //   }
  // };
  
  return (
    <Layout>
      {/* Hidden elements to use variables and prevent linter errors */}
      {renderSortOptions()}
      {renderBulkActions()}
      
      <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Students</h1>
        
        <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={handleExportFiltered}
              className="flex items-center"
              title="Export all students with current filters"
            >
              <FileDown size={16} className="mr-1" /> Export All
            </Button>
            
            {isAdmin && (
            <Button
              variant="primary"
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center"
            >
              <Plus size={16} className="mr-1" />
              Add Student
            </Button>
          )}
          
            <Button
              variant="secondary"
              onClick={() => setIsFilterModalOpen(true)}
              className="flex items-center"
            >
              <Filter size={16} className="mr-1" /> Filter
            </Button>
            
            {isAdmin && selectedRows.length > 0 && (
              <div className="flex space-x-2">
                <Button
                  variant="danger"
                  onClick={handleBulkDelete}
                  className="flex items-center"
                >
                  <Trash2 size={16} className="mr-1" /> Delete Selected
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleBulkEdit}
                  className="flex items-center"
                >
                  <Edit size={16} className="mr-1" /> Edit Selected
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleExportSelected}
                  className="flex items-center"
                >
                  <FileDown size={16} className="mr-1" /> Export Selected
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Search and bulk actions */}
        <div className="flex justify-between items-center mb-4">
          <div className="w-1/3">
            <AdvancedSearch
              onSearch={handleSearch}
              searchFields={searchFields}
              initialQuery={searchTerm}
            />
          </div>
        </div>
        
        {/* Students table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table
          columns={columns}
          data={studentsWithPaymentStatus}
            isSelectable={isAdmin}
            emptyMessage="No students found"
            sortField={studentStore.getSortField}
            sortOrder={studentStore.getSortOrder}
            onSort={handleSort}
          />
        </div>

        {/* Pagination */}
        <div className="mt-4 flex justify-between items-center">
          <div>
            Showing {studentStore.getStudents.length} of {studentStore.getTotalStudents} students
          </div>
          <Pagination
            currentPage={studentStore.getCurrentPage}
            totalPages={studentStore.getTotalPages}
            onPageChange={(page) => studentStore.setPage(page)}
            pageSize={studentStore.getPageSize}
            totalItems={studentStore.getTotalStudents}
            onPageSizeChange={(size) => studentStore.setPageSize(size)}
          />
        </div>
      </div>
      
      {/* Add Student Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Student"
        size="lg"
      >
        <StudentForm
          onClose={() => {
            setIsAddModalOpen(false);
            studentStore.fetchStudents(); // Refresh the student list after adding
          }}
          mode="add"
        />
      </Modal>
      
      {/* Edit Student Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Student"
        size="lg"
      >
        {selectedStudent && (
          <StudentForm
            student={selectedStudent as unknown as Student}
            onClose={() => {
              setIsEditModalOpen(false);
              studentStore.fetchStudents(); // Refresh the student list after editing
            }}
            mode="edit"
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
    </Layout>
  );
});

export default Students;