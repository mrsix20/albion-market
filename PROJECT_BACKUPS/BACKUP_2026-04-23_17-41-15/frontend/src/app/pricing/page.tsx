"use client";

import Header from '@/components/Header';
import Link from 'next/link';

export default function PricingPage() {
  const plans = [
    {
      name: "Starter",
      price: "Free",
      description: "Basic flips for casual players",
      features: [
        "Up to 50,000 profit per flip",
        "Limited item tracking",
        "Community support",
        "Live data (AODP)"
      ],
      cta: "Current Plan",
      highlight: false,
      href: "/"
    },
    {
      name: "Pro Merchant",
      price: "$9.99",
      period: "/month",
      description: "Perfect for starting your empire",
      features: [
        "Unlimited profit visibility",
        "High-tier items (T7 & T8)",
        "Masterpiece quality tracking",
        "Priority live updates",
        "Risk analysis indicators"
      ],
      cta: "Get Started",
      highlight: false,
      href: "/checkout?plan=pro_monthly"
    },
    {
      name: "Elite Trader",
      price: "$24.99",
      period: "/3 months",
      description: "Best value for dedicated flippers",
      features: [
        "All Pro features included",
        "Save 16% vs monthly",
        "Exclusive 'Elite' badge",
        "Priority support",
        "Risk management tools",
        "Private community access"
      ],
      cta: "Claim Offer",
      highlight: true,
      href: "/checkout?plan=pro_quarterly"
    }
  ];

  return (
    <div className="min-h-screen bg-[#0a0c10] text-slate-200">
      <Header />
      
      <main className="max-w-7xl mx-auto px-6 py-24 flex flex-col items-center">
        <div className="text-center mb-16 space-y-4">
          <h1 className="text-5xl md:text-6xl font-black text-white tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Choose Your <span className="text-amber-500">Empire</span> Plan
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Stop leaving silver on the table. Upgrade to Pro and start seeing the deals that make millions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
          {plans.map((plan, idx) => (
            <div 
              key={idx} 
              className={`relative glass p-8 rounded-3xl border transition-all duration-500 hover:scale-[1.02] flex flex-col ${
                plan.highlight 
                  ? 'border-amber-500/50 shadow-[0_0_40px_rgba(245,158,11,0.15)] bg-amber-500/5' 
                  : 'border-white/10 hover:border-white/20 bg-white/5'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-950 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
                  Most Popular
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-4xl font-black text-white">{plan.price}</span>
                  {plan.period && <span className="text-slate-500 text-sm">{plan.period}</span>}
                </div>
                <p className="text-slate-400 text-sm">{plan.description}</p>
              </div>

              <div className="space-y-4 mb-10 flex-grow">
                {plan.features.map((feature, fIdx) => (
                  <div key={fIdx} className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${plan.highlight ? 'bg-amber-500/20 text-amber-500' : 'bg-slate-800 text-slate-400'}`}>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                    </div>
                    <span className="text-sm text-slate-300">{feature}</span>
                  </div>
                ))}
              </div>

              <Link 
                href={plan.href}
                className={`w-full py-4 rounded-xl text-sm font-black uppercase tracking-widest transition-all text-center ${
                  plan.highlight 
                    ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)]' 
                    : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-20 text-center space-y-6">
          <p className="text-slate-500 text-sm flex items-center justify-center gap-4">
            <span className="flex items-center gap-2"><svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg> Secure Payment by Stripe</span>
            <span className="w-1.5 h-1.5 bg-slate-800 rounded-full"></span>
            <span>Cancel anytime</span>
            <span className="w-1.5 h-1.5 bg-slate-800 rounded-full"></span>
            <span>24/7 Support</span>
          </p>
          <div className="flex justify-center gap-8 opacity-40 grayscale contrast-125">
            <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" alt="Stripe" className="h-6" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-6" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-6" />
          </div>
        </div>
      </main>
    </div>
  );
}
