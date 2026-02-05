-- AEEG Dashboard - Row Level Security Policies

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_entries ENABLE ROW LEVEL SECURITY;

-- Helper function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = user_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- ================================
-- PROFILES
-- ================================
CREATE POLICY "Profiles are viewable by authenticated users"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (get_user_role(auth.uid()) = 'admin');

-- ================================
-- MEETINGS
-- ================================
CREATE POLICY "Meetings are viewable by authenticated users"
  ON meetings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Committee members and admins can create meetings"
  ON meetings FOR INSERT
  TO authenticated
  WITH CHECK (
    get_user_role(auth.uid()) IN ('admin', 'committee_member')
  );

CREATE POLICY "Meeting creators and admins can update meetings"
  ON meetings FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid() OR
    get_user_role(auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can delete meetings"
  ON meetings FOR DELETE
  TO authenticated
  USING (get_user_role(auth.uid()) = 'admin');

-- ================================
-- MEETING ACTION ITEMS
-- ================================
CREATE POLICY "Action items are viewable by authenticated users"
  ON meeting_action_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Committee members and admins can create action items"
  ON meeting_action_items FOR INSERT
  TO authenticated
  WITH CHECK (
    get_user_role(auth.uid()) IN ('admin', 'committee_member')
  );

CREATE POLICY "Assigned users, committee members and admins can update action items"
  ON meeting_action_items FOR UPDATE
  TO authenticated
  USING (
    assigned_to = auth.uid() OR
    get_user_role(auth.uid()) IN ('admin', 'committee_member')
  );

CREATE POLICY "Admins can delete action items"
  ON meeting_action_items FOR DELETE
  TO authenticated
  USING (get_user_role(auth.uid()) = 'admin');

-- ================================
-- TASKS
-- ================================
CREATE POLICY "Tasks are viewable by authenticated users"
  ON tasks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create tasks"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Task owners, assignees and committee can update tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid() OR
    assigned_to = auth.uid() OR
    get_user_role(auth.uid()) IN ('admin', 'committee_member')
  );

CREATE POLICY "Task creators and admins can delete tasks"
  ON tasks FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid() OR
    get_user_role(auth.uid()) = 'admin'
  );

-- ================================
-- EVENTS
-- ================================
CREATE POLICY "Events are viewable by authenticated users"
  ON events FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Committee members and admins can create events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (
    get_user_role(auth.uid()) IN ('admin', 'committee_member')
  );

CREATE POLICY "Event creators and admins can update events"
  ON events FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid() OR
    get_user_role(auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can delete events"
  ON events FOR DELETE
  TO authenticated
  USING (get_user_role(auth.uid()) = 'admin');

-- ================================
-- SALES ENTRIES
-- ================================
CREATE POLICY "Sales viewable by committee members and admins"
  ON sales_entries FOR SELECT
  TO authenticated
  USING (
    get_user_role(auth.uid()) IN ('admin', 'committee_member')
  );

CREATE POLICY "Committee members and admins can create sales entries"
  ON sales_entries FOR INSERT
  TO authenticated
  WITH CHECK (
    get_user_role(auth.uid()) IN ('admin', 'committee_member')
  );

CREATE POLICY "Admins can update sales entries"
  ON sales_entries FOR UPDATE
  TO authenticated
  USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can delete sales entries"
  ON sales_entries FOR DELETE
  TO authenticated
  USING (get_user_role(auth.uid()) = 'admin');
