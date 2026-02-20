import React from 'react';
import { CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_CONFIG = {
  completed: {
    icon: CheckCircle2,
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-800',
    iconColor: 'text-green-600',
    label: 'Completed'
  },
  failed: {
    icon: XCircle,
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-800',
    iconColor: 'text-red-600',
    label: 'Failed'
  },
  in_progress: {
    icon: Loader2,
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-800',
    iconColor: 'text-blue-600',
    label: 'In Progress'
  },
  pending: {
    icon: Clock,
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    textColor: 'text-gray-800',
    iconColor: 'text-gray-600',
    label: 'Pending'
  }
};

const DATA_TYPE_LABELS = {
  contracts: 'Contracts',
  invoices: 'Invoices',
  marketplace_products: 'Marketplace Products',
  service_usage: 'Service Usage'
};

export default function SyncStatusCard({ dataType, lastSync, recordCount, status, onManualSync, syncing }) {
  const config = STATUS_CONFIG?.[status] || STATUS_CONFIG?.pending;
  const StatusIcon = config?.icon;

  const getTimeSinceSync = () => {
    if (!lastSync) return 'Never synced';
    try {
      return format(new Date(lastSync), 'MMM d, yyyy h:mm a');
    } catch {
      return 'Invalid date';
    }
  };

  const getDataFreshness = () => {
    if (!lastSync) return 'No data';
    const hoursSince = Math.floor((Date.now() - new Date(lastSync)?.getTime()) / (1000 * 60 * 60));
    if (hoursSince < 1) return 'Fresh';
    if (hoursSince < 24) return `${hoursSince}h old`;
    const daysSince = Math.floor(hoursSince / 24);
    return `${daysSince}d old`;
  };

  // Check if sync completed successfully but found no records
  const isEmptyResult = status === 'completed' && recordCount === 0 && lastSync;

  return (
    <div className={`rounded-lg border ${config?.borderColor} ${config?.bgColor} p-6 transition-all hover:shadow-md`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${config?.bgColor} border ${config?.borderColor}`}>
            <StatusIcon className={config?.iconColor} size={24} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {DATA_TYPE_LABELS?.[dataType] || dataType}
            </h3>
            <p className={`text-sm ${config?.textColor} font-medium`}>
              {config?.label}
            </p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          getDataFreshness() === 'Fresh' ? 'bg-green-100 text-green-800' :
          getDataFreshness() === 'No data'? 'bg-gray-100 text-gray-800' : 'bg-yellow-100 text-yellow-800'
        }`}>
          {getDataFreshness()}
        </span>
      </div>
      
      {/* Empty result message for marketplace products */}
      {isEmptyResult && dataType === 'marketplace_products' && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            No marketplace products found. This could mean:
          </p>
          <ul className="text-xs text-blue-700 mt-2 ml-4 space-y-1 list-disc">
            <li>No products purchased from AWS Marketplace</li>
            <li>All subscriptions have expired</li>
            <li>No active marketplace products in use</li>
          </ul>
        </div>
      )}
      
      <div className="space-y-3 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Last Sync</span>
          <span className="text-sm font-medium text-gray-900">{getTimeSinceSync()}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Records Synced</span>
          <span className="text-sm font-medium text-gray-900">
            {recordCount?.toLocaleString() || 0}
          </span>
        </div>
      </div>
      <div className="pt-4 border-t border-gray-200">
        <button
          onClick={() => onManualSync?.(dataType)}
          disabled={syncing || status === 'in_progress'}
          className="w-full px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors flex items-center justify-center space-x-2"
        >
          {syncing ? (
            <>
              <Loader2 className="animate-spin" size={16} />
              <span>Syncing...</span>
            </>
          ) : (
            <span>Sync Now</span>
          )}
        </button>
      </div>
    </div>
  );
}