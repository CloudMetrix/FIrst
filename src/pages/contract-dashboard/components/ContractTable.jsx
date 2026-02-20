import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import StatusBadge from './StatusBadge';
import ActionMenu from '../../../components/ui/ActionMenu';
import { formatCurrency, formatDate } from '../../../utils';
import { formatClientName } from '../../../utils/cn';

const ContractTable = ({ contracts, sortConfig, onSort, onDelete }) => {
  const navigate = useNavigate();

  const handleSort = (key) => {
    onSort(key);
  };

  const getSortIcon = (key) => {
    if (sortConfig?.key !== key) {
      return <Icon name="ChevronsUpDown" size={16} className="opacity-40" />;
    }
    return sortConfig?.direction === 'asc' ? (
      <Icon name="ChevronUp" size={16} />
    ) : (
      <Icon name="ChevronDown" size={16} />
    );
  };

  const handleContractClick = (contractId) => {
    navigate('/invoice-listing', { state: { contractId } });
  };

  return (
    <div className="bg-card rounded-lg shadow-elevation-2 overflow-hidden">
      <div className="overflow-x-auto scrollbar-custom">
        <table className="w-full min-w-[800px]">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="px-4 md:px-6 py-3 md:py-4 text-left">
                <button
                  onClick={() => handleSort('name')}
                  className="flex items-center space-x-2 text-xs md:text-sm font-semibold text-foreground hover:text-primary transition-base"
                >
                  <span>Contract Name</span>
                  {getSortIcon('name')}
                </button>
              </th>
              <th className="px-4 md:px-6 py-3 md:py-4 text-left">
                <button
                  onClick={() => handleSort('client')}
                  className="flex items-center space-x-2 text-xs md:text-sm font-semibold text-foreground hover:text-primary transition-base"
                >
                  <span>Client/Vendor</span>
                  {getSortIcon('client')}
                </button>
              </th>
              <th className="px-4 md:px-6 py-3 md:py-4 text-left">
                <button
                  onClick={() => handleSort('value')}
                  className="flex items-center space-x-2 text-xs md:text-sm font-semibold text-foreground hover:text-primary transition-base"
                >
                  <span>Value</span>
                  {getSortIcon('value')}
                </button>
              </th>
              <th className="px-4 md:px-6 py-3 md:py-4 text-left">
                <button
                  onClick={() => handleSort('startDate')}
                  className="flex items-center space-x-2 text-xs md:text-sm font-semibold text-foreground hover:text-primary transition-base"
                >
                  <span>Start Date</span>
                  {getSortIcon('startDate')}
                </button>
              </th>
              <th className="px-4 md:px-6 py-3 md:py-4 text-left">
                <button
                  onClick={() => handleSort('endDate')}
                  className="flex items-center space-x-2 text-xs md:text-sm font-semibold text-foreground hover:text-primary transition-base"
                >
                  <span>End Date</span>
                  {getSortIcon('endDate')}
                </button>
              </th>
              <th className="px-4 md:px-6 py-3 md:py-4 text-left">
                <button
                  onClick={() => handleSort('length')}
                  className="flex items-center space-x-2 text-xs md:text-sm font-semibold text-foreground hover:text-primary transition-base"
                >
                  <span>Length</span>
                  {getSortIcon('length')}
                </button>
              </th>
              <th className="px-4 md:px-6 py-3 md:py-4 text-left">
                <button
                  onClick={() => handleSort('providerType')}
                  className="flex items-center space-x-2 text-xs md:text-sm font-semibold text-foreground hover:text-primary transition-base"
                >
                  <span>Provider Type</span>
                  {getSortIcon('providerType')}
                </button>
              </th>
              <th className="px-4 md:px-6 py-3 md:py-4 text-left">
                <button
                  onClick={() => handleSort('status')}
                  className="flex items-center space-x-2 text-xs md:text-sm font-semibold text-foreground hover:text-primary transition-base"
                >
                  <span>Status</span>
                  {getSortIcon('status')}
                </button>
              </th>
              <th className="px-4 md:px-6 py-3 md:py-4 text-left">
                <span className="text-xs md:text-sm font-semibold text-foreground">Usage</span>
              </th>
              <th className="px-4 md:px-6 py-3 md:py-4 text-right">
                <span className="text-xs md:text-sm font-semibold text-foreground">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {contracts?.map((contract) => (
              <tr
                key={contract?.id}
                className="hover:bg-muted/30 transition-base"
              >
                <td className="px-4 md:px-6 py-3 md:py-4">
                  <button
                    onClick={() => handleContractClick(contract?.id)}
                    className="text-sm md:text-base font-medium text-primary hover:text-primary/80 transition-base text-left"
                  >
                    {contract?.name}
                  </button>
                </td>
                <td className="px-4 md:px-6 py-3 md:py-4">
                  <span className="text-sm md:text-base text-foreground">
                    {formatClientName(contract?.client)}
                  </span>
                </td>
                <td className="px-4 md:px-6 py-3 md:py-4">
                  <span className="text-sm md:text-base font-medium text-foreground data-text whitespace-nowrap">
                    {formatCurrency(contract?.value)}
                  </span>
                </td>
                <td className="px-4 md:px-6 py-3 md:py-4">
                  <span className="text-sm md:text-base text-text-secondary data-text whitespace-nowrap">
                    {formatDate(contract?.startDate)}
                  </span>
                </td>
                <td className="px-4 md:px-6 py-3 md:py-4">
                  <span className="text-sm md:text-base text-text-secondary data-text whitespace-nowrap">
                    {formatDate(contract?.endDate)}
                  </span>
                </td>
                <td className="px-4 md:px-6 py-3 md:py-4">
                  <span className="text-sm md:text-base text-foreground whitespace-nowrap">
                    {contract?.length}
                  </span>
                </td>
                <td className="px-4 md:px-6 py-3 md:py-4">
                  <span className="text-sm md:text-base text-foreground whitespace-nowrap">
                    {contract?.providerType}
                  </span>
                </td>
                <td className="px-4 md:px-6 py-3 md:py-4">
                  <StatusBadge status={contract?.status} />
                </td>
                <td className="px-4 md:px-6 py-3 md:py-4">
                  <div className="min-w-[180px]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-text-secondary">Invoiced</span>
                      <span className="text-xs font-medium text-foreground">
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
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-text-secondary">of {formatCurrency(contract?.value)}</span>
                      <span className="text-xs font-semibold text-primary">
                        {((contract?.totalInvoiced / contract?.value) * 100)?.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-4 md:px-6 py-3 md:py-4">
                  <div className="flex justify-end">
                    <ActionMenu
                      contractId={contract?.id}
                      onDelete={onDelete}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ContractTable;