-- Parties module: parties + members + tasks + grocery list

-- =====================================================
-- Tables
-- =====================================================
CREATE TABLE IF NOT EXISTS public.parties (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  name TEXT NOT NULL,
  event_date DATE NOT NULL,
  event_time TIME NOT NULL,
  place TEXT NOT NULL,
  manager_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.party_members (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  party_id UUID NOT NULL REFERENCES public.parties(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('manager', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (party_id, profile_id)
);

CREATE TABLE IF NOT EXISTS public.party_tasks (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  party_id UUID NOT NULL REFERENCES public.parties(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'done')),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.party_grocery_items (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  party_id UUID NOT NULL REFERENCES public.parties(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  quantity TEXT,
  checked BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_parties_event ON public.parties(event_date, event_time);
CREATE INDEX IF NOT EXISTS idx_parties_manager_id ON public.parties(manager_id);
CREATE INDEX IF NOT EXISTS idx_party_members_party_id ON public.party_members(party_id);
CREATE INDEX IF NOT EXISTS idx_party_members_profile_id ON public.party_members(profile_id);
CREATE INDEX IF NOT EXISTS idx_party_tasks_party_id ON public.party_tasks(party_id);
CREATE INDEX IF NOT EXISTS idx_party_tasks_assigned_to ON public.party_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_party_tasks_status ON public.party_tasks(status);
CREATE INDEX IF NOT EXISTS idx_party_grocery_items_party_id ON public.party_grocery_items(party_id);
CREATE INDEX IF NOT EXISTS idx_party_grocery_items_checked ON public.party_grocery_items(checked);

DROP TRIGGER IF EXISTS update_parties_updated_at ON public.parties;
CREATE TRIGGER update_parties_updated_at
BEFORE UPDATE ON public.parties
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_party_tasks_updated_at ON public.party_tasks;
CREATE TRIGGER update_party_tasks_updated_at
BEFORE UPDATE ON public.party_tasks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_party_grocery_items_updated_at ON public.party_grocery_items;
CREATE TRIGGER update_party_grocery_items_updated_at
BEFORE UPDATE ON public.party_grocery_items
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- Helpers
-- =====================================================
CREATE OR REPLACE FUNCTION public.is_party_member(p_party_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT
    public.is_admin_member()
    OR EXISTS (
      SELECT 1
      FROM public.party_members pm
      WHERE pm.party_id = p_party_id
        AND pm.profile_id = (select auth.uid())
    );
$$;

CREATE OR REPLACE FUNCTION public.is_party_manager(p_party_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT
    public.is_admin_member()
    OR EXISTS (
      SELECT 1
      FROM public.parties p
      WHERE p.id = p_party_id
        AND p.manager_id = (select auth.uid())
    );
$$;

CREATE OR REPLACE FUNCTION public.can_access_party(p_party_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT public.is_party_member(p_party_id) OR public.is_party_manager(p_party_id);
$$;

-- Ensure the designated manager is always present in party_members.
CREATE OR REPLACE FUNCTION public.sync_party_manager_membership()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  INSERT INTO public.party_members (party_id, profile_id, role)
  VALUES (NEW.id, NEW.manager_id, 'manager')
  ON CONFLICT (party_id, profile_id)
  DO UPDATE SET role = EXCLUDED.role;

  IF TG_OP = 'UPDATE' AND OLD.manager_id IS DISTINCT FROM NEW.manager_id THEN
    UPDATE public.party_members
    SET role = 'member'
    WHERE party_id = NEW.id
      AND profile_id = OLD.manager_id
      AND OLD.manager_id IS DISTINCT FROM NEW.manager_id
      AND role = 'manager';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_party_manager_membership_trigger ON public.parties;
CREATE TRIGGER sync_party_manager_membership_trigger
AFTER INSERT OR UPDATE OF manager_id ON public.parties
FOR EACH ROW EXECUTE FUNCTION public.sync_party_manager_membership();

-- Validate assignee belongs to the party.
CREATE OR REPLACE FUNCTION public.validate_party_task_assignee()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.party_members pm
    WHERE pm.party_id = NEW.party_id
      AND pm.profile_id = NEW.assigned_to
  ) THEN
    RAISE EXCEPTION 'Assigned user must be a member of the party';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_party_task_assignee_trigger ON public.party_tasks;
CREATE TRIGGER validate_party_task_assignee_trigger
BEFORE INSERT OR UPDATE OF assigned_to, party_id ON public.party_tasks
FOR EACH ROW EXECUTE FUNCTION public.validate_party_task_assignee();

-- Assignees can only update status; managers/admins can edit everything.
CREATE OR REPLACE FUNCTION public.enforce_party_task_update_permissions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  actor_id UUID;
BEGIN
  actor_id := auth.uid();

  IF actor_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF public.is_party_manager(OLD.party_id) THEN
    RETURN NEW;
  END IF;

  IF OLD.assigned_to IS DISTINCT FROM actor_id THEN
    RAISE EXCEPTION 'Only party manager/admin or assignee can update task';
  END IF;

  IF NEW.party_id IS DISTINCT FROM OLD.party_id
     OR NEW.title IS DISTINCT FROM OLD.title
     OR NEW.description IS DISTINCT FROM OLD.description
     OR NEW.assigned_to IS DISTINCT FROM OLD.assigned_to
     OR NEW.created_by IS DISTINCT FROM OLD.created_by THEN
    RAISE EXCEPTION 'Assignees can only update task status';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_party_task_update_permissions_trigger ON public.party_tasks;
CREATE TRIGGER enforce_party_task_update_permissions_trigger
BEFORE UPDATE ON public.party_tasks
FOR EACH ROW EXECUTE FUNCTION public.enforce_party_task_update_permissions();

-- =====================================================
-- RLS
-- =====================================================
ALTER TABLE public.parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.party_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.party_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.party_grocery_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Parties are viewable by party members" ON public.parties;
CREATE POLICY "Parties are viewable by party members"
ON public.parties
FOR SELECT
TO authenticated
USING (public.can_access_party(id));

DROP POLICY IF EXISTS "Admins can create parties" ON public.parties;
CREATE POLICY "Admins can create parties"
ON public.parties
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_admin_member()
  AND created_by = (select auth.uid())
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = manager_id
      AND p.role = ANY (
        ARRAY['superadmin'::user_role, 'admin'::user_role, 'committee_member'::user_role]
      )
  )
);

DROP POLICY IF EXISTS "Managers and admins can update parties" ON public.parties;
CREATE POLICY "Managers and admins can update parties"
ON public.parties
FOR UPDATE
TO authenticated
USING (public.is_party_manager(id))
WITH CHECK (
  public.is_party_manager(id)
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = manager_id
      AND p.role = ANY (
        ARRAY['superadmin'::user_role, 'admin'::user_role, 'committee_member'::user_role]
      )
  )
);

DROP POLICY IF EXISTS "Admins can delete parties" ON public.parties;
CREATE POLICY "Admins can delete parties"
ON public.parties
FOR DELETE
TO authenticated
USING (public.is_admin_member());

DROP POLICY IF EXISTS "Party members are viewable by party members" ON public.party_members;
CREATE POLICY "Party members are viewable by party members"
ON public.party_members
FOR SELECT
TO authenticated
USING (public.can_access_party(party_id));

DROP POLICY IF EXISTS "Managers and admins can add party members" ON public.party_members;
CREATE POLICY "Managers and admins can add party members"
ON public.party_members
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_party_manager(party_id)
  AND (
    role = 'member'
    OR (
      role = 'manager'
      AND EXISTS (
        SELECT 1
        FROM public.parties p2
        WHERE p2.id = party_id
          AND p2.manager_id = profile_id
      )
    )
  )
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = profile_id
      AND p.role = ANY (
        ARRAY['superadmin'::user_role, 'admin'::user_role, 'committee_member'::user_role]
      )
  )
);

DROP POLICY IF EXISTS "Managers and admins can update party members" ON public.party_members;
CREATE POLICY "Managers and admins can update party members"
ON public.party_members
FOR UPDATE
TO authenticated
USING (public.is_party_manager(party_id))
WITH CHECK (public.is_party_manager(party_id));

DROP POLICY IF EXISTS "Managers and admins can remove party members" ON public.party_members;
CREATE POLICY "Managers and admins can remove party members"
ON public.party_members
FOR DELETE
TO authenticated
USING (
  public.is_party_manager(party_id)
  AND role <> 'manager'
);

DROP POLICY IF EXISTS "Party tasks are viewable by party members" ON public.party_tasks;
CREATE POLICY "Party tasks are viewable by party members"
ON public.party_tasks
FOR SELECT
TO authenticated
USING (public.can_access_party(party_id));

DROP POLICY IF EXISTS "Managers and admins can create party tasks" ON public.party_tasks;
CREATE POLICY "Managers and admins can create party tasks"
ON public.party_tasks
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_party_manager(party_id)
  AND created_by = (select auth.uid())
);

DROP POLICY IF EXISTS "Managers admins and assignees can update party tasks" ON public.party_tasks;
CREATE POLICY "Managers admins and assignees can update party tasks"
ON public.party_tasks
FOR UPDATE
TO authenticated
USING (
  public.is_party_manager(party_id)
  OR assigned_to = (select auth.uid())
)
WITH CHECK (
  public.is_party_manager(party_id)
  OR assigned_to = (select auth.uid())
);

DROP POLICY IF EXISTS "Managers and admins can delete party tasks" ON public.party_tasks;
CREATE POLICY "Managers and admins can delete party tasks"
ON public.party_tasks
FOR DELETE
TO authenticated
USING (public.is_party_manager(party_id));

DROP POLICY IF EXISTS "Party grocery is viewable by party members" ON public.party_grocery_items;
CREATE POLICY "Party grocery is viewable by party members"
ON public.party_grocery_items
FOR SELECT
TO authenticated
USING (public.can_access_party(party_id));

DROP POLICY IF EXISTS "Managers and admins can create party grocery" ON public.party_grocery_items;
CREATE POLICY "Managers and admins can create party grocery"
ON public.party_grocery_items
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_party_manager(party_id)
  AND created_by = (select auth.uid())
);

DROP POLICY IF EXISTS "Managers and admins can update party grocery" ON public.party_grocery_items;
CREATE POLICY "Managers and admins can update party grocery"
ON public.party_grocery_items
FOR UPDATE
TO authenticated
USING (public.is_party_manager(party_id))
WITH CHECK (public.is_party_manager(party_id));

DROP POLICY IF EXISTS "Managers and admins can delete party grocery" ON public.party_grocery_items;
CREATE POLICY "Managers and admins can delete party grocery"
ON public.party_grocery_items
FOR DELETE
TO authenticated
USING (public.is_party_manager(party_id));
