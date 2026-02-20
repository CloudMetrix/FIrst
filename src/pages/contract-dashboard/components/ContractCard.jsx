import React from 'react';
import { useNavigate } from 'react-router-dom';

import StatusBadge from './StatusBadge';
import ActionMenu from '../../../components/ui/ActionMenu';
import { formatClientName } from '../../../utils/cn';

const ContractCard = ({ contract, onDelete }) => {
  const navigate = useNavigate();

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    })?.format(value);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date?.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    });
  };

  const handleContractClick = () => {
    navigate('/contract-details', { state: { contractId: contract?.id } });
  };

  return (
    <div className="bg-card rounded-lg shadow-elevation-2 p-4 md:p-6 hover:shadow-elevation-3 transition-base">
      <div className="flex items-start justify-between mb-4">
        <button
          onClick={handleContractClick}
          className="text-base md:text-lg font-semibold text-primary hover:text-primary/80 transition-base text-left flex-1"
        >
          {contract?.name}
        </button>
        <ActionMenu contractId={contract?.id} onDelete={onDelete} />
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-secondary">Client/Vendor</span>
          <span className="text-sm md:text-base font-medium text-foreground">
            {formatClientName(contract?.client)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-text-secondary">Value</span>
          <span className="text-sm md:text-base font-semibold text-foreground data-text">
            {formatCurrency(contract?.value)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-text-secondary">Start Date</span>
          <span className="text-sm text-foreground data-text">
            {formatDate(contract?.startDate)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-text-secondary">End Date</span>
          <span className="text-sm text-foreground data-text">
            {formatDate(contract?.endDate)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-text-secondary">Length</span>
          <span className="text-sm text-foreground">{contract?.length}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-text-secondary">Provider Type</span>
          <span className="text-sm text-foreground">{contract?.providerType}</span>
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-sm text-text-secondary">Status</span>
          <StatusBadge status={contract?.status} />
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-text-secondary">Contract Value</span>
            <span className="text-base font-semibold text-foreground data-text">
              {formatCurrency(contract?.value)}
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">Usage</span>
              <span className="text-sm font-medium text-foreground">
                {formatCurrency(contract?.totalInvoiced || 0)}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{
                  width: `${Math.min((contract?.totalInvoiced / contract?.value) * 100, 100)}%`
                }}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-secondary">
                {((contract?.totalInvoiced / contract?.value) * 100)?.toFixed(1)}% of contract value
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractCard;