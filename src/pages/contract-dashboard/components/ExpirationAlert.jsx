import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ExpirationAlert = ({ expiringContracts, onDismiss, onViewContract }) => {
  if (!expiringContracts || expiringContracts?.length === 0) {
    return null;
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date?.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDaysUntilExpiration = (endDate) => {
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 md:p-6 mb-6">
      <div className="flex items-start space-x-4">
        <div className="w-10 h-10 md:w-12 md:h-12 bg-warning/20 rounded-full flex items-center justify-center flex-shrink-0">
          <Icon name="AlertTriangle" size={24} color="var(--color-warning)" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-base md:text-lg font-semibold text-foreground mb-2">
            Contracts Expiring Soon
          </h3>
          <p className="text-sm md:text-base text-text-secondary mb-4">
            {expiringContracts?.length} contract{expiringContracts?.length > 1 ? 's' : ''} will
            expire within the next 30 days
          </p>

          <div className="space-y-3">
            {expiringContracts?.slice(0, 3)?.map((contract) => {
              const daysLeft = getDaysUntilExpiration(contract?.endDate);
              return (
                <div
                  key={contract?.id}
                  className="flex items-center justify-between bg-card rounded-md p-3 md:p-4"
                >
                  <div className="flex-1 min-w-0 mr-4">
                    <button
                      onClick={() => onViewContract(contract?.id)}
                      className="text-sm md:text-base font-medium text-primary hover:text-primary/80 transition-base text-left truncate block w-full"
                    >
                      {contract?.name}
                    </button>
                    <p className="text-xs md:text-sm text-text-secondary mt-1">
                      Expires on {formatDate(contract?.endDate)} ({daysLeft} days left)
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewContract(contract?.id)}
                  >
                    View
                  </Button>
                </div>
              );
            })}
          </div>

          {expiringContracts?.length > 3 && (
            <p className="text-sm text-text-secondary mt-3">
              +{expiringContracts?.length - 3} more contract{expiringContracts?.length - 3 > 1 ? 's' : ''}
            </p>
          )}
        </div>

        <button
          onClick={onDismiss}
          className="p-2 text-text-secondary hover:text-foreground hover:bg-muted rounded-md transition-base flex-shrink-0"
          aria-label="Dismiss alert"
        >
          <Icon name="X" size={20} />
        </button>
      </div>
    </div>
  );
};

export default ExpirationAlert;