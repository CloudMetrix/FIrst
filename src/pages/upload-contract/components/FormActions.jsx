import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../components/ui/Button';

const FormActions = ({ onSave, isSaving, isValid }) => {
  const navigate = useNavigate();

  const handleCancel = () => {
    navigate('/contract-dashboard');
  };

  return (
    <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end space-y-3 space-y-reverse sm:space-y-0 sm:space-x-3 pt-6 border-t border-border">
      <Button
        variant="outline"
        onClick={handleCancel}
        disabled={isSaving}
        fullWidth
        className="sm:w-auto"
      >
        Cancel
      </Button>
      
      <Button
        variant="default"
        onClick={onSave}
        loading={isSaving}
        disabled={!isValid}
        iconName="Save"
        iconPosition="left"
        fullWidth
        className="sm:w-auto"
      >
        Save Contract
      </Button>
    </div>
  );
};

export default FormActions;