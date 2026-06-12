'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Eye, ShoppingCart, Search, Filter, Package, Clock, Truck, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';

interface Order {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  totalAmount: number;
  status: string;
  items: any[];
  createdAt: any;
  orderId?: string;
}

const statusOptions = ['All', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'RTO'];

const statusConfig: Record<string, { badge: string; dot: string }> = {
  Pending:    { badge: 'bg-amber-50 text-amber-700 border-amber-200',   dot: 'bg-amber-400' },
  Processing: { badge: 'bg-blue-50 text-blue-700 border-blue-200',     dot: 'bg-blue-400' },
  Shipped:    { badge: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-400' },
  Delivered:  { badge: 'bg-green-50 text-green-700 border-green-200',  dot: 'bg-green-400' },
  Cancelled:  { badge: 'bg-red-50 text-red-700 border-red-200',        dot: 'bg-red-400' },
  RTO:        { badge: 'bg-orange-50 text-orange-700 border-orange-200', dot: 'bg-orange-400' },
};

const tabColors: Record<string, string> = {
  All:        'border-gray-300 text-gray-700',
  Pending:    'border-amber-400 text-amber-700 bg-amber-50',
  Processing: 'border-blue-400 text-blue-700 bg-blue-50',
  Shipped:    'border-purple-400 text-purple-700 bg-purple-50',
  Delivered:  'border-green-400 text-green-700 bg-green-50',
  Cancelled:  'border-red-400 text-red-700 bg-red-50',
  RTO:        'border-orange-400 text-orange-700 bg-orange-50',
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'orders'));
      const ordersList: Order[] = [];
      querySnapshot.forEach((doc) => ordersList.push({ id: doc.id, ...doc.data() } as Order));
      ordersList.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        return (dateB || 0) - (dateA || 0);
      });
      setOrders(ordersList);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
      setLoading(false);
    }
  };

  const filtered = orders
    .filter(o => activeTab === 'All' || o.status === activeTab)
    .filter(o => !search || o.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      (o.orderId || o.id).toLowerCase().includes(search.toLowerCase()) ||
      o.phone?.includes(search));

  const getCount = (s: string) => s === 'All' ? orders.length : orders.filter(o => o.status === s).length;

  return (
    <div className="p-6 lg:p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-center">
            <ShoppingCart size={20} className="text-blue-600" />
          </div>
          <h1 className="text-3xl font-black text-gray-900">Orders</h1>
        </div>
        <p className="text-gray-500 text-sm ml-13">Manage customer orders and fulfillment</p>
      </motion.div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total', count: orders.length, icon: Package, color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200' },
          { label: 'Pending', count: orders.filter(o => o.status === 'Pending').length, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
          { label: 'Shipped', count: orders.filter(o => o.status === 'Shipped').length, icon: Truck, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200' },
          { label: 'Delivered', count: orders.filter(o => o.status === 'Delivered').length, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50 border-green-200' },
        ].map(({ label, count, icon: Icon, color, bg }) => (
          <div key={label} className={`bg-white rounded-2xl p-4 border shadow-sm flex items-center gap-3 ${bg}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg}`}>
              <Icon size={18} className={color} />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900">{count}</p>
              <p className={`text-xs font-bold ${color}`}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search + Tabs */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-6 overflow-hidden">
        {/* Search Bar */}
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by customer name, order ID, or phone..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/10 outline-none transition"
            />
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex overflow-x-auto scrollbar-hide px-5 py-3 gap-2 border-b border-gray-100">
          {statusOptions.map((s) => (
            <button
              key={s}
              onClick={() => setActiveTab(s)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition border ${
                activeTab === s
                  ? `${tabColors[s]} border-current shadow-sm`
                  : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {s !== 'All' && statusConfig[s] && <span className={`w-1.5 h-1.5 rounded-full ${statusConfig[s].dot}`} />}
              {s} <span className="opacity-60">({getCount(s)})</span>
            </button>
          ))}
        </div>

        {/* Orders Table */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Package size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-400 font-semibold">No orders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-5 py-3 text-left text-[11px] font-black text-gray-400 uppercase tracking-wider">Order ID</th>
                  <th className="px-5 py-3 text-left text-[11px] font-black text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-5 py-3 text-left text-[11px] font-black text-gray-400 uppercase tracking-wider">Customer</th>
                  <th className="px-5 py-3 text-left text-[11px] font-black text-gray-400 uppercase tracking-wider">Items</th>
                  <th className="px-5 py-3 text-left text-[11px] font-black text-gray-400 uppercase tracking-wider">Amount</th>
                  <th className="px-5 py-3 text-left text-[11px] font-black text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 text-center text-[11px] font-black text-gray-400 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((order, i) => {
                  const cfg = statusConfig[order.status] || { badge: 'bg-gray-50 text-gray-700 border-gray-200', dot: 'bg-gray-400' };
                  return (
                    <motion.tr key={order.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                      className="hover:bg-gray-50 transition group">
                      <td className="px-5 py-4">
                        <span className="text-gray-900 font-mono text-xs font-bold bg-gray-100 px-2 py-1 rounded-lg">
                          {(order.orderId || order.id).slice(0, 16)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-gray-500 text-sm">
                        {order.createdAt?.toDate
                          ? order.createdAt.toDate().toLocaleDateString('en-IN')
                          : (order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN') : 'N/A')}
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-gray-900 font-semibold text-sm">{order.customerName}</p>
                        <p className="text-gray-400 text-xs">{order.phone}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-gray-500 text-sm font-medium">{order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-gray-900 font-black text-sm">₹{(order.totalAmount || 0).toLocaleString()}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${cfg.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          {order.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <Link href={`/admin/orders/${order.id}`}
                          className="inline-flex items-center gap-1.5 bg-gray-100 hover:bg-green-50 hover:text-green-700 text-gray-600 px-3 py-1.5 rounded-xl text-xs font-bold transition border border-transparent hover:border-green-200">
                          <Eye size={13} /> View
                        </Link>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
