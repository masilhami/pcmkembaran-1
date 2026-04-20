// app/auth/callback/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    // TUKAR KODE DENGAN SESI
    await supabase.auth.exchangeCodeForSession(code)
  }

  // Setelah sukses, lempar balik ke halaman asal (atau ke home)
  return NextResponse.redirect(requestUrl.origin)
}