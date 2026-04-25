"use client";

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { supabase } from '@/lib/supabaseClient';
import { 
  Users, 
  Search, 
  Edit2, 
  Trash2, 
  Shield, 
  Crown, 
  Star, 
  Save, 
  X, 
  RefreshCw,
  Search as SearchIcon,
  User as UserIcon,
  Check
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function UserManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' | null }>({ message: '', type: null });

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: '', type: null }), 5000);
  };
  const router = useRouter();

  // Form State for Editing
  const [editForm, setEditForm] = useState({
    full_name: '',
    points: 0,
    rank: '',
    role: '',
    is_admin: false,
    is_founder: false,
    is_verified: false
  });

  useEffect(() => {
    checkAdmin();
    fetchUsers();
  }, []);

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!['admin', 'owner', 'founder'].includes(profile?.role)) {
      router.push('/profile');
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name');

      if (error) {
        console.error('Detailed Supabase Error:', error);
        throw new Error(error.message || 'Unknown database error');
      }
      setUsers(data || []);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      alert(`Database Error: ${err.message}\n\nNote: This is likely a Supabase RLS Policy issue. You need to enable "Select" access for Admins on the profiles table.`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (user: any) => {
    setSelectedUser(user);
    setEditForm({
      full_name: user.full_name || '',
      points: user.points || 0,
      rank: user.rank || 'Novice',
      role: user.role || 'free',
      is_admin: user.is_admin || false,
      is_founder: user.is_founder || false,
      is_verified: user.is_verified || false
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    setUpdating(true);
    try {
      const updateData = {
        full_name: editForm.full_name,
        rank: editForm.rank,
        role: editForm.role,
        points: editForm.points,
        is_admin: editForm.is_admin,
        is_founder: editForm.is_founder,
        is_verified: editForm.is_verified
      };

      const { data: updatedData, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', selectedUser.id)
        .select();

      if (error) throw error;

      if (updatedData && updatedData.length > 0) {
        showNotification(`Success! User ${editForm.full_name} is now ${updatedData[0].rank}`, 'success');
      }
      
      await fetchUsers();
      setIsEditModalOpen(false);
    } catch (err: any) {
      console.error('Update operation failed:', err);
      showNotification(`Update failed: ${err.message || 'Unknown database error'}`, 'error');
    } finally {
      setUpdating(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#020408] text-slate-200 font-inter relative overflow-hidden">
      {/* Premium Toast Notification */}
      {notification.type && (
        <div className={`fixed top-24 right-8 z-[999] flex items-center gap-4 px-6 py-4 rounded-2xl border backdrop-blur-xl shadow-2xl animate-in slide-in-from-right-10 duration-500
          ${notification.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
            : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center 
            ${notification.type === 'success' ? 'bg-emerald-500/20' : 'bg-rose-500/20'}`}>
            {notification.type === 'success' ? <Check className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-0.5">System Update</p>
            <p className="text-sm font-bold">{notification.message}</p>
          </div>
          <button onClick={() => setNotification({ message: '', type: null })} className="ml-4 opacity-30 hover:opacity-100 transition-opacity">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Decorative Background Elements */}
      <Header />
      
      <main className="max-w-7xl mx-auto px-6 pt-32 pb-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
              <Users className="w-10 h-10 text-blue-500" />
              User Management
            </h1>
            <p className="text-slate-400">Total Registered Members: {users.length}</p>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl pl-12 pr-6 py-3 text-sm focus:border-blue-500 outline-none transition-all w-full md:w-64"
                />
             </div>
             <button 
                onClick={fetchUsers}
                className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-slate-400 hover:text-white"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
             </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="glass rounded-[2.5rem] border border-white/10 bg-white/[0.02] overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">User Profile</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status & Rank</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Admin Status</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={4} className="px-8 py-10 h-24 bg-white/[0.01]"></td>
                    </tr>
                  ))
                ) : filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-white/[0.03] transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-white/5 flex items-center justify-center overflow-hidden">
                            {user.avatar_url ? (
                              <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                              <UserIcon className="w-6 h-6 text-slate-600" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="text-white font-bold">{user.full_name || 'Unnamed'}</p>
                              {user.is_verified && (
                                <img 
                                  src="https://www.f-cdn.com/assets/main/en/assets/badges/verified/verified-v2.svg" 
                                  alt="Verified" 
                                  className="w-3.5 h-3.5" 
                                />
                              )}
                              {user.is_founder && <Crown className="w-3 h-3 text-amber-500" />}
                              {user.is_admin && !user.is_founder && <Shield className="w-3 h-3 text-blue-500" />}
                            </div>
                            <p className="text-[11px] text-slate-500 font-medium">{user.email || 'No Email'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider 
                              ${user.role === 'elite' ? 'bg-amber-500/20 text-amber-500' : 
                                user.role === 'pro' ? 'bg-blue-500/20 text-blue-500' : 
                                'bg-slate-700/30 text-slate-400'}`}>
                              {user.role || 'FREE'}
                            </span>
                            <span className="text-[10px] font-bold text-slate-300 italic">{user.rank || 'Novice'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                            <Star className="w-3 h-3 text-amber-500" /> {user.points || 0} Points
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center justify-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${user.is_admin || user.is_founder ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-700'}`}></div>
                          <span className="text-[10px] font-black uppercase text-slate-400">
                            {user.is_founder ? 'Founder' : user.is_admin ? 'Admin' : 'Member'}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button 
                          onClick={() => handleEditClick(user)}
                          className="p-3 bg-white/5 border border-white/5 rounded-xl text-slate-400 hover:text-white hover:bg-blue-600/20 hover:border-blue-500/50 transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-8 py-20 text-center">
                       <div className="flex flex-col items-center gap-3 text-slate-500">
                          <Search className="w-10 h-10 opacity-20" />
                          <p className="text-sm font-medium">No users found.</p>
                       </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Edit User Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="glass w-full max-w-xl rounded-[2.5rem] border border-white/10 bg-slate-900 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-10 space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20 text-blue-500">
                    <Edit2 className="w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white">Edit Profile</h2>
                    <p className="text-slate-500 text-sm">{selectedUser?.email}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-400"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* Full Name */}
                <div className="col-span-2 space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Display Name</label>
                  <input 
                    type="text" 
                    value={editForm.full_name}
                    onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-white outline-none focus:border-blue-500 transition-all"
                  />
                </div>

                {/* Points */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">XP Points</label>
                  <input 
                    type="number" 
                    value={editForm.points}
                    onChange={(e) => setEditForm({...editForm, points: parseInt(e.target.value)})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-white outline-none focus:border-blue-500 transition-all"
                  />
                </div>

                {/* Rank */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Rank Title</label>
                  <select 
                    value={editForm.rank}
                    onChange={(e) => setEditForm({...editForm, rank: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-3 text-white outline-none focus:border-blue-500 transition-all appearance-none"
                  >
                    <option value="Beginner" className="bg-[#0d1117] text-white">Beginner</option>
                    <option value="Novice" className="bg-[#0d1117] text-white">Novice</option>
                    <option value="Apprentice" className="bg-[#0d1117] text-white">Apprentice</option>
                    <option value="Journeyman" className="bg-[#0d1117] text-white">Journeyman</option>
                    <option value="Merchant" className="bg-[#0d1117] text-white">Merchant</option>
                    <option value="Expert Trader" className="bg-[#0d1117] text-white">Expert Trader</option>
                    <option value="Master Trader" className="bg-[#0d1117] text-white">Master Trader</option>
                    <option value="Market Mastermind" className="bg-[#0d1117] text-white">Market Mastermind</option>
                    <option value="Legendary" className="bg-[#0d1117] text-white">Legendary</option>
                  </select>
                </div>

                {/* Role */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Membership</label>
                  <select 
                    value={editForm.role}
                    onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-3 text-white outline-none focus:border-blue-500 transition-all appearance-none"
                  >
                    <option value="free" className="bg-[#0d1117] text-white">Free</option>
                    <option value="pro" className="bg-[#0d1117] text-white">Pro</option>
                    <option value="elite" className="bg-[#0d1117] text-white">Elite</option>
                    <option value="admin" className="bg-[#0d1117] text-white">Admin</option>
                    <option value="owner" className="bg-[#0d1117] text-white">Owner</option>
                  </select>
                </div>

                {/* Status Toggles */}
                <div className="flex flex-wrap items-center gap-8 pt-4">
                   <label className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={editForm.is_admin} 
                        onChange={(e) => setEditForm({...editForm, is_admin: e.target.checked})}
                        className="w-5 h-5 rounded-md border-white/10 bg-white/5 text-blue-500 focus:ring-0 outline-none"
                      />
                      <span className="text-xs font-bold text-slate-400 group-hover:text-white transition-colors">Admin Access</span>
                   </label>
                   <label className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={editForm.is_founder} 
                        onChange={(e) => setEditForm({...editForm, is_founder: e.target.checked})}
                        className="w-5 h-5 rounded-md border-white/10 bg-white/5 text-amber-500 focus:ring-0 outline-none"
                      />
                      <span className="text-xs font-bold text-slate-400 group-hover:text-white transition-colors">Founder Status</span>
                   </label>
                   <label className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={editForm.is_verified} 
                        onChange={(e) => setEditForm({...editForm, is_verified: e.target.checked})}
                        className="w-5 h-5 rounded-md border-white/10 bg-white/5 text-blue-400 focus:ring-0 outline-none"
                      />
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-400 group-hover:text-white transition-colors">Verified Account</span>
                        <img 
                          src="https://www.f-cdn.com/assets/main/en/assets/badges/verified/verified-v2.svg" 
                          alt="Verified" 
                          className="w-4 h-4" 
                        />
                      </div>
                   </label>
                </div>
              </div>

              <button 
                onClick={handleUpdateUser}
                disabled={updating}
                className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:shadow-[0_0_30px_rgba(37,99,235,0.4)] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {updating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
