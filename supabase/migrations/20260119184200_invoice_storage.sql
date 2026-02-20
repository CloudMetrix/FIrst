-- Create private bucket for invoice documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'invoice-documents',
    'invoice-documents',
    false,
    10485760,
    ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
);

-- RLS: Users can manage only their own invoice documents
CREATE POLICY "users_manage_own_invoice_documents"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'invoice-documents' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'invoice-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Add file_path column to invoices table to store document reference
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS file_path text;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS file_name text;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS file_size bigint;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS description text;

DO $$
BEGIN
  RAISE NOTICE 'Invoice storage bucket and schema updates completed successfully';
END $$;