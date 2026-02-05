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

export default function FilesPage() {
  const { isCommitteeMember } = useAuth();
  const { folders, files, loading, createFolder, uploadFile, createFileSignedUrl } =
    useSharedDrive();

  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [uploadCandidate, setUploadCandidate] = useState<File | null>(null);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [uploading, setUploading] = useState(false);

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
        <p className="text-5xl mb-4">🔒</p>
        <p className="font-black text-lg">Accès restreint</p>
        <p className="text-sm text-[var(--foreground)]/60 font-bold mt-1">
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black">📁 Fichiers</h1>
        <p className="text-sm font-bold text-[var(--foreground)]/60 mt-1">
          Espace partagé pour créer des dossiers et déposer des documents
        </p>
      </div>

      <Card accentColor="#AA96DA">
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
              <div className="flex items-center gap-2">
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
              <div className="flex items-center gap-2">
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
                <p className="text-sm font-bold text-[var(--foreground)]/60">
                  Aucun dossier ici.
                </p>
              ) : (
                visibleFolders.map((folder) => (
                  <Button
                    key={folder.id}
                    type="button"
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setCurrentFolderId(folder.id)}
                  >
                    <Folder className="h-4 w-4" strokeWidth={3} />
                    {folder.name}
                  </Button>
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
                <p className="text-sm font-bold text-[var(--foreground)]/60">
                  Aucun fichier ici.
                </p>
              ) : (
                visibleFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between gap-2 p-2 rounded-lg border-2 border-[var(--border-color)]"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate flex items-center gap-2">
                        <FileText className="h-4 w-4 shrink-0" strokeWidth={3} />
                        {file.name}
                      </p>
                      <p className="text-xs font-bold text-[var(--foreground)]/60 mt-1">
                        {Math.max(1, Math.round(file.size_bytes / 1024))} KB · {" "}
                        {formatRelative(file.created_at)}
                      </p>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenFile(file.storage_path)}
                    >
                      <ExternalLink className="h-4 w-4" strokeWidth={3} />
                      Ouvrir
                    </Button>
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
