-- AEEG Dashboard - Initial Schema
-- Association d'élèves d'Émilie Gourd

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Custom types
CREATE TYPE user_role AS ENUM ('admin', 'committee_member', 'regular_member');
CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'done');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE event_type AS ENUM ('meeting', 'event', 'deadline', 'sale_campaign');

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  role user_role DEFAULT 'regular_member' NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Meetings table
CREATE TABLE meetings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  location TEXT,
  agenda TEXT,
  minutes TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Meeting action items
CREATE TABLE meeting_action_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE NOT NULL,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL,
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Tasks table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  status task_status DEFAULT 'todo' NOT NULL,
  priority task_priority DEFAULT 'medium' NOT NULL,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  deadline TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  position INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Events table
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  type event_type DEFAULT 'event' NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#4ECDC4' NOT NULL,
  location TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Sales entries table
CREATE TABLE sales_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  revenue NUMERIC(10, 2) NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  source TEXT DEFAULT 'manual' NOT NULL,
  shopify_order_id TEXT UNIQUE,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_meetings_date ON meetings(date DESC);
CREATE INDEX idx_meetings_created_by ON meetings(created_by);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_deadline ON tasks(deadline);
CREATE INDEX idx_tasks_position ON tasks(status, position);
CREATE INDEX idx_events_start_date ON events(start_date);
CREATE INDEX idx_events_type ON events(type);
CREATE INDEX idx_sales_date ON sales_entries(date DESC);
CREATE INDEX idx_sales_source ON sales_entries(source);
CREATE INDEX idx_action_items_meeting ON meeting_action_items(meeting_id);
CREATE INDEX idx_action_items_assigned ON meeting_action_items(assigned_to);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meetings_updated_at
  BEFORE UPDATE ON meetings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_action_items_updated_at
  BEFORE UPDATE ON meeting_action_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
