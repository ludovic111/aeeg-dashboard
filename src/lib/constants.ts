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

export const EVENT_TYPES = {
  meeting: { label: "Réunion", color: "#4ECDC4", icon: "📋" },
  event: { label: "Événement", color: "#AA96DA", icon: "🎉" },
  deadline: { label: "Échéance", color: "#FF6B6B", icon: "⏰" },
  sale_campaign: { label: "Campagne de vente", color: "#FFE66D", icon: "🛍️" },
} as const;

export const BRUTAL_COLORS = {
  red: "#FF6B6B",
  teal: "#4ECDC4",
  yellow: "#FFE66D",
  mint: "#95E1D3",
  coral: "#F38181",
  purple: "#AA96DA",
} as const;

export const COLOR_OPTIONS = [
  { value: "#FF6B6B", label: "Rouge" },
  { value: "#4ECDC4", label: "Turquoise" },
  { value: "#FFE66D", label: "Jaune" },
  { value: "#95E1D3", label: "Menthe" },
  { value: "#F38181", label: "Corail" },
  { value: "#AA96DA", label: "Violet" },
] as const;

export const NAV_ITEMS = [
  { href: "/", label: "Tableau de bord", icon: "LayoutDashboard" },
  { href: "/meetings", label: "Réunions", icon: "ClipboardList" },
  { href: "/tasks", label: "Tâches", icon: "CheckSquare" },
  { href: "/orders", label: "Commandes", icon: "PackageSearch" },
  { href: "/members", label: "Membres", icon: "Users" },
] as const;

export const CALENDAR_MESSAGES = {
  allDay: "Toute la journée",
  previous: "Précédent",
  next: "Suivant",
  today: "Aujourd'hui",
  month: "Mois",
  week: "Semaine",
  day: "Jour",
  agenda: "Agenda",
  date: "Date",
  time: "Heure",
  event: "Événement",
  noEventsInRange: "Aucun événement dans cette période.",
  showMore: (total: number) => `+ ${total} de plus`,
};
