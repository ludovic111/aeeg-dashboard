"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Upload } from "lucide-react";
import Link from "next/link";
import { useMeetingMutations } from "@/hooks/use-meetings";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewMeetingPage() {
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [agendaFile, setAgendaFile] = useState<File | null>(null);
  const router = useRouter();
  const supabase = createClient();
  const { createMeeting } = useMeetingMutations();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!agendaFile) {
      toast.error("Merci de sélectionner un fichier DOCX d'ordre du jour");
      return;
    }

    const isDocxMime =
      agendaFile.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    const isDocxName = /\.docx$/i.test(agendaFile.name);

    if (!isDocxMime && !isDocxName) {
      toast.error("Le fichier doit être au format DOCX (.docx)");
      return;
    }

    setLoading(true);
    const meetingDate = new Date(`${date}T12:00:00`);
    const safeFileName = agendaFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = `${date}/${Date.now()}-${safeFileName}`;

    const { error: uploadError } = await supabase.storage
      .from("meeting-agendas")
      .upload(filePath, agendaFile, {
        contentType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        upsert: false,
      });

    if (uploadError) {
      toast.error(uploadError.message || "Impossible d'envoyer le fichier DOCX");
      setLoading(false);
      return;
    }

    const title = `Réunion du ${meetingDate.toLocaleDateString("fr-CH")}`;
    const { meeting, error } = await createMeeting({
      title,
      date: meetingDate.toISOString(),
      location: null,
      agenda: null,
      agenda_pdf_path: filePath,
      agenda_ai_summary: null,
      minutes: null,
    });

    if (error) {
      await supabase.storage.from("meeting-agendas").remove([filePath]);
      toast.error(error.message || "Erreur lors de la création de la réunion");
      setLoading(false);
      return;
    }

    toast.success("Réunion créée et ODJ importé. Générez le résumé depuis la page réunion.");
    router.push(`/meetings/${meeting?.id || ""}`);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Link href="/meetings">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" strokeWidth={3} />
          </Button>
        </Link>
        <div>
          <h1 className="display-hero max-w-[9ch]">Nouvelle reunion</h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Choisir une date et ajouter le DOCX de l&apos;ordre du jour
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ordre du jour (DOCX)</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="meeting-date">Date de réunion *</Label>
              <Input
                id="meeting-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="agenda-file">DOCX de l&apos;ordre du jour *</Label>
              <Input
                id="agenda-file"
                type="file"
                accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(e) => setAgendaFile(e.target.files?.[0] || null)}
                required
              />
              {agendaFile && (
                <p className="text-xs font-bold text-[var(--foreground)]/60">
                  Fichier: {agendaFile.name}
                </p>
              )}
            </div>

            <Button type="submit" disabled={loading}>
              <Upload className="h-4 w-4" strokeWidth={3} />
              {loading ? "Import en cours..." : "Créer la réunion"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
