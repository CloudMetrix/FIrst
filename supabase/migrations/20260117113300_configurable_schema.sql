-- Configurable Schema System Migration
-- Migration: 20260117113300_configurable_schema.sql
-- Purpose: Enable dynamic schema configuration for all entities

-- 1. Create custom types for field configuration
CREATE TYPE public.field_data_type AS ENUM (
  'text',
  'number',
  'decimal',
  'date',
  'datetime',
  'boolean',
  'email',
  'url',
  'phone',
  'select',
  'multiselect',
  'json'
);

CREATE TYPE public.validation_rule_type AS ENUM (
  'required',
  'min_length',
  'max_length',
  'min_value',
  'max_value',
  'pattern',
  'email',
  'url',
  'custom'
);

-- 2. Create schema_configurations table
CREATE TABLE public.schema_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  allow_custom_fields BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_by UUID,
  user_id UUID NOT NULL
);

-- 3. Create field_definitions table
CREATE TABLE public.field_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schema_id UUID REFERENCES public.schema_configurations(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  display_label TEXT NOT NULL,
  field_type public.field_data_type NOT NULL,
  is_required BOOLEAN DEFAULT false,
  is_system_field BOOLEAN DEFAULT false,
  default_value TEXT,
  placeholder TEXT,
  help_text TEXT,
  field_order INTEGER DEFAULT 0,
  validation_rules JSONB DEFAULT '[]'::jsonb,
  field_options JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  user_id UUID NOT NULL,
  UNIQUE(schema_id, field_name)
);

-- 4. Create dynamic_field_values table for storing custom field data
CREATE TABLE public.dynamic_field_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_name TEXT NOT NULL,
  entity_id UUID NOT NULL,
  field_name TEXT NOT NULL,
  field_value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  user_id UUID NOT NULL,
  UNIQUE(entity_name, entity_id, field_name)
);

-- 5. Create indexes
CREATE INDEX idx_schema_configurations_entity_name ON public.schema_configurations(entity_name);
CREATE INDEX idx_schema_configurations_user_id ON public.schema_configurations(user_id);
CREATE INDEX idx_field_definitions_schema_id ON public.field_definitions(schema_id);
CREATE INDEX idx_field_definitions_field_name ON public.field_definitions(field_name);
CREATE INDEX idx_field_definitions_user_id ON public.field_definitions(user_id);
CREATE INDEX idx_dynamic_field_values_entity ON public.dynamic_field_values(entity_name, entity_id);
CREATE INDEX idx_dynamic_field_values_user_id ON public.dynamic_field_values(user_id);

-- 6. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_schema_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

-- 7. Create function to get schema with fields
CREATE OR REPLACE FUNCTION public.get_schema_with_fields(entity_name_param TEXT)
RETURNS TABLE(
    schema_id UUID,
    entity_name TEXT,
    display_name TEXT,
    description TEXT,
    is_active BOOLEAN,
    allow_custom_fields BOOLEAN,
    fields JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sc.id,
        sc.entity_name,
        sc.display_name,
        sc.description,
        sc.is_active,
        sc.allow_custom_fields,
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'id', fd.id,
                    'fieldName', fd.field_name,
                    'displayLabel', fd.display_label,
                    'fieldType', fd.field_type,
                    'isRequired', fd.is_required,
                    'isSystemField', fd.is_system_field,
                    'defaultValue', fd.default_value,
                    'placeholder', fd.placeholder,
                    'helpText', fd.help_text,
                    'fieldOrder', fd.field_order,
                    'validationRules', fd.validation_rules,
                    'fieldOptions', fd.field_options,
                    'isActive', fd.is_active
                ) ORDER BY fd.field_order, fd.created_at
            ) FILTER (WHERE fd.id IS NOT NULL),
            '[]'::jsonb
        ) as fields
    FROM public.schema_configurations sc
    LEFT JOIN public.field_definitions fd ON sc.id = fd.schema_id AND fd.is_active = true
    WHERE sc.entity_name = entity_name_param AND sc.is_active = true
    GROUP BY sc.id, sc.entity_name, sc.display_name, sc.description, sc.is_active, sc.allow_custom_fields;
END;
$$;

-- 8. Create function to validate field value against schema
CREATE OR REPLACE FUNCTION public.validate_field_value(
    entity_name_param TEXT,
    field_name_param TEXT,
    field_value_param JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    field_def RECORD;
    validation_rule JSONB;
BEGIN
    -- Get field definition
    SELECT fd.* INTO field_def
    FROM public.field_definitions fd
    JOIN public.schema_configurations sc ON fd.schema_id = sc.id
    WHERE sc.entity_name = entity_name_param 
      AND fd.field_name = field_name_param 
      AND fd.is_active = true
      AND sc.is_active = true;
    
    -- If field not found, check if custom fields are allowed
    IF NOT FOUND THEN
        RETURN EXISTS (
            SELECT 1 FROM public.schema_configurations
            WHERE entity_name = entity_name_param 
              AND allow_custom_fields = true 
              AND is_active = true
        );
    END IF;
    
    -- Check if required field has value
    IF field_def.is_required AND (field_value_param IS NULL OR field_value_param = 'null'::jsonb) THEN
        RETURN false;
    END IF;
    
    -- Additional validation rules can be implemented here
    -- For now, return true if basic checks pass
    RETURN true;
END;
$$;

-- 9. Enable RLS
ALTER TABLE public.schema_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.field_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dynamic_field_values ENABLE ROW LEVEL SECURITY;

-- 10. Create RLS policies
CREATE POLICY "users_manage_own_schema_configurations"
ON public.schema_configurations
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_manage_own_field_definitions"
ON public.field_definitions
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_manage_own_dynamic_field_values"
ON public.dynamic_field_values
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 11. Create triggers
CREATE TRIGGER update_schema_configurations_updated_at
    BEFORE UPDATE ON public.schema_configurations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_schema_updated_at();

CREATE TRIGGER update_field_definitions_updated_at
    BEFORE UPDATE ON public.field_definitions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_schema_updated_at();

CREATE TRIGGER update_dynamic_field_values_updated_at
    BEFORE UPDATE ON public.dynamic_field_values
    FOR EACH ROW
    EXECUTE FUNCTION public.update_schema_updated_at();

-- 12. Insert default schema configurations for existing entities
DO $$
DECLARE
    admin_user_id UUID := gen_random_uuid();
    contracts_schema_id UUID := gen_random_uuid();
    invoices_schema_id UUID := gen_random_uuid();
    alerts_schema_id UUID := gen_random_uuid();
BEGIN
    -- Create schema configuration for contracts
    INSERT INTO public.schema_configurations (id, entity_name, display_name, description, allow_custom_fields, user_id, created_by)
    VALUES (
        contracts_schema_id,
        'contracts',
        'Contracts',
        'Contract management schema with configurable fields',
        true,
        admin_user_id,
        admin_user_id
    );
    
    -- Create field definitions for contracts (system fields)
    INSERT INTO public.field_definitions (schema_id, field_name, display_label, field_type, is_required, is_system_field, field_order, user_id)
    VALUES
        (contracts_schema_id, 'name', 'Contract Name', 'text'::public.field_data_type, true, true, 1, admin_user_id),
        (contracts_schema_id, 'client', 'Client', 'text'::public.field_data_type, true, true, 2, admin_user_id),
        (contracts_schema_id, 'value', 'Contract Value', 'decimal'::public.field_data_type, true, true, 3, admin_user_id),
        (contracts_schema_id, 'start_date', 'Start Date', 'date'::public.field_data_type, true, true, 4, admin_user_id),
        (contracts_schema_id, 'end_date', 'End Date', 'date'::public.field_data_type, true, true, 5, admin_user_id),
        (contracts_schema_id, 'length', 'Contract Length', 'text'::public.field_data_type, true, true, 6, admin_user_id),
        (contracts_schema_id, 'status', 'Status', 'select'::public.field_data_type, false, true, 7, admin_user_id),
        (contracts_schema_id, 'remaining_amount', 'Remaining Amount', 'decimal'::public.field_data_type, true, true, 8, admin_user_id),
        (contracts_schema_id, 'provider_type', 'Provider Type', 'select'::public.field_data_type, true, true, 9, admin_user_id);
    
    -- Create schema configuration for invoices
    INSERT INTO public.schema_configurations (id, entity_name, display_name, description, allow_custom_fields, user_id, created_by)
    VALUES (
        invoices_schema_id,
        'invoices',
        'Invoices',
        'Invoice management schema with configurable fields',
        true,
        admin_user_id,
        admin_user_id
    );
    
    -- Create field definitions for invoices (system fields)
    INSERT INTO public.field_definitions (schema_id, field_name, display_label, field_type, is_required, is_system_field, field_order, user_id)
    VALUES
        (invoices_schema_id, 'invoice_number', 'Invoice Number', 'text'::public.field_data_type, true, true, 1, admin_user_id),
        (invoices_schema_id, 'date', 'Invoice Date', 'date'::public.field_data_type, true, true, 2, admin_user_id),
        (invoices_schema_id, 'amount', 'Amount', 'decimal'::public.field_data_type, true, true, 3, admin_user_id),
        (invoices_schema_id, 'status', 'Status', 'select'::public.field_data_type, false, true, 4, admin_user_id);
    
    -- Create schema configuration for alert configurations
    INSERT INTO public.schema_configurations (id, entity_name, display_name, description, allow_custom_fields, user_id, created_by)
    VALUES (
        alerts_schema_id,
        'alert_configurations',
        'Alert Configurations',
        'Alert configuration schema with configurable fields',
        true,
        admin_user_id,
        admin_user_id
    );
    
    -- Create field definitions for alert configurations (system fields)
    INSERT INTO public.field_definitions (schema_id, field_name, display_label, field_type, is_required, is_system_field, field_order, user_id)
    VALUES
        (alerts_schema_id, 'email', 'Email Address', 'email'::public.field_data_type, true, true, 1, admin_user_id),
        (alerts_schema_id, 'alert_interval', 'Alert Interval (days)', 'select'::public.field_data_type, true, true, 2, admin_user_id);
    
    RAISE NOTICE 'Default schema configurations created successfully';
END $$;