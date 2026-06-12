'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
 ArrowLeft, Clock, CreditCard, User, Phone, MapPin, Package,
 Truck, X, Send, CheckCircle2, AlertCircle, Tag, XCircle,
 Receipt, TrendingDown, IndianRupee, ShieldCheck
} from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface OrderItem {
 id: string;
 name: string;
 price: number;
 originalPrice?: number;
 quantity: number;
 flavor?: string;
 unit?: string;
 sku?: string;
 isPromo?: boolean;
 image?: string;
}

interface Order {
 id: string;
 customerName: string;
 email: string;
 phone: string;
 address: {
 address: string;
 city: string;
 state: string;
 pinCode: string;
 alternatePhone?: string;
 };
 totalAmount: number;
 discountAmount?: number;
 status: string;
 paymentStatus?: string;
 items: OrderItem[];
 createdAt: any;
 paymentMethod?: string;
 userId?: string;
 awbNumber?: string;
 deliveryPartner?: string;
 orderId?: string;
}

const statusOptions = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'RTO'];

const getStatusConfig = (status: string) => {
  const cfg: Record<string, { color: string; bg: string; icon: any; dot: string }> = {
  Pending:    { color: 'text-amber-700',  bg: 'bg-amber-50 border-amber-200',   icon: Clock,        dot: 'bg-amber-400' },
  Processing: { color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200',     icon: Package,      dot: 'bg-blue-400' },
  Shipped:    { color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200', icon: Truck,        dot: 'bg-purple-400' },
  Delivered:  { color: 'text-green-700',  bg: 'bg-green-50 border-green-200',   icon: CheckCircle2, dot: 'bg-green-400' },
  Cancelled:  { color: 'text-red-700',    bg: 'bg-red-50 border-red-200',       icon: AlertCircle,  dot: 'bg-red-400' },
  RTO:        { color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200', icon: XCircle,      dot: 'bg-orange-400' },
  };
  return cfg[status] || { color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200', icon: Clock, dot: 'bg-gray-400' };
};

export default function OrderDetailsPage() {
 const params = useParams();
 const id = params?.id as string;
 const [order, setOrder] = useState<Order | null>(null);
 const [loading, setLoading] = useState(true);

 // Tracking state
 const [awbNumber, setAwbNumber] = useState('');
 const [deliveryPartner, setDeliveryPartner] = useState('');
 const [savingTracking, setSavingTracking] = useState(false);

 // Shipping dialog state
 const [showShipDialog, setShowShipDialog] = useState(false);
 const [pendingStatus, setPendingStatus] = useState('');
 const [shipCourier, setShipCourier] = useState('');
 const [shipAwb, setShipAwb] = useState('');
 const [sendingEmail, setSendingEmail] = useState(false);
 const [showStatusActionDialog, setShowStatusActionDialog] = useState(false);
 const [pendingActionStatus, setPendingActionStatus] = useState('');

 const router = useRouter();

 useEffect(() => {
 if (id) fetchOrder();
 }, [id]);

 const fetchOrder = async () => {
 try {
 const docRef = doc(db, 'orders', id);
 const docSnap = await getDoc(docRef);
 if (docSnap.exists()) {
 const data = docSnap.data() as Order;
 setOrder({ ...data, id: docSnap.id });
 setAwbNumber(data.awbNumber || '');
 setDeliveryPartner(data.deliveryPartner || '');
 } else {
 toast.error('Order not found');
 router.push('/admin/orders');
 }
 } catch (err) {
 toast.error('Failed to load order');
 } finally {
 setLoading(false);
 }
 };

 const handleStatusChange = (newStatus: string) => {
 if (newStatus === 'Shipped') {
 setPendingStatus(newStatus);
 setShipCourier(deliveryPartner);
 setShipAwb(awbNumber);
 setShowShipDialog(true);
 } else if (newStatus === 'RTO' || newStatus === 'Cancelled' || newStatus === 'Delivered') {
 setPendingActionStatus(newStatus);
 setShowStatusActionDialog(true);
 } else {
 updateOrderStatus(newStatus, false);
 }
 };

 const updateOrderStatus = async (newStatus: string, saveTracking = false) => {
 if (!order) return;
 try {
 const updateData: any = { status: newStatus, updatedAt: new Date() };
 if (saveTracking) {
 updateData.awbNumber = shipAwb;
 updateData.deliveryPartner = shipCourier;
 }
 await updateDoc(doc(db, 'orders', order.id), updateData);
 setOrder({ ...order, status: newStatus, ...(saveTracking ? { awbNumber: shipAwb, deliveryPartner: shipCourier } : {}) });
 if (saveTracking) {
 setAwbNumber(shipAwb);
 setDeliveryPartner(shipCourier);
 }
 toast.success(`Status updated to ${newStatus}`);
 } catch {
 toast.error('Failed to update status');
 }
 };

 const handleConfirmShipped = async (sendEmail: boolean) => {
 setSendingEmail(true);
 try {
 await updateOrderStatus(pendingStatus, true);

 if (sendEmail && order) {
 const res = await fetch('/api/send-shipping', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 orderId: order.orderId || order.id,
 customerName: order.customerName,
 email: order.email,
 courierPartner: shipCourier,
 awbNumber: shipAwb,
 totalAmount: order.totalAmount,
 items: order.items,
 address: order.address,
 }),
 });
 if (res.ok) toast.success('✉️ Shipping email sent to customer!');
 else toast.error('Status updated but email failed to send.');
 } else {
 toast.success('Order marked as Shipped.');
 }
 } catch {
 toast.error('Something went wrong.');
 } finally {
 setSendingEmail(false);
 setShowShipDialog(false);
 }
 };

 const handleConfirmActionStatus = async (sendEmail: boolean) => {
 if (!order) return;
 setSendingEmail(true);
 try {
 await updateOrderStatus(pendingActionStatus, false);
 
 // Restock items since it is Cancelled or RTO
 if (pendingActionStatus === 'Cancelled' || pendingActionStatus === 'RTO') {
 for (const item of order.items) {
 try {
 const productRef = doc(db, 'products', item.id);
 const productSnap = await getDoc(productRef);
 if (productSnap.exists()) {
 const currentStock = productSnap.data().stock || 0;
 const newStock = currentStock + item.quantity;
 await updateDoc(productRef, { stock: newStock });
 console.log(`Restocked ${item.name}: ${currentStock} -> ${newStock}`);
 }
 } catch (stockErr) {
 console.error(`Failed to restock item ${item.id}:`, stockErr);
 }
 }
 }

 if (sendEmail) {
 const res = await fetch('/api/send-status-update', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 orderId: order.orderId || order.id,
 customerName: order.customerName,
 email: order.email,
 status: pendingActionStatus,
 items: order.items,
 totalAmount: order.totalAmount,
 }),
 });
 if (res.ok) toast.success(`✉️ ${pendingActionStatus} email sent to customer!`);
 else toast.error('Status updated but email failed to send.');
 } else {
 toast.success(`Order marked as ${pendingActionStatus} (Items restocked).`);
 }
 } catch (err) {
 toast.error('Something went wrong.');
 } finally {
 setSendingEmail(false);
 setShowStatusActionDialog(false);
 }
 };

 const updateTracking = async () => {
 if (!order) return;
 setSavingTracking(true);
 try {
 await updateDoc(doc(db, 'orders', order.id), { awbNumber, deliveryPartner, updatedAt: new Date() });
 setOrder({ ...order, awbNumber, deliveryPartner });
 toast.success('Tracking details saved!');
 } catch {
 toast.error('Failed to save tracking');
 }
 setSavingTracking(false);
 };

 const subtotal = (order?.items || [])
 .filter(i => !i.isPromo)
 .reduce((sum, i) => sum + (Number(i.price || 0) * (i.quantity || 1)), 0);
 const discount = Number(order?.discountAmount || 0);
 const total = Number(order?.totalAmount || 0);
 const statusCfg = order ? getStatusConfig(order.status) : null;

  if (loading) {
  return (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
  <div className="flex flex-col items-center gap-4">
  <div className="w-12 h-12 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
  <p className="text-gray-500 font-medium text-sm">Loading order details…</p>
  </div>
  </div>
  );
  }

 if (!order) return null;

  return (
  <div className="min-h-screen bg-gray-50 pb-16">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

 {/* Header */}
 <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
 <div className="flex items-center gap-4">
  <Link href="/admin/orders" className="p-2.5 bg-white hover:bg-gray-100 rounded-xl transition text-gray-500 hover:text-gray-800 border border-gray-200 shadow-sm">
  <ArrowLeft size={18} />
  </Link>
  <div>
  <div className="flex items-center gap-3">
  <h1 className="text-2xl sm:text-3xl font-black text-gray-900">Order Details</h1>
  <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusCfg!.bg} ${statusCfg!.color}`}>
  <span className={`w-1.5 h-1.5 rounded-full ${statusCfg!.dot} animate-pulse`} />
  {order.status}
  </span>
  </div>
  <p className="text-gray-400 font-mono text-sm mt-1">
  Order ID: <span className="text-gray-700 font-bold">{order.orderId || order.id}</span>
  </p>
  </div>
  </div>
  <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl shadow-sm p-1">
  <select
  value={order.status}
  onChange={(e) => handleStatusChange(e.target.value)}
  className="bg-transparent px-4 py-2 text-gray-900 font-bold text-sm focus:outline-none focus:ring-0 cursor-pointer"
  >
  {statusOptions.map((s) => (
  <option key={s} value={s} className="bg-white text-gray-900">{s}</option>
  ))}
  </select>
  </div>
 </div>

 <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

 {/* LEFT — Main Content */}
 <div className="xl:col-span-2 space-y-6">

 {/* Order Timeline Progress */}
  <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
  className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
  <h2 className="font-bold mb-5 flex items-center gap-2 text-gray-900 text-sm">
  <Clock size={16} className="text-green-600" /> Fulfillment Timeline
  </h2>
  <div className="flex items-center justify-between relative">
  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-100 rounded-full" />
  <div 
  className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-green-500 rounded-full transition-all duration-500" 
  style={{ width: `${order.status === 'Cancelled' ? 0 : Math.max(0, statusOptions.indexOf(order.status)) * 33.33}%` }} 
  />
  
  {statusOptions.filter(s => s !== 'Cancelled').map((s, i) => {
  const currentIdx = statusOptions.indexOf(order.status);
  const stepIdx = statusOptions.indexOf(s);
  const isDone = currentIdx >= stepIdx && order.status !== 'Cancelled';
  const isCurrent = order.status === s;
  return (
  <div key={s} className="relative z-10 flex flex-col items-center gap-2">
  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
  isCurrent ? 'bg-green-500 border-green-500 text-white scale-110 shadow-lg shadow-green-500/20' 
  : isDone ? 'bg-green-50 border-green-500 text-green-600'
  : 'bg-white border-gray-200 text-gray-400'
  }`}>
  {isDone ? <CheckCircle2 size={14} /> : <div className="w-2 h-2 rounded-full bg-current" />}
  </div>
  <span className={`text-[10px] font-bold uppercase tracking-wider absolute top-10 whitespace-nowrap ${
  isCurrent ? 'text-green-600' : isDone ? 'text-gray-800' : 'text-gray-400'
  }`}>{s}</span>
  </div>
  );
  })}
  </div>
  <div className="h-6" />
  </motion.div>

 {/* Customer & Address Info */}
  <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
  className="grid grid-cols-1 md:grid-cols-2 gap-6">
  <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col h-full">
  <h2 className="font-bold mb-4 flex items-center gap-2 text-gray-900 text-sm">
  <User size={16} className="text-green-600" /> Customer Information
  </h2>
  <div className="flex-1 space-y-4">
  <div>
  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Full Name</p>
  <p className="font-semibold text-gray-900">{order.customerName}</p>
  </div>
  <div>
  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Email & Phone</p>
  <p className="text-sm text-gray-500 font-medium mb-0.5"><a href={`mailto:${order.email}`} className="text-green-600 hover:underline">{order.email}</a></p>
  <p className="text-sm text-gray-500 font-medium"><a href={`tel:${order.phone}`} className="hover:text-gray-900 transition">{order.phone}</a></p>
  </div>
  <div>
  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Order Placed At</p>
  <p className="text-sm text-gray-500 font-medium">
  {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString('en-IN') : order.createdAt ? new Date(order.createdAt).toLocaleString('en-IN') : 'N/A'}
  </p>
  </div>
  </div>
  </div>

  <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col h-full">
  <h2 className="font-bold mb-4 flex items-center gap-2 text-gray-900 text-sm">
  <MapPin size={16} className="text-green-600" /> Delivery Address
  </h2>
  <div className="flex-1 bg-gray-50 rounded-xl border border-gray-200 p-4">
  {order.address && typeof order.address === 'object' && order.address.address ? (
  <>
  <p className="font-semibold text-gray-900 mb-2">{order.customerName}</p>
  <p className="text-sm text-gray-500 leading-relaxed font-medium mb-3">
  {order.address.address}<br />
  {order.address.city}, {order.address.state}<br />
  {order.address.pinCode}
  </p>
  {order.address.alternatePhone && (
  <p className="text-xs text-gray-500 font-medium bg-white p-2 rounded-lg border border-gray-200 inline-block">
  <span className="font-bold text-gray-500 uppercase mr-1">Alt Phone:</span> {order.address.alternatePhone}
  </p>
  )}
  </>
  ) : (
  <div className="flex flex-col items-center justify-center h-full text-gray-500 py-4">
  <AlertCircle size={24} className="mb-2 text-amber-500/50" />
  <p className="text-sm font-medium">Address data unavailable or in legacy format.</p>
  {(order as any).address && typeof (order as any).address === 'string' && (
  <p className="text-xs mt-2 text-gray-500 break-all">{String((order as any).address)}</p>
  )}
  </div>
  )}
  </div>
  </div>
  </motion.div>

 {/* Order Items */}
  <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
  className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
  <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-5 border-b border-gray-100">
  <div className="flex items-center gap-3">
  <div className="w-10 h-10 rounded-xl bg-green-50 border border-green-200 flex items-center justify-center">
  <Package size={18} className="text-green-600" />
  </div>
  <div>
  <h2 className="text-base font-bold text-gray-900 leading-tight">Order Items</h2>
  <p className="text-xs text-gray-400 font-medium">{order.items?.filter(i => !i.isPromo).length || 0} product(s) in this order</p>
  </div>
  </div>
  </div>

  <div className="p-6 space-y-3">
  {(Array.isArray(order.items) ? order.items : []).map((item, idx) => (
  <div key={idx}
  className={`flex flex-col sm:flex-row gap-4 p-4 rounded-xl border transition ${
  item.isPromo ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
  }`}>
  <div className="flex-shrink-0 w-20 h-20 bg-white rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden shadow-sm">
  {item.image ? (
  <img src={item.image} alt={item.name} className="w-full h-full object-contain p-2" />
  ) : (
  <Package size={24} className="text-gray-300" />
  )}
  </div>
  
  <div className="flex-1 min-w-0 py-1">
  <div className="flex items-start gap-2 flex-wrap mb-1">
  <h3 className="font-bold text-gray-900 text-base leading-snug">{item.name}</h3>
  {item.isPromo && (
  <span className="text-[10px] font-black bg-green-500 text-white px-2 py-0.5 rounded-md whitespace-nowrap uppercase tracking-wider">Free Gift</span>
  )}
  </div>
  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-2 text-xs font-semibold">
  {item.sku && <span className="text-gray-400 bg-white px-2 py-0.5 rounded border border-gray-200">SKU: <span className="text-gray-600 font-mono">{item.sku}</span></span>}
  {item.flavor && <span className="text-gray-400 bg-white px-2 py-0.5 rounded border border-gray-200">Flavor: <span className="text-gray-600">{item.flavor}</span></span>}
  {item.unit && <span className="text-gray-400 bg-white px-2 py-0.5 rounded border border-gray-200">Size: <span className="text-gray-600">{item.unit}</span></span>}
  </div>
  </div>

  <div className="text-right flex-shrink-0 py-1 flex flex-col justify-between sm:justify-start">
  {item.isPromo ? (
  <span className="text-green-600 font-black text-lg font-mono">FREE</span>
  ) : (
  <>
  <div className="text-xs font-bold text-gray-400 mb-1">₹{Number(item.price || 0).toLocaleString()} × {item.quantity || 1}</div>
  <div className="text-xl font-black text-gray-900 font-mono mt-auto sm:mt-0">
  ₹{Number((item.price || 0) * (item.quantity || 1)).toLocaleString()}
  </div>
  </>
  )}
  </div>
  </div>
  ))}
  </div>

  <div className="mx-6 mb-6 p-5 bg-gray-50 rounded-2xl border border-gray-200">
  <div className="flex items-center gap-2 mb-4">
  <Receipt size={16} className="text-gray-400" />
  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Bill Summary</span>
  </div>
  <div className="space-y-3">
  <div className="flex justify-between text-sm font-medium text-gray-500">
  <span>Subtotal</span>
  <span className="font-mono">₹{subtotal.toLocaleString()}</span>
  </div>
  {discount > 0 && (
  <div className="flex justify-between text-sm font-bold text-green-600 bg-green-50 -mx-2 px-2 py-1 rounded-lg">
  <span className="flex items-center gap-1.5"><TrendingDown size={14} /> Discount Applied</span>
  <span className="font-mono">− ₹{discount.toLocaleString()}</span>
  </div>
  )}
  <div className="flex justify-between text-sm font-medium text-gray-500">
  <span>Shipping</span>
  <span className="text-green-600 font-bold uppercase text-xs">Free</span>
  </div>
  <div className="pt-3 mt-1 border-t border-gray-200 flex justify-between items-end">
  <span className="font-bold text-sm text-gray-900 uppercase tracking-wider">Total Paid</span>
  <span className="text-2xl font-black text-green-600 font-mono leading-none">₹{total.toLocaleString()}</span>
  </div>
  </div>
  </div>
  </motion.div>
 </div>

 {/* RIGHT — Sidebar */}
 <div className="space-y-6">

 {/* Payment Details */}
  <motion.div initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }}
  className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
  <h2 className="font-bold flex items-center gap-2 text-gray-900 text-sm">
  <CreditCard size={16} className="text-green-600" /> Payment Info
  </h2>
  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
  <div className="flex justify-between items-center text-sm font-medium">
  <span className="text-gray-500">Method</span>
  <span className="text-gray-900 font-bold px-2.5 py-1 bg-white rounded-lg border border-gray-200 text-xs">
  {order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online Payment'}
  </span>
  </div>
  <div className="flex justify-between items-center text-sm font-medium">
  <span className="text-gray-500">Status</span>
  <span className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 ${
  order.paymentStatus === 'Paid'
  ? 'bg-green-50 text-green-700 border border-green-200'
  : 'bg-amber-50 text-amber-700 border border-amber-200'
  }`}>
  {order.paymentStatus === 'Paid' ? <ShieldCheck size={12}/> : <Clock size={12}/>}
  {order.paymentStatus || 'Pending'}
  </span>
  </div>
  </div>
  </motion.div>

 {/* Tracking Details Form */}
  <motion.div initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 }}
  className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-5">
  <h2 className="font-bold flex items-center gap-2 text-gray-900 text-sm">
  <Truck size={16} className="text-purple-600" /> Logistics & Tracking
  </h2>
  
  {order.awbNumber && (
  <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
  <p className="text-xs font-bold text-purple-700 uppercase tracking-wider mb-2">Active Tracking</p>
  <div className="flex justify-between items-end">
  <div>
  <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Courier</p>
  <p className="text-sm text-gray-900 font-semibold">{order.deliveryPartner || '—'}</p>
  </div>
  <div className="text-right">
  <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">AWB No.</p>
  <p className="text-base text-purple-700 font-black font-mono">{order.awbNumber}</p>
  </div>
  </div>
  </div>
  )}

  <div className="space-y-4">
  <div>
  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Update Courier</label>
  <input type="text" value={deliveryPartner} onChange={(e) => setDeliveryPartner(e.target.value)}
  placeholder="e.g. Delhivery, Bluedart"
  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-500/10 focus:outline-none transition text-sm font-medium" />
  </div>
  <div>
  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Update AWB / Tracking</label>
  <input type="text" value={awbNumber} onChange={(e) => setAwbNumber(e.target.value)}
  placeholder="Enter tracking number"
  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-500/10 focus:outline-none transition text-sm font-mono font-bold" />
  </div>
  <button onClick={updateTracking} disabled={savingTracking}
  className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition disabled:opacity-50 text-sm shadow-[0_4px_12px_rgba(0,200,83,0.2)] cursor-pointer">
  {savingTracking ? 'Saving…' : 'Save Tracking Info'}
  </button>
  </div>
  </motion.div>

 </div>
 </div>
 </div>

 {/* ---- SHIPPING DIALOG ---- */}
 <AnimatePresence>
 {showShipDialog && (
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
 >
 <motion.div
 initial={{ scale: 0.95, y: 20 }}
 animate={{ scale: 1, y: 0 }}
 exit={{ scale: 0.95, y: 20 }}
 className="w-full max-w-md glass rounded-3xl border border-white/15 shadow-2xl overflow-hidden"
 >
 {/* Dialog Header */}
 <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-purple-500/10">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
 <Truck size={18} className="text-purple-400" />
 </div>
 <div>
 <h3 className="font-bold text-foreground text-lg leading-tight">Mark as Shipped</h3>
 <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-0.5">Notify Customer</p>
 </div>
 </div>
 <button onClick={() => setShowShipDialog(false)} className="p-2 hover:bg-muted rounded-xl transition text-gray-500 hover:text-foreground cursor-pointer">
 <X size={18} />
 </button>
 </div>

 <div className="px-6 py-5 space-y-4">
 <div className="p-3 bg-muted rounded-xl border border-border text-sm flex justify-between items-center">
 <div>
 <p className="text-[10px] font-bold text-gray-500 uppercase">Order</p>
 <p className="font-mono text-foreground font-bold">{order.orderId || order.id}</p>
 </div>
 <div className="text-right">
 <p className="text-[10px] font-bold text-gray-500 uppercase">Customer</p>
 <p className="font-semibold text-foreground">{order.customerName}</p>
 </div>
 </div>

 <div>
 <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Courier Partner *</label>
 <select value={shipCourier} onChange={(e) => setShipCourier(e.target.value)}
 className="w-full px-4 py-3 bg-muted border border-border text-foreground rounded-xl focus:border-purple-500/50 focus:outline-none transition text-sm font-semibold cursor-pointer">
 <option value="" className="bg-gray-900">Select Courier</option>
 {['Delhivery', 'Bluedart', 'DTDC', 'Ecom Express', 'XpressBees', 'Shadowfax', 'Dunzo', 'Other'].map(c => (
 <option key={c} value={c} className="bg-gray-900">{c}</option>
 ))}
 </select>
 </div>

 <div>
 <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">AWB / Tracking Number *</label>
 <input type="text" value={shipAwb} onChange={(e) => setShipAwb(e.target.value)}
 placeholder="e.g. 12345678901234"
 className="w-full px-4 py-3 bg-muted border border-border text-foreground placeholder:text-gray-600 rounded-xl focus:border-purple-500/50 focus:outline-none transition text-sm font-mono font-bold" />
 </div>

 <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-start gap-2.5 text-xs text-blue-300 font-medium">
 <Send size={14} className="flex-shrink-0 mt-0.5 text-blue-400" />
 <p>A beautiful shipping notification will be sent to <strong className="text-foreground">{order.email}</strong> with these tracking details.</p>
 </div>
 </div>

 <div className="px-6 pb-6 space-y-3">
 <button
 onClick={() => handleConfirmShipped(true)}
 disabled={sendingEmail || !shipCourier || !shipAwb}
 className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-foreground font-bold rounded-xl transition disabled:opacity-50 shadow-lg shadow-purple-500/20 cursor-pointer"
 >
 {sendingEmail ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send size={16} />}
 {sendingEmail ? 'Sending Email…' : 'Mark Shipped & Notify Customer'}
 </button>
 <button
 onClick={() => handleConfirmShipped(false)}
 disabled={sendingEmail}
 className="w-full py-3 text-gray-500 hover:text-foreground bg-muted hover:bg-muted rounded-xl transition font-bold text-xs cursor-pointer border border-transparent hover:border-border"
 >
 Mark Shipped Without Email
 </button>
 </div>
 </motion.div>
 </motion.div>
 )}
 </AnimatePresence>
 <AnimatePresence>
 {showStatusActionDialog && (
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
 >
 <motion.div
 initial={{ scale: 0.95, y: 20 }}
 animate={{ scale: 1, y: 0 }}
 exit={{ scale: 0.95, y: 20 }}
 className="w-full max-w-md glass rounded-3xl border border-white/15 shadow-2xl overflow-hidden"
 >
 <div className={`flex items-center justify-between px-6 py-5 border-b border-border ${pendingActionStatus === 'Cancelled' ? 'bg-red-500/10' : pendingActionStatus === 'Delivered' ? 'bg-green-500/10' : 'bg-orange-500/10'}`}>
 <div className="flex items-center gap-3">
 <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${pendingActionStatus === 'Cancelled' ? 'bg-red-500/20 border-red-500/30 text-red-400' : pendingActionStatus === 'Delivered' ? 'bg-green-500/20 border-green-500/30 text-green-400' : 'bg-orange-500/20 border-orange-500/30 text-orange-400'} border`}>
 {pendingActionStatus === 'Delivered' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
 </div>
 <div>
 <h3 className="font-bold text-foreground text-lg leading-tight">Mark as {pendingActionStatus}</h3>
 <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-0.5">Action Required</p>
 </div>
 </div>
 <button onClick={() => setShowStatusActionDialog(false)} className="p-2 hover:bg-muted rounded-xl transition text-gray-500 hover:text-foreground cursor-pointer">
 <X size={18} />
 </button>
 </div>

 <div className="px-6 py-5 space-y-4">
 <div className="p-3 bg-muted rounded-xl border border-border text-sm flex justify-between items-center">
 <div>
 <p className="text-[10px] font-bold text-gray-500 uppercase">Order</p>
 <p className="font-mono text-foreground font-bold">{order.orderId || order.id}</p>
 </div>
 </div>

 {pendingActionStatus !== 'Delivered' ? (
 <div className="p-3 bg-muted border border-border rounded-xl flex items-start gap-2.5 text-xs text-gray-500 font-medium">
 <Package size={14} className="flex-shrink-0 mt-0.5 text-gray-500" />
 <p>All items in this order will be automatically restocked.</p>
 </div>
 ) : (
 <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl flex items-start gap-2.5 text-xs text-green-300 font-medium">
 <CheckCircle2 size={14} className="flex-shrink-0 mt-0.5 text-green-400" />
 <p>Marking as Delivered will optionally send a review request email.</p>
 </div>
 )}
 </div>

 <div className="px-6 pb-6 space-y-3">
 <button
 onClick={() => handleConfirmActionStatus(true)}
 disabled={sendingEmail}
 className={`w-full flex items-center justify-center gap-2 py-3.5 ${pendingActionStatus === 'Cancelled' ? 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 shadow-red-500/20' : pendingActionStatus === 'Delivered' ? 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 shadow-green-500/20' : 'bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 shadow-orange-500/20'} text-foreground font-bold rounded-xl transition disabled:opacity-50 shadow-lg cursor-pointer`}
 >
 {sendingEmail ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send size={16} />}
 {sendingEmail ? 'Processing…' : `Mark ${pendingActionStatus} & Inform via Email`}
 </button>
 <button
 onClick={() => handleConfirmActionStatus(false)}
 disabled={sendingEmail}
 className="w-full py-3.5 bg-muted hover:bg-muted text-foreground font-bold rounded-xl transition disabled:opacity-50 text-sm border border-border cursor-pointer"
 >
 Mark ${pendingActionStatus} Only (Don't Email)
 </button>
 </div>
 </motion.div>
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 );
}
