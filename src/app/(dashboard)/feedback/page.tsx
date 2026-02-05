"use client";

import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { CheckCircle2, Lightbulb, MessageSquareWarning } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useFeedback, useFeedbackMutations } from "@/hooks/use-feedback";
import {
  feedbackSchema,
  type FeedbackFormData,
} from "@/lib/validations";
import { formatRelative } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function FeedbackPage() {
  const { isAdmin } = useAuth();
  const { items, loading, refetch } = useFeedback();
  const { createFeedback, updateFeedbackStatus } = useFeedbackMutations();
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "resolved">(
    "all"
  );

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    control,
    formState: { errors },
  } = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      kind: "issue",
      title: "",
      description: "",
    },
  });

  const kindValue = useWatch({ control, name: "kind" }) || "issue";

  const filteredItems = useMemo(() => {
    if (statusFilter === "all") return items;
    return items.filter((item) => item.status === statusFilter);
  }, [items, statusFilter]);

  const onSubmit = async (data: FeedbackFormData) => {
    setSaving(true);
    const { error } = await createFeedback(data);
    if (error) {
      toast.error(error.message || "Impossible d'envoyer le retour");
      setSaving(false);
      return;
    }

    toast.success("Retour envoyé. Merci !");
    reset({ kind: "issue", title: "", description: "" });
    await refetch();
    setSaving(false);
  };

  const handleToggleStatus = async (id: string, currentStatus: "open" | "resolved") => {
    const nextStatus = currentStatus === "resolved" ? "open" : "resolved";
    const { error } = await updateFeedbackStatus(id, nextStatus);
    if (error) {
      toast.error(error.message || "Impossible de mettre à jour le statut");
      return;
    }
    toast.success("Statut mis à jour");
    refetch();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black">💡 Retours utilisateurs</h1>
        <p className="text-sm font-bold text-[var(--foreground)]/60 mt-1">
          Signaler un problème ou proposer une amélioration
        </p>
      </div>

      <Card accentColor="#FFE66D">
        <CardHeader>
          <CardTitle>Nouveau retour</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={kindValue}
                onValueChange={(value) =>
                  setValue("kind", value as "issue" | "recommendation")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="issue">Problème</SelectItem>
                  <SelectItem value="recommendation">Recommandation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="feedback-title">Titre</Label>
              <Input
                id="feedback-title"
                placeholder="Titre court du retour"
                {...register("title")}
              />
              {errors.title && (
                <p className="text-sm font-bold text-brutal-red">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="feedback-description">Description</Label>
              <Textarea
                id="feedback-description"
                rows={4}
                placeholder="Détaillez le problème ou la recommandation..."
                {...register("description")}
              />
              {errors.description && (
                <p className="text-sm font-bold text-brutal-red">
                  {errors.description.message}
                </p>
              )}
            </div>

            <Button type="submit" disabled={saving}>
              {saving ? "Envoi..." : "Envoyer le retour"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="flex items-center gap-2">
        <Button
          variant={statusFilter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setStatusFilter("all")}
        >
          Tous
        </Button>
        <Button
          variant={statusFilter === "open" ? "default" : "outline"}
          size="sm"
          onClick={() => setStatusFilter("open")}
        >
          Ouverts
        </Button>
        <Button
          variant={statusFilter === "resolved" ? "default" : "outline"}
          size="sm"
          onClick={() => setStatusFilter("resolved")}
        >
          Résolus
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, index) => (
            <Skeleton key={index} className="h-28" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm font-bold text-[var(--foreground)]/50">
            Aucun retour pour ce filtre.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <Card key={item.id}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant={item.kind === "issue" ? "danger" : "info"}>
                        {item.kind === "issue" ? (
                          <span className="inline-flex items-center gap-1">
                            <MessageSquareWarning className="h-3.5 w-3.5" />
                            Problème
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1">
                            <Lightbulb className="h-3.5 w-3.5" />
                            Recommandation
                          </span>
                        )}
                      </Badge>
                      <Badge
                        variant={item.status === "resolved" ? "success" : "warning"}
                      >
                        {item.status === "resolved" ? "Résolu" : "Ouvert"}
                      </Badge>
                    </div>
                    <h3 className="font-black mt-2">{item.title}</h3>
                    <p className="text-sm mt-1 whitespace-pre-wrap">
                      {item.description}
                    </p>
                    <p className="text-xs font-mono text-[var(--foreground)]/50 mt-2">
                      {item.creator?.full_name || item.creator?.email || "Utilisateur"} ·{" "}
                      {formatRelative(item.created_at)}
                    </p>
                  </div>

                  {isAdmin && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleStatus(item.id, item.status)}
                    >
                      <CheckCircle2 className="h-4 w-4" strokeWidth={3} />
                      {item.status === "resolved" ? "Rouvrir" : "Résoudre"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
