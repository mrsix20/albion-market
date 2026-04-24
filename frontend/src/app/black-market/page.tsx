import Header from "@/components/Header";
import Footer from "@/components/Footer";
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
        
        <Footer />
      </div>
    </div>
  );
}
