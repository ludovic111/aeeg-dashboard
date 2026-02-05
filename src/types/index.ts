export type UserRole = "superadmin" | "admin" | "committee_member" | "pending";
export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type EventType = "meeting" | "event" | "deadline" | "sale_campaign";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url: string | null;
  phone: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export interface Meeting {
  id: string;
  title: string;
  date: string;
  location: string | null;
  agenda: string | null;
  minutes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  creator?: Profile;
  action_items?: MeetingActionItem[];
}

export interface MeetingActionItem {
  id: string;
  meeting_id: string;
  assigned_to: string | null;
  description: string;
  status: string;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  assignee?: Profile;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigned_to: string | null;
  deadline: string | null;
  created_by: string | null;
  position: number;
  created_at: string;
  updated_at: string;
  // Joined
  assignee?: Profile;
  creator?: Profile;
}

export interface CalendarEvent {
  id: string;
  title: string;
  type: EventType;
  start_date: string;
  end_date: string;
  description: string | null;
  color: string;
  location: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  creator?: Profile;
}

export interface SalesEntry {
  id: string;
  product_name: string;
  quantity: number;
  revenue: number;
  date: string;
  source: string;
  shopify_order_id: string | null;
  created_by: string | null;
  created_at: string;
  // Joined
  creator?: Profile;
}

export interface SalesStats {
  totalRevenue: number;
  orderCount: number;
  averageOrder: number;
}
