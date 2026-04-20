import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Buat client hanya jika URL tersedia, agar tidak crash di build time
export const supabase = supabaseUrl ? createClient(supabaseUrl, supabaseAnonKey) : null as any