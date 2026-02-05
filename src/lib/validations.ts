import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Adresse e-mail invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

export const registerSchema = z
  .object({
    full_name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
    email: z.string().email("Adresse e-mail invalide"),
    password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export const meetingSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  date: z.string().min(1, "La date est requise"),
  location: z.string().optional(),
  agenda: z.string().optional(),
  minutes: z.string().optional(),
});

export const actionItemSchema = z.object({
  description: z.string().min(1, "La description est requise"),
  assigned_to: z.string().optional(),
  due_date: z.string().optional(),
});

export const taskSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  description: z.string().optional(),
  status: z.enum(["todo", "in_progress", "done"]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  assigned_to: z.string().optional(),
  deadline: z.string().optional(),
});

export const eventSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  type: z.enum(["meeting", "event", "deadline", "sale_campaign"]),
  start_date: z.string().min(1, "La date de début est requise"),
  end_date: z.string().min(1, "La date de fin est requise"),
  description: z.string().optional(),
  location: z.string().optional(),
  color: z.string(),
});

export const salesEntrySchema = z.object({
  product_name: z.string().min(1, "Le nom du produit est requis"),
  quantity: z.number().min(1, "La quantité doit être au moins 1"),
  revenue: z.number().min(0, "Le revenu doit être positif"),
  date: z.string().min(1, "La date est requise"),
});

export const customerOrderSchema = z.object({
  order_number: z
    .string()
    .min(1, "Le numéro de commande est requis")
    .regex(/^#\d+$/, "Le numéro doit être au format #1234"),
  full_name: z.string().min(1, "Le nom est requis"),
  email: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || undefined)
    .refine((value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), {
      message: "Adresse e-mail invalide",
    }),
  order_details: z.string().min(1, "Le détail de la commande est requis"),
});

export const profileSchema = z.object({
  full_name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  phone: z.string().optional(),
  bio: z.string().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type MeetingFormData = z.infer<typeof meetingSchema>;
export type ActionItemFormData = z.infer<typeof actionItemSchema>;
export type TaskFormData = z.infer<typeof taskSchema>;
export type EventFormData = z.infer<typeof eventSchema>;
export type SalesEntryFormData = z.infer<typeof salesEntrySchema>;
export type CustomerOrderFormData = z.infer<typeof customerOrderSchema>;
export type ProfileFormData = z.infer<typeof profileSchema>;
