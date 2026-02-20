import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../components/ui/Button';
import ActionMenu from '../../../components/ui/ActionMenu';

const ActionButtons = ({ contractId, onDelete }) => {
  const navigate = useNavigate();

  const handleEdit = () => {
    navigate('/edit-contract', { state: { contractId } });
  };

  const handleBackToDashboard = () => {
    navigate('/contract-dashboard');
  };

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 md:gap-4">
      <Button
        variant="outline"
        iconName="ArrowLeft"
        iconPosition="left"
        onClick={handleBackToDashboard}
        className="w-full sm:w-auto"
      >
        Back to Contracts
      </Button>

      <div className="flex items-center gap-3">
        <Button
          variant="default"
          iconName="Edit"
          iconPosition="left"
          onClick={handleEdit}
          className="flex-1 sm:flex-none"
        >
          Edit Contract
        </Button>
        <div className="hidden sm:block">
          <ActionMenu contractId={contractId} onDelete={onDelete} />
        </div>
      </div>
    </div>
  );
};

export default ActionButtons;