import React, { useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { useMentorStore } from '../store/mentorStore';
import { useStudentStore } from '../store/studentStore';
import { User } from '../types';

const Mentors: React.FC = () => {
  const { mentors, addMentor, updateMentor, deleteMentor } = useMentorStore();
  const { batchConfig } = useStudentStore();
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<User | null>(null);
  
  const [formData, setFormData] = useState<Partial<User>>({
    name: '',
    email: '',
    class: '',
    role: 'mentor',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      class: '',
      role: 'mentor',
    });
    setErrors({});
  };
  
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.class) newErrors.class = 'Class is required';
    
    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Enter a valid email address';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    if (isAddModalOpen) {
      addMentor({
        ...formData,
        id: Date.now().toString(),
        role: 'mentor',
      } as User);
      setIsAddModalOpen(false);
    } else if (isEditModalOpen && selectedMentor) {
      updateMentor(selectedMentor.id, formData);
      setIsEditModalOpen(false);
    }
    
    resetForm();
  };
  
  const handleEdit = (mentor: User) => {
    setSelectedMentor(mentor);
    setFormData({
      name: mentor.name,
      email: mentor.email,
      class: mentor.class,
      role: 'mentor',
    });
    setIsEditModalOpen(true);
  };
  
  const handleDelete = (mentor: User) => {
    setSelectedMentor(mentor);
    setIsDeleteModalOpen(true);
  };
  
  const confirmDelete = () => {
    if (selectedMentor) {
      deleteMentor(selectedMentor.id);
      setIsDeleteModalOpen(false);
    }
  };
  
  const columns = [
    { header: 'Name', accessor: 'name' },
    { header: 'Email', accessor: 'email' },
    { header: 'Class', accessor: 'class' },
    {
      header: 'Actions',
      accessor: (mentor: User) => (
        <div className="flex space-x-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(mentor);
            }}
          >
            <Edit size={16} />
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(mentor);
            }}
          >
            <Trash2 size={16} />
          </Button>
        </div>
      ),
      width: '120px',
    },
  ];
  
  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Mentors</h1>
        
        <Button
          variant="primary"
          onClick={() => {
            resetForm();
            setIsAddModalOpen(true);
          }}
          className="flex items-center"
        >
          <Plus size={16} className="mr-1" />
          Add Mentor
        </Button>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <Table
          columns={columns}
          data={mentors}
          keyExtractor={(mentor) => mentor.id}
          onRowClick={handleEdit}
        />
      </div>
      
      {/* Add/Edit Mentor Modal */}
      <Modal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          isAddModalOpen ? setIsAddModalOpen(false) : setIsEditModalOpen(false);
          resetForm();
        }}
        title={isAddModalOpen ? 'Add New Mentor' : 'Edit Mentor'}
      >
        <form onSubmit={handleSubmit}>
          <Input
            name="name"
            label="Name"
            value={formData.name || ''}
            onChange={handleChange}
            error={errors.name}
            fullWidth
          />
          
          <Input
            name="email"
            label="Email"
            type="email"
            value={formData.email || ''}
            onChange={handleChange}
            error={errors.email}
            fullWidth
          />
          
          <Select
            name="class"
            label="Assigned Class"
            value={formData.class || ''}
            onChange={handleChange}
            options={batchConfig.batches}
            error={errors.class}
            fullWidth
          />
          
          <div className="mt-6 flex justify-end space-x-3">
            <Button
              variant="secondary"
              onClick={() => {
                isAddModalOpen ? setIsAddModalOpen(false) : setIsEditModalOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {isAddModalOpen ? 'Add Mentor' : 'Update Mentor'}
            </Button>
          </div>
        </form>
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
            Are you sure you want to delete mentor{' '}
            <span className="font-semibold">{selectedMentor?.name}</span>?
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

export default Mentors;