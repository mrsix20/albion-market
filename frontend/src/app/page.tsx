"use client";

import Header from "@/components/Header";
import ToolCard from "@/components/ToolCard";
import { TrendingUp, Hammer, Sprout, Ship, ShieldCheck, Zap, ChevronRight } from "lucide-react";

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
                  <a href="https://discord.gg/your-invite-link" target="_blank" rel="noopener noreferrer" className="px-6 py-4 bg-[#5865F2]/10 border border-[#5865F2]/20 text-[#5865F2] rounded-2xl font-bold text-lg hover:bg-[#5865F2]/20 transition-all backdrop-blur-sm flex items-center justify-center gap-3 shadow-[0_5px_15px_rgba(88,101,242,0.2)]">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.419 0 1.334-.956 2.419-2.157 2.419zm7.974 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.419 0 1.334-.946 2.419-2.157 2.419z"/>
                    </svg>
                    Discord
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
          {/* Discord Community Section */}
          <section className="py-24 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            
            <div className="container mx-auto px-6 relative z-10">
              <div className="max-w-5xl mx-auto bg-gradient-to-br from-[#5865F2]/20 to-indigo-900/40 border border-[#5865F2]/30 rounded-[40px] p-8 md:p-16 relative overflow-hidden group">
                {/* Decorative Discord Logo in Background */}
                <div className="absolute -right-16 -bottom-16 opacity-10 group-hover:opacity-20 transition-opacity duration-700 -rotate-12 group-hover:rotate-0 transform">
                   <svg width="300" height="300" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.419 0 1.334-.956 2.419-2.157 2.419zm7.974 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.419 0 1.334-.946 2.419-2.157 2.419z"/>
                   </svg>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-12 relative z-20">
                  <div className="w-24 h-24 md:w-32 md:h-32 bg-white rounded-3xl flex items-center justify-center shadow-[0_20px_50px_rgba(88,101,242,0.5)] transform group-hover:scale-110 transition-transform duration-500">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="#5865F2">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.419 0 1.334-.956 2.419-2.157 2.419zm7.974 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.419 0 1.334-.946 2.419-2.157 2.419z"/>
                    </svg>
                  </div>

                  <div className="flex-grow text-center md:text-left">
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Join our <span className="text-[#5865F2]">Discord</span></h2>
                    <p className="text-slate-300 text-lg mb-8 max-w-xl">
                      Connect with thousands of elite traders, share arbitrage routes, and get real-time market signals directly from the community.
                    </p>
                    <div className="flex flex-wrap justify-center md:justify-start gap-4">
                      <a 
                        href="https://discord.gg/your-invite-link" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="px-10 py-5 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-2xl font-bold text-xl flex items-center gap-3 transition-all shadow-[0_10px_40px_rgba(88,101,242,0.4)] active:scale-95"
                      >
                        Join Now
                        <ChevronRight className="w-6 h-6" />
                      </a>
                    </div>
                  </div>
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
