import React from 'react';
import Icon from '../../../components/AppIcon';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';

const FilterToolbar = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  resultsCount,
  totalCount,
  onExport,
  onClearFilters,
}) => {
  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'Active', label: 'Active' },
    { value: 'Expired', label: 'Expired' },
    { value: 'Pending', label: 'Pending' },
  ];

  const hasActiveFilters = searchQuery || statusFilter !== 'all';

  return (
    <div className="bg-card rounded-lg shadow-elevation-2 p-4 md:p-6 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="flex-1 min-w-0">
            <Input
              type="search"
              placeholder="Search contracts, clients, or vendors..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e?.target?.value)}
              className="w-full"
            />
          </div>

          <div className="w-full sm:w-48">
            <Select
              options={statusOptions}
              value={statusFilter}
              onChange={onStatusFilterChange}
              placeholder="Filter by status"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              iconName="X"
              iconPosition="left"
              onClick={onClearFilters}
            >
              Clear
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            iconName="Download"
            iconPosition="left"
            onClick={onExport}
          >
            Export
          </Button>
        </div>
      </div>
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
        <div className="flex items-center space-x-2 text-sm text-text-secondary">
          <Icon name="FileText" size={16} />
          <span>
            Showing <span className="font-semibold text-foreground">{resultsCount}</span> of{' '}
            <span className="font-semibold text-foreground">{totalCount}</span> contracts
          </span>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center space-x-2 text-sm text-primary">
            <Icon name="Filter" size={16} />
            <span className="font-medium">Filters active</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterToolbar;