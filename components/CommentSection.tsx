'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export default function CommentSection({ slug }: { slug: string }) {
  const [comments, setComments] = useState<any[]>([])
  const [isGuest, setIsGuest] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [formData, setFormData] = useState({ name: '', email: '', website: '', content: '' })
  const [loading, setLoading] = useState(false)

  // Fungsi sakti untuk dapet URL redirect yang bener (Prod vs Local)
  const getURL = () => {
    let url =
      process?.env?.NEXT_PUBLIC_SITE_URL ?? // Set ini di Vercel/Env
      window.location.origin; 
    return url;
  };

  const fetchComments = useCallback(async () => {
    if (!supabase) return
    const { data } = await supabase
      .from('comments')
      .select('*')
      .eq('article_slug', slug)
      .eq('is_approved', true)
      .order('created_at', { ascending: false })
    if (data) setComments(data)
  }, [slug])

  const checkUser = async () => {
    if (!supabase) return
    const { data } = await supabase.auth.getUser()
    if (data?.user) setUser(data.user)
  }

  useEffect(() => {
    if (!slug) return
    fetchComments()
    
    if (supabase) {
      checkUser()
      // Realtime subscribe: Komentar baru langsung muncul tanpa refresh
      const channel = supabase.channel(`public:comments:slug=eq.${slug}`)
        .on('postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'comments', filter: `article_slug=eq.${slug}` }, 
          (payload) => {
            if (payload.new.is_approved) {
              setComments(prev => [payload.new, ...prev])
            }
          }
        ).subscribe()

      return () => { supabase.removeChannel(channel) }
    }
  }, [slug, fetchComments])

  const handleGoogleLogin = async () => {
    if (!supabase) return
    await supabase.auth.signInWithOAuth({ 
      provider: 'google', 
      options: { 
        redirectTo: getURL() + window.location.pathname 
      } 
    })
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setIsGuest(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.content.trim()) return
    
    setLoading(true)
    const commentData = {
      article_slug: slug,
      content: formData.content,
      name: user ? (user.user_metadata?.full_name || user.email) : formData.name,
      email: user ? user.email : formData.email,
      website_url: formData.website,
      user_id: user?.id || null,
      is_guest: !user,
      is_approved: true // Set false jika ingin moderasi dulu di dashboard
    }

    const { error } = await supabase.from('comments').insert([commentData])
    
    if (!error) {
      setFormData({ ...formData, content: '' })
      // Jika is_approved: true, maka filter realtime di atas akan otomatis nambahin ke list
      if (commentData.is_approved === false) {
        alert('Terima kasih! Komentar Anda sedang menunggu moderasi admin.')
      }
    } else {
      alert('Gagal mengirim komentar. Silakan coba lagi.')
    }
    setLoading(false)
  }

  return (
    <section className="mt-16 p-8 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-2xl font-black text-[#004a8e]">Diskusi Jamaah ({comments.length})</h3>
        {user && (
          <button onClick={handleLogout} className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:underline">Logout</button>
        )}
      </div>

      {/* FORM INPUT AREA */}
      <form onSubmit={handleSubmit} className="mb-12">
        {!user && !isGuest ? (
          <div className="flex flex-col items-center p-10 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
            <p className="text-slate-500 font-bold mb-5">Ingin ikut berdiskusi?</p>
            <div className="flex flex-wrap justify-center gap-4">
              <button type="button" onClick={handleGoogleLogin} className="bg-white border-2 border-slate-100 p-3 px-6 rounded-xl shadow-sm font-black text-sm flex items-center gap-3 hover:bg-slate-100 transition-all">
                <img src="https://www.google.com/favicon.ico" width={18} alt="Google" /> MASUK DENGAN GOOGLE
              </button>
              <button type="button" onClick={() => setIsGuest(true)} className="p-3 px-6 text-sm font-black text-[#004a8e] bg-[#ffc107] rounded-xl hover:opacity-80 transition-all">KOMEN SEBAGAI TAMU</button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
            {!user && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input required placeholder="Nama Lengkap*" className="p-4 bg-slate-50 rounded-xl border-none ring-2 ring-transparent focus:ring-[#ffc107] transition-all outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                <input required type="email" placeholder="Alamat Email*" className="p-4 bg-slate-50 rounded-xl border-none ring-2 ring-transparent focus:ring-[#ffc107] transition-all outline-none" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                <input placeholder="Website (Opsional)" className="p-4 bg-slate-50 rounded-xl border-none ring-2 ring-transparent focus:ring-[#ffc107] transition-all outline-none" value={formData.website} onChange={e => setFormData({...formData, website: e.target.value})} />
              </div>
            )}
            
            {user && (
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                <img src={user.user_metadata?.avatar_url} className="w-6 h-6 rounded-full" alt="avatar" />
                <p className="text-sm font-bold text-[#004a8e]">Berdiskusi sebagai: {user.user_metadata?.full_name}</p>
              </div>
            )}

            <textarea required value={formData.content} placeholder="Tuliskan pemikiran atau pertanyaan Anda di sini..." className="w-full p-5 h-36 bg-slate-50 rounded-2xl border-none ring-2 ring-transparent focus:ring-[#004a8e] transition-all outline-none" onChange={e => setFormData({...formData, content: e.target.value})} />
            
            <div className="flex justify-end gap-3">
              {isGuest && !user && <button type="button" onClick={() => setIsGuest(false)} className="px-6 py-3 font-bold text-slate-400 text-sm">Batal</button>}
              <button disabled={loading} className="bg-[#004a8e] text-white px-10 py-4 rounded-xl font-black uppercase text-sm tracking-widest hover:bg-[#ffc107] hover:text-[#004a8e] transition-all shadow-lg disabled:opacity-50">
                {loading ? 'Mengirim...' : 'Kirim Komentar ➔'}
              </button>
            </div>
          </div>
        )}
      </form>

      {/* LIST KOMENTAR */}
      <div className="space-y-8">
        {comments.length === 0 ? (
          <p className="text-center text-slate-400 py-10 italic">Belum ada diskusi. Jadilah yang pertama memberikan komentar!</p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="group flex gap-5 p-2 rounded-3xl transition-all">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#ffc107] to-[#ffd54f] flex items-center justify-center font-black text-[#004a8e] text-xl shadow-sm shrink-0 uppercase">
                {c.name ? c.name.charAt(0) : '?'}
              </div>
              <div className="flex-1 border-b border-slate-50 pb-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {c.website_url ? (
                      <a href={c.website_url} target="_blank" rel="nofollow" className="font-black text-sm text-[#004a8e] hover:underline">{c.name}</a>
                    ) : (
                      <span className="font-black text-sm text-[#004a8e]">{c.name}</span>
                    )}
                    {c.is_guest && <span className="text-[9px] bg-slate-100 px-2 py-0.5 rounded-full font-black text-slate-400 tracking-tighter">GUEST</span>}
                  </div>
                  <span className="text-[10px] font-bold text-slate-300 italic">
                    {new Date(c.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <p className="text-slate-600 leading-relaxed text-[15px]">{c.content}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  )
}