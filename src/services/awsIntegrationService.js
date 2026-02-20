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

export const awsIntegrationService = {
  async getAll() {
    const { data: { user } } = await supabase?.auth?.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      ?.from('aws_integrations')
      ?.select('*')
      ?.eq('user_id', user?.id)
      ?.order('created_at', { ascending: false });

    if (error) throw error;
    return toCamelCase(data);
  },

  async getById(id) {
    const { data: { user } } = await supabase?.auth?.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      ?.from('aws_integrations')
      ?.select('*')
      ?.eq('id', id)
      ?.eq('user_id', user?.id)
      ?.single();

    if (error) throw error;
    return toCamelCase(data);
  },

  async generateCloudFormationSetup(accountName, awsRegion, permissions) {
    const { data: { user } } = await supabase?.auth?.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase?.functions?.invoke('aws-iam-setup', {
      body: {
        action: 'generate-cloudformation',
        accountName,
        awsRegion,
        permissions
      }
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Failed to generate CloudFormation setup');
    
    return data;
  },

  async verifyRoleSetup(integrationId, roleArn) {
    const { data: { user } } = await supabase?.auth?.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase?.functions?.invoke('aws-iam-setup', {
      body: {
        action: 'verify-role',
        integrationId,
        roleArn
      }
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Failed to verify role setup');
    
    return toCamelCase(data?.integration);
  },

  async createManualIntegration(integrationData) {
    const { data: { user } } = await supabase?.auth?.getUser();
    if (!user) throw new Error('Not authenticated');

    if (!integrationData?.accessKeyId || !integrationData?.secretAccessKey) {
      throw new Error('Access Key ID and Secret Access Key are required');
    }

    if (!integrationData?.accessKeyId?.startsWith('AKIA')) {
      throw new Error('Invalid Access Key ID format');
    }

    const { data, error } = await supabase
      ?.from('aws_integrations')
      ?.insert({
        user_id: user?.id,
        account_name: integrationData?.accountName,
        aws_region: integrationData?.awsRegion,
        access_key_id: integrationData?.accessKeyId,
        secret_access_key_encrypted: integrationData?.secretAccessKey,
        connection_type: 'manual',
        connection_status: 'connected',
        permissions_contracts: integrationData?.permissions?.contracts ?? true,
        permissions_invoices: integrationData?.permissions?.invoices ?? true,
        permissions_marketplace: integrationData?.permissions?.marketplace ?? true,
        permissions_usage: integrationData?.permissions?.usage ?? true,
        created_at: new Date()?.toISOString()
      })
      ?.select()
      ?.single();

    if (error) throw error;
    return toCamelCase(data);
  },

  async create(integrationData) {
    const { data: { user } } = await supabase?.auth?.getUser();
    if (!user) throw new Error('Not authenticated');

    const snakeData = toSnakeCase(integrationData);
    const { data, error } = await supabase
      ?.from('aws_integrations')
      ?.insert({
        ...snakeData,
        user_id: user?.id
      })
      ?.select()
      ?.single();

    if (error) throw error;
    return toCamelCase(data);
  },

  async update(id, integrationData) {
    const { data: { user } } = await supabase?.auth?.getUser();
    if (!user) throw new Error('Not authenticated');

    const snakeData = toSnakeCase(integrationData);
    const { data, error } = await supabase
      ?.from('aws_integrations')
      ?.update(snakeData)
      ?.eq('id', id)
      ?.eq('user_id', user?.id)
      ?.select()
      ?.single();

    if (error) throw error;
    return toCamelCase(data);
  },

  async delete(id) {
    const { data: { user } } = await supabase?.auth?.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      ?.from('aws_integrations')
      ?.delete()
      ?.eq('id', id)
      ?.eq('user_id', user?.id);

    if (error) throw error;
  },

  async testConnection(id) {
    const { data: { user } } = await supabase?.auth?.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      ?.from('aws_integrations')
      ?.update({
        connection_status: 'validating',
        last_connection_test: new Date()?.toISOString()
      })
      ?.eq('id', id)
      ?.eq('user_id', user?.id)
      ?.select()
      ?.single();

    if (error) throw error;

    setTimeout(async () => {
      await supabase
        ?.from('aws_integrations')
        ?.update({
          connection_status: 'connected',
          connection_error: null
        })
        ?.eq('id', id)
        ?.eq('user_id', user?.id);
    }, 2000);

    return toCamelCase(data);
  },

  subscribeToChanges(callback) {
    const channel = supabase
      ?.channel('aws_integrations')
      ?.on('postgres_changes', 
        { event: '*', schema: 'public', table: 'aws_integrations' },
        (payload) => {
          callback(toCamelCase(payload));
        }
      )
      ?.subscribe();

    return () => supabase?.removeChannel(channel);
  }
};

export const awsSyncService = {
  async getSyncLogs(integrationId) {
    const { data: { user } } = await supabase?.auth?.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      ?.from('aws_sync_logs')
      ?.select('*')
      ?.eq('integration_id', integrationId)
      ?.eq('user_id', user?.id)
      ?.order('started_at', { ascending: false })
      ?.limit(50);

    if (error) throw error;
    return toCamelCase(data);
  },

  async getAllSyncLogs() {
    const { data: { user } } = await supabase?.auth?.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      ?.from('aws_sync_logs')
      ?.select('*')
      ?.eq('user_id', user?.id)
      ?.order('started_at', { ascending: false })
      ?.limit(100);

    if (error) throw error;
    return toCamelCase(data);
  },

  // -------------------------------------------------------------
  // CRITICAL FIX: Ensures 'Authorization' header is sent correctly
  // -------------------------------------------------------------
  async triggerManualSync(integrationId, dataType) {
    // 1. Force-get the latest session to ensure the token is fresh
    const { data: { session }, error: sessionError } = await supabase?.auth?.getSession();
    
    // Check if session exists and has a token
    if (sessionError || !session?.access_token) {
       throw new Error('Session expired. Please log out and log in again.');
    }

    try {
      console.log(`Starting sync for ${dataType}...`); 

      // 2. Pass the fresh token explicitly in the Authorization header
      const { data, error } = await supabase?.functions?.invoke('aws-data-sync', {
        body: { integrationId, dataType },
        headers: {
            Authorization: `Bearer ${session?.access_token}`
        }
      });

      // --- Error Handling Logic ---
      if (error) {
        console.error(`Edge Function raw error for ${dataType}:`, error);

        let errorMessage = `Failed to sync ${dataType}`;

        // Attempt to extract meaningful message from various error formats
        if (error?.context && typeof error?.context === 'object') {
             errorMessage = error?.context?.error || error?.context?.message || JSON.stringify(error?.context);
        } else if (typeof error?.context === 'string') {
            try {
                const parsed = JSON.parse(error?.context);
                errorMessage = parsed?.error || parsed?.message || error?.context;
            } catch (e) { errorMessage = error?.context; }
        } else if (error?.message) {
             errorMessage = error?.message;
        } else if (typeof error === 'object' && Object.keys(error)?.length === 0) {
             errorMessage = "Network/CORS Error: Edge Function crashed or timed out. Check Supabase Logs.";
        }
        
        throw new Error(errorMessage);
      }

      // Handle successful invocation but logical error returned in data
      if (data && data?.success === false) {
        throw new Error(data?.error || `Failed to sync ${dataType}`);
      }
      
      // Handle empty success
      if (!data) {
        return { success: true, message: `${dataType} sync completed` };
      }

      return data;

    } catch (err) {
      console.error(`FINAL Sync error for ${dataType}:`, err);
      // Ensure the UI gets a clean string message
      throw new Error(err instanceof Error ? err.message : String(err));
    }
  },

  subscribeToSyncLogs(callback) {
    const channel = supabase
      ?.channel('aws_sync_logs')
      ?.on('postgres_changes', 
        { event: '*', schema: 'public', table: 'aws_sync_logs' },
        (payload) => {
          callback(toCamelCase(payload));
        }
      )
      ?.subscribe();

    return () => supabase?.removeChannel(channel);
  }
};

export const awsMarketplaceService = {
  async getProducts(integrationId) {
    const { data: { user } } = await supabase?.auth?.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      ?.from('aws_marketplace_products')
      ?.select('*')
      ?.eq('integration_id', integrationId)
      ?.eq('user_id', user?.id)
      ?.order('synced_at', { ascending: false });

    if (error) throw error;
    return toCamelCase(data);
  },

  async getAllProducts() {
    const { data: { user } } = await supabase?.auth?.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      ?.from('aws_marketplace_products')
      ?.select('*')
      ?.eq('user_id', user?.id)
      ?.order('synced_at', { ascending: false });

    if (error) throw error;
    return toCamelCase(data);
  },

  async searchMarketplaceProducts(integrationId, searchQuery, productType = 'All', maxResults = 10) {
    const { data: { user } } = await supabase?.auth?.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase?.functions?.invoke('aws-marketplace-search', {
      body: {
        integrationId,
        searchQuery,
        productType,
        maxResults
      }
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Failed to search marketplace products');
    
    return data?.results || [];
  }
};

export const awsServiceUsageService = {
  async getUsage(integrationId, startDate, endDate) {
    const { data: { user } } = await supabase?.auth?.getUser();
    if (!user) throw new Error('Not authenticated');

    let query = supabase
      ?.from('aws_service_usage')
      ?.select('*')
      ?.eq('integration_id', integrationId)
      ?.eq('user_id', user?.id);

    if (startDate) {
      query = query?.gte('usage_start_date', startDate);
    }
    if (endDate) {
      query = query?.lte('usage_end_date', endDate);
    }

    const { data, error } = await query?.order('usage_start_date', { ascending: false });

    if (error) throw error;
    return toCamelCase(data);
  },

  async getAllUsage() {
    const { data: { user } } = await supabase?.auth?.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      ?.from('aws_service_usage')
      ?.select('*')
      ?.eq('user_id', user?.id)
      ?.order('usage_start_date', { ascending: false })
      ?.limit(100);

    if (error) throw error;
    return toCamelCase(data);
  }
};