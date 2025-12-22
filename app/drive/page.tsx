"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import pb from "@/lib/pocketbase";
import { useAuth } from "@/components/AuthProvider";
import { RecordModel } from "pocketbase";

interface FileRecord extends RecordModel {
  title: string;
  field: string;
  uploaded_by: string;
  expand?: {
    uploaded_by: {
      name: string;
      email: string;
    };
  };
}

export default function DrivePage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingFile, setEditingFile] = useState<FileRecord | null>(null);

  const fetchFiles = async () => {
    setIsLoading(true);
    try {
      const records = await pb.collection("files").getFullList<FileRecord>({
        sort: "-created",
        expand: "uploaded_by",
      });
      setFiles(records);
    } catch (err: any) {
      if (err.isAbort) return;
      console.error("Error fetching files:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchFiles();
    }
  }, [user]);

  const filteredFiles = useMemo(() => {
    return files.filter((f) => 
      f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.field.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [files, searchQuery]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this file?")) return;
    try {
      await pb.collection("files").delete(id);
      fetchFiles();
    } catch (err) {
      console.error("Error deleting file:", err);
      alert("Failed to delete file.");
    }
  };

  const handleDownload = (file: FileRecord) => {
    const url = pb.files.getUrl(file, file.field, { download: true });
    window.open(url, "_blank");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => router.push("/")}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Back to Dashboard
              </button>
              <h1 className="text-xl font-bold text-foreground tracking-tight border-l border-border pl-4">
                Drive
              </h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
               {user.role === "admin" && (
                <button 
                  onClick={() => {
                    setEditingFile(null);
                    setShowModal(true);
                  }}
                  className="rounded bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-smooth shadow-sm whitespace-nowrap"
                >
                  + Upload File
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Filters */}
        <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-end">
                <div className="flex-1 w-full">
                    <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Search</label>
                    <input 
                        type="text" 
                        placeholder="Search files..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-background border border-input rounded px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                </div>
            </div>
        </div>

        {/* Files Grid */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading files...</div>
        ) : filteredFiles.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No files found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredFiles.map((file) => (
              <div key={file.id} className="group bg-card border border-border rounded-lg p-4 shadow-sm hover:shadow-md transition-all flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 bg-muted rounded-lg">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  {user.role === "admin" && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => {
                          setEditingFile(file);
                          setShowModal(true);
                        }}
                        className="p-1.5 text-muted-foreground hover:text-primary hover:bg-muted rounded"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => handleDelete(file.id)}
                        className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
                
                <h3 className="font-medium text-foreground truncate mb-1" title={file.title}>
                  {file.title}
                </h3>
                <p className="text-xs text-muted-foreground truncate mb-4" title={file.field}>
                  {file.field}
                </p>
                
                <div className="mt-auto pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                  <span>{new Date(file.created).toLocaleDateString()}</span>
                  <span>{file.expand?.uploaded_by?.name || 'Unknown'}</span>
                </div>

                <button 
                  onClick={() => handleDownload(file)}
                  className="mt-3 w-full py-2 px-3 bg-muted hover:bg-muted/80 text-foreground text-sm font-medium rounded transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* File Modal */}
      {showModal && (
        <FileModal
          file={editingFile}
          onClose={() => setShowModal(false)}
          onSuccess={fetchFiles}
        />
      )}
    </div>
  );
}

function FileModal({ file, onClose, onSuccess }: { file: FileRecord | null, onClose: () => void, onSuccess: () => void }) {
  const { user } = useAuth();
  const [title, setTitle] = useState(file?.title || "");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!file && !selectedFile) {
      setError("Please select a file.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("title", title);
      
      if (!file) {
        formData.append("uploaded_by", user.id);
      }
      
      if (selectedFile) {
        formData.append("field", selectedFile);
      }

      if (file) {
        await pb.collection("files").update(file.id, formData);
      } else {
        await pb.collection("files").create(formData);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to save file.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-elegant">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground capitalize">{file ? "Edit File" : "Upload File"}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground">Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full border border-input bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
              placeholder="Enter file title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground">File</label>
            <input
              type="file"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="mt-1 block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              required={!file}
            />
            {file && (
              <p className="mt-1 text-xs text-muted-foreground">
                Current file: {file.field} (Leave empty to keep current)
              </p>
            )}
          </div>

          {error && <div className="text-sm text-destructive">{error}</div>}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-smooth"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-smooth"
            >
              {isSubmitting ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
