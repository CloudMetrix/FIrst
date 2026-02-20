import React, { useState, useEffect } from 'react';
import { schemaService } from '../services/supabaseService';

export default function DynamicFieldRenderer({ entityName, entityId, onFieldsChange }) {
  const [schema, setSchema] = useState(null);
  const [dynamicValues, setDynamicValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSchema();
    if (entityId) {
      loadDynamicValues();
    }
  }, [entityName, entityId]);

  const loadSchema = async () => {
    try {
      setLoading(true);
      const schemaData = await schemaService.getSchemaWithFields(entityName);
      setSchema(schemaData);
    } catch (err) {
      setError(err?.message || 'Failed to load schema');
    } finally {
      setLoading(false);
    }
  };

  const loadDynamicValues = async () => {
    try {
      const values = await schemaService.getDynamicFieldValues(entityName, entityId);
      const valuesMap = {};
      values?.forEach((v) => {
        valuesMap[v?.field_name] = v?.field_value;
      });
      setDynamicValues(valuesMap);
    } catch (err) {
      console.error('Failed to load dynamic values:', err);
    }
  };

  const handleFieldChange = (fieldName, value) => {
    const updatedValues = { ...dynamicValues, [fieldName]: value };
    setDynamicValues(updatedValues);
    if (onFieldsChange) {
      onFieldsChange(updatedValues);
    }
  };

  const renderField = (field) => {
    const value = dynamicValues[field?.fieldName] || field?.defaultValue || '';

    const baseInputClasses =
      'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent';

    switch (field?.fieldType) {
      case 'text': case'email': case'url': case'phone':
        return (
          <input
            type={field?.fieldType === 'text' ? 'text' : field?.fieldType}
            value={value}
            onChange={(e) => handleFieldChange(field?.fieldName, e.target.value)}
            placeholder={field?.placeholder}
            required={field?.isRequired}
            className={baseInputClasses}
          />
        );

      case 'number': case'decimal':
        return (
          <input
            type="number"
            step={field?.fieldType === 'decimal' ? '0.01' : '1'}
            value={value}
            onChange={(e) => handleFieldChange(field?.fieldName, e.target.value)}
            placeholder={field?.placeholder}
            required={field?.isRequired}
            className={baseInputClasses}
          />
        );

      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleFieldChange(field?.fieldName, e.target.value)}
            required={field?.isRequired}
            className={baseInputClasses}
          />
        );

      case 'datetime':
        return (
          <input
            type="datetime-local"
            value={value}
            onChange={(e) => handleFieldChange(field?.fieldName, e.target.value)}
            required={field?.isRequired}
            className={baseInputClasses}
          />
        );

      case 'boolean':
        return (
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={value === true || value === 'true'}
              onChange={(e) => handleFieldChange(field?.fieldName, e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label className="ml-2 text-sm text-gray-700">
              {field?.placeholder || 'Yes'}
            </label>
          </div>
        );

      case 'select':
        const selectOptions = field?.fieldOptions?.options || [];
        return (
          <select
            value={value}
            onChange={(e) => handleFieldChange(field?.fieldName, e.target.value)}
            required={field?.isRequired}
            className={baseInputClasses}
          >
            <option value="">{field?.placeholder || 'Select an option'}</option>
            {selectOptions?.map((option, idx) => (
              <option key={idx} value={option?.value || option}>
                {option?.label || option}
              </option>
            ))}
          </select>
        );

      case 'json':
        return (
          <textarea
            value={typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                handleFieldChange(field?.fieldName, parsed);
              } catch {
                handleFieldChange(field?.fieldName, e.target.value);
              }
            }}
            placeholder={field?.placeholder}
            required={field?.isRequired}
            rows={4}
            className={baseInputClasses}
          />
        );

      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(field?.fieldName, e.target.value)}
            placeholder={field?.placeholder}
            required={field?.isRequired}
            className={baseInputClasses}
          />
        );
    }
  };

  if (loading) {
    return <div className="text-gray-500 text-sm">Loading custom fields...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-sm">Error: {error}</div>;
  }

  const customFields = schema?.fields?.filter((f) => !f?.isSystemField) || [];

  if (customFields?.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="border-t border-gray-200 pt-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Custom Fields</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {customFields?.map((field) => (
            <div key={field?.id}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field?.displayLabel}
                {field?.isRequired && <span className="text-red-500 ml-1">*</span>}
              </label>
              {renderField(field)}
              {field?.helpText && (
                <p className="text-xs text-gray-500 mt-1">{field?.helpText}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}