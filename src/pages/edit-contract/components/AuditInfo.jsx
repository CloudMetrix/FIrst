import React from 'react';
import Icon from '../../../components/AppIcon';

const AuditInfo = ({ lastModified, modifiedBy }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date?.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-muted/50 rounded-lg border border-border p-4 md:p-6">
      <div className="flex items-start space-x-3">
        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
          <Icon name="Clock" size={20} color="var(--color-primary)" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-foreground mb-2">
            Audit Information
          </h4>
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
              <span className="text-xs md:text-sm text-text-secondary">Last Modified:</span>
              <span className="text-xs md:text-sm font-medium text-foreground">
                {formatDate(lastModified)}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
              <span className="text-xs md:text-sm text-text-secondary">Modified By:</span>
              <span className="text-xs md:text-sm font-medium text-foreground">
                {modifiedBy}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditInfo;