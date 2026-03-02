import { NextResponse } from 'next/server'
import { createClient } from '@/lib/utils/supabase-server'
import { headers } from 'next/headers'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const isAuthCallback = requestUrl.pathname === '/auth/callback'

  if (isAuthCallback) {
    const code = requestUrl.searchParams.get('code')

    if (code) {
      const supabase = await createClient()
      await supabase.auth.exchangeCodeForSession(code)
    }
  }

  // Get the actual origin from headers (fixes Vercel localhost issue)
  const headersList = await headers()
  const host = headersList.get('x-forwarded-host') || headersList.get('host') || requestUrl.host
  const protocol = headersList.get('x-forwarded-proto') || 'https'
  const origin = `${protocol}://${host}`

  return NextResponse.redirect(origin)
}
