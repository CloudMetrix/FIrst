import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../../components/ui/Header';
import Breadcrumb from '../../components/ui/Breadcrumb';
import InvoiceTable from './components/InvoiceTable';
import ContractContext from './components/ContractContext';
import InvoiceSummary from './components/InvoiceSummary';
import ConfigurationPopup from './components/ConfigurationPopup';
import RenewalAlertTile from './components/RenewalAlertTile';
import AlertHistoryGrid from './components/AlertHistoryGrid';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import { contractService, invoiceService, alertConfigService, alertHistoryService } from '../../services/supabaseService';

const InvoiceListing = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const contractId = location?.state?.contractId;

  const [contract, setContract] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isConfigPopupOpen, setIsConfigPopupOpen] = useState(false);
  const [configurations, setConfigurations] = useState([]);
  const [alertHistory, setAlertHistory] = useState([]);

  useEffect(() => {
    if (!contractId) {
      navigate('/contract-dashboard');
      return;
    }

    let isMounted = true;

    const loadData = async () => {
      try {
        const [contractData, invoicesData, configsData, historyData] = await Promise.all([
          contractService?.getById(contractId),
          invoiceService?.getByContractId(contractId),
          alertConfigService?.getByContractId(contractId),
          alertHistoryService?.getByContractId(contractId)
        ]);
        
        if (isMounted) {
          setContract(contractData);
          setInvoices(invoicesData);
          setConfigurations(configsData);
          setAlertHistory(historyData);
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.message);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();

    const unsubscribeInvoices = invoiceService?.subscribeToChanges(contractId, (payload) => {
      if (payload?.eventType === 'INSERT') {
        setInvoices(prev => [payload?.new, ...prev]);
      } else if (payload?.eventType === 'UPDATE') {
        setInvoices(prev => prev?.map(inv => inv?.id === payload?.new?.id ? payload?.new : inv));
      } else if (payload?.eventType === 'DELETE') {
        setInvoices(prev => prev?.filter(inv => inv?.id !== payload?.old?.id));
      }
    });

    const unsubscribeAlerts = alertHistoryService?.subscribeToChanges(contractId, (payload) => {
      if (payload?.eventType === 'INSERT') {
        setAlertHistory(prev => [payload?.new, ...prev]);
      }
    });

    return () => {
      isMounted = false;
      unsubscribeInvoices();
      unsubscribeAlerts();
    };
  }, [contractId, navigate]);

  const handleSaveConfiguration = async (config) => {
    try {
      const newConfig = await alertConfigService?.create({
        contractId: contractId,
        email: config?.email,
        alertInterval: config?.alertDays?.[0]?.toString()
      });
      
      setConfigurations(prev => [...prev, newConfig]);
      
      const newAlert = await alertHistoryService?.create({
        contractId: contractId,
        email: config?.email,
        alertType: `Configuration Set: ${config?.alertDays?.join(', ')} days`
      });
      
      setAlertHistory(prev => [newAlert, ...prev]);
    } catch (err) {
      console.error('Failed to save configuration:', err?.message);
    }
  };

  const handleBackToDashboard = () => {
    navigate('/contract-dashboard');
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-background pt-16">
          <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </>
    );
  }

  if (error || !contract) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-background pt-16">
          <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
            <div className="text-center">
              <Icon name="AlertCircle" size={48} className="mx-auto mb-4 text-destructive" />
              <h2 className="text-xl font-semibold text-foreground mb-2">
                {error ? 'Error Loading Contract' : 'Contract Not Found'}
              </h2>
              <p className="text-text-secondary mb-4">
                {error || 'The requested contract could not be found.'}
              </p>
              <button
                onClick={handleBackToDashboard}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-base"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          <Breadcrumb
            items={[
              { label: 'Contract Dashboard', path: '/contract-dashboard' },
              { label: 'Invoice Listing', path: '/invoice-listing' }
            ]}
          />
          
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Invoice Listing</h1>
            <Button
              onClick={() => setIsConfigPopupOpen(true)}
              className="flex items-center space-x-2"
            >
              <Icon name="Settings" size={18} />
              <span>Configure Alerts</span>
            </Button>
          </div>
          
          <ContractContext contract={contract} />
          
          <RenewalAlertTile configurations={configurations} contract={contract} />
          
          <InvoiceSummary invoices={invoices} contractValue={contract?.value} />
          
          <div className="mb-6">
            <InvoiceTable invoices={invoices} />
          </div>
          
          <AlertHistoryGrid alertHistory={alertHistory} />
        </div>
      </div>
      
      <ConfigurationPopup
        isOpen={isConfigPopupOpen}
        onClose={() => setIsConfigPopupOpen(false)}
        contract={contract}
        onSave={handleSaveConfiguration}
      />
    </>
  );
};

export default InvoiceListing;