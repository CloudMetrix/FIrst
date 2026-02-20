import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ValidationRule {
  type: string;
  value?: any;
  message?: string;
}

interface FieldDefinition {
  fieldName: string;
  displayLabel: string;
  fieldType: string;
  isRequired: boolean;
  validationRules: ValidationRule[];
  fieldOptions?: any;
}

interface SchemaValidationRequest {
  entityName: string; // Add missing semicolon
  data: Record<string, any>; // Add missing semicolon
}

interface SchemaOperationRequest {
  operation: 'create' | 'update' | 'delete' | 'get'; // Add missing semicolon
  entityName?: string; // Add missing semicolon
  schemaId?: string; // Add missing semicolon
  data?: any; // Add missing semicolon
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get authenticated user
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { action, ...payload } = await req.json();

    // Route to appropriate handler
    switch (action) {
      case 'validate':
        return await validateData(supabaseClient, user.id, payload as SchemaValidationRequest);
      case 'schema':
        return await handleSchemaOperation(supabaseClient, user.id, payload as SchemaOperationRequest);
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function validateData(
  supabaseClient: any,
  userId: string,
  request: SchemaValidationRequest
) {
  const { entityName, data } = request;

  // Get schema with fields
  const { data: schemaData, error: schemaError } = await supabaseClient
    .rpc('get_schema_with_fields', { entity_name_param: entityName });

  if (schemaError || !schemaData || schemaData.length === 0) {
    return new Response(
      JSON.stringify({ error: 'Schema not found', details: schemaError }),
      {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  const schema = schemaData[0];
  const fields: FieldDefinition[] = schema.fields || [];
  const errors: Record<string, string[]> = {};

  // Validate each field
  for (const field of fields) {
    const fieldErrors: string[] = [];
    const value = data[field.fieldName];

    // Check required fields
    if (field.isRequired && (value === undefined || value === null || value === '')) {
      fieldErrors.push(`${field.displayLabel} is required`);
    }

    // Type validation
    if (value !== undefined && value !== null && value !== '') {
      switch (field.fieldType) {
        case 'number': 
        case 'decimal':
          if (isNaN(Number(value))) {
            fieldErrors.push(`${field.displayLabel} must be a valid number`);
          }
          break;
        case 'email':
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(String(value))) {
            fieldErrors.push(`${field.displayLabel} must be a valid email address`);
          }
          break;
        case 'url':
          try {
            new URL(String(value));
          } catch {
            fieldErrors.push(`${field.displayLabel} must be a valid URL`);
          }
          break;
        case 'date': 
        case 'datetime':
          if (isNaN(Date.parse(String(value)))) {
            fieldErrors.push(`${field.displayLabel} must be a valid date`);
          }
          break;
        case 'boolean':
          if (typeof value !== 'boolean') {
            fieldErrors.push(`${field.displayLabel} must be true or false`);
          }
          break;
      }
    }

    // Custom validation rules
    if (field.validationRules && Array.isArray(field.validationRules)) {
      for (const rule of field.validationRules) {
        if (value !== undefined && value !== null && value !== '') {
          switch (rule.type) {
            case 'min_length':
              if (String(value).length < rule.value) {
                fieldErrors.push(
                  rule.message || `${field.displayLabel} must be at least ${rule.value} characters`
                );
              }
              break;
            case 'max_length':
              if (String(value).length > rule.value) {
                fieldErrors.push(
                  rule.message || `${field.displayLabel} must be at most ${rule.value} characters`
                );
              }
              break;
            case 'min_value':
              if (Number(value) < rule.value) {
                fieldErrors.push(
                  rule.message || `${field.displayLabel} must be at least ${rule.value}`
                );
              }
              break;
            case 'max_value':
              if (Number(value) > rule.value) {
                fieldErrors.push(
                  rule.message || `${field.displayLabel} must be at most ${rule.value}`
                );
              }
              break;
            case 'pattern':
              const regex = new RegExp(rule.value);
              if (!regex.test(String(value))) {
                fieldErrors.push(
                  rule.message || `${field.displayLabel} format is invalid`
                );
              }
              break;
          }
        }
      }
    }

    if (fieldErrors.length > 0) {
      errors[field.fieldName] = fieldErrors;
    }
  }

  const isValid = Object.keys(errors).length === 0;

  return new Response(
    JSON.stringify({
      valid: isValid,
      errors: isValid ? null : errors,
      schema: {
        entityName: schema.entity_name,
        displayName: schema.display_name,
        allowCustomFields: schema.allow_custom_fields,
      },
    }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

async function handleSchemaOperation(
  supabaseClient: any,
  userId: string,
  request: SchemaOperationRequest
) {
  const { operation, entityName, schemaId, data } = request;

  switch (operation) {
    case 'get':
      if (entityName) {
        const { data: schemaData, error } = await supabaseClient
          .rpc('get_schema_with_fields', { entity_name_param: entityName });

        if (error) {
          return new Response(
            JSON.stringify({ error: 'Failed to fetch schema', details: error }),
            {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        return new Response(
          JSON.stringify({ data: schemaData[0] || null }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      } else {
        // Get all schemas
        const { data: schemas, error } = await supabaseClient
          .from('schema_configurations')
          .select('*')
          .eq('user_id', userId)
          .eq('is_active', true);

        if (error) {
          return new Response(
            JSON.stringify({ error: 'Failed to fetch schemas', details: error }),
            {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        return new Response(
          JSON.stringify({ data: schemas }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

    case 'create':
      // Create new schema configuration
      const { data: newSchema, error: createError } = await supabaseClient
        .from('schema_configurations')
        .insert({
          ...data,
          user_id: userId,
          created_by: userId,
        })
        .select()
        .single();

      if (createError) {
        return new Response(
          JSON.stringify({ error: 'Failed to create schema', details: createError }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({ data: newSchema }),
        {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );

    case 'update':
      if (!schemaId) {
        return new Response(
          JSON.stringify({ error: 'Schema ID is required for update' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const { data: updatedSchema, error: updateError } = await supabaseClient
        .from('schema_configurations')
        .update(data)
        .eq('id', schemaId)
        .eq('user_id', userId)
        .select()
        .single();

      if (updateError) {
        return new Response(
          JSON.stringify({ error: 'Failed to update schema', details: updateError }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({ data: updatedSchema }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );

    case 'delete':
      if (!schemaId) {
        return new Response(
          JSON.stringify({ error: 'Schema ID is required for delete' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const { error: deleteError } = await supabaseClient
        .from('schema_configurations')
        .update({ is_active: false })
        .eq('id', schemaId)
        .eq('user_id', userId);

      if (deleteError) {
        return new Response(
          JSON.stringify({ error: 'Failed to delete schema', details: deleteError }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({ success: true }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );

    default:
      return new Response(
        JSON.stringify({ error: 'Invalid operation' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
  }
}