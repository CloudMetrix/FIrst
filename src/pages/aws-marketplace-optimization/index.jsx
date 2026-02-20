import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/ui/Header';
import Breadcrumb from '../../components/ui/Breadcrumb';
import Button from '../../components/ui/Button';
import Icon from '../../components/AppIcon';
import OptimizationCard from './components/OptimizationCard';
import RecommendationCard from './components/RecommendationCard';
import { contractService } from '../../services/supabaseService';
import { awsIntegrationService, awsMarketplaceService } from '../../services/awsIntegrationService';

const AWSMarketplaceOptimization = () => {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState([]);
  const [awsIntegrations, setAwsIntegrations] = useState([]);
  const [marketplaceProducts, setMarketplaceProducts] = useState([]);
  const [searchRecommendations, setSearchRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchingProducts, setSearchingProducts] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [contractsData, integrationsData, productsData] = await Promise.all([
        contractService?.getAll(),
        awsIntegrationService?.getAll(),
        awsMarketplaceService?.getAllProducts()
      ]);
      
      setContracts(contractsData);
      setAwsIntegrations(integrationsData?.filter(i => i?.permissionsMarketplace && i?.connectionStatus === 'connected') || []);
      setMarketplaceProducts(productsData || []);
      
      // Perform real-time search for expiring contracts
      if (integrationsData?.length > 0) {
        await performRealTimeSearch(contractsData, integrationsData);
      }
    } catch (err) {
      setError(err?.message);
    } finally {
      setLoading(false);
    }
  };

  const performRealTimeSearch = async (contractsData, integrationsData) => {
    setSearchingProducts(true);
    try {
      const expiringMarketplaceContracts = getExpiringMarketplaceContractsFromData(contractsData);
      const connectedIntegration = integrationsData?.find(i => i?.permissionsMarketplace && i?.connectionStatus === 'connected');
      
      if (!connectedIntegration || expiringMarketplaceContracts?.length === 0) {
        return;
      }

      // Search for each expiring contract in real-time
      const searchPromises = expiringMarketplaceContracts?.map(async (contract) => {
        try {
          const searchQuery = `${contract?.name} ${contract?.client}`;
          const results = await awsMarketplaceService?.searchMarketplaceProducts(
            connectedIntegration?.id,
            searchQuery,
            'All',
            5
          );
          return { contract, results, searchQuery };
        } catch (err) {
          console.error(`Failed to search for contract ${contract?.id}:`, err);
          return { contract, results: [], searchQuery: `${contract?.name} ${contract?.client}` };
        }
      });

      const searchResults = await Promise.all(searchPromises);
      
      // Store recommendations with contract context
      const recommendations = searchResults?.map(({ contract, results, searchQuery }) => ({
        contract,
        searchQuery,
        recommendations: results || [],
        timestamp: new Date()?.toISOString(),
        totalMatches: results?.length || 0
      }));
      
      setSearchRecommendations(recommendations);
      
      // Merge real-time search results with existing synced products
      const newProducts = [];
      searchResults?.forEach(({ results }) => {
        results?.forEach(result => {
          // Convert search result to product format
          newProducts?.push({
            productId: result?.productId,
            productName: result?.productName,
            vendor: result?.vendor,
            productType: result?.productType,
            monthlyCost: result?.pricing?.monthlyCost || null,
            currency: result?.pricing?.currency || 'USD',
            status: result?.availability,
            metadata: result?.metadata,
            matchScore: result?.matchScore,
            marketplaceUrl: result?.marketplaceUrl,
          });
        });
      });

      // Combine with existing products (avoid duplicates)
      const existingProductIds = new Set(marketplaceProducts?.map(p => p?.productId));
      const uniqueNewProducts = newProducts?.filter(p => !existingProductIds?.has(p?.productId));
      
      setMarketplaceProducts(prev => [...prev, ...uniqueNewProducts]);
    } catch (err) {
      console.error('Real-time search error:', err);
    } finally {
      setSearchingProducts(false);
    }
  };

  const getExpiringMarketplaceContractsFromData = (contractsData) => {
    const today = new Date();
    const sixtyDaysFromNow = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000);

    return contractsData?.filter((contract) => {
      const endDate = new Date(contract?.endDate);
      const isMarketplace = contract?.providerType === 'SaaS/Marketplace';
      const isExpiringSoon = contract?.status === 'Active' && endDate > today && endDate <= sixtyDaysFromNow;
      return isMarketplace && isExpiringSoon;
    });
  };

  const getExpiringMarketplaceContracts = () => {
    return getExpiringMarketplaceContractsFromData(contracts);
  };

  const expiringContracts = useMemo(() => {
    return getExpiringMarketplaceContractsFromData(contracts);
  }, [contracts]);

  const optimizationOpportunities = useMemo(() => {
    if (awsIntegrations?.length === 0) {
      return [];
    }

    return expiringContracts?.map(contract => {
      const matchingProducts = marketplaceProducts?.filter(product => {
        const contractNameWords = contract?.name?.toLowerCase()?.split(' ') || [];
        const contractClientWords = contract?.client?.toLowerCase()?.split(' ') || [];
        const productNameLower = product?.productName?.toLowerCase() || '';
        const vendorLower = product?.vendor?.toLowerCase() || '';
        
        // Check if any significant word from contract name matches product name
        const nameMatch = contractNameWords?.some(word => 
          word?.length > 2 && productNameLower?.includes(word)
        );
        
        // Check if any significant word from contract client matches vendor
        const vendorMatch = contractClientWords?.some(word => 
          word?.length > 2 && vendorLower?.includes(word)
        );
        
        return nameMatch || vendorMatch;
      });

      // Sort by match score if available
      const sortedProducts = matchingProducts?.sort((a, b) => {
        const scoreA = a?.matchScore || 0;
        const scoreB = b?.matchScore || 0;
        return scoreB - scoreA;
      });

      const currentMonthlyCost = parseFloat(contract?.value) / 12;
      const awsProduct = sortedProducts?.[0];
      
      // Only use real AWS Marketplace data - no dummy calculations
      if (!awsProduct || !awsProduct?.monthlyCost) {
        return null; // Skip this opportunity if no real AWS data exists
      }
      
      const awsMonthlyCost = parseFloat(awsProduct?.monthlyCost);
      const monthlySavings = currentMonthlyCost - awsMonthlyCost;
      const annualSavings = monthlySavings * 12;
      const savingsPercentage = (monthlySavings / currentMonthlyCost) * 100;

      return {
        contract,
        currentMonthlyCost,
        awsMonthlyCost,
        monthlySavings,
        annualSavings,
        savingsPercentage,
        awsProduct,
        hasDirectMatch: true, // Always true now since we only show real matches
      };
    })
    ?.filter(opp => opp !== null && opp?.monthlySavings > 0); // Filter out null entries and only positive savings
  }, [expiringContracts, marketplaceProducts, awsIntegrations]);

  const totalSavings = useMemo(() => {
    return optimizationOpportunities?.reduce((sum, opp) => sum + opp?.annualSavings, 0);
  }, [optimizationOpportunities]);

  const handleViewContract = (contractId) => {
    navigate('/contract-details', { state: { contractId } });
  };

  const handleViewRenewalManagement = () => {
    navigate('/contract-renewal-management');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-16">
          <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              {searchingProducts && (
                <p className="text-muted-foreground">Searching AWS Marketplace for optimization opportunities...</p>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-16">
          <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
            <div className="text-center">
              <p className="text-destructive mb-4">Error: {error}</p>
              <Button onClick={() => window.location?.reload()}>Retry</Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (awsIntegrations?.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-16">
          <div className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">
            <Breadcrumb />
            <div className="bg-card rounded-lg p-12 text-center">
              <div className="w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon name="Cloud" size={32} className="text-warning" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No AWS Integration Found
              </h3>
              <p className="text-sm text-text-secondary mb-6">
                Connect your AWS account to view marketplace optimization opportunities
              </p>
              <Button onClick={() => navigate('/aws-account-integration')}>
                <Icon name="Plus" size={18} className="mr-2" />
                Connect AWS Account
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-16">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">
          <Breadcrumb />

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6 md:mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-foreground mb-2">
                AWS Marketplace Optimization
              </h1>
              <p className="text-sm md:text-base text-text-secondary">
                Maximize savings by leveraging your AWS marketplace contracts
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="outline" onClick={handleViewRenewalManagement}>
                <Icon name="ArrowLeft" size={18} className="mr-2" />
                Back to Renewals
              </Button>
            </div>
          </div>

          {/* Savings Summary */}
          <div className="bg-gradient-to-r from-primary/10 to-success/10 rounded-lg p-6 mb-6 border border-primary/20">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-success/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Icon name="TrendingDown" size={28} color="var(--color-success)" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-1">
                    Potential Annual Savings
                  </h2>
                  <p className="text-3xl font-bold text-success mb-2">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })?.format(totalSavings)}
                  </p>
                  <p className="text-sm text-text-secondary">
                    {optimizationOpportunities?.length} optimization opportunit{optimizationOpportunities?.length === 1 ? 'y' : 'ies'} identified
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  <Icon name="CheckCircle" size={16} className="text-success" />
                  <span>AWS marketplace integration active</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  <Icon name="CheckCircle" size={16} className="text-success" />
                  <span>{awsIntegrations?.length} AWS account{awsIntegrations?.length > 1 ? 's' : ''} connected</span>
                </div>
              </div>
            </div>
          </div>

          {/* Real-Time Recommendations Section */}
          {searchRecommendations?.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-1">
                    AI-Powered Recommendations
                  </h2>
                  <p className="text-sm text-text-secondary">
                    Real-time AWS Marketplace search results from Edge Function
                  </p>
                </div>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                  <Icon name="Zap" size={14} className="mr-1" />
                  Live Search Results
                </span>
              </div>
              
              <div className="space-y-4">
                {searchRecommendations?.map((recommendation, index) => (
                  <RecommendationCard
                    key={recommendation?.contract?.id}
                    recommendation={recommendation}
                    onViewContract={() => handleViewContract(recommendation?.contract?.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Optimization Opportunities */}
          {optimizationOpportunities?.length === 0 ? (
            <div className="bg-card rounded-lg p-12 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon name="CheckCircle" size={32} className="text-success" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No Optimization Opportunities
              </h3>
              <p className="text-sm text-text-secondary">
                All your marketplace contracts are already optimized or no expiring contracts found.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-foreground">
                  Optimization Recommendations
                </h2>
                <span className="text-sm text-text-secondary">
                  Sorted by potential savings
                </span>
              </div>
              
              {optimizationOpportunities
                ?.sort((a, b) => b?.annualSavings - a?.annualSavings)
                ?.map((opportunity, index) => (
                  <OptimizationCard
                    key={opportunity?.contract?.id}
                    opportunity={opportunity}
                    rank={index + 1}
                    onViewContract={() => handleViewContract(opportunity?.contract?.id)}
                  />
                ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AWSMarketplaceOptimization;