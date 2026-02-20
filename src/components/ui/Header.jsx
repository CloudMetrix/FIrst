import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Icon from '../AppIcon';
import { useAuth } from '../../contexts/AuthContext';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path) => {
    return location?.pathname === path;
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/signin');
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 bg-card shadow-elevation-2 z-navigation">
        <div className="flex items-center justify-between h-16 px-6">
          <div className="flex items-center">
            <Link to="/contract-dashboard" className="flex items-center">
              <div className="w-10 h-10 bg-primary/10 rounded-md flex items-center justify-center mr-3">
                <Icon name="FileText" size={24} color="var(--color-primary)" />
              </div>
              <span className="text-xl font-semibold text-foreground font-heading">
                ContractManager
              </span>
            </Link>
          </div>

          <nav className="hidden md:flex items-center space-x-1">
            <Link
              to="/contract-dashboard"
              className={`px-4 py-2 rounded-md text-sm font-medium transition-base ${
                isActive('/contract-dashboard')
                  ? 'bg-primary text-primary-foreground' :'text-foreground hover:bg-muted'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Icon name="LayoutDashboard" size={18} />
                <span>Contracts</span>
              </div>
            </Link>
            <Link
              to="/upload-invoice"
              className={`px-4 py-2 rounded-md text-sm font-medium transition-base ${
                isActive('/upload-invoice')
                  ? 'bg-primary text-primary-foreground' :'text-foreground hover:bg-muted'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Icon name="Upload" size={18} />
                <span>Upload Invoice</span>
              </div>
            </Link>
            <Link
              to="/aws-data-sync-dashboard"
              className={`px-4 py-2 rounded-md text-sm font-medium transition-base ${
                isActive('/aws-data-sync-dashboard') || isActive('/aws-account-integration') || isActive('/aws-service-configuration')
                  ? 'bg-primary text-primary-foreground' :'text-foreground hover:bg-muted'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Icon name="Cloud" size={18} />
                <span>AWS Sync</span>
              </div>
            </Link>
            <Link
              to="/contract-renewal-management"
              className={`px-4 py-2 rounded-md text-sm font-medium transition-base ${
                isActive('/contract-renewal-management') || isActive('/aws-marketplace-optimization')
                  ? 'bg-primary text-primary-foreground' :'text-foreground hover:bg-muted'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Icon name="RefreshCw" size={18} />
                <span>Renewals</span>
              </div>
            </Link>
            <Link
              to="/schema-management"
              className={`px-4 py-2 rounded-md text-sm font-medium transition-base ${
                isActive('/schema-management')
                  ? 'bg-primary text-primary-foreground' :'text-foreground hover:bg-muted'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Icon name="Settings" size={18} />
                <span>Schema Config</span>
              </div>
            </Link>
            {user && (
              <button
                onClick={handleSignOut}
                className="px-4 py-2 rounded-md text-sm font-medium text-foreground hover:bg-muted transition-base"
              >
                <div className="flex items-center space-x-2">
                  <Icon name="LogOut" size={18} />
                  <span>Sign Out</span>
                </div>
              </button>
            )}
          </nav>

          <button
            onClick={toggleMobileMenu}
            className="md:hidden p-2 rounded-md text-foreground hover:bg-muted transition-base"
            aria-label="Toggle mobile menu"
          >
            <Icon name={isMobileMenuOpen ? 'X' : 'Menu'} size={24} />
          </button>
        </div>
      </header>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 top-16 bg-card z-dropdown md:hidden">
          <nav className="flex flex-col p-4 space-y-2">
            <Link
              to="/contract-dashboard"
              onClick={toggleMobileMenu}
              className={`px-4 py-3 rounded-md text-base font-medium transition-base ${
                isActive('/contract-dashboard')
                  ? 'bg-primary text-primary-foreground' :'text-foreground hover:bg-muted'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon name="LayoutDashboard" size={20} />
                <span>Contracts</span>
              </div>
            </Link>
            <Link
              to="/upload-invoice"
              onClick={toggleMobileMenu}
              className={`px-4 py-3 rounded-md text-base font-medium transition-base ${
                isActive('/upload-invoice')
                  ? 'bg-primary text-primary-foreground' :'text-foreground hover:bg-muted'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon name="Upload" size={20} />
                <span>Upload Invoice</span>
              </div>
            </Link>
            <Link
              to="/aws-data-sync-dashboard"
              onClick={toggleMobileMenu}
              className={`px-4 py-3 rounded-md text-base font-medium transition-base ${
                isActive('/aws-data-sync-dashboard') || isActive('/aws-account-integration') || isActive('/aws-service-configuration')
                  ? 'bg-primary text-primary-foreground' :'text-foreground hover:bg-muted'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon name="Cloud" size={20} />
                <span>AWS Sync</span>
              </div>
            </Link>
            <Link
              to="/contract-renewal-management"
              onClick={toggleMobileMenu}
              className={`px-4 py-3 rounded-md text-base font-medium transition-base ${
                isActive('/contract-renewal-management') || isActive('/aws-marketplace-optimization')
                  ? 'bg-primary text-primary-foreground' :'text-foreground hover:bg-muted'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon name="RefreshCw" size={20} />
                <span>Renewals</span>
              </div>
            </Link>
            <Link
              to="/schema-management"
              onClick={toggleMobileMenu}
              className={`px-4 py-3 rounded-md text-base font-medium transition-base ${
                isActive('/schema-management')
                  ? 'bg-primary text-primary-foreground' :'text-foreground hover:bg-muted'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon name="Settings" size={20} />
                <span>Schema Config</span>
              </div>
            </Link>
            {user && (
              <button
                onClick={() => {
                  toggleMobileMenu();
                  handleSignOut();
                }}
                className="px-4 py-3 rounded-md text-base font-medium text-foreground hover:bg-muted transition-base text-left"
              >
                <div className="flex items-center space-x-3">
                  <Icon name="LogOut" size={20} />
                  <span>Sign Out</span>
                </div>
              </button>
            )}
          </nav>
        </div>
      )}
    </>
  );
};

export default Header;