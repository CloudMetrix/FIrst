import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const OptimizationCard = ({ opportunity, rank, onViewContract }) => {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    })?.format(value);
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

  const getMarketplaceUrl = () => {
    const product = opportunity?.awsProduct;
    
    // If product has a productId, construct direct product URL
    if (product?.productId) {
      return `https://aws.amazon.com/marketplace/pp/${product?.productId}`;
    }
    
    // If product has metadata with URL
    if (product?.metadata?.marketplaceUrl) {
      return product?.metadata?.marketplaceUrl;
    }
    
    // Otherwise, create a search URL with the product name
    if (product?.productName) {
      const searchQuery = encodeURIComponent(product?.productName);
      return `https://aws.amazon.com/marketplace/search/results?searchTerms=${searchQuery}`;
    }
    
    // Fallback to general marketplace
    return 'https://aws.amazon.com/marketplace';
  };

  const daysLeft = getDaysUntilExpiration(opportunity?.contract?.endDate);

  return (
    <div className="bg-card rounded-lg border border-border p-6 hover:shadow-elevation-2 transition-base">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-start gap-4 flex-1">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-primary">#{rank}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-foreground mb-1">
              {opportunity?.contract?.name}
            </h3>
            <p className="text-sm text-text-secondary mb-2">
              {opportunity?.contract?.client}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-warning/10 text-warning border border-warning/20">
                <Icon name="Clock" size={12} className="mr-1" />
                Expires in {daysLeft} days
              </span>
              {opportunity?.hasDirectMatch && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success/10 text-success border border-success/20">
                  <Icon name="CheckCircle" size={12} className="mr-1" />
                  Direct AWS Match Found
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-text-secondary mb-1">Potential Savings</p>
          <p className="text-2xl font-bold text-success">
            {formatCurrency(opportunity?.annualSavings)}
          </p>
          <p className="text-xs text-success font-medium">
            {opportunity?.savingsPercentage?.toFixed(1)}% reduction
          </p>
        </div>
      </div>

      {/* Cost Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Current Contract */}
        <div className="bg-muted rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Icon name="FileText" size={16} className="text-text-secondary" />
            <h4 className="text-sm font-semibold text-foreground">Current Contract</h4>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-text-secondary">Monthly Cost</span>
              <span className="text-sm font-semibold text-foreground">
                {formatCurrency(opportunity?.currentMonthlyCost)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-text-secondary">Annual Cost</span>
              <span className="text-sm font-semibold text-foreground">
                {formatCurrency(opportunity?.currentMonthlyCost * 12)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-text-secondary">Expiration</span>
              <span className="text-sm font-medium text-foreground">
                {formatDate(opportunity?.contract?.endDate)}
              </span>
            </div>
          </div>
        </div>

        {/* AWS Marketplace Alternative */}
        <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
          <div className="flex items-center gap-2 mb-3">
            <Icon name="Cloud" size={16} className="text-primary" />
            <h4 className="text-sm font-semibold text-foreground">AWS Marketplace</h4>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-text-secondary">Monthly Cost</span>
              <span className="text-sm font-semibold text-success">
                {formatCurrency(opportunity?.awsMonthlyCost)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-text-secondary">Annual Cost</span>
              <span className="text-sm font-semibold text-success">
                {formatCurrency(opportunity?.awsMonthlyCost * 12)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-text-secondary">Product</span>
              <span className="text-sm font-medium text-foreground truncate max-w-[150px]">
                {opportunity?.awsProduct?.productName}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Savings Breakdown */}
      <div className="bg-success/5 rounded-lg p-4 mb-4 border border-success/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon name="TrendingDown" size={20} className="text-success" />
            <div>
              <p className="text-sm font-semibold text-foreground">Monthly Savings</p>
              <p className="text-xs text-text-secondary">By switching to AWS Marketplace</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-success">
              {formatCurrency(opportunity?.monthlySavings)}
            </p>
            <p className="text-xs text-text-secondary">per month</p>
          </div>
        </div>
      </div>

      {/* Implementation Benefits */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-foreground mb-3">Implementation Benefits</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="flex items-start gap-2">
            <Icon name="CheckCircle" size={16} className="text-success mt-0.5" />
            <span className="text-xs text-text-secondary">Consolidated billing with AWS</span>
          </div>
          <div className="flex items-start gap-2">
            <Icon name="CheckCircle" size={16} className="text-success mt-0.5" />
            <span className="text-xs text-text-secondary">Better utilization of AWS contract</span>
          </div>
          <div className="flex items-start gap-2">
            <Icon name="CheckCircle" size={16} className="text-success mt-0.5" />
            <span className="text-xs text-text-secondary">Simplified vendor management</span>
          </div>
          <div className="flex items-start gap-2">
            <Icon name="CheckCircle" size={16} className="text-success mt-0.5" />
            <span className="text-xs text-text-secondary">Potential volume discounts</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant="default"
          onClick={onViewContract}
          className="flex-1"
        >
          <Icon name="Eye" size={16} className="mr-2" />
          View Contract Details
        </Button>
        <Button
          variant="outline"
          onClick={() => window.open(getMarketplaceUrl(), '_blank')}
          className="flex-1"
        >
          <Icon name="ExternalLink" size={16} className="mr-2" />
          Explore AWS Marketplace
        </Button>
      </div>
    </div>
  );
};

export default OptimizationCard;