-- Profile settings and user feedback

CREATE TABLE IF NOT EXISTS public.user_feedback (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  kind TEXT NOT NULL CHECK (kind IN ('issue', 'recommendation')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_feedback_created_at
  ON public.user_feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_feedback_status
  ON public.user_feedback(status);
CREATE INDEX IF NOT EXISTS idx_user_feedback_created_by
  ON public.user_feedback(created_by);

ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own feedback and committee can read all" ON public.user_feedback;
CREATE POLICY "Users can read own feedback and committee can read all"
ON public.user_feedback
FOR SELECT
TO authenticated
USING (
  created_by = (select auth.uid())
  OR (select public.get_user_role((select auth.uid()))) = ANY (
    ARRAY['superadmin'::user_role, 'admin'::user_role, 'committee_member'::user_role]
  )
);

DROP POLICY IF EXISTS "Approved users can create feedback" ON public.user_feedback;
CREATE POLICY "Approved users can create feedback"
ON public.user_feedback
FOR INSERT
TO authenticated
WITH CHECK (
  created_by = (select auth.uid())
  AND (select public.get_user_role((select auth.uid()))) = ANY (
    ARRAY['superadmin'::user_role, 'admin'::user_role, 'committee_member'::user_role, 'regular_member'::user_role]
  )
);

DROP POLICY IF EXISTS "Admins can update feedback status" ON public.user_feedback;
CREATE POLICY "Admins can update feedback status"
ON public.user_feedback
FOR UPDATE
TO authenticated
USING (
  (select public.get_user_role((select auth.uid()))) = ANY (
    ARRAY['superadmin'::user_role, 'admin'::user_role]
  )
)
WITH CHECK (
  (select public.get_user_role((select auth.uid()))) = ANY (
    ARRAY['superadmin'::user_role, 'admin'::user_role]
  )
);

DROP TRIGGER IF EXISTS update_user_feedback_updated_at ON public.user_feedback;
CREATE TRIGGER update_user_feedback_updated_at
BEFORE UPDATE ON public.user_feedback
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-avatars',
  'profile-avatars',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Profile avatars are publicly readable" ON storage.objects;
CREATE POLICY "Profile avatars are publicly readable"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'profile-avatars');

DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-avatars'
  AND split_part(name, '/', 1) = (select auth.uid())::text
);

DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-avatars'
  AND split_part(name, '/', 1) = (select auth.uid())::text
)
WITH CHECK (
  bucket_id = 'profile-avatars'
  AND split_part(name, '/', 1) = (select auth.uid())::text
);

DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-avatars'
  AND split_part(name, '/', 1) = (select auth.uid())::text
);
