"use client";

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { useSearchParams } from 'next/navigation';
import { Check, Copy, ExternalLink, MessageCircle, ShieldCheck, Zap, ArrowLeft, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const plan = searchParams.get('plan') || 'pro_monthly';
  const [method, setMethod] = useState<'vf_cash' | 'crypto'>('vf_cash');
  const [copied, setCopied] = useState(false);
  const [txId, setTxId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    fetchUser();
  }, []);

  const planDetails: any = {
    'pro_monthly': { 
      name: 'Pro Merchant', 
      duration: '1 Month',
      price: '$9.99', 
      egp: '500 EGP',
      whatsappMsg: "I'd like to subscribe to the Pro Merchant (1 Month) plan."
    },
    'pro_quarterly': { 
      name: 'Elite Trader', 
      duration: '3 Months',
      price: '$24.99', 
      egp: '1250 EGP',
      whatsappMsg: "I'd like to subscribe to the Elite Trader (3 Months) plan."
    },
  };

  const currentPlan = planDetails[plan] || planDetails['pro_monthly'];
  const walletAddress = "T-YOUR-REAL-WALLET-ADDRESS-HERE";
  const vfCashNumber = "01012345678";

  const handleCopy = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmitTx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txId) return;
    
    setIsSubmitting(true);
    setError(null);

    try {
      const { error: insertError } = await supabase
        .from('payments')
        .insert([
          {
            user_id: user?.id,
            user_email: user?.email || 'guest',
            plan_id: plan,
            method: 'crypto',
            amount: currentPlan.price,
            tx_id: txId,
            status: 'pending'
          }
        ]);

      if (insertError) throw insertError;

      setSubmitted(true);
    } catch (err: any) {
      console.error('Error submitting payment:', err);
      setError(err.message || 'Failed to submit payment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // We should also log when they click the WhatsApp button
  const handleVfCashClick = async () => {
    try {
      await supabase
        .from('payments')
        .insert([
          {
            user_id: user?.id,
            user_email: user?.email || 'guest',
            plan_id: plan,
            method: 'vf_cash',
            amount: currentPlan.egp,
            status: 'pending'
          }
        ]);
    } catch (err) {
      console.error('Error logging VF Cash attempt:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0c10] text-slate-200 selection:bg-amber-500/30">
      <Header />
      
      <main className="max-w-7xl mx-auto px-6 pt-40 pb-20">
        <div className="mb-8">
          <Link href="/pricing" className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-sm group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Pricing
          </Link>
        </div>

        {error && (
          <div className="mb-8 bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl flex items-center gap-3 text-rose-400 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Side: Order Summary & Info (4 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-2">
              <h1 className="text-4xl font-black text-white tracking-tight leading-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
                Complete Your <span className="text-amber-500">Empire</span> Upgrade
              </h1>
              <p className="text-slate-400 text-sm">Join thousands of merchants dominating the market.</p>
            </div>
            
            <div className="glass p-8 rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-transparent space-y-6 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-amber-400 to-transparent opacity-50"></div>
              
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Selected Plan</p>
                  <h3 className="text-2xl font-black text-white">{currentPlan.name}</h3>
                  <p className="text-amber-500/80 text-xs font-medium">{currentPlan.duration} Access</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Total Price</p>
                  <p className="text-3xl font-black text-white">{currentPlan.price}</p>
                </div>
              </div>

              <div className="h-px bg-white/10"></div>

              <div className="flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-emerald-500/70 font-black uppercase tracking-wider">Local Currency</p>
                    <p className="text-lg font-black text-emerald-400">{currentPlan.egp}</p>
                  </div>
                </div>
                <div className="text-[10px] text-emerald-500/50 font-bold uppercase italic">Fixed Rate</div>
              </div>

              <div className="space-y-3 pt-2">
                 <div className="flex items-center gap-3 text-xs text-slate-400">
                   <ShieldCheck className="w-4 h-4 text-amber-500" />
                   <span>Instant activation after verification</span>
                 </div>
                 <div className="flex items-center gap-3 text-xs text-slate-400">
                   <Check className="w-4 h-4 text-amber-500" />
                   <span>Priority support channel access</span>
                 </div>
              </div>
            </div>

            {/* Dynamic Testimonial Section */}
            <TestimonialSection />

            {/* Live Feed Component */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                 <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                   <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                   Live Global Upgrades
                 </h3>
              </div>
              <div className="glass rounded-3xl border border-white/5 bg-white/2 p-2 overflow-hidden relative">
                <LiveSalesFeed />
                <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-[#0a0c10] to-transparent z-10"></div>
              </div>
            </div>
          </div>

          {/* Right Side: Payment Methods (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex p-1 bg-white/5 rounded-2xl border border-white/10">
              <button 
                onClick={() => setMethod('vf_cash')}
                className={`flex-1 py-5 px-6 rounded-2xl transition-all flex items-center justify-center gap-4 border ${method === 'vf_cash' ? 'bg-red-600 border-red-500 text-white shadow-[0_10px_40px_rgba(220,38,38,0.3)] scale-[1.02]' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'}`}
              >
                <div className="w-12 h-10 flex items-center justify-center transition-transform group-hover:scale-110">
                   <img src="/icons/vf_cash.png" alt="Vodafone Cash" className="w-full h-full object-contain" />
                </div>
                <span className="text-sm font-black uppercase tracking-widest">Vodafone Cash</span>
              </button>
              
              <button 
                onClick={() => setMethod('crypto')}
                className={`flex-1 py-5 px-6 rounded-2xl transition-all flex items-center justify-center gap-4 border ${method === 'crypto' ? 'bg-emerald-600 border-emerald-500 text-white shadow-[0_10px_40_rgba(16,185,129,0.3)] scale-[1.02]' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'}`}
              >
                <div className="w-10 h-10 flex items-center justify-center transition-transform group-hover:scale-110">
                  <img src="/icons/usdt.png" alt="USDT" className="w-full h-full object-contain" />
                </div>
                <span className="text-sm font-black uppercase tracking-widest">USDT / Crypto</span>
              </button>
            </div>

            <div className="glass p-10 rounded-[2.5rem] border border-white/10 bg-gradient-to-b from-white/5 to-transparent shadow-2xl relative overflow-hidden min-h-[480px] flex flex-col items-center justify-center text-center">
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-amber-500/10 blur-[100px] pointer-events-none"></div>
              <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-500/5 blur-[100px] pointer-events-none"></div>
              
              {method === 'vf_cash' ? (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full max-w-sm">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                      Instant Verification Active
                    </div>
                    <h2 className="text-3xl font-black text-white">Direct Transfer</h2>
                  </div>

                  <div className="p-1 bg-white/5 rounded-3xl border border-white/10">
                    <div className="bg-slate-950/80 p-8 rounded-[1.4rem] border border-white/5 shadow-inner">
                      <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Transfer Destination</p>
                      <p className="text-3xl font-black text-white tracking-[0.15em] mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{vfCashNumber}</p>
                      <p className="text-emerald-500 text-sm font-bold">{currentPlan.egp}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Send the exact amount and share the screenshot on WhatsApp for instant activation.
                    </p>
                    <a 
                      onClick={handleVfCashClick}
                      href={`https://wa.me/201012345678?text=${encodeURIComponent(currentPlan.whatsappMsg)}`} 
                      target="_blank"
                      className="flex items-center justify-center gap-3 w-full py-5 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-[0_15px_30px_-5px_rgba(5,150,105,0.4)] active:scale-[0.98] group"
                    >
                      <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      CONFIRM ON WHATSAPP
                    </a>
                  </div>
                </div>
              ) : (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full max-w-md">
                   {!submitted ? (
                     <>
                        <div className="space-y-4">
                          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                            <img src="/icons/usdt.png" className="w-3 h-3" />
                            USDT (TRC-20) Accepted
                          </div>
                          <h2 className="text-3xl font-black text-white">Crypto Payment</h2>
                        </div>

                        <div className="space-y-4">
                          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Your Deposit Address</p>
                          <div className="bg-slate-950 p-2 rounded-2xl border border-white/10 flex items-center gap-2 group transition-all hover:border-amber-500/30 shadow-2xl">
                            <div className="px-4 py-3 bg-white/5 rounded-xl flex-grow overflow-hidden">
                               <code className="text-amber-500 text-xs font-mono block truncate">{walletAddress}</code>
                            </div>
                            <button 
                              onClick={handleCopy}
                              className={`p-4 rounded-xl transition-all flex items-center justify-center ${copied ? 'bg-emerald-500 text-white' : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'}`}
                            >
                              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                            </button>
                          </div>
                        </div>

                        <div className="h-px bg-white/10 w-1/2 mx-auto"></div>

                        <form onSubmit={handleSubmitTx} className="space-y-4">
                          <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-black">Transaction Verification</p>
                          <div className="relative group">
                            <input 
                              type="text" 
                              value={txId}
                              onChange={(e) => setTxId(e.target.value)}
                              placeholder="Enter Transaction Hash (TxID)..." 
                              className="w-full bg-slate-950/80 border border-white/10 rounded-2xl px-6 py-5 text-sm focus:border-amber-500 outline-none transition-all placeholder:text-slate-800 shadow-inner group-hover:border-white/20" 
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-20 group-focus-within:opacity-100 transition-opacity">
                              <ShieldCheck className="w-5 h-5 text-amber-500" />
                            </div>
                          </div>
                          <button 
                            disabled={!txId || isSubmitting}
                            className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest transition-all shadow-[0_15px_30px_-5px_rgba(245,158,11,0.3)] active:scale-[0.98] flex items-center justify-center gap-3 ${!txId || isSubmitting ? 'bg-white/5 text-slate-600 cursor-not-allowed border border-white/5 shadow-none' : 'bg-amber-500 text-slate-950 hover:bg-amber-400'}`}
                          >
                            {isSubmitting ? (
                              <>
                                <div className="w-5 h-5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin"></div>
                                VERIFYING...
                              </>
                            ) : (
                              <>
                                <Zap className="w-5 h-5" />
                                SUBMIT FOR APPROVAL
                              </>
                            )}
                          </button>
                        </form>
                     </>
                   ) : (
                     <div className="space-y-6 py-12 animate-in zoom-in duration-500">
                        <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.2)]">
                          <Check className="w-12 h-12 text-emerald-500" strokeWidth={3} />
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-2xl font-black text-white">Transaction Submitted</h3>
                          <p className="text-slate-400 text-sm max-w-xs mx-auto">Our system is verifying your payment. This usually takes 5-10 minutes.</p>
                        </div>
                        <Link href="/" className="inline-flex items-center gap-2 text-amber-500 font-bold hover:underline">
                          Return to Dashboard <ExternalLink className="w-4 h-4" />
                        </Link>
                     </div>
                   )}
                </div>
              )}
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-6 pt-4">
              {[
                { icon: ShieldCheck, text: 'SSL Secure', color: 'emerald' },
                { icon: Zap, text: 'Encrypted', color: 'amber' },
                { icon: MessageCircle, text: '24/7 Support', color: 'blue' }
              ].map((badge, i) => (
                <div key={i} className="flex flex-col items-center gap-3 group cursor-default">
                  <div className={`p-4 bg-white/5 rounded-2xl border border-white/5 group-hover:bg-${badge.color}-500/10 group-hover:border-${badge.color}-500/20 transition-all duration-500`}>
                    <badge.icon className={`w-6 h-6 text-${badge.color}-500`} />
                  </div>
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest group-hover:text-slate-300 transition-colors">{badge.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function TestimonialSection() {
  const [index, setIndex] = useState(0);
  const testimonials = [
    {
      initial: 'A',
      text: "The best investment for my Albion character. The profit visibility is a game changer.",
      user: "@Adham_Market",
      role: "Pro Trader"
    },
    {
      initial: 'Z',
      text: "Instant activation and great support. Finally making millions without the headache.",
      user: "@Ziad_Flip",
      role: "Elite Merchant"
    },
    {
      initial: 'K',
      text: "Masterpiece tracking saved me 5M silver today alone. This tool is essential.",
      user: "@Khaled_Elite",
      role: "Pro Merchant"
    },
    {
      initial: 'O',
      text: "Smooth process! Upgraded and got my profit tracking in minutes. Highly recommended.",
      user: "@Omar_99",
      role: "Elite Trader"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % testimonials.length);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const current = testimonials[index];

  return (
    <div className="bg-white/5 border border-white/5 p-5 rounded-2xl flex items-center gap-4 relative group hover:bg-white/10 transition-all duration-500 animate-in fade-in">
      <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-amber-500 font-black text-sm border border-white/5 shadow-inner">
        {current.initial}
      </div>
      <div>
        <p className="text-xs text-slate-300 font-medium italic leading-relaxed transition-all duration-500">"{current.text}"</p>
        <p className="text-[10px] text-slate-500 uppercase mt-2 font-bold tracking-wider">
          <span className="text-amber-500/80">{current.user}</span> • {current.role}
        </p>
      </div>
    </div>
  );
}

function LiveSalesFeed() {
  const [items, setItems] = useState<any[]>([]);

  const firstNames = ['Ahmed', 'Omar', 'Khaled', 'Mustafa', 'Ziad', 'Youssef', 'Kareem', 'Ali', 'Adham', 'Samy', 'Hassan', 'Ibrahim', 'Tarek', 'Amr', 'Mahmoud', 'Zain', 'Mona', 'Sara', 'Laila', 'Noor', 'Hamza', 'Layla', 'Fares', 'Malek'];
  const suffixes = ['_99', '_DZ', '_EG', '_KSA', 'x', '7', '00', '_Trader', '_Market', 'Pro', '88', 'Vip', '_Albion', '01', '_Elite'];
  const countries = [
    { name: 'Cairo', country: 'Egypt' },
    { name: 'Riyadh', country: 'Saudi Arabia' },
    { name: 'Dubai', country: 'UAE' },
    { name: 'Kuwait City', country: 'Kuwait' },
    { name: 'Casablanca', country: 'Morocco' },
    { name: 'Algiers', country: 'Algeria' },
    { name: 'Tunis', country: 'Tunisia' },
    { name: 'Amman', country: 'Jordan' },
    { name: 'Beirut', country: 'Lebanon' },
    { name: 'Doha', country: 'Qatar' },
    { name: 'Manama', country: 'Bahrain' },
    { name: 'Muscat', country: 'Oman' },
    { name: 'Baghdad', country: 'Iraq' },
    { name: 'Tripoli', country: 'Libya' },
    { name: 'Gaza', country: 'Palestine' },
    { name: 'Khartoum', country: 'Sudan' }
  ];
  const plans = ['Elite Trader', 'Pro Merchant'];

  const generateRandomUser = () => {
    const name = firstNames[Math.floor(Math.random() * firstNames.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    const location = countries[Math.floor(Math.random() * countries.length)];
    const plan = plans[Math.floor(Math.random() * plans.length)];
    
    return {
      username: `${name}${Math.random() > 0.5 ? suffix : Math.floor(Math.random() * 99)}`,
      city: location.name,
      country: location.country,
      plan: plan
    };
  };

  useEffect(() => {
    // Initial random items
    setItems([generateRandomUser(), generateRandomUser(), generateRandomUser()]);

    const interval = setInterval(() => {
      setItems(prev => [generateRandomUser(), ...prev.slice(0, 4)]);
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-2 py-2 px-1">
      {items.map((item, idx) => (
        <div 
          key={idx} 
          className={`flex items-center gap-3 p-3 bg-white/5 border border-white/5 rounded-2xl transition-all duration-1000 ${idx === 0 ? 'animate-in fade-in slide-in-from-top-4 bg-amber-500/5 border-amber-500/10' : 'opacity-40 scale-95'}`}
        >
          <div className="w-10 h-10 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center text-amber-500 font-black text-[10px] shadow-inner uppercase">
            {item.username[0]}
          </div>
          <div className="flex-grow">
            <p className="text-[10px] text-white font-bold">@{item.username} <span className="text-slate-500 font-normal">from</span> {item.city}, {item.country}</p>
            <p className="text-[9px] text-slate-400 mt-0.5">Upgraded to <span className="text-amber-500 font-bold">{item.plan}</span></p>
          </div>
          <div className="text-[8px] text-slate-600 font-black uppercase italic whitespace-nowrap">
            {idx === 0 ? 'Just Now' : `${idx * 5}m ago`}
          </div>
        </div>
      ))}
    </div>
  );
}


