import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Icon from '../AppIcon';

const Breadcrumb = () => {
  const location = useLocation();

  const breadcrumbMap = {
    '/contract-dashboard': null,
    '/upload-contract': 'Upload Contract',
    '/edit-contract': 'Edit Contract',
    '/contract-details': 'Contract Details',
    '/invoice-listing': 'Contract Invoices',
  };

  const currentPage = breadcrumbMap?.[location?.pathname];

  if (!currentPage) {
    return null;
  }

  return (
    <nav className="flex items-center space-x-2 text-sm text-text-secondary mb-6" aria-label="Breadcrumb">
      <Link
        to="/contract-dashboard"
        className="flex items-center hover:text-primary transition-base"
      >
        <Icon name="LayoutDashboard" size={16} className="mr-1" />
        <span>Contracts</span>
      </Link>
      <Icon name="ChevronRight" size={16} />
      <span className="text-foreground font-medium">{currentPage}</span>
    </nav>
  );
};

export default Breadcrumb;