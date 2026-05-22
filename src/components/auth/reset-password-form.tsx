"use client"

import * as React from "react"
import Link from "next/link"
import { GraduationCap, Loader2, ShieldCheck } from "lucide-react"
import { useRouter } from "next/navigation"

import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function ResetPasswordForm() {
  const router = useRouter()
  const [password, setPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [checkingSession, setCheckingSession] = React.useState(true)
  const [canReset, setCanReset] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState<string | null>(null)

  React.useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      setCanReset(Boolean(session))
      setCheckingSession(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      setCanReset(Boolean(session))
      setCheckingSession(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
    } else {
      setSuccess("Password updated successfully. Redirecting to login...")
      setTimeout(() => {
        router.push("/login")
        router.refresh()
      }, 1200)
    }

    setLoading(false)
  }

  if (checkingSession) {
    return (
      <div className="flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <Card className="w-full max-w-md shadow-lg border-slate-200">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-4">
          <GraduationCap className="h-10 w-10 text-primary" />
        </div>
        <CardTitle className="text-2xl font-serif">Choose a New Password</CardTitle>
        <CardDescription>
          Set a fresh password for your account.
        </CardDescription>
      </CardHeader>

      {!canReset ? (
        <CardContent className="space-y-4">
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Your reset session is missing or expired. Please request a new password reset link.
          </div>
          <Link href="/forgot-password" className="block">
            <Button className="w-full">Request New Reset Link</Button>
          </Link>
        </CardContent>
      ) : (
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm bg-red-50 text-red-600 rounded-md border border-red-100">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 text-sm bg-green-50 text-green-700 rounded-md border border-green-100 flex items-center">
                <ShieldCheck className="mr-2 h-4 w-4" />
                {success}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-slate-50/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="bg-slate-50/50"
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button className="w-full h-11" type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Password
            </Button>

            <div className="text-sm text-center text-muted-foreground">
              <Link href="/login" className="text-primary hover:underline font-medium">
                Back to sign in
              </Link>
            </div>
          </CardFooter>
        </form>
      )}
    </Card>
  )
}
