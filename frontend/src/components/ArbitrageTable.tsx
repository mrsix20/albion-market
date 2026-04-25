"use client";

import { RefreshCw, Search, Filter, Percent, ChevronRight, Zap, Clock, Coins, Lock } from 'lucide-react';
import React, { useState, useEffect, useMemo } from 'react';
import { getBlackMarketFlips, ArbitrageOpportunity, invalidateDeal } from '@/lib/api';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

const DEFAULT_ITEMS = [
  // Bags & Capes
  "T4_BAG", "T5_BAG", "T6_BAG", "T7_BAG", "T8_BAG",
  "T4_CAPE", "T5_CAPE", "T6_CAPE", "T7_CAPE", "T8_CAPE",
  // Weapons
  "T4_MAIN_SPEAR", "T5_MAIN_SPEAR", "T6_MAIN_SPEAR",
  "T4_MAIN_AXE", "T5_MAIN_AXE", "T6_MAIN_AXE",
  "T4_MAIN_SWORD", "T5_MAIN_SWORD", "T6_MAIN_SWORD",
  "T4_2H_BOW", "T5_2H_BOW", "T6_2H_BOW",
  "T4_MAIN_FIRESTAFF", "T5_MAIN_FIRESTAFF", "T6_MAIN_FIRESTAFF",
  "T4_2H_CLAW_KEEPER", "T5_2H_CLAW_KEEPER", "T6_2H_CLAW_KEEPER",
  // Armors
  "T4_ARMOR_LEATHER_SET1", "T5_ARMOR_LEATHER_SET1", "T6_ARMOR_LEATHER_SET1",
  "T4_ARMOR_CLOTH_SET1", "T5_ARMOR_CLOTH_SET1", "T6_ARMOR_CLOTH_SET1",
  "T4_ARMOR_PLATE_SET1", "T5_ARMOR_PLATE_SET1", "T6_ARMOR_PLATE_SET1",
  // Helmets & Shoes
  "T4_HEAD_PLATE_SET1", "T5_HEAD_PLATE_SET1", "T6_HEAD_PLATE_SET1",
  "T4_SHOES_CLOTH_SET1", "T5_SHOES_CLOTH_SET1", "T6_SHOES_CLOTH_SET1",
  // Mounts (Commonly flipped)
  "T4_MOUNT_HORSE", "T5_MOUNT_HORSE", "T6_MOUNT_HORSE",
  "T4_MOUNT_OX", "T5_MOUNT_OX", "T6_MOUNT_OX"
];

export default function ArbitrageTable() {
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [materialPrices, setMaterialPrices] = useState<Record<string, number>>({});

  const materialItems = [
    'T4_RUNE', 'T5_RUNE', 'T6_RUNE', 'T7_RUNE', 'T8_RUNE',
    'T4_SOUL', 'T5_SOUL', 'T6_SOUL', 'T7_SOUL', 'T8_SOUL',
    'T4_RELIC', 'T5_RELIC', 'T6_RELIC', 'T7_RELIC', 'T8_RELIC'
  ];

  const getRequiredMaterials = (itemId: string) => {
    const type = itemId.split('_')[1];
    if (['HEAD', 'SHOES', 'OFF', 'CAPE', 'BAG'].some(t => itemId.includes(t))) return 48;
    if (['ARMOR', 'MAIN'].some(t => itemId.includes(t))) return 96;
    if (['2H'].some(t => itemId.includes(t))) return 144;
    return 96; // Default fallback
  };

  const getMaterialId = (tier: string, enchant: string) => {
    const matType = enchant === '1' ? 'RUNE' : enchant === '2' ? 'SOUL' : 'RELIC';
    return `${tier}_${matType}`;
  };

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const itemIds = materialItems.join(',');
        const response = await fetch(`https://europe.albion-online-data.com/api/v2/stats/prices/${itemIds}?locations=Lymhurst,Bridgewatch,Martlock,Thetford,Fort Sterling,Caerleon`);
        
        if (!response.ok) {
            console.warn("Material prices API throttled or failed");
            return;
        }

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            console.warn("Material prices API returned non-JSON response");
            return;
        }

        const data = await response.json();
        
        const prices: Record<string, number> = {};
        data.forEach((item: any) => {
          // Get the lowest sell price across all cities to find the best deal for materials
          const price = item.sell_price_min > 0 ? item.sell_price_min : item.buy_price_max;
          if (price > 0) {
            if (!prices[item.item_id] || price < prices[item.item_id]) {
              prices[item.item_id] = price;
            }
          }
        });
        setMaterialPrices(prices);
      } catch (err) {
        console.error("Failed to fetch material prices", err);
      }
    };
    fetchMaterials();
  }, []);
  
  // Filters
  const [minProfit, setMinProfit] = useState(0);
  const [minROI, setMinROI] = useState(0);
  const [selectedTier, setSelectedTier] = useState<string>("All");
  const [selectedCity, setSelectedCity] = useState<string>("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [customItems, setCustomItems] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: keyof ArbitrageOpportunity; direction: 'asc' | 'desc' } | null>({ key: 'sell_price_date', direction: 'desc' });
  
  const [localMinProfit, setLocalMinProfit] = useState<string>("0");
  const [localMinROI, setLocalMinROI] = useState<string>("0");
  const [user, setUser] = useState<any>(null);
  const [isPro, setIsPro] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [hiddenDeals, setHiddenDeals] = useState<Set<string>>(new Set());

  const hideDeal = async (op: ArbitrageOpportunity) => {
    const key = `${op.item_id}-${op.quality}-${op.buy_from_city}`;
    setHiddenDeals(prev => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });
    try {
      await invalidateDeal(op.item_id, op.quality, op.buy_from_city);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    // Sync Pro status globally from Header.tsx to ensure perfect consistency
    // Header already performs the precise database fetch and expiration checks
    const syncInterval = setInterval(() => {
      if (typeof window !== 'undefined' && (window as any).is_pro_active !== undefined) {
        setIsPro((window as any).is_pro_active);
      }
    }, 300);

    return () => clearInterval(syncInterval);
  }, []);

  useEffect(() => {
    const savedMinProfit = localStorage.getItem('minProfit');
    const savedMinROI = localStorage.getItem('minROI');
    const savedTier = localStorage.getItem('selectedTier');
    const savedCity = localStorage.getItem('selectedCity');
    const savedCustomItems = localStorage.getItem('customItems');
    const savedSortConfig = localStorage.getItem('sortConfig');
    
    if (savedMinProfit) {
      setMinProfit(Number(savedMinProfit));
      setLocalMinProfit(savedMinProfit);
    }
    if (savedMinROI) {
      setMinROI(Number(savedMinROI));
      setLocalMinROI(savedMinROI);
    }
    if (savedTier) setSelectedTier(savedTier);
    if (savedCity) setSelectedCity(savedCity);
    if (savedCustomItems) setCustomItems(JSON.parse(savedCustomItems));
    if (savedSortConfig) setSortConfig(JSON.parse(savedSortConfig));

    setIsMounted(true);

    // Fetch User Session
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
      }
    };
    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Debounce effect: Update the actual filters only after user stops typing
  useEffect(() => {
    if (!isMounted) return;
    const timer = setTimeout(() => {
      const val = Number(localMinProfit);
      if (!isNaN(val)) {
        setMinProfit(val);
        localStorage.setItem('minProfit', val.toString());
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [localMinProfit, isMounted]);

  useEffect(() => {
    if (!isMounted) return;
    const timer = setTimeout(() => {
      const val = Number(localMinROI);
      if (!isNaN(val)) {
        setMinROI(val);
        localStorage.setItem('minROI', val.toString());
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [localMinROI, isMounted]);

  // Save tier immediately since it's a dropdown (no typing lag)
  useEffect(() => {
    if (!isMounted) return;
    localStorage.setItem('selectedTier', selectedTier);
  }, [selectedTier, isMounted]);

  useEffect(() => {
    if (!isMounted) return;
    localStorage.setItem('selectedCity', selectedCity);
  }, [selectedCity, isMounted]);

  useEffect(() => {
    if (!isMounted) return;
    localStorage.setItem('customItems', JSON.stringify(customItems));
  }, [customItems, isMounted]);

  useEffect(() => {
    if (!isMounted) return;
    localStorage.setItem('sortConfig', JSON.stringify(sortConfig));
  }, [sortConfig, isMounted]);

  // CSS for Marquee animation
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes marquee {
        0% { transform: translateX(0); }
        100% { transform: translateX(-50%); }
      }
      .animate-marquee {
        animation: marquee 20s linear infinite;
      }
      @keyframes shine {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }
      .animate-shine {
        animation: shine 2s infinite;
      }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  // Helper to calculate time ago
  const getTimeAgo = (dateString: string) => {
    try {
      const now = new Date();
      const past = new Date(dateString);
      const diffMs = now.getTime() - past.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${Math.floor(diffHours / 24)}d ago`;
    } catch (e) {
      return "Unknown";
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const baseItems = customItems.length > 0 ? customItems : DEFAULT_ITEMS;
      const enchantedItems: string[] = [];
      
      baseItems.forEach(item => {
        enchantedItems.push(item);
        enchantedItems.push(`${item}@1`);
        enchantedItems.push(`${item}@2`);
        enchantedItems.push(`${item}@3`);
        enchantedItems.push(`${item}@4`);
      });

      const data = await getBlackMarketFlips(enchantedItems, user?.id);
      setOpportunities(data.opportunities);
      setError(null);
    } catch (err) {
      // Don't show error if it's just a session loading state
      if (user) {
        setError("Failed to connect to API. Make sure the backend is running.");
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm) {
      setCustomItems([searchTerm.toUpperCase()]);
      setSearchTerm("");
    } else {
      setCustomItems([]);
    }
  };

  const resetSearch = () => {
    setCustomItems([]);
    setSearchTerm("");
  };

  const resetFilters = () => {
    setLocalMinProfit("0");
    setLocalMinROI("0");
    setMinProfit(0);
    setMinROI(0);
    setSelectedTier("All");
    setSelectedCity("All");
    setCustomItems([]);
    localStorage.removeItem('minProfit');
    localStorage.removeItem('minROI');
    localStorage.removeItem('selectedTier');
    localStorage.removeItem('selectedCity');
    localStorage.removeItem('customItems');
    localStorage.removeItem('sortConfig');
    setSortConfig({ key: 'sell_price_date', direction: 'desc' });
    setHiddenDeals(new Set());
  };

  useEffect(() => {
    if (isMounted && user) {
      fetchData();
    }
    const interval = setInterval(() => {
      if (isMounted && user) fetchData();
    }, 60000);
    return () => clearInterval(interval);
  }, [customItems, user, isMounted]);

  const requestSort = (key: keyof ArbitrageOpportunity) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedOps = [...opportunities].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    
    const valA = a[key] ?? 0;
    const valB = b[key] ?? 0;

    if (valA < valB) return direction === 'asc' ? -1 : 1;
    if (valA > valB) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  const filteredOps = sortedOps.filter(op => {
    const key = `${op.item_id}-${op.quality}-${op.buy_from_city}`;
    if (hiddenDeals.has(key)) return false;

    const tierMatch = selectedTier === "All" || op.item_id.startsWith(`T${selectedTier}`);
    const cityMatch = selectedCity === "All" || op.buy_from_city === selectedCity;
    const profitMatch = op.profit >= minProfit;
    const roiMatch = op.roi_percentage >= minROI;
    return tierMatch && cityMatch && profitMatch && roiMatch;
  });

  // Helper to check if a deal is "Pro"
  const isProDeal = (op: ArbitrageOpportunity) => {
    return op.profit > 50000;
  };

  if (loading && opportunities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-12 relative overflow-hidden">
        {/* Market Radar Scanner Animation */}
        <div className="relative w-40 h-40">
          {/* Pulsing Concentric Rings */}
          <div className="absolute inset-0 border border-amber-500/20 rounded-full animate-[ping_3s_linear_infinite]"></div>
          <div className="absolute inset-4 border border-amber-500/10 rounded-full animate-[ping_3s_linear_infinite_0.5s]"></div>
          <div className="absolute inset-8 border border-amber-500/5 rounded-full animate-[ping_3s_linear_infinite_1s]"></div>
          
          {/* Main Radar Circle */}
          <div className="absolute inset-0 border-2 border-slate-800 rounded-full bg-slate-900/50 backdrop-blur-sm shadow-2xl"></div>
          
          {/* Rotating Scanner Beam */}
          <div className="absolute inset-0 rounded-full overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-1 bg-gradient-to-r from-transparent via-amber-500/60 to-transparent rotate-0 animate-[spin_4s_linear_infinite]"></div>
          </div>

          {/* Center Target Point */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-amber-500 rounded-full shadow-[0_0_20px_rgba(245,158,11,0.8)] animate-pulse"></div>
          
          {/* Random "Deal" Detected Dots */}
          <div className="absolute top-1/4 left-1/4 w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>
          <div className="absolute bottom-1/3 right-1/4 w-1 h-1 bg-amber-400 rounded-full animate-pulse [animation-delay:0.7s]"></div>
          <div className="absolute top-2/3 left-1/3 w-1.5 h-1.5 bg-sky-500 rounded-full animate-pulse [animation-delay:1.2s]"></div>
        </div>

        {/* Status Messages */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-3">
             <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:0s]"></div>
                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
             </div>
             <p className="text-amber-500 font-black text-sm uppercase tracking-[0.3em] animate-pulse">
               Scanning Royal Markets
             </p>
          </div>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
            Filtering high-profit arbitrage opportunities...
          </p>
        </div>
      </div>
    );
  }

  if (error && opportunities.length === 0) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
        <p className="text-red-400 font-medium">{error}</p>
        <button 
          onClick={fetchData}
          className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 transition-colors"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const getInGameName = (itemId: string) => {
    const parts = itemId.split('@')[0].split('_');
    const tier = parts[0]; // e.g. T4
    
    const tierNames: Record<string, string> = {
      'T1': "Beginner's", 'T2': "Novice's", 'T3': "Journeyman's",
      'T4': "Adept's", 'T5': "Expert's", 'T6': "Master's",
      'T7': "Grandmaster's", 'T8': "Elder's"
    };

    // Specific mapping for Armor Sets
    const setNames: Record<string, string> = {
      'PLATE_SET1': 'Soldier', 'PLATE_SET2': 'Knight', 'PLATE_SET3': 'Guardian',
      'LEATHER_SET1': 'Mercenary', 'LEATHER_SET2': 'Hunter', 'LEATHER_SET3': 'Assassin',
      'CLOTH_SET1': 'Scholar', 'CLOTH_SET2': 'Cleric', 'CLOTH_SET3': 'Mage'
    };

    const typeNames: Record<string, string> = {
      'ARMOR': 'Armor', 'HEAD': 'Helmet', 'SHOES': 'Workboots',
      'BAG': 'Bag', 'CAPE': 'Cape', 'MAIN_SPEAR': 'Spear',
      'MAIN_AXE': 'Battleaxe', 'MAIN_SWORD': 'Broadsword',
      '2H_BOW': 'Bow', 'MAIN_FIRESTAFF': 'Fire Staff',
      'MOUNT_HORSE': 'Riding Horse', 'MOUNT_OX': 'Transport Ox'
    };

    // Logic to build the name
    let name = "";
    const remainingParts = parts.slice(1).join('_');
    
    // Check if it's a set item (Armor/Head/Shoes)
    const setKey = Object.keys(setNames).find(key => remainingParts.includes(key));
    const typeKey = Object.keys(typeNames).find(key => remainingParts.includes(key));

    if (setKey && typeKey) {
      name = `${setNames[setKey]} ${typeNames[typeKey]}`;
    } else if (typeKey) {
      name = typeNames[typeKey];
    } else {
      name = remainingParts.replace(/_/g, ' ');
    }

    return `${tierNames[tier] || tier} ${name}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="overflow-hidden glass rounded-2xl border border-white/10 shadow-2xl">
      <div className="px-6 py-6 border-b border-white/10 flex flex-wrap items-end gap-6 bg-white/5">
        <form onSubmit={handleSearch} className="flex flex-col gap-2">
          <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest ml-1 flex items-center gap-2">
            <Search className="w-3 h-3" /> Quick Search
          </label>
          <div className="flex items-center gap-2">
            <div className="relative group">
              <input 
                type="text" 
                placeholder="e.g. T6_MAIN_SPEAR" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-sm w-64 outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all shadow-2xl placeholder:text-slate-700 font-medium"
              />
              <div className="absolute inset-0 rounded-xl bg-amber-500/5 opacity-0 group-focus-within:opacity-100 pointer-events-none transition-opacity"></div>
            </div>
            <button type="submit" className="px-5 py-2.5 bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider hover:brightness-110 hover:shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all active:scale-95 flex items-center gap-2 shadow-lg">
              <Zap className="w-3.5 h-3.5" />
              Search
            </button>
          </div>
        </form>

        <div className="h-12 w-px bg-white/5 mx-2 hidden lg:block mb-1"></div>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest ml-1 flex items-center gap-2">
            <Filter className="w-3 h-3" /> Tier Filter
          </label>
          <div className="relative group">
            <select 
              value={selectedTier} 
              onChange={(e) => setSelectedTier(e.target.value)}
              className="bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all appearance-none cursor-pointer min-w-[140px] font-medium pr-10"
            >
              <option value="All">All Tiers</option>
              <option value="4">Tier 4</option>
              <option value="5">Tier 5</option>
              <option value="6">Tier 6</option>
              <option value="7">Tier 7</option>
              <option value="8">Tier 8</option>
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600 group-hover:text-amber-500 transition-colors">
              <ChevronRight className="w-4 h-4 rotate-90" />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest ml-1 flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" /> 
            Location
          </label>
          <div className="relative group">
            <select 
              value={selectedCity} 
              onChange={(e) => setSelectedCity(e.target.value)}
              className={`bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all appearance-none cursor-pointer min-w-[140px] font-black pr-10 hover:bg-slate-900 ${
                selectedCity === 'Thetford' ? 'text-purple-400' :
                selectedCity === 'Fort Sterling' ? 'text-blue-200' :
                selectedCity === 'Lymhurst' ? 'text-emerald-400' :
                selectedCity === 'Bridgewatch' ? 'text-amber-400' :
                selectedCity === 'Martlock' ? 'text-blue-400' :
                selectedCity === 'Caerleon' ? 'text-red-400' :
                selectedCity === 'Brecilien' ? 'text-slate-100' :
                'text-slate-200'
              }`}
            >
              <option value="All" className="text-slate-200 bg-slate-950 font-bold">All Cities</option>
              <option value="Thetford" className="text-purple-400 bg-slate-950 font-bold">Thetford</option>
              <option value="Fort Sterling" className="text-blue-200 bg-slate-950 font-bold">Fort Sterling</option>
              <option value="Lymhurst" className="text-emerald-400 bg-slate-950 font-bold">Lymhurst</option>
              <option value="Bridgewatch" className="text-amber-400 bg-slate-950 font-bold">Bridgewatch</option>
              <option value="Martlock" className="text-blue-400 bg-slate-950 font-bold">Martlock</option>
              <option value="Caerleon" className="text-red-400 bg-slate-950 font-bold">Caerleon</option>
              <option value="Brecilien" className="text-slate-100 bg-slate-950 font-bold">Brecilien</option>
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600 group-hover:text-amber-500 transition-colors">
              <ChevronRight className="w-4 h-4 rotate-90" />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest ml-1 flex items-center gap-2">
            <Coins className="w-3.5 h-3.5 text-slate-400" /> 
            Min Profit
          </label>
          <div className="relative group">
            <input 
              type="number" 
              value={localMinProfit} 
              onChange={(e) => setLocalMinProfit(e.target.value)}
              className="bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-sm w-36 outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all shadow-2xl [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-medium pr-10"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-amber-500/30 font-black text-[10px] pointer-events-none group-focus-within:text-amber-500 transition-colors">
              SILVER
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest ml-1 flex items-center gap-2">
            <Percent className="w-3 h-3" /> Min ROI
          </label>
          <div className="relative group">
            <input 
              type="number" 
              value={localMinROI} 
              onChange={(e) => setLocalMinROI(e.target.value)}
              className="bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-sm w-28 outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all shadow-2xl [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-medium pr-8"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-700 font-black text-[10px] pointer-events-none group-focus-within:text-amber-500 transition-colors">
              %
            </div>
          </div>
        </div>

        <div className="flex items-center mb-1">
          <button 
            onClick={resetFilters}
            className="flex items-center gap-2 px-6 py-2.5 bg-rose-500/5 border border-rose-500/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/20 transition-all group shadow-lg"
          >
            <RefreshCw className="w-3.5 h-3.5 group-hover:-rotate-180 transition-transform duration-500" />
            Reset Filters
          </button>
        </div>

        <div className="flex items-center gap-3 ml-auto mb-1">
          <button 
            onClick={fetchData}
            disabled={loading}
            className={`flex items-center gap-2 px-6 py-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-amber-500 hover:bg-amber-500/20 transition-all group shadow-lg ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </button>
          
          <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 bg-slate-950/50 px-5 py-2.5 rounded-xl border border-white/5 shadow-xl hidden md:flex">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(34,197,94,0.6)]"></span>
            Live (AODP)
          </div>
        </div>
      </div>


      <div className="overflow-x-auto relative">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.15em] bg-white/[0.02] border-b border-white/10">
              <th className="px-6 py-4 text-center cursor-pointer hover:text-amber-500 transition-colors" onClick={() => requestSort('item_id')}>
                ITEM {sortConfig?.key === 'item_id' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-6 py-4 text-center cursor-pointer hover:text-amber-500 transition-colors" onClick={() => requestSort('buy_from_city')}>
                MARKET {sortConfig?.key === 'buy_from_city' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-6 py-4 text-center cursor-pointer hover:text-amber-500 transition-colors" onClick={() => requestSort('buy_price')}>
                BUY PRICE {sortConfig?.key === 'buy_price' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-6 py-4 text-center cursor-pointer hover:text-amber-500 transition-colors" onClick={() => requestSort('sell_price')}>
                BLACK MARKET {sortConfig?.key === 'sell_price' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-6 py-4 text-center cursor-pointer hover:text-amber-500 transition-colors" onClick={() => requestSort('profit')}>
                PROFIT ANALYSIS {sortConfig?.key === 'profit' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-6 py-4 text-center cursor-pointer hover:text-amber-500 transition-colors" onClick={() => requestSort('roi_percentage')}>
                DYNAMICS {sortConfig?.key === 'roi_percentage' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-6 py-4 text-center text-slate-600">STATUS & ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {filteredOps.map((op, idx) => {
              const isEnchanted = op.item_id.includes('@');
              const enchantLevel = isEnchanted ? op.item_id.split('@')[1] : '0';
              const inGameName = getInGameName(op.item_id);
              const isRestricted = !isPro && isProDeal(op);
              const isPrivate = (op as any).is_private;

              const enchantColors: Record<string, string> = {
                '1': 'bg-green-500', '2': 'bg-blue-500', '3': 'bg-purple-500',
                '4': 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]',
              };

              const enchantGlows: Record<string, string> = {
                '1': 'shadow-[0_0_15px_rgba(34,197,94,0.2)] border-green-500/20',
                '2': 'shadow-[0_0_15px_rgba(59,130,246,0.2)] border-blue-500/20',
                '3': 'shadow-[0_0_15px_rgba(168,85,247,0.2)] border-purple-500/20',
                '4': 'shadow-[0_0_20px_rgba(251,191,36,0.4)] border-amber-500/40',
              };

              const cityStyles: Record<string, string> = {
                'Thetford': 'text-purple-400 border-purple-500/40 bg-purple-500/10',
                'Fort Sterling': 'text-blue-200 border-blue-200/40 bg-blue-200/10',
                'Lymhurst': 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10',
                'Bridgewatch': 'text-amber-400 border-amber-500/40 bg-amber-500/10',
                'Martlock': 'text-blue-400 border-blue-500/40 bg-blue-500/10',
                'Caerleon': 'text-red-400 border-red-500/40 bg-red-500/10',
                'Brecilien': 'text-slate-100 border-slate-400/40 bg-slate-400/10',
              };

              return (
                <React.Fragment key={`${op.item_id}-${op.quality}-${idx}`}>
                  <tr 
                    className={`hover:bg-white/[0.04] transition-all group relative ${isRestricted ? 'bg-amber-500/[0.015]' : ''} ${isPrivate ? 'bg-amber-500/[0.03] border-l-[3px] border-l-amber-500 shadow-[inset_0_0_30px_rgba(245,158,11,0.05)]' : 'border-l-[3px] border-l-transparent'} ${expandedRow === `${op.item_id}-${op.quality}-${idx}` ? 'bg-purple-500/[0.02] ring-1 ring-inset ring-purple-500/20' : ''}`}
                  >
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-5">
                      <div className="relative">
                        <div className={`w-20 h-20 bg-slate-900/50 rounded-xl flex items-center justify-center border ${op.quality === 5 ? 'border-[#fbbf24]' : 'border-white/10'} group-hover:border-amber-500/30 transition-all p-0 relative ${isPrivate ? 'shadow-[0_0_20px_rgba(245,158,11,0.3)] border-amber-500/50' : enchantGlows[enchantLevel] || 'shadow-xl'} overflow-hidden`}>
                          <img 
                            src={`https://render.albiononline.com/v1/item/${op.item_id}.png?quality=${op.quality}`} 
                            alt={op.item_id}
                            className={`w-full h-full object-cover relative z-10 scale-[1.15] transition-all ${isRestricted ? 'blur-lg opacity-20 grayscale' : ''}`}
                            onError={(e) => { (e.target as HTMLImageElement).src = 'https://render.albiononline.com/v1/item/T1_TRASH.png'; }}
                          />
                          {isRestricted && (
                            <div className="absolute inset-0 flex items-center justify-center z-20 bg-slate-950/20">
                              <div className="w-10 h-10 bg-amber-500/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                                <Lock className="w-5 h-5 text-amber-500" />
                              </div>
                            </div>
                          )}
                        </div>
                        {isEnchanted && !isRestricted && (
                          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1 z-30 drop-shadow-[0_0_5px_rgba(0,0,0,0.8)]">
                            {[...Array(Number(enchantLevel))].map((_, i) => (
                              <div key={i} className={`w-2.5 h-2.5 rotate-45 rounded-[1px] border-[1.5px] border-black/90 ${enchantColors[enchantLevel]} shadow-[0_0_8px_inherit]`}></div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className={`font-semibold text-base tracking-tight transition-colors flex items-center gap-1.5 ${isRestricted ? 'text-amber-500/40 select-none' : isPrivate ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'text-slate-100 group-hover:text-amber-400'}`} style={{ fontFamily: "'Outfit', sans-serif" }}>
                            {isRestricted ? `TIER ${op.item_id.charAt(1)} PREMIUM ITEM` : inGameName}
                            {!isRestricted && isEnchanted && <span className="text-amber-500/80">.{enchantLevel}</span>}
                            {isRestricted && (
                              <span className="px-1.5 py-0.5 bg-amber-500 text-slate-950 text-[8px] font-black rounded uppercase tracking-tighter shadow-[0_0_10px_rgba(245,158,11,0.4)]">Pro Only</span>
                            )}
                          </div>
                          {!isRestricted && (
                            <button 
                              onClick={() => copyToClipboard(inGameName)}
                              className="opacity-0 group-hover:opacity-100 p-1.5 bg-white/5 hover:bg-white/10 rounded-lg transition-all"
                              title="Copy Name"
                            >
                              <svg className="w-3.5 h-3.5 text-slate-400 hover:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {isPrivate && !isRestricted && (
                            <span className="px-1.5 py-0.5 bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 text-[8px] font-black rounded uppercase tracking-widest shadow-[0_0_10px_rgba(245,158,11,0.5)] flex items-center gap-0.5">
                              <Zap className="w-2 h-2 fill-current" />
                              LIVE SYNC
                            </span>
                          )}
                          <span 
                            className={`inline-block text-[10px] font-black px-2 py-0.5 rounded tracking-wider uppercase ${isRestricted ? 'bg-amber-500/5 text-amber-500/30 border border-amber-500/10' : ''}`}
                            style={!isRestricted ? {
                              ...(op.quality === 5 ? { border: '1px solid #fbbf24', color: '#fbbf24', backgroundColor: 'transparent' } :
                                op.quality === 4 ? { border: '1px solid #ffffff', color: '#ffffff', backgroundColor: 'transparent' } :
                                op.quality === 3 ? { border: 'none', color: '#fdba74', backgroundColor: 'rgba(251,146,60,0.1)' } :
                                op.quality === 2 ? { border: 'none', color: '#7dd3fc', backgroundColor: 'rgba(125,211,252,0.05)' } :
                                { border: 'none', color: '#94a3b8', backgroundColor: 'rgba(30,41,59,0.5)' })
                            } : {}}
                          >
                            {isRestricted ? 'LOCKED CONTENT' : (op.quality === 1 ? 'NORMAL' : op.quality === 2 ? 'GOOD' : op.quality === 3 ? 'OUTSTANDING' : op.quality === 4 ? 'EXCELLENT' : 'MASTERPIECE')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className={`flex flex-col gap-1 items-center transition-all ${isRestricted ? 'opacity-20 grayscale' : ''}`}>
                      <span className={`px-3 py-1 rounded-md text-[10px] font-black border uppercase tracking-[0.1em] shadow-sm min-w-[95px] text-center ${cityStyles[op.buy_from_city] || 'text-slate-400 border-white/10 bg-slate-900'}`} style={{ fontFamily: "'Outfit', sans-serif" }}>
                        {op.buy_from_city}
                      </span>
                      <span className="text-[9px] text-slate-600 font-black uppercase tracking-[0.2em]">City Market</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className={`text-base font-bold transition-all flex items-center justify-center gap-1.5 ${isRestricted ? 'opacity-30' : 'text-slate-200'}`} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {isRestricted ? (
                        <Lock className="w-3 h-3 text-amber-500/50" />
                      ) : (
                        <>
                          <span>{Math.floor(op.buy_price).toLocaleString()}</span>
                          <Coins className="w-4 h-4 text-slate-400" />
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className={`text-base font-bold transition-all flex flex-col items-center gap-1 ${isRestricted ? 'opacity-30' : 'text-slate-200'}`} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      <div className="flex items-center gap-1 flex-wrap justify-center">
                        {isRestricted ? (
                          <Lock className="w-3 h-3 text-amber-500/50" />
                        ) : (
                          <>
                            <span>{Math.floor(op.sell_price).toLocaleString()}</span>
                            <Coins className="w-3.5 h-3.5 text-slate-400" />
                          </>
                        )}
                      </div>
                      {/* Show max price if there's a better order above the bulk price */}
                      {!isRestricted && op.sell_price_max && op.sell_price_max > op.sell_price && (
                        <div className="flex items-center gap-1 text-[9px] text-emerald-400 font-black mt-0.5" title="Some orders fill at higher price">
                          <span className="text-slate-500">↑ best:</span>
                          <span>{Math.floor(op.sell_price_max).toLocaleString()}</span>
                        </div>
                      )}
                      {!isRestricted && op.demand !== undefined && op.demand > 0 && (
                        <div className={`flex items-center gap-1 px-2 py-0.5 rounded border font-black text-[8px] uppercase tracking-wider mt-0.5
                          ${op.demand >= 10 
                            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400' 
                            : op.demand >= 5 
                              ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                              : 'bg-slate-800/80 border-white/10 text-slate-400'
                          }`}
                          title="Total items the Black Market wants to buy"
                        >
                          <svg className="w-2.5 h-2.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                          <span>Wants <b>{op.demand}</b> pcs</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 relative">
                    <div className="flex flex-col items-center gap-2 transition-all">
                      <div className="text-xl font-bold text-emerald-400 flex flex-col items-center gap-3" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        {op.profit >= 1000000 ? (
                          <span className="px-3 py-1 bg-amber-500/20 border border-amber-500/50 rounded-full text-[9px] font-black text-amber-500 uppercase tracking-widest animate-floating animate-glow-gold flex items-center gap-1.5 shadow-[0_0_20px_rgba(245,158,11,0.2)] mb-1">
                            <Zap className="w-3 h-3 fill-current" />👑 ULTRA DEAL
                          </span>
                        ) : op.profit >= 500000 ? (
                          <span className="px-3 py-1 bg-purple-500/20 border border-purple-500/50 rounded-full text-[9px] font-black text-purple-400 uppercase tracking-widest animate-floating animate-glow-purple flex items-center gap-1.5 shadow-[0_0_15px_rgba(168,85,247,0.2)] mb-1">
                            <Zap className="w-3 h-3 fill-current" />✨ SUPER DEAL
                          </span>
                        ) : null}
                        <div className="flex items-center justify-center gap-1.5">
                          <span>+{Math.floor(op.profit).toLocaleString()}</span>
                          <Coins className="w-5 h-5 text-slate-300 drop-shadow-[0_0_8px_rgba(148,163,184,0.4)]" />
                        </div>
                      </div>
                      
                      {isRestricted ? (
                        <Link href="/pricing" className="relative group px-4 py-1.5 bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 text-[9px] font-black rounded-lg shadow-[0_0_15px_rgba(245,158,11,0.2)] hover:shadow-amber-500/40 transition-all overflow-hidden uppercase tracking-wider mt-1">
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-shine" />
                          <span className="relative flex items-center gap-1.5">
                            <Zap className="w-2.5 h-2.5 fill-current" />
                            Unlock Pro
                          </span>
                        </Link>
                      ) : (
                        <div className="flex items-center gap-2 px-2 py-0.5 bg-amber-500/5 rounded border border-amber-500/10">
                          <span className="text-[9px] text-amber-500/70 font-black">TOTAL:</span>
                          <span className="text-[10px] text-amber-500 font-bold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                            {Math.floor(op.profit * (op.demand || 1)).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className={`flex flex-col items-center gap-2 transition-all ${isRestricted ? 'blur-md opacity-20' : ''}`}>
                      <div className="flex items-center gap-2">
                        <div className={`text-xl font-bold ${op.roi_percentage >= 30 ? 'text-amber-500' : op.roi_percentage >= 15 ? 'text-emerald-400' : 'text-slate-400'}`} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                          {op.roi_percentage.toFixed(1)}%
                        </div>
                      </div>
                      <div className="flex flex-wrap justify-center gap-1 max-w-[120px]">
                        {op.demand !== undefined && op.demand >= 10 ? (
                          <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 text-[7px] font-black uppercase rounded-sm border border-blue-500/20 shadow-[0_0_8px_rgba(59,130,246,0.1)]">Bulk</span>
                        ) : null}
                        {op.roi_percentage >= 40 ? (
                          <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 text-[7px] font-black uppercase rounded-sm border border-emerald-500/20">Yield</span>
                        ) : null}
                        {op.item_id.includes('@') ? (
                          <span 
                            onClick={() => setExpandedRow(expandedRow === `${op.item_id}-${op.quality}-${idx}` ? null : `${op.item_id}-${op.quality}-${idx}`)}
                            className="px-1.5 py-0.5 bg-purple-500/10 text-purple-400 text-[7px] font-black uppercase rounded-sm border border-purple-500/20 cursor-pointer hover:bg-purple-500/20 hover:border-purple-500/40 transition-all select-none"
                            title="Click to see enchantment recipe"
                          >Enchant ▾</span>
                        ) : null}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className={`flex flex-col items-center gap-3 transition-all ${isRestricted ? 'blur-md select-none opacity-20' : ''}`}>
                      {(() => {
                        const getDataStatus = (dateString: string) => {
                          const date = new Date(dateString);
                          const now = new Date();
                          const diff = now.getTime() - date.getTime();
                          const mins = Math.floor(diff / 60000);
                          if (mins < 15) return 'fresh';
                          if (mins > 60) return 'stale';
                          return 'normal';
                        };
                        const buyStatus = getDataStatus(op.buy_price_date);
                        const sellStatus = getDataStatus(op.sell_price_date);
                        const isLive = buyStatus === 'fresh' && sellStatus === 'fresh';
                        const isHighRisk = buyStatus === 'stale' || sellStatus === 'stale';
                        return (
                          <>
                            <div className="flex items-center justify-center">
                              {isLive ? (
                                <span className="flex items-center gap-1 text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 shadow-[0_0_10px_rgba(34,197,94,0.2)]">
                                  <Zap className="w-2.5 h-2.5" />
                                  LIVE
                                </span>
                              ) : isHighRisk ? (
                                <span className="flex items-center gap-1 text-[10px] font-black text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                                  <Clock className="w-2.5 h-2.5 text-rose-500" />
                                  RISKY
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-[10px] font-black text-amber-500/60 bg-amber-500/5 px-2 py-0.5 rounded-full border border-amber-500/10">
                                  <Clock className="w-2.5 h-2.5" />
                                  STABLE
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] font-black text-slate-500 text-center space-y-0.5 uppercase tracking-tight">
                              <div className="flex justify-center gap-1.5">
                                <span className="opacity-40">B:</span> 
                                <span className={buyStatus === 'fresh' ? 'text-emerald-400' : buyStatus === 'stale' ? 'text-rose-400' : 'text-slate-400'}>{getTimeAgo(op.buy_price_date)}</span>
                              </div>
                              <div className="flex justify-center gap-1.5">
                                <span className="opacity-40">S:</span> 
                                <span className={sellStatus === 'fresh' ? 'text-emerald-400' : sellStatus === 'stale' ? 'text-rose-400' : 'text-slate-400'}>{getTimeAgo(op.sell_price_date)}</span>
                              </div>
                            </div>

                            {!isRestricted && (
                              <div className="flex items-center gap-2 mt-3 w-full border-t border-white/5 pt-3">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); hideDeal(op); }}
                                  className="flex-1 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 hover:border-rose-500/50 rounded flex items-center justify-center transition-all group"
                                  title="Mark as Stolen (Hide)"
                                >
                                  <svg className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); hideDeal(op); }}
                                  className="flex-1 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 hover:border-emerald-500/50 rounded flex items-center justify-center transition-all group"
                                  title="I Won It! (Hide)"
                                >
                                  <svg className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                </button>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </td>
                </tr>
                {/* Enchantment Recipe Panel */}
                {expandedRow === `${op.item_id}-${op.quality}-${idx}` && isEnchanted && (
                  <tr className="bg-purple-500/[0.03] animate-in fade-in slide-in-from-top-2">
                    <td colSpan={7} className="px-8 py-6 border-b border-purple-500/20">
                      <div className="flex items-start gap-12">
                        <div className="flex flex-col gap-3">
                          <h4 className="text-[10px] font-black text-purple-400 uppercase tracking-[0.3em] flex items-center gap-2">
                            <Zap className="w-3 h-3" /> Enchantment Recipe
                          </h4>
                          <div className="flex items-center gap-6">
                            <div className="flex flex-col">
                              <span className="text-[9px] text-slate-500 font-bold uppercase mb-1">Base Item (.0)</span>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-slate-200">~{Math.floor(op.buy_price * 0.7).toLocaleString()}</span>
                                <Coins className="w-3.5 h-3.5 text-slate-500" />
                              </div>
                            </div>
                            <div className="text-slate-700 text-lg">+</div>
                            <div className="flex flex-col">
                              <span className="text-[9px] text-slate-500 font-bold uppercase mb-1">
                                {getRequiredMaterials(op.item_id)}x {enchantLevel === '1' ? 'Runes' : enchantLevel === '2' ? 'Souls' : 'Relics'}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-slate-200">
                                  {Math.floor(materialPrices[getMaterialId(op.item_id.split('_')[0], enchantLevel)] * getRequiredMaterials(op.item_id) || 0).toLocaleString()}
                                </span>
                                <Coins className="w-3.5 h-3.5 text-slate-500" />
                              </div>
                            </div>
                            <div className="text-slate-700 text-lg">=</div>
                            <div className="flex flex-col">
                              <span className="text-[9px] text-purple-400/70 font-black uppercase mb-1">Total Cost</span>
                              <div className="flex items-center gap-2">
                                <span className="text-lg font-black text-purple-400">
                                  {Math.floor((op.buy_price * 0.7) + (materialPrices[getMaterialId(op.item_id.split('_')[0], enchantLevel)] * getRequiredMaterials(op.item_id) || 0)).toLocaleString()}
                                </span>
                                <Coins className="w-4 h-4 text-purple-500" />
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex-1 bg-white/[0.02] rounded-2xl p-4 border border-white/5">
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Enchantment Flip Analysis</span>
                            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[8px] font-black rounded border border-emerald-500/20 uppercase">Highly Profitable</span>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <div className="text-[9px] text-slate-500 font-bold uppercase">Estimated Net Profit</div>
                              <div className="text-lg font-black text-emerald-400">+{Math.floor(op.sell_price - ((op.buy_price * 0.7) + (materialPrices[getMaterialId(op.item_id.split('_')[0], enchantLevel)] * getRequiredMaterials(op.item_id) || 0))).toLocaleString()} Silver</div>
                            </div>
                            <div className="space-y-1 text-right">
                              <div className="text-[9px] text-slate-500 font-bold uppercase">Material Efficiency</div>
                              <div className="text-lg font-black text-purple-400">Top 5% Market Value</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {opportunities.length === 0 && !loading && (
        <div className="py-20 text-center text-slate-500">
          No profitable opportunities found for current items.
        </div>
      )}
    </div>
  );
}
