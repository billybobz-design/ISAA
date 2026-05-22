"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Share2, Check } from "lucide-react"

interface ShareButtonProps {
  url?: string
  className?: string
  label?: string
}

export function ShareButton({ url, className, label = "Share" }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    const shareUrl = url ? new URL(url, window.location.origin).toString() : window.location.href

    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea")
      textarea.value = shareUrl
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand("copy")
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Button 
      variant="outline" 
      size="sm" 
      className={className ?? "h-10 px-4"}
      onClick={handleShare}
    >
      {copied ? (
        <>
          <Check className="mr-2 h-4 w-4 text-green-500" /> Copied!
        </>
      ) : (
        <>
          <Share2 className="mr-2 h-4 w-4" /> {label}
        </>
      )}
    </Button>
  )
}
