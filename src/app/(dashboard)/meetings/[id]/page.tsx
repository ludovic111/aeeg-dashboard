"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowLeft, MapPin, Clock, Edit2, Trash2 } from "lucide-react";
import { useMeeting, useMeetingMutations } from "@/hooks/use-meetings";
import { useAuth } from "@/hooks/use-auth";
import { ActionItemsList } from "@/components/meetings/action-items-list";
import { MeetingForm } from "@/components/meetings/meeting-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { formatDateTime } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types";
import type { MeetingFormData } from "@/lib/validations";

const MDPreview = dynamic(
  () => import("@uiw/react-md-editor").then((mod) => mod.default.Markdown),
  { ssr: false, loading: () => <div className="brutal-skeleton h-32" /> }
);

export default function MeetingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { meeting, actionItems, loading, refetch } = useMeeting(id);
  const { isAdmin, isCommitteeMember, profile } = useAuth();
  const { updateMeeting, deleteMeeting } = useMeetingMutations();
  const [editing, setEditing] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [members, setMembers] = useState<Profile[]>([]);
  const supabase = createClient();

  useEffect(() => {
    supabase
      .from("profiles")
      .select("*")
      .then(({ data }) => setMembers(data || []));
  }, [supabase]);

  const canEdit =
    isAdmin ||
    (isCommitteeMember && meeting?.created_by === profile?.id);

  const handleUpdate = async (data: MeetingFormData) => {
    setEditLoading(true);
    const { error } = await updateMeeting(id, {
      title: data.title,
      date: new Date(data.date).toISOString(),
      location: data.location || null,
      agenda: data.agenda || null,
      minutes: data.minutes || null,
    });
    if (error) {
      toast.error("Erreur lors de la mise à jour");
    } else {
      toast.success("Réunion mise à jour !");
      setEditing(false);
      refetch();
    }
    setEditLoading(false);
  };

  const handleDelete = async () => {
    if (!confirm("Supprimer cette réunion ?")) return;
    const { error } = await deleteMeeting(id);
    if (error) {
      toast.error("Erreur lors de la suppression");
    } else {
      toast.success("Réunion supprimée");
      router.push("/meetings");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="text-center py-16">
        <p className="text-5xl mb-4">🔍</p>
        <p className="font-black text-lg">Réunion introuvable</p>
        <Link href="/meetings">
          <Button className="mt-4">Retour aux réunions</Button>
        </Link>
      </div>
    );
  }

  const isPast = new Date(meeting.date) < new Date();

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Link href="/meetings">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" strokeWidth={3} />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-black">{meeting.title}</h1>
          <div className="flex items-center gap-3 mt-1">
            <Badge variant={isPast ? "default" : "info"}>
              {isPast ? "Passée" : "À venir"}
            </Badge>
            <span className="text-sm font-mono text-[var(--foreground)]/60">
              <Clock className="h-3.5 w-3.5 inline mr-1" />
              {formatDateTime(meeting.date)}
            </span>
            {meeting.location && (
              <span className="text-sm font-bold text-[var(--foreground)]/60">
                <MapPin className="h-3.5 w-3.5 inline mr-1" />
                {meeting.location}
              </span>
            )}
          </div>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              <Edit2 className="h-4 w-4" strokeWidth={3} />
              Modifier
            </Button>
            {isAdmin && (
              <Button variant="destructive" size="sm" onClick={handleDelete}>
                <Trash2 className="h-4 w-4" strokeWidth={3} />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Agenda */}
      {meeting.agenda && (
        <Card accentColor="#FFE66D">
          <CardHeader>
            <CardTitle className="text-base">📑 Ordre du jour</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{meeting.agenda}</p>
          </CardContent>
        </Card>
      )}

      {/* Minutes */}
      {meeting.minutes && (
        <Card accentColor="#4ECDC4">
          <CardHeader>
            <CardTitle className="text-base">📝 Procès-verbal</CardTitle>
          </CardHeader>
          <CardContent>
            <div data-color-mode="light" className="prose prose-sm max-w-none">
              <MDPreview source={meeting.minutes} />
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Action Items */}
      <ActionItemsList
        meetingId={id}
        items={actionItems}
        members={members}
        canEdit={canEdit}
        onRefresh={refetch}
      />

      {/* Edit Dialog */}
      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier la réunion</DialogTitle>
          </DialogHeader>
          <MeetingForm
            meeting={meeting}
            onSubmit={handleUpdate}
            loading={editLoading}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
