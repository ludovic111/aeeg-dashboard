"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Clock,
  ExternalLink,
  Trash2,
  Sparkles,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useMeeting, useMeetingMutations } from "@/hooks/use-meetings";
import { useAuth } from "@/hooks/use-auth";
import { ActionItemsList } from "@/components/meetings/action-items-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { formatDateTime } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const MarkdownPreview = dynamic(() => import("@uiw/react-markdown-preview"), {
  ssr: false,
  loading: () => <div className="brutal-skeleton h-48" />,
});

export default function MeetingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { meeting, actionItems, loading, refetch } = useMeeting(id);
  const { isAdmin, isCommitteeMember, profile } = useAuth();
  const { deleteMeeting } = useMeetingMutations();
  const supabase = createClient();
  const [summaryLoading, setSummaryLoading] = useState(false);

  const canEdit =
    isAdmin ||
    (isCommitteeMember && meeting?.created_by === profile?.id);

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

  const handleGenerateSummary = async () => {
    if (!meeting?.id) return;

    setSummaryLoading(true);
    try {
      const response = await fetch("/api/meetings/grok-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          meetingId: meeting.id,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        toast.error(
          payload.error
            ? `Impossible de générer le résumé: ${payload.error}`
            : "Impossible de générer le résumé"
        );
        return;
      }

      toast.success("Résumé généré depuis l'ODJ.");
      await refetch();
    } catch {
      toast.error("Impossible de générer le résumé");
    } finally {
      setSummaryLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-[1400px]">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Skeleton className="h-64 xl:col-span-2" />
          <Skeleton className="h-64" />
        </div>
        <Skeleton className="h-32" />
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="text-center py-16">
        <p className="font-[var(--font-display)] text-[2rem] leading-none">Reunion introuvable</p>
        <Link href="/meetings">
          <Button className="mt-4">Retour aux réunions</Button>
        </Link>
      </div>
    );
  }

  const agendaFileUrl = meeting.agenda_pdf_path
    ? supabase.storage
        .from("meeting-agendas")
        .getPublicUrl(meeting.agenda_pdf_path).data.publicUrl
    : null;
  const isDocxAgenda = meeting.agenda_pdf_path
    ? meeting.agenda_pdf_path.toLowerCase().endsWith(".docx")
    : false;

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div className="flex items-start sm:items-center gap-3 sm:gap-4">
        <Link href="/meetings">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" strokeWidth={3} />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl font-black">{meeting.title}</h1>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1">
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
          isAdmin && (
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" strokeWidth={3} />
            </Button>
          )
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* Agenda File */}
        {agendaFileUrl ? (
          <Card accentColor="#FFE66D" className="xl:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Ordre du jour</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isDocxAgenda ? (
                <>
                  <p className="text-sm font-bold text-[var(--foreground)]/70">
                    Fichier DOCX importé. Utilisez le bouton ci-dessous pour l&apos;ouvrir ou le télécharger.
                  </p>
                  <a
                    href={agendaFileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-black underline"
                  >
                    Ouvrir le DOCX dans un nouvel onglet
                    <ExternalLink className="h-4 w-4" strokeWidth={3} />
                  </a>
                </>
              ) : (
                <>
                  <div className="h-[55vh] sm:h-[70vh] w-full border-2 border-[var(--border-color)] rounded-lg overflow-hidden bg-white">
                    <iframe
                      title="Ordre du jour"
                      src={agendaFileUrl}
                      loading="lazy"
                      className="h-full w-full"
                    />
                  </div>
                  <a
                    href={agendaFileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-black underline"
                  >
                    Ouvrir le fichier dans un nouvel onglet
                    <ExternalLink className="h-4 w-4" strokeWidth={3} />
                  </a>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card accentColor="#FFE66D" className="xl:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Ordre du jour</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-bold text-[var(--foreground)]/60">
                Aucun fichier importé pour cette réunion.
              </p>
            </CardContent>
          </Card>
        )}

        <Card accentColor="#4ECDC4">
          <CardHeader>
            <CardTitle className="text-base">Resume ODJ (Grok)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleGenerateSummary}
              disabled={!agendaFileUrl || !isDocxAgenda || summaryLoading}
              className="w-full sm:w-auto"
            >
              <Sparkles className="h-4 w-4" strokeWidth={3} />
              {summaryLoading
                ? "Génération en cours..."
                : "Générer le résumé à partir du DOCX"}
            </Button>
            {meeting.agenda_ai_summary ? (
              <div data-color-mode="light" className="text-sm">
                <MarkdownPreview source={meeting.agenda_ai_summary} />
              </div>
            ) : (
              <p className="text-sm font-bold text-[var(--foreground)]/60">
                {isDocxAgenda
                  ? "Cliquez sur le bouton pour générer le résumé à partir du DOCX."
                  : "Importez un ODJ en format DOCX pour générer un résumé."}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Action Items */}
      <ActionItemsList
        meetingId={id}
        items={actionItems}
        canEdit={canEdit}
        onRefresh={refetch}
      />
    </div>
  );
}
