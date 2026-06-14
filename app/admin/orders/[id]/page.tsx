'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Clock, CreditCard, User, Phone, MapPin, Package,
  Truck, X, Send, CheckCircle2, AlertCircle, Tag, XCircle,
  Receipt, TrendingDown, IndianRupee, ShieldCheck, Check, Info
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
  cfOrderId?: string;
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
      <div className="min-h-screen flex items-center justify-center bg-[#fcfcfc]">
        <div className="w-12 h-12 border-4 border-gray-100 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="min-h-screen bg-[#fcfcfc] pb-20 font-sans">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link href="/admin/orders" className="p-3 bg-white hover:bg-gray-50 rounded-xl transition border border-gray-200 shadow-sm">
              <ArrowLeft size={20} className="text-gray-600" />
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-gray-900">Order Details</h1>
                <span className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold border uppercase tracking-wider ${statusCfg!.bg} ${statusCfg!.color}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${statusCfg!.dot} animate-pulse`} />
                  {order.status}
                </span>
              </div>
              <p className="text-gray-500 font-mono text-sm mt-1">
                Order ID: <span className="text-gray-900 font-bold">{order.orderId || order.id}</span>
              </p>
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-1">
            <select
              value={order.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="bg-transparent px-4 py-2.5 text-gray-900 font-bold text-sm focus:outline-none cursor-pointer"
            >
              {statusOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT — Main Content */}
          <div className="lg:col-span-2 space-y-6">

            {/* Order Timeline Progress */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <h2 className="font-bold mb-8 flex items-center gap-2 text-gray-900">
                <Clock size={18} className="text-gray-400" /> Fulfillment Timeline
              </h2>
              <div className="flex items-center justify-between relative px-2">
                <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-1 bg-gray-100 rounded-full" />
                <div 
                  className="absolute left-4 top-1/2 -translate-y-1/2 h-1 bg-black rounded-full transition-all duration-500" 
                  style={{ width: `${order.status === 'Cancelled' ? 0 : Math.max(0, statusOptions.indexOf(order.status)) * 33.33}%` }} 
                />
                
                {statusOptions.filter(s => s !== 'Cancelled').map((s, i) => {
                  const currentIdx = statusOptions.indexOf(order.status);
                  const stepIdx = statusOptions.indexOf(s);
                  const isDone = currentIdx >= stepIdx && order.status !== 'Cancelled';
                  const isCurrent = order.status === s;
                  return (
                    <div key={s} className="relative z-10 flex flex-col items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                        isCurrent ? 'bg-black border-black text-white scale-125 shadow-lg' 
                        : isDone ? 'bg-gray-900 border-gray-900 text-white'
                        : 'bg-white border-gray-200 text-gray-300'
                      }`}>
                        {isDone ? <Check size={14} strokeWidth={3} /> : <div className="w-2 h-2 rounded-full bg-current" />}
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider absolute top-12 whitespace-nowrap ${
                        isCurrent ? 'text-gray-900' : isDone ? 'text-gray-600' : 'text-gray-400'
                      }`}>{s}</span>
                    </div>
                  );
                })}
              </div>
              <div className="h-8" />
            </motion.div>

            {/* Customer & Address Info */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Customer Info */}
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <h2 className="font-bold mb-6 flex items-center gap-2 text-gray-900">
                  <User size={18} className="text-gray-400" /> Customer Information
                </h2>
                <div className="space-y-5">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Full Name</p>
                    <p className="font-semibold text-gray-900">{order.customerName}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Contact</p>
                    <p className="text-sm font-medium text-gray-600 mb-0.5"><a href={`mailto:${order.email}`} className="hover:text-black hover:underline">{order.email}</a></p>
                    <p className="text-sm font-medium text-gray-600"><a href={`tel:${order.phone}`} className="hover:text-black">{order.phone}</a></p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Order Placed At</p>
                    <p className="text-sm font-medium text-gray-600">
                      {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString('en-IN') : order.createdAt ? new Date(order.createdAt).toLocaleString('en-IN') : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <h2 className="font-bold mb-6 flex items-center gap-2 text-gray-900">
                  <MapPin size={18} className="text-gray-400" /> Delivery Address
                </h2>
                <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 h-full">
                  {order.address && typeof order.address === 'object' && order.address.address ? (
                    <>
                      <p className="font-bold text-gray-900 mb-2">{order.customerName}</p>
                      <p className="text-sm text-gray-600 leading-relaxed font-medium mb-4">
                        {order.address.address}<br />
                        {order.address.city}, {order.address.state}<br />
                        {order.address.pinCode}
                      </p>
                      {order.address.alternatePhone && (
                        <div className="bg-white px-3 py-2 rounded-xl border border-gray-200 inline-block text-xs text-gray-600 font-medium shadow-sm">
                          <span className="font-bold text-gray-400 uppercase mr-2 tracking-wider text-[10px]">Alt Phone:</span>
                          {order.address.alternatePhone}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 py-4">
                      <AlertCircle size={24} className="mb-2 opacity-50" />
                      <p className="text-sm font-medium">Address data unavailable.</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Order Items */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="bg-white rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
              <div className="px-6 sm:px-8 py-6 border-b border-gray-50 flex items-center justify-between bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                    <Package size={18} className="text-gray-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Order Items</h2>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-0.5">{order.items?.filter(i => !i.isPromo).length || 0} Product(s)</p>
                  </div>
                </div>
              </div>

              <div className="p-6 sm:p-8 space-y-4 bg-gray-50/30">
                {(Array.isArray(order.items) ? order.items : []).map((item, idx) => (
                  <div key={idx}
                    className={`flex flex-col sm:flex-row gap-5 p-5 rounded-2xl border transition ${
                      item.isPromo ? 'bg-green-50/50 border-green-100 shadow-sm' : 'bg-white border-gray-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)]'
                    }`}>
                    <div className="flex-shrink-0 w-24 h-24 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center overflow-hidden">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-contain p-2" />
                      ) : (
                        <Package size={24} className="text-gray-300" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0 py-1 flex flex-col justify-center">
                      <div className="flex items-start gap-2 flex-wrap mb-1">
                        <h3 className="font-bold text-gray-900 text-base">{item.name}</h3>
                        {item.isPromo && (
                          <span className="text-[10px] font-black bg-green-500 text-white px-2 py-0.5 rounded-md uppercase tracking-wider">Free Gift</span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-3 text-[11px] font-bold">
                        {item.sku && <span className="text-gray-500 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">SKU: <span className="text-gray-900 font-mono">{item.sku}</span></span>}
                        {item.flavor && <span className="text-gray-500 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">Flavor: <span className="text-gray-900">{item.flavor}</span></span>}
                        {item.unit && <span className="text-gray-500 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">Size: <span className="text-gray-900">{item.unit}</span></span>}
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0 py-1 flex flex-col justify-between sm:justify-center border-t sm:border-t-0 sm:border-l border-gray-100 pt-4 sm:pt-0 sm:pl-6">
                      {item.isPromo ? (
                        <span className="text-green-500 font-black text-xl uppercase tracking-wider">Free</span>
                      ) : (
                        <>
                          <div className="text-xs font-bold text-gray-400 mb-1">₹{Number(item.price || 0).toLocaleString()} × {item.quantity || 1}</div>
                          <div className="text-xl font-black text-gray-900">
                            ₹{Number((item.price || 0) * (item.quantity || 1)).toLocaleString()}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Bill Summary */}
              <div className="bg-white border-t border-gray-100 p-6 sm:p-8">
                <div className="max-w-xs ml-auto space-y-4 text-sm">
                  <div className="flex justify-between font-medium text-gray-500">
                    <span>Subtotal</span>
                    <span className="text-gray-900 font-bold">₹{subtotal.toLocaleString()}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-lg -mx-3">
                      <span>Discount</span>
                      <span>− ₹{discount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-medium text-gray-500">
                    <span>Shipping</span>
                    <span className="text-green-600 font-bold uppercase text-xs">Free</span>
                  </div>
                  <div className="pt-4 border-t border-gray-100 flex justify-between items-end">
                    <span className="font-bold text-gray-400 uppercase tracking-wider text-[10px]">Total Paid</span>
                    <span className="text-3xl font-black text-gray-900 leading-none">₹{total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* RIGHT — Sidebar */}
          <div className="space-y-6">

            {/* Payment Details (PREMIUM UPGRADE) */}
            <motion.div initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }}
              className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-6">
              <h2 className="font-bold flex items-center gap-2 text-gray-900">
                <CreditCard size={18} className="text-gray-400" /> Payment Info
              </h2>
              
              <div className="space-y-4">
                {/* Payment Method Badge */}
                <div className="flex justify-between items-center pb-4 border-b border-gray-50">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Method</span>
                  <span className="text-gray-900 font-bold px-3 py-1 bg-gray-50 rounded-lg border border-gray-100 text-sm">
                    {order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Prepaid (Online)'}
                  </span>
                </div>

                {/* Status Badge */}
                <div className="flex justify-between items-center pb-4 border-b border-gray-50">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Status</span>
                  <span className={`text-xs font-bold px-3 py-1 rounded-md flex items-center gap-1.5 border uppercase tracking-wider ${
                    order.paymentStatus === 'Paid'
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {order.paymentStatus === 'Paid' ? <ShieldCheck size={14}/> : <Clock size={14}/>}
                    {order.paymentStatus || 'Pending'}
                  </span>
                </div>

                {/* Cashfree Transaction ID (If Prepaid) */}
                {order.paymentMethod === 'Online' && (
                  <div className="pt-2">
                    <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                      <div className="flex items-center gap-2 mb-2">
                        <Info size={14} className="text-blue-500" />
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Gateway Transaction</p>
                      </div>
                      {order.cfOrderId ? (
                        <div>
                          <p className="font-mono text-sm font-bold text-gray-900 break-all">{order.cfOrderId}</p>
                          <p className="text-xs text-gray-400 mt-2 font-medium">Verified securely via Cashfree.</p>
                        </div>
                      ) : (
                        <p className="text-sm font-semibold text-gray-500 italic">Transaction ID unavailable for this order.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Tracking Details Form */}
            <motion.div initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 }}
              className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-6">
              <h2 className="font-bold flex items-center gap-2 text-gray-900">
                <Truck size={18} className="text-gray-400" /> Logistics Info
              </h2>
              
              {order.awbNumber && (
                <div className="p-5 bg-gray-50 border border-gray-100 rounded-2xl">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Active Tracking</p>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                      <span className="text-xs font-semibold text-gray-500">Courier</span>
                      <span className="text-sm font-bold text-gray-900">{order.deliveryPartner || '—'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-gray-500">AWB No.</span>
                      <span className="text-sm font-bold font-mono text-gray-900">{order.awbNumber}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Update Courier</label>
                  <input type="text" value={deliveryPartner} onChange={(e) => setDeliveryPartner(e.target.value)}
                    placeholder="e.g. Delhivery, Bluedart"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 text-gray-900 placeholder:text-gray-400 rounded-xl focus:border-gray-300 focus:bg-white focus:ring-4 focus:ring-gray-100 focus:outline-none transition text-sm font-semibold" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Update AWB / Tracking</label>
                  <input type="text" value={awbNumber} onChange={(e) => setAwbNumber(e.target.value)}
                    placeholder="Enter tracking number"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 text-gray-900 placeholder:text-gray-400 rounded-xl focus:border-gray-300 focus:bg-white focus:ring-4 focus:ring-gray-100 focus:outline-none transition text-sm font-mono font-bold" />
                </div>
                <button onClick={updateTracking} disabled={savingTracking}
                  className="w-full py-4 bg-black hover:bg-gray-800 text-white font-bold rounded-xl transition disabled:opacity-50 text-sm shadow-lg shadow-black/5">
                  {savingTracking ? 'Saving...' : 'Save Tracking Info'}
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
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100"
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-50 bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                    <Truck size={18} className="text-gray-700" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">Mark as Shipped</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">Notify Customer</p>
                  </div>
                </div>
                <button onClick={() => setShowShipDialog(false)} className="p-2 hover:bg-gray-100 rounded-xl transition text-gray-400 hover:text-gray-900">
                  <X size={18} />
                </button>
              </div>

              <div className="px-6 py-6 space-y-5">
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-sm flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Order</p>
                    <p className="font-mono text-gray-900 font-bold">{order.orderId || order.id}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Customer</p>
                    <p className="font-semibold text-gray-900">{order.customerName}</p>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Courier Partner *</label>
                  <select value={shipCourier} onChange={(e) => setShipCourier(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-200 text-gray-900 rounded-xl focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none transition text-sm font-semibold">
                    <option value="">Select Courier</option>
                    {['Delhivery', 'Bluedart', 'DTDC', 'Ecom Express', 'XpressBees', 'Shadowfax', 'Dunzo', 'Other'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">AWB / Tracking Number *</label>
                  <input type="text" value={shipAwb} onChange={(e) => setShipAwb(e.target.value)}
                    placeholder="e.g. 12345678901234"
                    className="w-full px-4 py-3 bg-white border border-gray-200 text-gray-900 placeholder:text-gray-300 rounded-xl focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none transition text-sm font-mono font-bold" />
                </div>

                <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-start gap-3 text-xs text-blue-700 font-medium">
                  <Send size={16} className="flex-shrink-0 mt-0.5 text-blue-500" />
                  <p className="leading-relaxed">A shipping notification will be sent to <strong className="text-blue-900">{order.email}</strong> with tracking details.</p>
                </div>
              </div>

              <div className="px-6 pb-6 space-y-3">
                <button
                  onClick={() => handleConfirmShipped(true)}
                  disabled={sendingEmail || !shipCourier || !shipAwb}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-black hover:bg-gray-800 text-white font-bold rounded-xl transition disabled:opacity-50 shadow-lg shadow-black/5"
                >
                  {sendingEmail ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send size={16} />}
                  {sendingEmail ? 'Sending Email...' : 'Mark Shipped & Notify Customer'}
                </button>
                <button
                  onClick={() => handleConfirmShipped(false)}
                  disabled={sendingEmail}
                  className="w-full py-3.5 text-gray-500 hover:text-gray-900 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition font-bold text-sm"
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
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100"
            >
              <div className={`flex items-center justify-between px-6 py-5 border-b ${pendingActionStatus === 'Cancelled' ? 'bg-red-50 border-red-100' : pendingActionStatus === 'Delivered' ? 'bg-green-50 border-green-100' : 'bg-orange-50 border-orange-100'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-white border shadow-sm ${pendingActionStatus === 'Cancelled' ? 'border-red-200 text-red-500' : pendingActionStatus === 'Delivered' ? 'border-green-200 text-green-500' : 'border-orange-200 text-orange-500'}`}>
                    {pendingActionStatus === 'Delivered' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">Mark as {pendingActionStatus}</h3>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-0.5">Action Required</p>
                  </div>
                </div>
                <button onClick={() => setShowStatusActionDialog(false)} className="p-2 hover:bg-white rounded-xl transition text-gray-500 hover:text-gray-900 shadow-sm border border-transparent hover:border-gray-200">
                  <X size={18} />
                </button>
              </div>

              <div className="px-6 py-6 space-y-5">
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-sm flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Order</p>
                    <p className="font-mono text-gray-900 font-bold">{order.orderId || order.id}</p>
                  </div>
                </div>

                {pendingActionStatus !== 'Delivered' ? (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl flex items-start gap-3 text-xs text-gray-600 font-medium">
                    <Package size={16} className="flex-shrink-0 mt-0.5 text-gray-400" />
                    <p className="leading-relaxed">All items in this order will be <strong className="text-gray-900">automatically restocked</strong>.</p>
                  </div>
                ) : (
                  <div className="p-4 bg-green-50 border border-green-100 rounded-2xl flex items-start gap-3 text-xs text-green-700 font-medium">
                    <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5 text-green-500" />
                    <p className="leading-relaxed">Marking as Delivered will update the final status. Sending an email will inform the customer.</p>
                  </div>
                )}
              </div>

              <div className="px-6 pb-6 space-y-3">
                <button
                  onClick={() => handleConfirmActionStatus(true)}
                  disabled={sendingEmail}
                  className={`w-full flex items-center justify-center gap-2 py-4 font-bold rounded-xl transition disabled:opacity-50 text-white ${pendingActionStatus === 'Cancelled' ? 'bg-red-500 hover:bg-red-600' : pendingActionStatus === 'Delivered' ? 'bg-green-500 hover:bg-green-600' : 'bg-orange-500 hover:bg-orange-600'}`}
                >
                  {sendingEmail ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send size={16} />}
                  {sendingEmail ? 'Processing...' : `Mark ${pendingActionStatus} & Email Customer`}
                </button>
                <button
                  onClick={() => handleConfirmActionStatus(false)}
                  disabled={sendingEmail}
                  className="w-full py-3.5 text-gray-600 hover:text-gray-900 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition font-bold text-sm"
                >
                  Mark {pendingActionStatus} Only (No Email)
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
