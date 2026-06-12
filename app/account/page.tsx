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
 ArrowRight, Box, CreditCard, LogOut, Package, Star, TrendingUp, AlertTriangle, XCircle, CheckCircle2, Clock, Truck, User, Send, StarIcon, MapPin, Plus, Save, Trash2, Home, Mail, ShieldCheck, X, ChevronRight
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
const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string; icon: any }> = {
 Pending: { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', icon: Clock },
 Processing: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', icon: Package },
 Shipped: { color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30', icon: Truck },
 Delivered: { color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30', icon: CheckCircle2 },
 Cancelled: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', icon: XCircle },
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

function CancelCountdown({ order }: { order: Order }) {
 const [remaining, setRemaining] = useState(0);

 useEffect(() => {
 const calc = () => {
 const elapsed = Date.now() - getOrderTimestamp(order);
 const left = Math.max(0, 30 * 60 * 1000 - elapsed);
 setRemaining(left);
 };
 calc();
 const iv = setInterval(calc, 1000);
 return () => clearInterval(iv);
 }, [order]);

 if (remaining === 0) return null;
 const mins = Math.floor(remaining / 60000);
 const secs = Math.floor((remaining % 60000) / 1000);

 return (
 <span className="text-xs text-amber-400 font-mono font-bold flex items-center gap-1">
 <Clock size={11} />
 {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')} left
 </span>
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
 const inp = "w-full px-4 py-2.5 bg-background/40 border border-border text-foreground placeholder:text-gray-600 rounded-xl focus:outline-none focus:border-green-500/60 transition text-sm";

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/70 backdrop-blur-sm">
 <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
 className="w-full max-w-lg glass rounded-2xl border border-border shadow-2xl p-6 space-y-4">
 <div className="flex items-center justify-between mb-2">
 <h3 className="font-bold text-foreground text-lg">Add Delivery Address</h3>
 <button onClick={onClose} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition cursor-pointer"><X size={16} /></button>
 </div>
 <div className="space-y-3">
 <input placeholder="Label (Home, Office…)" value={form.label} onChange={e => setForm(p => ({ ...p, label: e.target.value }))} className={inp} />
 <textarea placeholder="Address Line 1 *" rows={2} value={form.line1} onChange={e => setForm(p => ({ ...p, line1: e.target.value }))} className={`${inp} resize-none`} />
 <input placeholder="Address Line 2 (optional)" value={form.line2} onChange={e => setForm(p => ({ ...p, line2: e.target.value }))} className={inp} />
 <div className="grid grid-cols-3 gap-3">
 <input placeholder="City *" value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} className={inp} />
 <input placeholder="State *" value={form.state} onChange={e => setForm(p => ({ ...p, state: e.target.value }))} className={inp} />
 <input placeholder="Pincode *" value={form.pincode} onChange={e => setForm(p => ({ ...p, pincode: e.target.value }))} className={inp} />
 </div>
 <label className="flex items-center gap-2 cursor-pointer select-none">
 <div onClick={() => setForm(p => ({ ...p, isDefault: !p.isDefault }))}
 className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${form.isDefault ? 'bg-green-500' : 'bg-muted'}`}>
 <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isDefault ? 'translate-x-5' : ''}`} />
 </div>
 <span className="text-sm text-muted-foreground">Set as default address</span>
 </label>
 </div>
 <div className="flex gap-3 pt-2">
 <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-muted-foreground hover:text-foreground text-sm font-semibold transition cursor-pointer">Cancel</button>
 <button onClick={handleSave} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-black font-bold text-sm shadow cursor-pointer">Save Address</button>
 </div>
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
 const [saving, setSaving] = useState(false);
 const [name, setName] = useState('');
 const [phone, setPhone] = useState('');
 const [addresses, setAddresses] = useState<Address[]>([]);
 const [addressDialogOpen, setAddressDialogOpen] = useState(false);
 const [cancellingId, setCancellingId] = useState<string | null>(null);

 // Review System
 const [reviewingItem, setReviewingItem] = useState<{sku: string, name: string, image: string, orderId: string} | null>(null);
 const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
 const [submittingReview, setSubmittingReview] = useState(false);
 const [userReviews, setUserReviews] = useState<any[]>([]);
 const [activeTab, setActiveTab] = useState<'orders' | 'profile' | 'addresses'>('orders');

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
 await updateProfile(auth.currentUser!, { displayName: name });
 await setDoc(doc(db, 'users', user.uid), { uid: user.uid, email: user.email, name, phone, role: 'customer', addresses, updatedAt: new Date() }, { merge: true });
 toast.success('Profile saved!');
 } catch (e: any) { toast.error(e.message || 'Failed to save'); }
 setSaving(false);
 };

 const addAddress = async (form: Omit<Address, 'id'>) => {
 const next: Address = { ...form, id: crypto.randomUUID() };
 const nextList = form.isDefault ? [next, ...addresses.map(a => ({ ...a, isDefault: false }))] : [...addresses, next];
 setAddresses(nextList);
 setAddressDialogOpen(false);
 try {
 await setDoc(doc(db, 'users', user!.uid), { addresses: nextList, updatedAt: new Date() }, { merge: true });
 toast.success('Address added!');
 } catch { toast.error('Failed to save address'); }
 };

 const removeAddress = async (id: string) => {
 const nextList = addresses.filter(a => a.id !== id);
 setAddresses(nextList);
 try { await setDoc(doc(db, 'users', user!.uid), { addresses: nextList, updatedAt: new Date() }, { merge: true }); toast.success('Address removed'); }
 catch { toast.error('Failed to remove address'); }
 };

 const setDefaultAddress = async (id: string) => {
 const nextList = addresses.map(a => ({ ...a, isDefault: a.id === id }));
 setAddresses(nextList);
 try { await setDoc(doc(db, 'users', user!.uid), { addresses: nextList, updatedAt: new Date() }, { merge: true }); toast.success('Default address updated'); }
 catch { toast.error('Failed to update default'); }
 };

 const handleCancelOrder = async (order: Order) => {
 if (!canCancel(order)) { toast.error('Cancellation window has expired'); return; }
 if (!window.confirm('Are you sure you want to cancel this order?')) return;
 setCancellingId(order.id);
 try {
 await updateDoc(doc(db, 'orders', order.id), { status: 'Cancelled', updatedAt: new Date() });
 
 // Restock items
 for (const item of order.items) {
 try {
 const productRef = doc(db, 'products', item.id);
 const productSnap = await getDoc(productRef);
 if (productSnap.exists()) {
 const currentStock = productSnap.data().stock || 0;
 const newStock = currentStock + item.quantity;
 await updateDoc(productRef, { stock: newStock });
 }
 } catch (stockErr) {
 console.error(`Failed to restock item ${item.id}:`, stockErr);
 }
 }

 setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'Cancelled' } : o));
 toast.success('Order cancelled and items restocked successfully');
 } catch { toast.error('Failed to cancel order'); }
 setCancellingId(null);
 };

 const submitReview = async () => {
 if (!reviewingItem) return;
 if (!reviewForm.comment.trim()) {
 toast.error('Please write a review comment.');
 return;
 }
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
 verified: true, // They bought it, so verified!
 createdAt: new Date(),
 };
 const docRef = await addDoc(collection(db, 'reviews'), newReview);
 
 setUserReviews(prev => [...prev, { id: docRef.id, ...newReview }]);
 toast.success('Review submitted successfully! Waiting for approval.');
 setReviewingItem(null);
 setReviewForm({ rating: 5, comment: '' });
 } catch (err) {
 toast.error('Failed to submit review.');
 } finally {
 setSubmittingReview(false);
 }
 };

 const handleLogout = async () => {
 try { await signOut(auth); router.push('/auth/login'); toast.success('Logged out'); }
 catch { toast.error('Failed to log out'); }
 };

 const inp = "w-full px-4 py-2.5 bg-background/30 border border-border text-foreground placeholder:text-gray-600 rounded-xl focus:outline-none focus:border-green-500/60 transition text-sm";

 return (
 <ProtectedRoute>
 <main className="min-h-screen bg-gradient-dark pt-24 pb-16 text-foreground">
 <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

 {/* ── Header ── */}
 <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-3xl font-black text-foreground">My Account</h1>
 <p className="text-muted-foreground text-sm mt-1">{user?.email}</p>
 </div>
 <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 text-sm font-semibold transition cursor-pointer">
 <LogOut size={15} /> Logout
 </button>
 </div>
 </motion.div>

 {/* ── Tab Strip ── */}
 <div className="flex gap-1 p-1 glass rounded-2xl border border-border mb-6">
 {([
 { id: 'orders', label: 'My Orders', icon: Package },
 { id: 'profile', label: 'My Profile', icon: User },
 ] as const).map(tab => (
 <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
 className={`flex items-center justify-center gap-2 flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer ${activeTab === tab.id ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'text-gray-500 hover:text-muted-foreground'}`}>
 <tab.icon size={15} /> {tab.label}
 </button>
 ))}
 </div>

 <AnimatePresence mode="wait">

 {/* ─────────── ORDERS TAB ─────────── */}
 {activeTab === 'orders' && (
 <motion.div key="orders" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-5">
 {loadingOrders ? (
 <div className="flex justify-center py-16"><div className="animate-spin h-8 w-8 border-2 border-green-500 border-t-transparent rounded-full" /></div>
 ) : orders.length === 0 ? (
 <div className="glass rounded-2xl border-2 border-dashed border-border p-12 text-center">
 <Package size={40} className="mx-auto text-gray-600 mb-3" />
 <p className="text-muted-foreground font-semibold">No orders yet</p>
 <p className="text-gray-600 text-sm mt-1">Your orders will appear here after your first purchase</p>
 <Link href="/products" className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 bg-green-500 text-black rounded-xl font-bold text-sm">
 Shop Now <ChevronRight size={14} />
 </Link>
 </div>
 ) : (
 orders.map((order, idx) => {
 const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG['Pending'];
 const StatusIcon = cfg.icon;
 const ts = getOrderTimestamp(order);
 const canBeCancelled = canCancel(order);
 const total = Number(order.totalAmount || 0);
 const discount = Number(order.discountAmount || 0);
 const displayId = order.orderId || order.id;

 return (
 <motion.div key={order.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}
 className="glass rounded-2xl border border-border overflow-hidden">

 {/* Order Header */}
 <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-white/8 bg-white/[0.02]">
 <div className="space-y-0.5">
 <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Order ID</p>
 <p className="font-mono font-bold text-foreground text-sm">{displayId}</p>
 </div>
 <div className="flex items-center gap-3 flex-wrap">
 <span className="text-xs text-gray-500">
 {ts ? new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recently'}
 </span>
 <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
 <StatusIcon size={11} /> {order.status}
 </span>
 </div>
 </div>

 <div className="p-5 space-y-4">
 {/* Items */}
 <div className="space-y-2.5">
 {order.items?.filter(i => !i.isPromo).map((item, i) => (
 <div key={i} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
 <div className="relative w-12 h-12 bg-muted rounded-lg border border-border flex items-center justify-center overflow-hidden flex-shrink-0">
 {item.image ? <Image src={item.image} alt={item.name} fill className="object-contain p-1" /> : <Package size={14} className="text-gray-500" />}
 </div>
 <div className="flex-1 min-w-0">
 <p className="text-sm font-semibold text-foreground truncate">{item.name}</p>
 <p className="text-xs text-gray-500 mt-0.5 flex flex-wrap gap-2">
 {item.flavor && <span>Flavor: <span className="text-muted-foreground">{item.flavor}</span></span>}
 {item.unit && <span>Size: <span className="text-muted-foreground">{item.unit}</span></span>}
 <span>Qty: <span className="text-muted-foreground font-bold">×{item.quantity}</span></span>
 </p>
 {order.status === 'Delivered' && (
 (() => {
 const existingReview = userReviews.find(r => r.orderId === order.id && r.sku === (item.sku || item.id));
 if (existingReview) {
 return (
 <div className="mt-3 p-3 bg-muted border border-border rounded-xl space-y-2">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-1">
 {[...Array(5)].map((_, starIdx) => (
 <StarIcon key={starIdx} size={12} fill={starIdx < existingReview.rating ? "currentColor" : "none"} className={starIdx < existingReview.rating ? "text-yellow-400" : "text-gray-600"} />
 ))}
 </div>
 <span className="text-[10px] font-bold text-muted-foreground uppercase">{existingReview.status === 'approved' ? 'Approved' : existingReview.status === 'pending' ? 'Pending Approval' : 'Rejected'}</span>
 </div>
 <p className="text-xs text-muted-foreground leading-relaxed">"{existingReview.comment}"</p>
 </div>
 );
 }
 return (
 <button 
 onClick={() => setReviewingItem({ sku: item.sku || item.id, name: item.name, image: item.image, orderId: order.id })}
 className="mt-3 text-xs text-green-400 hover:text-green-300 font-bold flex items-center gap-1.5 w-max bg-green-500/10 px-3 py-1.5 rounded-lg border border-green-500/20 transition cursor-pointer"
 >
 <StarIcon size={12} fill="currentColor" /> Rate Product
 </button>
 );
 })()
 )}
 </div>
 <span className="text-sm font-bold text-green-400 flex-shrink-0">
 ₹{(Number(item.price) * item.quantity).toLocaleString()}
 </span>
 </div>
 ))}
 {order.items?.some(i => i.isPromo) && (
 <div className="flex items-center gap-2 pt-1">
 <span className="text-xs bg-green-500/10 text-green-400 border border-green-500/20 px-2.5 py-1 rounded-full font-bold">🎁 Free Gift Included</span>
 </div>
 )}
 </div>

 {/* Bill summary */}
 <div className="bg-background/30 rounded-xl border border-white/8 p-4">
 <div className="space-y-1.5 mb-3">
 {discount > 0 && (
 <div className="flex justify-between text-xs">
 <span className="text-gray-500">Discount Applied</span>
 <span className="text-green-400 font-semibold">− ₹{discount.toLocaleString()}</span>
 </div>
 )}
 <div className="flex justify-between text-xs">
 <span className="text-gray-500">Shipping</span>
 <span className="text-green-400 font-semibold">FREE</span>
 </div>
 </div>
 <div className="flex justify-between items-center pt-2 border-t border-white/8">
 <span className="text-sm font-bold">Total Paid</span>
 <span className="text-lg font-black text-green-400 font-mono">₹{total.toLocaleString()}</span>
 </div>
 {order.paymentMethod && (
 <div className="flex justify-between items-center text-xs mt-1.5">
 <span className="text-gray-600">Payment</span>
 <span className="text-muted-foreground font-bold uppercase">{order.paymentMethod}</span>
 </div>
 )}
 </div>

 {/* Delivery address */}
 {order.address && (
 <div className="flex items-start gap-2.5 p-3 bg-white/3 rounded-xl border border-white/8">
 <MapPin size={14} className="text-green-400 flex-shrink-0 mt-0.5" />
 <div>
 <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Delivering To</p>
 <p className="text-sm text-muted-foreground leading-relaxed">
 {order.address.address}, {order.address.city},{' '}
 {order.address.state} – {order.address.pinCode}
 </p>
 {order.address.alternatePhone && (
 <p className="text-xs text-gray-500 mt-0.5">Alt: {order.address.alternatePhone}</p>
 )}
 </div>
 </div>
 )}

 {/* Tracking */}
 {(order.awbNumber || order.deliveryPartner) && (
 <div className="p-3 bg-purple-500/8 border border-purple-500/20 rounded-xl">
 <p className="text-xs text-purple-400 font-bold mb-2 flex items-center gap-1.5"><Truck size={12} /> Shipment Tracking</p>
 <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
 {order.deliveryPartner && <span className="text-muted-foreground">Courier: <span className="text-foreground font-semibold">{order.deliveryPartner}</span></span>}
 {order.awbNumber && <span className="text-muted-foreground font-mono">AWB: <span className="text-purple-300 font-bold">{order.awbNumber}</span></span>}
 </div>
 </div>
 )}

 {/* Cancel button */}
 {canBeCancelled && order.status !== 'Cancelled' && (
 <div className="flex items-center justify-between p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl">
 <div className="flex items-center gap-2 text-xs text-amber-400">
 <AlertTriangle size={13} />
 <span className="font-semibold">Cancel window open —</span>
 <CancelCountdown order={order} />
 </div>
 <button
 onClick={() => handleCancelOrder(order)}
 disabled={cancellingId === order.id}
 className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/15 text-red-400 border border-red-500/25 text-xs font-bold hover:bg-red-500/25 transition cursor-pointer disabled:opacity-50"
 >
 {cancellingId === order.id
 ? <div className="h-3 w-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
 : <XCircle size={13} />}
 Cancel Order
 </button>
 </div>
 )}
 </div>
 </motion.div>
 );
 })
 )}
 </motion.div>
 )}

 {/* ─────────── PROFILE TAB ─────────── */}
 {activeTab === 'profile' && (
 <motion.div key="profile" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
 className="glass rounded-2xl border border-border p-6 space-y-5 max-w-lg">
 <h2 className="font-bold text-foreground flex items-center gap-2"><User size={16} className="text-green-400" /> Personal Details</h2>

 <div className="space-y-4">
 <div>
 <label className="text-xs text-gray-500 font-bold uppercase tracking-wider block mb-1.5">Full Name</label>
 <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" className={inp} />
 </div>
 <div>
 <label className="text-xs text-gray-500 font-bold uppercase tracking-wider block mb-1.5">Email Address</label>
 <input value={user?.email || ''} disabled className={`${inp} opacity-50 cursor-not-allowed`} />
 </div>
 <div>
 <label className="text-xs text-gray-500 font-bold uppercase tracking-wider block mb-1.5">Phone Number</label>
 <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" className={inp} />
 </div>
 </div>

 <button onClick={saveProfile} disabled={saving}
 className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-black rounded-xl font-bold text-sm shadow cursor-pointer disabled:opacity-50 transition">
 {saving ? <div className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> : <Save size={15} />}
 {saving ? 'Saving…' : 'Save Profile'}
 </button>

 <div className="pt-4 border-t border-border">
 <p className="text-xs text-gray-600 mb-3">Account type: <span className="text-muted-foreground font-semibold">Customer</span></p>
 <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 text-sm font-semibold transition cursor-pointer">
 <LogOut size={14} /> Sign Out
 </button>
 </div>

 {/* ─────────── ADDRESSES (Merged into Profile) ─────────── */}
 <div className="pt-6 mt-6 border-t border-border space-y-4">
 <div className="flex items-center justify-between">
 <h2 className="font-bold text-foreground flex items-center gap-2"><MapPin size={16} className="text-green-400" /> Saved Addresses</h2>
 <button onClick={() => setAddressDialogOpen(true)}
 className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-500/20 border border-green-500/30 text-green-400 text-sm font-bold hover:bg-green-500/30 transition cursor-pointer">
 <Plus size={14} /> Add Address
 </button>
 </div>

 {loading ? (
 <div className="flex justify-center py-8"><div className="animate-spin h-6 w-6 border-2 border-green-500 border-t-transparent rounded-full" /></div>
 ) : addresses.length === 0 ? (
 <div className="glass rounded-2xl border-2 border-dashed border-border p-10 text-center">
 <MapPin size={32} className="mx-auto text-gray-600 mb-3" />
 <p className="text-muted-foreground">No saved addresses yet</p>
 <button onClick={() => setAddressDialogOpen(true)} className="mt-4 text-green-400 text-sm font-semibold hover:text-green-300 cursor-pointer">+ Add your first address</button>
 </div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {addresses.map(addr => (
 <div key={addr.id} className="glass rounded-xl border border-border p-4 space-y-2">
 <div className="flex items-start justify-between">
 <div>
 <div className="flex items-center gap-2">
 <span className="font-bold text-foreground">{addr.label}</span>
 {addr.isDefault && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/20 flex items-center gap-1"><Star size={8} /> Default</span>}
 </div>
 </div>
 <button onClick={() => removeAddress(addr.id)} className="p-1 text-red-400 hover:bg-red-500/10 rounded-lg transition cursor-pointer"><Trash2 size={13} /></button>
 </div>
 <p className="text-sm text-muted-foreground">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}</p>
 <p className="text-sm text-muted-foreground">{addr.city}, {addr.state} – {addr.pincode}</p>
 {!addr.isDefault && (
 <button onClick={() => setDefaultAddress(addr.id)} className="text-xs text-green-400 hover:text-green-300 font-semibold cursor-pointer">Set as default</button>
 )}
 </div>
 ))}
 </div>
 )}
 </div>
 </motion.div>
 )}

 </AnimatePresence>
 </div>

 <AddressDialog open={addressDialogOpen} onClose={() => setAddressDialogOpen(false)} onSave={addAddress} />

 {/* REVIEW MODAL */}
 <AnimatePresence>
 {reviewingItem && (
 <motion.div
 initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
 className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
 >
 <motion.div
 initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
 className="w-full max-w-md glass rounded-3xl border border-border shadow-2xl overflow-hidden"
 >
 <div className="p-5 border-b border-border flex items-center justify-between">
 <h3 className="font-bold text-lg flex items-center gap-2"><StarIcon className="text-yellow-400" fill="currentColor" size={20} /> Write a Review</h3>
 <button onClick={() => setReviewingItem(null)} className="p-2 bg-muted hover:bg-muted rounded-full transition cursor-pointer"><XCircle size={18} className="text-muted-foreground" /></button>
 </div>
 <div className="p-5 space-y-4">
 <div className="flex items-center gap-3 p-3 bg-muted rounded-xl border border-border">
 {reviewingItem.image ? (
 <div className="relative w-12 h-12 flex-shrink-0 bg-muted rounded-md overflow-hidden">
 <Image src={reviewingItem.image} alt="Product" fill className="object-contain" />
 </div>
 ) : <Package size={24} />}
 <p className="text-sm font-bold truncate text-muted-foreground">{reviewingItem.name}</p>
 </div>
 <div>
 <label className="text-xs font-bold text-muted-foreground mb-2 block uppercase tracking-wider">Rating</label>
 <div className="flex gap-2">
 {[1, 2, 3, 4, 5].map(star => (
 <button key={star} type="button" onClick={() => setReviewForm(p => ({ ...p, rating: star }))} className="cursor-pointer transition hover:scale-110">
 <StarIcon size={28} className={star <= reviewForm.rating ? "text-yellow-400" : "text-gray-600"} fill={star <= reviewForm.rating ? "currentColor" : "none"} />
 </button>
 ))}
 </div>
 </div>
 <div>
 <label className="text-xs font-bold text-muted-foreground mb-2 block uppercase tracking-wider">Your Feedback</label>
 <textarea 
 value={reviewForm.comment}
 onChange={(e) => setReviewForm(p => ({ ...p, comment: e.target.value }))}
 placeholder="Tell us what you think about this product..."
 className="w-full bg-muted border border-border rounded-xl p-3 text-sm text-foreground focus:border-green-500/50 outline-none min-h-[100px] resize-none"
 ></textarea>
 </div>
 <button 
 onClick={submitReview}
 disabled={submittingReview}
 className="w-full py-3 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-black font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-green-500/20 disabled:opacity-50"
 >
 {submittingReview ? 'Submitting...' : 'Submit Review'}
 </button>
 </div>
 </motion.div>
 </motion.div>
 )}
 </AnimatePresence>

 </main>
 </ProtectedRoute>
 );
}
