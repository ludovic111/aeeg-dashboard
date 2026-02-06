"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { VendrediMidiScore } from "@/types";

interface SubmitScoreResult {
  improved: boolean;
  error: Error | null;
}

type LeaderboardRow = {
  id: string;
  player_id: string;
  best_score: number;
  best_duration_ms: number;
  created_at: string;
  updated_at: string;
  player:
    | { id: string; full_name: string; avatar_url: string | null }
    | Array<{ id: string; full_name: string; avatar_url: string | null }>
    | null;
};

function normalizeLeaderboardRows(rows: LeaderboardRow[] | null): VendrediMidiScore[] {
  return (rows || []).map((row) => ({
    ...row,
    player: Array.isArray(row.player) ? (row.player[0] ?? null) : row.player,
  }));
}

export function useVendrediMidiLeaderboard() {
  const [entries, setEntries] = useState<VendrediMidiScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [personalBest, setPersonalBest] = useState(0);
  const [personalBestDurationMs, setPersonalBestDurationMs] = useState(0);
  const supabase = createClient();

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const leaderboardRes = await supabase
      .from("vendredi_midi_scores")
      .select(
        "id, player_id, best_score, best_duration_ms, created_at, updated_at, player:profiles!vendredi_midi_scores_player_id_fkey(id, full_name, avatar_url)"
      )
      .order("best_score", { ascending: false })
      .order("updated_at", { ascending: true })
      .limit(10);

    if (leaderboardRes.error) {
      setEntries([]);
      setLoading(false);
      return;
    }

    setEntries(normalizeLeaderboardRows((leaderboardRes.data as LeaderboardRow[]) || null));

    if (!user) {
      setPersonalBest(0);
      setPersonalBestDurationMs(0);
      setLoading(false);
      return;
    }

    const ownScoreRes = await supabase
      .from("vendredi_midi_scores")
      .select("id, best_score, best_duration_ms")
      .eq("player_id", user.id)
      .maybeSingle();

    if (ownScoreRes.error) {
      setPersonalBest(0);
      setPersonalBestDurationMs(0);
    } else {
      setPersonalBest(ownScoreRes.data?.best_score || 0);
      setPersonalBestDurationMs(ownScoreRes.data?.best_duration_ms || 0);
    }

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    let active = true;

    async function loadInitial() {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const leaderboardRes = await supabase
        .from("vendredi_midi_scores")
        .select(
          "id, player_id, best_score, best_duration_ms, created_at, updated_at, player:profiles!vendredi_midi_scores_player_id_fkey(id, full_name, avatar_url)"
        )
        .order("best_score", { ascending: false })
        .order("updated_at", { ascending: true })
        .limit(10);

      if (!active) return;

      if (leaderboardRes.error) {
        setEntries([]);
        setLoading(false);
        return;
      }

      setEntries(
        normalizeLeaderboardRows((leaderboardRes.data as LeaderboardRow[]) || null)
      );

      if (!user) {
        setPersonalBest(0);
        setPersonalBestDurationMs(0);
        setLoading(false);
        return;
      }

      const ownScoreRes = await supabase
        .from("vendredi_midi_scores")
        .select("id, best_score, best_duration_ms")
        .eq("player_id", user.id)
        .maybeSingle();

      if (!active) return;

      if (ownScoreRes.error) {
        setPersonalBest(0);
        setPersonalBestDurationMs(0);
      } else {
        setPersonalBest(ownScoreRes.data?.best_score || 0);
        setPersonalBestDurationMs(ownScoreRes.data?.best_duration_ms || 0);
      }

      setLoading(false);
    }

    loadInitial();

    return () => {
      active = false;
    };
  }, [supabase]);

  const submitScore = useCallback(
    async (score: number, durationMs: number): Promise<SubmitScoreResult> => {
      if (!Number.isFinite(score) || score < 0) {
        return { improved: false, error: new Error("Score invalide") };
      }

      const roundedScore = Math.floor(score);
      const roundedDuration = Math.max(0, Math.floor(durationMs));

      setSubmitting(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setSubmitting(false);
        return { improved: false, error: new Error("Utilisateur non connecté") };
      }

      const existingRes = await supabase
        .from("vendredi_midi_scores")
        .select("id, best_score, best_duration_ms")
        .eq("player_id", user.id)
        .maybeSingle();

      if (existingRes.error) {
        setSubmitting(false);
        return { improved: false, error: new Error(existingRes.error.message) };
      }

      const existingScore = existingRes.data?.best_score ?? 0;
      const existingDuration = existingRes.data?.best_duration_ms ?? 0;
      const isImproved =
        roundedScore > existingScore ||
        (roundedScore === existingScore && roundedDuration > existingDuration);

      if (!isImproved) {
        setSubmitting(false);
        return { improved: false, error: null };
      }

      if (existingRes.data) {
        const { error } = await supabase
          .from("vendredi_midi_scores")
          .update({
            best_score: roundedScore,
            best_duration_ms: roundedDuration,
          })
          .eq("id", existingRes.data.id);

        if (error) {
          setSubmitting(false);
          return { improved: false, error: new Error(error.message) };
        }
      } else {
        const { error } = await supabase.from("vendredi_midi_scores").insert({
          player_id: user.id,
          best_score: roundedScore,
          best_duration_ms: roundedDuration,
        });

        if (error) {
          setSubmitting(false);
          return { improved: false, error: new Error(error.message) };
        }
      }

      setPersonalBest(roundedScore);
      setPersonalBestDurationMs(roundedDuration);
      await fetchLeaderboard();
      setSubmitting(false);
      return { improved: true, error: null };
    },
    [fetchLeaderboard, supabase]
  );

  return {
    entries,
    loading,
    submitting,
    personalBest,
    personalBestDurationMs,
    refetch: fetchLeaderboard,
    submitScore,
  };
}
