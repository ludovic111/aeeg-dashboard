-- Polls + shared drive + permission hardening

-- =====================================================
-- Role helper functions (for cleaner policy definitions)
-- =====================================================
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT public.get_user_role((select auth.uid()));
$$;

CREATE OR REPLACE FUNCTION public.is_approved_member()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT public.current_user_role() = ANY (
    ARRAY['superadmin'::user_role, 'admin'::user_role, 'committee_member'::user_role]
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin_member()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT public.current_user_role() = ANY (
    ARRAY['superadmin'::user_role, 'admin'::user_role]
  );
$$;

-- =====================================================
-- Profile update hardening
-- Prevent privilege escalation by self-updates.
-- =====================================================
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Superadmins and admins can update any profile" ON public.profiles;
CREATE POLICY "Superadmins and admins can update any profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.is_admin_member())
WITH CHECK (public.is_admin_member());

CREATE OR REPLACE FUNCTION public.enforce_profile_update_permissions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  actor_role user_role;
BEGIN
  -- Allow system/service operations where auth context is absent.
  IF (select auth.uid()) IS NULL THEN
    RETURN NEW;
  END IF;

  actor_role := public.current_user_role();

  IF actor_role IS NULL THEN
    RAISE EXCEPTION 'Unable to resolve current user role';
  END IF;

  IF actor_role NOT IN ('superadmin', 'admin') THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'Only admins can change roles';
    END IF;

    IF NEW.email IS DISTINCT FROM OLD.email THEN
      RAISE EXCEPTION 'Only admins can change emails';
    END IF;
  END IF;

  -- Admins cannot promote someone to superadmin.
  IF actor_role = 'admin' THEN
    IF NEW.role = 'superadmin' AND OLD.role IS DISTINCT FROM 'superadmin' THEN
      RAISE EXCEPTION 'Only superadmin can grant superadmin role';
    END IF;
  END IF;

  -- Only superadmin can modify a superadmin role row.
  IF actor_role <> 'superadmin' AND OLD.role = 'superadmin' THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'Only superadmin can modify superadmin role';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_profile_update_permissions_trigger ON public.profiles;
CREATE TRIGGER enforce_profile_update_permissions_trigger
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.enforce_profile_update_permissions();

-- =====================================================
-- Polls
-- =====================================================
CREATE TABLE IF NOT EXISTS public.polls (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  question TEXT NOT NULL,
  description TEXT,
  closes_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.poll_options (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.poll_votes (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES public.poll_options(id) ON DELETE CASCADE,
  voter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (poll_id, voter_id)
);

CREATE INDEX IF NOT EXISTS idx_polls_created_at
  ON public.polls(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_poll_options_poll_id
  ON public.poll_options(poll_id, position);
CREATE INDEX IF NOT EXISTS idx_poll_votes_poll_id
  ON public.poll_votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_option_id
  ON public.poll_votes(option_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_voter_id
  ON public.poll_votes(voter_id);

DROP TRIGGER IF EXISTS update_polls_updated_at ON public.polls;
CREATE TRIGGER update_polls_updated_at
BEFORE UPDATE ON public.polls
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.validate_poll_vote_option_match()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  option_poll_id UUID;
BEGIN
  SELECT poll_id INTO option_poll_id
  FROM public.poll_options
  WHERE id = NEW.option_id;

  IF option_poll_id IS NULL THEN
    RAISE EXCEPTION 'Poll option does not exist';
  END IF;

  IF option_poll_id <> NEW.poll_id THEN
    RAISE EXCEPTION 'Vote option does not belong to the selected poll';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_poll_vote_option_match_trigger ON public.poll_votes;
CREATE TRIGGER validate_poll_vote_option_match_trigger
BEFORE INSERT OR UPDATE ON public.poll_votes
FOR EACH ROW EXECUTE FUNCTION public.validate_poll_vote_option_match();

ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Polls are viewable by approved members" ON public.polls;
CREATE POLICY "Polls are viewable by approved members"
ON public.polls
FOR SELECT
TO authenticated
USING (public.is_approved_member());

DROP POLICY IF EXISTS "Approved members can create polls" ON public.polls;
CREATE POLICY "Approved members can create polls"
ON public.polls
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_approved_member()
  AND created_by = (select auth.uid())
);

DROP POLICY IF EXISTS "Poll creators and admins can update polls" ON public.polls;
CREATE POLICY "Poll creators and admins can update polls"
ON public.polls
FOR UPDATE
TO authenticated
USING (
  created_by = (select auth.uid())
  OR public.is_admin_member()
)
WITH CHECK (
  created_by = (select auth.uid())
  OR public.is_admin_member()
);

DROP POLICY IF EXISTS "Poll creators and admins can delete polls" ON public.polls;
CREATE POLICY "Poll creators and admins can delete polls"
ON public.polls
FOR DELETE
TO authenticated
USING (
  created_by = (select auth.uid())
  OR public.is_admin_member()
);

DROP POLICY IF EXISTS "Poll options are viewable by approved members" ON public.poll_options;
CREATE POLICY "Poll options are viewable by approved members"
ON public.poll_options
FOR SELECT
TO authenticated
USING (public.is_approved_member());

DROP POLICY IF EXISTS "Poll creators and admins can create options" ON public.poll_options;
CREATE POLICY "Poll creators and admins can create options"
ON public.poll_options
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_approved_member()
  AND EXISTS (
    SELECT 1
    FROM public.polls p
    WHERE p.id = poll_id
      AND (p.created_by = (select auth.uid()) OR public.is_admin_member())
  )
);

DROP POLICY IF EXISTS "Poll creators and admins can update options" ON public.poll_options;
CREATE POLICY "Poll creators and admins can update options"
ON public.poll_options
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.polls p
    WHERE p.id = poll_id
      AND (p.created_by = (select auth.uid()) OR public.is_admin_member())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.polls p
    WHERE p.id = poll_id
      AND (p.created_by = (select auth.uid()) OR public.is_admin_member())
  )
);

DROP POLICY IF EXISTS "Poll creators and admins can delete options" ON public.poll_options;
CREATE POLICY "Poll creators and admins can delete options"
ON public.poll_options
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.polls p
    WHERE p.id = poll_id
      AND (p.created_by = (select auth.uid()) OR public.is_admin_member())
  )
);

DROP POLICY IF EXISTS "Poll votes are viewable by approved members" ON public.poll_votes;
CREATE POLICY "Poll votes are viewable by approved members"
ON public.poll_votes
FOR SELECT
TO authenticated
USING (public.is_approved_member());

DROP POLICY IF EXISTS "Approved members can vote" ON public.poll_votes;
CREATE POLICY "Approved members can vote"
ON public.poll_votes
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_approved_member()
  AND voter_id = (select auth.uid())
);

DROP POLICY IF EXISTS "Voters and admins can update votes" ON public.poll_votes;
CREATE POLICY "Voters and admins can update votes"
ON public.poll_votes
FOR UPDATE
TO authenticated
USING (
  voter_id = (select auth.uid())
  OR public.is_admin_member()
)
WITH CHECK (
  voter_id = (select auth.uid())
  OR public.is_admin_member()
);

DROP POLICY IF EXISTS "Voters and admins can delete votes" ON public.poll_votes;
CREATE POLICY "Voters and admins can delete votes"
ON public.poll_votes
FOR DELETE
TO authenticated
USING (
  voter_id = (select auth.uid())
  OR public.is_admin_member()
);

-- =====================================================
-- Shared drive (folders + files metadata)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.shared_folders (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  name TEXT NOT NULL,
  parent_id UUID REFERENCES public.shared_folders(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (parent_id, name)
);

CREATE TABLE IF NOT EXISTS public.shared_files (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  folder_id UUID REFERENCES public.shared_folders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  storage_path TEXT NOT NULL UNIQUE,
  mime_type TEXT,
  size_bytes BIGINT NOT NULL DEFAULT 0 CHECK (size_bytes >= 0),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shared_folders_parent_id
  ON public.shared_folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_shared_folders_created_at
  ON public.shared_folders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shared_files_folder_id
  ON public.shared_files(folder_id);
CREATE INDEX IF NOT EXISTS idx_shared_files_created_at
  ON public.shared_files(created_at DESC);

DROP TRIGGER IF EXISTS update_shared_folders_updated_at ON public.shared_folders;
CREATE TRIGGER update_shared_folders_updated_at
BEFORE UPDATE ON public.shared_folders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.shared_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Shared folders are viewable by approved members" ON public.shared_folders;
CREATE POLICY "Shared folders are viewable by approved members"
ON public.shared_folders
FOR SELECT
TO authenticated
USING (public.is_approved_member());

DROP POLICY IF EXISTS "Approved members can create shared folders" ON public.shared_folders;
CREATE POLICY "Approved members can create shared folders"
ON public.shared_folders
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_approved_member()
  AND created_by = (select auth.uid())
);

DROP POLICY IF EXISTS "Folder owners and admins can update shared folders" ON public.shared_folders;
CREATE POLICY "Folder owners and admins can update shared folders"
ON public.shared_folders
FOR UPDATE
TO authenticated
USING (
  created_by = (select auth.uid())
  OR public.is_admin_member()
)
WITH CHECK (
  created_by = (select auth.uid())
  OR public.is_admin_member()
);

DROP POLICY IF EXISTS "Folder owners and admins can delete shared folders" ON public.shared_folders;
CREATE POLICY "Folder owners and admins can delete shared folders"
ON public.shared_folders
FOR DELETE
TO authenticated
USING (
  created_by = (select auth.uid())
  OR public.is_admin_member()
);

DROP POLICY IF EXISTS "Shared files metadata is viewable by approved members" ON public.shared_files;
CREATE POLICY "Shared files metadata is viewable by approved members"
ON public.shared_files
FOR SELECT
TO authenticated
USING (public.is_approved_member());

DROP POLICY IF EXISTS "Approved members can create shared files metadata" ON public.shared_files;
CREATE POLICY "Approved members can create shared files metadata"
ON public.shared_files
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_approved_member()
  AND created_by = (select auth.uid())
);

DROP POLICY IF EXISTS "File owners and admins can update shared files metadata" ON public.shared_files;
CREATE POLICY "File owners and admins can update shared files metadata"
ON public.shared_files
FOR UPDATE
TO authenticated
USING (
  created_by = (select auth.uid())
  OR public.is_admin_member()
)
WITH CHECK (
  created_by = (select auth.uid())
  OR public.is_admin_member()
);

DROP POLICY IF EXISTS "File owners and admins can delete shared files metadata" ON public.shared_files;
CREATE POLICY "File owners and admins can delete shared files metadata"
ON public.shared_files
FOR DELETE
TO authenticated
USING (
  created_by = (select auth.uid())
  OR public.is_admin_member()
);

-- Shared drive storage bucket + policies
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES (
  'shared-files',
  'shared-files',
  false,
  52428800
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit;

DROP POLICY IF EXISTS "Shared files are readable by approved members" ON storage.objects;
CREATE POLICY "Shared files are readable by approved members"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'shared-files'
  AND public.is_approved_member()
);

DROP POLICY IF EXISTS "Approved members can upload shared files" ON storage.objects;
CREATE POLICY "Approved members can upload shared files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'shared-files'
  AND public.is_approved_member()
);

DROP POLICY IF EXISTS "Approved members can update shared files" ON storage.objects;
CREATE POLICY "Approved members can update shared files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'shared-files'
  AND public.is_approved_member()
)
WITH CHECK (
  bucket_id = 'shared-files'
  AND public.is_approved_member()
);

DROP POLICY IF EXISTS "Approved members can delete shared files" ON storage.objects;
CREATE POLICY "Approved members can delete shared files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'shared-files'
  AND public.is_approved_member()
);
