"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ThumbsUp } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"

interface LikeButtonProps {
  articleId?: string
  eventId?: string
  initialCount: number
}

export function LikeButton({ articleId, eventId, initialCount }: LikeButtonProps) {
  const [likes, setLikes] = useState(initialCount)
  const [isLiked, setIsLiked] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    checkIfLiked()
  }, [articleId, eventId])

  const checkIfLiked = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const query = supabase
      .from("likes")
      .select("id")
      .eq("user_id", session.user.id)
    
    if (articleId) query.eq("article_id", articleId)
    if (eventId) query.eq("event_id", eventId)

    const { data } = await query
    if (data && data.length > 0) setIsLiked(true)
  }

  const handleLike = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      alert("Please login to like")
      return
    }

    setLoading(true)
    if (isLiked) {
      // Unlike
      const query = supabase
        .from("likes")
        .delete()
        .eq("user_id", session.user.id)
      
      if (articleId) query.eq("article_id", articleId)
      if (eventId) query.eq("event_id", eventId)

      const { error } = await query
      if (!error) {
        setLikes(prev => prev - 1)
        setIsLiked(false)
      }
    } else {
      // Like
      const { error } = await supabase
        .from("likes")
        .insert({
          user_id: session.user.id,
          article_id: articleId,
          event_id: eventId
        })
      
      if (!error) {
        setLikes(prev => prev + 1)
        setIsLiked(true)
      }
    }
    setLoading(false)
  }

  return (
    <Button 
      variant={isLiked ? "default" : "outline"} 
      size="sm" 
      disabled={loading}
      onClick={handleLike}
      className={cn(
        "h-10 px-4 transition-all duration-300",
        isLiked && "bg-primary text-primary-foreground shadow-md shadow-primary/20"
      )}
    >
      <ThumbsUp className={cn("mr-2 h-4 w-4", isLiked ? "fill-current" : "group-hover:text-primary")} />
      <span>{likes}</span>
      <span className="ml-1 hidden sm:inline">{isLiked ? "Liked" : "Like"}</span>
    </Button>
  )
}
