-- Add connection_type column to aws_integrations table
-- This column distinguishes between CloudFormation (one-click) and manual entry methods

-- Create enum type for connection_type
CREATE TYPE public.aws_connection_method AS ENUM ('cloudformation', 'manual');

-- Add connection_type column to aws_integrations table
ALTER TABLE public.aws_integrations
ADD COLUMN connection_type public.aws_connection_method DEFAULT 'cloudformation'::public.aws_connection_method;

-- Add comment to explain the column
COMMENT ON COLUMN public.aws_integrations.connection_type IS 'Method used to connect AWS account: cloudformation (one-click setup) or manual (access key entry)';

-- Update existing records to have cloudformation as default
UPDATE public.aws_integrations
SET connection_type = 'cloudformation'::public.aws_connection_method
WHERE connection_type IS NULL;

-- Make the column NOT NULL after setting defaults
ALTER TABLE public.aws_integrations
ALTER COLUMN connection_type SET NOT NULL;