// app/auth/callback/route.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    // FIX: Tambahkan 'await' karena di Next.js terbaru cookies() adalah Promise
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            // Kita tidak perlu await di sini karena ini callback internal client
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )

    // TUKAR KODE DENGAN SESI
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Jika berhasil, arahkan kembali ke artikel
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Jika gagal, arahkan ke halaman error atau kembali ke home
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}