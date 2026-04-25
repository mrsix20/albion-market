"use client";

import { LucideIcon, ArrowRight, Clock, Lock } from "lucide-react";
import Link from "next/link";

interface ToolCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  isComingSoon?: boolean;
  gradient?: string;
}

export default function ToolCard({
  title,
  description,
  icon: Icon,
  href,
  isComingSoon = false,
  gradient = "from-amber-500/20 to-orange-600/20",
}: ToolCardProps) {
  const CardContent = (
    <div className={`
      group relative h-full glass-morphism rounded-3xl p-8 transition-all duration-500 
      ${isComingSoon 
        ? 'opacity-60 border-dashed border-slate-700/50 cursor-not-allowed' 
        : 'hover:-translate-y-2 border-amber-500/40 shadow-[0_0_25px_rgba(245,158,11,0.2)] hover:border-amber-500/80 hover:shadow-[0_0_40px_rgba(245,158,11,0.5),0_0_70px_rgba(245,158,11,0.2)]'
      } 
      premium-card
    `}>
      {/* Background Gradient Glow (Only for Live) */}
      {!isComingSoon && (
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl`} />
      )}
      
      {/* Permanent Neon Frame for Live Tools */}
      {!isComingSoon && (
        <div className="absolute inset-0 rounded-3xl border-2 border-amber-500/20 pointer-events-none group-hover:border-amber-500/60 shadow-[inset_0_0_15px_rgba(245,158,11,0.1)] transition-all duration-500" />
      )}

      <div className="relative z-10 flex flex-col h-full">
        <div className="flex justify-between items-start mb-6">
          <div className={`
            p-4 rounded-2xl border transition-colors
            ${isComingSoon 
              ? 'bg-slate-900/50 border-slate-800 text-slate-500' 
              : 'bg-white/5 border-white/10 text-amber-500 group-hover:bg-amber-500/20 group-hover:border-amber-500/50 group-hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]'
            }
          `}>
            {isComingSoon ? <Lock className="w-8 h-8" /> : <Icon className="w-8 h-8" />}
          </div>
          
          {isComingSoon ? (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-900/80 border border-slate-800 rounded-full">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Coming Soon</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500 text-slate-950 rounded-full shadow-[0_0_20px_rgba(245,158,11,0.6)]">
              <div className="w-1.5 h-1.5 bg-slate-950 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Live</span>
            </div>
          )}
        </div>

        <div className="mb-4">
          <h3 className={`text-2xl font-bold transition-colors ${isComingSoon ? 'text-slate-500' : 'text-white group-hover:text-amber-500 group-hover:drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]'}`}>
            {title}
          </h3>
        </div>

        <div className="mb-8 flex-grow">
          <p className={`text-sm leading-relaxed ${isComingSoon ? 'text-slate-600' : 'text-slate-400'}`}>
            {description}
          </p>
        </div>

        {!isComingSoon ? (
          <div className="flex items-center gap-2 text-amber-500 font-bold text-sm group/btn">
            <span className="group-hover:drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]">Explore Tool</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
          </div>
        ) : (
          <div className="text-slate-600 font-bold text-sm italic">
            Tool Under Development
          </div>
        )}
      </div>
    </div>
  );

  if (isComingSoon) {
    return <div className="h-full">{CardContent}</div>;
  }

  return (
    <Link href={href} className="block h-full">
      {CardContent}
    </Link>
  );
}
