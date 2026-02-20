import React from 'react';
import Select from '../../../components/ui/Select';
import Input from '../../../components/ui/Input';
import { formatClientName } from '../../../utils/cn';

const InvoiceForm = ({ formData, contracts, loadingContracts, errors, onChange }) => {
  const contractOptions = contracts?.map(contract => ({
    value: contract?.id,
    label: `${contract?.name} - ${formatClientName(contract?.client)}`
  })) || [];

  const selectedContract = contracts?.find(c => c?.id === formData?.contractId);

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Select Contract <span className="text-error">*</span>
        </label>
        {loadingContracts ? (
          <div className="flex items-center space-x-2 text-text-secondary">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span className="text-sm">Loading contracts...</span>
          </div>
        ) : (
          <>
            <Select
              value={formData?.contractId}
              onChange={(value) => onChange('contractId', value)}
              options={contractOptions}
              placeholder="Choose a contract"
              error={errors?.contractId}
            />
            {errors?.contractId && (
              <p className="text-sm text-error mt-1">{errors?.contractId}</p>
            )}
          </>
        )}
      </div>

      {selectedContract && (
        <div className="p-4 bg-muted rounded-lg">
          <h3 className="text-sm font-medium text-foreground mb-2">Contract Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-text-secondary">Client/Vendor:</span>
              <span className="ml-2 text-foreground font-medium">
                {formatClientName(selectedContract?.client)}
              </span>
            </div>
            <div>
              <span className="text-text-secondary">Contract Value:</span>
              <span className="ml-2 text-foreground font-medium">
                ${selectedContract?.value?.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-text-secondary">Status:</span>
              <span className="ml-2 text-foreground font-medium">
                {selectedContract?.status}
              </span>
            </div>
            <div>
              <span className="text-text-secondary">End Date:</span>
              <span className="ml-2 text-foreground font-medium">
                {new Date(selectedContract?.endDate)?.toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Input
            label="Invoice Number"
            value={formData?.invoiceNumber}
            onChange={(e) => onChange('invoiceNumber', e?.target?.value)}
            placeholder="INV-2024-001"
            required
            error={errors?.invoiceNumber}
          />
        </div>

        <div>
          <Input
            label="Invoice Date"
            type="date"
            value={formData?.invoiceDate}
            onChange={(e) => onChange('invoiceDate', e?.target?.value)}
            required
            error={errors?.invoiceDate}
          />
        </div>
      </div>

      <div>
        <Input
          label="Invoice Amount (USD)"
          type="number"
          value={formData?.invoiceAmount}
          onChange={(e) => onChange('invoiceAmount', e?.target?.value)}
          placeholder="0.00"
          step="0.01"
          min="0"
          required
          error={errors?.invoiceAmount}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Description (Optional)
        </label>
        <textarea
          value={formData?.description}
          onChange={(e) => onChange('description', e?.target?.value)}
          placeholder="Add any additional notes or description for this invoice"
          rows={3}
          className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-base resize-none text-foreground bg-background"
        />
      </div>
    </div>
  );
};

export default InvoiceForm;