import React from 'react';
import Button from '../../../components/ui/Button';

const FormActions = ({ onSave, onCancel, isSaving, isValid }) => {
  return (
    <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-8 pt-6 border-t border-border">
      <Button
        variant="outline"
        onClick={onCancel}
        disabled={isSaving}
        className="w-full sm:w-auto"
      >
        Cancel
      </Button>
      <Button
        onClick={onSave}
        disabled={!isValid || isSaving}
        className="w-full sm:w-auto"
      >
        {isSaving ? (
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Uploading...</span>
          </div>
        ) : (
          'Upload Invoice'
        )}
      </Button>
    </div>
  );
};

export default FormActions;