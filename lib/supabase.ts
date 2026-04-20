// lib/supabase.ts
import { createBrowserClient } from '@supabase/ssr' // Pakai ini agar sinkron dengan Cookie

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Kita pakai createBrowserClient agar dia otomatis sinkron 
// dengan sesi login (Cookie) yang dibuat di rute /auth/callback
export const supabase = supabaseUrl 
  ? createBrowserClient(supabaseUrl, supabaseAnonKey) 
  : (null as any)