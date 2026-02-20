import React, { useState, useMemo } from 'react';
import Icon from '../../../components/AppIcon';

const AlertHistoryGrid = ({ alertHistory }) => {
  const [sortConfig, setSortConfig] = useState({ key: 'sentAt', direction: 'desc' });

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date?.toLocaleString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
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

  const sortedAlerts = React.useMemo(() => {
    if (!alertHistory || alertHistory?.length === 0) return [];
    
    const sorted = [...alertHistory];
    sorted?.sort((a, b) => {
      let aValue = a?.[sortConfig?.key];
      let bValue = b?.[sortConfig?.key];

      if (sortConfig?.key === 'sentAt') {
        aValue = new Date(aValue)?.getTime();
        bValue = new Date(bValue)?.getTime();
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
  }, [alertHistory, sortConfig]);

  if (!alertHistory || alertHistory?.length === 0) {
    return (
      <div className="bg-card rounded-lg shadow-elevation-2 p-8 text-center">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <Icon name="BellOff" size={32} className="text-text-secondary" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">No Alerts Sent Yet</h3>
        <p className="text-text-secondary text-sm">Renewal alerts will appear here once they are sent.</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg shadow-elevation-2 overflow-hidden">
      <div className="p-4 md:p-6 border-b border-border">
        <div className="flex items-center space-x-2">
          <Icon name="History" size={20} className="text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Alert History</h3>
        </div>
        <p className="text-sm text-text-secondary mt-1">Track all renewal alerts sent for this contract</p>
      </div>
      <div className="overflow-x-auto scrollbar-custom">
        <table className="w-full min-w-[600px]">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="px-4 md:px-6 py-3 md:py-4 text-left">
                <button
                  onClick={() => handleSort('email')}
                  className="flex items-center space-x-2 text-xs md:text-sm font-semibold text-foreground hover:text-primary transition-base"
                >
                  <span>Email Address</span>
                  {getSortIcon('email')}
                </button>
              </th>
              <th className="px-4 md:px-6 py-3 md:py-4 text-left">
                <button
                  onClick={() => handleSort('alertType')}
                  className="flex items-center space-x-2 text-xs md:text-sm font-semibold text-foreground hover:text-primary transition-base"
                >
                  <span>Alert Type</span>
                  {getSortIcon('alertType')}
                </button>
              </th>
              <th className="px-4 md:px-6 py-3 md:py-4 text-left">
                <button
                  onClick={() => handleSort('sentAt')}
                  className="flex items-center space-x-2 text-xs md:text-sm font-semibold text-foreground hover:text-primary transition-base"
                >
                  <span>Date & Time Sent</span>
                  {getSortIcon('sentAt')}
                </button>
              </th>
              <th className="px-4 md:px-6 py-3 md:py-4 text-center">
                <span className="text-xs md:text-sm font-semibold text-foreground">Status</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sortedAlerts?.map((alert) => (
              <tr
                key={alert?.id}
                className="hover:bg-muted/30 transition-base"
              >
                <td className="px-4 md:px-6 py-3 md:py-4">
                  <div className="flex items-center space-x-2">
                    <Icon name="Mail" size={16} className="text-text-secondary" />
                    <span className="text-sm text-foreground">{alert?.email}</span>
                  </div>
                </td>
                <td className="px-4 md:px-6 py-3 md:py-4">
                  <span className="text-sm text-foreground">{alert?.alertType}</span>
                </td>
                <td className="px-4 md:px-6 py-3 md:py-4">
                  <span className="text-sm text-foreground">{formatDateTime(alert?.sentAt)}</span>
                </td>
                <td className="px-4 md:px-6 py-3 md:py-4 text-center">
                  <span className="inline-flex items-center space-x-1 px-2 py-1 bg-success/10 text-success text-xs font-medium rounded-md">
                    <Icon name="CheckCircle" size={14} />
                    <span>Sent</span>
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

export default AlertHistoryGrid;