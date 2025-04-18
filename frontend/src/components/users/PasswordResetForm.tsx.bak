import React, { useState } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { User } from '../../types';
import { resetPassword } from '../../api';

interface PasswordResetFormProps {
  user: User;
  onClose: () => void;
  isSelf?: boolean; // Whether the user is resetting their own password
  currentUserRole?: string; // Role of the current user performing the action
}

const PasswordResetForm: React.FC<PasswordResetFormProps> = ({ 
  user, 
  onClose,
  isSelf = false,
  currentUserRole = 'ADMIN'
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Determine if current password is required
  // It's required for self changes or when an admin's password is being changed
  const isCurrentPasswordRequired = isSelf || user.role === 'ADMIN';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    // Validate passwords
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    
    // Validate current password is provided when required
    if (isCurrentPasswordRequired && !currentPassword) {
      setError('Current password is required to change admin passwords');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await resetPassword(user.id, {
        currentPassword: isCurrentPasswordRequired ? currentPassword : undefined,
        newPassword
      });
      
      setSuccess('Password has been reset successfully');
      setNewPassword('');
      setConfirmPassword('');
      setCurrentPassword('');
      
      // Close the form after a delay if successful
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      setError(apiError.response?.data?.message || 'Failed to reset password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-semibold mb-4">
        {isSelf ? 'Change Your Password' : `Reset Password for ${user.name}`}
      </h2>
      
      {user.role === 'ADMIN' && !isSelf && (
        <div className="p-3 bg-yellow-100 text-yellow-800 rounded-md mb-4">
          <p className="font-medium">Warning: You are changing an admin account password</p>
          <p className="text-sm">For security, your current password is required to confirm this action.</p>
        </div>
      )}
      
      {isCurrentPasswordRequired && (
        <Input
          type="password"
          label={isSelf ? "Your Current Password" : "Your Admin Password"}
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
          fullWidth
        />
      )}
      
      <Input
        type="password"
        label="New Password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        required
        fullWidth
      />
      
      <Input
        type="password"
        label="Confirm New Password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
        fullWidth
      />
      
      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      {success && (
        <div className="p-3 bg-green-100 text-green-700 rounded-md">
          {success}
        </div>
      )}
      
      <div className="flex justify-end space-x-3 mt-6">
        <Button
          variant="secondary"
          onClick={onClose}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Resetting...' : 'Reset Password'}
        </Button>
      </div>
    </form>
  );
};

export default PasswordResetForm; 