"use client";

import Header from "@/components/Header";
import { useState, useEffect, useRef } from "react";
import { getItemPrices, ItemPrice } from "@/lib/api";
import { Search, Zap, Info, Filter, TrendingUp, TrendingDown, Coins, Clock, MapPin, ExternalLink, AlertCircle, ChevronRight, Hash } from "lucide-react";
import { getInGameName } from "@/lib/itemUtils";

interface ItemData {
  id: string;
  name: string;
  tier: number | null;
}

export default function PriceCheckerPage() {
  const [items, setItems] = useState<ItemData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState<ItemData | null>({ id: "T8_MEAL_STEW", name: "Beef Stew [8.0]", tier: 8 });
  const [prices, setPrices] = useState<ItemPrice[]>([]);
  const [loading, setLoading] = useState(false);
  const [quality, setQuality] = useState(1);
  const [suggestions, setSuggestions] = useState<ItemData[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [itemMap, setItemMap] = useState<Record<string, any>>({});
  const searchRef = useRef<HTMLDivElement>(null);

  const cities = ["Black Market", "Caerleon", "Bridgewatch", "Lymhurst", "Martlock", "Thetford", "Fort Sterling", "Brecilien"];

  // Load items database
  useEffect(() => {
    fetch('/items.json')
      .then(res => res.json())
      .then(data => {
        setItems(data);
        const map: Record<string, any> = {};
        data.forEach((item: any) => {
          map[item.id] = item;
        });
        setItemMap(map);
      })
      .catch(err => console.error("Failed to load items database:", err));
  }, []);

  const fetchData = async () => {
    if (!selectedItem) return;
    setLoading(true);
    try {
      const data = await getItemPrices(selectedItem.id, cities, [quality]);
      setPrices(data);
    } catch (error) {
      console.error("Failed to fetch prices:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedItem, quality]);

  // Comprehensive Search System
  useEffect(() => {
    if (searchTerm.length > 1) {
      const query = searchTerm.toLowerCase();
      const filtered = items
        .filter(item => {
          const prettyName = getInGameName(item.id, itemMap);
          return prettyName.toLowerCase().includes(query) || 
                 item.id.toLowerCase().includes(query);
        })
        .slice(0, 10); // Show top 10 matches
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  }, [searchTerm, items]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (suggestions.length > 0) {
      handleSelectItem(suggestions[0]);
    }
  };

  const handleSelectItem = (item: ItemData) => {
    setSelectedItem(item);
    setSearchTerm(getInGameName(item.id, itemMap));
    setSuggestions([]);
    setIsSearchFocused(false);
  };

  const getTimeAgo = (dateString: string) => {
    if (!dateString || dateString.startsWith('0001')) return { text: "N/A", isFresh: false };
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 60000);
    
    if (diff < 1) return { text: "Just now", isFresh: true };
    if (diff < 15) return { text: `${diff}m ago`, isFresh: true };
    if (diff < 60) return { text: `${diff}m ago`, isFresh: false };
    if (diff < 1440) return { text: `${Math.floor(diff / 60)}h ago`, isFresh: false };
    return { text: `${Math.floor(diff / 1440)}d ago`, isFresh: false };
  };

  return (
    <div className="min-h-screen relative bg-slate-950">
      <div className="fixed inset-0 bg-[url('/background.png')] bg-cover bg-center z-0 pointer-events-none brightness-[0.15]" />
      
      <div className="relative z-10 min-h-screen flex flex-col bg-slate-950/40 backdrop-blur-sm">
        <Header />
        
        <main className="container mx-auto px-4 py-12 flex-grow">
          <div className="max-w-6xl mx-auto">
            {/* Header Section */}
            <div className="mb-12 animate-in">
              <div className="flex items-center gap-3 mb-4">
                <div className="px-3 py-1 bg-sky-500/10 border border-sky-500/20 rounded-full text-sky-400 text-[10px] font-black uppercase tracking-widest">
                  Comprehensive Search Active
                </div>
                <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold uppercase">
                  Database: <span className="text-slate-300">{items.length.toLocaleString()} Items</span>
                </div>
              </div>
              <h1 className="text-6xl font-black mb-4 gradient-text">Price Checker</h1>
              <p className="text-slate-400 text-lg max-w-2xl leading-relaxed">
                Enter any item name (e.g., "Beef Stew", "Bag", "Spear") to fetch real-time market data across Albion.
              </p>
            </div>

            {/* Comprehensive Search Card */}
            <div className="glass-morphism rounded-3xl p-8 mb-8 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.4)] animate-in fade-in slide-in-from-bottom-4 relative z-50">
              <form onSubmit={handleSearchSubmit} className="flex flex-wrap gap-6 items-end">
                <div className="flex-grow min-w-[300px] relative" ref={searchRef}>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 ml-1 flex justify-between">
                    <span>Search Item Name</span>
                    <span className="text-amber-500/50">Real-time database search</span>
                  </label>
                  <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-amber-500 transition-colors" />
                    <input 
                      type="text" 
                      placeholder="Type to search items..."
                      value={searchTerm}
                      onFocus={() => setIsSearchFocused(true)}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-slate-950/80 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all shadow-inner font-medium"
                    />
                  </div>

                  {/* Suggestions Dropdown */}
                  {isSearchFocused && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2">
                      {suggestions.map(item => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelectItem(item)}
                          className="w-full text-left px-6 py-4 hover:bg-white/5 flex items-center justify-between group transition-colors border-b border-white/[0.02] last:border-0"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-black rounded-lg border border-white/5 flex items-center justify-center overflow-hidden">
                              <img src={`https://render.albiononline.com/v1/item/${item.id}.png?size=64`} className="w-full h-full object-contain scale-125" alt="" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-white group-hover:text-amber-500">
                                {getInGameName(item.id, itemMap)}
                              </span>
                              <span className="text-[9px] text-slate-500 uppercase font-black">{item.id}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {item.tier && (
                              <span className="text-[10px] font-black text-slate-600 border border-white/5 px-2 py-1 rounded">T{item.tier}</span>
                            )}
                            <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="w-48">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 ml-1">
                    Quality
                  </label>
                  <select 
                    value={quality}
                    onChange={(e) => setQuality(Number(e.target.value))}
                    className="w-full bg-slate-950/80 border border-white/10 rounded-2xl py-4 px-4 text-white outline-none focus:border-amber-500/50 transition-all appearance-none cursor-pointer font-bold"
                  >
                    <option value={1}>Normal</option>
                    <option value={2}>Good</option>
                    <option value={3}>Outstanding</option>
                    <option value={4}>Excellent</option>
                    <option value={5}>Masterpiece</option>
                  </select>
                </div>

                <button type="submit" className="px-8 py-4 bg-amber-500 text-slate-950 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-amber-400 transition-all shadow-[0_10px_25px_rgba(245,158,11,0.3)] active:scale-95 flex items-center gap-2 h-[58px]">
                  <Zap className={`w-4 h-4 fill-current ${loading ? 'animate-pulse' : ''}`} />
                  {loading ? 'Fetching...' : 'Fetch Prices'}
                </button>
              </form>
            </div>

            {/* Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Price Table */}
              <div className="lg:col-span-2 space-y-6">
                <div className="glass-morphism rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative">
                  {loading && (
                    <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-[2px] z-10 flex items-center justify-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">Connecting to Albion Data...</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="px-8 py-6 bg-white/[0.03] border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                        <Coins className="w-5 h-5 text-amber-500" />
                      </div>
                      <div>
                        <h3 className="font-black uppercase tracking-widest text-sm text-white">Live Market Prices</h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">Real-time global aggregation</p>
                      </div>
                    </div>
                    
                    <a 
                      href={`https://www.albion-online-data.com/api/v2/stats/prices/${selectedItem?.id}?locations=${cities.join(',')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-bold text-slate-400 transition-all group"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Verify Data Source
                    </a>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-white/[0.01]">
                          <th className="px-8 py-5">Location</th>
                          <th className="px-8 py-5">Min Sell Price</th>
                          <th className="px-8 py-5">Max Buy Price</th>
                          <th className="px-8 py-5">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.05]">
                        {cities.map((city) => {
                          const priceData = prices.find(p => p.city === city);
                          const timeInfo = getTimeAgo(priceData?.sell_price_min_date || "");
                          
                          return (
                            <tr key={city} className="hover:bg-white/[0.03] transition-all group">
                              <td className="px-8 py-6">
                                <div className="flex items-center gap-4">
                                  <div className={`w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center border border-white/5 group-hover:border-amber-500/40 transition-all shadow-lg`}>
                                    <MapPin className={`w-5 h-5 ${priceData ? 'text-amber-500' : 'text-slate-700'}`} />
                                  </div>
                                  <span className="font-black text-slate-100 tracking-tight">{city}</span>
                                </div>
                              </td>
                              <td className="px-8 py-6">
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-2 font-black text-xl text-emerald-400">
                                    <span>{priceData?.sell_price_min && priceData.sell_price_min > 0 ? priceData.sell_price_min.toLocaleString() : "---"}</span>
                                    {priceData?.sell_price_min && priceData.sell_price_min > 0 && <Coins className="w-4 h-4 text-emerald-500/50" />}
                                  </div>
                                </div>
                              </td>
                              <td className="px-8 py-6">
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-2 font-black text-lg text-slate-300">
                                    <span>{priceData?.buy_price_max && priceData.buy_price_max > 0 ? priceData.buy_price_max.toLocaleString() : "---"}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-8 py-6">
                                <div className="flex flex-col gap-2">
                                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full border w-fit ${timeInfo.isFresh ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'bg-slate-800 border-white/5 text-slate-500'}`}>
                                    <div className={`w-1.5 h-1.5 rounded-full ${timeInfo.isFresh ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`} />
                                    <span className="text-[9px] font-black uppercase tracking-widest">{timeInfo.text}</span>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Sidebar Info */}
              <div className="space-y-6">
                {selectedItem && (
                  <div className="glass-morphism rounded-3xl p-8 border border-white/10 shadow-2xl bg-gradient-to-br from-white/[0.02] to-transparent">
                    <div className="flex flex-col items-center text-center mb-8">
                      <div className="w-32 h-32 bg-slate-950 rounded-3xl border border-white/10 p-4 flex items-center justify-center shadow-2xl relative group">
                        <div className="absolute inset-0 bg-amber-500/5 blur-2xl rounded-full group-hover:bg-amber-500/10 transition-all" />
                        <img 
                          src={`https://render.albiononline.com/v1/item/${selectedItem.id}.png?quality=${quality}`} 
                          alt={selectedItem.name}
                          className="w-full h-full object-contain scale-[1.2] relative z-10"
                        />
                      </div>
                      <h4 className="font-black text-2xl text-white mt-6 leading-tight">
                        {getInGameName(selectedItem.id, itemMap)}
                      </h4>
                      <div className="flex items-center gap-2 mt-3">
                        {selectedItem.tier && (
                          <span className="px-3 py-1 bg-amber-500 text-slate-950 text-[10px] font-black rounded-full uppercase tracking-widest shadow-[0_0_15px_rgba(245,158,11,0.4)]">
                            Tier {selectedItem.tier}
                          </span>
                        )}
                        <span className="px-3 py-1 bg-white/5 border border-white/10 text-slate-400 text-[10px] font-black rounded-full uppercase tracking-widest">
                          Quality {quality}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="p-5 bg-slate-950/80 rounded-2xl border border-white/5 shadow-inner">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-1">Item ID</span>
                        <div className="flex items-center gap-2">
                          <Hash className="w-3 h-3 text-amber-500" />
                          <span className="text-xs font-mono text-slate-300">{selectedItem.id}</span>
                        </div>
                      </div>

                      <div className="p-5 border border-white/5 rounded-2xl flex items-start gap-4 bg-white/[0.01]">
                        <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                          Found an error? Data is provided by players running the AODP client. Accuracy depends on user contributions.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="glass-morphism rounded-3xl p-8 border border-white/10 shadow-2xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
                    <TrendingUp className="w-24 h-24 text-white rotate-12" />
                  </div>
                  <h4 className="font-black text-white text-lg mb-3 uppercase tracking-tighter">Market Strategy</h4>
                  <p className="text-xs text-white/70 leading-relaxed mb-6 font-medium relative z-10">
                    Looking for the best flip? Use our <strong>Black Market Flipper</strong> to see exact profit margins after taxes.
                  </p>
                  <button 
                    onClick={() => window.location.href = '/black-market'}
                    className="w-full py-3 bg-white text-slate-950 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all shadow-xl active:scale-95"
                  >
                    Open Flipper
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>

        <footer className="py-12 border-t border-white/5 bg-slate-950/80 backdrop-blur-md mt-auto">
          <div className="container mx-auto px-6 text-center text-slate-500 text-sm">
            <p>&copy; {new Date().getFullYear()} Albion Market Analyzer. Data provided by AODP.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
