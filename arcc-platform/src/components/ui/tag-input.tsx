"use client"

import { useState, KeyboardEvent } from "react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X } from "lucide-react"

interface TagInputProps {
  label: string
  placeholder?: string
  tags: string[]
  onTagsChange: (tags: string[]) => void
  suggestions?: string[]
}

export function TagInput({ label, placeholder, tags, onTagsChange, suggestions = [] }: TagInputProps) {
  const [inputValue, setInputValue] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)

  const addTag = (tag: string) => {
    const trimmed = tag.trim()
    if (trimmed && !tags.includes(trimmed)) {
      onTagsChange([...tags, trimmed])
    }
    setInputValue("")
    setShowSuggestions(false)
  }

  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter(t => t !== tagToRemove))
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      addTag(inputValue)
    }
    if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1])
    }
  }

  const filteredSuggestions = suggestions.filter(
    s => s.toLowerCase().includes(inputValue.toLowerCase()) && !tags.includes(s)
  )

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-2 p-3 rounded-xl border border-slate-200 bg-slate-50/30 min-h-[44px] focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/40 transition-all">
        {tags.map(tag => (
          <Badge key={tag} variant="secondary" className="bg-primary/10 text-primary border-primary/20 px-3 py-1 gap-1.5 font-medium">
            {tag}
            <button 
              onClick={() => removeTag(tag)} 
              className="ml-1 hover:bg-primary/20 rounded-full p-0.5 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <div className="relative flex-1 min-w-[120px]">
          <Input
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value)
              setShowSuggestions(true)
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder={tags.length === 0 ? placeholder : "Add more..."}
            className="border-0 shadow-none p-0 h-8 bg-transparent focus-visible:ring-0"
          />
          {showSuggestions && inputValue && filteredSuggestions.length > 0 && (
            <div className="absolute top-full left-0 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg z-10 max-h-[150px] overflow-y-auto">
              {filteredSuggestions.map(s => (
                <button
                  key={s}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors first:rounded-t-xl last:rounded-b-xl"
                  onMouseDown={() => addTag(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">Press Enter or comma to add a tag</p>
    </div>
  )
}
