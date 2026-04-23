"use client";

import Header from "@/components/Header";
import ToolCard from "@/components/ToolCard";
import { TrendingUp, Hammer, Sprout, Ship, ShieldCheck, Zap } from "lucide-react";

export default function Home() {
  const tools = [
    {
      title: "Price Checker",
      description: "Instantly check real-time prices for any item across all cities. Stay ahead of market fluctuations.",
      icon: Zap,
      href: "/price-checker",
      gradient: "from-sky-500/20 to-blue-600/20"
    },
    {
      title: "Crafting Calculator",
      description: "Calculate crafting costs, focus efficiency, and potential profits for weapons, armor, and consumables.",
      icon: Hammer,
      href: "#",
      isComingSoon: true,
      gradient: "from-blue-500/20 to-indigo-600/20"
    },
    {
      title: "Black Market Flipper",
      description: "Find real-time arbitrage opportunities between royal cities and the Black Market. Maximize your silver profit with precision.",
      icon: TrendingUp,
      href: "/black-market",
      gradient: "from-amber-500/20 to-orange-600/20"
    },
    {
      title: "Refining Analysis",
      description: "Optimize your resource refining process. Track prices across all cities to find the best return on investment.",
      icon: Sprout,
      href: "#",
      isComingSoon: true,
      gradient: "from-emerald-500/20 to-teal-600/20"
    },
    {
      title: "Trade Routes",
      description: "Analyze profit margins for transporting goods between cities. Find the most efficient paths for your caravan.",
      icon: Ship,
      href: "/trade-routes",
      gradient: "from-purple-500/20 to-pink-600/20"
    }
  ];

  return (
    <div className="min-h-screen relative overflow-x-hidden bg-slate-950">
      {/* Fixed Background Image Layer */}
      <div 
        className="fixed inset-0 bg-[url('/background.png')] bg-cover bg-center z-0 pointer-events-none brightness-[0.25]" 
      />
      
      {/* Content Layer */}
      <div className="relative z-50 min-h-screen flex flex-col bg-slate-950/40 backdrop-blur-sm">
        <Header />
        
        <main className="flex-grow relative z-0">
          {/* Hero Section */}
          <section className="relative pt-20 pb-32 overflow-hidden">
            <div className="container mx-auto px-6 relative">
              <div className="max-w-4xl mx-auto text-center animate-in">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-sm font-bold mb-8">
                  <Zap className="w-4 h-4" />
                  <span>The Ultimate Albion Market Suite</span>
                </div>
                
                <h1 className="text-6xl md:text-7xl font-extrabold mb-6 tracking-tight">
                  Master the <span className="gradient-text">Albion Economy</span>
                </h1>
                
                <p className="text-xl text-slate-400 mb-10 leading-relaxed max-w-2xl mx-auto">
                  Take control of your silver. Use our high-precision tools to analyze markets, 
                  optimize crafting, and find the best arbitrage opportunities in real-time.
                </p>

                <div className="flex flex-wrap justify-center gap-4">
                  <a href="#tools" className="px-8 py-4 bg-amber-500 text-slate-950 rounded-2xl font-bold text-lg hover:bg-amber-400 transition-all shadow-[0_10px_30px_rgba(245,158,11,0.3)] active:scale-95">
                    Explore Tools
                  </a>
                  <a href="/signup" className="px-8 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-bold text-lg hover:bg-white/10 transition-all backdrop-blur-sm">
                    Create Free Account
                  </a>
                </div>
              </div>
            </div>

            {/* Decorative background elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-amber-500/5 blur-[120px] rounded-full pointer-events-none" />
          </section>

          {/* Tools Grid Section */}
          <section id="tools" className="py-24 relative">
            {/* Subtle separator */}
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            
            <div className="container mx-auto px-6">
              <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
                <div className="max-w-2xl">
                  <h2 className="text-4xl font-bold text-white mb-4">Economic Tools</h2>
                  <p className="text-slate-400">Everything you need to dominate the market, from flipping to refining.</p>
                </div>
                <div className="flex items-center gap-2 text-slate-400 font-medium">
                  <ShieldCheck className="w-5 h-5 text-amber-500" />
                  <span>Verified AODP Data Sources</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
                {tools.map((tool, index) => (
                  <div key={index} className={`animate-in`} style={{ animationDelay: `${index * 100}ms` }}>
                    <ToolCard {...tool} />
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Feature Highlight */}
          <section className="py-32 relative">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            
            <div className="container mx-auto px-6 text-center">
              <h2 className="text-3xl font-bold mb-16">Why Choose AlbionMarket?</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                <div className="p-8 group hover:bg-white/5 rounded-3xl transition-all duration-500">
                  <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-amber-500 group-hover:scale-110 transition-transform">
                    <Zap className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold mb-4">Real-Time Speed</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">Lightning fast data updates from the Albion Online Data Project ensures you never miss a deal.</p>
                </div>
                <div className="p-8 group hover:bg-white/5 rounded-3xl transition-all duration-500">
                  <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-amber-500 group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold mb-4">Profit Optimization</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">Advanced mathematical formulas calculate exact taxes and fees to give you pure profit numbers.</p>
                </div>
                <div className="p-8 group hover:bg-white/5 rounded-3xl transition-all duration-500">
                  <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-amber-500 group-hover:scale-110 transition-transform">
                    <ShieldCheck className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold mb-4">Secure & Reliable</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">Built with modern tech stacks and secure authentication to keep your analysis private.</p>
                </div>
              </div>
            </div>
          </section>
        </main>

        <footer className="py-12 border-t border-white/5 bg-slate-950/80 backdrop-blur-md">
          <div className="container mx-auto px-6 text-center text-slate-500 text-sm">
            <p>&copy; {new Date().getFullYear()} Albion Market Analyzer. Not affiliated with Sandbox Interactive GmbH.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
