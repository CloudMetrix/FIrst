import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { schemaService } from '../../services/supabaseService';
import Button from '../../components/ui/Button';
import { AppIcon } from '../../components/AppIcon';

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'decimal', label: 'Decimal' },
  { value: 'date', label: 'Date' },
  { value: 'datetime', label: 'Date & Time' },
  { value: 'boolean', label: 'Boolean (Yes/No)' },
  { value: 'email', label: 'Email' },
  { value: 'url', label: 'URL' },
  { value: 'phone', label: 'Phone' },
  { value: 'select', label: 'Dropdown (Select)' },
  { value: 'multiselect', label: 'Multi-Select' },
  { value: 'json', label: 'JSON' },
];

export default function SchemaManagement() {
  const navigate = useNavigate();
  const [schemas, setSchemas] = useState([]);
  const [selectedSchema, setSelectedSchema] = useState(null);
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFieldForm, setShowFieldForm] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [fieldForm, setFieldForm] = useState({
    fieldName: '',
    displayLabel: '',
    fieldType: 'text',
    isRequired: false,
    defaultValue: '',
    placeholder: '',
    helpText: '',
    fieldOrder: 0,
  });

  useEffect(() => {
    loadSchemas();
  }, []);

  useEffect(() => {
    if (selectedSchema) {
      loadSchemaDetails();
    }
  }, [selectedSchema]);

  const loadSchemas = async () => {
    try {
      setLoading(true);
      const data = await schemaService?.getAllSchemas();
      setSchemas(data || []);
      if (data?.length > 0 && !selectedSchema) {
        setSelectedSchema(data?.[0]);
      }
    } catch (err) {
      setError(err?.message || 'Failed to load schemas');
    } finally {
      setLoading(false);
    }
  };

  const loadSchemaDetails = async () => {
    try {
      const schemaWithFields = await schemaService?.getSchemaWithFields(selectedSchema?.entity_name);
      setFields(schemaWithFields?.fields || []);
    } catch (err) {
      setError(err?.message || 'Failed to load schema details');
    }
  };

  const handleAddField = () => {
    setEditingField(null);
    setFieldForm({
      fieldName: '',
      displayLabel: '',
      fieldType: 'text',
      isRequired: false,
      defaultValue: '',
      placeholder: '',
      helpText: '',
      fieldOrder: fields?.length || 0,
    });
    setShowFieldForm(true);
  };

  const handleEditField = (field) => {
    setEditingField(field);
    setFieldForm({
      fieldName: field?.fieldName || '',
      displayLabel: field?.displayLabel || '',
      fieldType: field?.fieldType || 'text',
      isRequired: field?.isRequired || false,
      defaultValue: field?.defaultValue || '',
      placeholder: field?.placeholder || '',
      helpText: field?.helpText || '',
      fieldOrder: field?.fieldOrder || 0,
    });
    setShowFieldForm(true);
  };

  const handleSaveField = async (e) => {
    e?.preventDefault();
    try {
      if (editingField) {
        await schemaService?.updateFieldDefinition(editingField?.id, fieldForm);
      } else {
        await schemaService?.createFieldDefinition({
          ...fieldForm,
          schemaId: selectedSchema?.id,
        });
      }
      setShowFieldForm(false);
      loadSchemaDetails();
    } catch (err) {
      setError(err?.message || 'Failed to save field');
    }
  };

  const handleDeleteField = async (fieldId) => {
    if (!window.confirm('Are you sure you want to delete this field?')) return;
    try {
      await schemaService?.deleteFieldDefinition(fieldId);
      loadSchemaDetails();
    } catch (err) {
      setError(err?.message || 'Failed to delete field');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading schema configurations...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Schema Management</h1>
            <p className="text-gray-600 mt-1">Configure dynamic fields for your entities</p>
          </div>
          <Button onClick={() => navigate('/contract-dashboard')} variant="outline">
            Back to Dashboard
          </Button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Schema List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Entities</h2>
              <div className="space-y-2">
                {schemas?.map((schema) => (
                  <button
                    key={schema?.id}
                    onClick={() => setSelectedSchema(schema)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                      selectedSchema?.id === schema?.id
                        ? 'bg-blue-50 border-2 border-blue-500 text-blue-700' :'bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="font-medium">{schema?.display_name}</div>
                    <div className="text-sm text-gray-500">{schema?.entity_name}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Field Configuration */}
          <div className="lg:col-span-2">
            {selectedSchema ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {selectedSchema?.display_name}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedSchema?.description || 'Configure fields for this entity'}
                    </p>
                  </div>
                  <Button onClick={handleAddField}>
                    <AppIcon name="Plus" className="w-4 h-4 mr-2" />
                    Add Field
                  </Button>
                </div>

                {/* Fields List */}
                <div className="space-y-3">
                  {fields?.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No fields configured yet. Add your first field to get started.
                    </div>
                  ) : (
                    fields?.map((field) => (
                      <div
                        key={field?.id}
                        className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-gray-900">
                                {field?.displayLabel}
                              </h3>
                              {field?.isRequired && (
                                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                                  Required
                                </span>
                              )}
                              {field?.isSystemField && (
                                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                                  System
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              Field: <code className="bg-gray-100 px-1 rounded">{field?.fieldName}</code>
                              {' • '}
                              Type: <span className="font-medium">{field?.fieldType}</span>
                            </div>
                            {field?.helpText && (
                              <p className="text-sm text-gray-500 mt-2">{field?.helpText}</p>
                            )}
                          </div>
                          {!field?.isSystemField && (
                            <div className="flex gap-2 ml-4">
                              <button
                                onClick={() => handleEditField(field)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                <AppIcon name="Edit" className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteField(field?.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <AppIcon name="Trash2" className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <p className="text-gray-500">Select an entity to configure its fields</p>
              </div>
            )}
          </div>
        </div>

        {/* Field Form Modal */}
        {showFieldForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {editingField ? 'Edit Field' : 'Add New Field'}
                  </h3>
                  <button
                    onClick={() => setShowFieldForm(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <AppIcon name="X" className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSaveField} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Field Name *
                      </label>
                      <input
                        type="text"
                        required
                        disabled={!!editingField}
                        value={fieldForm?.fieldName}
                        onChange={(e) =>
                          setFieldForm({ ...fieldForm, fieldName: e?.target?.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                        placeholder="e.g., custom_field_1"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Display Label *
                      </label>
                      <input
                        type="text"
                        required
                        value={fieldForm?.displayLabel}
                        onChange={(e) =>
                          setFieldForm({ ...fieldForm, displayLabel: e?.target?.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Custom Field 1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Field Type *
                      </label>
                      <select
                        required
                        value={fieldForm?.fieldType}
                        onChange={(e) =>
                          setFieldForm({ ...fieldForm, fieldType: e?.target?.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {FIELD_TYPES?.map((type) => (
                          <option key={type?.value} value={type?.value}>
                            {type?.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Field Order
                      </label>
                      <input
                        type="number"
                        value={fieldForm?.fieldOrder}
                        onChange={(e) =>
                          setFieldForm({ ...fieldForm, fieldOrder: parseInt(e?.target?.value) })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Placeholder
                    </label>
                    <input
                      type="text"
                      value={fieldForm?.placeholder}
                      onChange={(e) =>
                        setFieldForm({ ...fieldForm, placeholder: e?.target?.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter placeholder text"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Default Value
                    </label>
                    <input
                      type="text"
                      value={fieldForm?.defaultValue}
                      onChange={(e) =>
                        setFieldForm({ ...fieldForm, defaultValue: e?.target?.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter default value"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Help Text
                    </label>
                    <textarea
                      value={fieldForm?.helpText}
                      onChange={(e) =>
                        setFieldForm({ ...fieldForm, helpText: e?.target?.value })
                      }
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter help text for this field"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isRequired"
                      checked={fieldForm?.isRequired}
                      onChange={(e) =>
                        setFieldForm({ ...fieldForm, isRequired: e?.target?.checked })
                      }
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="isRequired" className="ml-2 text-sm text-gray-700">
                      This field is required
                    </label>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button type="submit" className="flex-1">
                      {editingField ? 'Update Field' : 'Add Field'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowFieldForm(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}