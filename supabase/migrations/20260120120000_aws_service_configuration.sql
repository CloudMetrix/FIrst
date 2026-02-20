-- AWS Service Configuration Migration
-- Stores user-specific AWS service sync configurations

-- Create enum for AWS services
CREATE TYPE public.aws_service_type AS ENUM (
  'marketplace',
  'cost_explorer',
  'organizations',
  'billing'
);

-- Create enum for sync frequency
CREATE TYPE public.sync_frequency AS ENUM (
  'realtime',
  'hourly',
  'daily',
  'custom'
);

-- AWS Service Configurations table
CREATE TABLE public.aws_service_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  service_type public.aws_service_type NOT NULL,
  is_enabled BOOLEAN DEFAULT false,
  sync_frequency public.sync_frequency DEFAULT 'daily'::public.sync_frequency,
  custom_interval_hours INTEGER,
  data_filters JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, service_type)
);

-- AWS Data Field Mappings table
CREATE TABLE public.aws_data_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  service_type public.aws_service_type NOT NULL,
  aws_field_name TEXT NOT NULL,
  contract_manager_field TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  transformation_rule TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_aws_service_configurations_user_id ON public.aws_service_configurations(user_id);
CREATE INDEX idx_aws_service_configurations_service_type ON public.aws_service_configurations(service_type);
CREATE INDEX idx_aws_data_mappings_user_id ON public.aws_data_mappings(user_id);
CREATE INDEX idx_aws_data_mappings_service_type ON public.aws_data_mappings(service_type);

-- Enable RLS
ALTER TABLE public.aws_service_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aws_data_mappings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for aws_service_configurations
CREATE POLICY "users_manage_own_aws_service_configurations"
ON public.aws_service_configurations
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- RLS Policies for aws_data_mappings
CREATE POLICY "users_manage_own_aws_data_mappings"
ON public.aws_data_mappings
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Mock data for AWS service configurations
DO $$
DECLARE
  existing_user_id UUID;
  marketplace_config_id UUID := gen_random_uuid();
  cost_explorer_config_id UUID := gen_random_uuid();
BEGIN
  -- Get existing user from user_profiles
  SELECT id INTO existing_user_id FROM public.user_profiles LIMIT 1;
  
  IF existing_user_id IS NOT NULL THEN
    -- Create default service configurations
    INSERT INTO public.aws_service_configurations (id, user_id, service_type, is_enabled, sync_frequency, data_filters)
    VALUES 
      (marketplace_config_id, existing_user_id, 'marketplace'::public.aws_service_type, true, 'daily'::public.sync_frequency, '{"regions": ["us-east-1", "us-west-2"], "include_archived": false}'::jsonb),
      (cost_explorer_config_id, existing_user_id, 'cost_explorer'::public.aws_service_type, true, 'hourly'::public.sync_frequency, '{"cost_threshold": 1000}'::jsonb),
      (gen_random_uuid(), existing_user_id, 'organizations'::public.aws_service_type, false, 'daily'::public.sync_frequency, '{}'::jsonb),
      (gen_random_uuid(), existing_user_id, 'billing'::public.aws_service_type, true, 'daily'::public.sync_frequency, '{"include_credits": true}'::jsonb);
    
    -- Create default data mappings for marketplace
    INSERT INTO public.aws_data_mappings (user_id, service_type, aws_field_name, contract_manager_field, is_active, transformation_rule)
    VALUES 
      (existing_user_id, 'marketplace'::public.aws_service_type, 'product_id', 'contract_id', true, 'direct'),
      (existing_user_id, 'marketplace'::public.aws_service_type, 'product_name', 'name', true, 'direct'),
      (existing_user_id, 'marketplace'::public.aws_service_type, 'monthly_cost', 'value', true, 'currency_conversion'),
      (existing_user_id, 'marketplace'::public.aws_service_type, 'subscription_start', 'start_date', true, 'date_format'),
      (existing_user_id, 'marketplace'::public.aws_service_type, 'subscription_end', 'end_date', true, 'date_format');
    
    -- Create default data mappings for cost explorer
    INSERT INTO public.aws_data_mappings (user_id, service_type, aws_field_name, contract_manager_field, is_active, transformation_rule)
    VALUES 
      (existing_user_id, 'cost_explorer'::public.aws_service_type, 'service_name', 'client', true, 'direct'),
      (existing_user_id, 'cost_explorer'::public.aws_service_type, 'total_cost', 'value', true, 'currency_conversion'),
      (existing_user_id, 'cost_explorer'::public.aws_service_type, 'usage_start_date', 'start_date', true, 'date_format');
    
    -- Create default data mappings for billing
    INSERT INTO public.aws_data_mappings (user_id, service_type, aws_field_name, contract_manager_field, is_active, transformation_rule)
    VALUES 
      (existing_user_id, 'billing'::public.aws_service_type, 'invoice_id', 'invoice_number', true, 'direct'),
      (existing_user_id, 'billing'::public.aws_service_type, 'invoice_date', 'date', true, 'date_format'),
      (existing_user_id, 'billing'::public.aws_service_type, 'total_amount', 'amount', true, 'currency_conversion');
  ELSE
    RAISE NOTICE 'No existing users found. Run auth migration first.';
  END IF;
END $$;