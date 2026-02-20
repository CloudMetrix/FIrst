import React from 'react';
import { format } from 'date-fns';
import { CheckCircle2, XCircle, Clock, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

const STATUS_ICONS = {
  completed: CheckCircle2,
  failed: XCircle,
  in_progress: Loader2,
  pending: Clock
};

const STATUS_COLORS = {
  completed: 'text-green-600',
  failed: 'text-red-600',
  in_progress: 'text-blue-600',
  pending: 'text-gray-600'
};

const DATA_TYPE_LABELS = {
  contracts: 'Contracts',
  invoices: 'Invoices',
  marketplace_products: 'Marketplace Products',
  service_usage: 'Service Usage'
};

export default function SyncActivityLog({ logs, expanded, onToggle }) {
  const formatTimestamp = (timestamp) => {
    try {
      return format(new Date(timestamp), 'MMM d, yyyy h:mm:ss a');
    } catch {
      return 'Invalid date';
    }
  };

  const getDuration = (startedAt, completedAt) => {
    if (!completedAt) return 'In progress';
    try {
      const start = new Date(startedAt);
      const end = new Date(completedAt);
      const seconds = Math.floor((end - start) / 1000);
      if (seconds < 60) return `${seconds}s`;
      const minutes = Math.floor(seconds / 60);
      return `${minutes}m ${seconds % 60}s`;
    } catch {
      return 'N/A';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div 
        className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Sync Activity Log</h2>
            <p className="text-sm text-gray-600 mt-1">
              Recent synchronization operations ({logs?.length || 0} records)
            </p>
          </div>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>
      </div>
      {expanded && (
        <div className="border-t border-gray-200">
          {logs?.length === 0 ? (
            <div className="p-8 text-center">
              <Clock className="mx-auto text-gray-400 mb-3" size={48} />
              <p className="text-gray-600">No sync activity yet</p>
              <p className="text-sm text-gray-500 mt-1">Sync operations will appear here</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
              {logs?.map((log) => {
                const StatusIcon = STATUS_ICONS?.[log?.syncStatus] || Clock;
                const statusColor = STATUS_COLORS?.[log?.syncStatus] || 'text-gray-600';

                return (
                  <div key={log?.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <StatusIcon 
                          className={`${statusColor} flex-shrink-0 mt-1 ${
                            log?.syncStatus === 'in_progress' ? 'animate-spin' : ''
                          }`} 
                          size={20} 
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-gray-900">
                              {DATA_TYPE_LABELS?.[log?.dataType] || log?.dataType}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              log?.syncStatus === 'completed' ? 'bg-green-100 text-green-800' :
                              log?.syncStatus === 'failed' ? 'bg-red-100 text-red-800' :
                              log?.syncStatus === 'in_progress'? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {log?.syncStatus?.replace('_', ' ')?.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            {formatTimestamp(log?.startedAt)}
                          </p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span>Duration: {getDuration(log?.startedAt, log?.completedAt)}</span>
                            {log?.recordsSynced > 0 && (
                              <span>Synced: {log?.recordsSynced?.toLocaleString()}</span>
                            )}
                            {log?.recordsFailed > 0 && (
                              <span className="text-red-600">Failed: {log?.recordsFailed}</span>
                            )}
                          </div>
                          
                          {/* Show informative message for marketplace products with 0 records */}
                          {log?.syncStatus === 'completed' && 
                           log?.dataType === 'marketplace_products' && 
                           log?.recordsSynced === 0 && 
                           !log?.errorMessage && (
                            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                              No marketplace products found - no purchases, expired subscriptions, or inactive products
                            </div>
                          )}
                          
                          {log?.errorMessage && (
                            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-800">
                              {log?.errorMessage}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}