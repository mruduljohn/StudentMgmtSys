import React, { useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import Input from './Input';

interface PasswordConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
}

const PasswordConfirmModal: React.FC<PasswordConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Please type CONFIRMDELETE to confirm this action.',
}) => {
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState('');
  const CONFIRMATION_TEXT = 'CONFIRMDELETE';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (confirmText === CONFIRMATION_TEXT) {
      setConfirmText('');
      onConfirm();
      onClose();
    } else {
      setError(`Please type ${CONFIRMATION_TEXT} exactly to confirm.`);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <form onSubmit={handleSubmit}>
        <p className="mb-4 text-gray-600">{message}</p>
        <p className="mb-4 font-medium text-red-600">Type CONFIRMDELETE to proceed</p>
        
        <Input
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder="CONFIRMDELETE"
          error={error}
          fullWidth
          autoFocus
        />
        
        <div className="mt-6 flex justify-end space-x-3">
          <Button
            variant="secondary"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            type="submit"
            disabled={!confirmText}
          >
            Confirm Delete
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default PasswordConfirmModal;

 