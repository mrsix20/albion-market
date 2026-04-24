import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="py-12 border-t border-white/5 bg-slate-950/80 backdrop-blur-md relative z-50">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-center md:text-left text-slate-500 text-sm">
            <p>&copy; {new Date().getFullYear()} Albion Market Analyzer. Not affiliated with Sandbox Interactive GmbH.</p>
          </div>
          
          <div className="flex items-center gap-8 text-sm font-bold text-slate-500">
            <Link href="/" className="hover:text-amber-500 transition-colors">Home</Link>
            <Link href="/tutorial" className="hover:text-amber-500 transition-colors">How it Works</Link>
            <Link href="/pricing" className="hover:text-amber-500 transition-colors">Pricing</Link>
            <Link href="/black-market" className="hover:text-amber-500 transition-colors">Market Tools</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
