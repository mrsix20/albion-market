'use client';

import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Play, Search, TrendingUp, ShieldCheck, HelpCircle, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const TutorialPage = () => {
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

        {/* Video Section */}
        <div className="max-w-5xl mx-auto mb-32">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative group"
          >
            {/* Decorative Frame */}
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/50 via-amber-200/20 to-amber-500/50 rounded-2xl blur opacity-30 group-hover:opacity-100 transition duration-1000"></div>
            
            <div className="relative bg-[#121214] rounded-2xl overflow-hidden border border-white/10 aspect-video shadow-2xl">
              {/* This is where the YouTube video goes */}
              <iframe
                className="w-full h-full"
                src="https://www.youtube.com/embed/dQw4w9WgXcQ" // Placeholder - update with user's video ID
                title="Albion Market Analyzer Tutorial"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>

              {/* Overlay (Hidden when video starts) */}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none group-hover:bg-black/20 transition-all">
                <div className="w-20 h-20 bg-amber-500 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/50 transform group-hover:scale-110 transition-transform">
                  <Play className="w-10 h-10 text-black fill-black ml-1" />
                </div>
              </div>
            </div>
            
            {/* Legend Tag */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-500 text-black px-6 py-1 rounded-full text-sm font-bold uppercase tracking-widest shadow-lg border-2 border-black">
              Official Guide
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
