import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const RecommendationCard = ({ recommendation, onViewContract }) => {
  const [expandedProduct, setExpandedProduct] = useState(null);

  const formatCurrency = (value) => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    })?.format(value);
  };

  const getMatchScoreColor = (score) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-text-secondary';
  };

  const getMatchScoreBg = (score) => {
    if (score >= 80) return 'bg-success/10 border-success/20';
    if (score >= 60) return 'bg-warning/10 border-warning/20';
    return 'bg-muted border-border';
  };

  const getAvailabilityBadge = (availability) => {
    switch (availability) {
      case 'available':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success/10 text-success border border-success/20">
            <Icon name="CheckCircle" size={12} className="mr-1" />
            Available
          </span>
        );
      case 'unavailable':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-destructive/10 text-destructive border border-destructive/20">
            <Icon name="XCircle" size={12} className="mr-1" />
            Unavailable
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-muted text-text-secondary border border-border">
            <Icon name="HelpCircle" size={12} className="mr-1" />
            Unknown
          </span>
        );
    }
  };

  const toggleProductDetails = (productId) => {
    setExpandedProduct(expandedProduct === productId ? null : productId);
  };

  const handleMarketplaceRedirect = (marketplaceUrl) => {
    if (marketplaceUrl) {
      window.open(marketplaceUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Check if this is the new response format with marketplaceRedirect
  const hasMarketplaceRedirect = recommendation?.recommendations?.[0]?.marketplaceRedirect;
  const marketplaceData = hasMarketplaceRedirect ? recommendation?.recommendations?.[0] : null;

  return (
    <div className="bg-card rounded-lg border border-border p-6 hover:shadow-elevation-2 transition-base">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Icon name="Search" size={18} className="text-primary" />
            <h3 className="text-lg font-semibold text-foreground">
              {recommendation?.contract?.name}
            </h3>
          </div>
          <p className="text-sm text-text-secondary mb-2">
            Client: {recommendation?.contract?.client}
          </p>
          <div className="flex items-center gap-2 text-xs text-text-secondary">
            <Icon name="Search" size={12} />
            <span>Search Query: "{recommendation?.searchQuery}"</span>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={onViewContract}>
          <Icon name="Eye" size={16} className="mr-2" />
          View Contract
        </Button>
      </div>

      {/* New Response Format - Marketplace Redirect with Contract Info */}
      {marketplaceData ? (
        <>
          {/* Search Results Summary */}
          <div className="bg-primary/5 rounded-lg p-4 mb-4 border border-primary/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                  <Icon name="Zap" size={20} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    1 Recommendation Found
                  </p>
                  <p className="text-xs text-text-secondary">
                    Searched at {new Date(recommendation?.timestamp)?.toLocaleString()}
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-success/10 text-success border border-success/20">
                <Icon name="CheckCircle" size={12} className="mr-1" />
                Match Available
              </span>
            </div>
          </div>

          {/* AWS Contract Information */}
          {marketplaceData?.awsContracts && (
            <div className="bg-success/5 rounded-lg p-4 mb-4 border border-success/20">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 bg-success/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Icon name="FileText" size={20} className="text-success" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-foreground mb-2">
                    AWS Contract Available
                  </h4>
                  <p className="text-xs text-text-secondary mb-3">
                    You have {marketplaceData?.awsContracts?.count} active AWS contract(s) with {formatCurrency(marketplaceData?.awsContracts?.remainingValue)} remaining
                  </p>
                  {marketplaceData?.awsContracts?.contracts?.map((contract, idx) => (
                    <div key={idx} className="bg-background rounded-lg p-3 mb-2">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-text-secondary">Contract Name</p>
                          <p className="font-medium text-foreground">{contract?.name}</p>
                        </div>
                        <div>
                          <p className="text-text-secondary">Status</p>
                          <p className="font-medium text-success">{contract?.status}</p>
                        </div>
                        <div>
                          <p className="text-text-secondary">Remaining Value</p>
                          <p className="font-medium text-foreground">{formatCurrency(contract?.remaining)}</p>
                        </div>
                        <div>
                          <p className="text-text-secondary">End Date</p>
                          <p className="font-medium text-foreground">{new Date(contract?.endDate)?.toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Recommendations Section */}
          {marketplaceData?.recommendations && (
            <div className="bg-muted rounded-lg p-4 mb-4 border border-border">
              <div className="flex items-start gap-3 mb-3">
                <Icon name="Lightbulb" size={18} className="text-primary flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-foreground mb-2">Contract Advice</h4>
                  {marketplaceData?.recommendations?.contractAdvice && (
                    <p className="text-xs text-text-secondary mb-3">
                      {marketplaceData?.recommendations?.contractAdvice}
                    </p>
                  )}
                  {marketplaceData?.recommendations?.nextSteps && marketplaceData?.recommendations?.nextSteps?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-foreground mb-2">Next Steps:</p>
                      <ul className="space-y-1">
                        {marketplaceData?.recommendations?.nextSteps?.map((step, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs text-text-secondary">
                            <Icon name="CheckCircle" size={12} className="text-primary flex-shrink-0 mt-0.5" />
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Message */}
          {marketplaceData?.message && (
            <div className="mt-4 p-3 bg-background rounded-lg border border-border">
              <p className="text-xs text-text-secondary">
                <Icon name="Info" size={12} className="inline mr-1" />
                {marketplaceData?.message}
              </p>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Original Response Format - Product List */}
          {/* Search Results Summary */}
          <div className="bg-primary/5 rounded-lg p-4 mb-4 border border-primary/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                  <Icon name="Zap" size={20} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {recommendation?.totalMatches} Product{recommendation?.totalMatches !== 1 ? 's' : ''} Found
                  </p>
                  <p className="text-xs text-text-secondary">
                    Searched at {new Date(recommendation?.timestamp)?.toLocaleString()}
                  </p>
                </div>
              </div>
              {recommendation?.totalMatches > 0 && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-success/10 text-success border border-success/20">
                  <Icon name="CheckCircle" size={12} className="mr-1" />
                  Matches Available
                </span>
              )}
            </div>
          </div>
          {/* Product Recommendations */}
          {recommendation?.recommendations?.length > 0 ? (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground mb-3">
                Recommended AWS Marketplace Products
              </h4>
              {recommendation?.recommendations?.map((product, index) => (
                <div
                  key={product?.productId || index}
                  className="bg-muted rounded-lg p-4 border border-border"
                >
                  {/* Product Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon name="Package" size={16} className="text-primary" />
                        <h5 className="text-sm font-semibold text-foreground">
                          {product?.productName}
                        </h5>
                      </div>
                      <p className="text-xs text-text-secondary mb-2">
                        Vendor: {product?.vendor}
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                          {product?.productType}
                        </span>
                        {getAvailabilityBadge(product?.availability)}
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getMatchScoreBg(product?.matchScore || 0)}`}>
                          <Icon name="Target" size={12} className="mr-1" />
                          Match: {product?.matchScore || 0}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Pricing Information */}
                  {product?.pricing && (
                    <div className="bg-background rounded-lg p-3 mb-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-text-secondary mb-1">Monthly Cost</p>
                          <p className="text-sm font-semibold text-foreground">
                            {formatCurrency(product?.pricing?.monthlyCost)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-text-secondary mb-1">Pricing Model</p>
                          <p className="text-sm font-medium text-foreground">
                            {product?.pricing?.pricingModel || 'Standard'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Product Description */}
                  {product?.description && (
                    <div className="mb-3">
                      <p className="text-xs text-text-secondary line-clamp-2">
                        {product?.description}
                      </p>
                    </div>
                  )}

                  {/* Actions and Metadata */}
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleProductDetails(product?.productId)}
                    >
                      <Icon
                        name={expandedProduct === product?.productId ? 'ChevronUp' : 'ChevronDown'}
                        size={16}
                        className="mr-1"
                      />
                      {expandedProduct === product?.productId ? 'Hide' : 'Show'} Details
                    </Button>
                    {product?.marketplaceUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMarketplaceRedirect(product?.marketplaceUrl)}
                      >
                        <Icon name="ExternalLink" size={16} className="mr-2" />
                        Visit AWS Marketplace
                      </Button>
                    )}
                  </div>

                  {/* Expanded Metadata */}
                  {expandedProduct === product?.productId && product?.metadata && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <h6 className="text-xs font-semibold text-foreground mb-2">Product Metadata</h6>
                      <div className="bg-background rounded-lg p-3">
                        <pre className="text-xs text-text-secondary overflow-x-auto">
                          {JSON.stringify(product?.metadata, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-muted rounded-lg p-6 text-center">
              <Icon name="Search" size={32} className="text-text-secondary mx-auto mb-2" />
              <p className="text-sm text-text-secondary mb-4">
                No matching products found for this contract
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('https://aws.amazon.com/marketplace/search', '_blank', 'noopener,noreferrer')}
              >
                <Icon name="ExternalLink" size={16} className="mr-2" />
                Visit AWS Marketplace to browse and compare products matching your search
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RecommendationCard;