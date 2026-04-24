"use client";

import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { User as UserIcon, ChevronDown, TrendingUp, Hammer, Sprout, Ship, Zap, Clock, ShieldCheck, ArrowRight, Crown, MessageSquare } from 'lucide-react';

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isMarketOpen, setIsMarketOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const fetchProfile = async (user: User) => {
    if (!supabase || isLoadingProfile) return;
    setIsLoadingProfile(true);
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, role, subscription_end, avatar_url')
        .eq('id', user.id)
        .single();
      
      if (!error && data) {
        if (data.full_name) setProfileName(data.full_name);
        if (data.role) setUserRole(data.role);
        if (data.avatar_url) setAvatarUrl(data.avatar_url);
        
        // Expiration check
        const isExpired = data.subscription_end && new Date() > new Date(data.subscription_end);
        const hasProRole = ['pro', 'elite', 'owner', 'founder', 'admin'].includes(data.role);
        const hasActivePro = data.role === 'pro' ? (hasProRole && !isExpired) : hasProRole;
        
        // We'll store this in a local variable for the render check
        (window as any).is_pro_active = hasActivePro;
      } else {
        const metaName = user.user_metadata?.full_name;
        if (metaName) {
          setProfileName(metaName);
        }
      }
    } catch (err) {
      console.error("Profile fetch error:", err);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  useEffect(() => {
    if (!supabase) return;

    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser && !profileName) fetchProfile(currentUser);
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) fetchProfile(currentUser);
      else {
        setProfileName(null);
      }
    });

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsMarketOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      subscription.unsubscribe();
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleAuthAction = async () => {
    if (!supabase) {
      alert("Please configure Supabase environment variables in .env.local to use Authentication.");
      return;
    }
    
    if (user) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error("Sign out error:", err);
      }
      setUser(null);
      setProfileName(null);
      router.push('/');
    } else {
      router.push('/login');
    }
  };

  const marketTools = [
    { title: "Price Checker", desc: "Check real-time item prices", icon: Zap, href: "/price-checker", status: "Live", color: "text-sky-400", isLive: true },
    { title: "Trade Routes", desc: "Most profitable city-to-city paths", icon: Ship, href: "/trade-routes", status: "Live", color: "text-emerald-400", isLive: true },
    { title: "Black Market Flipper", desc: "Real-time arbitrage opportunities", icon: TrendingUp, href: "/black-market", status: "Live", color: "text-amber-500", isLive: true },
    { 
      title: "Crafting Calculator", 
      desc: "Optimize focus & material costs",
      icon: Hammer, 
      href: "#", 
      status: "Coming Soon", 
      color: "text-blue-400", 
      isLive: false 
    },
    { 
      title: "Refining Analysis", 
      desc: "Market-wide resource ROI",
      icon: Sprout, 
      href: "#", 
      status: "Coming Soon", 
      color: "text-emerald-400", 
      isLive: false 
    },
    { 
      title: "Transport Profits", 
      desc: "Inter-city trade route analysis",
      icon: Ship, 
      href: "#", 
      status: "Coming Soon", 
      color: "text-purple-400", 
      isLive: false 
    },
  ];

  return (
    <>
      {/* Background Overlay when menu is open */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] transition-opacity duration-300 ${isMarketOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} 
        onClick={() => setIsMarketOpen(false)}
      />

      <header className="sticky top-0 z-[9999] bg-[#06080c]/90 backdrop-blur-xl border-b border-white/5 shadow-2xl">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group cursor-pointer">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center font-bold text-slate-900 group-hover:bg-amber-400 transition-colors">
              A
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              Albion<span className="text-amber-500">Market</span>
            </span>
          </Link>
          
          <nav className="flex items-center gap-8">
            <Link href="/" className="text-sm font-bold text-slate-400 hover:text-white transition-colors">Home</Link>
            <Link href="/tutorial" className="text-sm font-bold text-slate-400 hover:text-white transition-colors">How it Works</Link>
            
            {/* Market Dropdown Container */}
            <div className="relative h-20 flex items-center" ref={dropdownRef}>
              <button 
                onMouseEnter={() => setIsMarketOpen(true)}
                onClick={() => setIsMarketOpen(!isMarketOpen)}
                className={`flex items-center gap-1 text-sm font-bold transition-colors ${isMarketOpen ? 'text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Market Tools
                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isMarketOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Premium Mega Menu */}
              {isMarketOpen && (
                <div 
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-0 w-[600px] bg-slate-900/95 backdrop-blur-2xl rounded-b-3xl border-x border-b border-white/10 shadow-[0_40px_80px_rgba(0,0,0,0.8)] overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-top-4 duration-300 z-[99999]"
                  onMouseLeave={() => setIsMarketOpen(false)}
                >
                  <div className="flex">
                    {/* Left Side: Main Tools Grid */}
                    <div className="flex-grow p-6">
                      <div className="px-2 mb-6 flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Economic Tools Suite</span>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-amber-500/60 uppercase">
                          <ShieldCheck className="w-3 h-3" /> AODP Verified
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        {marketTools.map((tool, idx) => (
                          <Link
                            key={idx}
                            href={tool.href}
                            onClick={() => tool.isLive ? setIsMarketOpen(false) : null}
                            className={`
                              relative flex flex-col gap-3 p-4 rounded-2xl transition-all border
                              ${tool.isLive 
                                ? 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-amber-500/30 group cursor-pointer' 
                                : 'bg-black/20 border-white/[0.02] opacity-60 cursor-not-allowed'
                              }
                            `}
                          >
                            <div className="flex justify-between items-start">
                              <div className={`p-2.5 rounded-xl bg-slate-950/50 border border-white/10 ${tool.color}`}>
                                <tool.icon className="w-5 h-5" />
                              </div>
                              {tool.isLive ? (
                                <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-500 text-slate-950 rounded-full scale-75 origin-right">
                                  <Zap className="w-2.5 h-2.5 fill-current" />
                                  <span className="text-[8px] font-black uppercase">Live</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 px-2 py-0.5 bg-slate-800 text-slate-500 rounded-full scale-75 origin-right">
                                  <Clock className="w-2.5 h-2.5" />
                                  <span className="text-[8px] font-black uppercase">Soon</span>
                                </div>
                              )}
                            </div>
                            
                            <div>
                              <h4 className="text-sm font-black text-white group-hover:text-amber-500 transition-colors">{tool.title}</h4>
                              <p className="text-[10px] text-slate-500 leading-tight mt-1">{tool.desc}</p>
                            </div>

                            {tool.isLive && (
                              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <ArrowRight className="w-3.5 h-3.5 text-amber-500" />
                              </div>
                            )}
                          </Link>
                        ))}
                      </div>
                    </div>

                    {/* Right Sidebar: Promo/Info */}
                    <div className="w-48 bg-amber-500/5 border-l border-white/5 p-6 flex flex-col justify-between">
                      <div>
                        <h5 className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-4">Elite Membership</h5>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          Unlock real-time data for high-tier artifacts and special mounts.
                        </p>
                      </div>
                      
                      <Link 
                        href="/pricing" 
                        onClick={() => setIsMarketOpen(false)}
                        className="group flex flex-col gap-2 p-3 bg-amber-500 rounded-xl transition-all hover:bg-amber-400 shadow-[0_10px_20px_rgba(245,158,11,0.2)]"
                      >
                        <span className="text-[10px] font-black text-slate-950 uppercase text-center">Go Premium</span>
                        <div className="flex justify-center items-center gap-1">
                          <span className="text-[9px] font-bold text-slate-900/60 uppercase">Start Now</span>
                          <ArrowRight className="w-3 h-3 text-slate-950 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Link href="/pricing" className="text-sm font-bold text-slate-400 hover:text-white transition-colors">Pricing</Link>
          </nav>
          
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end hidden lg:flex">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Welcome back</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-white">{profileName || user.email?.split('@')[0]}</span>
                    {userRole === 'owner' ? (
                      <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-amber-500/10 border border-amber-500/50 text-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.2)] flex items-center gap-1">
                        <Crown className="w-2.5 h-2.5 fill-amber-500" />
                        OWNER
                      </span>
                    ) : userRole && userRole !== 'free' && (window as any).is_pro_active && (
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border transition-all shadow-[0_0_10px_rgba(245,158,11,0.1)] ${
                        userRole === 'founder' 
                          ? 'bg-amber-500/10 border-amber-500/50 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]' 
                          : 'bg-blue-500/10 border-blue-500/50 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                      }`}>
                        {userRole}
                      </span>
                    )}
                  </div>
                </div>
                
                <Link 
                  href="/profile" 
                  className="w-10 h-10 rounded-2xl bg-slate-800 border border-white/5 flex items-center justify-center hover:border-blue-500/50 hover:bg-slate-700 transition-all overflow-hidden"
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-5 h-5 text-slate-400" />
                  )}
                </Link>

                <button 
                  onClick={handleAuthAction}
                  className="px-4 py-2.5 border border-rose-500/50 text-rose-400 rounded-xl font-bold text-sm hover:bg-rose-500/10 transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <>
                <Link 
                  href="https://discord.gg/sh4aCcFSGP" 
                  target="_blank"
                  className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all shadow-[0_0_15px_rgba(99,102,241,0)] hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] group"
                >
                  <MessageSquare className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </Link>

                <button 
                  onClick={handleAuthAction}
                  className="px-6 py-2 bg-amber-500 text-slate-900 rounded-lg font-semibold text-sm hover:bg-amber-400 shadow-[0_4px_15px_rgba(245,158,11,0.3)] transition-all active:scale-95"
                >
                  Sign In
                </button>
              </>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
