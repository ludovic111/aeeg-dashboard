"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type {
  Party,
  PartyGroceryItem,
  PartyMember,
  PartyTask,
  PartyTaskStatus,
  Profile,
} from "@/types";

type PartyProfile = Pick<Profile, "id" | "full_name" | "email" | "avatar_url">;

export interface PartyWithDetails extends Party {
  manager?: PartyProfile;
  members: PartyMember[];
  tasks: PartyTask[];
  grocery_items: PartyGroceryItem[];
}

interface CreatePartyInput {
  name: string;
  event_date: string;
  event_time: string;
  place: string;
  manager_id: string;
}

interface CreatePartyTaskInput {
  party_id: string;
  title: string;
  description?: string;
  assigned_to: string;
}

interface CreateGroceryItemInput {
  party_id: string;
  label: string;
  quantity?: string;
}

export function useParties() {
  const [parties, setParties] = useState<PartyWithDetails[]>([]);
  const [availableProfiles, setAvailableProfiles] = useState<PartyProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchParties = useCallback(async () => {
    setLoading(true);

    const [partiesRes, profilesRes] = await Promise.all([
      supabase
        .from("parties")
        .select(
          "*, manager:profiles!parties_manager_id_fkey(id, full_name, email, avatar_url)"
        )
        .order("event_date", { ascending: true })
        .order("event_time", { ascending: true }),
      supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url, role")
        .not("role", "in", '("pending","regular_member")')
        .order("full_name", { ascending: true }),
    ]);

    const baseParties = (partiesRes.data as PartyWithDetails[]) || [];
    const profileList = ((profilesRes.data || []) as (PartyProfile & {
      role?: string;
    })[]).map(({ id, full_name, email, avatar_url }) => ({
      id,
      full_name,
      email,
      avatar_url,
    }));

    setAvailableProfiles(profileList);

    const partyIds = baseParties.map((party) => party.id);
    if (partyIds.length === 0) {
      setParties([]);
      setLoading(false);
      return;
    }

    const [membersRes, tasksRes, groceriesRes] = await Promise.all([
      supabase
        .from("party_members")
        .select(
          "*, profile:profiles!party_members_profile_id_fkey(id, full_name, email, avatar_url)"
        )
        .in("party_id", partyIds)
        .order("created_at", { ascending: true }),
      supabase
        .from("party_tasks")
        .select(
          "*, assignee:profiles!party_tasks_assigned_to_fkey(id, full_name, avatar_url), creator:profiles!party_tasks_created_by_fkey(id, full_name, avatar_url)"
        )
        .in("party_id", partyIds)
        .order("created_at", { ascending: true }),
      supabase
        .from("party_grocery_items")
        .select(
          "*, creator:profiles!party_grocery_items_created_by_fkey(id, full_name, avatar_url)"
        )
        .in("party_id", partyIds)
        .order("created_at", { ascending: true }),
    ]);

    const members = (membersRes.data as PartyMember[]) || [];
    const tasks = (tasksRes.data as PartyTask[]) || [];
    const groceryItems = (groceriesRes.data as PartyGroceryItem[]) || [];

    const membersByParty = new Map<string, PartyMember[]>();
    for (const member of members) {
      const list = membersByParty.get(member.party_id) || [];
      list.push(member);
      membersByParty.set(member.party_id, list);
    }

    const tasksByParty = new Map<string, PartyTask[]>();
    for (const task of tasks) {
      const list = tasksByParty.get(task.party_id) || [];
      list.push(task);
      tasksByParty.set(task.party_id, list);
    }

    const groceryByParty = new Map<string, PartyGroceryItem[]>();
    for (const item of groceryItems) {
      const list = groceryByParty.get(item.party_id) || [];
      list.push(item);
      groceryByParty.set(item.party_id, list);
    }

    const mapped = baseParties.map((party) => ({
      ...party,
      members: membersByParty.get(party.id) || [],
      tasks: tasksByParty.get(party.id) || [],
      grocery_items: groceryByParty.get(party.id) || [],
    }));

    setParties(mapped);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    let active = true;

    async function loadInitialData() {
      await fetchParties();
      if (!active) return;
    }

    loadInitialData();
    return () => {
      active = false;
    };
  }, [fetchParties]);

  const createParty = async (input: CreatePartyInput) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: { message: "Utilisateur non authentifié" } };
    }

    const { data, error } = await supabase
      .from("parties")
      .insert({
        name: input.name.trim(),
        event_date: input.event_date,
        event_time: input.event_time,
        place: input.place.trim(),
        manager_id: input.manager_id,
        created_by: user.id,
      })
      .select("id")
      .single();

    if (!error) {
      await fetchParties();
    }

    return { error, partyId: data?.id || null };
  };

  const addPartyMember = async (partyId: string, profileId: string) => {
    const { error } = await supabase.from("party_members").insert({
      party_id: partyId,
      profile_id: profileId,
      role: "member",
    });

    if (!error) {
      await fetchParties();
    }

    return { error };
  };

  const removePartyMember = async (memberId: string) => {
    const { error } = await supabase
      .from("party_members")
      .delete()
      .eq("id", memberId);

    if (!error) {
      await fetchParties();
    }

    return { error };
  };

  const createPartyTask = async (input: CreatePartyTaskInput) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: { message: "Utilisateur non authentifié" } };
    }

    const { error } = await supabase.from("party_tasks").insert({
      party_id: input.party_id,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      assigned_to: input.assigned_to,
      created_by: user.id,
    });

    if (!error) {
      await fetchParties();
    }

    return { error };
  };

  const updatePartyTaskStatus = async (
    taskId: string,
    status: PartyTaskStatus
  ) => {
    const { error } = await supabase
      .from("party_tasks")
      .update({ status })
      .eq("id", taskId);

    if (!error) {
      await fetchParties();
    }

    return { error };
  };

  const createGroceryItem = async (input: CreateGroceryItemInput) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: { message: "Utilisateur non authentifié" } };
    }

    const { error } = await supabase.from("party_grocery_items").insert({
      party_id: input.party_id,
      label: input.label.trim(),
      quantity: input.quantity?.trim() || null,
      created_by: user.id,
    });

    if (!error) {
      await fetchParties();
    }

    return { error };
  };

  const toggleGroceryItem = async (itemId: string, checked: boolean) => {
    const { error } = await supabase
      .from("party_grocery_items")
      .update({ checked })
      .eq("id", itemId);

    if (!error) {
      await fetchParties();
    }

    return { error };
  };

  return {
    parties,
    availableProfiles,
    loading,
    createParty,
    addPartyMember,
    removePartyMember,
    createPartyTask,
    updatePartyTaskStatus,
    createGroceryItem,
    toggleGroceryItem,
    refetch: fetchParties,
  };
}
