"use client"

import * as React from "react"
import Link from "next/link"
import { GraduationCap, Loader2, Mail } from "lucide-react"

import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function ForgotPasswordForm() {
  const [email, setEmail] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) {
      setError(error.message)
    } else {
      setSuccess("Password reset email sent. Please check your inbox and spam folder.")
    }

    setLoading(false)
  }

  return (
    <Card className="w-full max-w-md shadow-lg border-slate-200">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-4">
          <GraduationCap className="h-10 w-10 text-primary" />
        </div>
        <CardTitle className="text-2xl font-serif">Reset Your Password</CardTitle>
        <CardDescription>
          Enter your account email and we&apos;ll send you a secure reset link.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 text-sm bg-red-50 text-red-600 rounded-md border border-red-100">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 text-sm bg-green-50 text-green-700 rounded-md border border-green-100">
              {success}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="name@school.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-slate-50/50 pl-10"
              />
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button className="w-full h-11" type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send Reset Link
          </Button>

          <div className="text-sm text-center text-muted-foreground">
            Remembered it?{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Back to sign in
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}
