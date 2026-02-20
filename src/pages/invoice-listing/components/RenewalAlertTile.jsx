import React from 'react';
import Icon from '../../../components/AppIcon';

const RenewalAlertTile = ({ configurations, contract }) => {
  if (!configurations || configurations?.length === 0) {
    return null;
  }

  const formatDays = (days) => {
    return days?.sort((a, b) => a - b)?.join(', ');
  };

  return (
    <div className="bg-warning/10 border-l-4 border-warning rounded-lg p-4 mb-6">
      <div className="flex items-start space-x-3">
        <div className="w-10 h-10 bg-warning/20 rounded-md flex items-center justify-center flex-shrink-0">
          <Icon name="Bell" size={20} className="text-warning" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-foreground mb-1">
            Renewal Alerts Configured
          </h3>
          <p className="text-xs text-text-secondary mb-3">
            You will receive renewal alerts for this contract at the following intervals:
          </p>
          <div className="space-y-2">
            {configurations?.map((config, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Icon name="Mail" size={14} className="text-warning" />
                <span className="text-xs text-foreground">
                  <span className="font-medium">{config?.email}</span> will receive alerts{' '}
                  <span className="font-semibold">{formatDays(config?.alertDays)} days</span> before expiration
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RenewalAlertTile;