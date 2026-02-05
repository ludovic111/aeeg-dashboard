export const ROLES = {
  superadmin: { label: "Super Admin", color: "bg-brutal-red" },
  admin: { label: "Admin", color: "bg-brutal-coral" },
  committee_member: { label: "Membre du comité", color: "bg-brutal-purple" },
  pending: { label: "En attente", color: "bg-brutal-yellow" },
} as const;

export const TASK_STATUSES = {
  todo: { label: "À faire", color: "bg-brutal-yellow", textColor: "text-black" },
  in_progress: { label: "En cours", color: "bg-brutal-teal", textColor: "text-black" },
  done: { label: "Terminé", color: "bg-brutal-mint", textColor: "text-black" },
} as const;

export const TASK_PRIORITIES = {
  low: { label: "Basse", color: "bg-brutal-mint", textColor: "text-black" },
  medium: { label: "Moyenne", color: "bg-brutal-yellow", textColor: "text-black" },
  high: { label: "Haute", color: "bg-brutal-coral", textColor: "text-black" },
  urgent: { label: "Urgente", color: "bg-brutal-red", textColor: "text-white" },
} as const;

export const BRUTAL_COLORS = {
  red: "#FF6B6B",
  teal: "#4ECDC4",
  yellow: "#FFE66D",
  mint: "#95E1D3",
  coral: "#F38181",
  purple: "#AA96DA",
} as const;
