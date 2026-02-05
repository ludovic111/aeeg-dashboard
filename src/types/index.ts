export type UserRole = "superadmin" | "admin" | "committee_member" | "pending";
export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type FeedbackKind = "issue" | "recommendation";
export type FeedbackStatus = "open" | "resolved";
export type OrderProduct = "emilie_gourde" | "sweat_emilie_gourd";
export type SweatColor = "gris" | "bleu_marine" | "vert" | "noir" | "rose";
export type SweatSize = "s" | "m" | "l" | "xl";

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
  agenda_pdf_path: string | null;
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

export interface CustomerOrder {
  id: string;
  order_number: string;
  full_name: string;
  order_details: string;
  order_items: CustomerOrderItem[];
  email: string | null;
  imported_at: string;
  created_at: string;
  updated_at: string;
}

export interface CustomerOrderItem {
  product: OrderProduct;
  quantity: number;
  color?: SweatColor;
  size?: SweatSize;
}

export interface UserFeedback {
  id: string;
  kind: FeedbackKind;
  title: string;
  description: string;
  status: FeedbackStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  creator?: Pick<Profile, "id" | "full_name" | "email" | "avatar_url">;
}
