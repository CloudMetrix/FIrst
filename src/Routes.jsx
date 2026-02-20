import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route, Navigate } from "react-router-dom";
import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";
import NotFound from "pages/NotFound";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import ContractDashboard from './pages/contract-dashboard';
import EditContract from './pages/edit-contract';
import UploadContract from './pages/upload-contract';
import ContractDetails from './pages/contract-details';
import InvoiceListing from './pages/invoice-listing';
import SignIn from './pages/signin';
import SignUp from './pages/signup';
import SchemaManagement from './pages/schema-management';
import UploadInvoice from './pages/upload-invoice';
import AWSAccountIntegration from './pages/aws-account-integration';
import AWSDataSyncDashboard from './pages/aws-data-sync-dashboard';
import AWSServiceConfiguration from './pages/aws-service-configuration';
import ContractRenewalManagement from './pages/contract-renewal-management';
import AWSMarketplaceOptimization from './pages/aws-marketplace-optimization';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/contract-dashboard" replace />;
  }

  return children;
};

const AppRoutes = () => {
  return (
    <RouterRoutes>
      <Route path="/signin" element={<PublicRoute><SignIn /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><SignUp /></PublicRoute>} />
      <Route path="/" element={<ProtectedRoute><ContractDashboard /></ProtectedRoute>} />
      <Route path="/contract-dashboard" element={<ProtectedRoute><ContractDashboard /></ProtectedRoute>} />
      <Route path="/schema-management" element={<ProtectedRoute><SchemaManagement /></ProtectedRoute>} />
      <Route path="/edit-contract/:id" element={<ProtectedRoute><EditContract /></ProtectedRoute>} />
      <Route path="/upload-contract" element={<ProtectedRoute><UploadContract /></ProtectedRoute>} />
      <Route path="/contract-details" element={<ProtectedRoute><ContractDetails /></ProtectedRoute>} />
      <Route path="/invoice-listing" element={<ProtectedRoute><InvoiceListing /></ProtectedRoute>} />
      <Route path="/upload-invoice" element={<ProtectedRoute><UploadInvoice /></ProtectedRoute>} />
      <Route path="/aws-account-integration" element={<ProtectedRoute><AWSAccountIntegration /></ProtectedRoute>} />
      <Route path="/aws-data-sync-dashboard" element={<ProtectedRoute><AWSDataSyncDashboard /></ProtectedRoute>} />
      <Route path="/aws-service-configuration" element={<ProtectedRoute><AWSServiceConfiguration /></ProtectedRoute>} />
      <Route path="/contract-renewal-management" element={<ProtectedRoute><ContractRenewalManagement /></ProtectedRoute>} />
      <Route path="/aws-marketplace-optimization" element={<ProtectedRoute><AWSMarketplaceOptimization /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </RouterRoutes>
  );
};

const Routes = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ErrorBoundary>
          <ScrollToTop />
          <AppRoutes />
        </ErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default Routes;
