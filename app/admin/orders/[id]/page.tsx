'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { ArrowLeft, Clock, CreditCard, User, Phone, MapPin, Package } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
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
  items: OrderItem[];
  createdAt: any;
  paymentMethod: string;
  userId?: string;
  awbNumber?: string;
  deliveryPartner?: string;
}

const statusOptions = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

export default function OrderDetailsPage() {
  const params = useParams();
  const id = params?.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [awbNumber, setAwbNumber] = useState('');
  const [deliveryPartner, setDeliveryPartner] = useState('');
  const [savingTracking, setSavingTracking] = useState(false);
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
      setLoading(false);
    } catch (error) {
      console.error('Error fetching order:', error);
      toast.error('Failed to load order details');
      setLoading(false);
    }
  };

  const updateOrderStatus = async (newStatus: string) => {
    if (!order) return;
    try {
      await updateDoc(doc(db, 'orders', order.id), {
        status: newStatus,
        updatedAt: new Date(),
      });
      setOrder({ ...order, status: newStatus });
      toast.success('Order status updated!');
    } catch (error) {
      toast.error('Failed to update order');
    }
  };

  const updateTracking = async () => {
    if (!order) return;
    setSavingTracking(true);
    try {
      await updateDoc(doc(db, 'orders', order.id), {
        awbNumber,
        deliveryPartner,
        updatedAt: new Date(),
      });
      setOrder({ ...order, awbNumber, deliveryPartner });
      toast.success('Tracking details updated!');
    } catch (error) {
      toast.error('Failed to update tracking details');
    }
    setSavingTracking(false);
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      Pending: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      Processing: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      Shipped: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      Delivered: 'bg-green-500/20 text-green-300 border-green-500/30',
      Cancelled: 'bg-red-500/20 text-red-300 border-red-500/30',
    };
    return colors[status] || 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8 bg-gradient-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="min-h-screen p-8 bg-gradient-dark text-white">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/orders" className="p-2 hover:bg-white/10 rounded-full transition">
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Order Details</h1>
          <p className="text-gray-400 font-mono mt-1">ID: {order.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Order Items */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass p-6 rounded-2xl border border-white/10"
          >
            <div className="flex items-center gap-2 mb-6">
              <Package className="text-green-400" />
              <h2 className="text-xl font-bold">Ordered Products</h2>
            </div>

            <div className="space-y-4">
              {(Array.isArray(order.items) ? order.items : []).map((item, idx) => (
                <div key={idx} className="bg-white/5 p-4 rounded-xl border border-white/10 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{item.name}</h3>
                    <div className="text-sm text-gray-400 flex flex-wrap gap-x-4 gap-y-1 mt-1">
                      {item.sku && <span className="text-green-300 font-mono">SKU: {item.sku}</span>}
                      {item.flavor && <span>Flavor: {item.flavor}</span>}
                      {item.unit && <span>Size: {item.unit}</span>}
                      {item.isPromo && <span className="bg-green-500/20 text-green-300 px-2 rounded">Promo Gift</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      ₹{Number(item.price || 0).toLocaleString()} x {item.quantity || 1}
                    </div>
                    {(item.originalPrice || 0) > (item.price || 0) && (
                      <div className="text-xs text-gray-500 line-through">
                        MRP: ₹{Number(item.originalPrice || 0).toLocaleString()}
                      </div>
                    )}
                    <div className="text-lg font-bold text-green-400 mt-1">
                      ₹{Number((item.price || 0) * (item.quantity || 1)).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-white/10 space-y-2">
              <div className="flex justify-between text-gray-400">
                <span>Subtotal</span>
                <span>₹{((order.totalAmount || 0) + (order.discountAmount || 0)).toLocaleString()}</span>
              </div>
              {order.discountAmount && order.discountAmount > 0 && (
                <div className="flex justify-between text-green-400">
                  <span>Discount</span>
                  <span>- ₹{Number(order.discountAmount || 0).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-xl font-bold text-white pt-2 border-t border-white/10">
                <span>Total Amount</span>
                <span>₹{(order.totalAmount || 0).toLocaleString()}</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          
          {/* Status Controls */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass p-6 rounded-2xl border border-white/10"
          >
            <h2 className="text-xl font-bold mb-4">Order Status</h2>
            <div className="mb-4">
              <span className={`px-4 py-2 rounded-lg text-sm font-semibold border ${getStatusColor(order.status)}`}>
                Current: {order.status}
              </span>
            </div>
            <label className="text-sm text-gray-400 block mb-2">Update Status</label>
            <select
              value={order.status}
              onChange={(e) => updateOrderStatus(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status} className="bg-gray-900">
                  {status}
                </option>
              ))}
            </select>
          </motion.div>

          {/* Tracking Controls */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 }}
            className="glass p-6 rounded-2xl border border-white/10 space-y-4"
          >
            <h2 className="text-xl font-bold mb-2">Tracking Details</h2>
            
            <div>
              <label className="text-sm text-gray-400 block mb-1">Delivery Partner</label>
              <input
                type="text"
                value={deliveryPartner}
                onChange={(e) => setDeliveryPartner(e.target.value)}
                placeholder="e.g. Delhivery, Bluedart"
                className="w-full px-4 py-2 bg-white/5 border border-white/10 text-white rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
              />
            </div>
            
            <div>
              <label className="text-sm text-gray-400 block mb-1">AWB Number</label>
              <input
                type="text"
                value={awbNumber}
                onChange={(e) => setAwbNumber(e.target.value)}
                placeholder="Enter tracking number"
                className="w-full px-4 py-2 bg-white/5 border border-white/10 text-white rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
              />
            </div>
            
            <button
              onClick={updateTracking}
              disabled={savingTracking}
              className="w-full py-2 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-xl transition disabled:opacity-50"
            >
              {savingTracking ? 'Saving...' : 'Update Tracking'}
            </button>
          </motion.div>

          {/* Customer Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="glass p-6 rounded-2xl border border-white/10 space-y-6"
          >
            <h2 className="text-xl font-bold mb-2">Customer Details</h2>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="text-gray-400 shrink-0 mt-0.5" size={18} />
                <div>
                  <p className="font-semibold">{order.customerName}</p>
                  <p className="text-sm text-gray-400">{order.email}</p>
                  {order.userId && <p className="text-xs text-gray-500 mt-1 font-mono">ID: {order.userId}</p>}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="text-gray-400 shrink-0 mt-0.5" size={18} />
                <div>
                  <p className="text-sm">{order.phone}</p>
                  {order.address?.alternatePhone && (
                    <p className="text-sm text-gray-400">Alt: {order.address.alternatePhone}</p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="text-gray-400 shrink-0 mt-0.5" size={18} />
                <div className="text-sm text-gray-300">
                  <p>{order.address?.address}</p>
                  <p>{order.address?.city}, {order.address?.state} {order.address?.pinCode}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Payment Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="glass p-6 rounded-2xl border border-white/10 space-y-4"
          >
            <h2 className="text-xl font-bold mb-2">Payment Details</h2>
            
            <div className="flex items-center gap-3">
              <CreditCard className="text-gray-400" size={18} />
              <div>
                <p className="text-sm text-gray-400">Method</p>
                <p className="font-semibold uppercase">{order.paymentMethod}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Clock className="text-gray-400" size={18} />
              <div>
                <p className="text-sm text-gray-400">Time Placed</p>
                <p className="font-semibold">
                  {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString() : (order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A')}
                </p>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
