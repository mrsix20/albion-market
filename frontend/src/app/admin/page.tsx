"use client";

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { supabase } from '@/lib/supabaseClient';
import { Users, ShieldCheck, Database, TrendingUp, ChevronRight, Crown, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    users: 0,
    orders: 0,
    verified: 0,
    admins: 0
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAdmin();
    fetchStats();
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

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [usersRes, ordersRes, profilesRes] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('payments').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('is_admin, is_founder').or('is_admin.eq.true,is_founder.eq.true')
      ]);

      setStats({
        users: usersRes.count || 0,
        orders: ordersRes.count || 0,
        verified: 0, // Will calculate from actual data if column exists
        admins: profilesRes.data?.length || 0
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const adminCards = [
    {
      title: 'User Management',
      desc: 'Edit points, ranks, verification, and roles.',
      icon: Users,
      link: '/admin/users',
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20'
    },
    {
      title: 'Order Management',
      desc: 'Verify payments and manage subscriptions.',
      icon: ShieldCheck,
      link: '/admin/orders',
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20'
    },
    {
      title: 'Medal Management',
      desc: 'Grant or revoke achievements and medals.',
      icon: TrendingUp,
      link: '/admin/medals',
      color: 'text-rose-400',
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/20'
    },
    {
      title: 'Market Settings',
      desc: 'Coming soon: Adjust market formulas.',
      icon: Database,
      link: '#',
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      disabled: true
    }
  ];

  return (
    <div className="min-h-screen bg-[#0a0c10] text-slate-200">
      <Header />
      
      <main className="max-w-6xl mx-auto px-6 pt-32 pb-20">
        {/* Hero Section */}
        <div className="mb-12 space-y-4">
          <div className="flex items-center gap-3">
             <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-[10px] font-black text-amber-500 uppercase tracking-widest">
               Admin Central
             </div>
             <ShieldAlert className="w-4 h-4 text-amber-500 animate-pulse" />
          </div>
          <h1 className="text-5xl font-black text-white tracking-tight leading-none">
            Control <span className="text-amber-500">Center</span>
          </h1>
          <p className="text-slate-400 max-w-xl">
            Welcome to the command hub. From here you can manage every aspect of the Albion Market database.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {[
            { label: 'Total Users', value: stats.users, icon: Users },
            { label: 'Total Orders', value: stats.orders, icon: TrendingUp },
            { label: 'Staff Members', value: stats.admins, icon: Crown },
            { label: 'System Status', value: 'Active', icon: ShieldCheck, color: 'text-emerald-500' }
          ].map((stat, i) => (
            <div key={i} className="glass p-6 rounded-3xl border border-white/5 bg-white/[0.02]">
              <div className="flex items-center justify-between mb-4">
                <stat.icon className={`w-5 h-5 ${stat.color || 'text-slate-500'}`} />
              </div>
              <div className="text-2xl font-black text-white">{stat.value}</div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Action Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {adminCards.map((card, i) => (
            <Link 
              key={i} 
              href={card.link}
              className={`glass p-8 rounded-[2.5rem] border ${card.border} transition-all duration-500 group relative overflow-hidden
                ${card.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] hover:bg-white/[0.03]'}`}
            >
              {/* Background Glow */}
              <div className={`absolute -top-10 -right-10 w-32 h-32 ${card.bg} rounded-full blur-3xl opacity-50 transition-all group-hover:scale-150`}></div>
              
              <div className="relative z-10 space-y-6">
                <div className={`w-14 h-14 ${card.bg} rounded-2xl flex items-center justify-center border ${card.border}`}>
                  <card.icon className={`w-7 h-7 ${card.color}`} />
                </div>
                
                <div>
                  <h3 className="text-xl font-black text-white mb-2">{card.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{card.desc}</p>
                </div>

                {!card.disabled && (
                  <div className="flex items-center gap-2 text-[10px] font-black text-amber-500 uppercase tracking-widest pt-2">
                    Open Management <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
