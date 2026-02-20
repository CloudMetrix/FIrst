import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { awsIntegrationService } from '../../../services/awsIntegrationService';

const RenewalNotificationPopup = ({ isOpen, onClose, renewalContracts, onViewRenewal }) => {
  const navigate = useNavigate();
  const [awsIntegrations, setAwsIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadAwsIntegrations();
    }
  }, [isOpen]);

  const loadAwsIntegrations = async () => {
    try {
      const integrations = await awsIntegrationService?.getAll();
      setAwsIntegrations(integrations?.filter(i => i?.permissionsMarketplace && i?.connectionStatus === 'connected') || []);
    } catch (err) {
      console.error('Failed to load AWS integrations:', err?.message);
    } finally {
      setLoading(false);
    }
  };

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

  const hasAwsOptimizationOpportunity = (contract) => {
    const isMarketplaceContract = contract?.providerType === 'SaaS/Marketplace';
    const hasAwsIntegration = awsIntegrations?.length > 0;
    return isMarketplaceContract && hasAwsIntegration;
  };

  const optimizableContracts = renewalContracts?.filter(hasAwsOptimizationOpportunity) || [];
  const regularContracts = renewalContracts?.filter(c => !hasAwsOptimizationOpportunity(c)) || [];

  const handleViewOptimization = () => {
    navigate('/aws-marketplace-optimization');
    onClose();
  };

  const handleViewRenewalManagement = () => {
    navigate('/contract-renewal-management');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Popup */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-card rounded-lg shadow-elevation-4 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-start justify-between p-6 border-b border-border">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-warning/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Icon name="Bell" size={24} color="var(--color-warning)" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Contract Renewal Alert</h2>
                <p className="text-sm text-text-secondary mt-1">
                  {renewalContracts?.length} contract{renewalContracts?.length > 1 ? 's' : ''} expiring within 60 days
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-muted transition-base"
            >
              <Icon name="X" size={20} className="text-text-secondary" />
            </button>
          </div>
          
          {/* Content */}
          <div className="p-6 space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <>
                {/* AWS Optimization Opportunities */}
                {optimizableContracts?.length > 0 && (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                    <div className="flex items-start space-x-3 mb-4">
                      <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <Icon name="Zap" size={20} color="var(--color-primary)" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-foreground mb-1">
                          AWS Marketplace Optimization Available
                        </h3>
                        <p className="text-sm text-text-secondary">
                          {optimizableContracts?.length} marketplace contract{optimizableContracts?.length > 1 ? 's' : ''} can be optimized using your AWS contract
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {optimizableContracts?.slice(0, 2)?.map((contract) => {
                        const daysLeft = getDaysUntilExpiration(contract?.endDate);
                        return (
                          <div
                            key={contract?.id}
                            className="bg-card rounded-md p-3 flex items-center justify-between"
                          >
                            <div className="flex-1 min-w-0 mr-4">
                              <p className="text-sm font-medium text-foreground truncate">
                                {contract?.name}
                              </p>
                              <p className="text-xs text-text-secondary mt-1">
                                Expires {formatDate(contract?.endDate)} ({daysLeft} days)
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Icon name="TrendingDown" size={16} className="text-success" />
                              <span className="text-xs font-medium text-success">Savings Available</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {optimizableContracts?.length > 2 && (
                      <p className="text-xs text-text-secondary mt-2">
                        +{optimizableContracts?.length - 2} more optimization{optimizableContracts?.length - 2 > 1 ? 's' : ''}
                      </p>
                    )}
                    
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full mt-4"
                      onClick={handleViewOptimization}
                    >
                      <Icon name="ArrowRight" size={16} className="mr-2" />
                      View AWS Marketplace Optimization
                    </Button>
                  </div>
                )}
                
                {/* Regular Renewal Contracts */}
                {regularContracts?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-3">
                      Contracts Requiring Renewal
                    </h3>
                    <div className="space-y-2">
                      {regularContracts?.slice(0, 3)?.map((contract) => {
                        const daysLeft = getDaysUntilExpiration(contract?.endDate);
                        const isUrgent = daysLeft <= 30;
                        return (
                          <div
                            key={contract?.id}
                            className={`rounded-md p-3 border ${
                              isUrgent ? 'bg-destructive/5 border-destructive/20' : 'bg-muted border-border'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0 mr-4">
                                <p className="text-sm font-medium text-foreground truncate">
                                  {contract?.name}
                                </p>
                                <p className="text-xs text-text-secondary mt-1">
                                  {contract?.client} • Expires {formatDate(contract?.endDate)}
                                </p>
                              </div>
                              <div className="flex items-center space-x-2">
                                {isUrgent && (
                                  <Icon name="AlertCircle" size={16} className="text-destructive" />
                                )}
                                <span className={`text-xs font-medium ${
                                  isUrgent ? 'text-destructive' : 'text-warning'
                                }`}>
                                  {daysLeft} days
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {regularContracts?.length > 3 && (
                      <p className="text-xs text-text-secondary mt-2">
                        +{regularContracts?.length - 3} more contract{regularContracts?.length - 3 > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
          
          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-border">
            <Button
              variant="outline"
              onClick={onClose}
            >
              Dismiss
            </Button>
            <Button
              onClick={handleViewRenewalManagement}
            >
              Manage All Renewals
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default RenewalNotificationPopup;