-- Contracts, Invoices, and Alerts Management Schema
-- Migration: 20260117111733_contracts_invoices_alerts.sql

-- 1. Create custom types (with conditional checks)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contract_status') THEN
    CREATE TYPE public.contract_status AS ENUM ('Active', 'Pending', 'Expired', 'Expiring Soon');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'provider_type') THEN
    CREATE TYPE public.provider_type AS ENUM (
      'SaaS/Original Vendor',
      'SaaS/Reseller',
      'SaaS/Marketplace',
      'Cloud Service Provider/Original Vendor',
      'Cloud Service Provider/Reseller'
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invoice_status') THEN
    CREATE TYPE public.invoice_status AS ENUM ('Paid', 'Pending', 'Overdue');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'alert_interval') THEN
    CREATE TYPE public.alert_interval AS ENUM ('30', '60', '90');
  END IF;
END $$;

-- 2. Create core tables
CREATE TABLE IF NOT EXISTS public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  client TEXT NOT NULL,
  value DECIMAL(12,2) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  length TEXT NOT NULL,
  status public.contract_status DEFAULT 'Pending'::public.contract_status,
  remaining_amount DECIMAL(12,2) NOT NULL,
  provider_type public.provider_type NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  last_modified_by TEXT,
  user_id UUID NOT NULL
);

CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL UNIQUE,
  date DATE NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  status public.invoice_status DEFAULT 'Pending'::public.invoice_status,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  user_id UUID NOT NULL
);

CREATE TABLE IF NOT EXISTS public.alert_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  alert_interval public.alert_interval NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  user_id UUID NOT NULL
);

CREATE TABLE IF NOT EXISTS public.alert_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  alert_type TEXT NOT NULL,
  user_id UUID NOT NULL
);

CREATE TABLE IF NOT EXISTS public.contract_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  size BIGINT NOT NULL,
  type TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  user_id UUID NOT NULL
);

-- 3. Create indexes
CREATE INDEX IF NOT EXISTS idx_contracts_user_id ON public.contracts(user_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON public.contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_end_date ON public.contracts(end_date);
CREATE INDEX IF NOT EXISTS idx_invoices_contract_id ON public.invoices(contract_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_alert_configurations_contract_id ON public.alert_configurations(contract_id);
CREATE INDEX IF NOT EXISTS idx_alert_history_contract_id ON public.alert_history(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_documents_contract_id ON public.contract_documents(contract_id);

-- 4. Enable RLS
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_documents ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'users_manage_own_contracts' AND tablename = 'contracts') THEN
    CREATE POLICY "users_manage_own_contracts"
    ON public.contracts
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'users_manage_own_invoices' AND tablename = 'invoices') THEN
    CREATE POLICY "users_manage_own_invoices"
    ON public.invoices
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'users_manage_own_alert_configurations' AND tablename = 'alert_configurations') THEN
    CREATE POLICY "users_manage_own_alert_configurations"
    ON public.alert_configurations
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'users_manage_own_alert_history' AND tablename = 'alert_history') THEN
    CREATE POLICY "users_manage_own_alert_history"
    ON public.alert_history
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'users_manage_own_contract_documents' AND tablename = 'contract_documents') THEN
    CREATE POLICY "users_manage_own_contract_documents"
    ON public.contract_documents
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- 6. Create function to update contract status based on dates
CREATE OR REPLACE FUNCTION public.update_contract_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.end_date < CURRENT_DATE THEN
    NEW.status := 'Expired'::public.contract_status;
  ELSIF NEW.end_date <= (CURRENT_DATE + INTERVAL '30 days') THEN
    NEW.status := 'Expiring Soon'::public.contract_status;
  ELSIF NEW.start_date > CURRENT_DATE THEN
    NEW.status := 'Pending'::public.contract_status;
  ELSE
    NEW.status := 'Active'::public.contract_status;
  END IF;
  
  NEW.updated_at := CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

-- 7. Create trigger for contract status updates
DROP TRIGGER IF EXISTS trigger_update_contract_status ON public.contracts;
CREATE TRIGGER trigger_update_contract_status
BEFORE INSERT OR UPDATE OF start_date, end_date
ON public.contracts
FOR EACH ROW
EXECUTE FUNCTION public.update_contract_status();

-- Mock data removed - will be added after user_profiles table is created in subsequent migration
-- See migration 20260117120630_user_profiles_and_constraints.sql for user setup