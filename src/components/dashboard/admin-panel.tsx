"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check, X, Trash2, Shield } from "lucide-react";
import { useAdmin } from "@/hooks/use-admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate } from "@/lib/utils";
import type { UserRole } from "@/types";

export function AdminPanel() {
  const {
    pendingMembers,
    allMembers,
    loading,
    approveMember,
    rejectMember,
    updateMemberRole,
    deleteMember,
  } = useAdmin();
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  const addProcessing = (id: string) =>
    setProcessingIds((prev) => new Set(prev).add(id));
  const removeProcessing = (id: string) =>
    setProcessingIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });

  const handleApprove = async (id: string, name: string) => {
    addProcessing(id);
    const { error } = await approveMember(id);
    if (error) {
      toast.error("Erreur lors de l'approbation");
    } else {
      toast.success(`${name || "Membre"} approuve !`);
    }
    removeProcessing(id);
  };

  const handleReject = async (id: string, name: string) => {
    if (!confirm(`Rejeter la demande de ${name || "ce membre"} ? Son compte sera supprime.`))
      return;
    addProcessing(id);
    const { error } = await rejectMember(id);
    if (error) {
      toast.error(typeof error === "string" ? error : "Erreur lors du rejet");
    } else {
      toast.success("Demande rejetee");
    }
    removeProcessing(id);
  };

  const handleRoleChange = async (
    id: string,
    role: UserRole,
    name: string
  ) => {
    addProcessing(id);
    const { error } = await updateMemberRole(id, role);
    if (error) {
      toast.error("Erreur lors du changement de role");
    } else {
      toast.success(`Role de ${name || "membre"} mis a jour`);
    }
    removeProcessing(id);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Supprimer definitivement ${name || "ce membre"} ?`)) return;
    addProcessing(id);
    const { error } = await deleteMember(id);
    if (error) {
      toast.error(typeof error === "string" ? error : "Erreur lors de la suppression");
    } else {
      toast.success("Membre supprime");
    }
    removeProcessing(id);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="h-6 w-6 text-[var(--accent-orange)]" strokeWidth={3} />
        <h2 className="font-[var(--font-display)] text-[2rem] leading-none">Administration</h2>
      </div>

      {/* Pending Requests */}
      <Card accentColor="var(--card-accent-yellow)">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            Demandes en attente
            {pendingMembers.length > 0 && (
              <Badge variant="warning">{pendingMembers.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingMembers.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-[var(--text-secondary)]">
                Aucune demande en attente
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-[var(--radius-element)] border-2 border-[var(--border-color)] bg-[var(--card-bg)]"
                >
                  <Avatar
                    name={member.full_name || member.email}
                    src={member.avatar_url}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-sm truncate">
                      {member.full_name || "Sans nom"}
                    </p>
                    <p className="font-mono text-xs text-[var(--text-secondary)] truncate">
                      {member.email}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      Demande le {formatDate(member.created_at)}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 sm:flex gap-2 w-full sm:w-auto shrink-0">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() =>
                        handleApprove(member.id, member.full_name)
                      }
                      disabled={processingIds.has(member.id)}
                      className="bg-brutal-teal hover:bg-brutal-mint w-full sm:w-auto"
                    >
                      <Check className="h-4 w-4" strokeWidth={3} />
                      <span>Approuver</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() =>
                        handleReject(member.id, member.full_name)
                      }
                      disabled={processingIds.has(member.id)}
                      className="w-full sm:w-auto"
                    >
                      <X className="h-4 w-4" strokeWidth={3} />
                      <span>Rejeter</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Member Management */}
      <Card accentColor="var(--card-accent-purple)">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            Gestion des membres
            <Badge variant="purple">{allMembers.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {allMembers.length === 0 ? (
            <p className="text-sm font-bold text-[var(--text-secondary)] text-center py-6">
              Aucun membre actif
            </p>
          ) : (
            <div className="space-y-3">
              {allMembers.map((member) => {
                const isSelf = member.role === "superadmin";
                return (
                  <div
                    key={member.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-[var(--radius-element)] border-2 border-[var(--border-color)] bg-[var(--card-bg)]"
                  >
                    <Avatar
                      name={member.full_name || member.email}
                      src={member.avatar_url}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-sm truncate">
                        {member.full_name || "Sans nom"}
                        {isSelf && (
                          <span className="text-[var(--accent-orange)] ml-1">(vous)</span>
                        )}
                      </p>
                      <p className="font-mono text-xs text-[var(--text-secondary)] truncate">
                        {member.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                      {isSelf ? (
                        <Badge variant="danger">Super Admin</Badge>
                      ) : (
                        <>
                          <Select
                            value={member.role}
                            onValueChange={(value) =>
                              handleRoleChange(
                                member.id,
                                value as UserRole,
                                member.full_name
                              )
                            }
                            disabled={processingIds.has(member.id)}
                          >
                            <SelectTrigger className="w-full sm:w-[170px] h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="committee_member">
                                Membre du comite
                              </SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            size="icon"
                            variant="destructive"
                            className="h-8 w-8"
                            onClick={() =>
                              handleDelete(member.id, member.full_name)
                            }
                            disabled={processingIds.has(member.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" strokeWidth={3} />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
