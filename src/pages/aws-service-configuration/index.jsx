import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/ui/Header';
import Button from '../../components/ui/Button';
import { awsConfigService } from '../../services/awsConfigService';
import ServiceConfigPanel from './components/ServiceConfigPanel';
import DataMappingSection from './components/DataMappingSection';
import SyncFrequencySettings from './components/SyncFrequencySettings';

const AWSServiceConfiguration = () => {
  const navigate = useNavigate();
  const [configurations, setConfigurations] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadConfigurations();
  }, []);

  const loadConfigurations = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await awsConfigService?.getServiceConfigurations();
      setConfigurations(data);
      if (data?.length > 0) {
        setSelectedService(data?.[0]?.serviceType);
      }
    } catch (err) {
      setError(err?.message || 'Failed to load configurations');
    } finally {
      setLoading(false);
    }
  };

  const handleServiceToggle = async (serviceType, isEnabled) => {
    try {
      setSaving(true);
      setError('');
      await awsConfigService?.upsertServiceConfiguration({
        serviceType,
        isEnabled
      });
      await loadConfigurations();
      setSuccessMessage(`${getServiceLabel(serviceType)} ${isEnabled ? 'enabled' : 'disabled'} successfully`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err?.message || 'Failed to update service');
    } finally {
      setSaving(false);
    }
  };

  const handleSyncFrequencyChange = async (serviceType, frequency, customHours) => {
    try {
      setSaving(true);
      setError('');
      await awsConfigService?.upsertServiceConfiguration({
        serviceType,
        syncFrequency: frequency,
        customIntervalHours: customHours
      });
      await loadConfigurations();
      setSuccessMessage('Sync frequency updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err?.message || 'Failed to update sync frequency');
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefaults = async () => {
    if (!window.confirm('Are you sure you want to reset all configurations to defaults? This action cannot be undone.')) {
      return;
    }

    try {
      setSaving(true);
      setError('');
      await awsConfigService?.resetToDefaults();
      await loadConfigurations();
      setSuccessMessage('Configurations reset to defaults successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err?.message || 'Failed to reset configurations');
    } finally {
      setSaving(false);
    }
  };

  const getServiceLabel = (serviceType) => {
    const labels = {
      marketplace: 'AWS Marketplace',
      cost_explorer: 'AWS Cost Explorer',
      organizations: 'AWS Organizations',
      billing: 'AWS Billing'
    };
    return labels?.[serviceType] || serviceType;
  };

  const getServiceDescription = (serviceType) => {
    const descriptions = {
      marketplace: 'Sync marketplace products, subscriptions, and usage data',
      cost_explorer: 'Retrieve cost analysis, spending trends, and budget information',
      organizations: 'Import organizational structure, accounts, and policies',
      billing: 'Synchronize invoices, payment methods, and billing history'
    };
    return descriptions?.[serviceType] || '';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading configurations...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">AWS Service Configuration</h1>
              <p className="text-muted-foreground">
                Customize which AWS services and data types are synchronized with Contract Manager
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate('/aws-data-sync-dashboard')}
            >
              View Sync Dashboard
            </Button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive rounded-lg">
            <p className="text-destructive text-sm">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-success/10 border border-success rounded-lg">
            <p className="text-success text-sm">{successMessage}</p>
          </div>
        )}

        {/* Service Configuration Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {configurations?.map((config) => (
            <ServiceConfigPanel
              key={config?.serviceType}
              serviceType={config?.serviceType}
              serviceLabel={getServiceLabel(config?.serviceType)}
              serviceDescription={getServiceDescription(config?.serviceType)}
              isEnabled={config?.isEnabled}
              onToggle={(isEnabled) => handleServiceToggle(config?.serviceType, isEnabled)}
              onSelect={() => setSelectedService(config?.serviceType)}
              isSelected={selectedService === config?.serviceType}
              disabled={saving}
            />
          ))}
        </div>

        {/* Selected Service Details */}
        {selectedService && (
          <div className="space-y-6">
            {/* Sync Frequency Settings */}
            <SyncFrequencySettings
              serviceType={selectedService}
              serviceLabel={getServiceLabel(selectedService)}
              configuration={configurations?.find(c => c?.serviceType === selectedService)}
              onUpdate={handleSyncFrequencyChange}
              disabled={saving}
            />

            {/* Data Mapping Section */}
            <DataMappingSection
              serviceType={selectedService}
              serviceLabel={getServiceLabel(selectedService)}
              disabled={saving}
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex justify-between items-center pt-6 border-t border-border">
          <Button
            variant="outline"
            onClick={handleResetToDefaults}
            disabled={saving}
          >
            Reset to Defaults
          </Button>
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => navigate('/aws-account-integration')}
              disabled={saving}
            >
              Back to Integration
            </Button>
            <Button
              onClick={() => navigate('/contract-dashboard')}
              disabled={saving}
            >
              Done
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AWSServiceConfiguration;