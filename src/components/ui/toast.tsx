"use client"

import * as React from "react"
import { AlertCircle, CheckCircle2, Info, X, XCircle } from "lucide-react"

import { cn } from "@/lib/utils"

export type ToastVariant = "success" | "error" | "warning" | "info"

export interface ToastOptions {
  title?: string
  description?: string
  variant?: ToastVariant
  duration?: number
}

interface ToastItem extends Required<Pick<ToastOptions, "variant">> {
  id: number
  title?: string
  description?: string
  duration: number
}

interface ToastContextValue {
  toast: (options: ToastOptions | string) => void
  dismiss: (id: number) => void
}

const ToastContext = React.createContext<ToastContextValue | null>(null)

let toastIdCounter = 0

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([])
  const timersRef = React.useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())

  const dismiss = React.useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    const timer = timersRef.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timersRef.current.delete(id)
    }
  }, [])

  const toast = React.useCallback(
    (options: ToastOptions | string) => {
      const normalized: ToastOptions =
        typeof options === "string" ? { description: options } : options

      const id = ++toastIdCounter
      const item: ToastItem = {
        id,
        title: normalized.title,
        description: normalized.description,
        variant: normalized.variant ?? "info",
        duration: normalized.duration ?? 5000,
      }

      setToasts((prev) => [...prev, item])

      if (item.duration > 0) {
        const timer = setTimeout(() => dismiss(id), item.duration)
        timersRef.current.set(id, timer)
      }
    },
    [dismiss]
  )

  React.useEffect(() => {
    const timers = timersRef.current
    return () => {
      timers.forEach((timer) => clearTimeout(timer))
      timers.clear()
    }
  }, [])

  const value = React.useMemo(() => ({ toast, dismiss }), [toast, dismiss])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = React.useContext(ToastContext)
  if (!ctx) {
    throw new Error("useToast must be used inside a ToastProvider")
  }
  return ctx
}

const VARIANT_CONFIG: Record<ToastVariant, { className: string; icon: React.ReactNode }> = {
  success: {
    className: "border-emerald-200 bg-white text-emerald-900",
    icon: <CheckCircle2 className="h-5 w-5 text-emerald-600" />,
  },
  error: {
    className: "border-red-200 bg-white text-red-900",
    icon: <XCircle className="h-5 w-5 text-red-600" />,
  },
  warning: {
    className: "border-amber-200 bg-white text-amber-900",
    icon: <AlertCircle className="h-5 w-5 text-amber-600" />,
  },
  info: {
    className: "border-slate-200 bg-white text-slate-900",
    icon: <Info className="h-5 w-5 text-slate-600" />,
  },
}

function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[]
  onDismiss: (id: number) => void
}) {
  return (
    <div className="pointer-events-none fixed top-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((t) => {
        const config = VARIANT_CONFIG[t.variant]
        return (
          <div
            key={t.id}
            role="status"
            aria-live="polite"
            className={cn(
              "pointer-events-auto flex items-start gap-3 rounded-lg border p-4 shadow-lg shadow-black/5 transition-all animate-in fade-in slide-in-from-top-2",
              config.className
            )}
          >
            <span className="mt-0.5 shrink-0">{config.icon}</span>
            <div className="flex-1 space-y-1 text-sm">
              {t.title ? <p className="font-medium leading-tight">{t.title}</p> : null}
              {t.description ? (
                <p className="text-muted-foreground leading-snug">{t.description}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => onDismiss(t.id)}
              className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
