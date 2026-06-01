'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Clock, CreditCard, User, Phone, MapPin, Package,
  Truck, X, Send, CheckCircle2, AlertCircle, ChevronRight, Tag,
  Receipt, TrendingDown, IndianRupee
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

const statusOptions = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

const getStatusConfig = (status: string) => {
  const cfg: Record<string, { color: string; bg: string; icon: any; dot: string }> = {
    Pending:    { color: 'text-yellow-400',  bg: 'bg-yellow-500/15 border-yellow-500/30',  icon: Clock,         dot: 'bg-yellow-400' },
    Processing: { color: 'text-blue-400',    bg: 'bg-blue-500/15 border-blue-500/30',      icon: Package,       dot: 'bg-blue-400' },
    Shipped:    { color: 'text-purple-400',  bg: 'bg-purple-500/15 border-purple-500/30',  icon: Truck,         dot: 'bg-purple-400' },
    Delivered:  { color: 'text-green-400',   bg: 'bg-green-500/15 border-green-500/30',    icon: CheckCircle2,  dot: 'bg-green-400' },
    Cancelled:  { color: 'text-red-400',     bg: 'bg-red-500/15 border-red-500/30',        icon: AlertCircle,   dot: 'bg-red-400' },
  };
  return cfg[status] || { color: 'text-gray-400', bg: 'bg-gray-500/15 border-gray-500/30', icon: Clock, dot: 'bg-gray-400' };
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-dark">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 font-medium">Loading order details…</p>
        </div>
      </div>
    );
  }

  if (!order) return null;

  const StatusIcon = statusCfg!.icon;

  return (
    <div className="min-h-screen bg-gradient-dark text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

        {/* Header */}
        <div className="flex flex-wrap items-center gap-4 mb-8">
          <Link href="/admin/orders" className="p-2 hover:bg-white/10 rounded-xl transition text-gray-400 hover:text-white">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Order Details</h1>
            <p className="text-gray-400 font-mono text-sm mt-0.5 truncate">
              {order.orderId || order.id}
            </p>
          </div>
          {/* Current Status Badge */}
          <span className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border ${statusCfg!.bg} ${statusCfg!.color}`}>
            <span className={`w-2 h-2 rounded-full ${statusCfg!.dot} animate-pulse`} />
            {order.status}
          </span>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* LEFT — Main Content */}
          <div className="xl:col-span-2 space-y-6">

            {/* Order Items */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="glass rounded-2xl border border-white/10 overflow-hidden">
              <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
                <div className="w-9 h-9 rounded-xl bg-green-500/15 border border-green-500/30 flex items-center justify-center">
                  <Package size={16} className="text-green-400" />
                </div>
                <div>
                  <h2 className="text-base font-bold">Ordered Products</h2>
                  <p className="text-xs text-gray-400">{order.items?.filter(i => !i.isPromo).length || 0} item(s)</p>
                </div>
              </div>

              <div className="p-6 space-y-3">
                {(Array.isArray(order.items) ? order.items : []).map((item, idx) => (
                  <div key={idx}
                    className={`flex flex-col sm:flex-row gap-3 p-4 rounded-xl border transition ${
                      item.isPromo
                        ? 'bg-green-500/5 border-green-500/20'
                        : 'bg-white/3 border-white/8 hover:bg-white/6'
                    }`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 flex-wrap">
                        <h3 className="font-semibold text-sm sm:text-base leading-snug">{item.name}</h3>
                        {item.isPromo && (
                          <span className="text-[10px] font-bold bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full border border-green-500/30 whitespace-nowrap">FREE Gift</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-xs text-gray-400">
                        {item.sku && <span className="text-green-400 font-mono">SKU: {item.sku}</span>}
                        {item.flavor && <span>Flavor: <span className="text-gray-300">{item.flavor}</span></span>}
                        {item.unit && <span>Size: <span className="text-gray-300">{item.unit}</span></span>}
                        <span>Qty: <span className="text-gray-300 font-bold">×{item.quantity || 1}</span></span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {item.isPromo ? (
                        <span className="text-green-400 font-bold text-sm">FREE</span>
                      ) : (
                        <>
                          <div className="text-xs text-gray-500">₹{Number(item.price || 0).toLocaleString()} × {item.quantity || 1}</div>
                          {(item.originalPrice || 0) > (item.price || 0) && (
                            <div className="text-xs text-gray-600 line-through">₹{Number(item.originalPrice || 0).toLocaleString()}</div>
                          )}
                          <div className="text-base font-bold text-white mt-0.5">
                            ₹{Number((item.price || 0) * (item.quantity || 1)).toLocaleString()}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Bill Breakdown */}
              <div className="mx-6 mb-6 p-5 bg-black/30 rounded-2xl border border-white/10">
                <div className="flex items-center gap-2 mb-4">
                  <Receipt size={15} className="text-gray-400" />
                  <span className="text-sm font-bold text-gray-300 uppercase tracking-wider">Bill Summary</span>
                </div>
                <div className="space-y-2.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Subtotal (before discount)</span>
                    <span className="text-gray-300 font-mono">₹{subtotal.toLocaleString()}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-1.5 text-green-400">
                        <TrendingDown size={12} />Discount Applied
                      </span>
                      <span className="text-green-400 font-mono">− ₹{discount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Shipping</span>
                    <span className="text-green-400 font-semibold">FREE</span>
                  </div>
                  <div className="pt-3 mt-1 border-t border-white/10 flex justify-between items-center">
                    <span className="font-bold text-base flex items-center gap-1.5">
                      <IndianRupee size={14} className="text-green-400" />Total Amount
                    </span>
                    <span className="text-xl font-black text-green-400 font-mono">₹{total.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-500 pt-1">
                    <span>Payment Method</span>
                    <span className="uppercase font-bold text-gray-400">{order.paymentMethod || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">Payment Status</span>
                    <span className={`font-bold text-xs px-2 py-0.5 rounded-full ${
                      order.paymentStatus === 'Paid'
                        ? 'bg-green-500/15 text-green-400 border border-green-500/25'
                        : 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/25'
                    }`}>
                      {order.paymentStatus || 'Pending'}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Customer Info */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="glass p-6 rounded-2xl border border-white/10">
              <h2 className="font-bold mb-5 flex items-center gap-2">
                <User size={16} className="text-green-400" />
                Customer Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-white/3 rounded-xl border border-white/8 space-y-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Full Name</p>
                  <p className="font-semibold">{order.customerName}</p>
                </div>
                <div className="p-4 bg-white/3 rounded-xl border border-white/8 space-y-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Email</p>
                  <p className="font-semibold text-sm truncate">{order.email}</p>
                </div>
                <div className="p-4 bg-white/3 rounded-xl border border-white/8 space-y-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Phone</p>
                  <p className="font-semibold">{order.phone}</p>
                  {order.address?.alternatePhone && (
                    <p className="text-xs text-gray-400">Alt: {order.address.alternatePhone}</p>
                  )}
                </div>
                <div className="p-4 bg-white/3 rounded-xl border border-white/8 space-y-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Order Placed</p>
                  <p className="font-semibold text-sm">
                    {order.createdAt?.toDate
                      ? order.createdAt.toDate().toLocaleString('en-IN')
                      : order.createdAt
                        ? new Date(order.createdAt).toLocaleString('en-IN')
                        : 'N/A'}
                  </p>
                </div>
                <div className="sm:col-span-2 p-4 bg-white/3 rounded-xl border border-white/8 space-y-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin size={11} />Delivery Address
                  </p>
                  <p className="font-semibold text-sm leading-relaxed">
                    {order.address?.address}, {order.address?.city},<br />
                    {order.address?.state} – {order.address?.pinCode}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* RIGHT — Sidebar */}
          <div className="space-y-5">

            {/* Status Control */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              className="glass p-6 rounded-2xl border border-white/10">
              <h2 className="font-bold mb-4 flex items-center gap-2">
                <Tag size={16} className="text-green-400" />
                Order Status
              </h2>

              {/* Status progress steps */}
              <div className="flex items-center gap-1 mb-5 overflow-x-auto pb-1">
                {statusOptions.filter(s => s !== 'Cancelled').map((s, i, arr) => {
                  const cfg = getStatusConfig(s);
                  const currentIdx = statusOptions.indexOf(order.status);
                  const stepIdx = statusOptions.indexOf(s);
                  const isDone = currentIdx > stepIdx || order.status === s;
                  return (
                    <div key={s} className="flex items-center gap-1 min-w-0 flex-shrink-0">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isDone ? cfg.dot : 'bg-gray-700'}`} />
                      <span className={`text-[10px] font-bold whitespace-nowrap ${isDone ? cfg.color : 'text-gray-600'}`}>{s}</span>
                      {i < arr.length - 1 && <div className={`w-4 h-px flex-shrink-0 ${isDone ? 'bg-green-500/50' : 'bg-gray-700'}`} />}
                    </div>
                  );
                })}
              </div>

              <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2">Change Status</label>
              <select
                value={order.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition text-sm"
              >
                {statusOptions.map((s) => (
                  <option key={s} value={s} className="bg-gray-900">{s}</option>
                ))}
              </select>
            </motion.div>

            {/* Tracking Details */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08 }}
              className="glass p-6 rounded-2xl border border-white/10 space-y-4">
              <h2 className="font-bold flex items-center gap-2">
                <Truck size={16} className="text-green-400" />
                Tracking Details
              </h2>
              {order.awbNumber && (
                <div className="p-3 bg-green-500/8 border border-green-500/20 rounded-xl text-xs">
                  <p className="text-green-400 font-bold mb-1">Current Tracking</p>
                  <p className="text-gray-300">Courier: <span className="text-white font-semibold">{order.deliveryPartner || '—'}</span></p>
                  <p className="text-gray-300 font-mono">AWB: <span className="text-white font-semibold">{order.awbNumber}</span></p>
                </div>
              )}
              <div>
                <label className="text-xs text-gray-400 block mb-1.5">Courier Partner</label>
                <input type="text" value={deliveryPartner} onChange={(e) => setDeliveryPartner(e.target.value)}
                  placeholder="e.g. Delhivery, Bluedart"
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 text-white rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-500/20 text-sm transition" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1.5">AWB / Tracking Number</label>
                <input type="text" value={awbNumber} onChange={(e) => setAwbNumber(e.target.value)}
                  placeholder="Enter tracking number"
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 text-white rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-500/20 text-sm transition" />
              </div>
              <button onClick={updateTracking} disabled={savingTracking}
                className="w-full py-2.5 bg-green-500 hover:bg-green-400 text-black font-bold rounded-xl transition disabled:opacity-50 text-sm">
                {savingTracking ? 'Saving…' : 'Update Tracking'}
              </button>
            </motion.div>

            {/* Payment Card */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
              className="glass p-6 rounded-2xl border border-white/10 space-y-3">
              <h2 className="font-bold flex items-center gap-2 mb-4">
                <CreditCard size={16} className="text-green-400" />
                Payment
              </h2>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Method</span>
                <span className="font-bold uppercase">{order.paymentMethod || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Total</span>
                <span className="font-black text-green-400 text-lg font-mono">₹{total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Status</span>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                  order.paymentStatus === 'Paid'
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/25'
                }`}>
                  {order.paymentStatus || 'Pending'}
                </span>
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
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 22, stiffness: 300 }}
              className="w-full max-w-md glass rounded-3xl border border-white/15 shadow-2xl overflow-hidden"
            >
              {/* Dialog Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-purple-500/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                    <Truck size={18} className="text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Mark as Shipped</h3>
                    <p className="text-xs text-gray-400">Confirm courier & notify customer</p>
                  </div>
                </div>
                <button onClick={() => setShowShipDialog(false)} className="p-2 hover:bg-white/10 rounded-xl transition text-gray-400">
                  <X size={18} />
                </button>
              </div>

              <div className="px-6 py-5 space-y-4">
                {/* Order ref */}
                <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-sm">
                  <span className="text-gray-400">Order: </span>
                  <span className="font-mono text-white font-bold">{order.orderId || order.id}</span>
                  <span className="text-gray-400 ml-3">Customer: </span>
                  <span className="font-semibold text-white">{order.customerName}</span>
                </div>

                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2">Courier Partner *</label>
                  <select value={shipCourier} onChange={(e) => setShipCourier(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition text-sm">
                    <option value="" className="bg-gray-900">Select Courier</option>
                    {['Delhivery', 'Bluedart', 'DTDC', 'Ecom Express', 'XpressBees', 'Shadowfax', 'Dunzo', 'Other'].map(c => (
                      <option key={c} value={c} className="bg-gray-900">{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2">AWB / Tracking Number *</label>
                  <input type="text" value={shipAwb} onChange={(e) => setShipAwb(e.target.value)}
                    placeholder="e.g. 12345678901234"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white placeholder-gray-600 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition text-sm font-mono" />
                </div>

                <div className="p-3 bg-blue-500/8 border border-blue-500/20 rounded-xl flex items-start gap-2.5 text-sm text-blue-300">
                  <Send size={14} className="flex-shrink-0 mt-0.5" />
                  <span>A shipping notification will be sent to <strong>{order.email}</strong> with the tracking details.</span>
                </div>
              </div>

              <div className="px-6 pb-6 flex flex-col gap-3">
                <button
                  onClick={() => handleConfirmShipped(true)}
                  disabled={sendingEmail || !shipCourier || !shipAwb}
                  className="w-full flex items-center justify-center gap-2.5 py-3.5 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white font-bold rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-purple-500/20"
                >
                  {sendingEmail ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : <Send size={16} />}
                  {sendingEmail ? 'Sending Email…' : 'Mark Shipped & Send Email'}
                </button>
                <button
                  onClick={() => handleConfirmShipped(false)}
                  disabled={sendingEmail}
                  className="w-full py-3 text-gray-400 hover:text-white hover:bg-white/8 rounded-xl transition font-medium text-sm"
                >
                  Mark Shipped Without Email
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
