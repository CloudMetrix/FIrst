import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../AppIcon';
import Button from './Button';

const ActionMenu = ({ contractId, onDelete }) => {
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEdit = () => {
    navigate('/edit-contract', { state: { contractId } });
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(contractId);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  return (
    <>
      <div className="flex items-center space-x-2">
        <button
          onClick={handleEdit}
          className="p-2 text-text-secondary hover:text-primary hover:bg-muted rounded-md transition-base"
          aria-label="Edit contract"
          title="Edit contract"
        >
          <Icon name="Edit" size={18} />
        </button>
        <button
          onClick={handleDeleteClick}
          className="p-2 text-text-secondary hover:text-error hover:bg-error/10 rounded-md transition-base"
          aria-label="Delete contract"
          title="Delete contract"
        >
          <Icon name="Trash2" size={18} />
        </button>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-background z-modal flex items-center justify-center p-4">
          <div className="bg-card rounded-lg shadow-elevation-4 p-8 max-w-md w-full">
            <div className="flex items-start space-x-4 mb-6">
              <div className="w-12 h-12 bg-error/10 rounded-full flex items-center justify-center flex-shrink-0">
                <Icon name="AlertTriangle" size={24} color="var(--color-error)" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Delete Contract
                </h3>
                <p className="text-text-secondary">
                  Are you sure you want to delete this contract? This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={handleCancelDelete}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
                loading={isDeleting}
              >
                Delete Contract
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ActionMenu;