import React from 'react';
import { TrendingUp, Database, Package, Activity } from 'lucide-react';
import Icon from '../../../components/AppIcon';


export default function SyncMetrics({ totalRecords, syncFrequency, lastSyncTime, activeIntegrations }) {
  const getTimeSinceLastSync = () => {
    if (!lastSyncTime) return 'Never';
    try {
      const now = Date.now();
      const lastSync = new Date(lastSyncTime)?.getTime();
      const diffMinutes = Math.floor((now - lastSync) / (1000 * 60));
      
      if (diffMinutes < 1) return 'Just now';
      if (diffMinutes < 60) return `${diffMinutes}m ago`;
      
      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return 'Unknown';
    }
  };

  const metrics = [
    {
      icon: Database,
      label: 'Total Records Synced',
      value: totalRecords?.toLocaleString() || '0',
      color: 'blue'
    },
    {
      icon: TrendingUp,
      label: 'Sync Frequency',
      value: syncFrequency || 'Manual',
      color: 'green'
    },
    {
      icon: Activity,
      label: 'Last Sync',
      value: getTimeSinceLastSync(),
      color: 'purple'
    },
    {
      icon: Package,
      label: 'Active Integrations',
      value: activeIntegrations?.toString() || '0',
      color: 'orange'
    }
  ];

  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'text-blue-600',
      text: 'text-blue-900'
    },
    green: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: 'text-green-600',
      text: 'text-green-900'
    },
    purple: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      icon: 'text-purple-600',
      text: 'text-purple-900'
    },
    orange: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      icon: 'text-orange-600',
      text: 'text-orange-900'
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics?.map((metric, index) => {
        const colors = colorClasses?.[metric?.color];
        const Icon = metric?.icon;

        return (
          <div 
            key={index}
            className={`rounded-lg border ${colors?.border} ${colors?.bg} p-6 transition-all hover:shadow-md`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${colors?.bg} border ${colors?.border}`}>
                <Icon className={colors?.icon} size={24} />
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">{metric?.label}</p>
              <p className={`text-2xl font-bold ${colors?.text}`}>
                {metric?.value}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}