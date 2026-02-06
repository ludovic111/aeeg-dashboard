"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { registerSchema, type RegisterFormData } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.full_name,
        },
      },
    });

    if (error) {
      toast.error(error.message || "Erreur lors de l'envoi de la demande.");
      setLoading(false);
      return;
    }

    toast.success(
      "Demande envoyee ! Un administrateur examinera votre demande."
    );
    router.push("/login");
  };

  return (
    <Card accentColor="#D4A847">
      <CardHeader>
        <CardTitle className="text-[2rem]">Demander l&apos;acces</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          Ce site est reserve aux membres du comite de l&apos;AEEG.
          Remplissez ce formulaire pour demander l&apos;acces.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Nom complet</Label>
            <Input
              id="full_name"
              placeholder="Marie Dupont"
              {...register("full_name")}
            />
            {errors.full_name && (
              <p className="text-sm text-[var(--accent-orange)]">
                {errors.full_name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Adresse e-mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="prenom.nom@edu.ge.ch"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-[var(--accent-orange)]">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-[var(--accent-orange)]">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-[var(--accent-orange)]">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <Button type="submit" variant="purple" className="w-full" disabled={loading}>
            {loading ? "Envoi en cours..." : "Envoyer la demande"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm">
            Deja un compte ?{" "}
            <Link
              href="/login"
              className="text-[var(--accent-gold)] underline underline-offset-4 transition-colors hover:opacity-80"
            >
              Se connecter
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
