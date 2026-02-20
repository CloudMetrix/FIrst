import React from 'react';
import { cn } from '../../../utils/cn';

const ServiceConfigPanel = ({
  serviceType,
  serviceLabel,
  serviceDescription,
  isEnabled,
  onToggle,
  onSelect,
  isSelected,
  disabled
}) => {
  const getServiceIcon = () => {
    const icons = {
      marketplace: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
      ),
      cost_explorer: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
      organizations: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      billing: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
          <line x1="1" y1="10" x2="23" y2="10" />
        </svg>
      )
    };
    return icons?.[serviceType] || null;
  };

  return (
    <div
      className={cn(
        "bg-card border rounded-lg p-6 transition-all cursor-pointer hover:shadow-md",
        isSelected && "border-primary ring-2 ring-primary/20",
        !isSelected && "border-border",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      onClick={() => !disabled && onSelect()}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-12 h-12 rounded-lg flex items-center justify-center",
            isEnabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
          )}>
            {getServiceIcon()}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">{serviceLabel}</h3>
            <p className="text-sm text-muted-foreground mt-1">{serviceDescription}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-border">
        <span className="text-sm font-medium text-foreground">
          {isEnabled ? 'Enabled' : 'Disabled'}
        </span>
        <button
          onClick={(e) => {
            e?.stopPropagation();
            if (!disabled) {
              onToggle(!isEnabled);
            }
          }}
          disabled={disabled}
          className={cn(
            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
            isEnabled ? "bg-primary" : "bg-muted",
            disabled && "cursor-not-allowed"
          )}
        >
          <span
            className={cn(
              "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
              isEnabled ? "translate-x-6" : "translate-x-1"
            )}
          />
        </button>
      </div>
    </div>
  );
};

export default ServiceConfigPanel;