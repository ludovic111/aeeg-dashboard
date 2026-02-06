"use client";

import { useMemo, useState } from "react";
import {
  ChevronRight,
  FileText,
  Folder,
  FolderPlus,
  Upload,
  ArrowLeft,
  ExternalLink,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useSharedDrive } from "@/hooks/use-shared-drive";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelative } from "@/lib/utils";
import type { SharedFile, SharedFolder } from "@/types";

export default function FilesPage() {
  const { profile, isAdmin, isCommitteeMember } = useAuth();
  const {
    folders,
    files,
    loading,
    createFolder,
    uploadFile,
    createFileSignedUrl,
    deleteFile,
    deleteFolder,
  } = useSharedDrive();

  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [uploadCandidate, setUploadCandidate] = useState<File | null>(null);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingFolderId, setDeletingFolderId] = useState<string | null>(null);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);

  const folderMap = useMemo(
    () => new Map(folders.map((folder) => [folder.id, folder])),
    [folders]
  );

  const breadcrumbs = useMemo(() => {
    const chain: Array<{ id: string; name: string }> = [];
    let cursor = currentFolderId;

    while (cursor) {
      const folder = folderMap.get(cursor);
      if (!folder) break;
      chain.unshift({ id: folder.id, name: folder.name });
      cursor = folder.parent_id;
    }

    return chain;
  }, [currentFolderId, folderMap]);

  const visibleFolders = useMemo(
    () =>
      folders.filter((folder) => {
        if (!currentFolderId) {
          return folder.parent_id === null;
        }
        return folder.parent_id === currentFolderId;
      }),
    [folders, currentFolderId]
  );

  const visibleFiles = useMemo(
    () =>
      files.filter((file) => {
        if (!currentFolderId) {
          return file.folder_id === null;
        }
        return file.folder_id === currentFolderId;
      }),
    [files, currentFolderId]
  );

  if (!isCommitteeMember) {
    return (
      <div className="text-center py-16">
        <p className="font-[var(--font-display)] text-[2.1rem] leading-none">Acces restreint</p>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Seuls les membres du comité et les admins peuvent accéder à cette page
        </p>
      </div>
    );
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast.error("Le nom du dossier est requis");
      return;
    }

    setCreatingFolder(true);
    const { error } = await createFolder(newFolderName, currentFolderId);

    if (error) {
      toast.error(error.message || "Impossible de créer le dossier");
    } else {
      toast.success("Dossier créé");
      setNewFolderName("");
    }

    setCreatingFolder(false);
  };

  const handleUploadFile = async () => {
    if (!uploadCandidate) {
      toast.error("Choisissez un fichier");
      return;
    }

    setUploading(true);
    const { error } = await uploadFile(uploadCandidate, currentFolderId);

    if (error) {
      toast.error(error.message || "Impossible d'envoyer le fichier");
    } else {
      toast.success("Fichier ajouté");
      setUploadCandidate(null);
    }

    setUploading(false);
  };

  const handleOpenFile = async (storagePath: string) => {
    const { signedUrl, error } = await createFileSignedUrl(storagePath);

    if (error || !signedUrl) {
      toast.error(error?.message || "Impossible d'ouvrir le fichier");
      return;
    }

    window.open(signedUrl, "_blank", "noopener,noreferrer");
  };

  const canDeleteFolder = (folder: SharedFolder) =>
    isAdmin || folder.created_by === profile?.id;

  const canDeleteFile = (file: SharedFile) =>
    isAdmin || file.created_by === profile?.id;

  const handleDeleteFolder = async (folder: SharedFolder) => {
    const confirmed = window.confirm(
      `Supprimer le dossier "${folder.name}" et son contenu ?`
    );
    if (!confirmed) return;

    setDeletingFolderId(folder.id);
    const { error } = await deleteFolder(folder.id);

    if (error) {
      toast.error(error.message || "Impossible de supprimer le dossier");
    } else {
      toast.success("Dossier supprimé");
      if (currentFolderId === folder.id) {
        setCurrentFolderId(folder.parent_id || null);
      }
    }

    setDeletingFolderId(null);
  };

  const handleDeleteFile = async (file: SharedFile) => {
    const confirmed = window.confirm(`Supprimer le fichier "${file.name}" ?`);
    if (!confirmed) return;

    setDeletingFileId(file.id);
    const { error } = await deleteFile(file.id, file.storage_path);

    if (error) {
      toast.error(error.message || "Impossible de supprimer le fichier");
    } else {
      toast.success("Fichier supprimé");
    }

    setDeletingFileId(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="display-hero max-w-[8ch]">Fichiers</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Espace partagé pour créer des dossiers et déposer des documents
        </p>
      </div>

      <Card accentColor="var(--card-accent-purple)">
        <CardHeader>
          <CardTitle className="text-base">Navigation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-sm font-bold">
            <Button
              type="button"
              size="sm"
              variant={currentFolderId ? "outline" : "default"}
              onClick={() => setCurrentFolderId(null)}
            >
              Racine
            </Button>
            {breadcrumbs.map((crumb) => (
              <div key={crumb.id} className="flex items-center gap-2">
                <ChevronRight className="h-4 w-4" strokeWidth={3} />
                <Button
                  type="button"
                  size="sm"
                  variant={currentFolderId === crumb.id ? "default" : "outline"}
                  onClick={() => setCurrentFolderId(crumb.id)}
                >
                  {crumb.name}
                </Button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="folder-name">Créer un dossier</Label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <Input
                  id="folder-name"
                  value={newFolderName}
                  onChange={(event) => setNewFolderName(event.target.value)}
                  placeholder="Nom du dossier"
                />
                <Button
                  type="button"
                  onClick={handleCreateFolder}
                  disabled={creatingFolder}
                >
                  <FolderPlus className="h-4 w-4" strokeWidth={3} />
                  {creatingFolder ? "Création..." : "Créer"}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file-upload">Ajouter un fichier</Label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <Input
                  id="file-upload"
                  type="file"
                  onChange={(event) =>
                    setUploadCandidate(event.target.files?.[0] || null)
                  }
                />
                <Button
                  type="button"
                  onClick={handleUploadFile}
                  disabled={uploading || !uploadCandidate}
                  className="shrink-0"
                >
                  <Upload className="h-4 w-4" strokeWidth={3} />
                  {uploading ? "Envoi..." : "Ajouter"}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dossiers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {currentFolderId && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const parentId = folderMap.get(currentFolderId)?.parent_id || null;
                    setCurrentFolderId(parentId);
                  }}
                >
                  <ArrowLeft className="h-4 w-4" strokeWidth={3} />
                  Remonter
                </Button>
              )}

              {visibleFolders.length === 0 ? (
                <p className="text-sm font-bold text-[var(--text-secondary)]">
                  Aucun dossier ici.
                </p>
              ) : (
                visibleFolders.map((folder) => (
                  <div
                    key={folder.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-2"
                  >
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 justify-start"
                      onClick={() => setCurrentFolderId(folder.id)}
                    >
                      <Folder className="h-4 w-4" strokeWidth={3} />
                      {folder.name}
                    </Button>
                    {canDeleteFolder(folder) && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteFolder(folder)}
                        disabled={deletingFolderId === folder.id}
                        className="w-full sm:w-auto"
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={3} />
                        {deletingFolderId === folder.id ? "Suppression..." : "Supprimer"}
                      </Button>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Fichiers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {visibleFiles.length === 0 ? (
                <p className="text-sm font-bold text-[var(--text-secondary)]">
                  Aucun fichier ici.
                </p>
              ) : (
                visibleFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-2 rounded-[var(--radius-element)] border-2 border-[var(--border-color)]"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate flex items-center gap-2">
                        <FileText className="h-4 w-4 shrink-0" strokeWidth={3} />
                        {file.name}
                      </p>
                      <p className="text-xs font-bold text-[var(--text-secondary)] mt-1">
                        {Math.max(1, Math.round(file.size_bytes / 1024))} KB · {" "}
                        {formatRelative(file.created_at)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenFile(file.storage_path)}
                        className="flex-1 sm:flex-none"
                      >
                        <ExternalLink className="h-4 w-4" strokeWidth={3} />
                        Ouvrir
                      </Button>
                      {canDeleteFile(file) && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteFile(file)}
                          disabled={deletingFileId === file.id}
                          className="flex-1 sm:flex-none"
                        >
                          <Trash2 className="h-4 w-4" strokeWidth={3} />
                          {deletingFileId === file.id ? "Suppression..." : "Supprimer"}
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
