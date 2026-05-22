import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Do not add logic between createServerClient and supabase.auth.getUser().
  // A simple mistake could make it very hard to debug issues with users being
  // randomly logged out.

  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  const protectedPaths = ['/profile', '/admin', '/wiki/new', '/forum/new', '/events/new']
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path))

  if (!user && isProtectedPath) {
    const url = new URL('/login', request.url)
    url.searchParams.set('next', pathname)
    const redirectResponse = NextResponse.redirect(url)
    // Copy refreshed auth cookies to redirect response
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value)
    })
    return redirectResponse
  }

  if (user && pathname.startsWith('/admin')) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      const redirectHome = NextResponse.redirect(new URL('/', request.url))
      supabaseResponse.cookies.getAll().forEach((cookie) => {
        redirectHome.cookies.set(cookie.name, cookie.value)
      })
      return redirectHome
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/profile/:path*', '/admin/:path*', '/wiki/new', '/forum/new', '/events/new'],
}
