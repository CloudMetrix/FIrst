import { supabase } from '../lib/supabase';

// Schema Configuration Service
export const schemaService = {
  // Get schema configuration with fields
  async getSchemaWithFields(entityName) {
    const { data, error } = await supabase?.rpc('get_schema_with_fields', {
      entity_name_param: entityName,
    });

    if (error) throw error;
    return data?.[0] || null;
  },

  // Get all schema configurations
  async getAllSchemas() {
    const { data, error } = await supabase?.from('schema_configurations')?.select('*')?.eq('is_active', true)?.order('entity_name');

    if (error) throw error;
    return data;
  },

  // Create new schema configuration
  async createSchema(schemaData) {
    const user = await supabase?.auth?.getUser();
    if (!user?.data?.user) throw new Error('User not authenticated');

    const { data, error } = await supabase?.from('schema_configurations')?.insert({
        entity_name: schemaData?.entityName,
        display_name: schemaData?.displayName,
        description: schemaData?.description,
        allow_custom_fields: schemaData?.allowCustomFields ?? true,
        user_id: user?.data?.user?.id,
        created_by: user?.data?.user?.id,
      })?.select()?.single();

    if (error) throw error;
    return data;
  },

  // Update schema configuration
  async updateSchema(schemaId, updates) {
    const { data, error } = await supabase?.from('schema_configurations')?.update({
        display_name: updates?.displayName,
        description: updates?.description,
        allow_custom_fields: updates?.allowCustomFields,
      })?.eq('id', schemaId)?.select()?.single();

    if (error) throw error;
    return data;
  },

  // Delete schema configuration (soft delete)
  async deleteSchema(schemaId) {
    const { error } = await supabase?.from('schema_configurations')?.update({ is_active: false })?.eq('id', schemaId);

    if (error) throw error;
    return true;
  },

  // Field Definitions
  async getFieldDefinitions(schemaId) {
    const { data, error } = await supabase?.from('field_definitions')?.select('*')?.eq('schema_id', schemaId)?.eq('is_active', true)?.order('field_order');

    if (error) throw error;
    return data;
  },

  async createFieldDefinition(fieldData) {
    const user = await supabase?.auth?.getUser();
    if (!user?.data?.user) throw new Error('User not authenticated');

    const { data, error } = await supabase?.from('field_definitions')?.insert({
        schema_id: fieldData?.schemaId,
        field_name: fieldData?.fieldName,
        display_label: fieldData?.displayLabel,
        field_type: fieldData?.fieldType,
        is_required: fieldData?.isRequired ?? false,
        is_system_field: fieldData?.isSystemField ?? false,
        default_value: fieldData?.defaultValue,
        placeholder: fieldData?.placeholder,
        help_text: fieldData?.helpText,
        field_order: fieldData?.fieldOrder ?? 0,
        validation_rules: fieldData?.validationRules ?? [],
        field_options: fieldData?.fieldOptions ?? {},
        user_id: user?.data?.user?.id,
      })?.select()?.single();

    if (error) throw error;
    return data;
  },

  async updateFieldDefinition(fieldId, updates) {
    const { data, error } = await supabase?.from('field_definitions')?.update({
        display_label: updates?.displayLabel,
        field_type: updates?.fieldType,
        is_required: updates?.isRequired,
        default_value: updates?.defaultValue,
        placeholder: updates?.placeholder,
        help_text: updates?.helpText,
        field_order: updates?.fieldOrder,
        validation_rules: updates?.validationRules,
        field_options: updates?.fieldOptions,
      })?.eq('id', fieldId)?.select()?.single();

    if (error) throw error;
    return data;
  },

  async deleteFieldDefinition(fieldId) {
    const { error } = await supabase?.from('field_definitions')?.update({ is_active: false })?.eq('id', fieldId);

    if (error) throw error;
    return true;
  },

  // Dynamic Field Values
  async getDynamicFieldValues(entityName, entityId) {
    const { data, error } = await supabase?.from('dynamic_field_values')?.select('*')?.eq('entity_name', entityName)?.eq('entity_id', entityId);

    if (error) throw error;
    return data;
  },

  async saveDynamicFieldValue(entityName, entityId, fieldName, fieldValue) {
    const user = await supabase?.auth?.getUser();
    if (!user?.data?.user) throw new Error('User not authenticated');

    const { data, error } = await supabase?.from('dynamic_field_values')?.upsert(
        {
          entity_name: entityName,
          entity_id: entityId,
          field_name: fieldName,
          field_value: fieldValue,
          user_id: user?.data?.user?.id,
        },
        { onConflict: 'entity_name,entity_id,field_name' }
      )?.select()?.single();

    if (error) throw error;
    return data;
  },

  // Validate data using Edge Function
  async validateData(entityName, data) {
    const { data: result, error } = await supabase?.functions?.invoke('schema-validator', {
      body: {
        action: 'validate',
        entityName,
        data,
      },
    });

    if (error) throw error;
    return result;
  },
};

// Helper function to convert snake_case to camelCase
const toCamelCase = (obj) => {
  if (!obj) return obj;
  if (Array.isArray(obj)) return obj?.map(toCamelCase);
  if (typeof obj !== 'object') return obj;

  return Object.keys(obj)?.reduce((acc, key) => {
    const camelKey = key?.replace(/_([a-z])/g, (_, letter) => letter?.toUpperCase());
    acc[camelKey] = toCamelCase(obj?.[key]);
    return acc;
  }, {});
};

// Helper function to convert camelCase to snake_case
const toSnakeCase = (obj) => {
  if (!obj) return obj;
  if (Array.isArray(obj)) return obj?.map(toSnakeCase);
  if (typeof obj !== 'object') return obj;

  return Object.keys(obj)?.reduce((acc, key) => {
    const snakeKey = key?.replace(/[A-Z]/g, (letter) => `_${letter?.toLowerCase()}`);
    acc[snakeKey] = toSnakeCase(obj?.[key]);
    return acc;
  }, {});
};

export const contractService = {
  async getAll() {
    const { data: { user } } = await supabase?.auth?.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase?.from('contracts')?.select('*')?.eq('user_id', user?.id)?.order('created_at', { ascending: false });

    if (error) throw error;
    return toCamelCase(data);
  },

  async getById(id) {
    const { data: { user } } = await supabase?.auth?.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase?.from('contracts')?.select('*')?.eq('id', id)?.eq('user_id', user?.id)?.single();

    if (error) throw error;
    return toCamelCase(data);
  },

  async create(contractData) {
    const { data: { user } } = await supabase?.auth?.getUser();
    if (!user) throw new Error('Not authenticated');

    const snakeData = toSnakeCase(contractData);
    const { data, error } = await supabase?.from('contracts')?.insert({
        ...snakeData,
        user_id: user?.id
      })?.select()?.single();

    if (error) throw error;
    return toCamelCase(data);
  },

  async update(id, contractData) {
    const { data: { user } } = await supabase?.auth?.getUser();
    if (!user) throw new Error('Not authenticated');

    const snakeData = toSnakeCase(contractData);
    const { data, error } = await supabase?.from('contracts')?.update(snakeData)?.eq('id', id)?.eq('user_id', user?.id)?.select()?.single();

    if (error) throw error;
    return toCamelCase(data);
  },

  async delete(id) {
    const { data: { user } } = await supabase?.auth?.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase?.from('contracts')?.delete()?.eq('id', id)?.eq('user_id', user?.id);

    if (error) throw error;
  },

  subscribeToChanges(callback) {
    const channel = supabase?.channel('contracts')?.on('postgres_changes', 
        { event: '*', schema: 'public', table: 'contracts' },
        (payload) => {
          callback(toCamelCase(payload));
        }
      )?.subscribe();

    return () => supabase?.removeChannel(channel);
  }
};

export const invoiceService = {
  async getAll() {
    const { data: { user } } = await supabase?.auth?.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase?.from('invoices')?.select('*')?.eq('user_id', user?.id)?.order('created_at', { ascending: false });

    if (error) throw error;
    return toCamelCase(data);
  },

  async getById(id) {
    const { data: { user } } = await supabase?.auth?.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase?.from('invoices')?.select('*')?.eq('id', id)?.eq('user_id', user?.id)?.single();

    if (error) throw error;
    return toCamelCase(data);
  },

  async getByContractId(contractId) {
    const { data: { user } } = await supabase?.auth?.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase?.from('invoices')?.select('*')?.eq('contract_id', contractId)?.eq('user_id', user?.id)?.order('created_at', { ascending: false });

    if (error) throw error;
    return toCamelCase(data);
  },

  async create(invoiceData) {
    const { data: { user } } = await supabase?.auth?.getUser();
    if (!user) throw new Error('Not authenticated');

    const snakeData = toSnakeCase(invoiceData);
    const { data, error } = await supabase?.from('invoices')?.insert({
        ...snakeData,
        user_id: user?.id
      })?.select()?.single();

    if (error) throw error;
    return toCamelCase(data);
  },

  async update(id, invoiceData) {
    const { data: { user } } = await supabase?.auth?.getUser();
    if (!user) throw new Error('Not authenticated');

    const snakeData = toSnakeCase(invoiceData);
    const { data, error } = await supabase?.from('invoices')?.update(snakeData)?.eq('id', id)?.eq('user_id', user?.id)?.select()?.single();

    if (error) throw error;
    return toCamelCase(data);
  },

  async delete(id) {
    const { data: { user } } = await supabase?.auth?.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase?.from('invoices')?.delete()?.eq('id', id)?.eq('user_id', user?.id);

    if (error) throw error;
  },

  async checkDuplicateInvoiceNumber(invoiceNumber, contractId, excludeInvoiceId = null) {
    const { data: { user } } = await supabase?.auth?.getUser();
    if (!user) throw new Error('Not authenticated');

    let query = supabase?.from('invoices')?.select('id')?.eq('invoice_number', invoiceNumber)?.eq('contract_id', contractId)?.eq('user_id', user?.id);

    if (excludeInvoiceId) {
      query = query?.neq('id', excludeInvoiceId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data?.length > 0;
  },

  subscribeToChanges(contractId, callback) {
    const filter = contractId ? `contract_id=eq.${contractId}` : undefined;
    const channel = supabase?.channel(`invoices-${contractId || 'all'}`)?.on('postgres_changes', 
        { event: '*', schema: 'public', table: 'invoices', filter },
        (payload) => {
          callback(toCamelCase(payload));
        }
      )?.subscribe();

    return () => supabase?.removeChannel(channel);
  }
};

export const alertConfigService = {
  async getByContractId(contractId) {
    const { data: { user } } = await supabase?.auth?.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase?.from('alert_configurations')?.select('*')?.eq('contract_id', contractId)?.eq('user_id', user?.id);

    if (error) throw error;
    return toCamelCase(data);
  },

  async create(configData) {
    const { data: { user } } = await supabase?.auth?.getUser();
    if (!user) throw new Error('Not authenticated');

    const snakeData = toSnakeCase(configData);
    const { data, error } = await supabase?.from('alert_configurations')?.insert({
        ...snakeData,
        user_id: user?.id
      })?.select()?.single();

    if (error) throw error;
    return toCamelCase(data);
  },

  async delete(id) {
    const { data: { user } } = await supabase?.auth?.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase?.from('alert_configurations')?.delete()?.eq('id', id)?.eq('user_id', user?.id);

    if (error) throw error;
  }
};

export const alertHistoryService = {
  async getByContractId(contractId) {
    const { data: { user } } = await supabase?.auth?.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase?.from('alert_history')?.select('*')?.eq('contract_id', contractId)?.eq('user_id', user?.id)?.order('sent_at', { ascending: false });

    if (error) throw error;
    return toCamelCase(data);
  },

  async create(historyData) {
    const { data: { user } } = await supabase?.auth?.getUser();
    if (!user) throw new Error('Not authenticated');

    const snakeData = toSnakeCase(historyData);
    const { data, error } = await supabase?.from('alert_history')?.insert({
        ...snakeData,
        user_id: user?.id
      })?.select()?.single();

    if (error) throw error;
    return toCamelCase(data);
  },

  subscribeToChanges(contractId, callback) {
    const channel = supabase?.channel(`alert-history-${contractId}`)?.on('postgres_changes',
        { event: '*', schema: 'public', table: 'alert_history', filter: `contract_id=eq.${contractId}` },
        (payload) => {
          callback(toCamelCase(payload));
        }
      )?.subscribe();

    return () => supabase?.removeChannel(channel);
  }
};

// Storage Service for Invoice Documents
export const storageService = {
  async uploadInvoiceDocument(file, userId, invoiceNumber) {
    const fileExtension = file?.name?.split('.')?.pop();
    const timestamp = Date.now();
    const fileName = `${invoiceNumber}_${timestamp}.${fileExtension}`;
    const filePath = `${userId}/${fileName}`;

    const { data, error } = await supabase?.storage
      ?.from('invoice-documents')
      ?.upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;
    return { filePath: data?.path, fileName: file?.name, fileSize: file?.size };
  },

  async getInvoiceDocumentUrl(filePath) {
    const { data, error } = await supabase?.storage
      ?.from('invoice-documents')
      ?.createSignedUrl(filePath, 3600);

    if (error) throw error;
    return data?.signedUrl;
  },

  async deleteInvoiceDocument(filePath) {
    const { error } = await supabase?.storage
      ?.from('invoice-documents')
      ?.remove([filePath]);

    if (error) throw error;
    return true;
  }
};

export const documentService = {
  async getByContractId(contractId) {
    const { data: { user } } = await supabase?.auth?.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase?.from('contract_documents')?.select('*')?.eq('contract_id', contractId)?.eq('user_id', user?.id)?.order('uploaded_at', { ascending: false });

    if (error) throw error;
    return toCamelCase(data);
  },

  async create(documentData) {
    const { data: { user } } = await supabase?.auth?.getUser();
    if (!user) throw new Error('Not authenticated');

    const snakeData = toSnakeCase(documentData);
    const { data, error } = await supabase?.from('contract_documents')?.insert({
        ...snakeData,
        user_id: user?.id
      })?.select()?.single();

    if (error) throw error;
    return toCamelCase(data);
  },

  async delete(id) {
    const { data: { user } } = await supabase?.auth?.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase?.from('contract_documents')?.delete()?.eq('id', id)?.eq('user_id', user?.id);

    if (error) throw error;
  }
};