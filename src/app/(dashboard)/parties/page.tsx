"use client";

import { useMemo, useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  ListChecks,
  MapPin,
  PartyPopper,
  Plus,
  ShoppingBasket,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useParties } from "@/hooks/use-parties";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

function formatPartyDateTime(date: string, time: string) {
  const safeTime = time?.slice(0, 5) || "00:00";
  const dateTime = new Date(`${date}T${safeTime}`);

  if (Number.isNaN(dateTime.getTime())) {
    return `${date} ${safeTime}`;
  }

  return dateTime.toLocaleString("fr-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PartiesPage() {
  const { profile, isAdmin, isCommitteeMember } = useAuth();
  const {
    parties,
    availableProfiles,
    loading,
    createParty,
    addPartyMember,
    removePartyMember,
    createPartyTask,
    updatePartyTaskStatus,
    createGroceryItem,
    toggleGroceryItem,
    deleteParty,
  } = useParties();

  const [selectedPartyId, setSelectedPartyId] = useState<string | null>(null);

  const [newPartyName, setNewPartyName] = useState("");
  const [newPartyDate, setNewPartyDate] = useState("");
  const [newPartyTime, setNewPartyTime] = useState("");
  const [newPartyPlace, setNewPartyPlace] = useState("");
  const [newPartyManagerId, setNewPartyManagerId] = useState("");
  const [creatingParty, setCreatingParty] = useState(false);

  const [memberToAddId, setMemberToAddId] = useState("");
  const [addingMember, setAddingMember] = useState(false);

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskAssigneeId, setNewTaskAssigneeId] = useState("");
  const [creatingTask, setCreatingTask] = useState(false);

  const [newGroceryLabel, setNewGroceryLabel] = useState("");
  const [newGroceryQuantity, setNewGroceryQuantity] = useState("");
  const [creatingGroceryItem, setCreatingGroceryItem] = useState(false);
  const [deletingPartyId, setDeletingPartyId] = useState<string | null>(null);

  const effectiveSelectedPartyId =
    selectedPartyId && parties.some((party) => party.id === selectedPartyId)
      ? selectedPartyId
      : parties[0]?.id || null;

  const selectedParty = useMemo(
    () => parties.find((party) => party.id === effectiveSelectedPartyId) || null,
    [parties, effectiveSelectedPartyId]
  );

  const canManageSelectedParty = Boolean(
    selectedParty &&
      (isAdmin || selectedParty.manager_id === profile?.id)
  );

  const assignableMembers = useMemo(() => {
    if (!selectedParty) return [];
    return selectedParty.members;
  }, [selectedParty]);

  const addableMembers = useMemo(() => {
    if (!selectedParty) return [];
    const currentMemberIds = new Set(
      selectedParty.members.map((member) => member.profile_id)
    );
    return availableProfiles.filter(
      (candidate) => !currentMemberIds.has(candidate.id)
    );
  }, [availableProfiles, selectedParty]);

  if (!isCommitteeMember) {
    return (
      <div className="text-center py-16">
        <p className="text-5xl mb-4">🔒</p>
        <p className="font-black text-lg">Accès restreint</p>
        <p className="text-sm text-[var(--foreground)]/60 font-bold mt-1">
          Seuls les membres du comité et les admins peuvent accéder à cette page
        </p>
      </div>
    );
  }

  const handleCreateParty = async (event: React.FormEvent) => {
    event.preventDefault();

    if (
      !newPartyName.trim() ||
      !newPartyDate ||
      !newPartyTime ||
      !newPartyPlace.trim() ||
      !newPartyManagerId
    ) {
      toast.error("Complétez tous les champs de la soirée");
      return;
    }

    setCreatingParty(true);

    const { error, partyId } = await createParty({
      name: newPartyName,
      event_date: newPartyDate,
      event_time: newPartyTime,
      place: newPartyPlace,
      manager_id: newPartyManagerId,
    });

    if (error) {
      toast.error(error.message || "Impossible de créer la soirée");
    } else {
      toast.success("Soirée créée");
      setNewPartyName("");
      setNewPartyDate("");
      setNewPartyTime("");
      setNewPartyPlace("");
      setNewPartyManagerId("");
      if (partyId) {
        setSelectedPartyId(partyId);
      }
    }

    setCreatingParty(false);
  };

  const handleAddMember = async () => {
    const effectiveMemberToAddId = memberToAddId || addableMembers[0]?.id || "";
    if (!selectedParty || !effectiveMemberToAddId) {
      toast.error("Sélectionnez un membre");
      return;
    }

    setAddingMember(true);
    const { error } = await addPartyMember(selectedParty.id, effectiveMemberToAddId);

    if (error) {
      toast.error(error.message || "Impossible d'ajouter le membre");
    } else {
      toast.success("Membre ajouté à la soirée");
      setMemberToAddId("");
    }

    setAddingMember(false);
  };

  const handleRemoveMember = async (memberId: string) => {
    const { error } = await removePartyMember(memberId);
    if (error) {
      toast.error(error.message || "Impossible de retirer le membre");
    } else {
      toast.success("Membre retiré");
    }
  };

  const handleCreateTask = async (event: React.FormEvent) => {
    event.preventDefault();
    const effectiveTaskAssigneeId =
      newTaskAssigneeId || assignableMembers[0]?.profile_id || "";
    if (!selectedParty || !newTaskTitle.trim() || !effectiveTaskAssigneeId) {
      toast.error("Titre et assignation requis");
      return;
    }

    setCreatingTask(true);
    const { error } = await createPartyTask({
      party_id: selectedParty.id,
      title: newTaskTitle,
      description: newTaskDescription,
      assigned_to: effectiveTaskAssigneeId,
    });

    if (error) {
      toast.error(error.message || "Impossible de créer la tâche");
    } else {
      toast.success("Tâche créée");
      setNewTaskTitle("");
      setNewTaskDescription("");
    }

    setCreatingTask(false);
  };

  const handleToggleTask = async (taskId: string, checked: boolean) => {
    const { error } = await updatePartyTaskStatus(
      taskId,
      checked ? "done" : "todo"
    );
    if (error) {
      toast.error(error.message || "Impossible de mettre à jour la tâche");
    }
  };

  const handleCreateGroceryItem = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedParty || !newGroceryLabel.trim()) {
      toast.error("Le nom de l'article est requis");
      return;
    }

    setCreatingGroceryItem(true);
    const { error } = await createGroceryItem({
      party_id: selectedParty.id,
      label: newGroceryLabel,
      quantity: newGroceryQuantity,
    });

    if (error) {
      toast.error(error.message || "Impossible d'ajouter l'article");
    } else {
      toast.success("Article ajouté à la liste");
      setNewGroceryLabel("");
      setNewGroceryQuantity("");
    }

    setCreatingGroceryItem(false);
  };

  const handleToggleGroceryItem = async (itemId: string, checked: boolean) => {
    const { error } = await toggleGroceryItem(itemId, checked);
    if (error) {
      toast.error(error.message || "Impossible de mettre à jour l'article");
    }
  };

  const handleDeleteParty = async (partyId: string, partyName: string) => {
    const confirmed = window.confirm(
      `Supprimer la soirée "${partyName}" ?\nCette action est irréversible.`
    );
    if (!confirmed) return;

    setDeletingPartyId(partyId);
    const { error } = await deleteParty(partyId);

    if (error) {
      toast.error(error.message || "Impossible de supprimer la soirée");
    } else {
      toast.success("Soirée supprimée");
      if (effectiveSelectedPartyId === partyId) {
        setSelectedPartyId(null);
      }
    }

    setDeletingPartyId(null);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-44" />
        <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-6">
          <Skeleton className="h-[420px]" />
          <Skeleton className="h-[420px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black">🎉 Soirées</h1>
        <p className="text-sm font-bold text-[var(--foreground)]/60 mt-1">
          Planifiez les soirées, assignez les tâches et pilotez la liste de courses
        </p>
      </div>

      {isAdmin && (
        <Card accentColor="#F38181">
          <CardHeader>
            <CardTitle className="text-base">Créer une soirée</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="grid grid-cols-1 xl:grid-cols-6 gap-3"
              onSubmit={handleCreateParty}
            >
              <div className="space-y-2 xl:col-span-2">
                <Label htmlFor="party-name">Nom *</Label>
                <Input
                  id="party-name"
                  placeholder="Soirée post-examens"
                  value={newPartyName}
                  onChange={(event) => setNewPartyName(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="party-date">Date *</Label>
                <Input
                  id="party-date"
                  type="date"
                  value={newPartyDate}
                  onChange={(event) => setNewPartyDate(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="party-time">Heure *</Label>
                <Input
                  id="party-time"
                  type="time"
                  value={newPartyTime}
                  onChange={(event) => setNewPartyTime(event.target.value)}
                />
              </div>

              <div className="space-y-2 xl:col-span-2">
                <Label htmlFor="party-place">Lieu *</Label>
                <Input
                  id="party-place"
                  placeholder="Salle polyvalente"
                  value={newPartyPlace}
                  onChange={(event) => setNewPartyPlace(event.target.value)}
                />
              </div>

              <div className="space-y-2 xl:col-span-2">
                <Label>Manager *</Label>
                <Select value={newPartyManagerId} onValueChange={setNewPartyManagerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir le manager" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableProfiles.map((candidate) => (
                      <SelectItem key={candidate.id} value={candidate.id}>
                        {candidate.full_name || candidate.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="xl:col-span-6">
                <Button type="submit" disabled={creatingParty}>
                  <Plus className="h-4 w-4" strokeWidth={3} />
                  {creatingParty ? "Création..." : "Créer la soirée"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-6 items-start">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Soirées actives</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {parties.length === 0 ? (
              <p className="text-sm font-bold text-[var(--foreground)]/60">
                Aucune soirée disponible.
              </p>
            ) : (
              parties.map((party) => {
                const canDeleteParty = isAdmin || party.created_by === profile?.id;
                return (
                  <div
                    key={party.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-2"
                  >
                    <Button
                      type="button"
                      variant={effectiveSelectedPartyId === party.id ? "default" : "outline"}
                      className="flex-1 justify-start h-auto py-2"
                      onClick={() => setSelectedPartyId(party.id)}
                    >
                      <div className="text-left min-w-0">
                        <p className="font-black truncate">{party.name}</p>
                        <p className="text-xs font-bold text-[var(--foreground)]/60">
                          {formatPartyDateTime(party.event_date, party.event_time)}
                        </p>
                      </div>
                    </Button>
                    {canDeleteParty && (
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        disabled={deletingPartyId === party.id}
                        onClick={() => handleDeleteParty(party.id, party.name)}
                        className="w-full sm:w-auto"
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={3} />
                        {deletingPartyId === party.id ? "Suppression..." : "Supprimer"}
                      </Button>
                    )}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {!selectedParty ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-4xl mb-2">🎈</p>
              <p className="font-black">Sélectionnez une soirée</p>
              <p className="text-sm font-bold text-[var(--foreground)]/60 mt-1">
                Choisissez une soirée pour gérer les membres, tâches et courses.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card accentColor="#FFE66D">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <PartyPopper className="h-4 w-4" strokeWidth={3} />
                  {selectedParty.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                <div className="rounded-lg border-2 border-[var(--border-color)] p-3">
                  <p className="text-xs font-black uppercase tracking-wide text-[var(--foreground)]/60">
                    Date & heure
                  </p>
                  <p className="text-sm font-bold mt-1 flex items-center gap-1">
                    <CalendarClock className="h-4 w-4" strokeWidth={3} />
                    {formatPartyDateTime(
                      selectedParty.event_date,
                      selectedParty.event_time
                    )}
                  </p>
                </div>
                <div className="rounded-lg border-2 border-[var(--border-color)] p-3">
                  <p className="text-xs font-black uppercase tracking-wide text-[var(--foreground)]/60">
                    Lieu
                  </p>
                  <p className="text-sm font-bold mt-1 flex items-center gap-1">
                    <MapPin className="h-4 w-4" strokeWidth={3} />
                    {selectedParty.place}
                  </p>
                </div>
                <div className="rounded-lg border-2 border-[var(--border-color)] p-3">
                  <p className="text-xs font-black uppercase tracking-wide text-[var(--foreground)]/60">
                    Manager
                  </p>
                  <p className="text-sm font-bold mt-1">
                    {selectedParty.manager?.full_name || "Non précisé"}
                  </p>
                </div>
                <div className="rounded-lg border-2 border-[var(--border-color)] p-3">
                  <p className="text-xs font-black uppercase tracking-wide text-[var(--foreground)]/60">
                    Vos droits
                  </p>
                  <Badge variant={canManageSelectedParty ? "success" : "info"}>
                    {canManageSelectedParty
                      ? "Manager / Admin"
                      : "Participant"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
              <Card accentColor="#AA96DA">
                <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" strokeWidth={3} />
                    Membres de la soirée
                </CardTitle>
              </CardHeader>
                <CardContent className="space-y-3">
                  {canManageSelectedParty && (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Select value={memberToAddId} onValueChange={setMemberToAddId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Ajouter un membre" />
                        </SelectTrigger>
                        <SelectContent>
                          {addableMembers.map((candidate) => (
                            <SelectItem key={candidate.id} value={candidate.id}>
                              {candidate.full_name || candidate.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        onClick={handleAddMember}
                        disabled={addingMember || !memberToAddId}
                      >
                        <Plus className="h-4 w-4" strokeWidth={3} />
                        Ajouter
                      </Button>
                    </div>
                  )}

                  {selectedParty.members.length === 0 ? (
                    <p className="text-sm font-bold text-[var(--foreground)]/60">
                      Aucun membre dans cette soirée.
                    </p>
                  ) : (
                    selectedParty.members.map((member) => (
                      <div
                        key={member.id}
                        className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-lg border-2 border-[var(--border-color)] p-2"
                      >
                        <Avatar
                          name={member.profile?.full_name || member.profile?.email || "Membre"}
                          src={member.profile?.avatar_url || null}
                          size="sm"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate">
                            {member.profile?.full_name || member.profile?.email}
                          </p>
                          <Badge
                            variant={member.role === "manager" ? "warning" : "default"}
                            className="mt-1"
                          >
                            {member.role === "manager" ? "Manager" : "Membre"}
                          </Badge>
                        </div>
                        {canManageSelectedParty && member.role !== "manager" && (
                          <Button
                            type="button"
                            size="icon"
                            variant="destructive"
                            className="h-8 w-8"
                            onClick={() => handleRemoveMember(member.id)}
                          >
                            <Trash2 className="h-4 w-4" strokeWidth={3} />
                          </Button>
                        )}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card accentColor="#95E1D3">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <ListChecks className="h-4 w-4" strokeWidth={3} />
                    Tâches de la soirée
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {canManageSelectedParty && (
                    <form className="space-y-2" onSubmit={handleCreateTask}>
                      <Input
                        placeholder="Titre de la tâche"
                        value={newTaskTitle}
                        onChange={(event) => setNewTaskTitle(event.target.value)}
                      />
                      <Textarea
                        rows={2}
                        placeholder="Description (optionnel)"
                        value={newTaskDescription}
                        onChange={(event) => setNewTaskDescription(event.target.value)}
                      />
                      <Select
                        value={newTaskAssigneeId || assignableMembers[0]?.profile_id || ""}
                        onValueChange={setNewTaskAssigneeId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Assigner à..." />
                        </SelectTrigger>
                        <SelectContent>
                          {assignableMembers.map((member) => (
                            <SelectItem
                              key={member.profile_id}
                              value={member.profile_id}
                            >
                              {member.profile?.full_name || member.profile?.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="submit"
                        disabled={
                          creatingTask ||
                          !(newTaskAssigneeId || assignableMembers[0]?.profile_id)
                        }
                      >
                        <Plus className="h-4 w-4" strokeWidth={3} />
                        {creatingTask ? "Création..." : "Créer la tâche"}
                      </Button>
                    </form>
                  )}

                  {selectedParty.tasks.length === 0 ? (
                    <p className="text-sm font-bold text-[var(--foreground)]/60">
                      Aucune tâche pour cette soirée.
                    </p>
                  ) : (
                    selectedParty.tasks.map((task) => {
                      const canToggleTask =
                        canManageSelectedParty || task.assigned_to === profile?.id;
                      return (
                        <div
                          key={task.id}
                          className="rounded-lg border-2 border-[var(--border-color)] p-3"
                        >
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={task.status === "done"}
                              disabled={!canToggleTask}
                              onCheckedChange={(value) =>
                                handleToggleTask(task.id, value === true)
                              }
                            />
                            <div className="min-w-0 flex-1">
                              <p
                                className={`text-sm font-black ${
                                  task.status === "done"
                                    ? "line-through text-[var(--foreground)]/50"
                                    : ""
                                }`}
                              >
                                {task.title}
                              </p>
                              {task.description && (
                                <p className="text-xs font-bold text-[var(--foreground)]/60 mt-1">
                                  {task.description}
                                </p>
                              )}
                              <p className="text-xs font-bold text-[var(--foreground)]/50 mt-1">
                                Assigné à{" "}
                                <span className="text-[var(--foreground)]/80">
                                  {task.assignee?.full_name || "Membre"}
                                </span>
                              </p>
                              <Badge
                                variant={task.status === "done" ? "success" : "warning"}
                                className="mt-2"
                              >
                                {task.status === "done" ? "Terminée" : "À faire"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            </div>

            <Card accentColor="#4ECDC4">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ShoppingBasket className="h-4 w-4" strokeWidth={3} />
                  Liste de courses
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {canManageSelectedParty && (
                  <form
                    className="grid grid-cols-1 sm:grid-cols-[1fr_180px_auto] gap-2"
                    onSubmit={handleCreateGroceryItem}
                  >
                    <Input
                      placeholder="Article"
                      value={newGroceryLabel}
                      onChange={(event) => setNewGroceryLabel(event.target.value)}
                    />
                    <Input
                      placeholder="Quantité (optionnel)"
                      value={newGroceryQuantity}
                      onChange={(event) => setNewGroceryQuantity(event.target.value)}
                    />
                    <Button type="submit" disabled={creatingGroceryItem}>
                      <Plus className="h-4 w-4" strokeWidth={3} />
                      Ajouter
                    </Button>
                  </form>
                )}

                {selectedParty.grocery_items.length === 0 ? (
                  <p className="text-sm font-bold text-[var(--foreground)]/60">
                    Aucun article de courses.
                  </p>
                ) : (
                  selectedParty.grocery_items
                    .slice()
                    .sort((a, b) => Number(a.checked) - Number(b.checked))
                    .map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 rounded-lg border-2 border-[var(--border-color)] p-2"
                      >
                        <Checkbox
                          checked={item.checked}
                          disabled={!canManageSelectedParty}
                          onCheckedChange={(value) =>
                            handleToggleGroceryItem(item.id, value === true)
                          }
                        />
                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-sm font-bold ${
                              item.checked
                                ? "line-through text-[var(--foreground)]/50"
                                : ""
                            }`}
                          >
                            {item.label}
                          </p>
                          {item.quantity && (
                            <p className="text-xs font-bold text-[var(--foreground)]/60">
                              Quantité: {item.quantity}
                            </p>
                          )}
                        </div>
                        <CheckCircle2
                          className={`h-4 w-4 ${
                            item.checked
                              ? "text-brutal-teal"
                              : "text-[var(--foreground)]/30"
                          }`}
                          strokeWidth={3}
                        />
                      </div>
                    ))
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
