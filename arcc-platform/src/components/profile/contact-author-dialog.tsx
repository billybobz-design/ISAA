"use client"

import { useState } from "react"
import { Check, Copy, Mail, ShieldCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface ContactAuthorDialogProps {
  displayName: string
  contactEmail: string
}

export function ContactAuthorDialog({
  displayName,
  contactEmail,
}: ContactAuthorDialogProps) {
  const [copied, setCopied] = useState(false)

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(contactEmail)
    } catch {
      const textarea = document.createElement("textarea")
      textarea.value = contactEmail
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand("copy")
      document.body.removeChild(textarea)
    }

    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button className="w-full h-11 shadow-sm">
            <Mail className="h-4 w-4 mr-2" />
            Contact {displayName}
          </Button>
        }
      />

      <DialogContent className="max-w-lg p-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <DialogHeader className="px-6 pt-6 pb-4 bg-gradient-to-br from-primary/10 via-white to-white border-b border-slate-100">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm">
            <Mail className="h-5 w-5" />
          </div>
          <DialogTitle className="font-serif text-2xl text-slate-900">
            Contact {displayName}
          </DialogTitle>
          <DialogDescription className="leading-relaxed text-slate-600">
            This member has enabled public contact. You can copy the email
            address below or open it in your local mail app.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-5 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-inner">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              Public Contact Email
            </div>
            <div className="mt-3 break-all rounded-xl border border-primary/10 bg-white px-4 py-3 font-medium text-slate-900 shadow-sm">
              {contactEmail}
            </div>
          </div>

          <p className="text-xs leading-relaxed text-muted-foreground">
            Please use this contact information respectfully and only for
            academic or collaboration-related communication.
          </p>
        </div>

        <DialogFooter className="bg-slate-50/80 border-t border-slate-100 px-6 pt-4 pb-8 sm:justify-between">
          <a
            href={`mailto:${contactEmail}?subject=Connecting%20via%20ISAA%20Platform`}
            className="w-full sm:w-auto"
          >
            <Button variant="outline" className="w-full h-10">
              <Mail className="h-4 w-4 mr-2" />
              Open Mail App
            </Button>
          </a>
          <Button onClick={handleCopyEmail} className="w-full h-10 sm:w-auto min-w-32">
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-2 text-green-400" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copy Email
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
