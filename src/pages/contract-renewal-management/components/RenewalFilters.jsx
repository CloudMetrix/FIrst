import React from 'react';
import Icon from '../../../components/AppIcon';
import Select from '../../../components/ui/Select';

const RenewalFilters = ({ filterUrgency, setFilterUrgency, filterStatus, setFilterStatus, sortBy, setSortBy }) => {
  const urgencyOptions = [
    { value: 'all', label: 'All Priorities' },
    { value: 'high', label: 'High Priority (<30 days)' },
    { value: 'medium', label: 'Medium Priority (30-60 days)' },
  ];

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'not_started', label: 'Not Started' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'declined', label: 'Declined' },
  ];

  const sortOptions = [
    { value: 'expiration', label: 'Expiration Date' },
    { value: 'urgency', label: 'Urgency Level' },
    { value: 'value', label: 'Contract Value' },
  ];

  return (
    <div className="bg-card rounded-lg p-4 mb-6 border border-border">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="Filter" size={18} className="text-text-secondary" />
        <h3 className="text-sm font-semibold text-foreground">Filters & Sorting</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-2">
            Priority Level
          </label>
          <Select
            value={filterUrgency}
            onChange={(e) => setFilterUrgency(e?.target?.value)}
            options={urgencyOptions}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-text-secondary mb-2">
            Renewal Status
          </label>
          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e?.target?.value)}
            options={statusOptions}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-text-secondary mb-2">
            Sort By
          </label>
          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e?.target?.value)}
            options={sortOptions}
          />
        </div>
      </div>
    </div>
  );
};

export default RenewalFilters;