"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ShieldAlert } from "lucide-react"
import { useSearchParams } from "next/navigation"

import { Suspense } from "react"

function AuthCodeErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error') || "We encountered a problem while verifying your email code."

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
      <div className="bg-red-50 p-6 rounded-full mb-6">
        <ShieldAlert className="h-12 w-12 text-red-600" />
      </div>
      <h1 className="text-3xl font-serif font-bold text-slate-900 mb-4">Authentication Error</h1>
      <p className="text-muted-foreground max-w-md mb-8">
        {error}
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Link href="/login">
          <Button variant="default" className="w-full sm:w-auto">
            Back to Login
          </Button>
        </Link>
        <Link href="/signup">
          <Button variant="outline" className="w-full sm:w-auto">
            Try Signing Up Again
          </Button>
        </Link>
      </div>
    </div>
  )
}

export default function AuthCodeError() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthCodeErrorContent />
    </Suspense>
  )
}
