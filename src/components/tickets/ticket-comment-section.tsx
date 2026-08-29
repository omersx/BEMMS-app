"use client"

import { addTicketComment } from "@/lib/actions/tickets"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { AlertTriangle, Send, Lock, Globe } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"

interface Comment {
  id: string
  body: string
  visibility: string
  createdAt: Date | string
  author?: { fullName: string } | null
}

export function TicketCommentSection({
  ticketId,
  comments,
  canAddInternal = false,
}: {
  ticketId: string
  comments: Comment[]
  canAddInternal?: boolean
}) {
  const [body, setBody] = useState("")
  const [visibility, setVisibility] = useState<'public' | 'internal'>('public')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Sort chronologically (oldest first) like a chat thread
  const sortedComments = [...comments].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )

  // Auto-scroll to bottom on load
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [comments])

  const handleSubmit = async () => {
    if (!body.trim()) return
    setLoading(true)
    await addTicketComment(ticketId, { body, visibility })
    setBody("")
    setLoading(false)
    window.location.reload()
  }

  return (
    <div className="flex flex-col h-[600px] border rounded-lg overflow-hidden bg-background shadow-sm">
      {/* Chat History / Thread Feed */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50"
      >
        {sortedComments.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-2">
            <Globe className="w-8 h-8 opacity-20" />
            <p className="text-sm">No comments yet. Start the conversation.</p>
          </div>
        ) : (
          sortedComments.map(c => <HelpdeskMessage key={c.id} comment={c} />)
        )}
      </div>

      {/* Helpdesk Reply Box */}
      <div className="p-4 bg-card border-t shadow-sm z-10">
        {canAddInternal && (
          <Tabs 
            value={visibility} 
            onValueChange={(v) => setVisibility(v as 'public' | 'internal')}
            className="mb-3"
          >
            <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
              <TabsTrigger value="public" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Globe className="w-4 h-4 mr-2" /> Public Reply
              </TabsTrigger>
              <TabsTrigger value="internal" className="data-[state=active]:bg-amber-500 data-[state=active]:text-white">
                <Lock className="w-4 h-4 mr-2" /> Internal Note
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        <div className={cn(
          "rounded-lg border transition-colors focus-within:ring-1",
          visibility === 'internal' 
            ? "bg-amber-50/50 border-amber-300 ring-amber-400" 
            : "bg-background border-input ring-primary"
        )}>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={visibility === 'internal' ? "Type an internal note for the biomedical team..." : "Type a public reply to the reporter..."}
            className="border-0 bg-transparent focus-visible:ring-0 resize-none min-h-[100px]"
          />
          <div className="flex items-center justify-between p-2 pt-0">
            <div className="text-xs px-2 flex items-center">
              {visibility === 'internal' ? (
                <span className="text-amber-700 font-medium flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Visible to Biomed Only
                </span>
              ) : (
                <span className="text-muted-foreground flex items-center gap-1">
                  <Globe className="w-3 h-3" /> Visible to Reporter & Staff
                </span>
              )}
            </div>
            <Button size="sm" onClick={handleSubmit} disabled={!body.trim() || loading} 
              className={visibility === 'internal' ? "bg-amber-600 hover:bg-amber-700 text-white" : ""}
            >
              <Send className="w-4 h-4 mr-2" />
              {loading ? "Sending..." : "Send"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function HelpdeskMessage({ comment }: { comment: Comment }) {
  const isInternal = comment.visibility === 'internal'

  return (
    <div className={cn(
      "flex gap-3 p-4 rounded-xl shadow-sm border",
      isInternal 
        ? "bg-amber-50/80 border-amber-200" 
        : "bg-background border-border"
    )}>
      <Avatar className="h-9 w-9 shrink-0 mt-0.5">
        <AvatarFallback className={cn("text-xs font-semibold", isInternal ? "bg-amber-200 text-amber-900" : "bg-primary/10 text-primary")}>
          {comment.author?.fullName?.substring(0, 2).toUpperCase() || 'U'}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 space-y-1.5 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm">
            {comment.author?.fullName || 'Unknown'}
          </span>
          <span className="text-xs text-muted-foreground">
            {new Date(comment.createdAt).toLocaleString()}
          </span>
          {isInternal && (
            <span className="text-[10px] uppercase tracking-wider font-bold bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded-sm flex items-center gap-1 ml-auto">
              <Lock className="w-3 h-3" /> Internal Note
            </span>
          )}
        </div>
        <p className="text-sm whitespace-pre-wrap leading-relaxed text-foreground">
          {comment.body}
        </p>
      </div>
    </div>
  )
}
