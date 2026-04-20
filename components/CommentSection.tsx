'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function CommentSection({ slug }: { slug: string }) {
  const [comments, setComments] = useState<any[]>([])
  const [isGuest, setIsGuest] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [formData, setFormData] = useState({ name: '', email: '', website: '', content: '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!slug) return
    fetchComments()
    
    // Proteksi jika Supabase belum siap
    if (supabase) {
      checkUser()
      const channel = supabase.channel(`comments-${slug}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments', filter: `article_slug=eq.${slug}` }, 
        (payload) => setComments(prev => [payload.new, ...prev]))
        .subscribe()
      return () => { supabase.removeChannel(channel) }
    }
  }, [slug])

  async function checkUser() {
    const { data } = await supabase.auth.getUser()
    if (data?.user) setUser(data.user)
  }

  async function fetchComments() {
    const { data } = await supabase
      .from('comments')
      .select('*')
      .eq('article_slug', slug)
      .eq('is_approved', true)
      .order('created_at', { ascending: false })
    if (data) setComments(data)
  }

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({ 
      provider: 'google', 
      options: { redirectTo: typeof window !== 'undefined' ? window.location.href : '' } 
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const commentData = {
      article_slug: slug,
      content: formData.content,
      name: user ? (user.user_metadata?.full_name || user.email) : formData.name,
      email: user ? user.email : formData.email,
      website_url: formData.website,
      user_id: user?.id || null,
      is_guest: !user
    }
    const { error } = await supabase.from('comments').insert([commentData])
    if (!error) {
      setFormData({ ...formData, content: '' })
      alert('Komentar Anda sedang menunggu moderasi.')
    }
    setLoading(false)
  }

  return (
    <section className="mt-16 p-6 bg-white rounded-3xl border border-slate-100 shadow-sm">
      <h3 className="text-2xl font-black text-[#004a8e] mb-8">Diskusi Jamaah ({comments.length})</h3>

      <form onSubmit={handleSubmit} className="mb-12 space-y-4">
        {!user && !isGuest ? (
          <div className="flex flex-col items-center p-8 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
            <button type="button" onClick={handleGoogleLogin} className="bg-white border p-3 rounded-xl shadow-sm font-bold flex items-center gap-2 hover:bg-slate-100 transition-all">
              <img src="https://www.google.com/favicon.ico" width={16} alt="Google" /> Login Google
            </button>
            <button type="button" onClick={() => setIsGuest(true)} className="mt-4 text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-[#004a8e]">Komen Sebagai Tamu</button>
          </div>
        ) : (
          <div className="space-y-4">
            {!user && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input required placeholder="Nama Anda*" className="p-3 bg-slate-50 rounded-xl border-none ring-1 ring-slate-200 outline-none" onChange={e => setFormData({...formData, name: e.target.value})} />
                <input required type="email" placeholder="Email*" className="p-3 bg-slate-50 rounded-xl border-none ring-1 ring-slate-200 outline-none" onChange={e => setFormData({...formData, email: e.target.value})} />
                <input placeholder="Web (Opsional)" className="p-3 bg-slate-50 rounded-xl border-none ring-1 ring-slate-200 outline-none" onChange={e => setFormData({...formData, website: e.target.value})} />
              </div>
            )}
            {user && <p className="text-sm font-bold text-green-600">✓ Siap berkomentar sebagai {user.user_metadata?.full_name}</p>}
            <textarea required value={formData.content} placeholder="Tulis komentar..." className="w-full p-4 h-32 bg-slate-50 rounded-2xl border-none ring-1 ring-slate-200 outline-none" onChange={e => setFormData({...formData, content: e.target.value})} />
            <button disabled={loading} className="bg-[#004a8e] text-white px-8 py-3 rounded-xl font-black uppercase text-sm hover:bg-[#ffc107] hover:text-[#004a8e] transition-all">
              {loading ? 'Mengirim...' : 'Kirim Komentar ➔'}
            </button>
          </div>
        )}
      </form>

      <div className="space-y-6">
        {comments.map((c) => (
          <div key={c.id} className="flex gap-4 p-4 rounded-2xl border-b border-slate-50">
            <div className="w-10 h-10 rounded-full bg-[#ffc107] flex items-center justify-center font-black text-[#004a8e] shrink-0">
              {/* FIX CRASH: Tambahkan pengaman ?. agar tidak error jika name kosong */}
              {c.name ? c.name[0].toUpperCase() : '?'}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-black text-sm text-[#004a8e]">{c.name || 'Hamba Allah'}</span>
                <span className="text-[10px] text-slate-400">{new Date(c.created_at).toLocaleDateString('id-ID')}</span>
              </div>
              <p className="text-slate-600 text-sm">{c.content}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}