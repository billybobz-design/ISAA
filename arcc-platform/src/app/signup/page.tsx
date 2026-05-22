import { AuthForm } from "@/components/auth/auth-form"
import { Suspense } from "react"
import { Loader2 } from "lucide-react"

export default function SignUpPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin text-primary" />}>
        <AuthForm mode="signup" />
      </Suspense>
    </div>
  )
}
