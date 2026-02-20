import React from 'react';
import Icon from '../../../components/AppIcon';
import StatusBadge from '../../contract-dashboard/components/StatusBadge';
import { formatClientName } from '../../../utils/cn';

const ContractContext = ({ contract }) => {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    })?.format(value);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date?.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateTimeRemaining = (endDate) => {
    if (!endDate) return { text: 'N/A', color: 'text-text-secondary' };
    
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: 'Expired', color: 'text-red-600' };
    } else if (diffDays === 0) {
      return { text: 'Expires Today', color: 'text-red-600' };
    } else if (diffDays <= 30) {
      return { text: `${diffDays} days remaining`, color: 'text-orange-600' };
    } else if (diffDays <= 90) {
      return { text: `${diffDays} days remaining`, color: 'text-yellow-600' };
    } else if (diffDays < 365) {
      return { text: `${diffDays} days remaining`, color: 'text-green-600' };
    } else {
      const years = Math.floor(diffDays / 365);
      const remainingDays = diffDays % 365;
      const months = Math.floor(remainingDays / 30);
      if (years > 0 && months > 0) {
        return { text: `${years}y ${months}m remaining`, color: 'text-green-600' };
      } else if (years > 0) {
        return { text: `${years} year${years > 1 ? 's' : ''} remaining`, color: 'text-green-600' };
      } else {
        return { text: `${months} months remaining`, color: 'text-green-600' };
      }
    }
  };

  const timeRemaining = calculateTimeRemaining(contract?.endDate);

  return (
    <div className="bg-card rounded-lg shadow-elevation-2 p-4 md:p-6 mb-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary/10 rounded-md flex items-center justify-center">
            <Icon name="FileText" size={20} color="var(--color-primary)" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">{contract?.name}</h2>
            <p className="text-sm text-text-secondary">{formatClientName(contract?.vendor || contract?.client)}</p>
          </div>
        </div>
        <StatusBadge status={contract?.status} />
      </div>
      
      {/* Contract Details Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-border">
        {/* Start Date */}
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-blue-50 rounded-md flex items-center justify-center flex-shrink-0">
            <Icon name="Calendar" size={16} color="#3b82f6" />
          </div>
          <div>
            <p className="text-xs text-text-secondary mb-0.5">Start Date</p>
            <p className="text-sm font-semibold text-foreground">{formatDate(contract?.startDate)}</p>
          </div>
        </div>

        {/* End Date */}
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-purple-50 rounded-md flex items-center justify-center flex-shrink-0">
            <Icon name="CalendarCheck" size={16} color="#9333ea" />
          </div>
          <div>
            <p className="text-xs text-text-secondary mb-0.5">End Date</p>
            <p className="text-sm font-semibold text-foreground">{formatDate(contract?.endDate)}</p>
          </div>
        </div>

        {/* Time Remaining */}
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-orange-50 rounded-md flex items-center justify-center flex-shrink-0">
            <Icon name="Clock" size={16} color="#f97316" />
          </div>
          <div>
            <p className="text-xs text-text-secondary mb-0.5">Time Until Renewal</p>
            <p className={`text-sm font-semibold ${timeRemaining?.color}`}>{timeRemaining?.text}</p>
          </div>
        </div>

        {/* Provider Type */}
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-green-50 rounded-md flex items-center justify-center flex-shrink-0">
            <Icon name="Building2" size={16} color="#22c55e" />
          </div>
          <div>
            <p className="text-xs text-text-secondary mb-0.5">Provider Type</p>
            <p className="text-sm font-semibold text-foreground">{contract?.providerType || 'N/A'}</p>
          </div>
        </div>

        {/* Contract Length */}
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-indigo-50 rounded-md flex items-center justify-center flex-shrink-0">
            <Icon name="Timer" size={16} color="#6366f1" />
          </div>
          <div>
            <p className="text-xs text-text-secondary mb-0.5">Contract Length</p>
            <p className="text-sm font-semibold text-foreground">{contract?.length || 'N/A'}</p>
          </div>
        </div>

        {/* Total Contract Value */}
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-emerald-50 rounded-md flex items-center justify-center flex-shrink-0">
            <Icon name="DollarSign" size={16} color="#10b981" />
          </div>
          <div>
            <p className="text-xs text-text-secondary mb-0.5">Total Contract Value</p>
            <p className="text-sm font-semibold text-foreground">{formatCurrency(contract?.value)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractContext;