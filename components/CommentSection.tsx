'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'

export default function CommentSection({ slug }: { slug: string }) {
  const [comments, setComments] = useState<any[]>([])
  const [isGuest, setIsGuest] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [replyTo, setReplyTo] = useState<any>(null)
  const [formData, setFormData] = useState({ name: '', email: '', website: '', content: '' })
  const [loading, setLoading] = useState(false)
  const formRef = useRef<HTMLDivElement>(null)

  const fetchComments = useCallback(async () => {
    if (!supabase || !slug) return
    const { data } = await supabase
      .from('comments')
      .select('*')
      .eq('article_slug', slug)
      .eq('is_approved', true)
      .order('created_at', { ascending: true })
    if (data) setComments(data)
  }, [slug])

  useEffect(() => {
    if (!slug || !supabase) return
    fetchComments()

    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      if (data?.user) setUser(data.user)
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setUser(session.user)
        setIsGuest(false)
        if (typeof window !== 'undefined') window.history.replaceState(null, '', window.location.pathname)
      }
      if (event === 'SIGNED_OUT') setUser(null)
    })

    const channel = supabase.channel(`comments-realtime-${slug}`)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'comments', filter: `article_slug=eq.${slug}` }, 
        () => fetchComments()
      ).subscribe()

    return () => {
      subscription.unsubscribe()
      supabase.removeChannel(channel)
    }
  }, [slug, fetchComments])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.content.trim()) return
    
    setLoading(true)

    // Ambil foto profil dari Google jika ada
    const googleAvatar = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null;

    const commentData = {
      article_slug: slug,
      content: formData.content,
      name: user ? (user.user_metadata?.full_name || user.email) : formData.name,
      email: user ? user.email : formData.email,
      avatar_url: googleAvatar, // SIMPAN FOTO PROFIL KE DB
      website_url: formData.website || null,
      user_id: user?.id || null,
      is_guest: !user,
      is_approved: true,
      parent_id: replyTo ? replyTo.id : null
    }

    try {
      const { error } = await supabase.from('comments').insert([commentData])
      if (error) {
        alert("Gagal kirim: " + error.message)
      } else {
        setFormData({ ...formData, content: '' })
        setReplyTo(null)
        fetchComments()
      }
    } catch (err: any) {
      alert("Error: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    if (!supabase) return
    // FIX: Tambahkan #komentar agar tidak scroll ke atas setelah login
    const redirectUrl = window.location.origin + window.location.pathname + '#komentar'
    
    await supabase.auth.signInWithOAuth({ 
      provider: 'google', 
      options: { redirectTo: redirectUrl } 
    })
  }

  const scrollToForm = (comment: any) => {
    setReplyTo(comment)
    if (!user) setIsGuest(true)
    formRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Komponen Helper Avatar
  const Avatar = ({ name, url, size = "md" }: { name: string, url?: string, size?: "sm" | "md" }) => {
    const dim = size === "sm" ? "w-8 h-8 text-xs" : "w-11 h-11 text-lg";
    const rounded = size === "sm" ? "rounded-lg" : "rounded-2xl";

    if (url) {
      return <img src={url} className={`${dim} ${rounded} object-cover shadow-sm`} alt={name} />
    }
    return (
      <div className={`${dim} ${rounded} bg-gradient-to-br from-[#ffc107] to-[#ffd54f] flex items-center justify-center font-black text-[#004a8e] shrink-0 uppercase shadow-sm`}>
        {name ? name.charAt(0) : '?'}
      </div>
    )
  }

  return (
    <section id="komentar" className="mt-16 p-8 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden scroll-mt-20">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-2xl font-black text-[#004a8e]">Diskusi Jamaah ({comments.length})</h3>
        {user && (
          <button onClick={() => supabase.auth.signOut()} className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:underline">Logout</button>
        )}
      </div>

      <div ref={formRef} className="mb-12">
        {!user && !isGuest ? (
          <div className="flex flex-col items-center p-10 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
            <p className="text-slate-500 font-bold mb-5 italic text-sm text-center">Silakan masuk untuk memberikan tanggapan mencerahkan.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <button type="button" onClick={handleGoogleLogin} className="bg-white border-2 border-slate-100 p-3 px-6 rounded-xl shadow-sm font-black text-xs flex items-center gap-3 hover:bg-slate-100 transition-all uppercase">
                <img src="https://www.google.com/favicon.ico" width={16} alt="Google" /> MASUK GOOGLE
              </button>
              <button type="button" onClick={() => setIsGuest(true)} className="p-3 px-6 text-xs font-black text-[#004a8e] bg-[#ffc107] rounded-xl hover:opacity-80 transition-all uppercase tracking-wider">KOMEN TAMU</button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in slide-in-from-top-2">
            {replyTo && (
              <div className="flex justify-between items-center p-3 bg-[#fff8e1] rounded-xl border border-[#ffc107] mb-2">
                <p className="text-xs font-bold text-[#854d0e]">Membalas: <span className="italic">{replyTo.name}</span></p>
                <button type="button" onClick={() => setReplyTo(null)} className="text-[10px] font-black text-red-500 uppercase">Batal</button>
              </div>
            )}
            
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-2xl border border-blue-100 mb-2">
              <Avatar 
                name={user ? (user.user_metadata?.full_name || user.email) : "Tamu"} 
                url={user?.user_metadata?.avatar_url || user?.user_metadata?.picture} 
                size="sm" 
              />
              <p className="text-xs font-black text-[#004a8e]">
                {user ? `Login: ${user.user_metadata?.full_name}` : "Berdiskusi sebagai Tamu"}
              </p>
            </div>

            {!user && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input required placeholder="Nama Anda*" className="p-4 bg-slate-50 rounded-xl border-none ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-[#ffc107] transition-all" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                <input required type="email" placeholder="Email*" className="p-4 bg-slate-50 rounded-xl border-none ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-[#ffc107] transition-all" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
            )}

            <textarea required value={formData.content} placeholder="Tuliskan komentar Anda..." className="w-full p-5 h-32 bg-slate-50 rounded-2xl border-none ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-[#004a8e] transition-all" onChange={e => setFormData({...formData, content: e.target.value})} />
            
            <div className="flex justify-end gap-3 pt-2">
              <button disabled={loading} className="bg-[#004a8e] text-white px-10 py-4 rounded-xl font-black uppercase text-xs hover:bg-[#ffc107] hover:text-[#004a8e] transition-all shadow-lg">
                {loading ? 'Mengirim...' : replyTo ? 'Kirim Balasan ➔' : 'Kirim Komentar ➔'}
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="space-y-8">
        {comments.filter(c => !c.parent_id).map((mainComment) => (
          <div key={mainComment.id} className="comment-block group">
            <div className="flex gap-4 p-5 rounded-3xl hover:bg-slate-50 transition-all border-b border-slate-50">
              <Avatar name={mainComment.name} url={mainComment.avatar_url} />
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-black text-sm text-[#004a8e]">{mainComment.name}</span>
                  <span className="text-[10px] font-bold text-slate-300 italic">
                    {new Date(mainComment.created_at).toLocaleDateString('id-ID')}
                  </span>
                </div>
                <p className="text-slate-600 text-[15px] leading-relaxed mb-3">{mainComment.content}</p>
                <button onClick={() => scrollToForm(mainComment)} className="text-[10px] font-black text-[#004a8e] hover:text-[#ffc107] uppercase tracking-widest px-3 py-1 border border-slate-100 rounded-lg transition-colors">Balas</button>
              </div>
            </div>

            <div className="ml-10 md:ml-16 mt-4 space-y-4">
              {comments.filter(reply => reply.parent_id === mainComment.id).map(reply => (
                <div key={reply.id} className="flex gap-3 p-4 bg-slate-50 rounded-2xl border-l-4 border-[#ffc107] animate-in fade-in slide-in-from-left-2">
                  <Avatar name={reply.name} url={reply.avatar_url} size="sm" />
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-xs text-[#004a8e]">{reply.name}</span>
                      <span className="text-[9px] font-bold text-slate-300">
                        {new Date(reply.created_at).toLocaleDateString('id-ID')}
                      </span>
                    </div>
                    <p className="text-slate-500 text-sm leading-relaxed">{reply.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {comments.length === 0 && (
          <p className="text-center text-slate-400 py-10 italic text-sm">Belum ada diskusi. Mari mulai obrolan!</p>
        )}
      </div>
    </section>
  )
}