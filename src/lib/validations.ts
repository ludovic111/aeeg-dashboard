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

export const profileSettingsSchema = z
  .object({
    full_name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
    email: z.string().email("Adresse e-mail invalide"),
    password: z.string().optional(),
    confirmPassword: z.string().optional(),
  })
  .refine(
    (data) => {
      if (!data.password && !data.confirmPassword) return true;
      return data.password === data.confirmPassword;
    },
    {
      message: "Les mots de passe ne correspondent pas",
      path: ["confirmPassword"],
    }
  )
  .refine(
    (data) => {
      if (!data.password) return true;
      return data.password.length >= 6;
    },
    {
      message: "Le mot de passe doit contenir au moins 6 caractères",
      path: ["password"],
    }
  );

export const feedbackSchema = z.object({
  kind: z.enum(["issue", "recommendation"]),
  title: z.string().min(3, "Le titre doit contenir au moins 3 caractères"),
  description: z.string().min(5, "La description doit contenir au moins 5 caractères"),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type MeetingFormData = z.infer<typeof meetingSchema>;
export type ActionItemFormData = z.infer<typeof actionItemSchema>;
export type TaskFormData = z.infer<typeof taskSchema>;
export type CustomerOrderFormData = z.infer<typeof customerOrderSchema>;
export type ProfileFormData = z.infer<typeof profileSchema>;
export type ProfileSettingsFormData = z.infer<typeof profileSettingsSchema>;
export type FeedbackFormData = z.infer<typeof feedbackSchema>;
