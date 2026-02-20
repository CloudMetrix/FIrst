import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/ui/Header';
import Breadcrumb from '../../components/ui/Breadcrumb';
import UploadAction from '../../components/ui/UploadAction';
import FilterToolbar from './components/FilterToolbar';
import ContractTable from './components/ContractTable';
import ContractCard from './components/ContractCard';
import ExpirationAlert from './components/ExpirationAlert';
import RenewalNotificationPopup from './components/RenewalNotificationPopup';
import EmptyState from './components/EmptyState';
import { contractService, invoiceService } from '../../services/supabaseService';

import { formatClientName } from '../../utils/cn';

const ContractDashboard = () => {
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [showExpirationAlert, setShowExpirationAlert] = useState(true);
  const [showRenewalPopup, setShowRenewalPopup] = useState(false);
  const [contracts, setContracts] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const [contractsData, invoicesData] = await Promise.all([
          contractService?.getAll(),
          invoiceService?.getAll()
        ]);
        if (isMounted) {
          setContracts(contractsData);
          setInvoices(invoicesData);
          
          // Check for renewal notifications on load
          const renewalContracts = getRenewalContractsFromData(contractsData);
          if (renewalContracts?.length > 0) {
            setShowRenewalPopup(true);
          }
        }
      } catch (err) {
        if (isMounted) setError(err?.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();

    const unsubscribe = contractService?.subscribeToChanges((payload) => {
      if (payload?.eventType === 'INSERT') {
        setContracts(prev => [payload?.new, ...prev]);
      } else if (payload?.eventType === 'UPDATE') {
        setContracts(prev => prev?.map(c => c?.id === payload?.new?.id ? payload?.new : c));
      } else if (payload?.eventType === 'DELETE') {
        setContracts(prev => prev?.filter(c => c?.id !== payload?.old?.id));
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const getRenewalContractsFromData = (contractsData) => {
    const today = new Date();
    const sixtyDaysFromNow = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000);

    return contractsData?.filter((contract) => {
      const endDate = new Date(contract?.endDate);
      return contract?.status === 'Active' && endDate > today && endDate <= sixtyDaysFromNow;
    });
  };

  const calculateTotalInvoiced = (contractId) => {
    return invoices
      ?.filter(invoice => invoice?.contractId === contractId)
      ?.reduce((sum, invoice) => sum + parseFloat(invoice?.amount || 0), 0) || 0;
  };

  const contractsWithInvoices = useMemo(() => {
    return contracts?.map(contract => ({
      ...contract,
      totalInvoiced: calculateTotalInvoiced(contract?.id)
    }));
  }, [contracts, invoices]);

  const getExpiringContracts = () => {
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    return contractsWithInvoices?.filter((contract) => {
      const endDate = new Date(contract.endDate);
      return (contract?.status === 'Active' &&
      endDate > today && endDate <= thirtyDaysFromNow);
    });
  };

  const getRenewalContracts = () => {
    return getRenewalContractsFromData(contractsWithInvoices);
  };

  const expiringContracts = getExpiringContracts();
  const renewalContracts = getRenewalContracts();

  const filteredContracts = useMemo(() => {
    let filtered = [...contractsWithInvoices];

    if (searchQuery) {
      const query = searchQuery?.toLowerCase();
      filtered = filtered?.filter(
        (contract) =>
          contract?.name?.toLowerCase()?.includes(query) ||
          contract?.client?.toLowerCase()?.includes(query)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered?.filter((contract) => contract?.status === statusFilter);
    }

    return filtered;
  }, [searchQuery, statusFilter, contractsWithInvoices]);

  const sortedContracts = useMemo(() => {
    const sorted = [...filteredContracts];

    sorted?.sort((a, b) => {
      let aValue = a?.[sortConfig?.key];
      let bValue = b?.[sortConfig?.key];

      if (sortConfig?.key === 'value' || sortConfig?.key === 'remainingAmount') {
        aValue = parseFloat(aValue);
        bValue = parseFloat(bValue);
      } else if (sortConfig?.key === 'startDate' || sortConfig?.key === 'endDate') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      } else if (typeof aValue === 'string') {
        aValue = aValue?.toLowerCase();
        bValue = bValue?.toLowerCase();
      }

      if (aValue < bValue) {
        return sortConfig?.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig?.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return sorted;
  }, [filteredContracts, sortConfig]);

  const handleSort = (key) => {
    setSortConfig((prevConfig) => ({
      key,
      direction: prevConfig?.key === key && prevConfig?.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleDelete = async (contractId) => {
    try {
      await contractService?.delete(contractId);
    } catch (err) {
      console.error('Delete failed:', err?.message);
    }
  };

  const handleExport = () => {
    const csvContent = [
      ['Contract Name', 'Client/Vendor', 'Value', 'Start Date', 'End Date', 'Length', 'Status', 'Remaining Amount'],
      ...sortedContracts?.map((contract) => [
        contract?.name,
        formatClientName(contract?.client),
        contract?.value,
        contract?.startDate,
        contract?.endDate,
        contract?.length,
        contract?.status,
        contract?.remainingAmount,
      ]),
    ]?.map((row) => row?.join(','))?.join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL?.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `contracts_export_${new Date()?.toISOString()?.split('T')?.[0]}.csv`;
    link?.click();
    window.URL?.revokeObjectURL(url);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
  };

  const handleViewContract = (contractId) => {
    navigate('/contract-details', { state: { contractId } });
  };

  const handleViewRenewal = (contractId) => {
    navigate('/contract-renewal-management');
  };

  const hasActiveFilters = searchQuery || statusFilter !== 'all';

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
              <button
                onClick={() => window.location?.reload()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
              >
                Retry
              </button>
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
                Contract Dashboard
              </h1>
              <p className="text-sm md:text-base text-text-secondary">
                Monitor and manage your complete contract portfolio
              </p>
            </div>
            <UploadAction />
          </div>

          {showExpirationAlert && expiringContracts?.length > 0 && (
            <ExpirationAlert
              expiringContracts={expiringContracts}
              onDismiss={() => setShowExpirationAlert(false)}
              onViewContract={handleViewContract}
            />
          )}

          <RenewalNotificationPopup
            isOpen={showRenewalPopup}
            onClose={() => setShowRenewalPopup(false)}
            renewalContracts={renewalContracts}
            onViewRenewal={handleViewRenewal}
          />

          <FilterToolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            resultsCount={sortedContracts?.length}
            totalCount={contracts?.length}
            onExport={handleExport}
            onClearFilters={handleClearFilters}
          />

          {sortedContracts?.length === 0 ? (
            <EmptyState hasFilters={hasActiveFilters} onClearFilters={handleClearFilters} />
          ) : (
            <>
              <div className="hidden lg:block">
                <ContractTable
                  contracts={sortedContracts}
                  sortConfig={sortConfig}
                  onSort={handleSort}
                  onDelete={handleDelete}
                />
              </div>

              <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-4">
                {sortedContracts?.map((contract) => (
                  <ContractCard
                    key={contract?.id}
                    contract={contract}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default ContractDashboard;