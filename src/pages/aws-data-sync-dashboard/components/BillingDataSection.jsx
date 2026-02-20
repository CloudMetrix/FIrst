import React, { useState } from 'react';
import { DollarSign, TrendingUp, Calendar, ChevronDown, ChevronUp } from 'lucide-react';

export default function BillingDataSection({ billingData, loading }) {
  const [expanded, setExpanded] = useState(true);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!billingData || billingData?.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
            <DollarSign className="text-green-600" size={24} />
            <span>AWS Billing Data</span>
          </h2>
        </div>
        <div className="text-center py-8">
          <DollarSign className="mx-auto text-gray-300 mb-3" size={48} />
          <p className="text-gray-500 font-medium">No billing data available</p>
          <p className="text-sm text-gray-400 mt-2">Billing data has not been synced yet.</p>
          <p className="text-sm text-gray-400">Click the "Sync All" button above to fetch your AWS billing information.</p>
        </div>
      </div>
    );
  }

  // Calculate summary metrics
  const totalCost = billingData?.reduce((sum, item) => sum + (parseFloat(item?.cost) || 0), 0);
  const uniqueServices = [...new Set(billingData?.map(item => item?.serviceName))]?.length;
  const latestBillingPeriod = billingData?.[0];

  // Group by service for breakdown
  const serviceBreakdown = billingData?.reduce((acc, item) => {
    const service = item?.serviceName || 'Unknown';
    if (!acc?.[service]) {
      acc[service] = {
        serviceName: service,
        totalCost: 0,
        totalUsage: 0,
        usageUnit: item?.usageUnit || '',
        records: []
      };
    }
    acc[service].totalCost += parseFloat(item?.cost) || 0;
    acc[service].totalUsage += parseFloat(item?.usageAmount) || 0;
    acc?.[service]?.records?.push(item);
    return acc;
  }, {});

  const sortedServices = Object.values(serviceBreakdown)?.sort((a, b) => b?.totalCost - a?.totalCost);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
            <DollarSign className="text-green-600" size={24} />
            <span>AWS Billing Data</span>
          </h2>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="p-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-green-800">Total Cost</span>
                <DollarSign className="text-green-600" size={20} />
              </div>
              <p className="text-2xl font-bold text-green-900">
                ${totalCost?.toFixed(2)}
              </p>
              <p className="text-xs text-green-700 mt-1">
                {billingData?.length} billing records
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-800">Services</span>
                <TrendingUp className="text-blue-600" size={20} />
              </div>
              <p className="text-2xl font-bold text-blue-900">
                {uniqueServices}
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Active AWS services
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-purple-800">Latest Period</span>
                <Calendar className="text-purple-600" size={20} />
              </div>
              <p className="text-sm font-bold text-purple-900">
                {latestBillingPeriod?.usageStartDate ? 
                  new Date(latestBillingPeriod?.usageStartDate)?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}
              </p>
              <p className="text-xs text-purple-700 mt-1">
                to {latestBillingPeriod?.usageEndDate ? 
                  new Date(latestBillingPeriod?.usageEndDate)?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}
              </p>
            </div>
          </div>

          {/* Service Breakdown */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Cost Breakdown by Service</h3>
            <div className="space-y-3">
              {sortedServices?.map((service, index) => {
                const percentage = (service?.totalCost / totalCost) * 100;
                return (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{service?.serviceName}</h4>
                        <p className="text-sm text-gray-500">
                          {service?.totalUsage?.toFixed(2)} {service?.usageUnit} • {service?.records?.length} records
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">${service?.totalCost?.toFixed(2)}</p>
                        <p className="text-xs text-gray-500">{percentage?.toFixed(1)}%</p>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Billing History Table */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Billing History</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Service
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usage Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usage
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Period
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Region
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cost
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {billingData?.slice(0, 20)?.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">{item?.serviceName}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-gray-600">{item?.usageType || 'N/A'}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {item?.usageAmount ? parseFloat(item?.usageAmount)?.toFixed(2) : '0'} {item?.usageUnit}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-gray-600">
                          {item?.usageStartDate ? new Date(item?.usageStartDate)?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-gray-600">{item?.region || 'N/A'}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <span className="text-sm font-semibold text-gray-900">
                          ${item?.cost ? parseFloat(item?.cost)?.toFixed(2) : '0.00'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {billingData?.length > 20 && (
              <div className="mt-3 text-center">
                <p className="text-sm text-gray-500">
                  Showing 20 of {billingData?.length} records
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}