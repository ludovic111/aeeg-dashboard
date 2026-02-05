-- Permission refinements after polls/drive rollout

-- Normalize deprecated legacy role if any stale rows still exist.
UPDATE public.profiles
SET role = 'pending'
WHERE role = 'regular_member';

-- Avoid mutable search_path warnings for helper/validation functions.
ALTER FUNCTION public.current_user_role() SET search_path = public, auth;
ALTER FUNCTION public.is_approved_member() SET search_path = public, auth;
ALTER FUNCTION public.is_admin_member() SET search_path = public, auth;
ALTER FUNCTION public.parse_customer_order_items(TEXT) SET search_path = public;
ALTER FUNCTION public.validate_customer_order_items(JSONB) SET search_path = public;
ALTER FUNCTION public.validate_poll_vote_option_match() SET search_path = public;

-- Keep role hardening while allowing members to update their own profile fields
-- (including email mirror in profiles, synced from auth update flow).
CREATE OR REPLACE FUNCTION public.enforce_profile_update_permissions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  actor_id UUID;
  actor_role user_role;
BEGIN
  actor_id := auth.uid();

  -- Allow system/service operations where auth context is absent.
  IF actor_id IS NULL THEN
    RETURN NEW;
  END IF;

  actor_role := public.current_user_role();

  IF actor_role IS NULL THEN
    RAISE EXCEPTION 'Unable to resolve current user role';
  END IF;

  IF NEW.role = 'regular_member' THEN
    RAISE EXCEPTION 'regular_member role is deprecated; use pending';
  END IF;

  IF actor_role NOT IN ('superadmin', 'admin') THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'Only admins can change roles';
    END IF;

    IF OLD.id IS DISTINCT FROM actor_id THEN
      RAISE EXCEPTION 'You can only update your own profile';
    END IF;
  END IF;

  -- Admins cannot promote someone to superadmin.
  IF actor_role = 'admin' THEN
    IF NEW.role = 'superadmin' AND OLD.role IS DISTINCT FROM 'superadmin' THEN
      RAISE EXCEPTION 'Only superadmin can grant superadmin role';
    END IF;
  END IF;

  -- Only superadmin can modify a superadmin profile row.
  IF actor_role <> 'superadmin' AND OLD.role = 'superadmin' THEN
    IF NEW IS DISTINCT FROM OLD THEN
      RAISE EXCEPTION 'Only superadmin can modify superadmin profile';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
