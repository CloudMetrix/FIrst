import React, { useState, useEffect } from 'react';
import Input from '../../../components/ui/Input';
import { cn } from '../../../utils/cn';

const SyncFrequencySettings = ({
  serviceType,
  serviceLabel,
  configuration,
  onUpdate,
  disabled
}) => {
  const [selectedFrequency, setSelectedFrequency] = useState('daily');
  const [customHours, setCustomHours] = useState('');

  useEffect(() => {
    if (configuration) {
      setSelectedFrequency(configuration?.syncFrequency || 'daily');
      setCustomHours(configuration?.customIntervalHours?.toString() || '');
    }
  }, [configuration]);

  const handleFrequencyChange = (frequency) => {
    setSelectedFrequency(frequency);
    if (frequency !== 'custom') {
      onUpdate(serviceType, frequency, null);
    }
  };

  const handleCustomHoursChange = (value) => {
    setCustomHours(value);
  };

  const handleCustomHoursBlur = () => {
    if (selectedFrequency === 'custom' && customHours) {
      const hours = parseInt(customHours, 10);
      if (hours > 0) {
        onUpdate(serviceType, 'custom', hours);
      }
    }
  };

  const frequencies = [
    { value: 'realtime', label: 'Real-time', description: 'Sync data as changes occur' },
    { value: 'hourly', label: 'Hourly', description: 'Sync every hour' },
    { value: 'daily', label: 'Daily', description: 'Sync once per day' },
    { value: 'custom', label: 'Custom', description: 'Set custom interval' }
  ];

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">
        Sync Frequency - {serviceLabel}
      </h3>
      <p className="text-sm text-muted-foreground mb-6">
        Choose how often data should be synchronized from AWS to Contract Manager
      </p>

      <div className="space-y-3">
        {frequencies?.map((freq) => (
          <div key={freq?.value}>
            <label
              className={cn(
                "flex items-start p-4 border rounded-lg cursor-pointer transition-all",
                selectedFrequency === freq?.value
                  ? "border-primary bg-primary/5" :"border-border hover:border-primary/50",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <input
                type="radio"
                name="sync-frequency"
                value={freq?.value}
                checked={selectedFrequency === freq?.value}
                onChange={() => !disabled && handleFrequencyChange(freq?.value)}
                disabled={disabled}
                className="mt-1 h-4 w-4 text-primary focus:ring-primary"
              />
              <div className="ml-3 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{freq?.label}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{freq?.description}</p>
              </div>
            </label>

            {freq?.value === 'custom' && selectedFrequency === 'custom' && (
              <div className="mt-3 ml-7">
                <Input
                  type="number"
                  label="Interval (hours)"
                  placeholder="Enter hours"
                  value={customHours}
                  onChange={(e) => handleCustomHoursChange(e?.target?.value)}
                  onBlur={handleCustomHoursBlur}
                  disabled={disabled}
                  min="1"
                  max="168"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SyncFrequencySettings;