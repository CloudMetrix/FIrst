import { supabase } from '../lib/supabase';

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

export const awsConfigService = {
  // Get all service configurations for current user
  async getServiceConfigurations() {
    const { data: { user } } = await supabase?.auth?.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      ?.from('aws_service_configurations')
      ?.select('*')
      ?.eq('user_id', user?.id)
      ?.order('service_type');

    if (error) throw error;
    return toCamelCase(data) || [];
  },

  // Get configuration for specific service
  async getServiceConfiguration(serviceType) {
    const { data: { user } } = await supabase?.auth?.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      ?.from('aws_service_configurations')
      ?.select('*')
      ?.eq('user_id', user?.id)
      ?.eq('service_type', serviceType)
      ?.single();

    if (error && error?.code !== 'PGRST116') throw error;
    return toCamelCase(data);
  },

  // Create or update service configuration
  async upsertServiceConfiguration(configData) {
    const { data: { user } } = await supabase?.auth?.getUser();
    if (!user) throw new Error('Not authenticated');

    const snakeData = toSnakeCase(configData);
    const { data, error } = await supabase
      ?.from('aws_service_configurations')
      ?.upsert({
        ...snakeData,
        user_id: user?.id,
        updated_at: new Date()?.toISOString()
      }, { onConflict: 'user_id,service_type' })
      ?.select()
      ?.single();

    if (error) throw error;
    return toCamelCase(data);
  },

  // Get data mappings for a service
  async getDataMappings(serviceType) {
    const { data: { user } } = await supabase?.auth?.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      ?.from('aws_data_mappings')
      ?.select('*')
      ?.eq('user_id', user?.id)
      ?.eq('service_type', serviceType)
      ?.eq('is_active', true)
      ?.order('aws_field_name');

    if (error) throw error;
    return toCamelCase(data) || [];
  },

  // Create or update data mapping
  async upsertDataMapping(mappingData) {
    const { data: { user } } = await supabase?.auth?.getUser();
    if (!user) throw new Error('Not authenticated');

    const snakeData = toSnakeCase(mappingData);
    const { data, error } = await supabase
      ?.from('aws_data_mappings')
      ?.upsert({
        ...snakeData,
        user_id: user?.id,
        updated_at: new Date()?.toISOString()
      })
      ?.select()
      ?.single();

    if (error) throw error;
    return toCamelCase(data);
  },

  // Delete data mapping
  async deleteDataMapping(mappingId) {
    const { data: { user } } = await supabase?.auth?.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      ?.from('aws_data_mappings')
      ?.delete()
      ?.eq('id', mappingId)
      ?.eq('user_id', user?.id);

    if (error) throw error;
  },

  // Reset to default configurations
  async resetToDefaults() {
    const { data: { user } } = await supabase?.auth?.getUser();
    if (!user) throw new Error('Not authenticated');

    // Delete existing configurations
    await supabase
      ?.from('aws_service_configurations')
      ?.delete()
      ?.eq('user_id', user?.id);

    await supabase
      ?.from('aws_data_mappings')
      ?.delete()
      ?.eq('user_id', user?.id);

    // Create default configurations
    const defaultConfigs = [
      { serviceType: 'marketplace', isEnabled: true, syncFrequency: 'daily' },
      { serviceType: 'cost_explorer', isEnabled: true, syncFrequency: 'hourly' },
      { serviceType: 'organizations', isEnabled: false, syncFrequency: 'daily' },
      { serviceType: 'billing', isEnabled: true, syncFrequency: 'daily' }
    ];

    for (const config of defaultConfigs) {
      await this.upsertServiceConfiguration(config);
    }

    return true;
  }
};