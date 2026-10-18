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
  AlertTriangle,
  Send,
  Lock,
  Globe,
  Loader2,
  Wrench,
  User,
  MessageCircle,
  Stethoscope,
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

const QUICK_CHAT_TEMPLATES = [
  "When is this expected to be ready for patient care?",
  "The device is currently in Room / Bed for inspection.",
  "Please call our nurse station extension when arriving.",
  "Thank you, device is verified and working properly.",
];

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
  const scrollRef = useRef<HTMLDivElement>(null);
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

  const handleSubmit = async () => {
    const text = body.trim();
    if (!text || loading) return;
    setLoading(true);

    const tempComment: Comment = {
      id: `temp-${Date.now()}`,
      body: text,
      visibility: canAddInternal ? visibility : "public",
      createdAt: new Date(),
      authorUserId: currentUserId,
      author: {
        id: currentUserId,
        fullName: "You",
      },
    };

    setOptimisticComments((prev) => [...prev, tempComment]);
    setBody("");

    try {
      const res = await addTicketComment(ticketId, {
        body: text,
        visibility: canAddInternal ? visibility : "public",
      });
      if (res?.success) {
        router.refresh();
        toast.success(
          visibility === "internal" ? "Internal note posted" : "Message sent"
        );
      } else {
        setOptimisticComments((prev) => prev.filter((c) => c.id !== tempComment.id));
        setBody(text);
        toast.error((res as any)?.error || "Failed to post message");
      }
    } catch (err: any) {
      setOptimisticComments((prev) => prev.filter((c) => c.id !== tempComment.id));
      setBody(text);
      toast.error(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Enter (without Shift) or Ctrl+Enter
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col h-[560px] rounded-xl overflow-hidden bg-background">
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
              Use this chat to ask the assigned engineer questions, confirm room locations, or receive live repair updates.
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

      {/* Quick clinical templates for fast messaging */}
      <div className="px-4 py-2 bg-card border-t border-border/60 overflow-x-auto flex gap-1.5 scrollbar-none">
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
      <div className="p-3.5 bg-card border-t shadow-xs z-10 space-y-2">
        {canAddInternal && (
          <Tabs
            value={visibility}
            onValueChange={(v) => setVisibility(v as "public" | "internal")}
            className="mb-2"
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
            placeholder={
              visibility === "internal"
                ? "Type an internal note for biomedical team (Press Enter to send)..."
                : "Type a message to the biomedical engineer (Press Enter to send)..."
            }
            className="border-0 bg-transparent focus-visible:ring-0 resize-none min-h-[70px] max-h-[140px] text-xs sm:text-sm p-3"
          />

          <div className="flex items-center justify-between p-2 pt-0">
            <span className="text-[11px] text-muted-foreground px-1">
              Press <kbd className="font-mono bg-muted px-1 rounded">Enter</kbd> to send, <kbd className="font-mono bg-muted px-1 rounded">Shift+Enter</kbd> for new line
            </span>

            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!body.trim() || loading}
              className={cn(
                "h-8 text-xs gap-1.5 px-3 font-semibold",
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

  const formattedDate = comment.createdAt
    ? new Date(comment.createdAt).toLocaleDateString([], {
        month: "short",
        day: "numeric",
      })
    : "";

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

        {/* Bubble Text */}
        <div
          className={cn(
            "p-3 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs whitespace-pre-wrap break-words",
            isCurrentUser
              ? "bg-primary text-primary-foreground rounded-tr-xs"
              : isInternal
              ? "bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-950 dark:text-amber-100 rounded-tl-xs"
              : isAssignedEngineer
              ? "bg-card border-2 border-blue-200/80 dark:border-blue-900/60 text-foreground rounded-tl-xs"
              : "bg-card border text-foreground rounded-tl-xs"
          )}
        >
          {comment.body}
        </div>
      </div>
    </div>
  );
}
