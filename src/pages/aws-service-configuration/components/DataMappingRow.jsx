import React from 'react';
import { cn } from '../../../utils/cn';

const DataMappingRow = ({ mapping, disabled }) => {
  const getTransformationBadge = (rule) => {
    const badges = {
      direct: { label: 'Direct', color: 'bg-blue-100 text-blue-800' },
      currency_conversion: { label: 'Currency', color: 'bg-green-100 text-green-800' },
      date_format: { label: 'Date Format', color: 'bg-purple-100 text-purple-800' },
      text_transform: { label: 'Text Transform', color: 'bg-orange-100 text-orange-800' }
    };
    return badges?.[rule] || { label: rule, color: 'bg-gray-100 text-gray-800' };
  };

  const badge = getTransformationBadge(mapping?.transformationRule);

  return (
    <div
      className={cn(
        "grid grid-cols-12 gap-4 py-3 px-4 rounded-lg hover:bg-muted/50 transition-colors",
        disabled && "opacity-50"
      )}
    >
      {/* AWS Field */}
      <div className="col-span-4 flex items-center">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary"></div>
          <span className="text-sm font-mono text-foreground">
            {mapping?.awsFieldName}
          </span>
        </div>
      </div>

      {/* Arrow */}
      <div className="col-span-1 flex items-center justify-center">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground">
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </div>

      {/* Contract Manager Field */}
      <div className="col-span-4 flex items-center">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-success"></div>
          <span className="text-sm font-mono text-foreground">
            {mapping?.contractManagerField}
          </span>
        </div>
      </div>

      {/* Transformation Rule */}
      <div className="col-span-3 flex items-center">
        <span className={cn(
          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
          badge?.color
        )}>
          {badge?.label}
        </span>
      </div>
    </div>
  );
};

export default DataMappingRow;