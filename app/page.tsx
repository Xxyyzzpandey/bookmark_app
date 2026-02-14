"use client";

import { useEffect, useState, FormEvent } from 'react';
import { supabase } from '@/lib/supabase';
import { Bookmark } from '@/types/supabase';
import { User } from '@supabase/supabase-js';

export default function SmartBookmarkApp() {
  const [user, setUser] = useState<User | null>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ url: '', title: '' });

  useEffect(() => {
    // Check initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) fetchBookmarks();
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchBookmarks();
      else setBookmarks([]);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchBookmarks = async () => {
    const { data, error } = await supabase
      .from('bookmarks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) console.error('Fetch error:', error.message);
    else setBookmarks(data as Bookmark[]);
  };

  const handleSignIn = () => supabase.auth.signInWithOAuth({ 
    provider: 'google',
    options: { redirectTo: window.location.origin }
  });

  const handleSignOut = () => supabase.auth.signOut();

  const addBookmark = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Use .select().single() to get the inserted row back for the UI
    const { data, error } = await supabase
      .from('bookmarks')
      .insert([{ 
        url: formData.url, 
        title: formData.title, 
        user_id: user.id 
      }])
      .select()
      .single();

    if (error) {
      alert("Error: " + error.message);
    } else {
      // Instant UI update
      setBookmarks(prev => [data as Bookmark, ...prev]);
      setFormData({ url: '', title: '' });
    }
  };

  const deleteBookmark = async (id: string) => {
    const { error } = await supabase.from('bookmarks').delete().eq('id', id);
    if (!error) {
      setBookmarks(prev => prev.filter(bm => bm.id !== id));
    }
  };

  const getFavicon = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    } catch { return null; }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-blue-600">Loading...</div>;

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md bg-white p-10 rounded-3xl shadow-2xl text-center border border-slate-100">
          <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-200">
            <BookmarkIcon className="text-white w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-2">SmartMark</h1>
          <p className="text-slate-500 mb-8 font-medium">Your personal library, synced in real-time.</p>
          <button 
            onClick={handleSignIn} 
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-slate-100 rounded-2xl font-bold text-slate-700 hover:bg-slate-50 hover:border-blue-200 transition-all active:scale-95"
          >
            <GoogleIcon /> Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50 via-white to-indigo-50 py-12 px-4">
      <main className="max-w-3xl mx-auto">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-center mb-12 gap-4">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
              Smart<span className="text-blue-600">Mark</span>
            </h1>
            <p className="text-slate-500 mt-1 font-medium italic truncate max-w-[250px]">
              Hi, {user.email?.split('@')[0]}
            </p>
          </div>
          <button 
            onClick={handleSignOut} 
            className="px-5 py-2.5 text-sm font-bold text-slate-500 bg-white border border-slate-200 rounded-full hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all shadow-sm"
          >
            Sign Out
          </button>
        </header>

        {/* Add Section */}
        <section className="relative mb-12 group">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>
          <div className="relative bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
            <form onSubmit={addBookmark} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input 
                type="text" placeholder="Title" required 
                className="p-3 bg-slate-50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.title} 
                onChange={e => setFormData({...formData, title: e.target.value})}
              />
              <input 
                type="url" placeholder="URL (https://...)" required 
                className="p-3 bg-slate-50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.url} 
                onChange={e => setFormData({...formData, url: e.target.value})}
              />
              <button 
                type="submit" 
                className="md:col-span-2 bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-blue-600 transition-all shadow-lg"
              >
                Save Bookmark
              </button>
            </form>
          </div>
        </section>

        {/* List */}
        <div className="space-y-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Your Collection</h3>
          {bookmarks.map(bm => (
            <div key={bm.id} className="group flex justify-between items-center p-5 bg-white border border-slate-100 rounded-2xl hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center gap-4 overflow-hidden">
                <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100">
                  <img src={getFavicon(bm.url) || ""} alt="" className="w-6 h-6 object-contain" />
                </div>
                <div className="overflow-hidden">
                  <h3 className="font-bold text-slate-800 truncate group-hover:text-blue-600 transition-colors">{bm.title}</h3>
                  <a href={bm.url} target="_blank" className="text-sm text-slate-400 truncate block">{bm.url}</a>
                </div>
              </div>
              <button onClick={() => deleteBookmark(bm.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                <TrashIcon />
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

// Icons
function TrashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6M14 11v6" /></svg>
  );
}

function BookmarkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
  );
}