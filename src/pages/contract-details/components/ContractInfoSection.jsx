import React from 'react';
import Icon from '../../../components/AppIcon';

const ContractInfoSection = ({ contract }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    })?.format(amount);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date?.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    });
  };

  const calculateDaysUntilExpiration = () => {
    const today = new Date();
    const endDate = new Date(contract.endDate);
    const diffTime = endDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysRemaining = calculateDaysUntilExpiration();
  const isExpiringSoon = daysRemaining > 0 && daysRemaining <= 30;
  const isExpired = daysRemaining < 0;

  return (
    <div className="bg-card rounded-lg shadow-elevation-2 p-4 md:p-6 lg:p-8">
      <h2 className="text-xl md:text-2xl lg:text-3xl font-semibold text-foreground mb-4 md:mb-6">
        Contract Information
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 lg:gap-8">
        <div className="space-y-4 md:space-y-5 lg:space-y-6">
          <div>
            <label className="text-sm text-text-secondary mb-1 block">Contract Name</label>
            <p className="text-base md:text-lg text-foreground font-medium">{contract?.name}</p>
          </div>

          <div>
            <label className="text-sm text-text-secondary mb-1 block">Client/Vendor</label>
            <p className="text-base md:text-lg text-foreground font-medium">{contract?.vendor}</p>
          </div>

          <div>
            <label className="text-sm text-text-secondary mb-1 block">Contract Value</label>
            <p className="text-xl md:text-2xl lg:text-3xl text-primary font-semibold">
              {formatCurrency(contract?.value)}
            </p>
          </div>

          <div>
            <label className="text-sm text-text-secondary mb-1 block">Remaining Amount</label>
            <p className="text-lg md:text-xl lg:text-2xl text-success font-semibold">
              {formatCurrency(contract?.remainingAmount)}
            </p>
          </div>
        </div>

        <div className="space-y-4 md:space-y-5 lg:space-y-6">
          <div>
            <label className="text-sm text-text-secondary mb-1 block">Start Date</label>
            <div className="flex items-center space-x-2">
              <Icon name="Calendar" size={18} color="var(--color-text-secondary)" />
              <p className="text-base md:text-lg text-foreground font-medium">
                {formatDate(contract?.startDate)}
              </p>
            </div>
          </div>

          <div>
            <label className="text-sm text-text-secondary mb-1 block">End Date</label>
            <div className="flex items-center space-x-2">
              <Icon name="Calendar" size={18} color="var(--color-text-secondary)" />
              <p className="text-base md:text-lg text-foreground font-medium">
                {formatDate(contract?.endDate)}
              </p>
            </div>
          </div>

          <div>
            <label className="text-sm text-text-secondary mb-1 block">Contract Length</label>
            <p className="text-base md:text-lg text-foreground font-medium">{contract?.length}</p>
          </div>

          <div>
            <label className="text-sm text-text-secondary mb-1 block">Status</label>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium ${
                contract?.status === 'Active' ?'bg-success/10 text-success'
                  : contract?.status === 'Expired' ?'bg-muted text-text-secondary' :'bg-warning/10 text-warning'
              }`}
            >
              {contract?.status}
            </span>
          </div>

          {!isExpired && (
            <div>
              <label className="text-sm text-text-secondary mb-1 block">Days Until Expiration</label>
              <div className="flex items-center space-x-2">
                <Icon
                  name="Clock"
                  size={18}
                  color={isExpiringSoon ? 'var(--color-warning)' : 'var(--color-text-secondary)'}
                />
                <p
                  className={`text-base md:text-lg font-semibold ${
                    isExpiringSoon ? 'text-warning' : 'text-foreground'
                  }`}
                >
                  {daysRemaining} days
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      {isExpiringSoon && (
        <div className="mt-6 p-4 bg-warning/10 border border-warning/20 rounded-lg">
          <div className="flex items-start space-x-3">
            <Icon name="AlertTriangle" size={20} color="var(--color-warning)" className="flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-base font-semibold text-warning mb-1">Renewal Required Soon</h3>
              <p className="text-sm text-text-secondary">
                This contract expires in {daysRemaining} days. Please initiate the renewal process to avoid service interruption.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractInfoSection;