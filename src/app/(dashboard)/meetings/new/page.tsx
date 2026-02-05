"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { MeetingForm } from "@/components/meetings/meeting-form";
import { useMeetingMutations } from "@/hooks/use-meetings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MeetingFormData } from "@/lib/validations";

export default function NewMeetingPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { createMeeting } = useMeetingMutations();

  const handleSubmit = async (data: MeetingFormData) => {
    setLoading(true);
    const { meeting, error } = await createMeeting({
      title: data.title,
      date: new Date(data.date).toISOString(),
      location: data.location || null,
      agenda: data.agenda || null,
      minutes: data.minutes || null,
    });

    if (error) {
      toast.error("Erreur lors de la création de la réunion");
      setLoading(false);
      return;
    }

    toast.success("Réunion créée avec succès !");
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
          <h1 className="text-3xl font-black">📝 Nouvelle réunion</h1>
          <p className="text-sm font-bold text-[var(--foreground)]/60 mt-1">
            Créer une nouvelle réunion du comité
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <MeetingForm onSubmit={handleSubmit} loading={loading} />
        </CardContent>
      </Card>
    </div>
  );
}
