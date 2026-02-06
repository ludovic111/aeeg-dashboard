-- Harden delete permissions for parties and shared files/folders
-- Non-admin members can only delete resources they created.

CREATE OR REPLACE FUNCTION public.can_delete_shared_folder_tree(p_folder_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  WITH RECURSIVE descendant_folders AS (
    SELECT id, created_by
    FROM public.shared_folders
    WHERE id = p_folder_id

    UNION ALL

    SELECT child.id, child.created_by
    FROM public.shared_folders child
    JOIN descendant_folders parent ON child.parent_id = parent.id
  ),
  folder_ownership AS (
    SELECT COALESCE(bool_and(created_by = (select auth.uid())), false) AS ok
    FROM descendant_folders
  ),
  file_ownership AS (
    SELECT COALESCE(bool_and(sf.created_by = (select auth.uid())), true) AS ok
    FROM public.shared_files sf
    WHERE sf.folder_id IN (SELECT id FROM descendant_folders)
  )
  SELECT
    public.is_admin_member()
    OR (
      (SELECT ok FROM folder_ownership)
      AND (SELECT ok FROM file_ownership)
    );
$$;

CREATE OR REPLACE FUNCTION public.can_manage_shared_file_object(
  p_object_name TEXT,
  p_owner UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT
    public.is_admin_member()
    OR p_owner = (select auth.uid())
    OR EXISTS (
      SELECT 1
      FROM public.shared_files sf
      WHERE sf.storage_path = p_object_name
        AND sf.created_by = (select auth.uid())
    );
$$;

DROP POLICY IF EXISTS "Admins can delete parties" ON public.parties;
DROP POLICY IF EXISTS "Party creators and admins can delete parties" ON public.parties;
CREATE POLICY "Party creators and admins can delete parties"
ON public.parties
FOR DELETE
TO authenticated
USING (
  created_by = (select auth.uid())
  OR public.is_admin_member()
);

DROP POLICY IF EXISTS "Folder owners and admins can delete shared folders" ON public.shared_folders;
DROP POLICY IF EXISTS "Folder tree owners and admins can delete shared folders" ON public.shared_folders;
CREATE POLICY "Folder tree owners and admins can delete shared folders"
ON public.shared_folders
FOR DELETE
TO authenticated
USING (public.can_delete_shared_folder_tree(id));

DROP POLICY IF EXISTS "Approved members can delete shared files" ON storage.objects;
DROP POLICY IF EXISTS "File owners and admins can delete shared files" ON storage.objects;
CREATE POLICY "File owners and admins can delete shared files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'shared-files'
  AND public.can_manage_shared_file_object(name, owner)
);
