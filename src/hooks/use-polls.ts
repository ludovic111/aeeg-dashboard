"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Poll, PollOption, PollVote } from "@/types";

export interface PollOptionWithStats extends PollOption {
  vote_count: number;
  vote_percentage: number;
  votes: PollVote[];
}

export interface PollWithStats extends Poll {
  options: PollOptionWithStats[];
  total_votes: number;
  total_voters: number;
  user_vote_option_ids: string[];
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
      supabase
        .from("poll_votes")
        .select(
          "*, voter:profiles!poll_votes_voter_id_fkey(id, full_name, email, avatar_url)"
        )
        .in("poll_id", pollIds)
        .order("created_at", { ascending: false }),
    ]);

    const options = (optionsRes.data as PollOption[]) || [];
    const votes = ((votesRes.data as PollVote[]) || []).map((vote) => ({
      ...vote,
      voter: Array.isArray(vote.voter) ? vote.voter[0] : vote.voter,
    }));

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
      const totalVoters = new Set(pollVotes.map((vote) => vote.voter_id)).size;

      const optionsWithStats: PollOptionWithStats[] = pollOptions.map((option) => {
        const optionVotes = pollVotes.filter((vote) => vote.option_id === option.id);
        const voteCount = optionVotes.length;
        const votePercentage =
          totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;

        return {
          ...option,
          vote_count: voteCount,
          vote_percentage: votePercentage,
          votes: optionVotes,
        };
      });

      const userVoteOptionIds = pollVotes
        .filter((vote) => vote.voter_id === user?.id)
        .map((vote) => vote.option_id);

      return {
        ...poll,
        options: optionsWithStats,
        total_votes: totalVotes,
        total_voters: totalVoters,
        user_vote_option_ids: userVoteOptionIds,
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

  const togglePollVote = async (pollId: string, optionId: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: { message: "Utilisateur non authentifié" } };
    }

    const { data: existingVote, error: existingVoteError } = await supabase
      .from("poll_votes")
      .select("id")
      .eq("poll_id", pollId)
      .eq("option_id", optionId)
      .eq("voter_id", user.id)
      .maybeSingle();

    if (existingVoteError) {
      return { error: existingVoteError };
    }

    const { error } = existingVote
      ? await supabase.from("poll_votes").delete().eq("id", existingVote.id)
      : await supabase.from("poll_votes").insert({
          poll_id: pollId,
          option_id: optionId,
          voter_id: user.id,
        });

    if (!error) {
      await fetchPolls();
    }

    return { error };
  };

  return {
    polls,
    loading,
    createPoll,
    togglePollVote,
    refetch: fetchPolls,
  };
}
