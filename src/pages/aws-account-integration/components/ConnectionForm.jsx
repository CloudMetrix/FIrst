import React, { useState } from 'react';
import { ExternalLink, AlertCircle, CheckCircle2, Loader2, Shield, ArrowRight, Key } from 'lucide-react';
import { awsIntegrationService } from '../../../services/awsIntegrationService';

const AWS_REGIONS = [
  { value: 'us-east-1', label: 'US East (N. Virginia)' },
  { value: 'us-east-2', label: 'US East (Ohio)' },
  { value: 'us-west-1', label: 'US West (N. California)' },
  { value: 'us-west-2', label: 'US West (Oregon)' },
  { value: 'eu-west-1', label: 'Europe (Ireland)' },
  { value: 'eu-central-1', label: 'Europe (Frankfurt)' },
  { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
  { value: 'ap-northeast-1', label: 'Asia Pacific (Tokyo)' }
];

export default function ConnectionForm({ onSuccess }) {
  const [setupMode, setSetupMode] = useState('cloudformation'); // 'cloudformation' or 'manual'
  const [step, setStep] = useState(1); // 1: Configure, 2: Deploy CloudFormation, 3: Verify
  const [formData, setFormData] = useState({
    accountName: '',
    awsRegion: 'us-east-1',
    permissionsContracts: true,
    permissionsInvoices: true,
    permissionsMarketplace: true,
    permissionsUsage: true,
    // Manual entry fields
    accessKeyId: '',
    secretAccessKey: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [setupData, setSetupData] = useState(null);
  const [roleArn, setRoleArn] = useState('');
  const [verifying, setVerifying] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e?.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setError('');
  };

  const handleManualConnect = async (e) => {
    e?.preventDefault();
    setLoading(true);
    setError('');

    try {
      await awsIntegrationService?.createManualIntegration({
        accountName: formData?.accountName,
        awsRegion: formData?.awsRegion,
        accessKeyId: formData?.accessKeyId,
        secretAccessKey: formData?.secretAccessKey,
        permissions: {
          contracts: formData?.permissionsContracts,
          invoices: formData?.permissionsInvoices,
          marketplace: formData?.permissionsMarketplace,
          usage: formData?.permissionsUsage
        }
      });

      setStep(3);
      setTimeout(() => {
        onSuccess?.();
      }, 2000);
    } catch (err) {
      setError(err?.message || 'Failed to connect AWS account');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSetup = async (e) => {
    e?.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await awsIntegrationService?.generateCloudFormationSetup(
        formData?.accountName,
        formData?.awsRegion,
        {
          contracts: formData?.permissionsContracts,
          invoices: formData?.permissionsInvoices,
          marketplace: formData?.permissionsMarketplace,
          usage: formData?.permissionsUsage
        }
      );

      setSetupData(result);
      setStep(2);
    } catch (err) {
      setError(err?.message || 'Failed to generate setup');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCloudFormation = () => {
    if (setupData?.stackUrl) {
      window.open(setupData?.stackUrl, '_blank');
    }
  };

  const handleVerifyRole = async () => {
    if (!roleArn) {
      setError('Please enter the Role ARN from CloudFormation outputs');
      return;
    }

    setVerifying(true);
    setError('');

    try {
      await awsIntegrationService?.verifyRoleSetup(setupData?.integrationId, roleArn);
      setStep(3);
      setTimeout(() => {
        onSuccess?.();
      }, 2000);
    } catch (err) {
      setError(err?.message || 'Failed to verify role setup');
    } finally {
      setVerifying(false);
    }
  };

  // Step 1: Configure Integration
  if (step === 1) {
    return (
      <div className="space-y-6">
        {/* Setup Mode Toggle */}
        <div className="flex items-center justify-center space-x-4 p-4 bg-gray-50 rounded-lg">
          <button
            type="button"
            onClick={() => setSetupMode('cloudformation')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
              setupMode === 'cloudformation'
                ? 'bg-blue-600 text-white shadow-md' :'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Shield className="inline-block mr-2" size={18} />
            One-Click Setup
          </button>
          <button
            type="button"
            onClick={() => setSetupMode('manual')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
              setupMode === 'manual' ?'bg-blue-600 text-white shadow-md' :'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Key className="inline-block mr-2" size={18} />
            Manual Entry
          </button>
        </div>

        {/* CloudFormation Setup Form */}
        {setupMode === 'cloudformation' && (
          <form onSubmit={handleGenerateSetup} className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start space-x-3">
              <Shield className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <h4 className="text-sm font-semibold text-blue-900 mb-1">Secure One-Click Setup</h4>
                <p className="text-xs text-blue-700">
                  We'll create an IAM role in your AWS account using CloudFormation. No manual credential entry required.
                </p>
              </div>
            </div>

            {/* Account Name */}
            <div>
              <label htmlFor="accountName" className="block text-sm font-medium text-gray-700 mb-2">
                Account Name *
              </label>
              <input
                type="text"
                id="accountName"
                name="accountName"
                value={formData?.accountName}
                onChange={handleChange}
                required
                placeholder="e.g., Production AWS Account"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* AWS Region */}
            <div>
              <label htmlFor="awsRegion" className="block text-sm font-medium text-gray-700 mb-2">
                AWS Region *
              </label>
              <select
                id="awsRegion"
                name="awsRegion"
                value={formData?.awsRegion}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {AWS_REGIONS?.map(region => (
                  <option key={region?.value} value={region?.value}>
                    {region?.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Permission Scopes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Data Access Permissions
              </label>
              <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="permissionsContracts"
                    checked={formData?.permissionsContracts}
                    onChange={handleChange}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">Contracts</span>
                    <p className="text-xs text-gray-500">Access AWS Marketplace subscriptions and agreements</p>
                  </div>
                </label>

                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="permissionsInvoices"
                    checked={formData?.permissionsInvoices}
                    onChange={handleChange}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">Invoices</span>
                    <p className="text-xs text-gray-500">Access AWS billing and cost data</p>
                  </div>
                </label>

                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="permissionsMarketplace"
                    checked={formData?.permissionsMarketplace}
                    onChange={handleChange}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">Marketplace Products</span>
                    <p className="text-xs text-gray-500">Access AWS Marketplace product catalog</p>
                  </div>
                </label>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
                <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Generating Setup...</span>
                </>
              ) : (
                <>
                  <span>Continue to AWS Setup</span>
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>
        )}

        {/* Manual Entry Form */}
        {setupMode === 'manual' && (
          <form onSubmit={handleManualConnect} className="space-y-6">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start space-x-3">
              <Key className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <h4 className="text-sm font-semibold text-amber-900 mb-1">Manual Credentials Entry</h4>
                <p className="text-xs text-amber-700">
                  Enter your AWS Access Key ID and Secret Access Key. Ensure your IAM user has the necessary permissions.
                </p>
              </div>
            </div>

            {/* Account Name */}
            <div>
              <label htmlFor="accountNameManual" className="block text-sm font-medium text-gray-700 mb-2">
                Account Name *
              </label>
              <input
                type="text"
                id="accountNameManual"
                name="accountName"
                value={formData?.accountName}
                onChange={handleChange}
                required
                placeholder="e.g., Production AWS Account"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* AWS Region */}
            <div>
              <label htmlFor="awsRegionManual" className="block text-sm font-medium text-gray-700 mb-2">
                AWS Region *
              </label>
              <select
                id="awsRegionManual"
                name="awsRegion"
                value={formData?.awsRegion}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {AWS_REGIONS?.map(region => (
                  <option key={region?.value} value={region?.value}>
                    {region?.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Access Key ID */}
            <div>
              <label htmlFor="accessKeyId" className="block text-sm font-medium text-gray-700 mb-2">
                AWS Access Key ID *
              </label>
              <input
                type="text"
                id="accessKeyId"
                name="accessKeyId"
                value={formData?.accessKeyId}
                onChange={handleChange}
                required
                placeholder="AKIAIOSFODNN7EXAMPLE"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              />
            </div>

            {/* Secret Access Key */}
            <div>
              <label htmlFor="secretAccessKey" className="block text-sm font-medium text-gray-700 mb-2">
                AWS Secret Access Key *
              </label>
              <input
                type="password"
                id="secretAccessKey"
                name="secretAccessKey"
                value={formData?.secretAccessKey}
                onChange={handleChange}
                required
                placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Your credentials are encrypted and stored securely. We never log or expose your secret key.
              </p>
            </div>

            {/* Permission Scopes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Data Access Permissions
              </label>
              <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="permissionsContracts"
                    checked={formData?.permissionsContracts}
                    onChange={handleChange}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">Contracts</span>
                    <p className="text-xs text-gray-500">Access AWS Marketplace subscriptions and agreements</p>
                  </div>
                </label>

                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="permissionsInvoices"
                    checked={formData?.permissionsInvoices}
                    onChange={handleChange}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">Invoices</span>
                    <p className="text-xs text-gray-500">Access AWS billing and cost data</p>
                  </div>
                </label>

                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="permissionsMarketplace"
                    checked={formData?.permissionsMarketplace}
                    onChange={handleChange}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">Marketplace Products</span>
                    <p className="text-xs text-gray-500">Access AWS Marketplace product catalog</p>
                  </div>
                </label>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
                <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <span>Connect AWS Account</span>
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    );
  }

  // Step 2: Deploy CloudFormation Stack
  if (step === 2) {
    return (
      <div className="space-y-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start space-x-3">
          <CheckCircle2 className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="text-sm font-semibold text-green-900 mb-1">Setup Ready</h4>
            <p className="text-xs text-green-700">
              Your CloudFormation template is ready. Click below to deploy the IAM role in your AWS account.
            </p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Deployment Instructions</h3>
          <ol className="space-y-3 text-sm text-gray-700">
            {setupData?.instructions?.map((instruction, index) => (
              <li key={index} className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">
                  {index + 1}
                </span>
                <span className="pt-0.5">{instruction}</span>
              </li>
            ))}
          </ol>
        </div>

        <button
          onClick={handleOpenCloudFormation}
          className="w-full bg-orange-600 text-white py-3 px-4 rounded-lg hover:bg-orange-700 font-medium flex items-center justify-center space-x-2"
        >
          <ExternalLink size={20} />
          <span>Open AWS CloudFormation Console</span>
        </button>

        <div className="border-t border-gray-200 pt-6">
          <label htmlFor="roleArn" className="block text-sm font-medium text-gray-700 mb-2">
            Role ARN (from CloudFormation Outputs) *
          </label>
          <input
            type="text"
            id="roleArn"
            value={roleArn}
            onChange={(e) => setRoleArn(e?.target?.value)}
            placeholder="arn:aws:iam::123456789012:role/ContractManagerIntegrationRole"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm mb-4"
          />

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3 mb-4">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <button
            onClick={handleVerifyRole}
            disabled={verifying || !roleArn}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium flex items-center justify-center space-x-2"
          >
            {verifying ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                <span>Verifying Role...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={20} />
                <span>Verify and Complete Setup</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // Step 3: Success
  if (step === 3) {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <CheckCircle2 className="text-green-600" size={32} />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Integration Complete!</h3>
        <p className="text-gray-600 mb-6">
          Your AWS account has been successfully connected. We can now automatically retrieve your contracts and invoices.
        </p>
        <div className="inline-flex items-center space-x-2 text-sm text-gray-500">
          <Loader2 className="animate-spin" size={16} />
          <span>Redirecting to dashboard...</span>
        </div>
      </div>
    );
  }

  return null;
}