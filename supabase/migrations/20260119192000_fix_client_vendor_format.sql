-- Fix Client/Vendor Name Format
-- Migration: 20260119192000_fix_client_vendor_format.sql
-- Purpose: Convert existing slug format client names to proper format

-- Update contracts table: convert slug format to proper format
UPDATE public.contracts
SET client = CASE
  -- Cloud providers
  WHEN LOWER(client) = 'aws' THEN 'AWS'
  WHEN LOWER(client) = 'gcp' THEN 'GCP'
  WHEN LOWER(client) = 'ms-azure' OR LOWER(client) = 'ms azure' OR LOWER(client) = 'azure' THEN 'MS Azure'
  
  -- Common slug patterns to proper format
  WHEN LOWER(client) = 'global-industries' THEN 'Global Industries'
  WHEN LOWER(client) = 'tech-corp' THEN 'Tech Corp'
  WHEN LOWER(client) = 'data-stream' THEN 'Data Stream'
  WHEN LOWER(client) = 'brand-boost' THEN 'Brand Boost'
  WHEN LOWER(client) = 'cloud-solutions' THEN 'Cloud Solutions'
  WHEN LOWER(client) = 'enterprise-systems' THEN 'Enterprise Systems'
  WHEN LOWER(client) = 'digital-ventures' THEN 'Digital Ventures'
  WHEN LOWER(client) = 'smart-tech' THEN 'Smart Tech'
  WHEN LOWER(client) = 'innovation-labs' THEN 'Innovation Labs'
  WHEN LOWER(client) = 'future-works' THEN 'Future Works'
  
  -- If already in proper format or unknown, keep as is
  ELSE client
END
WHERE client IS NOT NULL
  AND (client ~ '^[a-z-]+$' OR LOWER(client) IN ('aws', 'gcp', 'azure', 'ms azure', 'ms-azure'));

-- Log the update
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated % contract records with proper client/vendor format', updated_count;
END $$;