"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Lock, ArrowRight } from "lucide-react";
import Link from "next/link";

const protectedRoutes = [
  '/trade-routes',
  '/black-market',
  '/price-checker',
  '/profile',
  '/checkout',
  '/admin',
  '/tutorial'
];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (!pathname) return;

      const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
      const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/signup');

      const { data: { session } } = await supabase.auth.getSession();

      if (isProtectedRoute && !session) {
        setIsAuthorized(false);
        setIsChecking(false);
        return;
      }

      if (isAuthRoute && session) {
        router.push('/');
        return;
      }

      setIsAuthorized(true);
      setIsChecking(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: any, session: any) => {
      if (!pathname) return;
      
      const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
      const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/signup');

      if (isProtectedRoute && !session) {
        setIsAuthorized(false);
        setIsChecking(false);
      } else if (isAuthRoute && session) {
        router.push('/');
      } else {
        setIsAuthorized(true);
        setIsChecking(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [pathname, router]);

  const isProtectedRoute = protectedRoutes.some(route => pathname?.startsWith(route));

  if (isProtectedRoute && isChecking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 relative">
        <div className="absolute inset-0 bg-[url('/background.png')] bg-cover bg-center z-0 pointer-events-none brightness-[0.2]" />
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin z-10 shadow-[0_0_15px_rgba(245,158,11,0.5)]"></div>
      </div>
    );
  }

  if (isProtectedRoute && !isAuthorized) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-slate-950">
        <div className="absolute inset-0 bg-[url('/background.png')] bg-cover bg-center z-0 pointer-events-none brightness-[0.2]" />
        
        <div className="relative z-10 blur-xl opacity-30 pointer-events-none select-none h-screen overflow-hidden">
          {children}
        </div>
        
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/40 backdrop-blur-md px-6">
          <div className="bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-[40px] p-8 md:p-12 max-w-lg w-full text-center relative overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-500">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500" />
            
            <div className="w-24 h-24 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-8 relative">
              <div className="absolute inset-0 bg-amber-500/20 rounded-full animate-ping opacity-50" />
              <Lock className="w-10 h-10 text-amber-500 relative z-10" />
            </div>
            
            <h2 className="text-3xl font-black text-white mb-4">Access Restricted</h2>
            <p className="text-slate-400 mb-8 leading-relaxed font-medium">
              You need to sign in or create a free account to unlock this tool and view real-time market data.
            </p>
            
            <div className="flex flex-col gap-4">
              <Link 
                href={`/login?redirectedFrom=${pathname}`}
                className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-2xl transition-all shadow-[0_10px_30px_rgba(245,158,11,0.3)] active:scale-95 flex items-center justify-center gap-2"
              >
                Sign In to Unlock
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link 
                href="/signup"
                className="w-full py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-all border border-white/10 active:scale-95"
              >
                Create Free Account
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
