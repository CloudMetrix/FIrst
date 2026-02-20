import React from 'react';
import Icon from '../../../components/AppIcon';

const InvoiceSummary = ({ invoices, contractValue }) => {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    })?.format(value);
  };

  const totalInvoiced = invoices?.reduce((sum, inv) => sum + (inv?.amount || 0), 0) || 0;
  const remainingBalance = (contractValue || 0) - totalInvoiced;
  const invoiceCount = invoices?.length || 0;
  const progressPercentage = contractValue > 0 ? (totalInvoiced / contractValue) * 100 : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="bg-card rounded-lg shadow-elevation-2 p-4 md:p-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-text-secondary">Total Invoiced</p>
          <div className="w-8 h-8 bg-primary/10 rounded-md flex items-center justify-center">
            <Icon name="DollarSign" size={16} color="var(--color-primary)" />
          </div>
        </div>
        <p className="text-2xl font-bold text-foreground mb-1">{formatCurrency(totalInvoiced)}</p>
        <div className="w-full bg-muted rounded-full h-2 mt-3">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
          ></div>
        </div>
        <p className="text-xs text-text-secondary mt-2">{progressPercentage?.toFixed(1)}% of contract value</p>
      </div>
      <div className="bg-card rounded-lg shadow-elevation-2 p-4 md:p-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-text-secondary">Remaining Balance</p>
          <div className="w-8 h-8 bg-accent/10 rounded-md flex items-center justify-center">
            <Icon name="TrendingDown" size={16} color="var(--color-accent)" />
          </div>
        </div>
        <p className="text-2xl font-bold text-foreground mb-1">{formatCurrency(remainingBalance)}</p>
        <p className="text-xs text-text-secondary mt-2">
          {remainingBalance >= 0 ? 'Available for invoicing' : 'Over contract value'}
        </p>
      </div>
      <div className="bg-card rounded-lg shadow-elevation-2 p-4 md:p-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-text-secondary">Total Invoices</p>
          <div className="w-8 h-8 bg-success/10 rounded-md flex items-center justify-center">
            <Icon name="FileText" size={16} color="var(--color-success)" />
          </div>
        </div>
        <p className="text-2xl font-bold text-foreground mb-1">{invoiceCount}</p>
        <p className="text-xs text-text-secondary mt-2">
          {invoiceCount === 1 ? '1 invoice' : `${invoiceCount} invoices`} generated
        </p>
      </div>
    </div>
  );
};

export default InvoiceSummary;