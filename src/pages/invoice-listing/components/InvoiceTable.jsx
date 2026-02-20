import React, { useState, useMemo } from 'react';
import Icon from '../../../components/AppIcon';

const InvoiceTable = ({ invoices }) => {
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    })?.format(value);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date?.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    });
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig?.key === key && sortConfig?.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig?.key !== key) {
      return <Icon name="ChevronsUpDown" size={16} className="opacity-40" />;
    }
    return sortConfig?.direction === 'asc' ? (
      <Icon name="ChevronUp" size={16} />
    ) : (
      <Icon name="ChevronDown" size={16} />
    );
  };

  const sortedInvoices = React.useMemo(() => {
    const sorted = [...(invoices || [])];
    sorted?.sort((a, b) => {
      let aValue = a?.[sortConfig?.key];
      let bValue = b?.[sortConfig?.key];

      if (sortConfig?.key === 'date') {
        aValue = new Date(aValue)?.getTime();
        bValue = new Date(bValue)?.getTime();
      } else if (sortConfig?.key === 'amount') {
        aValue = parseFloat(aValue) || 0;
        bValue = parseFloat(bValue) || 0;
      } else {
        aValue = String(aValue)?.toLowerCase();
        bValue = String(bValue)?.toLowerCase();
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
  }, [invoices, sortConfig]);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'text-success';
      case 'pending':
        return 'text-warning';
      case 'overdue':
        return 'text-destructive';
      default:
        return 'text-text-secondary';
    }
  };

  if (!invoices || invoices?.length === 0) {
    return (
      <div className="bg-card rounded-lg shadow-elevation-2 p-8 md:p-12 text-center">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <Icon name="FileText" size={32} className="text-text-secondary" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">No Invoices Found</h3>
        <p className="text-text-secondary">There are no invoices associated with this contract yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg shadow-elevation-2 overflow-hidden">
      <div className="overflow-x-auto scrollbar-custom">
        <table className="w-full min-w-[600px]">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="px-4 md:px-6 py-3 md:py-4 text-left">
                <button
                  onClick={() => handleSort('invoiceNumber')}
                  className="flex items-center space-x-2 text-xs md:text-sm font-semibold text-foreground hover:text-primary transition-base"
                >
                  <span>Invoice Number</span>
                  {getSortIcon('invoiceNumber')}
                </button>
              </th>
              <th className="px-4 md:px-6 py-3 md:py-4 text-left">
                <button
                  onClick={() => handleSort('date')}
                  className="flex items-center space-x-2 text-xs md:text-sm font-semibold text-foreground hover:text-primary transition-base"
                >
                  <span>Invoice Date</span>
                  {getSortIcon('date')}
                </button>
              </th>
              <th className="px-4 md:px-6 py-3 md:py-4 text-right">
                <button
                  onClick={() => handleSort('amount')}
                  className="flex items-center justify-end space-x-2 text-xs md:text-sm font-semibold text-foreground hover:text-primary transition-base ml-auto"
                >
                  <span>Invoice Amount</span>
                  {getSortIcon('amount')}
                </button>
              </th>
              <th className="px-4 md:px-6 py-3 md:py-4 text-center">
                <span className="text-xs md:text-sm font-semibold text-foreground">Status</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sortedInvoices?.map((invoice) => (
              <tr
                key={invoice?.id}
                className="hover:bg-muted/30 transition-base"
              >
                <td className="px-4 md:px-6 py-3 md:py-4">
                  <span className="text-sm font-medium text-primary hover:underline cursor-pointer">
                    {invoice?.invoiceNumber}
                  </span>
                </td>
                <td className="px-4 md:px-6 py-3 md:py-4">
                  <span className="text-sm text-foreground">{formatDate(invoice?.date)}</span>
                </td>
                <td className="px-4 md:px-6 py-3 md:py-4 text-right">
                  <span className="text-sm font-semibold text-foreground">
                    {formatCurrency(invoice?.amount)}
                  </span>
                </td>
                <td className="px-4 md:px-6 py-3 md:py-4 text-center">
                  <span className={`text-sm font-medium ${getStatusColor(invoice?.status)}`}>
                    {invoice?.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InvoiceTable;