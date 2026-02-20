import React, { useState, useEffect } from 'react';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';


const ContractForm = ({ initialData, onSubmit, onCancel, isSubmitting }) => {
  const [formData, setFormData] = useState({
    contractName: '',
    clientVendor: '',
    contractValue: '',
    startDate: '',
    endDate: '',
    status: 'active',
    remainingAmount: ''
  });

  const [errors, setErrors] = useState({});
  const [contractLength, setContractLength] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        contractName: initialData?.contractName || '',
        clientVendor: initialData?.clientVendor || '',
        contractValue: initialData?.contractValue || '',
        startDate: initialData?.startDate || '',
        endDate: initialData?.endDate || '',
        status: initialData?.status || 'active',
        remainingAmount: initialData?.remainingAmount || ''
      });
    }
  }, [initialData]);

  useEffect(() => {
    if (formData?.startDate && formData?.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const months = Math.floor(diffDays / 30);
      const days = diffDays % 30;
      setContractLength(`${months} months ${days} days`);
    } else {
      setContractLength('');
    }
  }, [formData?.startDate, formData?.endDate]);

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'expired', label: 'Expired' },
    { value: 'pending', label: 'Pending' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e?.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setHasUnsavedChanges(true);
    if (errors?.[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSelectChange = (value) => {
    setFormData(prev => ({
      ...prev,
      status: value
    }));
    setHasUnsavedChanges(true);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData?.contractName?.trim()) {
      newErrors.contractName = 'Contract name is required';
    }

    if (!formData?.clientVendor?.trim()) {
      newErrors.clientVendor = 'Client/Vendor name is required';
    }

    if (!formData?.contractValue) {
      newErrors.contractValue = 'Contract value is required';
    } else if (isNaN(formData?.contractValue) || parseFloat(formData?.contractValue) <= 0) {
      newErrors.contractValue = 'Please enter a valid amount';
    }

    if (!formData?.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData?.endDate) {
      newErrors.endDate = 'End date is required';
    }

    if (formData?.startDate && formData?.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (end <= start) {
        newErrors.endDate = 'End date must be after start date';
      }
    }

    if (!formData?.remainingAmount) {
      newErrors.remainingAmount = 'Remaining amount is required';
    } else if (isNaN(formData?.remainingAmount) || parseFloat(formData?.remainingAmount) < 0) {
      newErrors.remainingAmount = 'Please enter a valid amount';
    } else if (parseFloat(formData?.remainingAmount) > parseFloat(formData?.contractValue)) {
      newErrors.remainingAmount = 'Remaining amount cannot exceed contract value';
    }

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
      setHasUnsavedChanges(false);
    }
  };

  const handleCancelClick = () => {
    if (hasUnsavedChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to cancel?')) {
        onCancel();
      }
    } else {
      onCancel();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Input
          label="Contract Name"
          type="text"
          name="contractName"
          placeholder="Enter contract name"
          value={formData?.contractName}
          onChange={handleInputChange}
          error={errors?.contractName}
          required
        />

        <Input
          label="Client/Vendor"
          type="text"
          name="clientVendor"
          placeholder="Enter client or vendor name"
          value={formData?.clientVendor}
          onChange={handleInputChange}
          error={errors?.clientVendor}
          required
        />

        <Input
          label="Contract Value"
          type="number"
          name="contractValue"
          placeholder="0.00"
          value={formData?.contractValue}
          onChange={handleInputChange}
          error={errors?.contractValue}
          required
          description="Enter the total contract value in USD"
        />

        <Input
          label="Remaining Amount"
          type="number"
          name="remainingAmount"
          placeholder="0.00"
          value={formData?.remainingAmount}
          onChange={handleInputChange}
          error={errors?.remainingAmount}
          required
          description="Enter the remaining contract amount"
        />

        <Input
          label="Start Date"
          type="date"
          name="startDate"
          value={formData?.startDate}
          onChange={handleInputChange}
          error={errors?.startDate}
          required
        />

        <Input
          label="End Date"
          type="date"
          name="endDate"
          value={formData?.endDate}
          onChange={handleInputChange}
          error={errors?.endDate}
          required
        />

        <Select
          label="Contract Status"
          options={statusOptions}
          value={formData?.status}
          onChange={handleSelectChange}
          required
          description="Select the current status of the contract"
        />

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Contract Length
          </label>
          <div className="h-11 px-4 py-2 bg-muted rounded-md border border-input flex items-center text-text-secondary">
            {contractLength || 'Calculated automatically'}
          </div>
          <p className="mt-1 text-xs text-text-secondary">
            Automatically calculated from start and end dates
          </p>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-border">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancelClick}
          disabled={isSubmitting}
          className="w-full sm:w-auto"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="default"
          loading={isSubmitting}
          iconName="Save"
          iconPosition="left"
          className="w-full sm:w-auto"
        >
          Update Contract
        </Button>
      </div>
    </form>
  );
};

export default ContractForm;