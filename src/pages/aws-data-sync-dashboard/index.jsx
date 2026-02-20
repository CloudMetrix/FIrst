import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cloud, ArrowLeft, RefreshCw, Settings, AlertCircle } from 'lucide-react';
import Header from '../../components/ui/Header';
import Breadcrumb from '../../components/ui/Breadcrumb';
import SyncStatusCard from './components/SyncStatusCard';
import SyncActivityLog from './components/SyncActivityLog';
import SyncMetrics from './components/SyncMetrics';
import { awsIntegrationService, awsSyncService } from '../../services/awsIntegrationService';

export default function AWSDataSyncDashboard() {
  const navigate = useNavigate();
  const [integrations, setIntegrations] = useState([]);
  const [syncLogs, setSyncLogs] = useState([]);
  const [syncStatuses, setSyncStatuses] = useState({
    contracts: { lastSync: null, recordCount: 0, status: 'pending' },
    invoices: { lastSync: null, recordCount: 0, status: 'pending' },
    marketplace_products: { lastSync: null, recordCount: 0, status: 'pending' }
  });
  const [syncingTypes, setSyncingTypes] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [logExpanded, setLogExpanded] = useState(true);

  useEffect(() => {
    loadDashboardData();

    // Subscribe to real-time sync log updates
    const unsubscribe = awsSyncService?.subscribeToSyncLogs((payload) => {
      if (payload?.eventType === 'INSERT') {
        setSyncLogs(prev => [payload?.new, ...prev]);
        updateSyncStatus(payload?.new);
      } else if (payload?.eventType === 'UPDATE') {
        setSyncLogs(prev => prev?.map(log => 
          log?.id === payload?.new?.id ? payload?.new : log
        ));
        updateSyncStatus(payload?.new);
      }
    });

    return () => unsubscribe?.();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [integrationsData, logsData] = await Promise.all([
        awsIntegrationService?.getAll(),
        awsSyncService?.getAllSyncLogs()
      ]);

      setIntegrations(integrationsData || []);
      setSyncLogs(logsData || []);

      // Calculate sync statuses from logs
      const statuses = {
        contracts: { lastSync: null, recordCount: 0, status: 'pending' },
        invoices: { lastSync: null, recordCount: 0, status: 'pending' },
        marketplace_products: { lastSync: null, recordCount: 0, status: 'pending' }
      };

      logsData?.forEach(log => {
        const dataType = log?.dataType;
        if (statuses?.[dataType]) {
          if (!statuses?.[dataType]?.lastSync || 
              new Date(log?.startedAt) > new Date(statuses[dataType]?.lastSync)) {
            statuses[dataType] = {
              lastSync: log?.completedAt || log?.startedAt,
              recordCount: log?.recordsSynced || 0,
              status: log?.syncStatus
            };
          }
        }
      });

      setSyncStatuses(statuses);
    } catch (err) {
      setError(err?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const updateSyncStatus = (log) => {
    const dataType = log?.dataType;
    if (dataType) {
      setSyncStatuses(prev => ({
        ...prev,
        [dataType]: {
          lastSync: log?.completedAt || log?.startedAt,
          recordCount: log?.recordsSynced || 0,
          status: log?.syncStatus
        }
      }));

      if (log?.syncStatus === 'completed' || log?.syncStatus === 'failed') {
        setSyncingTypes(prev => ({ ...prev, [dataType]: false }));
      }
    }
  };

  const handleManualSync = async (dataType) => {
    if (integrations?.length === 0) {
      setError('No AWS integration found. Please connect your AWS account first.');
      return;
    }

    setSyncingTypes(prev => ({ ...prev, [dataType]: true }));
    setError('');

    try {
      const integration = integrations?.[0];
      await awsSyncService?.triggerManualSync(integration?.id, dataType);
      
      // Wait a moment for real-time subscription to update, then reset syncing state
      setTimeout(() => {
        setSyncingTypes(prev => ({ ...prev, [dataType]: false }));
        // Refresh dashboard data to ensure UI is up-to-date
        loadDashboardData();
      }, 2000);
    } catch (err) {
      setError(err?.message || 'Failed to trigger sync');
      setSyncingTypes(prev => ({ ...prev, [dataType]: false }));
    }
  };

  const handleSyncAll = async () => {
    if (integrations?.length === 0) {
      setError('No AWS integration found. Please connect your AWS account first.');
      return;
    }

    const dataTypes = ['contracts', 'invoices', 'marketplace_products'];
    
    // Set all to syncing state immediately
    const syncingState = dataTypes?.reduce((acc, type) => ({ ...acc, [type]: true }), {});
    setSyncingTypes(syncingState);
    setError('');

    try {
      const integration = integrations?.[0];
      
      // Track sync results
      const results = await Promise.allSettled(
        dataTypes?.map(dataType => 
          awsSyncService?.triggerManualSync(integration?.id, dataType)
        )
      );
      
      // Process results and update UI
      const errors = [];
      results?.forEach((result, index) => {
        const dataType = dataTypes?.[index];
        setSyncingTypes(prev => ({ ...prev, [dataType]: false }));
        
        if (result?.status === 'rejected') {
          console.error(`Failed to sync ${dataType}:`, result?.reason);
          errors?.push(`${dataType}: ${result?.reason?.message || 'Unknown error'}`);
        }
      });
      
      // Display errors if any
      if (errors?.length > 0) {
        setError(`Sync failed for: ${errors?.join(', ')}`);
      } else {
        // Refresh data on success
        await loadDashboardData();
      }
    } catch (err) {
      setError(err?.message || 'Failed to trigger sync');
      // Reset all syncing states on error
      setSyncingTypes({});
    }
  };

  const getTotalRecords = () => {
    return Object.values(syncStatuses)?.reduce((sum, status) => sum + (status?.recordCount || 0), 0);
  };

  const getLastSyncTime = () => {
    const times = Object.values(syncStatuses)
      ?.map(s => s?.lastSync)
      ?.filter(Boolean)
      ?.map(t => new Date(t)?.getTime());
    return times?.length > 0 ? new Date(Math.max(...times))?.toISOString() : null;
  };

  const breadcrumbItems = [
    { label: 'Dashboard', path: '/contract-dashboard' },
    { label: 'AWS Sync Dashboard', path: '/aws-data-sync-dashboard' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb items={breadcrumbItems} />

        {/* Header Section */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/contract-dashboard')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back to Dashboard</span>
          </button>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Cloud className="text-blue-600" size={32} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">AWS Data Sync Dashboard</h1>
                <p className="text-gray-600 mt-1">Monitor and control automated data synchronization</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleSyncAll}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <RefreshCw size={18} />
                <span>Sync All</span>
              </button>
              <button
                onClick={() => navigate('/aws-account-integration')}
                className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                <Settings size={18} />
                <span>Settings</span>
              </button>
            </div>
          </div>
        </div>

        {/* No Integration Warning */}
        {integrations?.length === 0 && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start space-x-3">
            <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800">No AWS Integration Found</p>
              <p className="text-sm text-yellow-700 mt-1">
                You need to connect your AWS account before you can sync data.
                <button
                  onClick={() => navigate('/aws-account-integration')}
                  className="underline ml-1 hover:text-yellow-900 font-medium"
                >
                  Connect AWS Account
                </button>
              </p>
            </div>
          </div>
        )}

        {/* Metrics Section */}
        <div className="mb-8">
          <SyncMetrics
            totalRecords={getTotalRecords()}
            syncFrequency="Every 24 hours"
            lastSyncTime={getLastSyncTime()}
            activeIntegrations={integrations?.length}
          />
        </div>

        {/* Sync Status Cards */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Data Sync Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(syncStatuses)?.map(([dataType, status]) => (
              <SyncStatusCard
                key={dataType}
                dataType={dataType}
                lastSync={status?.lastSync}
                recordCount={status?.recordCount}
                status={status?.status}
                onManualSync={handleManualSync}
                syncing={syncingTypes?.[dataType]}
              />
            ))}
          </div>
        </div>

        {/* Sync Activity Log */}
        <div className="mb-8">
          <SyncActivityLog
            logs={syncLogs}
            expanded={logExpanded}
            onToggle={() => setLogExpanded(!logExpanded)}
          />
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
            <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}