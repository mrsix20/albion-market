"use client";

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { supabase } from '@/lib/supabaseClient';
import { Award, Search, User, Trash2, ShieldCheck, ChevronLeft, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const BADGE_TYPES = [
  { id: 'early', name: 'Early Supporter', icon: '/badges/badge_early.png', color: 'text-amber-500' },
  { id: 'whale', name: 'Market Whale', icon: '/badges/badge_whale.png', color: 'text-blue-400' },
  { id: 'top', name: 'Top Trader', icon: '/badges/badge_top.png', color: 'text-rose-500' },
];

export default function MedalManagement() {
  const [targetId, setTargetId] = useState('');
  const [selectedBadge, setSelectedBadge] = useState('early');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [recentBadges, setRecentBadges] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAdmin();
    fetchRecentBadges();
  }, []);

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!['admin', 'owner', 'founder'].includes(profile?.role)) {
      router.push('/profile');
    }
  };

  const fetchRecentBadges = async () => {
    const { data, error } = await supabase
      .from('user_badges')
      .select(`
        id,
        badge_type,
        granted_at,
        user_id,
        profiles!user_id (full_name, email)
      `)
      .order('granted_at', { ascending: false })
      .limit(10);

    if (!error && data) {
      setRecentBadges(data);
    }
  };

  const grantBadge = async () => {
    if (!targetId) {
      setStatus({ type: 'error', message: 'Please enter a Target User ID' });
      return;
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('user_badges')
      .insert({
        user_id: targetId,
        badge_type: selectedBadge,
        granted_by: user?.id
      });

    setLoading(false);

    if (error) {
      setStatus({ type: 'error', message: error.message });
    } else {
      setStatus({ type: 'success', message: 'Medal granted successfully!' });
      setTargetId('');
      fetchRecentBadges();
    }

    setTimeout(() => setStatus({ type: '', message: '' }), 3000);
  };

  const revokeBadge = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this medal?')) return;

    const { error } = await supabase
      .from('user_badges')
      .delete()
      .eq('id', id);

    if (!error) {
      fetchRecentBadges();
      setStatus({ type: 'success', message: 'Medal revoked.' });
      setTimeout(() => setStatus({ type: '', message: '' }), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#06080c] text-white selection:bg-rose-500/30">
      <Header />
      
      <main className="max-w-6xl mx-auto px-6 pt-32 pb-20">
        {/* Back Navigation */}
        <Link href="/admin" className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest mb-8">
          <ChevronLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-black text-white tracking-tight uppercase leading-none mb-4">
            Medal <span className="text-rose-500">Forge</span>
          </h1>
          <p className="text-slate-400 max-w-xl text-sm font-medium">
            Grant prestigious achievements and medals to the most deserving traders and founders.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Granting Interface */}
          <div className="lg:col-span-7 space-y-8">
            <div className="bg-[#0d1117] border border-white/5 p-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 blur-3xl"></div>
              
              <div className="flex items-center gap-4 mb-8">
                <div className="w-1.5 h-8 bg-rose-500 rounded-full shadow-[0_0_15px_rgba(244,63,94,0.5)]"></div>
                <h2 className="text-2xl font-black uppercase tracking-tight">Grant Achievement</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest ml-1">Target User ID (UUID)</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                    <input 
                      type="text" 
                      value={targetId}
                      onChange={(e) => setTargetId(e.target.value)}
                      placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
                      className="w-full bg-black/40 border border-white/10 px-12 py-4 text-sm font-mono focus:border-rose-500/50 outline-none transition-all placeholder:text-slate-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-4 tracking-widest ml-1">Select Medal Type</label>
                  <div className="grid grid-cols-3 gap-4">
                    {BADGE_TYPES.map((badge) => (
                      <div 
                        key={badge.id}
                        onClick={() => setSelectedBadge(badge.id)}
                        className={`cursor-pointer p-4 border transition-all flex flex-col items-center gap-3 text-center
                          ${selectedBadge === badge.id 
                            ? 'bg-rose-500/10 border-rose-500/50 ring-1 ring-rose-500/20' 
                            : 'bg-black/20 border-white/5 hover:border-white/20'}`}
                      >
                        <img src={badge.icon} alt={badge.name} className="w-12 h-12 object-contain" />
                        <span className={`text-[8px] font-black uppercase tracking-tighter ${selectedBadge === badge.id ? badge.color : 'text-slate-500'}`}>
                          {badge.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={grantBadge}
                  disabled={loading}
                  className={`w-full py-5 bg-rose-600 hover:bg-rose-500 text-white font-black uppercase tracking-widest text-xs transition-all shadow-[0_0_20px_rgba(225,29,72,0.3)]
                    ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {loading ? 'Forging Medal...' : 'Grant Medal to User'}
                </button>

                {status.message && (
                  <div className={`p-4 text-[10px] font-black uppercase tracking-widest text-center border animate-in fade-in slide-in-from-top-1
                    ${status.type === 'success' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                    {status.message}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Tips */}
            <div className="bg-white/[0.01] border border-white/5 p-6 flex items-center gap-4">
              <AlertCircle className="w-5 h-5 text-slate-600 shrink-0" />
              <p className="text-[10px] text-slate-500 italic leading-relaxed">
                Tip: You can find user UUIDs in the User Management section. Granting a medal is permanent until manually revoked.
              </p>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-5">
            <div className="bg-[#0d1117] border border-white/5 p-8 relative overflow-hidden h-full">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-1.5 h-6 bg-slate-700 rounded-full"></div>
                <h2 className="text-lg font-black uppercase tracking-tight">Recent Grants</h2>
              </div>

              <div className="space-y-4">
                {recentBadges.length > 0 ? recentBadges.map((badge) => (
                  <div key={badge.id} className="bg-black/20 border border-white/5 p-4 flex items-center justify-between group hover:border-white/10 transition-all">
                    <div className="flex items-center gap-4">
                      <img 
                        src={BADGE_TYPES.find(b => b.id === badge.badge_type)?.icon} 
                        alt="" 
                        className="w-8 h-8 object-contain"
                      />
                      <div>
                        <p className="text-xs font-black text-white">{badge.profiles?.full_name || 'Unknown User'}</p>
                        <p className="text-[9px] text-slate-500 font-mono tracking-tighter opacity-60">ID: {badge.user_id.slice(0, 13)}...</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => revokeBadge(badge.id)}
                      className="p-2 text-slate-700 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )) : (
                   <div className="flex flex-col items-center justify-center py-20 opacity-20">
                     <Award className="w-12 h-12 mb-4" />
                     <p className="text-[10px] font-black uppercase tracking-widest text-center">No recent activity</p>
                   </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
