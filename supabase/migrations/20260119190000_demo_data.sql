-- Demo Data for Contracts, Invoices, and Alerts
-- Migration: 20260119190000_demo_data.sql
-- Purpose: Insert demo data using existing test users from user_profiles

DO $$
DECLARE
  demo_user_id UUID;
  contract1_id UUID := gen_random_uuid();
  contract2_id UUID := gen_random_uuid();
  contract3_id UUID := gen_random_uuid();
  contract4_id UUID := gen_random_uuid();
  contract5_id UUID := gen_random_uuid();
BEGIN
  -- Get an existing user from user_profiles (created by previous migration)
  SELECT id INTO demo_user_id FROM public.user_profiles LIMIT 1;
  
  -- If no user exists, skip demo data creation
  IF demo_user_id IS NULL THEN
    RAISE NOTICE 'No users found in user_profiles. Skipping demo data creation.';
    RETURN;
  END IF;

  -- Insert demo contracts
  INSERT INTO public.contracts (id, name, client, value, start_date, end_date, length, remaining_amount, provider_type, user_id, last_modified_by) VALUES
    (contract1_id, 'Software Development Services Agreement', 'AWS', 250000.00, '2025-01-15', '2026-01-14', '12 months', 187500.00, 'SaaS/Original Vendor'::public.provider_type, demo_user_id, 'System'),
    (contract2_id, 'Cloud Infrastructure Management', 'GCP', 180000.00, '2024-06-01', '2026-05-31', '24 months', 120000.00, 'Cloud Service Provider/Original Vendor'::public.provider_type, demo_user_id, 'System'),
    (contract3_id, 'Marketing Services Contract', 'MS Azure', 95000.00, '2024-03-01', '2025-02-28', '12 months', 23750.00, 'SaaS/Reseller'::public.provider_type, demo_user_id, 'System'),
    (contract4_id, 'IT Support and Maintenance', 'AWS', 150000.00, '2023-09-01', '2024-08-31', '12 months', 0.00, 'SaaS/Marketplace'::public.provider_type, demo_user_id, 'System'),
    (contract5_id, 'Consulting Services Agreement', 'GCP', 320000.00, '2025-02-01', '2027-01-31', '24 months', 320000.00, 'Cloud Service Provider/Reseller'::public.provider_type, demo_user_id, 'System')
  ON CONFLICT (id) DO NOTHING;

  -- Insert demo invoices
  INSERT INTO public.invoices (contract_id, invoice_number, date, amount, status, user_id) VALUES
    (contract1_id, 'INV-2025-001', '2025-01-15', 25000.00, 'Paid'::public.invoice_status, demo_user_id),
    (contract1_id, 'INV-2025-002', '2025-02-15', 37500.00, 'Paid'::public.invoice_status, demo_user_id),
    (contract2_id, 'INV-2024-101', '2024-06-01', 30000.00, 'Paid'::public.invoice_status, demo_user_id),
    (contract2_id, 'INV-2024-102', '2024-09-01', 30000.00, 'Paid'::public.invoice_status, demo_user_id),
    (contract3_id, 'INV-2024-201', '2024-03-01', 35625.00, 'Paid'::public.invoice_status, demo_user_id),
    (contract3_id, 'INV-2024-202', '2024-09-01', 35625.00, 'Pending'::public.invoice_status, demo_user_id),
    (contract4_id, 'INV-2023-301', '2023-09-01', 75000.00, 'Paid'::public.invoice_status, demo_user_id),
    (contract4_id, 'INV-2024-302', '2024-03-01', 75000.00, 'Paid'::public.invoice_status, demo_user_id)
  ON CONFLICT (invoice_number) DO NOTHING;

  -- Insert demo alert configurations
  INSERT INTO public.alert_configurations (contract_id, email, alert_interval, user_id) VALUES
    (contract1_id, 'manager@techcorp.com', '30'::public.alert_interval, demo_user_id),
    (contract2_id, 'admin@datastream.com', '60'::public.alert_interval, demo_user_id),
    (contract3_id, 'alerts@brandboost.com', '90'::public.alert_interval, demo_user_id)
  ON CONFLICT DO NOTHING;

  -- Insert demo alert history
  INSERT INTO public.alert_history (contract_id, email, sent_at, alert_type, user_id) VALUES
    (contract1_id, 'manager@techcorp.com', '2024-12-15 09:00:00', '30 days renewal reminder', demo_user_id),
    (contract2_id, 'admin@datastream.com', '2024-11-01 10:30:00', '60 days renewal reminder', demo_user_id)
  ON CONFLICT DO NOTHING;

  -- Insert demo contract documents
  INSERT INTO public.contract_documents (contract_id, name, size, type, user_id) VALUES
    (contract1_id, 'Software_Development_Agreement.pdf', 2457600, 'application/pdf', demo_user_id),
    (contract2_id, 'Cloud_Infrastructure_Contract.pdf', 1835008, 'application/pdf', demo_user_id),
    (contract3_id, 'Marketing_Services_Contract.pdf', 1048576, 'application/pdf', demo_user_id)
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Mock data created successfully for contracts, invoices, and alerts';
END $$;