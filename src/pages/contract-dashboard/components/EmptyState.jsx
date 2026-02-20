import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const EmptyState = ({ hasFilters, onClearFilters }) => {
  const navigate = useNavigate();

  if (hasFilters) {
    return (
      <div className="bg-card rounded-lg shadow-elevation-2 p-8 md:p-12 text-center">
        <div className="w-16 h-16 md:w-20 md:h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
          <Icon name="Search" size={32} className="text-text-secondary" />
        </div>
        <h3 className="text-xl md:text-2xl font-semibold text-foreground mb-3">
          No contracts found
        </h3>
        <p className="text-sm md:text-base text-text-secondary mb-6 max-w-md mx-auto">
          We couldn't find any contracts matching your search criteria. Try adjusting your filters
          or search terms.
        </p>
        <Button variant="outline" iconName="X" iconPosition="left" onClick={onClearFilters}>
          Clear Filters
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg shadow-elevation-2 p-8 md:p-12 text-center">
      <div className="w-16 h-16 md:w-20 md:h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
        <Icon name="FileText" size={32} color="var(--color-primary)" />
      </div>
      <h3 className="text-xl md:text-2xl font-semibold text-foreground mb-3">
        No contracts yet
      </h3>
      <p className="text-sm md:text-base text-text-secondary mb-6 max-w-md mx-auto">
        Get started by uploading your first contract. You'll be able to track all your contracts,
        monitor their status, and manage renewals in one place.
      </p>
      <Button
        variant="default"
        iconName="Upload"
        iconPosition="left"
        onClick={() => navigate('/upload-contract')}
      >
        Upload Your First Contract
      </Button>
    </div>
  );
};

export default EmptyState;