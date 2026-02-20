import React from 'react';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';

const ContractForm = ({ formData, errors, onChange }) => {
  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'pending', label: 'Pending' },
    { value: 'expired', label: 'Expired' }
  ];

  const clientOptions = [
    { value: 'AWS', label: 'AWS' },
    { value: 'GCP', label: 'GCP' },
    { value: 'MS Azure', label: 'MS Azure' }
  ];

  const providerTypeOptions = [
    { value: 'SaaS/Original Vendor', label: 'SaaS/Original Vendor' },
    { value: 'SaaS/Reseller', label: 'SaaS/Reseller' },
    { value: 'SaaS/Marketplace', label: 'SaaS/Marketplace' },
    { value: 'Cloud Service Provider/Original Vendor', label: 'Cloud Service Provider/Original Vendor' },
    { value: 'Cloud Service Provider/Reseller', label: 'Cloud Service Provider/Reseller' }
  ];

  const handleInputChange = (field, value) => {
    onChange(field, value);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Input
          label="Contract Name"
          type="text"
          placeholder="Enter contract name"
          value={formData?.contractName}
          onChange={(e) => handleInputChange('contractName', e?.target?.value)}
          error={errors?.contractName}
          required
        />

        <Select
          label="Client/Vendor"
          placeholder="Select client or vendor"
          options={clientOptions}
          value={formData?.client}
          onChange={(value) => handleInputChange('client', value)}
          error={errors?.client}
          searchable
          required
        />

        <Select
          label="Provider Type"
          placeholder="Select provider type"
          options={providerTypeOptions}
          value={formData?.providerType}
          onChange={(value) => handleInputChange('providerType', value)}
          error={errors?.providerType}
          searchable
          required
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Input
          label="Contract Value (USD)"
          type="number"
          placeholder="0.00"
          value={formData?.value}
          onChange={(e) => handleInputChange('value', e?.target?.value)}
          error={errors?.value}
          required
          min="0"
          step="0.01"
        />

        <Select
          label="Status"
          placeholder="Select contract status"
          options={statusOptions}
          value={formData?.status}
          onChange={(value) => handleInputChange('status', value)}
          error={errors?.status}
          required
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Input
          label="Start Date"
          type="date"
          value={formData?.startDate}
          onChange={(e) => handleInputChange('startDate', e?.target?.value)}
          error={errors?.startDate}
          required
        />

        <Input
          label="End Date"
          type="date"
          value={formData?.endDate}
          onChange={(e) => handleInputChange('endDate', e?.target?.value)}
          error={errors?.endDate}
          required
        />
      </div>
      {formData?.startDate && formData?.endDate && (
        <div className="bg-muted rounded-lg p-4 md:p-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/10 rounded-md flex items-center justify-center flex-shrink-0">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--color-primary)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-text-secondary">Contract Length</p>
              <p className="text-lg md:text-xl font-semibold text-foreground">
                {formData?.contractLength}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractForm;