-- AEEG Dashboard - Migration 004: Superadmin Role + Pending Access System
-- This migration:
--   1. Adds 'superadmin' and 'pending' to user_role enum
--   2. Converts existing regular_members to pending
--   3. Updates handle_new_user() to assign 'pending' by default
--   4. Updates ALL RLS policies to include superadmin
--   5. Restricts SELECT on data tables to exclude pending users
--   6. Adds profile management policies for superadmin
--   7. Promotes ludo47j@gmail.com to superadmin

-- ================================================
-- 1. ADD NEW ENUM VALUES
-- ================================================
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'superadmin' BEFORE 'admin';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'pending' AFTER 'regular_member';

-- ================================================
-- 2. CONVERT EXISTING REGULAR MEMBERS TO PENDING
-- ================================================
UPDATE profiles SET role = 'pending' WHERE role = 'regular_member';

-- ================================================
-- 3. UPDATE TRIGGER: New users get 'pending' role
-- ================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'pending'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- 4. DROP ALL EXISTING RLS POLICIES
-- ================================================

-- Profiles
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;

-- Meetings
DROP POLICY IF EXISTS "Meetings are viewable by authenticated users" ON meetings;
DROP POLICY IF EXISTS "Committee members and admins can create meetings" ON meetings;
DROP POLICY IF EXISTS "Meeting creators and admins can update meetings" ON meetings;
DROP POLICY IF EXISTS "Admins can delete meetings" ON meetings;

-- Meeting action items
DROP POLICY IF EXISTS "Action items are viewable by authenticated users" ON meeting_action_items;
DROP POLICY IF EXISTS "Committee members and admins can create action items" ON meeting_action_items;
DROP POLICY IF EXISTS "Assigned users, committee members and admins can update action items" ON meeting_action_items;
DROP POLICY IF EXISTS "Admins can delete action items" ON meeting_action_items;

-- Tasks
DROP POLICY IF EXISTS "Tasks are viewable by authenticated users" ON tasks;
DROP POLICY IF EXISTS "Authenticated users can create tasks" ON tasks;
DROP POLICY IF EXISTS "Task owners, assignees and committee can update tasks" ON tasks;
DROP POLICY IF EXISTS "Task creators and admins can delete tasks" ON tasks;

-- Events
DROP POLICY IF EXISTS "Events are viewable by authenticated users" ON events;
DROP POLICY IF EXISTS "Committee members and admins can create events" ON events;
DROP POLICY IF EXISTS "Event creators and admins can update events" ON events;
DROP POLICY IF EXISTS "Admins can delete events" ON events;

-- Sales entries
DROP POLICY IF EXISTS "Sales viewable by committee members and admins" ON sales_entries;
DROP POLICY IF EXISTS "Committee members and admins can create sales entries" ON sales_entries;
DROP POLICY IF EXISTS "Admins can update sales entries" ON sales_entries;
DROP POLICY IF EXISTS "Admins can delete sales entries" ON sales_entries;

-- ================================================
-- 5. RECREATE ALL RLS POLICIES WITH SUPERADMIN
-- ================================================

-- ================================
-- PROFILES
-- ================================

-- Approved members can see all profiles; pending can only see their own
CREATE POLICY "Profiles are viewable by approved members or own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    get_user_role(auth.uid()) IN ('superadmin', 'admin', 'committee_member')
    OR id = auth.uid()
  );

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Superadmins and admins can update any profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (get_user_role(auth.uid()) IN ('superadmin', 'admin'));

CREATE POLICY "Superadmins can delete profiles"
  ON profiles FOR DELETE
  TO authenticated
  USING (get_user_role(auth.uid()) = 'superadmin');

-- ================================
-- MEETINGS (exclude pending from all operations)
-- ================================
CREATE POLICY "Meetings are viewable by approved members"
  ON meetings FOR SELECT
  TO authenticated
  USING (get_user_role(auth.uid()) IN ('superadmin', 'admin', 'committee_member'));

CREATE POLICY "Committee members and above can create meetings"
  ON meetings FOR INSERT
  TO authenticated
  WITH CHECK (
    get_user_role(auth.uid()) IN ('superadmin', 'admin', 'committee_member')
  );

CREATE POLICY "Meeting creators and admins can update meetings"
  ON meetings FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid() OR
    get_user_role(auth.uid()) IN ('superadmin', 'admin')
  );

CREATE POLICY "Superadmins and admins can delete meetings"
  ON meetings FOR DELETE
  TO authenticated
  USING (get_user_role(auth.uid()) IN ('superadmin', 'admin'));

-- ================================
-- MEETING ACTION ITEMS
-- ================================
CREATE POLICY "Action items are viewable by approved members"
  ON meeting_action_items FOR SELECT
  TO authenticated
  USING (get_user_role(auth.uid()) IN ('superadmin', 'admin', 'committee_member'));

CREATE POLICY "Committee members and above can create action items"
  ON meeting_action_items FOR INSERT
  TO authenticated
  WITH CHECK (
    get_user_role(auth.uid()) IN ('superadmin', 'admin', 'committee_member')
  );

CREATE POLICY "Assigned users and committee can update action items"
  ON meeting_action_items FOR UPDATE
  TO authenticated
  USING (
    assigned_to = auth.uid() OR
    get_user_role(auth.uid()) IN ('superadmin', 'admin', 'committee_member')
  );

CREATE POLICY "Superadmins and admins can delete action items"
  ON meeting_action_items FOR DELETE
  TO authenticated
  USING (get_user_role(auth.uid()) IN ('superadmin', 'admin'));

-- ================================
-- TASKS
-- ================================
CREATE POLICY "Tasks are viewable by approved members"
  ON tasks FOR SELECT
  TO authenticated
  USING (get_user_role(auth.uid()) IN ('superadmin', 'admin', 'committee_member'));

CREATE POLICY "Approved members can create tasks"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role(auth.uid()) IN ('superadmin', 'admin', 'committee_member'));

CREATE POLICY "Task owners, assignees and committee can update tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid() OR
    assigned_to = auth.uid() OR
    get_user_role(auth.uid()) IN ('superadmin', 'admin', 'committee_member')
  );

CREATE POLICY "Task creators and admins can delete tasks"
  ON tasks FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid() OR
    get_user_role(auth.uid()) IN ('superadmin', 'admin')
  );

-- ================================
-- EVENTS
-- ================================
CREATE POLICY "Events are viewable by approved members"
  ON events FOR SELECT
  TO authenticated
  USING (get_user_role(auth.uid()) IN ('superadmin', 'admin', 'committee_member'));

CREATE POLICY "Committee members and above can create events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (
    get_user_role(auth.uid()) IN ('superadmin', 'admin', 'committee_member')
  );

CREATE POLICY "Event creators and admins can update events"
  ON events FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid() OR
    get_user_role(auth.uid()) IN ('superadmin', 'admin')
  );

CREATE POLICY "Superadmins and admins can delete events"
  ON events FOR DELETE
  TO authenticated
  USING (get_user_role(auth.uid()) IN ('superadmin', 'admin'));

-- ================================
-- SALES ENTRIES
-- ================================
CREATE POLICY "Sales viewable by committee members and above"
  ON sales_entries FOR SELECT
  TO authenticated
  USING (
    get_user_role(auth.uid()) IN ('superadmin', 'admin', 'committee_member')
  );

CREATE POLICY "Committee members and above can create sales entries"
  ON sales_entries FOR INSERT
  TO authenticated
  WITH CHECK (
    get_user_role(auth.uid()) IN ('superadmin', 'admin', 'committee_member')
  );

CREATE POLICY "Superadmins and admins can update sales entries"
  ON sales_entries FOR UPDATE
  TO authenticated
  USING (get_user_role(auth.uid()) IN ('superadmin', 'admin'));

CREATE POLICY "Superadmins and admins can delete sales entries"
  ON sales_entries FOR DELETE
  TO authenticated
  USING (get_user_role(auth.uid()) IN ('superadmin', 'admin'));

-- ================================================
-- 6. PROMOTE SUPERADMIN
-- ================================================
UPDATE profiles SET role = 'superadmin' WHERE email = 'ludo47j@gmail.com';
