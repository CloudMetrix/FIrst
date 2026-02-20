import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/ui/Header';
import Breadcrumb from '../../components/ui/Breadcrumb';
import Button from '../../components/ui/Button';
import Icon from '../../components/AppIcon';
import RenewalCard from './components/RenewalCard';
import RenewalFilters from './components/RenewalFilters';
import { contractService } from '../../services/supabaseService';
import { awsIntegrationService, awsMarketplaceService } from '../../services/awsIntegrationService';

const ContractRenewalManagement = () => {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState([]);
  const [awsIntegrations, setAwsIntegrations] = useState([]);
  const [marketplaceProducts, setMarketplaceProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterUrgency, setFilterUrgency] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('expiration');

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
    } catch (err) {
      setError(err?.message);
    } finally {
      setLoading(false);
    }
  };

  const getRenewalContracts = () => {
    const today = new Date();
    const sixtyDaysFromNow = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000);

    return contracts?.filter((contract) => {
      const endDate = new Date(contract?.endDate);
      return contract?.status === 'Active' && endDate > today && endDate <= sixtyDaysFromNow;
    })?.map(contract => {
      const daysLeft = Math.ceil((new Date(contract?.endDate) - today) / (1000 * 60 * 60 * 24));
      const urgency = daysLeft <= 30 ? 'high' : 'medium';
      
      // Check if there's an actual AWS Marketplace product match
      let hasAwsOptimization = false;
      if (contract?.providerType === 'SaaS/Marketplace' && awsIntegrations?.length > 0 && marketplaceProducts?.length > 0) {
        const matchingProducts = marketplaceProducts?.filter(product => {
          const contractNameWords = contract?.name?.toLowerCase()?.split(' ') || [];
          const contractClientWords = contract?.client?.toLowerCase()?.split(' ') || [];
          const productNameLower = product?.productName?.toLowerCase() || '';
          const vendorLower = product?.vendor?.toLowerCase() || '';
          
          // Check if any word from contract name matches product name
          const nameMatch = contractNameWords?.some(word => 
            word?.length > 2 && productNameLower?.includes(word)
          );
          
          // Check if any word from contract client matches vendor
          const vendorMatch = contractClientWords?.some(word => 
            word?.length > 2 && vendorLower?.includes(word)
          );
          
          return (nameMatch || vendorMatch) && product?.monthlyCost;
        });
        
        hasAwsOptimization = matchingProducts?.length > 0;
      }
      
      return {
        ...contract,
        daysLeft,
        urgency,
        hasAwsOptimization,
        renewalStatus: 'not_started'
      };
    });
  };

  const renewalContracts = getRenewalContracts();

  const filteredContracts = useMemo(() => {
    let filtered = [...renewalContracts];

    if (filterUrgency !== 'all') {
      filtered = filtered?.filter(c => c?.urgency === filterUrgency);
    }

    if (filterStatus !== 'all') {
      filtered = filtered?.filter(c => c?.renewalStatus === filterStatus);
    }

    return filtered;
  }, [renewalContracts, filterUrgency, filterStatus]);

  const sortedContracts = useMemo(() => {
    const sorted = [...filteredContracts];

    if (sortBy === 'expiration') {
      sorted?.sort((a, b) => a?.daysLeft - b?.daysLeft);
    } else if (sortBy === 'value') {
      sorted?.sort((a, b) => parseFloat(b?.value) - parseFloat(a?.value));
    } else if (sortBy === 'urgency') {
      const urgencyOrder = { high: 0, medium: 1 };
      sorted?.sort((a, b) => urgencyOrder?.[a?.urgency] - urgencyOrder?.[b?.urgency]);
    }

    return sorted;
  }, [filteredContracts, sortBy]);

  const summaryStats = useMemo(() => {
    const high = renewalContracts?.filter(c => c?.urgency === 'high')?.length || 0;
    const medium = renewalContracts?.filter(c => c?.urgency === 'medium')?.length || 0;
    const withOptimization = renewalContracts?.filter(c => c?.hasAwsOptimization)?.length || 0;
    
    return { high, medium, withOptimization, total: renewalContracts?.length };
  }, [renewalContracts]);

  const handleViewOptimization = () => {
    navigate('/aws-marketplace-optimization');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-16">
          <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-16">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">
          <Breadcrumb />

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6 md:mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-foreground mb-2">
                Contract Renewal Management
              </h1>
              <p className="text-sm md:text-base text-text-secondary">
                Monitor and manage upcoming contract renewals
              </p>
            </div>
            {summaryStats?.withOptimization > 0 && (
              <Button onClick={handleViewOptimization}>
                <Icon name="Zap" size={18} className="mr-2" />
                View AWS Optimization
              </Button>
            )}
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-card rounded-lg p-4 border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary mb-1">Total Renewals</p>
                  <p className="text-2xl font-semibold text-foreground">{summaryStats?.total}</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Icon name="FileText" size={24} color="var(--color-primary)" />
                </div>
              </div>
            </div>

            <div className="bg-card rounded-lg p-4 border border-destructive/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary mb-1">High Priority</p>
                  <p className="text-2xl font-semibold text-destructive">{summaryStats?.high}</p>
                  <p className="text-xs text-text-secondary mt-1">&lt;30 days</p>
                </div>
                <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
                  <Icon name="AlertCircle" size={24} color="var(--color-destructive)" />
                </div>
              </div>
            </div>

            <div className="bg-card rounded-lg p-4 border border-warning/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary mb-1">Medium Priority</p>
                  <p className="text-2xl font-semibold text-warning">{summaryStats?.medium}</p>
                  <p className="text-xs text-text-secondary mt-1">30-60 days</p>
                </div>
                <div className="w-12 h-12 bg-warning/10 rounded-full flex items-center justify-center">
                  <Icon name="Clock" size={24} color="var(--color-warning)" />
                </div>
              </div>
            </div>

            <div className="bg-card rounded-lg p-4 border border-primary/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary mb-1">AWS Optimization</p>
                  <p className="text-2xl font-semibold text-primary">{summaryStats?.withOptimization}</p>
                  <p className="text-xs text-text-secondary mt-1">Savings available</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Icon name="TrendingDown" size={24} color="var(--color-primary)" />
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <RenewalFilters
            filterUrgency={filterUrgency}
            setFilterUrgency={setFilterUrgency}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            sortBy={sortBy}
            setSortBy={setSortBy}
          />

          {/* Renewal List */}
          {sortedContracts?.length === 0 ? (
            <div className="bg-card rounded-lg p-12 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon name="CheckCircle" size={32} className="text-success" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No Renewals Required
              </h3>
              <p className="text-sm text-text-secondary">
                All contracts are up to date. Check back later for upcoming renewals.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedContracts?.map((contract) => (
                <RenewalCard
                  key={contract?.id}
                  contract={contract}
                  onViewDetails={() => navigate('/contract-details', { state: { contractId: contract?.id } })}
                  onViewOptimization={contract?.hasAwsOptimization ? handleViewOptimization : null}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ContractRenewalManagement;