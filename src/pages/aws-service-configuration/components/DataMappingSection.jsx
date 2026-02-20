import React, { useState, useEffect } from 'react';
import { awsConfigService } from '../../../services/awsConfigService';
import DataMappingRow from './DataMappingRow';

const DataMappingSection = ({ serviceType, serviceLabel, disabled }) => {
  const [mappings, setMappings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadMappings();
  }, [serviceType]);

  const loadMappings = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await awsConfigService?.getDataMappings(serviceType);
      setMappings(data);
    } catch (err) {
      setError(err?.message || 'Failed to load data mappings');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Data Field Mappings - {serviceLabel}
        </h3>
        <p className="text-sm text-muted-foreground">
          Configure how AWS data fields map to Contract Manager entities
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-destructive/10 border border-destructive rounded-lg">
          <p className="text-destructive text-sm">{error}</p>
        </div>
      )}

      {mappings?.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No data mappings configured for this service</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Header */}
          <div className="grid grid-cols-12 gap-4 pb-3 border-b border-border">
            <div className="col-span-4">
              <span className="text-sm font-medium text-foreground">AWS Field</span>
            </div>
            <div className="col-span-1 flex justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </div>
            <div className="col-span-4">
              <span className="text-sm font-medium text-foreground">Contract Manager Field</span>
            </div>
            <div className="col-span-3">
              <span className="text-sm font-medium text-foreground">Transformation</span>
            </div>
          </div>

          {/* Mapping Rows */}
          {mappings?.map((mapping) => (
            <DataMappingRow
              key={mapping?.id}
              mapping={mapping}
              disabled={disabled}
            />
          ))}
        </div>
      )}

      <div className="mt-6 pt-6 border-t border-border">
        <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">About Data Mappings</p>
            <p>
              These mappings define how data from AWS services is transformed and stored in Contract Manager.
              Transformation rules ensure data compatibility and proper formatting.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataMappingSection;