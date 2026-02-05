export type UserRole = "superadmin" | "admin" | "committee_member" | "pending";
export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type FeedbackKind = "issue" | "recommendation";
export type FeedbackStatus = "open" | "resolved";
export type PartyMemberRole = "manager" | "member";
export type PartyTaskStatus = "todo" | "done";
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
  agenda_ai_summary: string | null;
  minutes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  creator?: Profile;
  action_items?: MeetingActionItem[];
}

export interface Poll {
  id: string;
  question: string;
  description: string | null;
  closes_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  creator?: Pick<Profile, "id" | "full_name" | "avatar_url">;
  options?: PollOption[];
}

export interface PollOption {
  id: string;
  poll_id: string;
  label: string;
  position: number;
  created_at: string;
}

export interface PollVote {
  id: string;
  poll_id: string;
  option_id: string;
  voter_id: string;
  created_at: string;
  voter?: Pick<Profile, "id" | "full_name" | "email" | "avatar_url">;
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

export interface SharedFolder {
  id: string;
  name: string;
  parent_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SharedFile {
  id: string;
  folder_id: string | null;
  name: string;
  storage_path: string;
  mime_type: string | null;
  size_bytes: number;
  created_by: string | null;
  created_at: string;
}

export interface Party {
  id: string;
  name: string;
  event_date: string;
  event_time: string;
  place: string;
  manager_id: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  manager?: Pick<Profile, "id" | "full_name" | "email" | "avatar_url">;
}

export interface PartyMember {
  id: string;
  party_id: string;
  profile_id: string;
  role: PartyMemberRole;
  created_at: string;
  profile?: Pick<Profile, "id" | "full_name" | "email" | "avatar_url">;
}

export interface PartyTask {
  id: string;
  party_id: string;
  title: string;
  description: string | null;
  assigned_to: string;
  status: PartyTaskStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  assignee?: Pick<Profile, "id" | "full_name" | "avatar_url">;
  creator?: Pick<Profile, "id" | "full_name" | "avatar_url">;
}

export interface PartyGroceryItem {
  id: string;
  party_id: string;
  label: string;
  quantity: string | null;
  checked: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  creator?: Pick<Profile, "id" | "full_name" | "avatar_url">;
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
