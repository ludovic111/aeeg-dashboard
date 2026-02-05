"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Meeting, MeetingActionItem } from "@/types";

export function useMeetings() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchMeetings = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("meetings")
      .select(
        "*, creator:profiles!meetings_created_by_fkey(id, full_name, avatar_url)"
      )
      .order("date", { ascending: false });
    setMeetings((data as unknown as Meeting[]) || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    let active = true;

    async function loadInitialMeetings() {
      setLoading(true);
      const { data } = await supabase
        .from("meetings")
        .select(
          "*, creator:profiles!meetings_created_by_fkey(id, full_name, avatar_url)"
        )
        .order("date", { ascending: false });

      if (!active) return;
      setMeetings((data as unknown as Meeting[]) || []);
      setLoading(false);
    }

    loadInitialMeetings();
    return () => {
      active = false;
    };
  }, [supabase]);

  return { meetings, loading, refetch: fetchMeetings };
}

export function useMeeting(id: string) {
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [actionItems, setActionItems] = useState<MeetingActionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchMeeting = useCallback(async () => {
    setLoading(true);
    const [meetingRes, itemsRes] = await Promise.all([
      supabase
        .from("meetings")
        .select(
          "*, creator:profiles!meetings_created_by_fkey(id, full_name, avatar_url)"
        )
        .eq("id", id)
        .single(),
      supabase
        .from("meeting_action_items")
        .select(
          "*, assignee:profiles!meeting_action_items_assigned_to_fkey(id, full_name, avatar_url)"
        )
        .eq("meeting_id", id)
        .order("created_at", { ascending: true }),
    ]);

    setMeeting((meetingRes.data as unknown as Meeting) || null);
    setActionItems(
      (itemsRes.data as unknown as MeetingActionItem[]) || []
    );
    setLoading(false);
  }, [supabase, id]);

  useEffect(() => {
    let active = true;

    async function loadInitialMeeting() {
      setLoading(true);
      const [meetingRes, itemsRes] = await Promise.all([
        supabase
          .from("meetings")
          .select(
            "*, creator:profiles!meetings_created_by_fkey(id, full_name, avatar_url)"
          )
          .eq("id", id)
          .single(),
        supabase
          .from("meeting_action_items")
          .select(
            "*, assignee:profiles!meeting_action_items_assigned_to_fkey(id, full_name, avatar_url)"
          )
          .eq("meeting_id", id)
          .order("created_at", { ascending: true }),
      ]);

      if (!active) return;
      setMeeting((meetingRes.data as unknown as Meeting) || null);
      setActionItems(
        (itemsRes.data as unknown as MeetingActionItem[]) || []
      );
      setLoading(false);
    }

    loadInitialMeeting();
    return () => {
      active = false;
    };
  }, [supabase, id]);

  return { meeting, actionItems, loading, refetch: fetchMeeting };
}

export function useMeetingMutations() {
  const supabase = createClient();

  const createMeeting = async (data: Partial<Meeting>) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: meeting, error } = await supabase
      .from("meetings")
      .insert({ ...data, created_by: user?.id })
      .select()
      .single();
    return { meeting, error };
  };

  const updateMeeting = async (id: string, data: Partial<Meeting>) => {
    const { error } = await supabase
      .from("meetings")
      .update(data)
      .eq("id", id);
    return { error };
  };

  const deleteMeeting = async (id: string) => {
    const { error } = await supabase
      .from("meetings")
      .delete()
      .eq("id", id);
    return { error };
  };

  const addActionItem = async (
    meetingId: string,
    data: { description: string; assigned_to?: string; due_date?: string }
  ) => {
    const { error } = await supabase
      .from("meeting_action_items")
      .insert({ meeting_id: meetingId, ...data });
    return { error };
  };

  const updateActionItem = async (
    id: string,
    data: Partial<MeetingActionItem>
  ) => {
    const { error } = await supabase
      .from("meeting_action_items")
      .update(data)
      .eq("id", id);
    return { error };
  };

  const deleteActionItem = async (id: string) => {
    const { error } = await supabase
      .from("meeting_action_items")
      .delete()
      .eq("id", id);
    return { error };
  };

  return {
    createMeeting,
    updateMeeting,
    deleteMeeting,
    addActionItem,
    updateActionItem,
    deleteActionItem,
  };
}
