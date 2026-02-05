"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileSchema, type ProfileFormData } from "@/lib/validations";
import { useUpdateProfile } from "@/hooks/use-members";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ROLES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import type { Profile } from "@/types";

interface MemberProfileProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: Profile | null;
  isOwnProfile: boolean;
  onRefresh: () => void;
}

export function MemberProfile({
  open,
  onOpenChange,
  member,
  isOwnProfile,
  onRefresh,
}: MemberProfileProps) {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const { updateProfile } = useUpdateProfile();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    values: {
      full_name: member?.full_name || "",
      phone: member?.phone || "",
      bio: member?.bio || "",
    },
  });

  if (!member) return null;

  const onSubmit = async (data: ProfileFormData) => {
    setLoading(true);
    const { error } = await updateProfile(member.id, {
      full_name: data.full_name,
      phone: data.phone || undefined,
      bio: data.bio || undefined,
    });
    if (error) {
      toast.error("Erreur lors de la mise à jour");
    } else {
      toast.success("Profil mis à jour !");
      setEditing(false);
      onRefresh();
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Profil du membre</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center text-center py-4">
          <Avatar
            name={member.full_name || member.email}
            src={member.avatar_url}
            size="lg"
          />
          <h3 className="font-black text-xl mt-3">
            {member.full_name || "Sans nom"}
          </h3>
          <Badge
            variant={
              member.role === "superadmin"
                ? "danger"
                : member.role === "admin"
                ? "coral"
                : member.role === "committee_member"
                ? "purple"
                : "warning"
            }
            className="mt-2"
          >
            {ROLES[member.role].label}
          </Badge>
          <p className="text-xs font-mono text-[var(--foreground)]/50 mt-2">
            Membre depuis {formatDate(member.created_at)}
          </p>
        </div>

        <Separator />

        {editing ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nom complet</Label>
              <Input id="edit-name" {...register("full_name")} />
              {errors.full_name && (
                <p className="text-sm font-bold text-brutal-red">
                  {errors.full_name.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Téléphone</Label>
              <Input
                id="edit-phone"
                placeholder="+41 XX XXX XX XX"
                {...register("phone")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-bio">Bio</Label>
              <Textarea
                id="edit-bio"
                placeholder="Quelques mots sur vous..."
                rows={3}
                {...register("bio")}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditing(false)}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-3 pt-4">
            <div>
              <p className="text-xs font-bold text-[var(--foreground)]/50 uppercase">
                E-mail
              </p>
              <p className="font-mono text-sm">{member.email}</p>
            </div>
            {member.phone && (
              <div>
                <p className="text-xs font-bold text-[var(--foreground)]/50 uppercase">
                  Téléphone
                </p>
                <p className="font-mono text-sm">{member.phone}</p>
              </div>
            )}
            {member.bio && (
              <div>
                <p className="text-xs font-bold text-[var(--foreground)]/50 uppercase">
                  Bio
                </p>
                <p className="text-sm">{member.bio}</p>
              </div>
            )}

            {isOwnProfile && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => setEditing(true)}
              >
                Modifier mon profil
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
