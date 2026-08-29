"use client"

import { addTicketComment } from "@/lib/actions/tickets"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { AlertTriangle, Send } from "lucide-react"
import { useState } from "react"

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

  const publicComments = comments.filter(c => c.visibility === 'public')
  const internalComments = comments.filter(c => c.visibility === 'internal')

  const handleSubmit = async () => {
    if (!body.trim()) return
    setLoading(true)
    await addTicketComment(ticketId, { body, visibility })
    setBody("")
    setLoading(false)
    // Optimistic: page will revalidate
    window.location.reload()
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="public">
        <TabsList>
          <TabsTrigger value="public">Public Updates ({publicComments.length})</TabsTrigger>
          {canAddInternal && (
            <TabsTrigger value="internal">
              Internal Notes ({internalComments.length})
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="public" className="mt-4 space-y-4">
          {publicComments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No public comments yet.</p>
          ) : (
            publicComments.map(c => <CommentCard key={c.id} comment={c} />)
          )}
        </TabsContent>

        {canAddInternal && (
          <TabsContent value="internal" className="mt-4 space-y-4">
            <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-md">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span className="text-xs text-amber-700 font-medium">
                Internal notes are visible only to the Biomedical Team
              </span>
            </div>
            {internalComments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No internal notes yet.</p>
            ) : (
              internalComments.map(c => <CommentCard key={c.id} comment={c} isInternal />)
            )}
          </TabsContent>
        )}
      </Tabs>

      {/* New comment form */}
      <div className="border rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Add Comment</span>
          {canAddInternal && (
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as any)}
              className="text-xs border rounded px-2 py-1 bg-background"
            >
              <option value="public">Public</option>
              <option value="internal">Internal Note</option>
            </select>
          )}
          {visibility === 'internal' && (
            <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
              Biomedical Only
            </span>
          )}
        </div>
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={visibility === 'internal' ? "Add internal note..." : "Add public comment..."}
          rows={3}
        />
        <div className="flex justify-end">
          <Button size="sm" onClick={handleSubmit} disabled={!body.trim() || loading}>
            <Send className="w-4 h-4 mr-2" />
            {loading ? "Sending..." : "Post"}
          </Button>
        </div>
      </div>
    </div>
  )
}

function CommentCard({ comment, isInternal }: { comment: Comment; isInternal?: boolean }) {
  return (
    <div className={`flex gap-3 p-3 rounded-lg ${isInternal ? 'bg-amber-50/50 border border-amber-100' : 'bg-muted/50'}`}>
      <Avatar className="h-8 w-8">
        <AvatarFallback className="text-xs">
          {comment.author?.fullName?.substring(0, 2).toUpperCase() || 'U'}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium">{comment.author?.fullName || 'Unknown'}</span>
          <span className="text-xs text-muted-foreground">
            {new Date(comment.createdAt).toLocaleString()}
          </span>
        </div>
        <p className="text-sm whitespace-pre-wrap">{comment.body}</p>
      </div>
    </div>
  )
}
