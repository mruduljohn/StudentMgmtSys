import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { useMentorStore } from '../store/mentorStore';
import { useStudentStore } from '../store/studentStore';
import { User } from '../types';

// Define the TableColumn type to match what Table expects
interface TableColumn {
  id: string;
  label: string;
  width?: string;
  frozen?: boolean;
}

// Define a type that extends User to include the id property
interface MentorWithId extends User {
  id: string;
}

// Define a type for the mentor with actions
interface MentorWithActions extends MentorWithId {
  actions: React.ReactNode;
  [key: string]: React.ReactNode | string | undefined; // More specific index signature
}

const Mentors: React.FC = () => {
  const mentorStore = useMentorStore();
  const { batchConfig } = useStudentStore();
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState<Partial<User>>({
    name: '',
    email: '',
    class: '',
    role: 'MENTOR',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Initialize mentorStore on component mount
  useEffect(() => {
    const initializeData = async () => {
      try {
        // If fetchMentors doesn't exist, we'll just set loading to false
        // In a real app, you would implement this method in the store
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch mentors:", error);
        setLoading(false);
      }
    };
    
    initializeData();
  }, []);
  
  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      class: '',
      role: 'MENTOR',
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
      mentorStore.addMentor({
        ...formData,
        id: Date.now().toString(),
        role: 'MENTOR',
      } as User);
      setIsAddModalOpen(false);
    } else if (isEditModalOpen && selectedMentor) {
      mentorStore.updateMentor(selectedMentor.id, formData);
      setIsEditModalOpen(false);
    }
    
    resetForm();
  };
  
  const handleEdit = (mentor: MentorWithId) => {
    setSelectedMentor(mentor);
    setFormData({
      name: mentor.name,
      email: mentor.email,
      class: mentor.class,
      role: 'MENTOR',
    });
    setIsEditModalOpen(true);
  };
  
  const handleDelete = (mentor: User) => {
    setSelectedMentor(mentor);
    setIsDeleteModalOpen(true);
  };
  
  const confirmDelete = () => {
    if (selectedMentor) {
      mentorStore.deleteMentor(selectedMentor.id);
      setIsDeleteModalOpen(false);
    }
  };
  
  const columns: TableColumn[] = [
    { id: 'name', label: 'Name', width: '200px' },
    { id: 'email', label: 'Email', width: '250px' },
    { id: 'class', label: 'Class', width: '150px' },
    { id: 'actions', label: 'Actions', width: '120px' }
  ];
  
  if (loading) {
    return (
      <Layout>
        <div className="p-4 text-center">
          <div className="text-lg">Loading mentor data...</div>
        </div>
      </Layout>
    );
  }
  
  // Create a simplified version of the Table component that matches our needs
  const SimpleTable = ({ data, columns, onRowClick }: { 
    data: MentorWithActions[]; 
    columns: TableColumn[]; 
    onRowClick: (item: MentorWithActions) => void;
  }) => {
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.id}
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  style={{ width: column.width }}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item, index) => (
              <tr 
                key={index} 
                onClick={() => onRowClick(item)}
                className="hover:bg-gray-50 cursor-pointer"
              >
                {columns.map((column) => (
                  <td 
                    key={`${index}-${column.id}`} 
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                  >
                    {item[column.id]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };
  
  // Create a custom data structure that includes the actions
  const mentorsWithActions: MentorWithActions[] = mentorStore.mentors.map(mentor => ({
    ...mentor,
    actions: (
      <div className="flex space-x-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleEdit(mentor as MentorWithId);
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
    )
  }));
  
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
        <SimpleTable
          columns={columns}
          data={mentorsWithActions}
          onRowClick={(mentor) => handleEdit(mentor as MentorWithId)}
        />
      </div>
      
      {/* Add/Edit Mentor Modal */}
      <Modal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          if (isAddModalOpen) {
            setIsAddModalOpen(false);
          } else {
            setIsEditModalOpen(false);
          }
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
                if (isAddModalOpen) {
                  setIsAddModalOpen(false);
                } else {
                  setIsEditModalOpen(false);
                }
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