"use client";

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { supabase } from '@/lib/supabaseClient';
import { ShieldCheck, Clock, CheckCircle2, XCircle, ExternalLink, RefreshCw, User, Search, X, Info, CreditCard, Hash, Mail, Calendar } from 'lucide-react';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('payments')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      
      const updatedOrders = orders.map(o => o.id === id ? { ...o, status: newStatus } : o);
      setOrders(updatedOrders);
      
      if (selectedOrder && selectedOrder.id === id) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const filteredOrders = orders.filter(order => 
    order.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.tx_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.plan_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'rejected': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default: return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0c10] text-slate-200">
      <Header />
      
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-3" style={{ fontFamily: "'Outfit', sans-serif" }}>
              <ShieldCheck className="w-10 h-10 text-amber-500" />
              Order Management
            </h1>
            <p className="text-slate-400">Review and verify all incoming payment requests.</p>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-amber-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Search email, TxID, or plan..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl pl-12 pr-6 py-3 text-sm focus:border-amber-500 outline-none transition-all w-full md:w-64"
                />
             </div>
             <button 
                onClick={fetchOrders}
                className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-slate-400 hover:text-white"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
             </button>
          </div>
        </div>

        <div className="glass rounded-[2rem] border border-white/10 bg-white/2 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Order Details</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">User Info</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Payment Data</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={5} className="px-8 py-10 h-20 bg-white/2"></td>
                    </tr>
                  ))
                ) : filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="space-y-1">
                          <p className="text-white font-bold text-sm">{order.plan_id.replace('_', ' ').toUpperCase()}</p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500">
                             <Clock className="w-3 h-3" />
                             {new Date(order.created_at).toLocaleString()}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-amber-500 transition-colors border border-white/5">
                             <User className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm text-slate-200 font-medium">{order.user_email}</p>
                            <p className="text-[10px] text-slate-600 font-mono">{order.user_id?.slice(0, 8) || 'GUEST'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="space-y-2">
                           <div className="flex items-center gap-2">
                             <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${order.method === 'crypto' ? 'bg-amber-500/20 text-amber-500' : 'bg-red-500/20 text-red-500'}`}>
                               {order.method}
                             </span>
                             <span className="text-white font-black text-sm">{order.amount}</span>
                           </div>
                           {order.tx_id && (
                             <div className="flex items-center gap-2 group/tx">
                               <code className="text-[10px] text-slate-500 font-mono bg-slate-950 px-2 py-1 rounded border border-white/5 max-w-[150px] truncate">{order.tx_id}</code>
                               <a 
                                 href={`https://tronscan.org/#/transaction/${order.tx_id}`} 
                                 target="_blank"
                                 className="opacity-0 group-hover/tx:opacity-100 transition-opacity text-amber-500"
                               >
                                 <ExternalLink className="w-3 h-3" />
                               </a>
                             </div>
                           )}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border ${getStatusStyle(order.status)}`}>
                          {order.status === 'pending' && <Clock className="w-3 h-3" />}
                          {order.status === 'verified' && <CheckCircle2 className="w-3 h-3" />}
                          {order.status === 'rejected' && <XCircle className="w-3 h-3" />}
                          {order.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {order.status === 'pending' && (
                            <>
                              <button 
                                onClick={() => updateStatus(order.id, 'verified')}
                                className="p-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-lg transition-all border border-emerald-500/20"
                                title="Verify Order"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => updateStatus(order.id, 'rejected')}
                                className="p-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white rounded-lg transition-all border border-rose-500/20"
                                title="Reject Order"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button 
                            onClick={() => setSelectedOrder(order)}
                            className="p-2 bg-white/5 text-slate-400 hover:text-white rounded-lg transition-all border border-white/5"
                            title="View Details"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center">
                       <div className="flex flex-col items-center gap-3 text-slate-500">
                          <Clock className="w-10 h-10 opacity-20" />
                          <p className="text-sm font-medium">No orders found matching your search.</p>
                       </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="glass w-full max-w-2xl rounded-[2.5rem] border border-white/10 bg-slate-900 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="relative p-10 space-y-8">
              <button 
                onClick={() => setSelectedOrder(null)}
                className="absolute top-8 right-8 p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-slate-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center border border-amber-500/20 text-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.1)]">
                   <Info className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-white">Order Details</h2>
                  <p className="text-slate-400 text-sm">Full breakdown of the payment request</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/2 border border-white/5 p-6 rounded-2xl space-y-4">
                   <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-slate-500" />
                      <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">User Email</span>
                   </div>
                   <p className="text-white font-bold">{selectedOrder.user_email}</p>
                </div>

                <div className="bg-white/2 border border-white/5 p-6 rounded-2xl space-y-4">
                   <div className="flex items-center gap-3">
                      <CreditCard className="w-4 h-4 text-slate-500" />
                      <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Selected Plan</span>
                   </div>
                   <p className="text-white font-bold">{selectedOrder.plan_id.replace('_', ' ').toUpperCase()}</p>
                </div>

                <div className="bg-white/2 border border-white/5 p-6 rounded-2xl space-y-4">
                   <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-slate-500" />
                      <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Order Date</span>
                   </div>
                   <p className="text-white font-bold">{new Date(selectedOrder.created_at).toLocaleString()}</p>
                </div>

                <div className="bg-white/2 border border-white/5 p-6 rounded-2xl space-y-4">
                   <div className="flex items-center gap-3">
                      <Hash className="w-4 h-4 text-slate-500" />
                      <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Amount</span>
                   </div>
                   <p className="text-emerald-400 font-black text-xl">{selectedOrder.amount}</p>
                </div>
              </div>

              {selectedOrder.tx_id && (
                <div className="bg-slate-950 p-6 rounded-2xl border border-white/5 space-y-3">
                   <div className="flex items-center justify-between">
                     <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Crypto Transaction ID</span>
                     <a href={`https://tronscan.org/#/transaction/${selectedOrder.tx_id}`} target="_blank" className="text-amber-500 text-[10px] font-bold flex items-center gap-1 hover:underline">
                       VERIFY ON BLOCKCHAIN <ExternalLink className="w-3 h-3" />
                     </a>
                   </div>
                   <code className="text-amber-500 text-xs font-mono break-all bg-white/2 p-2 rounded block">{selectedOrder.tx_id}</code>
                </div>
              )}

              <div className="flex flex-col md:flex-row items-center gap-4 pt-4">
                 <div className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-xl border text-sm font-black uppercase tracking-widest ${getStatusStyle(selectedOrder.status)}`}>
                    {selectedOrder.status.toUpperCase()}
                 </div>
                 
                 {selectedOrder.status === 'pending' && (
                    <div className="flex items-center gap-2 w-full md:w-auto">
                       <button 
                        onClick={() => updateStatus(selectedOrder.id, 'verified')}
                        className="flex-1 md:flex-none px-6 py-4 bg-emerald-600 text-white rounded-xl font-black uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-[0_10px_30px_rgba(16,185,129,0.3)]"
                       >
                         Approve
                       </button>
                       <button 
                        onClick={() => updateStatus(selectedOrder.id, 'rejected')}
                        className="flex-1 md:flex-none px-6 py-4 bg-rose-600 text-white rounded-xl font-black uppercase tracking-widest hover:bg-rose-500 transition-all shadow-[0_10px_30px_rgba(225,68,68,0.3)]"
                       >
                         Reject
                       </button>
                    </div>
                 )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
