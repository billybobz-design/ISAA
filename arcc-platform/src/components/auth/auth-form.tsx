"use client"

import * as React from "react"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { GraduationCap, Loader2 } from "lucide-react"
import Link from "next/link"

interface AuthFormProps {
  mode: "login" | "signup"
}

export function AuthForm({ mode }: AuthFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || "/"

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (mode === "signup" && password !== confirmPassword) {
      setError("Passwords do not match!")
      setLoading(false)
      return
    }

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })
        if (error) throw error
        alert("Check your email for the confirmation link!")
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        router.push(next)
        router.refresh()
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md shadow-lg border-slate-200">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-4">
          <GraduationCap className="h-10 w-10 text-primary" />
        </div>
        <CardTitle className="text-2xl font-serif">
          {mode === "login" ? "Welcome Back" : "Create Account"}
        </CardTitle>
        <CardDescription>
          {mode === "login" 
            ? "Enter your credentials to access the platform" 
            : "Join the ISAA global academic community"}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleAuth}>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 text-sm bg-red-50 text-red-600 rounded-md border border-red-100">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="name@school.edu" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
              className="bg-slate-50/50"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">{mode === "signup" ? "Create Password" : "Password"}</Label>
              {mode === "login" && (
                <Link href="/forgot-password" className="text-xs text-muted-foreground hover:underline">
                  Forgot password?
                </Link>
              )}
            </div>
            <Input 
              id="password" 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
              className="bg-slate-50/50"
            />
          </div>
          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Retype Password</Label>
              <Input 
                id="confirmPassword" 
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required 
                className="bg-slate-50/50"
              />
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button className="w-full h-11" type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "login" ? "Sign In" : "Sign Up"}
          </Button>
          <div className="text-sm text-center text-muted-foreground">
            {mode === "login" ? (
              <>
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="text-primary hover:underline font-medium">
                  Create one
                </Link>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <Link href="/login" className="text-primary hover:underline font-medium">
                  Sign in
                </Link>
              </>
            )}
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong."
}
