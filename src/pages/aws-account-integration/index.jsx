import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cloud, ArrowLeft, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';
import Header from '../../components/ui/Header';
import Breadcrumb from '../../components/ui/Breadcrumb';
import ConnectionForm from './components/ConnectionForm';
import { awsIntegrationService } from '../../services/awsIntegrationService';

export default function AWSAccountIntegration() {
  const navigate = useNavigate();
  const [existingIntegrations, setExistingIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    try {
      const data = await awsIntegrationService?.getAll();
      setExistingIntegrations(data || []);
    } catch (err) {
      setError(err?.message || 'Failed to load integrations');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectionSuccess = () => {
    navigate('/aws-data-sync-dashboard');
  };

  const breadcrumbItems = [
    { label: 'Dashboard', path: '/contract-dashboard' },
    { label: 'AWS Integration', path: '/aws-account-integration' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb items={breadcrumbItems} />

        {/* Header Section */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/contract-dashboard')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back to Dashboard</span>
          </button>

          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Cloud className="text-blue-600" size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">AWS Account Integration</h1>
              <p className="text-gray-600 mt-1">Connect your AWS account to automatically sync contracts, invoices, and usage data</p>
            </div>
          </div>
        </div>

        {/* Existing Integrations Alert */}
        {existingIntegrations?.length > 0 && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start space-x-3">
            <CheckCircle2 className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800">Active AWS Integration</p>
              <p className="text-sm text-green-700 mt-1">
                You have {existingIntegrations?.length} AWS account(s) connected. 
                <button
                  onClick={() => navigate('/aws-data-sync-dashboard')}
                  className="underline ml-1 hover:text-green-900"
                >
                  View sync dashboard
                </button>
              </p>
            </div>
          </div>
        )}

        {/* Main Content Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Integration Steps */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Integration Setup</h2>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">1</div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Enter AWS Credentials</p>
                  <p className="text-xs text-gray-600">Provide your AWS Access Key ID and Secret Access Key</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">2</div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Select Data Permissions</p>
                  <p className="text-xs text-gray-600">Choose which data types to sync from your AWS account</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">3</div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Test & Connect</p>
                  <p className="text-xs text-gray-600">Validate credentials and establish secure connection</p>
                </div>
              </div>
            </div>
          </div>

          {/* Connection Form */}
          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading...</p>
              </div>
            ) : (
              <ConnectionForm onSuccess={handleConnectionSuccess} />
            )}
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Need Help?</h3>
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-1">How to create AWS IAM credentials</h4>
              <p className="text-sm text-gray-600 mb-2">
                You need to create an IAM user with programmatic access in your AWS account.
              </p>
              <a
                href="https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys.html"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700"
              >
                <span>View AWS IAM documentation</span>
                <ExternalLink size={14} />
              </a>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-1">Required AWS permissions</h4>
              <p className="text-sm text-gray-600">
                Your IAM user needs the following permissions: <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">ce:GetCostAndUsage</code>, 
                <code className="bg-gray-100 px-1 py-0.5 rounded text-xs ml-1">aws-marketplace:ViewSubscriptions</code>, 
                <code className="bg-gray-100 px-1 py-0.5 rounded text-xs ml-1">cloudwatch:GetMetricStatistics</code>
              </p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-1">Common connection issues</h4>
              <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                <li>Verify your Access Key ID and Secret Access Key are correct</li>
                <li>Ensure the IAM user has the required permissions</li>
                <li>Check that the selected AWS region matches your resources</li>
                <li>Confirm your AWS account is active and in good standing</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
            <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}