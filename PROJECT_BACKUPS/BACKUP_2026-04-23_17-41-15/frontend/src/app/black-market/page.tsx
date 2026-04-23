import Header from "@/components/Header";
import ArbitrageTable from "@/components/ArbitrageTable";

export default function BlackMarketPage() {
  return (
    <div className="min-h-screen relative bg-slate-950">
      {/* Fixed Background Image Layer */}
      <div 
        className="fixed inset-0 bg-[url('/background.png')] bg-cover bg-center z-0 pointer-events-none brightness-[0.25]" 
      />
      
      {/* Content Layer */}
      <div className="relative z-10 min-h-screen flex flex-col bg-slate-950/40 backdrop-blur-sm">
        <Header />
        <main className="container mx-auto px-4 py-8 flex-grow">
          <div className="animate-in">
            <h2 className="text-4xl font-bold mb-2 gradient-text">Black Market Flipper</h2>
            <p className="text-slate-400 mb-8 max-w-2xl">
              Real-time arbitrage opportunities between Royal Cities and the Black Market. 
              Find the best deals and maximize your silver profit.
            </p>
            <ArbitrageTable />
          </div>
        </main>
        
        <footer className="py-8 border-t border-white/5 bg-slate-950/80 backdrop-blur-md mt-auto">
          <div className="container mx-auto px-6 text-center text-slate-500 text-sm">
            <p>&copy; {new Date().getFullYear()} Albion Market Analyzer. Not affiliated with Sandbox Interactive GmbH.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
