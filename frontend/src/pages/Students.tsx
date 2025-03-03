import React, { useState, useMemo } from 'react';
import { Search, Plus, Edit, Trash2 } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { useStudentStore } from '../store/studentStore';
import { useAuthStore } from '../store/authStore';
import StudentForm from '../components/students/StudentForm';
import { Student } from '../types';

const Students: React.FC = () => {
  const { students, deleteStudent } = useStudentStore();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  
  // Filter students based on search term and user role
  const filteredStudents = useMemo(() => {
    let filtered = students;
    
    // If user is a mentor, only show students in their class
    if (!isAdmin && user?.class) {
      filtered = filtered.filter(student => student.batch === user.class);
    }
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        student =>
          student.name.toLowerCase().includes(term) ||
          student.studentId.toLowerCase().includes(term) ||
          student.phoneNumber.includes(term)
      );
    }
    
    return filtered;
  }, [students, searchTerm, isAdmin, user]);
  
  const handleEdit = (student: Student) => {
    setSelectedStudent(student);
    setIsEditModalOpen(true);
  };
  
  const handleDelete = (student: Student) => {
    setSelectedStudent(student);
    setIsDeleteModalOpen(true);
  };
  
  const confirmDelete = () => {
    if (selectedStudent) {
      deleteStudent(selectedStudent.studentId);
      setIsDeleteModalOpen(false);
    }
  };
  
  const columns = [
    { header: 'ID', accessor: 'studentId', width: '100px' },
    { header: 'Name', accessor: 'name' },
    { header: 'Batch', accessor: 'batch' },
    { header: 'Phone', accessor: 'phoneNumber' },
    { header: 'Stream', accessor: 'stream' },
    { header: 'Status', accessor: 'joined' },
    {
      header: 'Actions',
      accessor: (student: Student) => (
        <div className="flex space-x-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(student);
            }}
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
      ),
      width: '120px',
    },
  ];
  
  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Students</h1>
        
        <div className="flex space-x-2">
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
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-4 flex items-center">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              fullWidth
            />
          </div>
        </div>
        
        <Table
          columns={columns}
          data={filteredStudents}
          keyExtractor={(student) => student.studentId}
          onRowClick={handleEdit}
        />
      </div>
      
      {/* Add Student Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Student"
        size="lg"
      >
        <StudentForm
          onClose={() => setIsAddModalOpen(false)}
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
            student={selectedStudent}
            onClose={() => setIsEditModalOpen(false)}
            mode="edit"
          />
        )}
      </Modal>
      
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
    </Layout>
  );
};

export default Students;