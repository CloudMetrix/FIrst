import React from 'react';

const StatusBadge = ({ status }) => {
  const getStatusStyles = () => {
    switch (status) {
      case 'Active':
        return 'bg-success/10 text-success border-success/20';
      case 'Expired':
        return 'bg-muted text-muted-foreground border-border';
      case 'Pending':
        return 'bg-warning/10 text-warning border-warning/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-md text-xs md:text-sm font-medium border transition-base ${getStatusStyles()}`}
    >
      {status}
    </span>
  );
};

export default StatusBadge;