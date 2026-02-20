import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const RenewalCard = ({ contract, onViewDetails, onViewOptimization }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date?.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    })?.format(value);
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'high':
        return 'text-destructive bg-destructive/10 border-destructive/20';
      case 'medium':
        return 'text-warning bg-warning/10 border-warning/20';
      default:
        return 'text-text-secondary bg-muted border-border';
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      not_started: { label: 'Not Started', color: 'bg-muted text-text-secondary' },
      in_progress: { label: 'In Progress', color: 'bg-primary/10 text-primary' },
      completed: { label: 'Completed', color: 'bg-success/10 text-success' },
      declined: { label: 'Declined', color: 'bg-destructive/10 text-destructive' },
    };
    return badges?.[status] || badges?.not_started;
  };

  const statusBadge = getStatusBadge(contract?.renewalStatus);

  return (
    <div className={`bg-card rounded-lg border-2 p-4 md:p-6 transition-base hover:shadow-elevation-2 ${
      contract?.urgency === 'high' ? 'border-destructive/20' : 'border-border'
    }`}>
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Left Section - Contract Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-3 mb-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
              contract?.urgency === 'high' ? 'bg-destructive/10' : 'bg-warning/10'
            }`}>
              <Icon 
                name={contract?.urgency === 'high' ? 'AlertCircle' : 'Clock'} 
                size={20} 
                color={contract?.urgency === 'high' ? 'var(--color-destructive)' : 'var(--color-warning)'}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base md:text-lg font-semibold text-foreground mb-1 truncate">
                {contract?.name}
              </h3>
              <p className="text-sm text-text-secondary">
                {contract?.client}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            <div>
              <p className="text-xs text-text-secondary mb-1">Expiration Date</p>
              <p className="text-sm font-medium text-foreground">{formatDate(contract?.endDate)}</p>
            </div>
            <div>
              <p className="text-xs text-text-secondary mb-1">Days Remaining</p>
              <p className={`text-sm font-semibold ${
                contract?.urgency === 'high' ? 'text-destructive' : 'text-warning'
              }`}>
                {contract?.daysLeft} days
              </p>
            </div>
            <div>
              <p className="text-xs text-text-secondary mb-1">Contract Value</p>
              <p className="text-sm font-medium text-foreground">{formatCurrency(contract?.value)}</p>
            </div>
            <div>
              <p className="text-xs text-text-secondary mb-1">Provider Type</p>
              <p className="text-sm font-medium text-foreground truncate">{contract?.providerType}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
              getUrgencyColor(contract?.urgency)
            }`}>
              {contract?.urgency === 'high' ? 'High Priority' : 'Medium Priority'}
            </span>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
              statusBadge?.color
            }`}>
              {statusBadge?.label}
            </span>
            {contract?.hasAwsOptimization && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                <Icon name="Zap" size={12} className="mr-1" />
                AWS Optimization Available
              </span>
            )}
          </div>
        </div>

        {/* Right Section - Actions */}
        <div className="flex flex-col sm:flex-row lg:flex-col gap-2 lg:w-48">
          <Button
            variant="default"
            size="sm"
            onClick={onViewDetails}
            className="w-full"
          >
            <Icon name="Eye" size={16} className="mr-2" />
            View Details
          </Button>
          {contract?.hasAwsOptimization && onViewOptimization && (
            <Button
              variant="outline"
              size="sm"
              onClick={onViewOptimization}
              className="w-full"
            >
              <Icon name="TrendingDown" size={16} className="mr-2" />
              View Savings
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RenewalCard;