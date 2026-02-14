"use client";

import { useEffect, useState, FormEvent } from 'react';
import { supabase } from '@/lib/supabase';
import { Bookmark, BookmarkInsert } from '@/types/supabase';
import { User } from '@supabase/supabase-js';

export default function SmartBookmarkApp() {
  const [user, setUser] = useState<User | null>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [formData, setFormData] = useState<{ url: string; title: string }>({ 
    url: '', 
    title: '' 
  });

  useEffect(() => {
    // 1. Initial Auth Check & Listener
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) fetchBookmarks();
    };

    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchBookmarks();
    });

    return () => subscription.unsubscribe();
  }, []);

  

  const fetchBookmarks = async () => {
    const { data, error } = await supabase
      .from('bookmarks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) console.error('Error fetching:', error.message);
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

  const newBookmark = {
    url: formData.url,
    title: formData.title,
    user_id: user.id
  };

  const { data, error } = await supabase
    .from('bookmarks')
    .insert([newBookmark])
    .select()
    .single();

  if (error) {
    console.error("Insert Error:", error.message);
  } else {
    // 🔥 Instant UI update (no realtime needed)
    setBookmarks(prev => [data as Bookmark, ...prev]);
    setFormData({ url: '', title: '' });
  }
};

  const deleteBookmark = async (id: string) => {
  const { error } = await supabase
    .from('bookmarks')
    .delete()
    .eq('id', id);

  if (!error) {
    setBookmarks(prev => prev.filter(b => b.id !== id));
  }
};


  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <h1 className="text-4xl font-bold mb-8 text-blue-600">Smart Bookmark App</h1>
        <button 
          onClick={handleSignIn} 
          className="px-6 py-3 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-100 transition-colors flex items-center gap-2 font-medium"
        >
          Sign in with Google
        </button>
      </div>
    );
  }

  return (
    <main className="max-w-2xl mx-auto p-6">
      <header className="flex justify-between items-center mb-10 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold">My Bookmarks</h1>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
        <button 
          onClick={handleSignOut} 
          className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-md hover:bg-red-50"
        >
          Sign Out
        </button>
      </header>

      <section className="mb-10 bg-blue-50 p-6 rounded-xl border border-blue-100">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-blue-700 mb-4">Add New</h2>
        <form onSubmit={addBookmark} className="space-y-3">
          <input 
            type="text" 
            placeholder="Website Title" 
            required 
            className="w-full p-2.5 border rounded-md focus:ring-2 focus:ring-blue-400 outline-none"
            value={formData.title} 
            onChange={e => setFormData({...formData, title: e.target.value})}
          />
          <input 
            type="url" 
            placeholder="URL (https://...)" 
            required 
            className="w-full p-2.5 border rounded-md focus:ring-2 focus:ring-blue-400 outline-none"
            value={formData.url} 
            onChange={e => setFormData({...formData, url: e.target.value})}
          />
          <button 
            type="submit" 
            className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-md hover:bg-blue-700 shadow-sm"
          >
            Save Bookmark
          </button>
        </form>
      </section>

      <ul className="space-y-4">
        {bookmarks.length === 0 && <p className="text-center text-gray-400 py-10">No bookmarks yet.</p>}
        {bookmarks.map(bm => (
          <li key={bm.id} className="group flex justify-between items-center p-4 bg-white border rounded-xl hover:border-blue-300 transition-all shadow-sm">
            <div className="overflow-hidden pr-4">
              <h3 className="font-bold text-gray-800 truncate">{bm.title}</h3>
              <a 
                href={bm.url} 
                target="_blank" 
                rel="noreferrer" 
                className="text-xs text-blue-500 hover:underline truncate block"
              >
                {bm.url}
              </a>
            </div>
            <button 
              onClick={() => deleteBookmark(bm.id)} 
              className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity p-2"
              title="Delete bookmark"
            >
              <TrashIcon />
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}

// Simple Icon Component
function TrashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6M14 11v6" />
    </svg>
  );
}