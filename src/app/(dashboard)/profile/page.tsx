"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Camera, Save } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import {
  profileSettingsSchema,
  type ProfileSettingsFormData,
} from "@/lib/validations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

export default function ProfilePage() {
  const { profile, loading } = useAuth();
  const supabase = createClient();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileSettingsFormData>({
    resolver: zodResolver(profileSettingsSchema),
    values: {
      full_name: profile?.full_name || "",
      email: profile?.email || "",
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const onAvatarSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Le fichier doit être une image");
      return;
    }

    if (file.size > MAX_AVATAR_SIZE) {
      toast.error("Image trop volumineuse (max 5MB)");
      return;
    }

    if (avatarPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const onSubmit = async (data: ProfileSettingsFormData) => {
    if (!profile) return;
    setSaving(true);

    let avatarUrl = profile.avatar_url;
    let effectiveEmail = profile.email;

    if (avatarFile) {
      const sanitizedName = avatarFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const filePath = `${profile.id}/${avatarFile.lastModified}-${avatarFile.size}-${sanitizedName}`;
      const { error: uploadError } = await supabase.storage
        .from("profile-avatars")
        .upload(filePath, avatarFile, {
          upsert: true,
          contentType: avatarFile.type,
        });

      if (uploadError) {
        toast.error(uploadError.message || "Impossible d'envoyer l'image");
        setSaving(false);
        return;
      }

      avatarUrl = supabase.storage
        .from("profile-avatars")
        .getPublicUrl(filePath).data.publicUrl;
    }

    const normalizedEmail = data.email.trim().toLowerCase();
    const authPayload: { email?: string; password?: string } = {};

    if (normalizedEmail !== profile.email) {
      authPayload.email = normalizedEmail;
    }

    if (data.password) {
      authPayload.password = data.password;
    }

    if (Object.keys(authPayload).length > 0) {
      const { data: authData, error: authError } =
        await supabase.auth.updateUser(authPayload);

      if (authError) {
        toast.error(authError.message || "Erreur lors de la mise à jour du compte");
        setSaving(false);
        return;
      }

      if (authPayload.email) {
        effectiveEmail = authData.user?.email || normalizedEmail;
        toast.success("Email mis à jour. Vérifiez votre boîte mail si confirmation requise.");
      }

      if (authPayload.password) {
        toast.success("Mot de passe mis à jour.");
      }
    }

    const updates: {
      full_name?: string;
      avatar_url?: string | null;
      email?: string;
    } = {};

    if (data.full_name !== profile.full_name) {
      updates.full_name = data.full_name;
    }

    if (avatarUrl !== profile.avatar_url) {
      updates.avatar_url = avatarUrl;
    }

    if (effectiveEmail !== profile.email) {
      updates.email = effectiveEmail;
    }

    if (Object.keys(updates).length > 0) {
      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", profile.id);

      if (error) {
        toast.error(error.message || "Erreur lors de la mise à jour du profil");
        setSaving(false);
        return;
      }
    }

    toast.success("Profil mis à jour !");
    setAvatarFile(null);
    setAvatarPreview(null);
    reset({
      full_name: data.full_name,
      email: effectiveEmail,
      password: "",
      confirmPassword: "",
    });
    router.refresh();
    setSaving(false);
  };

  if (loading || !profile) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-72" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="display-hero max-w-[9ch]">Mon profil</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Modifier votre photo, nom, email et mot de passe
        </p>
      </div>

      <Card accentColor="#4ECDC4">
        <CardHeader>
          <CardTitle>Informations personnelles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <Avatar
              name={profile.full_name || profile.email}
              src={avatarPreview || profile.avatar_url}
              size="lg"
            />
            <div className="space-y-2 text-center sm:text-left">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={onAvatarSelect}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="h-4 w-4" strokeWidth={3} />
                Changer la photo
              </Button>
              <p className="text-xs font-bold text-[var(--foreground)]/50">
                JPG, PNG, WEBP (max 5MB)
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nom complet</Label>
              <Input id="full_name" {...register("full_name")} />
              {errors.full_name && (
                <p className="text-sm font-bold text-[var(--accent-orange)]">
                  {errors.full_name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register("email")} />
              {errors.email && (
                <p className="text-sm font-bold text-[var(--accent-orange)]">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Nouveau mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Laisser vide pour ne pas changer"
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-sm font-bold text-[var(--accent-orange)]">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmer mot de passe</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Répéter le mot de passe"
                  {...register("confirmPassword")}
                />
                {errors.confirmPassword && (
                  <p className="text-sm font-bold text-[var(--accent-orange)]">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>

            <Button type="submit" disabled={saving}>
              <Save className="h-4 w-4" strokeWidth={3} />
              {saving ? "Enregistrement..." : "Enregistrer les modifications"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
