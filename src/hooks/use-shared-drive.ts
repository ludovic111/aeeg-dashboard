"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { SharedFile, SharedFolder } from "@/types";

export function useSharedDrive() {
  const [folders, setFolders] = useState<SharedFolder[]>([]);
  const [files, setFiles] = useState<SharedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchDrive = useCallback(async () => {
    setLoading(true);

    const [foldersRes, filesRes] = await Promise.all([
      supabase
        .from("shared_folders")
        .select("*")
        .order("name", { ascending: true }),
      supabase
        .from("shared_files")
        .select("*")
        .order("created_at", { ascending: false }),
    ]);

    setFolders((foldersRes.data as SharedFolder[]) || []);
    setFiles((filesRes.data as SharedFile[]) || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    let active = true;

    async function loadInitialDrive() {
      await fetchDrive();
      if (!active) return;
    }

    loadInitialDrive();
    return () => {
      active = false;
    };
  }, [fetchDrive]);

  const createFolder = async (name: string, parentId: string | null) => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return { error: { message: "Le nom du dossier est requis" } };
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: { message: "Utilisateur non authentifié" } };
    }

    const { error } = await supabase.from("shared_folders").insert({
      name: trimmedName,
      parent_id: parentId,
      created_by: user.id,
    });

    if (!error) {
      await fetchDrive();
    }

    return { error };
  };

  const uploadFile = async (file: File, folderId: string | null) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: { message: "Utilisateur non authentifié" } };
    }

    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${folderId || "root"}/${Date.now()}-${safeFileName}`;

    const { error: uploadError } = await supabase.storage
      .from("shared-files")
      .upload(storagePath, file, {
        contentType: file.type || undefined,
        upsert: false,
      });

    if (uploadError) {
      return { error: uploadError };
    }

    const { error: metadataError } = await supabase.from("shared_files").insert({
      folder_id: folderId,
      name: file.name,
      storage_path: storagePath,
      mime_type: file.type || null,
      size_bytes: file.size,
      created_by: user.id,
    });

    if (metadataError) {
      await supabase.storage.from("shared-files").remove([storagePath]);
      return { error: metadataError };
    }

    await fetchDrive();
    return { error: null };
  };

  const createFileSignedUrl = async (storagePath: string) => {
    const { data, error } = await supabase.storage
      .from("shared-files")
      .createSignedUrl(storagePath, 60 * 10);

    return { signedUrl: data?.signedUrl || null, error };
  };

  return {
    folders,
    files,
    loading,
    createFolder,
    uploadFile,
    createFileSignedUrl,
    refetch: fetchDrive,
  };
}
