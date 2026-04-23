"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { User } from '@supabase/supabase-js';
import Header from '@/components/Header';
import { Shield, Award, ArrowLeft, User as UserIcon, LogOut, CheckCircle2, ChevronRight, Clock, Zap, TrendingUp, Star, X, Camera, Upload, ShieldCheck, Coins, Trophy, Crown, Flame, Trash2, Settings, Sparkles, Check } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [points, setPoints] = useState(0);
  const [rank, setRank] = useState('Beginner');
  const [rankProgress, setRankProgress] = useState(0);
  const [isFounder, setIsFounder] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [userRole, setUserRole] = useState('free');
  const [isVerified, setIsVerified] = useState(false);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [userBadges, setUserBadges] = useState<any[]>([]);

  // Pre-defined Albion Avatars
  const DEFAULT_AVATARS = [
    { id: 'knight', url: 'https://render.albiononline.com/v1/spell/KNIGHT_ARMOR_ACTIVE.png' },
    { id: 'mage', url: 'https://render.albiononline.com/v1/spell/MAGE_ARMOR_ACTIVE.png' },
    { id: 'hunter', url: 'https://render.albiononline.com/v1/spell/HUNTER_ARMOR_ACTIVE.png' },
    { id: 'warrior', url: 'https://render.albiononline.com/v1/spell/WARRIOR_ARMOR_ACTIVE.png' },
    { id: 'royal', url: 'https://render.albiononline.com/v1/spell/ROYAL_ARMOR_ACTIVE.png' },
    { id: 'gathering', url: 'https://render.albiononline.com/v1/spell/GATHERING_ARMOR_ACTIVE.png' },
  ];

  // Configuration for Ranks and Frames
  const RANK_CONFIG: Record<string, any> = {
    'Beginner': { label: 'Beginner', color: 'text-slate-400', frame: '/frames/avatars/beginner.png', cardFrame: '/frames/cards/beginner.png' },
    'Novice': { label: 'Novice', color: 'text-emerald-400', frame: '/frames/avatars/novice.png', cardFrame: '/frames/cards/novice.png' },
    'Apprentice': { label: 'Apprentice', color: 'text-blue-400', frame: '/frames/avatars/apprentice.png', cardFrame: '/frames/cards/apprentice.png' },
    'Journeyman': { label: 'Journeyman', color: 'text-amber-400', frame: '/frames/avatars/journeyman.png', cardFrame: '/frames/cards/journeyman.png' },
    'Merchant': { label: 'Merchant', color: 'text-rose-400', frame: '/frames/avatars/merchant.png', cardFrame: '/frames/cards/merchant.png' },
    'Expert Trader': { label: 'Expert Trader', color: 'text-purple-400', frame: '/frames/avatars/expert.png', cardFrame: '/frames/cards/expert.png' },
    'Master Trader': { label: 'Master Trader', color: 'text-yellow-400', frame: '/frames/avatars/master.png', cardFrame: '/frames/cards/master.png' },
    'Market Mastermind': { label: 'Market Mastermind', color: 'text-cyan-400', frame: '/frames/avatars/tycoon.png', cardFrame: '/frames/cards/tycoon.png' },
    'Legendary': { 
      label: 'Legendary', 
      color: 'animate-rainbow', 
      frame: '/frames/avatars/legendary.png', 
      cardFrame: '/frames/cards/legendary.png' 
    }
  };

  // Add custom style for rainbow animation
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes rainbow {
        0% { background-position: 0% center; }
        100% { background-position: 200% center; }
      }
      .animate-rainbow {
        background: linear-gradient(
          to right, 
          #ff0000, #ff7f00, #ffff00, #00ff00, #00ffff, #0000ff, #8b00ff, #ff0000
        ) !important;
        background-size: 200% auto !important;
        -webkit-background-clip: text !important;
        background-clip: text !important;
        -webkit-text-fill-color: transparent !important;
        color: transparent !important;
        animation: rainbow 8s linear infinite !important;
        display: inline-block !important;
      }
      @keyframes spin-slow {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      .animate-spin-slow {
        animation: spin-slow 12s linear infinite;
      }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  const currentRankConfig = RANK_CONFIG[rank] || RANK_CONFIG['Beginner'];

  const fetchUserBadges = async (userId: string) => {
    const { data, error } = await supabase
      .from('user_badges')
      .select('*')
      .eq('user_id', userId);
    
    if (!error && data) {
      setUserBadges(data);
    }
  };

  const hasBadge = (badgeType: string) => userBadges.some(b => b.badge_type === badgeType);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        
        // Fetch from profiles table
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          console.log("Fetched Profile Data:", profile); // DEBUG LOG
          setProfileName(profile.full_name);
          setAvatarUrl(profile.avatar_url);
          setPoints(profile.points || 0);
          setRank(profile.rank || 'Beginner');
          console.log("Setting Rank to:", profile.rank); // Final verification
          setUserRole(profile.role || 'free');
          setSubscriptionEnd(profile.subscription_end);
          
          // Improved Pro Access Check: Role must be Pro/Elite AND not expired if it's a timed subscription
          const isExpired = profile.subscription_end && new Date() > new Date(profile.subscription_end);
          const hasProRole = ['pro', 'elite', 'owner', 'founder', 'admin'].includes(profile.role);
          
          // Only 'pro' role is subject to expiration; owner/founder/admin are lifetime
          const hasActivePro = profile.role === 'pro' ? (hasProRole && !isExpired) : hasProRole;
          
          setIsPro(hasActivePro);
          setIsFounder(profile.role === 'founder' || profile.role === 'owner');
          setIsAdmin(profile.role === 'admin' || profile.role === 'owner');
          setIsVerified(profile.is_verified || false);
          
          // Simple XP calculation for demo
          const progress = (profile.points % 1000) / 10; 
          setRankProgress(Math.floor(progress) || 0);

          // Fetch real badges from DB
          fetchUserBadges(profile.id);
        } else {
          // Fallback to metadata for new users
          setProfileName(session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Trader');
        }
      }
      setLoading(false);
    };

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#06080c] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) return null;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'No Date Set';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const getMembershipLabel = () => {
    if (userRole === 'owner') return 'PLATFORM OWNER';
    if (userRole === 'founder') return 'LEGACY FOUNDER';
    if (userRole === 'admin') return 'ADMINISTRATOR';
    if (userRole === 'pro' && !isPro) return 'STANDARD MEMBER'; // Show standard if expired
    if (userRole === 'pro') return 'PRO MEMBER';
    if (userRole === 'elite') return 'ELITE MEMBER';
    return 'STANDARD MEMBER';
  };

  const getPlanName = () => {
    if (['owner', 'founder', 'elite'].includes(userRole)) return 'Elite Lifetime';
    if (userRole === 'pro' && isPro) return 'Pro Access';
    return 'Free Access'; // Default if expired or free
  };

  return (
    <div className="min-h-screen bg-[#06080c] text-white selection:bg-amber-500/30">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
          
          {/* LEFT: Character Sheet */}
          <div className="lg:col-span-4">
            <div className="relative group">
              {/* Outer Glow Removed */}
              <div className="absolute -inset-4 bg-transparent rounded-[3rem] transition-all duration-700"></div>
              
              {/* Character Card - Sharp Edges */}
              <div className="relative bg-[#0d1117] border border-white/5 rounded-none p-8 text-center shadow-2xl overflow-hidden min-h-[600px] flex flex-col justify-center">
                {/* Dynamic Card Frame Overlay - Sharp */}
                <div className="absolute inset-0 z-50 pointer-events-none">
                  <img 
                    src={currentRankConfig.cardFrame} 
                    alt="Card Frame" 
                    className="w-full h-full object-fill opacity-90"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />
                </div>

                {/* Clean Background */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none"></div>

                {/* Avatar Section */}
                <div className="relative w-56 h-56 mx-auto mb-4 group/avatar">
                  {/* Dynamic Frame Image - Higher Z and Static */}
                  <div 
                    className="absolute inset-0 z-20 pointer-events-none scale-110 transition-all duration-700"
                  >
                    <img 
                      src={currentRankConfig.frame} 
                      alt={`${rank} Frame`} 
                      className="w-full h-full object-contain"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                  </div>
                  
                  {/* User Avatar - Behind Frame */}
                  <div 
                    onClick={() => document.getElementById('avatarInput')?.click()}
                    className="absolute inset-[18.5%] bg-slate-950 rounded-none flex items-center justify-center overflow-hidden border-[3px] border-[#1e293b] shadow-2xl z-10 cursor-pointer group/ava-box"
                  >
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover/ava-box:scale-105" />
                    ) : (
                      <UserIcon className="w-20 h-20 text-slate-800" />
                    )}
                    
                    {/* Hover Overlay - Smoother */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/ava-box:opacity-100 transition-all duration-500 flex flex-col items-center justify-center backdrop-blur-[1px]">
                      <Camera className="w-6 h-6 text-white/70 mb-1" />
                      <span className="text-[6px] font-black uppercase tracking-widest text-white/50">Change</span>
                    </div>
                  </div>

                  {/* Dynamic Rank Plate Removed for cleaner look */}
                </div>

                {/* Info & Badges Section - Moved Up */}
                <div className="space-y-1 mb-5 -mt-4">
                  <h2 className="text-2xl font-black tracking-tighter text-white flex items-center justify-center gap-2">
                    {profileName}
                    {isVerified && (
                      <div className="relative flex items-center justify-center w-5 h-5 shrink-0">
                        {/* The Original Blue Wavy Burst (Rotating) */}
                        <div className="absolute inset-0 animate-spin-slow" style={{ animationDuration: '20s' }}>
                          <svg viewBox="0 0 24 24" fill="none" className="w-full h-full drop-shadow-[0_0_8px_rgba(41,178,254,0.4)]">
                            <path fill="#29B2FE" d="m12 0 2.33 3.307 3.67-1.7.364 4.029L22.392 6l-1.699 3.67L24 12l-3.307 2.33 1.7 3.67-4.029.364L18 22.392l-3.67-1.699L12 24l-2.33-3.307-3.67 1.7-.364-4.029L1.608 18l1.699-3.67L0 12l3.307-2.33L1.607 6l4.029-.364L6 1.608l3.67 1.699L12 0Z"/>
                          </svg>
                        </div>
                        {/* The Original White Checkmark (Static) */}
                        <div className="relative z-10 flex items-center justify-center">
                          <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5">
                            <path stroke="#fff" strokeMiterlimit="10" strokeWidth="2.5" d="m7 12.243 3.28 3.237L16.84 9" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      </div>
                    )}
                    {isAdmin && (
                      <div className="relative flex items-center justify-center shrink-0 -ml-3 translate-y-[-0.5px]">
                        {/* Focused Subtle Glow */}
                        <div className="absolute w-6 h-6 bg-amber-400/10 blur-lg rounded-full animate-pulse"></div>
                        
                        {/* The Cropped Crown Container */}
                        <div className="relative flex items-center justify-center w-[50px] h-[28px] overflow-hidden">
                          <img 
                            src="/images/owner_crown.png" 
                            alt="Owner Crown" 
                            className="relative z-10 w-full h-full object-contain -mt-[3px] scale-[1.15]" 
                          />
                        </div>
                      </div>
                    )}
                  </h2>
                  
                  <div className="flex flex-col items-center gap-1">
                    <p 
                      className={`text-[10px] font-black uppercase tracking-[0.25em] ${rank === 'Legendary' ? '' : currentRankConfig.color} drop-shadow-sm`}
                      style={rank === 'Legendary' ? {
                        backgroundImage: 'linear-gradient(to right, #ff0000, #ff7f00, #ffd700, #ff7f00, #ff0000)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundSize: '200% auto',
                        animation: 'rainbow 5s linear infinite',
                      } : {}}
                    >
                      {currentRankConfig.label}
                    </p>
                    {userRole === 'owner' ? (
                      <div className="flex flex-col items-center gap-3">
                        <div className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600 border border-amber-300 rounded-full shadow-[0_0_25px_rgba(245,158,11,0.4)] animate-pulse">
                          <Crown className="w-3.5 h-3.5 text-slate-950 fill-slate-950" />
                          <span className="text-[10px] font-black text-slate-950 uppercase tracking-[0.2em]">
                            PLATFORM OWNER
                          </span>
                        </div>
                        {/* LEGACY FOUNDER - Unique Red Badge */}
                        <div className="flex items-center gap-2 px-3 py-1 bg-rose-500/10 border border-rose-500/50 rounded-full shadow-[0_0_20px_rgba(244,63,94,0.3)] animate-pulse">
                          <Flame className="w-2.5 h-2.5 text-rose-500 fill-rose-500/40" />
                          <span className="text-[8px] font-black text-rose-500 uppercase tracking-[0.4em] drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]">
                            LEGACY FOUNDER
                          </span>
                        </div>
                      </div>
                    ) : isPro ? (
                      <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/5 border border-amber-500/30 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.1)] transition-all hover:bg-amber-500/10 hover:border-amber-500/50">
                        <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500/40 animate-pulse" />
                        <span className="text-[8px] font-black text-amber-500 uppercase tracking-[0.3em] drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]">
                          {getMembershipLabel()}
                        </span>
                      </div>
                    ) : (
                      <p className="text-slate-500 text-[7px] font-bold uppercase tracking-[0.2em] italic opacity-50">Standard Merchant</p>
                    )}
                  </div>
                </div>

                {/* NEW: Medals Row (PNG Based) - Dynamic */}
                <div className="flex justify-center items-start gap-4 mb-8 min-h-[60px]">
                  {hasBadge('early') && (
                    <div className="flex flex-col items-center gap-1.5 w-16 group cursor-help">
                      <img src="/badges/badge_early.png" alt="Early Supporter" className="w-10 h-10 object-contain drop-shadow-[0_0_8px_rgba(245,158,11,0.3)] transition-transform group-hover:scale-110" />
                      <p className="text-[7px] font-black text-slate-500 uppercase tracking-tighter text-center leading-tight transition-colors group-hover:text-amber-500">Early Supporter</p>
                    </div>
                  )}
                  {hasBadge('whale') && (
                    <div className="flex flex-col items-center gap-1.5 w-16 group cursor-help">
                      <img src="/badges/badge_whale.png" alt="Market Whale" className="w-10 h-10 object-contain drop-shadow-[0_0_8px_rgba(59,130,246,0.3)] transition-transform group-hover:scale-110" />
                      <p className="text-[7px] font-black text-slate-500 uppercase tracking-tighter text-center leading-tight transition-colors group-hover:text-blue-400">Market Whale</p>
                    </div>
                  )}
                  {hasBadge('top') && (
                    <div className="flex flex-col items-center gap-1.5 w-16 group cursor-help">
                      <img src="/badges/badge_top.png" alt="Top Trader" className="w-10 h-10 object-contain drop-shadow-[0_0_8px_rgba(239,68,68,0.3)] transition-transform group-hover:scale-110" />
                      <p className="text-[7px] font-black text-slate-500 uppercase tracking-tighter text-center leading-tight transition-colors group-hover:text-rose-500">Top Trader</p>
                    </div>
                  )}
                  {userBadges.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-2 opacity-30">
                      <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500">No Medals Earned</p>
                    </div>
                  )}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                  {/* Points Box */}
                  <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] h-32 flex flex-col items-center justify-center text-center transition-all hover:bg-white/[0.04]">
                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.4em] mb-2 opacity-50">Points</p>
                    <div className="flex flex-col items-center">
                      <p className="text-2xl font-black text-white tracking-tighter leading-none">{points.toLocaleString()}</p>
                      <p className="text-[8px] font-bold text-slate-600 uppercase mt-1">Total XP</p>
                    </div>
                  </div>

                  {/* Rank Box */}
                  <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] h-32 flex flex-col items-center justify-center text-center transition-all hover:bg-white/[0.04]">
                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.4em] mb-2 opacity-50">Rank</p>
                    <div className="flex items-center justify-center min-h-[40px] px-2">
                      <p 
                        className={`font-black tracking-tight uppercase leading-[1.1] ${rank === 'Legendary' ? '' : currentRankConfig.color} drop-shadow-md ${rank === 'Legendary' ? 'text-lg' : 'text-lg'}`}
                        style={rank === 'Legendary' ? {
                          backgroundImage: 'linear-gradient(to right, #ff0000, #ff7f00, #ffd700, #ff7f00, #ff0000)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundSize: '200% auto',
                          animation: 'rainbow 5s linear infinite',
                        } : {}}
                      >
                        {rank}
                      </p>
                    </div>
                  </div>
                </div>

                {/* XP Bar */}
                <div className="space-y-3 text-left">
                  <div className="flex justify-between items-end px-1">
                    <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest">Rank Progress</p>
                    <p className="text-[10px] font-black text-amber-500">{rankProgress}%</p>
                  </div>
                  <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-white/5 p-[1px]">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-600 to-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.5)] transition-all duration-1000 rounded-full"
                      style={{ width: `${rankProgress}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Action Buttons Below Card */}
              <div className="mt-6 grid grid-cols-2 gap-4">
                <input 
                  type="file" 
                  id="avatarInput" 
                  className="hidden" 
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file && user) {
                      const reader = new FileReader();
                      reader.onload = async (event) => {
                        const newUrl = event.target?.result as string;
                        
                        // 1. Update local UI state
                        setAvatarUrl(newUrl);
                        
                        // 2. Save to database permanently
                        const { error } = await supabase
                          .from('profiles')
                          .update({ avatar_url: newUrl })
                          .eq('id', user.id);

                        if (error) {
                          console.error('Error saving avatar:', error);
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                <button 
                  onClick={() => document.getElementById('avatarInput')?.click()}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 py-3 rounded-none font-bold text-xs transition-all flex items-center justify-center gap-2"
                >
                  Edit Avatar
                </button>
                <button className="bg-white/5 hover:bg-white/10 border border-white/10 py-3 rounded-none font-bold text-xs transition-all flex items-center justify-center gap-2">
                  View Badges
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT: Detailed Info & Settings */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Membership Card - Sharp Edges */}
            <div className="bg-[#0d1117] border border-white/5 rounded-none p-8 md:p-10 relative overflow-hidden">
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                  <div className="w-1.5 h-8 bg-amber-500 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.5)]"></div>
                  <h2 className="text-2xl font-black tracking-tight uppercase">Membership Status</h2>
                </div>
                <div className={`px-5 py-2 rounded-none text-[10px] font-black uppercase tracking-widest border transition-all ${
                  isPro ? 'bg-amber-500/5 border-amber-500/20 text-amber-500' : 'bg-slate-900 border-white/5 text-slate-500'
                }`}>
                  {getMembershipLabel()}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                {/* Card 1: Membership Pass - Sharp */}
                <div className="bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20 rounded-none p-8 relative group hover:bg-amber-500/[0.08] transition-all">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <p className="text-[10px] text-amber-500/60 font-black uppercase tracking-[0.2em] mb-1">Membership Pass</p>
                      <h3 className="text-3xl font-black text-white">{getPlanName()}</h3>
                    </div>
                    <div className="w-12 h-12 bg-amber-500/20 rounded-none flex items-center justify-center border border-amber-500/30">
                      <Award className="w-6 h-6 text-amber-500" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-xs font-bold text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      {isPro ? 'Unlimited Market Analytics' : 'Basic Price Checking'}
                    </div>
                    <div className="flex items-center gap-3 text-xs font-bold text-slate-300">
                      <Clock className="w-4 h-4 text-amber-500" />
                      Status: <span className={isPro ? 'text-emerald-400' : 'text-rose-400'}>
                        {isFounder ? 'Lifetime Access' : (isPro ? `Expires ${formatDate(subscriptionEnd)}` : 'Expired')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card 2: Economic Dominance - Sharp */}
                <div className="bg-white/[0.02] border border-white/5 rounded-none p-8 relative group hover:bg-white/[0.04] transition-all overflow-hidden">
                  {/* Decorative Gradient */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                  
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <p className="text-[10px] text-blue-500/60 font-black uppercase tracking-[0.2em] mb-1">Economic Dominance</p>
                      <h3 
                        className="text-3xl font-black text-white"
                        style={rank === 'Legendary' ? {
                          backgroundImage: 'linear-gradient(to right, #ff0000, #ff7f00, #ffd700, #ff7f00, #ff0000)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundSize: '200% auto',
                          animation: 'rainbow 5s linear infinite',
                        } : {}}
                      >
                        {rank}
                      </h3>
                    </div>
                    <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20">
                      <TrendingUp className="w-6 h-6 text-blue-500" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-500">Market Influence</span>
                      <span className="text-blue-400">{rankProgress}% Synergy</span>
                    </div>
                    <div className="pt-2 flex gap-2">
                      <div className="px-2 py-1 bg-white/5 rounded-lg text-[9px] font-black text-slate-400 uppercase border border-white/5">Artifact Scout</div>
                      <div className="px-2 py-1 bg-blue-500/10 rounded-lg text-[9px] font-black text-blue-500 uppercase border border-blue-500/20">Priority Data</div>
                      {isPro && <div className="px-2 py-1 bg-amber-500/10 rounded-lg text-[9px] font-black text-amber-500 uppercase border border-amber-500/20">Elite Tax-Cut</div>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-6 text-slate-500 text-xs leading-relaxed italic flex items-center gap-4">
                <div className="w-1.5 h-12 bg-slate-800 rounded-full"></div>
                {isPro 
                  ? "You are currently benefiting from a premium tier. All professional features are unlocked for your account."
                  : "Upgrade your account to unlock professional trading tools, real-time scanning, and advanced arbitrage opportunities."
                }
              </div>
            </div>

            {/* Account Configuration - Sharp Edges */}
            <div className="bg-[#0d1117] border border-white/5 rounded-none p-8 md:p-10">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-1.5 h-8 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
                <h2 className="text-2xl font-black tracking-tight uppercase">Account Configuration</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">Registered Email</label>
                  <div className="w-full bg-slate-950/50 border border-white/5 rounded-none px-6 py-5 text-sm font-bold text-slate-400 flex items-center gap-3">
                    <UserIcon className="w-4 h-4 text-slate-600" />
                    {user.email}
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">Account Created</label>
                  <div className="w-full bg-slate-950/50 border border-white/5 rounded-none px-6 py-5 text-sm font-bold text-slate-400 flex items-center gap-3">
                    <Award className="w-4 h-4 text-slate-600" />
                    {new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric', day: 'numeric' })}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Links */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(isAdmin || userRole === 'owner' || userRole === 'founder') && (
                <Link href="/admin" className="md:col-span-2 bg-gradient-to-r from-amber-600/20 to-transparent border border-amber-500/30 rounded-none p-8 flex items-center justify-between group hover:bg-amber-500/[0.05] transition-all cursor-pointer">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-amber-500/20 rounded-none flex items-center justify-center border border-amber-500/30 group-hover:bg-amber-500/30 transition-all">
                      <ShieldCheck className="w-6 h-6 text-amber-500" />
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-white group-hover:text-amber-500 transition-colors">Admin Command Center</h4>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Manage users, orders, and medals</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-700 group-hover:text-amber-500 group-hover:translate-x-2 transition-all" />
                </Link>
              )}
              
              <div className="bg-white/[0.02] border border-white/5 rounded-none p-8 flex items-center justify-between group hover:bg-white/[0.04] transition-all cursor-pointer">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center border border-white/5 group-hover:border-white/10 group-hover:bg-slate-800 transition-all">
                    <UserIcon className="w-6 h-6 text-slate-500" />
                  </div>
                  <div>
                    <p className="font-black text-sm uppercase tracking-wider">Trading History</p>
                    <p className="text-[10px] text-slate-600 font-bold">Review your past market flips</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-700 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </div>
              <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 flex items-center justify-between group hover:bg-white/[0.04] transition-all cursor-pointer">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center border border-white/5 group-hover:border-white/10 group-hover:bg-slate-800 transition-all">
                    <Shield className="w-6 h-6 text-slate-500" />
                  </div>
                  <div>
                    <p className="font-black text-sm uppercase tracking-wider">Security Settings</p>
                    <p className="text-[10px] text-slate-600 font-bold">Password and 2FA settings</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-700 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

// Add Mail icon since it was missing
function Mail(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}
