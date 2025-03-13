import React, { useState, useEffect } from 'react';
import { Trash2, UserPlus, Edit } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { register, deleteUser, getAllUsers, updateUser } from '../api';
import { useAuthStore } from '../store/authStore';
import { User } from '../types';
import Select from '../components/ui/Select';
import { useStudentStore } from '../store/studentStore';

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}

const UserManagement: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const { batchConfig } = useStudentStore();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    name: '',
    role: 'ADMIN',
    class: ''
  });

  // Fetch all users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const data = await getAllUsers();
      console.log('Fetched users data:', data);
      setUsers(data.users || []);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users');
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await register(formData);
      setSuccess('User added successfully');
      setIsAddModalOpen(false);
      resetForm();
      fetchUsers(); // Refresh the user list
    } catch (error) {
      const apiError = error as ApiError;
      console.error('Error adding user:', error);
      setError(apiError.response?.data?.message || apiError.message || 'Failed to add user');
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedUser) return;

    try {
      const userData = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        class: formData.class
      };

      await updateUser(selectedUser.id, userData);
      setSuccess('User updated successfully');
      setIsEditModalOpen(false);
      fetchUsers(); // Refresh the user list
    } catch (error) {
      const apiError = error as ApiError;
      console.error('Error updating user:', error);
      setError(apiError.response?.data?.message || apiError.message || 'Failed to update user');
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser || !selectedUser.id) {
      setError('Cannot delete user: User ID is missing');
      return;
    }

    try {
      console.log('Deleting user with ID:', selectedUser.id);
      await deleteUser(selectedUser.id);
      setSuccess('User deleted successfully');
      setIsDeleteModalOpen(false);
      fetchUsers(); // Refresh the user list
    } catch (error) {
      const apiError = error as ApiError;
      console.error('Error deleting user:', error);
      setError(apiError.response?.data?.message || apiError.message || 'Failed to delete user');
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      name: '',
      role: 'ADMIN',
      class: ''
    });
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: '', // Don't set password for editing
      name: user.name,
      role: user.role,
      class: user.class || ''
    });
    setIsEditModalOpen(true);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="p-4 text-center">
          <div className="text-lg">Loading user data...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
        
        <Button
          variant="primary"
          onClick={() => {
            resetForm();
            setIsAddModalOpen(true);
          }}
          className="flex items-center"
        >
          <UserPlus size={16} className="mr-1" />
          Add User
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
          {success}
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">System Users</h2>
        
        {users.length === 0 ? (
          <p className="text-gray-500">No users found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Username
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned Class
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.username}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.class || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleEdit(user)}
                        >
                          <Edit size={16} />
                        </Button>
                        
                        {/* Don't allow deleting yourself */}
                        {user.id !== currentUser?.id && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => {
                              console.log('Selected user for deletion:', user);
                              setSelectedUser(user);
                              setIsDeleteModalOpen(true);
                            }}
                          >
                            <Trash2 size={16} />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New User"
      >
        <form onSubmit={handleAddUser}>
          <Input
            name="username"
            label="Username"
            value={formData.username}
            onChange={handleInputChange}
            required
            fullWidth
          />
          
          <Input
            name="name"
            label="Full Name"
            value={formData.name}
            onChange={handleInputChange}
            required
            fullWidth
          />
          
          <Input
            name="email"
            label="Email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            fullWidth
          />
          
          <Input
            name="password"
            label="Password"
            type="password"
            value={formData.password}
            onChange={handleInputChange}
            required
            fullWidth
          />
          
          <Select
            name="role"
            label="Role"
            value={formData.role}
            onChange={handleInputChange}
            options={['ADMIN', 'MENTOR']}
            fullWidth
          />
          
          {formData.role === 'MENTOR' && (
            <Select
              name="class"
              label="Assigned Class"
              value={formData.class}
              onChange={handleInputChange}
              options={batchConfig.batches}
              fullWidth
            />
          )}
          
          <div className="mt-6 flex justify-end space-x-3">
            <Button
              variant="secondary"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Add User
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit User"
      >
        <form onSubmit={handleEditUser}>
          <Input
            name="username"
            label="Username"
            value={formData.username}
            onChange={handleInputChange}
            disabled
            fullWidth
          />
          
          <Input
            name="name"
            label="Full Name"
            value={formData.name}
            onChange={handleInputChange}
            required
            fullWidth
          />
          
          <Input
            name="email"
            label="Email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            fullWidth
          />
          
          <Select
            name="role"
            label="Role"
            value={formData.role}
            onChange={handleInputChange}
            options={['ADMIN', 'MENTOR']}
            fullWidth
          />
          
          {formData.role === 'MENTOR' && (
            <Select
              name="class"
              label="Assigned Class"
              value={formData.class}
              onChange={handleInputChange}
              options={batchConfig.batches}
              fullWidth
            />
          )}
          
          <div className="mt-6 flex justify-end space-x-3">
            <Button
              variant="secondary"
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Update User
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
            Are you sure you want to delete user{' '}
            <span className="font-semibold">{selectedUser?.name}</span>?
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
            <Button variant="danger" onClick={handleDeleteUser}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
};

export default UserManagement; 