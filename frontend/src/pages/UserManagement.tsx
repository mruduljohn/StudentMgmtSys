import React, { useState, useEffect } from 'react';
import { Trash2, UserPlus, Edit, Key } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { register, deleteUser, getAllUsers, updateUser } from '../api';
import { useAuthStore } from '../store/authStore';
import { User } from '../types';
import Select from '../components/ui/Select';
import { useStudentStore } from '../store/studentStore';
import PasswordResetForm from '../components/users/PasswordResetForm';
import MobileTable from '../components/ui/MobileTable';
import { useMediaQuery } from '../hooks/useMediaQuery';

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
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    name: '',
    role: 'ADMIN',
    class: ''
  });

  const [adminDeleteConfirmation, setAdminDeleteConfirmation] = useState('');
  const [adminDeleteConfirmText, setAdminDeleteConfirmText] = useState('');

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

    // Extra validation for admin user deletion
    if (selectedUser.role === 'ADMIN') {
      if (adminDeleteConfirmation !== adminDeleteConfirmText) {
        setError('Please type the confirmation text exactly to delete an admin user.');
        return;
      }
    }

    try {
      console.log('Deleting user with ID:', selectedUser.id);
      await deleteUser(selectedUser.id);
      setSuccess('User deleted successfully');
      setIsDeleteModalOpen(false);
      setAdminDeleteConfirmation('');
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

  const handleResetPassword = (user: User) => {
    setSelectedUser(user);
    setIsResetPasswordModalOpen(true);
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
        ) : isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-lg">Loading user data...</div>
          </div>
        ) : isMobile ? (
          <MobileTable
            columns={[
              { id: 'username', label: 'Username' },
              { id: 'name', label: 'Name' },
              { id: 'email', label: 'Email' },
              { id: 'role', label: 'Role' },
              { id: 'class', label: 'Assigned Class' }
            ]}
            data={users.map(user => ({
              ...user,
              role: user.role === 'ADMIN' ? 'Admin' : 'Mentor',
              class: user.class || '-'
            }))}
            priorityFields={['name', 'username', 'role']}
            onRowClick={(user) => handleEdit(user as User)}
          />
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
                          className="flex items-center"
                        >
                          <Edit size={14} className="mr-1" />
                          Edit
                        </Button>
                        
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleResetPassword(user)}
                          className="flex items-center"
                        >
                          <Key size={14} className="mr-1" />
                          Reset Password
                        </Button>
                        
                        {/* Don't allow deleting yourself */}
                        {user.id !== currentUser?.id && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user);
                              setIsDeleteModalOpen(true);
                            }}
                            className="flex items-center"
                          >
                            <Trash2 size={14} className="mr-1" />
                            Delete
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
        <form onSubmit={handleAddUser} className="space-y-4">
          <Input
            label="Username"
            name="username"
            value={formData.username}
            onChange={handleInputChange}
            required
            fullWidth
          />
          
          <Input
            label="Name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            fullWidth
          />
          
          <Input
            type="email"
            label="Email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            fullWidth
          />
          
          <Input
            type="password"
            label="Password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            required
            fullWidth
          />
          
          <Select
            label="Role"
            name="role"
            value={formData.role}
            onChange={handleInputChange}
            options={[
              { value: 'ADMIN', label: 'Administrator' },
              { value: 'MENTOR', label: 'Mentor' }
            ]}
            fullWidth
          />
          
          {formData.role === 'MENTOR' && (
            <Select
              label="Assigned Class"
              name="class"
              value={formData.class}
              onChange={handleInputChange}
              options={batchConfig.batches.map(batch => ({
                value: batch,
                label: batch
              }))}
              fullWidth
            />
          )}
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
            >
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
        <form onSubmit={handleEditUser} className="space-y-4">
          <Input
            label="Name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            fullWidth
          />
          
          <Input
            type="email"
            label="Email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            fullWidth
          />
          
          <Select
            label="Role"
            name="role"
            value={formData.role}
            onChange={handleInputChange}
            options={[
              { value: 'ADMIN', label: 'Administrator' },
              { value: 'MENTOR', label: 'Mentor' }
            ]}
            fullWidth
          />
          
          {formData.role === 'MENTOR' && (
            <Select
              label="Assigned Class"
              name="class"
              value={formData.class}
              onChange={handleInputChange}
              options={batchConfig.batches.map(batch => ({
                value: batch,
                label: batch
              }))}
              fullWidth
            />
          )}
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
            >
              Update User
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete User Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete User"
      >
        <div className="p-4">
          <p className="text-center text-red-600 my-2">
            Are you sure you want to delete the user <strong>{selectedUser?.name}</strong>?
            This action cannot be undone.
          </p>
          
          {selectedUser?.role === 'ADMIN' && (
            <>
              <div className="bg-yellow-100 text-yellow-800 p-3 rounded-md mb-4">
                <p className="font-medium">Warning: You are about to delete an ADMIN account!</p>
                <p className="text-sm">Deleting an admin account can have serious consequences for system access and management.</p>
              </div>
              
              <div className="my-4">
                <p className="text-sm text-gray-700 mb-2">
                  To confirm deletion of this admin account, please type: 
                  <span className="font-bold text-red-600"> {selectedUser?.role === 'ADMIN' ? (adminDeleteConfirmText = `DELETE-${selectedUser.username}`) : ''}</span>
                </p>
                <input
                  type="text"
                  value={adminDeleteConfirmation}
                  onChange={(e) => setAdminDeleteConfirmation(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Type the confirmation text"
                />
              </div>
            </>
          )}
          
          <div className="flex justify-end space-x-3">
            <Button
              variant="secondary"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setAdminDeleteConfirmation('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteUser}
              disabled={selectedUser?.role === 'ADMIN' && adminDeleteConfirmation !== adminDeleteConfirmText}
            >
              Delete User
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        isOpen={isResetPasswordModalOpen}
        onClose={() => setIsResetPasswordModalOpen(false)}
        title="Reset Password"
      >
        {selectedUser && (
          <PasswordResetForm
            user={selectedUser}
            onClose={() => setIsResetPasswordModalOpen(false)}
            isSelf={selectedUser.id === currentUser?.id}
            currentUserRole={currentUser?.role}
          />
        )}
      </Modal>
    </Layout>
  );
};

export default UserManagement; 