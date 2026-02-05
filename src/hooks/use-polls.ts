"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Poll, PollOption, PollVote } from "@/types";

export interface PollOptionWithStats extends PollOption {
  vote_count: number;
  vote_percentage: number;
}

export interface PollWithStats extends Poll {
  options: PollOptionWithStats[];
  total_votes: number;
  user_vote_option_id: string | null;
}

interface CreatePollInput {
  question: string;
  description?: string;
  closes_at?: string;
  options: string[];
}

export function usePolls() {
  const [polls, setPolls] = useState<PollWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchPolls = useCallback(async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: pollsData } = await supabase
      .from("polls")
      .select(
        "*, creator:profiles!polls_created_by_fkey(id, full_name, avatar_url)"
      )
      .order("created_at", { ascending: false });

    const pollIds = ((pollsData as Poll[]) || []).map((poll) => poll.id);

    if (pollIds.length === 0) {
      setPolls([]);
      setLoading(false);
      return;
    }

    const [optionsRes, votesRes] = await Promise.all([
      supabase
        .from("poll_options")
        .select("*")
        .in("poll_id", pollIds)
        .order("position", { ascending: true }),
      supabase.from("poll_votes").select("*").in("poll_id", pollIds),
    ]);

    const options = (optionsRes.data as PollOption[]) || [];
    const votes = (votesRes.data as PollVote[]) || [];

    const byPollOptions = new Map<string, PollOption[]>();
    for (const option of options) {
      const list = byPollOptions.get(option.poll_id) || [];
      list.push(option);
      byPollOptions.set(option.poll_id, list);
    }

    const byPollVotes = new Map<string, PollVote[]>();
    for (const vote of votes) {
      const list = byPollVotes.get(vote.poll_id) || [];
      list.push(vote);
      byPollVotes.set(vote.poll_id, list);
    }

    const mapped = ((pollsData as Poll[]) || []).map((poll) => {
      const pollOptions = byPollOptions.get(poll.id) || [];
      const pollVotes = byPollVotes.get(poll.id) || [];
      const totalVotes = pollVotes.length;

      const optionsWithStats: PollOptionWithStats[] = pollOptions.map((option) => {
        const voteCount = pollVotes.filter(
          (vote) => vote.option_id === option.id
        ).length;
        const votePercentage =
          totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;

        return {
          ...option,
          vote_count: voteCount,
          vote_percentage: votePercentage,
        };
      });

      const userVote = pollVotes.find((vote) => vote.voter_id === user?.id);

      return {
        ...poll,
        options: optionsWithStats,
        total_votes: totalVotes,
        user_vote_option_id: userVote?.option_id || null,
      } as PollWithStats;
    });

    setPolls(mapped);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    let active = true;

    async function loadInitialPolls() {
      await fetchPolls();
      if (!active) return;
    }

    loadInitialPolls();
    return () => {
      active = false;
    };
  }, [fetchPolls]);

  const createPoll = async (input: CreatePollInput) => {
    const optionsPayload = input.options
      .map((label) => label.trim())
      .filter(Boolean)
      .map((label, index) => ({
        label,
        position: index,
      }));

    if (optionsPayload.length < 2) {
      return { error: { message: "Ajoutez au moins 2 options valides" } };
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: { message: "Utilisateur non authentifié" } };
    }

    const { data: poll, error: pollError } = await supabase
      .from("polls")
      .insert({
        question: input.question,
        description: input.description || null,
        closes_at: input.closes_at || null,
        created_by: user.id,
      })
      .select("id")
      .single();

    if (pollError || !poll) {
      return { error: pollError };
    }

    const { error: optionsError } = await supabase
      .from("poll_options")
      .insert(
        optionsPayload.map((option) => ({
          ...option,
          poll_id: poll.id,
        }))
      );

    if (optionsError) {
      return { error: optionsError };
    }

    await fetchPolls();
    return { error: null };
  };

  const votePoll = async (pollId: string, optionId: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: { message: "Utilisateur non authentifié" } };
    }

    const { error } = await supabase
      .from("poll_votes")
      .upsert(
        {
          poll_id: pollId,
          option_id: optionId,
          voter_id: user.id,
        },
        { onConflict: "poll_id,voter_id" }
      );

    if (!error) {
      await fetchPolls();
    }

    return { error };
  };

  return {
    polls,
    loading,
    createPoll,
    votePoll,
    refetch: fetchPolls,
  };
}
