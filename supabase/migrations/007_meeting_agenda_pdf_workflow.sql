-- Meetings workflow: date + PDF agenda upload
ALTER TABLE public.meetings
ADD COLUMN IF NOT EXISTS agenda_pdf_path TEXT;

-- Public bucket so PDFs can be embedded in-browser via public URL
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'meeting-agendas',
  'meeting-agendas',
  true,
  10485760,
  ARRAY['application/pdf']::text[]
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Meeting agendas are publicly readable" ON storage.objects;
CREATE POLICY "Meeting agendas are publicly readable"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'meeting-agendas');

DROP POLICY IF EXISTS "Approved members can upload meeting agendas" ON storage.objects;
CREATE POLICY "Approved members can upload meeting agendas"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'meeting-agendas'
  AND (select public.get_user_role((select auth.uid()))) = ANY (ARRAY['superadmin'::user_role, 'admin'::user_role, 'committee_member'::user_role])
);

DROP POLICY IF EXISTS "Approved members can update meeting agendas" ON storage.objects;
CREATE POLICY "Approved members can update meeting agendas"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'meeting-agendas'
  AND (select public.get_user_role((select auth.uid()))) = ANY (ARRAY['superadmin'::user_role, 'admin'::user_role, 'committee_member'::user_role])
)
WITH CHECK (
  bucket_id = 'meeting-agendas'
  AND (select public.get_user_role((select auth.uid()))) = ANY (ARRAY['superadmin'::user_role, 'admin'::user_role, 'committee_member'::user_role])
);

DROP POLICY IF EXISTS "Admins can delete meeting agendas" ON storage.objects;
CREATE POLICY "Admins can delete meeting agendas"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'meeting-agendas'
  AND (select public.get_user_role((select auth.uid()))) = ANY (ARRAY['superadmin'::user_role, 'admin'::user_role])
);
