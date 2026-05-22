"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDistanceToNow } from "date-fns"
import { MessageSquare, Send, Reply, Loader2 } from "lucide-react"

interface Comment {
  id: string
  content: string
  created_at: string
  author_id: string
  parent_comment_id: string | null
  author: {
    display_name: string
    avatar_url: string
    school: string
  }
}

interface CommentSectionProps {
  articleId?: string
  eventId?: string
}

export function CommentSection({ articleId, eventId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [replyTo, setReplyTo] = useState<string | null>(null)

  useEffect(() => {
    fetchComments()
  }, [articleId, eventId])

  const fetchComments = async () => {
    const query = supabase
      .from("comments")
      .select(`
        *,
        author:users(display_name, avatar_url, school)
      `)
      .order("created_at", { ascending: true })

    if (articleId) query.eq("article_id", articleId)
    if (eventId) query.eq("event_id", eventId)

    const { data } = await query
    if (data) setComments(data as any)
    setFetching(false)
  }

  const handleSubmit = async (parentCommentId: string | null = null) => {
    if (!newComment.trim()) return
    setLoading(true)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      alert("Please login to comment")
      setLoading(false)
      return
    }

    const { error } = await supabase
      .from("comments")
      .insert({
        content: newComment,
        article_id: articleId || null,
        event_id: eventId || null,
        author_id: session.user.id,
        parent_comment_id: parentCommentId
      })

    if (error) {
      alert(error.message)
    } else {
      setNewComment("")
      setReplyTo(null)
      fetchComments()
    }
    setLoading(false)
  }

  const renderComments = (parentCommentId: string | null = null, depth = 0) => {
    return comments
      .filter(c => c.parent_comment_id === parentCommentId)
      .map(comment => (
        <div key={comment.id} className={depth > 0 ? "ml-8 mt-4 border-l pl-4" : "mt-6 border-b pb-6"}>
          <div className="flex items-start space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={comment.author.avatar_url} />
              <AvatarFallback>{comment.author.display_name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm">{comment.author.display_name}</span>
                <span className="text-xs text-muted-foreground">{comment.author.school}</span>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.created_at))} ago
                </span>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">{comment.content}</p>
              <div className="pt-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-auto p-0 text-xs text-muted-foreground hover:text-primary"
                  onClick={() => setReplyTo(comment.id)}
                >
                  <Reply className="mr-1 h-3 w-3" /> Reply
                </Button>
              </div>

              {replyTo === comment.id && (
                <div className="mt-4 space-y-3">
                  <Textarea 
                    placeholder="Write a reply..." 
                    className="min-h-[80px] bg-slate-50/50"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                  />
                  <div className="flex justify-end space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => setReplyTo(null)}>Cancel</Button>
                    <Button size="sm" onClick={() => handleSubmit(comment.id)} disabled={loading}>
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Post Reply"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
          {renderComments(comment.id, depth + 1)}
        </div>
      ))
  }

  if (fetching) return <div className="py-10 text-center text-muted-foreground">Loading comments...</div>

  return (
    <section className="mt-16 space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-serif font-bold text-primary flex items-center">
          <MessageSquare className="mr-2 h-6 w-6" /> Comments ({comments.length})
        </h3>
      </div>

      <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
        <Textarea 
          placeholder="Share your academic feedback or ask a question..." 
          className="min-h-[100px] bg-white border-slate-200"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
        />
        <div className="flex justify-end">
          <Button onClick={() => handleSubmit(null)} disabled={loading} className="px-6">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Post Comment
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {comments.length > 0 ? (
          renderComments(null)
        ) : (
          <div className="py-10 text-center text-slate-400 font-serif italic">
            No comments yet. Start the academic discussion!
          </div>
        )}
      </div>
    </section>
  )
}
