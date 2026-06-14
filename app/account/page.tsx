'use client';

import { useEffect, useState, useCallback } from 'react';
import { ProtectedRoute } from '@/components/protected-route';
import { useAuth } from '@/lib/auth-context';
import { auth, db } from '@/lib/firebase';
import { updateProfile, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs, updateDoc, addDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import {
  LogOut, Package, Star, AlertTriangle, XCircle, CheckCircle2, Clock, Truck, User, StarIcon, MapPin, Plus, Save, Trash2, ChevronRight, Check, X
} from 'lucide-react';
import { useRouter } from 'next/navigation';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Address {
  id: string; label: string; line1: string; line2: string;
  city: string; state: string; pincode: string; isDefault: boolean;
}

interface Order {
  id: string; orderId?: string; status: string; totalAmount: number;
  discountAmount?: number; createdAt: any; items: any[];
  awbNumber?: string; deliveryPartner?: string;
  address?: { address?: string; city?: string; state?: string; pinCode?: string; alternatePhone?: string };
  paymentMethod?: string; paymentStatus?: string; email?: string; phone?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string; icon: any; step: number }> = {
  Pending: { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', icon: Clock, step: 1 },
  Processing: { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', icon: Package, step: 2 },
  Shipped: { color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', icon: Truck, step: 3 },
  Delivered: { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: CheckCircle2, step: 4 },
  Cancelled: { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', icon: XCircle, step: 0 },
};

function getOrderTimestamp(order: Order): number {
  if (!order.createdAt) return 0;
  if (order.createdAt?.toMillis) return order.createdAt.toMillis();
  if (order.createdAt?.seconds) return order.createdAt.seconds * 1000;
  return new Date(order.createdAt).getTime();
}

function canCancel(order: Order): boolean {
  if (!['Pending', 'Processing'].includes(order.status)) return false;
  const elapsed = Date.now() - getOrderTimestamp(order);
  return elapsed < 30 * 60 * 1000; // 30 minutes
}

// ─── Timeline Component ───────────────────────────────────────────────────────
function OrderTimeline({ status }: { status: string }) {
  const currentStep = STATUS_CONFIG[status]?.step ?? 0;
  const steps = ['Pending', 'Processing', 'Shipped', 'Delivered'];

  if (status === 'Cancelled') {
    return (
      <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-3 rounded-xl border border-red-100 font-bold">
        <XCircle size={18} /> Order Cancelled
      </div>
    );
  }

  return (
    <div className="relative py-4">
      <div className="absolute left-4 md:left-[10%] right-4 md:right-[10%] top-[2.5rem] h-1 bg-gray-100 rounded-full" />
      <div 
        className="absolute left-4 md:left-[10%] top-[2.5rem] h-1 bg-emerald-500 rounded-full transition-all duration-1000"
        style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
      />
      
      <div className="flex justify-between relative z-10 px-0 md:px-[10%]">
        {steps.map((step, idx) => {
          const stepNum = idx + 1;
          const isCompleted = stepNum < currentStep;
          const isCurrent = stepNum === currentStep;
          const Icon = STATUS_CONFIG[step].icon;

          return (
            <div key={step} className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all duration-500 shadow-sm ${
                isCompleted ? 'bg-emerald-500 text-white border-2 border-emerald-500' :
                isCurrent ? 'bg-white border-2 border-emerald-500 text-emerald-600 ring-4 ring-emerald-50' :
                'bg-white border-2 border-gray-200 text-gray-400'
              }`}>
                {isCompleted ? <Check size={20} strokeWidth={3} /> : <Icon size={18} strokeWidth={isCurrent ? 2.5 : 2} />}
              </div>
              <span className={`text-xs font-bold ${isCompleted || isCurrent ? 'text-gray-900' : 'text-gray-400'}`}>
                {step}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Address Dialog ───────────────────────────────────────────────────────────
function AddressDialog({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (a: Omit<Address, 'id'>) => void }) {
  const [form, setForm] = useState<Omit<Address, 'id'>>({ label: 'Home', line1: '', line2: '', city: '', state: '', pincode: '', isDefault: false });

  const handleSave = () => {
    if (!form.line1 || !form.city || !form.state || !form.pincode) {
      toast.error('Please fill all required address fields');
      return;
    }
    onSave(form);
    setForm({ label: 'Home', line1: '', line2: '', city: '', state: '', pincode: '', isDefault: false });
  };

  if (!open) return null;
  const inp = "w-full px-4 py-3 bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:bg-white focus:outline-none focus:border-emerald-500 transition font-medium";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-8 space-y-5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-black text-gray-900 text-xl tracking-tight">Add Address</h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition cursor-pointer"><X size={20} /></button>
        </div>
        <div className="space-y-4">
          <input placeholder="Label (Home, Office…)" value={form.label} onChange={e => setForm(p => ({ ...p, label: e.target.value }))} className={inp} />
          <textarea placeholder="Address Line 1 *" rows={2} value={form.line1} onChange={e => setForm(p => ({ ...p, line1: e.target.value }))} className={`${inp} resize-none`} />
          <input placeholder="Address Line 2 (optional)" value={form.line2} onChange={e => setForm(p => ({ ...p, line2: e.target.value }))} className={inp} />
          <div className="grid grid-cols-3 gap-3">
            <input placeholder="City *" value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} className={inp} />
            <input placeholder="State *" value={form.state} onChange={e => setForm(p => ({ ...p, state: e.target.value }))} className={inp} />
            <input placeholder="Pincode *" value={form.pincode} onChange={e => setForm(p => ({ ...p, pincode: e.target.value }))} className={inp} />
          </div>
          <label className="flex items-center gap-3 cursor-pointer select-none py-2">
            <div onClick={() => setForm(p => ({ ...p, isDefault: !p.isDefault }))}
              className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer ${form.isDefault ? 'bg-emerald-500' : 'bg-gray-200'}`}>
              <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isDefault ? 'translate-x-6' : ''}`} />
            </div>
            <span className="text-sm font-bold text-gray-700">Set as default address</span>
          </label>
        </div>
        <button onClick={handleSave} className="w-full py-4 rounded-xl bg-gray-900 text-white font-bold shadow-lg shadow-gray-900/10 hover:bg-gray-800 transition cursor-pointer mt-4">Save Address</button>
      </motion.div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AccountPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  
  // Profile State
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  
  // Address State
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Review System
  const [reviewingItem, setReviewingItem] = useState<{sku: string, name: string, image: string, orderId: string} | null>(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [userReviews, setUserReviews] = useState<any[]>([]);
  
  const [activeTab, setActiveTab] = useState<'orders' | 'profile' | 'addresses'>('profile');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab === 'orders' || tab === 'profile' || tab === 'addresses') {
        setActiveTab(tab);
      }
    }
  }, []);

  const fetchUserOrders = useCallback(async () => {
    if (!user) return;
    setLoadingOrders(true);
    try {
      const q = query(collection(db, 'orders'), where('userId', '==', user.uid));
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
      list.sort((a, b) => getOrderTimestamp(b) - getOrderTimestamp(a));
      setOrders(list);

      const rQ = query(collection(db, 'reviews'), where('userId', '==', user.uid));
      const rSnap = await getDocs(rQ);
      setUserReviews(rSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch { } finally { setLoadingOrders(false); }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        const data = snap.data();
        setName(data?.name || user.displayName || '');
        setPhone(data?.phone || '');
        setAddresses(data?.addresses || []);
      } catch { setName(user.displayName || ''); }
      finally { setLoading(false); }
    })();
    fetchUserOrders();
  }, [user, fetchUserOrders]);

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: name });
      }
      // ONLY update the fields that were edited. Do NOT use setDoc with merge.
      await updateDoc(doc(db, 'users', user.uid), { 
        name, 
        phone, 
        updatedAt: new Date() 
      });
      toast.success('Profile saved successfully!');
    } catch (e: any) { 
      toast.error(e.message || 'Failed to save'); 
    }
    setSaving(false);
  };

  const addAddress = async (form: Omit<Address, 'id'>) => {
    const next: Address = { ...form, id: crypto.randomUUID() };
    const nextList = form.isDefault ? [next, ...addresses.map(a => ({ ...a, isDefault: false }))] : [...addresses, next];
    setAddresses(nextList);
    setAddressDialogOpen(false);
    try {
      await updateDoc(doc(db, 'users', user!.uid), { addresses: nextList, updatedAt: new Date() });
      toast.success('Address added!');
    } catch { toast.error('Failed to save address'); }
  };

  const removeAddress = async (id: string) => {
    const nextList = addresses.filter(a => a.id !== id);
    setAddresses(nextList);
    try { await updateDoc(doc(db, 'users', user!.uid), { addresses: nextList, updatedAt: new Date() }); toast.success('Address removed'); }
    catch { toast.error('Failed to remove address'); }
  };

  const setDefaultAddress = async (id: string) => {
    const nextList = addresses.map(a => ({ ...a, isDefault: a.id === id }));
    setAddresses(nextList);
    try { await updateDoc(doc(db, 'users', user!.uid), { addresses: nextList, updatedAt: new Date() }); toast.success('Default address updated'); }
    catch { toast.error('Failed to update default'); }
  };

  const handleCancelOrder = async (order: Order) => {
    if (!canCancel(order)) { toast.error('Cancellation window has expired'); return; }
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    setCancellingId(order.id);
    try {
      await updateDoc(doc(db, 'orders', order.id), { status: 'Cancelled', updatedAt: new Date() });
      
      for (const item of order.items) {
        try {
          const productRef = doc(db, 'products', item.id);
          const productSnap = await getDoc(productRef);
          if (productSnap.exists()) {
            await updateDoc(productRef, { stock: (productSnap.data().stock || 0) + item.quantity });
          }
        } catch (stockErr) { console.error(`Failed to restock item ${item.id}`); }
      }

      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'Cancelled' } : o));
      toast.success('Order cancelled successfully');
    } catch { toast.error('Failed to cancel order'); }
    setCancellingId(null);
  };

  const submitReview = async () => {
    if (!reviewingItem) return;
    if (!reviewForm.comment.trim()) { toast.error('Please write a review comment.'); return; }
    setSubmittingReview(true);
    try {
      const newReview = {
        sku: reviewingItem.sku,
        productName: reviewingItem.name,
        userId: user?.uid,
        userName: user?.displayName || 'NVA Customer',
        rating: reviewForm.rating,
        comment: reviewForm.comment,
        orderId: reviewingItem.orderId,
        status: 'pending',
        verified: true,
        createdAt: new Date(),
      };
      const docRef = await addDoc(collection(db, 'reviews'), newReview);
      setUserReviews(prev => [...prev, { id: docRef.id, ...newReview }]);
      toast.success('Review submitted successfully!');
      setReviewingItem(null);
      setReviewForm({ rating: 5, comment: '' });
    } catch (err) { toast.error('Failed to submit review.'); } 
    finally { setSubmittingReview(false); }
  };

  const handleLogout = async () => {
    try { await signOut(auth); router.push('/auth/login'); toast.success('Logged out'); }
    catch { toast.error('Failed to log out'); }
  };

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-gray-50 pt-28 pb-20 font-sans">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* ── Header ── */}
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-4xl font-black text-gray-900 tracking-tight">My Account</h1>
                <p className="text-gray-500 font-medium mt-1">{user?.email}</p>
              </div>
              <button onClick={handleLogout} className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-sm font-bold transition shadow-sm bg-white">
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          </motion.div>

          {/* ── Premium Tab Strip ── */}
          <div className="flex p-1.5 bg-white rounded-2xl border border-gray-200 shadow-sm mb-8 w-full overflow-x-auto snap-x scrollbar-hide">
            {([
              { id: 'profile', label: 'My Profile', icon: User },
              { id: 'orders', label: 'Order History', icon: Package },
            ] as const).map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl text-sm font-black transition relative whitespace-nowrap min-w-[150px] ${
                    isActive ? 'text-emerald-700' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                  }`}>
                  {isActive && (
                    <motion.div layoutId="account-tab" className="absolute inset-0 bg-emerald-50 border border-emerald-100/50 rounded-xl shadow-sm z-0" transition={{ type: "spring", stiffness: 400, damping: 30 }} />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <tab.icon size={18} strokeWidth={isActive ? 2.5 : 2} /> {tab.label}
                  </span>
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">

            {/* ─────────── PROFILE TAB ─────────── */}
            {activeTab === 'profile' && (
              <motion.div key="profile" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Personal Details */}
                <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] h-max">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
                      <User size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-gray-900 tracking-tight">Personal Details</h2>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Manage your info</p>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className="text-xs font-black text-gray-700 uppercase tracking-widest block mb-2">Full Name</label>
                      <input 
                        value={name} 
                        onChange={e => setName(e.target.value)} 
                        placeholder="John Doe" 
                        className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition font-medium" 
                      />
                    </div>
                    <div>
                      <label className="text-xs font-black text-gray-700 uppercase tracking-widest block mb-2">Email Address</label>
                      <input 
                        value={user?.email || ''} 
                        disabled 
                        className="w-full px-5 py-3.5 bg-gray-100 border border-gray-200 text-gray-500 rounded-xl cursor-not-allowed font-medium" 
                      />
                      <p className="text-xs text-gray-400 font-medium mt-1.5 flex items-center gap-1"><CheckCircle2 size={12} className="text-emerald-500"/> Verified Email</p>
                    </div>
                    <div>
                      <label className="text-xs font-black text-gray-700 uppercase tracking-widest block mb-2">Phone Number</label>
                      <input 
                        value={phone} 
                        onChange={e => setPhone(e.target.value)} 
                        placeholder="+91 98765 43210" 
                        className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition font-medium" 
                      />
                    </div>
                  </div>

                  <button onClick={saveProfile} disabled={saving}
                    className="mt-8 w-full flex items-center justify-center gap-2 px-6 py-4 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-bold text-sm shadow-xl shadow-gray-900/10 cursor-pointer disabled:opacity-50 transition">
                    {saving ? <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={18} />}
                    {saving ? 'Updating...' : 'Update Details'}
                  </button>
                </div>

                {/* Saved Addresses */}
                <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] h-max">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-50 text-gray-600 rounded-full flex items-center justify-center">
                        <MapPin size={24} />
                      </div>
                      <div>
                        <h2 className="text-xl font-black text-gray-900 tracking-tight">Saved Addresses</h2>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Where to ship</p>
                      </div>
                    </div>
                    <button onClick={() => setAddressDialogOpen(true)}
                      className="p-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl transition border border-gray-200">
                      <Plus size={20} />
                    </button>
                  </div>

                  {addresses.length === 0 ? (
                    <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center bg-gray-50/50">
                      <MapPin size={32} className="mx-auto text-gray-300 mb-3" />
                      <p className="text-gray-500 font-medium text-sm">No saved addresses yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {addresses.map(addr => (
                        <div key={addr.id} className="p-5 rounded-2xl border border-gray-100 bg-gray-50/50 relative group">
                          {addr.isDefault && (
                            <span className="absolute -top-3 -right-3 bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
                              <Star size={10} className="fill-emerald-700" /> Default
                            </span>
                          )}
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-bold text-gray-900">{addr.label}</span>
                            <button onClick={() => removeAddress(addr.id)} className="text-red-400 hover:text-red-600 p-1 transition"><Trash2 size={16} /></button>
                          </div>
                          <p className="text-sm text-gray-600 leading-relaxed font-medium">
                            {addr.line1}{addr.line2 ? `, ${addr.line2}` : ''} <br/>
                            {addr.city}, {addr.state} – {addr.pincode}
                          </p>
                          {!addr.isDefault && (
                            <button onClick={() => setDefaultAddress(addr.id)} className="mt-3 text-xs font-black text-emerald-600 uppercase tracking-widest hover:text-emerald-700">Set as default</button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ─────────── ORDERS TAB ─────────── */}
            {activeTab === 'orders' && (
              <motion.div key="orders" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-8">
                {loadingOrders ? (
                  <div className="flex justify-center py-20"><div className="animate-spin h-10 w-10 border-4 border-emerald-500 border-t-transparent rounded-full" /></div>
                ) : orders.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-gray-200 p-16 text-center shadow-sm">
                    <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Package size={48} className="text-gray-300" />
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 mb-2">No orders yet</h3>
                    <p className="text-gray-500 font-medium mb-8">You haven't placed any orders. Start shopping to fuel your performance.</p>
                    <Link href="/products" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black text-sm uppercase tracking-widest shadow-xl shadow-emerald-500/20 transition">
                      Shop Nutrition <ChevronRight size={16} />
                    </Link>
                  </div>
                ) : (
                  orders.map((order, idx) => {
                    const ts = getOrderTimestamp(order);
                    const canBeCancelled = canCancel(order);
                    const total = Number(order.totalAmount || 0);
                    const displayId = order.orderId || order.id;

                    return (
                      <motion.div key={order.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                        className="bg-white rounded-3xl border border-gray-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">

                        {/* Order Header */}
                        <div className="bg-gray-50/50 border-b border-gray-100 px-6 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-1">Order Placed</p>
                            <p className="font-bold text-gray-900">
                              {ts ? new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Recently'}
                            </p>
                          </div>
                          <div className="md:text-right">
                            <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-1">Order Number</p>
                            <p className="font-mono font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100 inline-block">#{displayId}</p>
                          </div>
                        </div>

                        {/* Order Timeline */}
                        <div className="px-6 py-8 border-b border-gray-100 bg-white">
                          <OrderTimeline status={order.status} />
                        </div>

                        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
                          
                          {/* Items Column */}
                          <div className="md:col-span-2 space-y-4">
                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4">Items Details</h3>
                            
                            <div className="space-y-4">
                              {order.items?.map((item, i) => (
                                <div key={i} className="flex flex-col sm:flex-row gap-4 p-4 rounded-2xl border border-gray-100 bg-gray-50/50">
                                  <div className="relative w-24 h-24 bg-white rounded-xl border border-gray-200 overflow-hidden flex-shrink-0 shadow-sm">
                                    {item.image ? <Image src={item.image} alt={item.name} fill className="object-contain p-2" /> : <Package size={24} className="text-gray-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />}
                                  </div>
                                  <div className="flex-1 flex flex-col justify-center">
                                    <h4 className="font-bold text-gray-900 line-clamp-2">{item.name}</h4>
                                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                      {item.flavor && <span className="bg-gray-200/50 px-2.5 py-1 rounded-md">{item.flavor}</span>}
                                      {item.unit && <span className="bg-gray-200/50 px-2.5 py-1 rounded-md">{item.unit}</span>}
                                      <span>Qty: {item.quantity}</span>
                                    </div>
                                    <div className="mt-3 flex items-center justify-between">
                                      <span className="font-black text-gray-900 text-lg">
                                        ₹{(Number(item.price) * item.quantity).toLocaleString()}
                                      </span>
                                      
                                      {/* Review Logic */}
                                      {order.status === 'Delivered' && !item.isPromo && (
                                        (() => {
                                          const existingReview = userReviews.find(r => r.orderId === order.id && r.sku === (item.sku || item.id));
                                          if (existingReview) {
                                            return (
                                              <span className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-lg border border-amber-200">
                                                Review {existingReview.status === 'approved' ? 'Approved' : existingReview.status === 'pending' ? 'Pending' : 'Rejected'}
                                              </span>
                                            );
                                          }
                                          return (
                                            <button 
                                              onClick={() => setReviewingItem({ sku: item.sku || item.id, name: item.name, image: item.image, orderId: order.id })}
                                              className="text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200 transition flex items-center gap-1.5"
                                            >
                                              <StarIcon size={12} fill="currentColor" /> Rate Product
                                            </button>
                                          );
                                        })()
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Summary Column */}
                          <div className="space-y-6">
                            
                            {/* Detailed Bill */}
                            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4">Payment Summary</h3>
                              <div className="space-y-2 mb-4">
                                <div className="flex justify-between text-sm font-medium text-gray-600">
                                  <span>Subtotal</span>
                                  <span>₹{(total + Number(order.discountAmount || 0)).toLocaleString()}</span>
                                </div>
                                {Number(order.discountAmount) > 0 && (
                                  <div className="flex justify-between text-sm font-bold text-emerald-600">
                                    <span>Discount</span>
                                    <span>-₹{Number(order.discountAmount).toLocaleString()}</span>
                                  </div>
                                )}
                                <div className="flex justify-between text-sm font-medium text-gray-600">
                                  <span>Shipping</span>
                                  <span className="text-emerald-600 font-bold">FREE</span>
                                </div>
                              </div>
                              <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                                <span className="text-sm font-black text-gray-900 uppercase">Total Paid</span>
                                <span className="text-xl font-black text-gray-900">₹{total.toLocaleString()}</span>
                              </div>
                              {order.paymentMethod && (
                                <div className="mt-4 px-3 py-2 bg-white rounded-lg border border-gray-200 flex items-center justify-between">
                                  <span className="text-xs font-bold text-gray-500 uppercase">Method</span>
                                  <span className="text-xs font-black text-gray-900 uppercase">{order.paymentMethod}</span>
                                </div>
                              )}
                            </div>

                            {/* Tracking & Address */}
                            <div className="space-y-4">
                              {order.address && (
                                <div className="flex gap-3">
                                  <MapPin size={18} className="text-gray-400 mt-1 flex-shrink-0" />
                                  <div>
                                    <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-1">Delivery Address</p>
                                    <p className="text-sm font-medium text-gray-900 leading-relaxed">
                                      {order.address.address}, {order.address.city}, {order.address.state} {order.address.pinCode}
                                    </p>
                                  </div>
                                </div>
                              )}

                              {(order.awbNumber || order.deliveryPartner) && (
                                <div className="flex gap-3 pt-4 border-t border-gray-100">
                                  <Truck size={18} className="text-purple-500 mt-1 flex-shrink-0" />
                                  <div>
                                    <p className="text-xs font-black text-purple-600 uppercase tracking-widest mb-1">Shipment Info</p>
                                    {order.deliveryPartner && <p className="text-sm font-medium text-gray-900">Courier: {order.deliveryPartner}</p>}
                                    {order.awbNumber && <p className="text-sm font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded mt-1 border border-purple-100 w-max">{order.awbNumber}</p>}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Cancel Button */}
                            {canBeCancelled && order.status !== 'Cancelled' && (
                              <button
                                onClick={() => handleCancelOrder(order)}
                                disabled={cancellingId === order.id}
                                className="w-full py-3 bg-white hover:bg-red-50 text-red-600 border border-red-200 rounded-xl font-bold text-sm transition disabled:opacity-50 flex items-center justify-center gap-2"
                              >
                                {cancellingId === order.id ? <div className="animate-spin h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full" /> : <XCircle size={16} />}
                                Cancel Order
                              </button>
                            )}

                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>
      
      {/* Address Modals */}
      <AddressDialog open={addressDialogOpen} onClose={() => setAddressDialogOpen(false)} onSave={addAddress} />

      {/* Review Modal */}
      <AnimatePresence>
        {reviewingItem && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-black text-gray-900 text-xl tracking-tight flex items-center gap-2">
                  <StarIcon className="text-amber-400" fill="currentColor" size={24} /> Write a Review
                </h3>
                <button onClick={() => setReviewingItem(null)} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition cursor-pointer"><X size={20} /></button>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-200">
                  <div className="relative w-16 h-16 bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm flex-shrink-0">
                    {reviewingItem.image ? <Image src={reviewingItem.image} alt={reviewingItem.name} fill className="object-contain p-1" /> : <Package size={24} className="text-gray-300 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />}
                  </div>
                  <p className="text-sm font-bold text-gray-900 leading-tight">{reviewingItem.name}</p>
                </div>

                <div>
                  <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3 block">Tap to Rate</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button key={star} onClick={() => setReviewForm(p => ({ ...p, rating: star }))} className="transition hover:scale-110 p-1">
                        <StarIcon size={36} className={star <= reviewForm.rating ? "text-amber-400" : "text-gray-200"} fill={star <= reviewForm.rating ? "currentColor" : "none"} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3 block">Your Feedback</label>
                  <textarea 
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm(p => ({ ...p, comment: e.target.value }))}
                    placeholder="Tell us what you loved about this product..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 min-h-[120px] resize-none font-medium transition"
                  />
                </div>

                <button 
                  onClick={submitReview}
                  disabled={submittingReview}
                  className="w-full py-4 rounded-xl bg-gray-900 text-white font-bold shadow-lg shadow-gray-900/10 hover:bg-gray-800 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submittingReview ? <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle2 size={18} />}
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ProtectedRoute>
  );
}
