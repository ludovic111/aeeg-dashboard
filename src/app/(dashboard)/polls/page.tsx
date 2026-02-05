"use client";

import { useMemo, useState } from "react";
import { Plus, Vote } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { usePolls } from "@/hooks/use-polls";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/utils";

export default function PollsPage() {
  const { isCommitteeMember } = useAuth();
  const { polls, loading, createPoll, votePoll } = usePolls();

  const [question, setQuestion] = useState("");
  const [description, setDescription] = useState("");
  const [closesAt, setClosesAt] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [creating, setCreating] = useState(false);
  const [votingPollId, setVotingPollId] = useState<string | null>(null);

  const normalizedOptions = useMemo(
    () => options.map((option) => option.trim()).filter(Boolean),
    [options]
  );

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

  const handleCreatePoll = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!question.trim()) {
      toast.error("La question est requise");
      return;
    }

    if (normalizedOptions.length < 2) {
      toast.error("Ajoutez au moins 2 options");
      return;
    }

    setCreating(true);

    const { error } = await createPoll({
      question: question.trim(),
      description: description.trim() || undefined,
      closes_at: closesAt ? new Date(closesAt).toISOString() : undefined,
      options: normalizedOptions,
    });

    if (error) {
      toast.error(error.message || "Impossible de créer le sondage");
    } else {
      toast.success("Sondage créé");
      setQuestion("");
      setDescription("");
      setClosesAt("");
      setOptions(["", ""]);
    }

    setCreating(false);
  };

  const handleVote = async (pollId: string, optionId: string) => {
    setVotingPollId(pollId);
    const { error } = await votePoll(pollId, optionId);

    if (error) {
      toast.error(error.message || "Impossible d'enregistrer votre vote");
    }

    setVotingPollId(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black">🗳️ Sondages</h1>
        <p className="text-sm font-bold text-[var(--foreground)]/60 mt-1">
          Créez des votes et suivez les résultats en temps réel
        </p>
      </div>

      <Card accentColor="#4ECDC4">
        <CardHeader>
          <CardTitle className="text-base">Créer un sondage</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleCreatePoll}>
            <div className="space-y-2">
              <Label htmlFor="poll-question">Question *</Label>
              <Input
                id="poll-question"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="Quel design choisissez-vous ?"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="poll-description">Description</Label>
              <Textarea
                id="poll-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={2}
                placeholder="Contexte du vote..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="poll-closes-at">Clôture (optionnel)</Label>
              <Input
                id="poll-closes-at"
                type="datetime-local"
                value={closesAt}
                onChange={(event) => setClosesAt(event.target.value)}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Options *</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setOptions((prev) => [...prev, ""])}
                >
                  <Plus className="h-4 w-4" strokeWidth={3} />
                  Ajouter
                </Button>
              </div>

              {options.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={option}
                    onChange={(event) =>
                      setOptions((prev) =>
                        prev.map((value, valueIndex) =>
                          valueIndex === index ? event.target.value : value
                        )
                      )
                    }
                    placeholder={`Option ${index + 1}`}
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() =>
                      setOptions((prev) =>
                        prev.length > 2
                          ? prev.filter((_, valueIndex) => valueIndex !== index)
                          : prev
                      )
                    }
                    disabled={options.length <= 2}
                  >
                    Supprimer
                  </Button>
                </div>
              ))}
            </div>

            <Button type="submit" disabled={creating}>
              <Vote className="h-4 w-4" strokeWidth={3} />
              {creating ? "Création..." : "Créer le sondage"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, index) => (
            <Skeleton key={index} className="h-40" />
          ))}
        </div>
      ) : polls.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-4xl mb-3">🧪</p>
            <p className="font-black">Aucun sondage</p>
            <p className="text-sm font-bold text-[var(--foreground)]/60 mt-1">
              Créez le premier sondage ci-dessus.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {polls.map((poll) => {
            const isClosed = poll.closes_at
              ? new Date(poll.closes_at) < new Date()
              : false;

            return (
              <Card key={poll.id} accentColor="#FFE66D">
                <CardHeader>
                  <CardTitle className="text-base">{poll.question}</CardTitle>
                  <p className="text-xs font-bold text-[var(--foreground)]/60">
                    {poll.creator?.full_name || "Membre du comité"} · {poll.total_votes} vote
                    {poll.total_votes > 1 ? "s" : ""}
                    {poll.closes_at
                      ? ` · Clôture: ${formatDateTime(poll.closes_at)}`
                      : ""}
                    {isClosed ? " · Clôturé" : ""}
                  </p>
                  {poll.description && (
                    <p className="text-sm font-bold text-[var(--foreground)]/70">
                      {poll.description}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="space-y-2">
                  {poll.options.map((option) => {
                    const voted = poll.user_vote_option_id === option.id;

                    return (
                      <Button
                        key={option.id}
                        type="button"
                        variant={voted ? "default" : "outline"}
                        className="w-full justify-between"
                        disabled={isClosed || votingPollId === poll.id}
                        onClick={() => handleVote(poll.id, option.id)}
                      >
                        <span>{option.label}</span>
                        <span className="text-xs font-black">
                          {option.vote_count} ({option.vote_percentage}%)
                        </span>
                      </Button>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
