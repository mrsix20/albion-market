"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserPlus, Mail, Lock, User, ArrowLeft } from 'lucide-react';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setMessage({ type: 'error', text: 'Supabase is not configured.' });
      return;
    }
    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: displayName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
      setMessage({ type: 'success', text: 'Success! Check your email for the confirmation link. ✨' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#06080c]">
      <div className="w-full max-w-md">
        {/* Logo/Back to Home */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-amber-500 transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-black uppercase tracking-widest">Back to Terminal</span>
          </Link>
        </div>

        <div className="bg-[#0d1117] border border-white/5 rounded-[2rem] p-8 md:p-10 shadow-2xl relative overflow-hidden">
          {/* Top Decorative Line */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent"></div>

          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-500/20">
              <UserPlus className="w-8 h-8 text-amber-500" />
            </div>
            <h1 className="text-3xl font-black text-white mb-2 tracking-tight">Join the Elite</h1>
            <p className="text-slate-500 text-sm font-medium">Start your pro trading journey today</p>
          </div>

          <form onSubmit={handleSignUp} className="space-y-5">
            {/* Display Name */}
            <div className="space-y-2">
              <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">Merchant Name</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-amber-500 transition-colors" />
                <input 
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-12 py-4 text-sm font-bold text-white focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/5 transition-all"
                  placeholder="Your trading identity"
                />
              </div>
            </div>

            {/* Email Address */}
            <div className="space-y-2">
              <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-amber-500 transition-colors" />
                <input 
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-12 py-4 text-sm font-bold text-white focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/5 transition-all"
                  placeholder="merchant@albion.com"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">Access Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-amber-500 transition-colors" />
                <input 
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-12 py-4 text-sm font-bold text-white focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/5 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {message && (
              <div className={`p-4 rounded-xl text-xs font-bold ${
                message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}>
                {message.text}
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 text-slate-900 rounded-xl py-4 font-black text-lg hover:bg-amber-400 shadow-[0_8px_30px_rgba(245,158,11,0.2)] transition-all active:scale-[0.98] disabled:opacity-50 mt-4"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                  INITIALIZING...
                </div>
              ) : (
                'CREATE ACCOUNT'
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-slate-500 text-sm">
              Already a merchant?{' '}
              <Link href="/login" className="text-amber-500 font-black hover:underline underline-offset-4">
                SIGN IN
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
