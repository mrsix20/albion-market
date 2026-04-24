'use client';

import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Play, Search, TrendingUp, ShieldCheck, HelpCircle, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const TutorialPage = () => {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const handlePlayToggle = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const steps = [
    {
      icon: <Search className="w-8 h-8 text-amber-400" />,
      title: "1. Search for Opportunities",
      description: "Use the Market Analyzer to find price gaps between different cities or the Black Market. Filter by item category, tier, and enchantment level.",
      color: "from-amber-500/20 to-transparent"
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-emerald-400" />,
      title: "2. Analyze Profitability",
      description: "Our system automatically calculates taxes and fees. Look for high ROI (Return on Investment) and high profit margins to ensure your silver is well-spent.",
      color: "from-emerald-500/20 to-transparent"
    },
    {
      icon: <ShieldCheck className="w-8 h-8 text-blue-400" />,
      title: "3. Check Risk & Volume",
      description: "Always check the 'Last Updated' time and the volume of items. High-value items with low volume might be riskier than low-value high-volume items.",
      color: "from-blue-500/20 to-transparent"
    },
    {
      icon: <ArrowRight className="w-8 h-8 text-purple-400" />,
      title: "4. Execute the Trade",
      description: "Buy the item in the cheap location and transport it to the high-demand city. Fast execution is key to maximizing your empire's growth.",
      color: "from-purple-500/20 to-transparent"
    }
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white selection:bg-amber-500/30">
      <Header />

      <main className="pt-32 pb-20 px-4">
        {/* Hero Section */}
        <div className="max-w-7xl mx-auto text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-500">
              Master the Albion Market
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Learn how to use our elite tools to build your silver empire and dominate the economy of the Royal Continent.
            </p>
          </motion.div>
        </div>

        {/* Premium Video Section */}
        <div className="max-w-5xl mx-auto mb-32 px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            {/* Ambient Background Glow */}
            <div className="absolute -inset-10 bg-amber-500/5 blur-[120px] rounded-full pointer-events-none"></div>
            
            {/* The Main Frame (Simplified & Leak-Proof) */}
            <div className="relative group">
              {/* Premium Frame with integrated glow */}
              <div className="relative bg-[#06080c] p-4 rounded-[2.5rem] border border-white/5 shadow-[0_0_50px_rgba(245,158,11,0.1)] group-hover:shadow-[0_0_60px_rgba(245,158,11,0.2)] transition-shadow duration-500">
                
                {/* Inner Video Container with Cinematic Thumbnail Background */}
                <div className="relative rounded-[1.5rem] overflow-hidden aspect-video group bg-[#06080c]">
                  
                  {/* Cinematic Background Image (Visible when video is paused) */}
                  <div 
                    className="absolute inset-0 z-0 opacity-40 blur-[2px]"
                    style={{ 
                      backgroundImage: `url('/tutorial_bg.png')`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  ></div>

                  {/* The Native Video Player (Hidden when paused to stop bleeding) */}
                  <video
                    ref={videoRef}
                    className={`relative w-full h-full object-cover block bg-black/40 transition-opacity duration-700 z-10 ${isPlaying ? 'opacity-100' : 'opacity-0'}`}
                    playsInline
                    preload="auto"
                    poster="/tutorial_bg.png"
                    onEnded={() => setIsPlaying(false)}
                    src="https://vjs.zencdn.net/v/oceans.mp4"
                  >
                    <source src="https://vjs.zencdn.net/v/oceans.mp4" type="video/mp4" />
                  </video>

                  {/* Custom Controls (Play/Pause Overlay) */}
                  {isPlaying && (
                    <div 
                      onClick={handlePlayToggle}
                      className="absolute -inset-[2px] z-40 bg-transparent group-hover:bg-black/20 cursor-pointer flex items-center justify-center transition-all rounded-[1.5rem]"
                    >
                      <div className="opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300">
                        <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 shadow-2xl">
                          <div className="w-3 h-8 bg-white rounded-full mx-1"></div>
                          <div className="w-3 h-8 bg-white rounded-full mx-1"></div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* High-End Start Overlay */}
                  {!isPlaying && (
                    <div 
                      onClick={handlePlayToggle}
                      className="absolute -inset-[2px] bg-black/20 backdrop-blur-sm flex flex-col items-center justify-center cursor-pointer group-hover:bg-black/10 transition-all duration-700 z-50 rounded-[1.5rem]"
                    >
                      <div className="relative mb-10">
                        <div className="absolute inset-0 bg-amber-500 rounded-full blur-[60px] opacity-30 animate-pulse"></div>
                        <div className="relative w-28 h-28 bg-transparent border-2 border-amber-500/50 rounded-full flex items-center justify-center shadow-[0_0_60px_rgba(245,158,11,0.3)] transform group-hover:scale-110 transition-all duration-700">
                          <Play className="w-14 h-14 text-amber-500 fill-amber-500 ml-1.5" />
                        </div>
                      </div>
                      
                      <div className="text-center px-6">
                        <span className="text-amber-500 font-bold text-[10px] uppercase tracking-[0.8em] block mb-6 animate-pulse">Incoming Transmission</span>
                        <h3 className="text-white font-black text-4xl md:text-6xl tracking-tighter mb-4 italic">PREPARE FOR <span className="text-amber-500">DOMINANCE</span></h3>
                        <p className="text-white/50 text-sm font-medium tracking-[0.2em] max-w-md mx-auto leading-relaxed uppercase">
                          The next era of Albion market intelligence is arriving.
                        </p>
                        <div className="h-[2px] w-48 bg-gradient-to-r from-transparent via-amber-500 to-transparent mt-10 mx-auto"></div>
                      </div>
                    </div>
                  )}

                  {/* ULTIMATE MASKING: Inner Shadow + Corner Frame */}
                  <div 
                    className="absolute inset-0 z-[60] pointer-events-none rounded-[1.5rem] border-[4px] border-[#06080c]"
                    style={{ boxShadow: 'inset 0 0 10px #06080c' }}
                  ></div>
                </div>
              </div>

              {/* Decorative Corner Tabs */}
              <div className="absolute top-0 left-12 right-12 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent"></div>
              <div className="absolute bottom-0 left-12 right-12 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent"></div>
            </div>
            
            {/* Project Status Badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#06080c] text-amber-500 px-6 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.4em] shadow-xl border border-amber-500/20 z-30">
              Official Tutorial
            </div>
          </motion.div>
        </div>

        {/* Steps Grid */}
        <div className="max-w-7xl mx-auto mb-32">
          <h2 className="text-3xl font-bold mb-12 text-center flex items-center justify-center gap-3">
            <HelpCircle className="text-amber-500" />
            Detailed Guide
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative p-8 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-amber-500/30 transition-all group"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${step.color} rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                <div className="relative z-10">
                  <div className="mb-6 p-3 bg-white/[0.05] rounded-xl w-fit group-hover:scale-110 transition-transform">
                    {step.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-4 text-white group-hover:text-amber-400 transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="max-w-4xl mx-auto text-center">
          <div className="p-12 rounded-3xl bg-gradient-to-br from-amber-600/10 to-amber-900/10 border border-amber-500/20 backdrop-blur-sm">
            <h2 className="text-3xl font-bold mb-6">Ready to start your journey?</h2>
            <p className="text-gray-400 mb-10 text-lg">
              The silver is waiting. Join thousands of traders using our data to make millions every day.
            </p>
            <a
              href="/black-market"
              className="px-10 py-4 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition-all shadow-lg shadow-amber-500/20 inline-flex items-center gap-2 group"
            >
              Go to Market Analyzer
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TutorialPage;
