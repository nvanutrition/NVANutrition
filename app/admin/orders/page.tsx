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
  All:        'bg-white text-gray-700 border-gray-200',
  Pending:    'bg-amber-50 text-amber-700 border-amber-200',
  Processing: 'bg-blue-50 text-blue-700 border-blue-200',
  Shipped:    'bg-purple-50 text-purple-700 border-purple-200',
  Delivered:  'bg-green-50 text-green-700 border-green-200',
  Cancelled:  'bg-red-50 text-red-700 border-red-200',
  RTO:        'bg-orange-50 text-orange-700 border-orange-200',
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
    <div className="p-4 sm:p-8 bg-[#fcfcfc] min-h-screen font-sans">
      
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-lg">
            <ShoppingCart size={20} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
        </div>
        <p className="text-gray-500 text-sm mt-1">Manage and track customer orders</p>
      </motion.div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Orders', count: orders.length, icon: Package, color: 'text-gray-900', bg: 'bg-gray-50' },
          { label: 'Pending', count: orders.filter(o => o.status === 'Pending').length, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Shipped', count: orders.filter(o => o.status === 'Shipped').length, icon: Truck, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Delivered', count: orders.filter(o => o.status === 'Delivered').length, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
        ].map(({ label, count, icon: Icon, color, bg }) => (
          <motion.div key={label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`bg-white rounded-3xl p-5 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg} mb-4`}>
              <Icon size={18} className={color} />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900">{count}</p>
              <p className={`text-xs font-bold uppercase tracking-wider text-gray-500`}>{label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Search & Tabs Container */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
        
        {/* Search */}
        <div className="p-5 border-b border-gray-50">
          <div className="relative max-w-md">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search order ID, customer name, or phone..."
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto scrollbar-hide px-5 py-4 gap-2 border-b border-gray-50 bg-white">
          {statusOptions.map((s) => (
            <button
              key={s}
              onClick={() => setActiveTab(s)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition border ${
                activeTab === s
                  ? `${tabColors[s]} shadow-sm`
                  : 'bg-white text-gray-500 border-gray-100 hover:bg-gray-50'
              }`}
            >
              {s !== 'All' && statusConfig[s] && <span className={`w-2 h-2 rounded-full ${statusConfig[s].dot}`} />}
              {s} <span className="opacity-50 ml-1">({getCount(s)})</span>
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-gray-100 border-t-black rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center">
              <Package size={40} className="mx-auto text-gray-200 mb-4" />
              <p className="text-gray-500 font-semibold">No orders found.</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-gray-50/50 text-gray-400 text-xs uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-6 py-4 font-medium border-b border-gray-50">Order Details</th>
                  <th className="px-6 py-4 font-medium border-b border-gray-50">Customer</th>
                  <th className="px-6 py-4 font-medium border-b border-gray-50">Amount</th>
                  <th className="px-6 py-4 font-medium border-b border-gray-50">Status</th>
                  <th className="px-6 py-4 font-medium border-b border-gray-50 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((order, i) => {
                  const cfg = statusConfig[order.status] || { badge: 'bg-gray-50 text-gray-700 border-gray-200', dot: 'bg-gray-400' };
                  return (
                    <motion.tr key={order.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-gray-50/50 transition group">
                      <td className="px-6 py-5">
                        <p className="text-gray-900 font-mono text-sm font-bold mb-1">{(order.orderId || order.id).slice(0, 16)}...</p>
                        <p className="text-xs text-gray-400 font-medium">
                          {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString('en-IN') : 'N/A'} • {order.items?.length || 0} item(s)
                        </p>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-gray-900 font-semibold text-sm mb-1">{order.customerName}</p>
                        <p className="text-xs text-gray-400 font-medium">{order.phone}</p>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-gray-900 font-black text-sm">₹{(order.totalAmount || 0).toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold border uppercase tracking-wider ${cfg.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <Link href={`/admin/orders/${order.id}`}>
                          <button className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-900 px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm inline-flex items-center gap-2">
                            <Eye size={14} /> View
                          </button>
                        </Link>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </motion.div>
    </div>
  );
}
