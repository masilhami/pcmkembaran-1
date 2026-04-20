'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'

export default function CommentSection({ slug }: { slug: string }) {
  const [comments, setComments] = useState<any[]>([])
  const [isGuest, setIsGuest] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [replyTo, setReplyTo] = useState<any>(null) // Untuk melacak komentar yang sedang dibalas
  const [formData, setFormData] = useState({ name: '', email: '', website: '', content: '' })
  const [loading, setLoading] = useState(false)
  const formRef = useRef<HTMLDivElement>(null)

  const fetchComments = useCallback(async () => {
    if (!supabase) return
    const { data } = await supabase
      .from('comments')
      .select('*')
      .eq('article_slug', slug)
      .eq('is_approved', true) // Tetap filter yang disetujui (sekarang otomatis true)
      .order('created_at', { ascending: true }) // Urutkan dari yang terlama agar percakapan nyambung
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

    const channel = supabase.channel(`comments-${slug}`)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'comments', filter: `article_slug=eq.${slug}` }, 
        (payload) => {
          if (payload.new.is_approved) fetchComments() // Refresh list agar urutan tetap rapi
        }
      ).subscribe()

    return () => {
      subscription.unsubscribe()
      supabase.removeChannel(channel)
    }
  }, [slug, fetchComments])

  const handleGoogleLogin = async () => {
    if (!supabase) return
    await supabase.auth.signInWithOAuth({ 
      provider: 'google', 
      options: { redirectTo: window.location.origin + window.location.pathname } 
    })
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
      is_approved: true, // LANGSUNG MUNCUL TANPA MODERASI
      parent_id: replyTo ? replyTo.id : null // Masukkan ID orang yang dibalas
    }

    const { error } = await supabase.from('comments').insert([commentData])
    
    if (!error) {
      setFormData({ ...formData, content: '' })
      setReplyTo(null)
    } else {
      alert('Gagal mengirim komentar.')
    }
    setLoading(false)
  }

  // Fungsi untuk scroll ke form saat klik balas
  const scrollToForm = (comment: any) => {
    setReplyTo(comment)
    setIsGuest(!user) // Jika tidak login, langsung buka form guest
    formRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="mt-16 p-8 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-2xl font-black text-[#004a8e]">Diskusi Jamaah ({comments.length})</h3>
        {user && <button onClick={() => supabase.auth.signOut()} className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:underline">Logout</button>}
      </div>

      <div ref={formRef} className="mb-12">
        {!user && !isGuest ? (
          <div className="flex flex-col items-center p-10 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
            <p className="text-slate-500 font-bold mb-5">Ingin ikut berdiskusi?</p>
            <div className="flex flex-wrap justify-center gap-4">
              <button type="button" onClick={handleGoogleLogin} className="bg-white border-2 border-slate-100 p-3 px-6 rounded-xl shadow-sm font-black text-xs flex items-center gap-3 hover:bg-slate-100 transition-all">
                <img src="https://www.google.com/favicon.ico" width={16} alt="Google" /> MASUK GOOGLE
              </button>
              <button type="button" onClick={() => setIsGuest(true)} className="p-3 px-6 text-xs font-black text-[#004a8e] bg-[#ffc107] rounded-xl hover:opacity-80 transition-all uppercase tracking-wider">KOMEN GUEST</button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {replyTo && (
              <div className="flex justify-between items-center p-3 bg-[#fff8e1] rounded-xl border border-[#ffc107] mb-2 animate-in fade-in slide-in-from-left-2">
                <p className="text-xs font-bold text-[#854d0e]">Membalas: <span className="italic">{replyTo.name}</span></p>
                <button onClick={() => setReplyTo(null)} className="text-[10px] font-black text-red-500 uppercase">Batal</button>
              </div>
            )}
            
            {user && (
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl mb-2">
                <img src={user.user_metadata?.avatar_url || user.user_metadata?.picture} className="w-6 h-6 rounded-full" alt="avatar" />
                <p className="text-xs font-bold text-[#004a8e]">Login: {user.user_metadata?.full_name}</p>
              </div>
            )}

            {!user && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input required placeholder="Nama Anda*" className="p-4 bg-slate-50 rounded-xl border-none ring-1 ring-slate-200 outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                <input required type="email" placeholder="Email*" className="p-4 bg-slate-50 rounded-xl border-none ring-1 ring-slate-200 outline-none" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
            )}

            <textarea required value={formData.content} placeholder="Tuliskan tanggapan Anda..." className="w-full p-5 h-32 bg-slate-50 rounded-2xl border-none ring-1 ring-slate-200 outline-none" onChange={e => setFormData({...formData, content: e.target.value})} />
            
            <div className="flex justify-end gap-3">
              <button disabled={loading} className="bg-[#004a8e] text-white px-10 py-4 rounded-xl font-black uppercase text-xs hover:bg-[#ffc107] hover:text-[#004a8e] transition-all shadow-lg">
                {loading ? 'Mengirim...' : replyTo ? 'Kirim Balasan ➔' : 'Kirim Komentar ➔'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* RENDER KOMENTAR */}
      <div className="space-y-6">
        {comments.filter(c => !c.parent_id).map((mainComment) => (
          <div key={mainComment.id} className="comment-block">
            {/* Komentar Utama */}
            <div className="flex gap-4 p-4 rounded-3xl hover:bg-slate-50 transition-all border-b border-slate-50">
              <div className="w-10 h-10 rounded-xl bg-[#ffc107] flex items-center justify-center font-black text-[#004a8e] shrink-0 uppercase">{mainComment.name.charAt(0)}</div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-black text-sm text-[#004a8e]">{mainComment.name}</span>
                  <span className="text-[10px] text-slate-300 italic">{new Date(mainComment.created_at).toLocaleDateString('id-ID')}</span>
                </div>
                <p className="text-slate-600 text-[15px] mb-3">{mainComment.content}</p>
                <button onClick={() => scrollToForm(mainComment)} className="text-[10px] font-black text-[#004a8e] hover:text-[#ffc107] uppercase tracking-widest">Balas</button>
              </div>
            </div>

            {/* Balasan (Replies) */}
            <div className="ml-14 mt-4 space-y-4">
              {comments.filter(reply => reply.parent_id === mainComment.id).map(reply => (
                <div key={reply.id} className="flex gap-3 p-3 bg-slate-50 rounded-2xl border-l-4 border-[#ffc107]">
                  <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center font-black text-[#004a8e] text-xs shrink-0 uppercase">{reply.name.charAt(0)}</div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-xs text-[#004a8e]">{reply.name}</span>
                      <span className="text-[9px] text-slate-300">{new Date(reply.created_at).toLocaleDateString('id-ID')}</span>
                    </div>
                    <p className="text-slate-500 text-sm">{reply.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}