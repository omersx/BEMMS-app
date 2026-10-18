"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { addTicketComment } from "@/lib/actions/tickets";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Send,
  Lock,
  Globe,
  Loader2,
  Wrench,
  MessageCircle,
  Stethoscope,
  Paperclip,
  Image as ImageIcon,
  FileText,
  Download,
  X,
  File as FileIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Comment {
  id: string;
  body: string;
  visibility: string;
  createdAt: Date | string;
  authorUserId?: string;
  author?: {
    id?: string;
    fullName?: string | null;
  } | null;
}

interface PendingAttachment {
  id: string;
  file: File;
  previewUrl?: string;
  isImage: boolean;
}

interface ParsedAttachment {
  name: string;
  url: string;
  size: number;
  type?: string;
}

const QUICK_CHAT_TEMPLATES = [
  "When is this expected to be ready for patient care?",
  "The device is currently in Room / Bed for inspection.",
  "Please call our nurse station extension when arriving.",
  "Thank you, device is verified and working properly.",
];

function formatFileSize(bytes?: number): string {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function parseCommentBody(rawBody: string): { text: string; attachments: ParsedAttachment[] } {
  const attachments: ParsedAttachment[] = [];
  const text = rawBody
    .replace(/\[attachment:(\{.*?\})\]/g, (_, jsonStr) => {
      try {
        const parsed = JSON.parse(jsonStr);
        if (parsed.url && parsed.name) {
          attachments.push(parsed);
        }
        return "";
      } catch {
        return "";
      }
    })
    .trim();

  return { text, attachments };
}

export function TicketCommentSection({
  ticketId,
  comments,
  canAddInternal = false,
  currentUserId,
  assignedEngineerUserId,
  assignedEngineerName,
}: {
  ticketId: string;
  comments: Comment[];
  canAddInternal?: boolean;
  currentUserId?: string;
  assignedEngineerUserId?: string | null;
  assignedEngineerName?: string | null;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [visibility, setVisibility] = useState<"public" | "internal">("public");
  const [loading, setLoading] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<PendingAttachment[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [optimisticComments, setOptimisticComments] = useState<Comment[]>([]);

  // Clear optimistic comments when server re-renders with new props
  useEffect(() => {
    setOptimisticComments([]);
  }, [comments]);

  const allComments = [...comments, ...optimisticComments];

  // If user cannot add internal notes (e.g. ward staff), filter out internal comments
  const visibleComments = canAddInternal
    ? allComments
    : allComments.filter((c) => c.visibility === "public");

  // Sort chronologically (oldest first) like a chat thread
  const sortedComments = [...visibleComments].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  // Auto-scroll to bottom on load and whenever comments change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [comments, optimisticComments]);

  // Handle file selection from input
  const addFiles = (files: FileList | File[]) => {
    const newItems: PendingAttachment[] = [];
    Array.from(files).forEach((file) => {
      // 20MB limit
      if (file.size > 20 * 1024 * 1024) {
        toast.error(`File "${file.name}" exceeds 20MB limit`);
        return;
      }
      const isImg = file.type.startsWith("image/");
      newItems.push({
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        file,
        isImage: isImg,
        previewUrl: isImg ? URL.createObjectURL(file) : undefined,
      });
    });

    if (newItems.length > 0) {
      setPendingFiles((prev) => [...prev, ...newItems]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
      e.target.value = "";
    }
  };

  const removePendingFile = (id: string) => {
    setPendingFiles((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((item) => item.id !== id);
    });
  };

  // Support pasting images from clipboard
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (e.clipboardData.files && e.clipboardData.files.length > 0) {
      const files = Array.from(e.clipboardData.files);
      const images = files.filter((f) => f.type.startsWith("image/"));
      if (images.length > 0) {
        e.preventDefault();
        addFiles(images);
        toast.info(`Added ${images.length} image(s) from clipboard`);
      }
    }
  };

  const handleSubmit = async () => {
    const text = body.trim();
    if ((!text && pendingFiles.length === 0) || loading) return;
    setLoading(true);

    // Save copy of pending files to process
    const filesToUpload = [...pendingFiles];
    const currentVis = canAddInternal ? visibility : "public";

    // Create optimistic display
    let optimisticBody = text;
    filesToUpload.forEach((p) => {
      optimisticBody += `\n[attachment:{"name":"${p.file.name}","url":"${
        p.previewUrl || "#"
      }","size":${p.file.size},"type":"${p.file.type}"}]`;
    });

    const tempComment: Comment = {
      id: `temp-${Date.now()}`,
      body: optimisticBody.trim(),
      visibility: currentVis,
      createdAt: new Date(),
      authorUserId: currentUserId,
      author: {
        id: currentUserId,
        fullName: "You",
      },
    };

    setOptimisticComments((prev) => [...prev, tempComment]);
    setBody("");
    setPendingFiles([]);

    try {
      // 1. Upload files first if any
      const uploadedTags: string[] = [];
      for (const item of filesToUpload) {
        const formData = new FormData();
        formData.append("file", item.file);
        formData.append("visibility", currentVis);

        const uploadRes = await fetch(`/api/tickets/${ticketId}/attachments`, {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          const errData = await uploadRes.json();
          throw new Error(errData.error || `Failed to upload ${item.file.name}`);
        }

        const data = await uploadRes.json();
        if (data.success && data.attachment) {
          const tag = `[attachment:${JSON.stringify({
            name: data.attachment.fileName,
            url: data.attachment.url,
            size: data.attachment.fileSize,
            type: data.attachment.mimeType,
          })}]`;
          uploadedTags.push(tag);
        }
      }

      // 2. Assemble comment body with attachment tags
      let finalBody = text;
      if (uploadedTags.length > 0) {
        finalBody = finalBody ? `${finalBody}\n\n${uploadedTags.join("\n")}` : uploadedTags.join("\n");
      }

      // 3. Post comment
      const res = await addTicketComment(ticketId, {
        body: finalBody.trim(),
        visibility: currentVis,
      });

      if (res?.success) {
        router.refresh();
        toast.success(
          currentVis === "internal"
            ? "Internal note posted"
            : filesToUpload.length > 0
            ? "Message with attachments sent"
            : "Message sent"
        );
      } else {
        // Rollback on failure
        setOptimisticComments((prev) => prev.filter((c) => c.id !== tempComment.id));
        setBody(text);
        setPendingFiles(filesToUpload);
        toast.error((res as any)?.error || "Failed to post message");
      }
    } catch (err: any) {
      setOptimisticComments((prev) => prev.filter((c) => c.id !== tempComment.id));
      setBody(text);
      setPendingFiles(filesToUpload);
      toast.error(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Enter (without Shift)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col h-[580px] rounded-xl overflow-hidden bg-background border shadow-xs">
      {/* Hidden File Pickers */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={imageInputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Chat Sub-header */}
      <div className="px-4 py-2.5 bg-muted/40 border-b flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span>
            {assignedEngineerName
              ? `Direct chat with ${assignedEngineerName}`
              : "Direct chat with Biomedical Engineering"}
          </span>
        </div>
        <span>{sortedComments.length} messages</span>
      </div>

      {/* Chat History / Bubble Thread Feed */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50 dark:bg-muted/10"
      >
        {sortedComments.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-2 p-6 text-center">
            <MessageCircle className="w-10 h-10 opacity-20" />
            <p className="text-sm font-medium">No messages yet in this ticket.</p>
            <p className="text-xs max-w-sm">
              Use this chat to ask the assigned engineer questions, confirm room locations, attach error screenshots, or receive live repair updates.
            </p>
          </div>
        ) : (
          sortedComments.map((c) => (
            <ChatBubble
              key={c.id}
              comment={c}
              isCurrentUser={Boolean(
                currentUserId &&
                  (c.authorUserId === currentUserId ||
                    (c.author as any)?.id === currentUserId)
              )}
              isAssignedEngineer={Boolean(
                assignedEngineerUserId &&
                  (c.authorUserId === assignedEngineerUserId ||
                    (c.author as any)?.id === assignedEngineerUserId)
              )}
            />
          ))
        )}
      </div>

      {/* Quick clinical templates */}
      <div className="px-4 py-1.5 bg-card border-t border-border/60 overflow-x-auto flex gap-1.5 scrollbar-none">
        {QUICK_CHAT_TEMPLATES.map((tmpl) => (
          <button
            key={tmpl}
            type="button"
            onClick={() => setBody(tmpl)}
            className="text-[11px] px-2.5 py-1 rounded-full border bg-muted/30 hover:bg-muted hover:text-foreground text-muted-foreground transition whitespace-nowrap shrink-0"
          >
            {tmpl}
          </button>
        ))}
      </div>

      {/* Chat Input Box */}
      <div className="p-3 bg-card border-t shadow-xs z-10 space-y-2">
        {canAddInternal && (
          <Tabs
            value={visibility}
            onValueChange={(v) => setVisibility(v as "public" | "internal")}
            className="mb-1"
          >
            <TabsList className="grid w-full grid-cols-2 max-w-[340px] h-7">
              <TabsTrigger value="public" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Globe className="w-3.5 h-3.5 mr-1.5" /> Public Message
              </TabsTrigger>
              <TabsTrigger value="internal" className="text-xs data-[state=active]:bg-amber-500 data-[state=active]:text-white">
                <Lock className="w-3.5 h-3.5 mr-1.5" /> Internal Note
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        {/* Pending Attachments Tray */}
        {pendingFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 p-2 bg-muted/40 rounded-lg border border-dashed border-border animate-in fade-in">
            {pendingFiles.map((p) => (
              <div
                key={p.id}
                className="relative flex items-center gap-2 bg-background border rounded-lg p-1.5 pr-2.5 text-xs shadow-xs group"
              >
                {p.isImage && p.previewUrl ? (
                  <img
                    src={p.previewUrl}
                    alt={p.file.name}
                    className="w-8 h-8 rounded object-cover border"
                  />
                ) : (
                  <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                    <FileText className="w-4 h-4" />
                  </div>
                )}
                <div className="max-w-[140px] truncate">
                  <p className="font-medium truncate text-[11px]">{p.file.name}</p>
                  <p className="text-[10px] text-muted-foreground">{formatFileSize(p.file.size)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removePendingFile(p.id)}
                  className="ml-1 text-muted-foreground hover:text-destructive p-0.5 rounded-full hover:bg-muted"
                  title="Remove file"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div
          className={cn(
            "rounded-xl border transition-all focus-within:ring-2",
            visibility === "internal"
              ? "bg-amber-50/40 dark:bg-amber-950/20 border-amber-300 ring-amber-400"
              : "bg-background border-input ring-primary/20"
          )}
        >
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={
              visibility === "internal"
                ? "Type an internal note for biomedical team (Press Enter to send)..."
                : "Type a message to biomedical engineering (or paste screenshot, press Enter to send)..."
            }
            className="border-0 bg-transparent focus-visible:ring-0 resize-none min-h-[60px] max-h-[120px] text-xs sm:text-sm p-3"
          />

          {/* Action Toolbar */}
          <div className="flex items-center justify-between p-2 pt-0 border-t border-border/40">
            {/* Attachment Icons / File Picker buttons */}
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1 rounded-md"
                title="Attach document or file (PDF, DOCX, TXT, Excel)"
              >
                <Paperclip className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">Attach</span>
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => imageInputRef.current?.click()}
                disabled={loading}
                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1 rounded-md"
                title="Attach photo or screenshot"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">Photo</span>
              </Button>
            </div>

            {/* Right side: Helper + Send button */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground hidden md:inline">
                <kbd className="font-mono bg-muted px-1 rounded text-[9px]">Enter</kbd> send, <kbd className="font-mono bg-muted px-1 rounded text-[9px]">Shift+Enter</kbd> newline
              </span>

              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={(!body.trim() && pendingFiles.length === 0) || loading}
                className={cn(
                  "h-7 text-xs gap-1.5 px-3 font-semibold",
                  visibility === "internal" ? "bg-amber-600 hover:bg-amber-700 text-white" : ""
                )}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    Send
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChatBubble({
  comment,
  isCurrentUser,
  isAssignedEngineer,
}: {
  comment: Comment;
  isCurrentUser: boolean;
  isAssignedEngineer: boolean;
}) {
  const isInternal = comment.visibility === "internal";

  const formattedTime = comment.createdAt
    ? new Date(comment.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  const { text, attachments } = parseCommentBody(comment.body);

  return (
    <div
      className={cn(
        "flex gap-2.5 max-w-[85%] sm:max-w-[75%]",
        isCurrentUser ? "ml-auto flex-row-reverse" : "mr-auto"
      )}
    >
      {/* Avatar */}
      <Avatar className="h-7 w-7 shrink-0 mt-1">
        <AvatarFallback
          className={cn(
            "text-[10px] font-bold",
            isInternal
              ? "bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-200"
              : isAssignedEngineer
              ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
              : isCurrentUser
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          )}
        >
          {comment.author?.fullName?.substring(0, 2).toUpperCase() || "U"}
        </AvatarFallback>
      </Avatar>

      {/* Bubble Content */}
      <div className="space-y-1 min-w-0">
        {/* Author Label */}
        <div
          className={cn(
            "flex items-center gap-1.5 text-[11px]",
            isCurrentUser ? "justify-end" : "justify-start"
          )}
        >
          <span className="font-semibold text-foreground truncate">
            {isCurrentUser ? "You" : comment.author?.fullName || "Staff"}
          </span>

          {isAssignedEngineer && !isCurrentUser ? (
            <span className="bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-1.5 py-0.2 rounded font-medium text-[10px] flex items-center gap-1">
              <Wrench className="w-2.5 h-2.5" /> Engineer
            </span>
          ) : !isCurrentUser && (comment.author as any)?.jobTitle ? (
            <span className="bg-muted text-muted-foreground px-1.5 py-0.2 rounded font-medium text-[10px] flex items-center gap-1">
              <Stethoscope className="w-2.5 h-2.5 text-primary" />
              {(comment.author as any).jobTitle}
            </span>
          ) : null}

          {isInternal && (
            <span className="bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 px-1 py-0.2 rounded font-medium text-[9px] flex items-center gap-0.5">
              <Lock className="w-2.5 h-2.5" /> Internal
            </span>
          )}

          <span className="text-[10px] text-muted-foreground ml-1">
            {formattedTime}
          </span>
        </div>

        {/* Bubble Text & Attachments */}
        <div
          className={cn(
            "p-3 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs space-y-2 break-words",
            isCurrentUser
              ? "bg-primary text-primary-foreground rounded-tr-xs"
              : isInternal
              ? "bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-950 dark:text-amber-100 rounded-tl-xs"
              : isAssignedEngineer
              ? "bg-card border-2 border-blue-200/80 dark:border-blue-900/60 text-foreground rounded-tl-xs"
              : "bg-card border text-foreground rounded-tl-xs"
          )}
        >
          {text && (
            <div className="whitespace-pre-wrap leading-relaxed">
              {text}
            </div>
          )}

          {/* Render Attached Files */}
          {attachments.length > 0 && (
            <div className="space-y-2 pt-0.5">
              {attachments.map((att, idx) => {
                const isImage =
                  att.type?.startsWith("image/") ||
                  [".png", ".jpg", ".jpeg", ".webp", ".gif"].some((ext) =>
                    att.name.toLowerCase().endsWith(ext)
                  );

                if (isImage) {
                  return (
                    <a
                      key={idx}
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block overflow-hidden rounded-lg border border-border/40 hover:opacity-95 transition group"
                    >
                      <img
                        src={att.url}
                        alt={att.name}
                        className="max-h-56 max-w-full rounded-lg object-contain bg-black/5 dark:bg-white/5"
                        loading="lazy"
                      />
                      <div className="p-1 px-2 text-[10px] flex items-center justify-between opacity-80 group-hover:opacity-100 bg-black/30 text-white">
                        <span className="truncate max-w-[180px]">{att.name}</span>
                        <span>{formatFileSize(att.size)}</span>
                      </div>
                    </a>
                  );
                }

                return (
                  <a
                    key={idx}
                    href={att.url}
                    download={att.name}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "flex items-center gap-2 p-2 px-2.5 rounded-lg border text-xs transition",
                      isCurrentUser
                        ? "bg-white/10 hover:bg-white/20 border-white/20 text-primary-foreground"
                        : "bg-muted/60 hover:bg-muted border-border text-foreground"
                    )}
                  >
                    <div className="p-1 rounded bg-background/80 text-primary">
                      <FileText className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-[11px]">{att.name}</p>
                      <p className="text-[10px] opacity-75">{formatFileSize(att.size)}</p>
                    </div>
                    <Download className="w-3.5 h-3.5 opacity-70 shrink-0" />
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
