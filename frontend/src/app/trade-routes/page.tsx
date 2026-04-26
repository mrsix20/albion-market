"use client";

import Header from "@/components/Header";
import { useState, useEffect } from "react";
import { getTradeRoutes, ArbitrageOpportunity } from "@/lib/api";
import { getInGameName } from "@/lib/itemUtils";
import { supabase } from "@/lib/supabaseClient";
import { Ship, ArrowRight, MapPin, TrendingUp, Coins, Clock, Info, ShieldCheck, Zap, AlertCircle, CheckCircle2, XCircle } from "lucide-react";

export default function TradeRoutesPage() {
  const [sourceCity, setSourceCity] = useState("All");
  const [destCity, setDestCity] = useState("All");
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([]);
  const [loading, setLoading] = useState(false);
  const [isPremium, setIsPremium] = useState(true);
  const [minRoi, setMinRoi] = useState(5);
  const [minProfit, setMinProfit] = useState(500);
  const [user, setUser] = useState<any>(null);
  const [itemMap, setItemMap] = useState<Record<string, string>>({});

  const cities = ["All", "Fort Sterling", "Lymhurst", "Bridgewatch", "Martlock", "Thetford", "Caerleon", "Brecilien"];

  const transportItems = [
    // Gear & Equipment
    "T4_BAG", "T5_BAG", "T6_BAG", "T7_BAG", "T8_BAG",
    "T4_CAPE", "T5_CAPE", "T6_CAPE", "T7_CAPE", "T8_CAPE",
    "T4_SHOES_LEATHER_SET1", "T5_SHOES_LEATHER_SET1", "T6_SHOES_LEATHER_SET1",
    
    // Mounts
    "T3_MOUNT_HORSE", "T4_MOUNT_HORSE", "T5_MOUNT_HORSE", "T6_MOUNT_HORSE", "T7_MOUNT_HORSE", "T8_MOUNT_HORSE",
    "T3_MOUNT_OX", "T4_MOUNT_OX", "T5_MOUNT_OX", "T6_MOUNT_OX", "T7_MOUNT_OX", "T8_MOUNT_OX",
    "T5_MOUNT_SWIFTCLAW", "T8_MOUNT_DIREWOLF_RIDE",
    
    // Consumables
    "T4_MEAL_STEW", "T6_MEAL_STEW", "T8_MEAL_STEW",
    "T4_POTION_HEAL", "T6_POTION_HEAL", "T4_POTION_COOLDOWN", "T6_POTION_COOLDOWN",
    "T4_MEAL_OMELETTE", "T6_MEAL_OMELETTE", "T8_MEAL_OMELETTE",
    
    // Resources (High Volume)
    "T4_ORE", "T5_ORE", "T6_ORE", "T7_ORE", "T8_ORE",
    "T4_WOOD", "T5_WOOD", "T6_WOOD", "T7_WOOD", "T8_WOOD",
    "T4_FIBER", "T5_FIBER", "T6_FIBER", "T7_FIBER", "T8_FIBER",
    "T4_HIDE", "T5_HIDE", "T6_HIDE", "T7_HIDE", "T8_HIDE",
    "T4_STONE", "T5_STONE", "T6_STONE", "T7_STONE", "T8_STONE",
    
    // Refined Resources
    "T4_METALBAR", "T5_METALBAR", "T6_METALBAR", "T7_METALBAR", "T8_METALBAR",
    "T4_PLANKS", "T5_PLANKS", "T6_PLANKS", "T7_PLANKS", "T8_PLANKS",
    "T4_CLOTH", "T5_CLOTH", "T6_CLOTH", "T7_CLOTH", "T8_CLOTH",
    "T4_LEATHER", "T5_LEATHER", "T6_LEATHER", "T7_LEATHER", "T8_LEATHER"
  ];

  const taxRate = isPremium ? 0.065 : 0.105;

  const fetchTradeRoutes = async () => {
    setLoading(true);
    try {
      const data = await getTradeRoutes({
        items: transportItems,
        source_city: sourceCity,
        destination_city: destCity,
        tax: taxRate,
        quality: [1, 2, 3]
      }, user?.id);
      
      // Client-side filtering for Min ROI and Min Profit
      const filtered = (data.opportunities || []).filter((opp: any) => 
        opp.roi_percentage >= minRoi && opp.profit >= minProfit
      );
      
      setOpportunities(filtered);
    } catch (error) {
      console.error("Failed to fetch trade routes:", error);
    } finally {
      setLoading(false);
    }
  };
  const handleSourceCityChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCity = e.target.value;
    setSourceCity(newCity);
    try {
      await fetch(`http://localhost:8000/api/v1/force-city/${newCity}`, { method: 'POST' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDestCityChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCity = e.target.value;
    setDestCity(newCity);
    try {
      await fetch(`http://localhost:8000/api/v1/force-city/${newCity}`, { method: 'POST' });
    } catch (err) {
      console.error(err);
    }
  };
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setUser(session?.user ?? null);
    });

    const fetchItemNames = async () => {
      try {
        const response = await fetch('/items.json');
        const data = await response.json();
        const map: Record<string, string> = {};
        data.forEach((item: any) => {
          map[item.id] = item.name;
        });
        setItemMap(map);
      } catch (err) {
        console.error('Failed to load item names:', err);
      }
    };
    fetchItemNames();

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    fetchTradeRoutes();
  }, [sourceCity, destCity, isPremium, minRoi, minProfit, user]);

  const getTimeAgo = (dateString: string) => {
    if (!dateString || dateString.startsWith('0001')) return "N/A";
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 60000);
    if (diff < 1) return "Just now";
    if (diff < 60) return `${diff}m ago`;
    return `${Math.floor(diff / 60)}h ago`;
  };

  return (
    <div className="min-h-screen relative bg-slate-950">
      <div className="fixed inset-0 bg-[url('/background.png')] bg-cover bg-center z-0 pointer-events-none brightness-[0.2]" />
      
      <div className="relative z-10 min-h-screen flex flex-col bg-slate-950/40 backdrop-blur-sm">
        <Header />
        
        <main className="container mx-auto px-6 py-12 flex-grow">
          <div className="max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="mb-12 animate-in flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                  <Ship className="w-8 h-8 text-emerald-500" />
                </div>
                <div>
                  <h1 className="text-5xl font-black text-white tracking-tight">Trade <span className="text-emerald-500">Routes</span></h1>
                  <p className="text-slate-400 font-medium">Professional Logistics & Arbitrage Tools</p>
                </div>
              </div>

              <div className="flex items-center gap-3">

                {/* Premium Toggle */}
                <div className="bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-2xl p-2 flex items-center gap-1 shadow-xl">
                  <button 
                    onClick={() => setIsPremium(true)}
                    className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${isPremium ? 'bg-amber-500 text-slate-950 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    <Zap className={`w-3.5 h-3.5 ${isPremium ? 'fill-current' : ''}`} />
                    Premium
                  </button>
                  <button 
                    onClick={() => setIsPremium(false)}
                    className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${!isPremium ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    Standard
                  </button>
                </div>
              </div>
            </div>

            {/* Advanced Filters Panel */}
            <div className="glass-morphism rounded-3xl p-8 mb-8 border border-white/10 shadow-2xl animate-in fade-in slide-in-from-bottom-4 relative z-20">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-end">
                <div className="md:col-span-1">
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3 ml-1">Buy Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                    <select 
                      value={sourceCity}
                      onChange={handleSourceCityChange}
                      className="w-full bg-slate-950 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:border-emerald-500/50 appearance-none cursor-pointer font-bold text-sm"
                    >
                      {cities.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex justify-center pb-4">
                  <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                    <ArrowRight className="w-5 h-5 text-slate-500" />
                  </div>
                </div>

                <div className="md:col-span-1">
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3 ml-1">Sell Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-500" />
                    <select 
                      value={destCity}
                      onChange={handleDestCityChange}
                      className="w-full bg-slate-950 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:border-rose-500/50 appearance-none cursor-pointer font-bold text-sm"
                    >
                      {cities.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div className="md:col-span-1">
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3 ml-1">Min ROI %</label>
                  <div className="relative">
                    <TrendingUp className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                    <input 
                      type="number" 
                      value={minRoi}
                      onChange={(e) => setMinRoi(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:border-emerald-500/50 font-bold text-sm"
                    />
                  </div>
                </div>

                <div className="md:col-span-1">
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3 ml-1">Min Profit (Silver)</label>
                  <div className="relative">
                    <Coins className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
                    <input 
                      type="number" 
                      value={minProfit}
                      onChange={(e) => setMinProfit(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:border-amber-500/50 font-bold text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Results Table */}
            <div className="glass-morphism rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative z-10">
              <div className="px-8 py-6 bg-white/[0.03] border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="font-black uppercase tracking-widest text-sm text-white">Profitable Arbitrage</h3>
                    <p className="text-[9px] text-slate-500 font-bold uppercase">Results: {opportunities.length}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500 bg-white/5 px-3 py-1.5 rounded-full">
                    {isPremium ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <XCircle className="w-3 h-3 text-slate-500" />}
                    {isPremium ? 'Premium Tax Applied' : 'Standard Tax Applied'}
                  </div>
                  {loading && <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-white/5 bg-white/[0.01]">
                      <th className="px-8 py-5">Item Details</th>
                      <th className="px-8 py-5">Route</th>
                      <th className="px-8 py-5">Buy Price</th>
                      <th className="px-8 py-5">Sell Price</th>
                      <th className="px-8 py-5 text-right">Profit / ROI</th>
                      <th className="px-8 py-5 text-right">Last Sync</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.03]">
                    {opportunities.length > 0 ? (
                      opportunities.map((opp: any, idx) => (
                        <tr key={idx} className={`transition-colors group ${opp.is_private ? 'bg-amber-500/[0.03] hover:bg-amber-500/[0.05]' : 'hover:bg-white/[0.03]'}`}>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <div className={`w-14 h-14 bg-slate-950 rounded-xl border p-1 transition-colors shadow-lg relative ${opp.is_private ? 'border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'border-white/5 group-hover:border-emerald-500/30'}`}>
                                <img 
                                  src={`https://render.albiononline.com/v1/item/${opp.item_id}.png?quality=${opp.quality}`} 
                                  alt={opp.item_id}
                                  className="w-full h-full object-contain scale-125"
                                />
                                {opp.is_private && (
                                  <div className="absolute -top-2 -right-2 bg-amber-500 rounded-full p-1 shadow-lg animate-pulse">
                                    <Zap className="w-2 h-2 text-slate-950 fill-current" />
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <span className="font-black text-slate-200 tracking-tight text-base">
                                    {getInGameName(opp.item_id, itemMap)}
                                  </span>
                                  {opp.is_private && (
                                    <span className="px-1.5 py-0.5 bg-amber-500/20 border border-amber-500/30 rounded text-[7px] font-black text-amber-500 uppercase tracking-tighter">
                                      Private Sync
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                                  Tier {opp.item_id.split('_')[0].replace('T', '')}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-bold text-slate-400">{opp.buy_from_city}</span>
                              <ArrowRight className="w-3 h-3 text-slate-600" />
                              <span className="text-xs font-bold text-emerald-400">{opp.sell_to_city}</span>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-1.5 font-black text-slate-300">
                              <span>{opp.buy_price.toLocaleString()}</span>
                              <Coins className="w-3.5 h-3.5 text-slate-600" />
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-1.5 font-black text-white">
                              <span>{opp.sell_price.toLocaleString()}</span>
                              <Coins className="w-3.5 h-3.5 text-amber-500" />
                            </div>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <div className="flex flex-col items-end gap-3">
                              {opp.profit >= 1000000 ? (
                                <span className="px-3 py-1 bg-amber-500/20 border border-amber-500/50 rounded-full text-[8px] font-black text-amber-500 uppercase tracking-widest animate-floating animate-glow-gold flex items-center gap-1 shadow-[0_0_15px_rgba(245,158,11,0.2)] mb-1">
                                  👑 ULTRA
                                </span>
                              ) : opp.profit >= 500000 ? (
                                <span className="px-3 py-1 bg-purple-500/20 border border-purple-500/50 rounded-full text-[8px] font-black text-purple-400 uppercase tracking-widest animate-floating animate-glow-purple flex items-center gap-1 shadow-[0_0_10px_rgba(168,85,247,0.1)] mb-1">
                                  ✨ SUPER
                                </span>
                              ) : null}
                              <span className="font-black text-lg text-emerald-400">+{opp.profit.toLocaleString()}</span>
                              <div className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-md">
                                <span className="text-[10px] font-black text-emerald-500">{opp.roi_percentage.toFixed(1)}% ROI</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <div className="flex flex-col items-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                                <Clock className="w-3 h-3" /> Buy: {getTimeAgo(opp.buy_price_date)}
                              </div>
                              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                                <Clock className="w-3 h-3" /> Sell: {getTimeAgo(opp.sell_price_date)}
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-8 py-24 text-center">
                          <div className="flex flex-col items-center gap-4 text-slate-600">
                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-2">
                              <Info className="w-8 h-8 opacity-20" />
                            </div>
                            <p className="font-black uppercase tracking-widest text-sm">No Arbitrage Opportunity Found</p>
                            <p className="text-xs max-w-xs mx-auto leading-relaxed">
                              Try lowering your <span className="text-emerald-500">Min ROI</span> or <span className="text-amber-500">Min Profit</span> filters, or selecting a different city pair.
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Info Footer */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-amber-500/5 border border-amber-500/10 rounded-3xl flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-amber-500 shrink-0" />
                <div>
                  <h4 className="font-black text-amber-500 uppercase text-[10px] mb-1 tracking-widest">Taxation Logic</h4>
                  <p className="text-xs text-slate-400 leading-relaxed font-medium">
                    <strong>Premium:</strong> 4% Transaction + 2.5% Setup = 6.5% total.<br/>
                    <strong>Non-Premium:</strong> 8% Transaction + 2.5% Setup = 10.5% total.
                  </p>
                </div>
              </div>
              <div className="p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-3xl flex items-start gap-4">
                <ShieldCheck className="w-6 h-6 text-emerald-500 shrink-0" />
                <div>
                  <h4 className="font-black text-emerald-500 uppercase text-[10px] mb-1 tracking-widest">AODP Network</h4>
                  <p className="text-xs text-slate-400 leading-relaxed font-medium">
                    Data accuracy depends on player updates. Always double-check in-game before committing to large trades.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>

        <footer className="py-12 border-t border-white/5 bg-slate-950/80 backdrop-blur-md mt-auto">
          <div className="container mx-auto px-6 text-center text-slate-500 text-sm">
            <p>&copy; {new Date().getFullYear()} Albion Market Analyzer. Designed for elite traders.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
