"use client"

import * as React from "react"
import type { Session } from "@supabase/supabase-js"

import { supabase } from "@/lib/supabase"

export interface UserProfile {
  id: string
  display_name: string | null
  school: string | null
  bio: string | null
  avatar_url: string | null
  role: string | null
  username?: string | null
  show_contact_email?: boolean | null
  contact_email?: string | null
  created_at?: string | null
  email?: string | null
}

interface AuthContextValue {
  session: Session | null
  profile: UserProfile | null
  loading: boolean
  refreshProfile: () => Promise<UserProfile | null>
  updateProfile: (updates: Partial<UserProfile>) => void
  signOut: () => Promise<void>
}

const AuthContext = React.createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<Session | null>(null)
  const [profile, setProfile] = React.useState<UserProfile | null>(null)
  const [loading, setLoading] = React.useState(true)
  const sessionRef = React.useRef<Session | null>(null)

  const fetchProfile = React.useCallback(async (activeSession: Session | null) => {
    if (!activeSession?.user) {
      setProfile(null)
      return null
    }

    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("id", activeSession.user.id)
      .single()

    const nextProfile = data
      ? ({ ...data, email: activeSession.user.email } as UserProfile)
      : null

    setProfile(nextProfile)
    return nextProfile
  }, [])

  const refreshProfile = React.useCallback(async () => {
    return fetchProfile(sessionRef.current)
  }, [fetchProfile])

  const updateProfile = React.useCallback((updates: Partial<UserProfile>) => {
    setProfile((current) => current ? { ...current, ...updates } : current)
  }, [])

  React.useEffect(() => {
    let isMounted = true
    let profileChannel: ReturnType<typeof supabase.channel> | null = null

    const removeProfileChannel = () => {
      if (profileChannel) {
        supabase.removeChannel(profileChannel)
        profileChannel = null
      }
    }

    const attachProfileChannel = (userId: string) => {
      removeProfileChannel()
      profileChannel = supabase
        .channel(`profile:${userId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "users",
            filter: `id=eq.${userId}`,
          },
          (payload) => {
            setProfile((current) => ({
              ...(current || {}),
              ...(payload.new as UserProfile),
              email: sessionRef.current?.user.email || current?.email || null,
            } as UserProfile))
          }
        )
        .subscribe()
    }

    const applySession = async (nextSession: Session | null) => {
      if (!isMounted) return

      const previousUserId = sessionRef.current?.user.id ?? null
      const nextUserId = nextSession?.user.id ?? null

      sessionRef.current = nextSession
      setSession(nextSession)

      if (!nextSession?.user) {
        removeProfileChannel()
        setProfile(null)
        setLoading(false)
        return
      }

      if (previousUserId !== nextUserId || !profileChannel) {
        attachProfileChannel(nextSession.user.id)
      }

      await fetchProfile(nextSession)
      if (isMounted) setLoading(false)
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      void applySession(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void applySession(nextSession)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
      removeProfileChannel()
    }
  }, [fetchProfile])

  const signOut = React.useCallback(async () => {
    await supabase.auth.signOut()
    sessionRef.current = null
    setSession(null)
    setProfile(null)
  }, [])

  const value = React.useMemo<AuthContextValue>(() => ({
    session,
    profile,
    loading,
    refreshProfile,
    updateProfile,
    signOut,
  }), [session, profile, loading, refreshProfile, updateProfile, signOut])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = React.useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
