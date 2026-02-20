-- Add external_id column for secure role assumption
ALTER TABLE public.aws_integrations
ADD COLUMN IF NOT EXISTS external_id TEXT;

-- Add comment
COMMENT ON COLUMN public.aws_integrations.external_id IS 'External ID for secure AWS IAM role assumption';

-- Update RLS policies remain unchanged
DO $$
BEGIN
  RAISE NOTICE 'Added external_id column to aws_integrations table';
END $$;