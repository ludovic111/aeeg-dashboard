"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { LogIn } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { loginSchema, type LoginFormData } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      toast.error("Identifiants incorrects. Veuillez réessayer.");
      setLoading(false);
      return;
    }

    toast.success("Connexion réussie !");
    router.push("/");
    router.refresh();
  };

  return (
    <Card accentColor="#4ECDC4">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <LogIn className="h-6 w-6" strokeWidth={3} />
          Connexion
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Adresse e-mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="prenom.nom@edu.ge.ch"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm font-bold text-brutal-red">
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
              <p className="text-sm font-bold text-brutal-red">
                {errors.password.message}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Connexion en cours..." : "Se connecter"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm font-bold">
            Pas encore de compte ?{" "}
            <Link
              href="/register"
              className="text-brutal-teal underline underline-offset-4 hover:text-brutal-coral transition-colors"
            >
              Demander l&apos;acces
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
