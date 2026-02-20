-- AWS Account Integration Schema
-- Migration: 20260120115900_aws_integration.sql
-- Purpose: Enable users to connect AWS accounts and sync contract/invoice data

-- 1. Create custom types for AWS integration
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'aws_connection_status') THEN
    CREATE TYPE public.aws_connection_status AS ENUM ('connected', 'disconnected', 'error', 'validating');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'aws_sync_status') THEN
    CREATE TYPE public.aws_sync_status AS ENUM ('pending', 'in_progress', 'completed', 'failed');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'aws_data_type') THEN
    CREATE TYPE public.aws_data_type AS ENUM ('contracts', 'invoices', 'marketplace_products', 'service_usage');
  END IF;
END $$;

-- 2. Create AWS integrations table (stores connection credentials)
CREATE TABLE IF NOT EXISTS public.aws_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  account_name TEXT NOT NULL,
  aws_region TEXT NOT NULL DEFAULT 'us-east-1',
  access_key_id TEXT NOT NULL,
  secret_access_key_encrypted TEXT NOT NULL,
  role_arn TEXT,
  connection_status public.aws_connection_status DEFAULT 'disconnected'::public.aws_connection_status,
  last_connection_test TIMESTAMPTZ,
  connection_error TEXT,
  permissions_contracts BOOLEAN DEFAULT true,
  permissions_invoices BOOLEAN DEFAULT true,
  permissions_marketplace BOOLEAN DEFAULT true,
  permissions_usage BOOLEAN DEFAULT true,
  auto_sync_enabled BOOLEAN DEFAULT false,
  sync_interval_hours INTEGER DEFAULT 24,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create AWS sync logs table (tracks sync operations)
CREATE TABLE IF NOT EXISTS public.aws_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES public.aws_integrations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  data_type public.aws_data_type NOT NULL,
  sync_status public.aws_sync_status DEFAULT 'pending'::public.aws_sync_status,
  records_synced INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  error_details JSONB,
  sync_metadata JSONB DEFAULT '{}'::jsonb
);

-- 4. Create AWS marketplace products table (cached data)
CREATE TABLE IF NOT EXISTS public.aws_marketplace_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES public.aws_integrations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  product_type TEXT,
  vendor TEXT,
  subscription_start DATE,
  subscription_end DATE,
  monthly_cost DECIMAL(12,2),
  currency TEXT DEFAULT 'USD',
  status TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  synced_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. Create AWS service usage table (cached data)
CREATE TABLE IF NOT EXISTS public.aws_service_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES public.aws_integrations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  usage_type TEXT,
  usage_amount DECIMAL(15,4),
  usage_unit TEXT,
  cost DECIMAL(12,2),
  currency TEXT DEFAULT 'USD',
  usage_start_date DATE NOT NULL,
  usage_end_date DATE NOT NULL,
  region TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  synced_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_aws_integrations_user_id ON public.aws_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_aws_integrations_status ON public.aws_integrations(connection_status);
CREATE INDEX IF NOT EXISTS idx_aws_sync_logs_integration_id ON public.aws_sync_logs(integration_id);
CREATE INDEX IF NOT EXISTS idx_aws_sync_logs_user_id ON public.aws_sync_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_aws_sync_logs_status ON public.aws_sync_logs(sync_status);
CREATE INDEX IF NOT EXISTS idx_aws_marketplace_products_integration_id ON public.aws_marketplace_products(integration_id);
CREATE INDEX IF NOT EXISTS idx_aws_marketplace_products_user_id ON public.aws_marketplace_products(user_id);
CREATE INDEX IF NOT EXISTS idx_aws_service_usage_integration_id ON public.aws_service_usage(integration_id);
CREATE INDEX IF NOT EXISTS idx_aws_service_usage_user_id ON public.aws_service_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_aws_service_usage_dates ON public.aws_service_usage(usage_start_date, usage_end_date);

-- 7. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_aws_integration_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $func$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$func$;

-- 8. Enable RLS on all AWS tables
ALTER TABLE public.aws_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aws_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aws_marketplace_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aws_service_usage ENABLE ROW LEVEL SECURITY;

-- 9. Create RLS policies (Pattern 2: Simple User Ownership)
CREATE POLICY "users_manage_own_aws_integrations"
ON public.aws_integrations
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_manage_own_aws_sync_logs"
ON public.aws_sync_logs
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_manage_own_aws_marketplace_products"
ON public.aws_marketplace_products
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_manage_own_aws_service_usage"
ON public.aws_service_usage
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 10. Create trigger for updated_at
CREATE TRIGGER update_aws_integrations_timestamp
    BEFORE UPDATE ON public.aws_integrations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_aws_integration_timestamp();

-- 11. Create mock data for testing
DO $$
DECLARE
    existing_user_id UUID;
    integration_id UUID := gen_random_uuid();
    sync_log_id UUID := gen_random_uuid();
BEGIN
    -- Get existing user from user_profiles
    SELECT id INTO existing_user_id FROM public.user_profiles LIMIT 1;
    
    IF existing_user_id IS NOT NULL THEN
        -- Create sample AWS integration
        INSERT INTO public.aws_integrations (
            id, user_id, account_name, aws_region, access_key_id, 
            secret_access_key_encrypted, connection_status, last_connection_test,
            permissions_contracts, permissions_invoices, permissions_marketplace, 
            permissions_usage, auto_sync_enabled, sync_interval_hours
        ) VALUES (
            integration_id, existing_user_id, 'Production AWS Account', 'us-east-1',
            'AKIAIOSFODNN7EXAMPLE', 'encrypted_secret_key_placeholder',
            'connected'::public.aws_connection_status, CURRENT_TIMESTAMP,
            true, true, true, true, true, 24
        );

        -- Create sample sync logs
        INSERT INTO public.aws_sync_logs (
            id, integration_id, user_id, data_type, sync_status, 
            records_synced, records_failed, started_at, completed_at
        ) VALUES 
            (gen_random_uuid(), integration_id, existing_user_id, 'contracts'::public.aws_data_type,
             'completed'::public.aws_sync_status, 15, 0, CURRENT_TIMESTAMP - INTERVAL '2 hours', CURRENT_TIMESTAMP - INTERVAL '1 hour'),
            (gen_random_uuid(), integration_id, existing_user_id, 'invoices'::public.aws_data_type,
             'completed'::public.aws_sync_status, 42, 0, CURRENT_TIMESTAMP - INTERVAL '2 hours', CURRENT_TIMESTAMP - INTERVAL '1 hour'),
            (gen_random_uuid(), integration_id, existing_user_id, 'marketplace_products'::public.aws_data_type,
             'completed'::public.aws_sync_status, 8, 0, CURRENT_TIMESTAMP - INTERVAL '2 hours', CURRENT_TIMESTAMP - INTERVAL '1 hour');

        -- Create sample marketplace products
        INSERT INTO public.aws_marketplace_products (
            integration_id, user_id, product_id, product_name, product_type,
            vendor, subscription_start, subscription_end, monthly_cost, status
        ) VALUES 
            (integration_id, existing_user_id, 'prod-aws-ml-001', 'AWS SageMaker Enterprise', 'Machine Learning',
             'AWS', CURRENT_DATE - INTERVAL '6 months', CURRENT_DATE + INTERVAL '6 months', 2500.00, 'Active'),
            (integration_id, existing_user_id, 'prod-aws-db-002', 'Amazon RDS PostgreSQL', 'Database',
             'AWS', CURRENT_DATE - INTERVAL '1 year', CURRENT_DATE + INTERVAL '1 year', 850.00, 'Active'),
            (integration_id, existing_user_id, 'prod-aws-sec-003', 'AWS Security Hub', 'Security',
             'AWS', CURRENT_DATE - INTERVAL '3 months', CURRENT_DATE + INTERVAL '9 months', 450.00, 'Active');

        -- Create sample service usage data
        INSERT INTO public.aws_service_usage (
            integration_id, user_id, service_name, usage_type, usage_amount,
            usage_unit, cost, usage_start_date, usage_end_date, region
        ) VALUES 
            (integration_id, existing_user_id, 'Amazon EC2', 'Compute Hours', 2450.50,
             'Hours', 1850.75, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, 'us-east-1'),
            (integration_id, existing_user_id, 'Amazon S3', 'Storage GB-Month', 15680.25,
             'GB-Month', 360.45, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, 'us-east-1'),
            (integration_id, existing_user_id, 'AWS Lambda', 'Invocations', 8500000.00,
             'Requests', 170.00, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, 'us-east-1');

        RAISE NOTICE 'AWS integration mock data created successfully';
    ELSE
        RAISE NOTICE 'No existing users found. Run auth migration first.';
    END IF;
END $$;