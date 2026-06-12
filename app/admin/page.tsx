'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import { motion } from 'framer-motion';
import {
  ShoppingCart, Package, DollarSign, Users, TrendingUp,
  AlertTriangle, Clock, CheckCircle, XCircle, Truck, ArrowUpRight
} from 'lucide-react';
import Link from 'next/link';

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const getStatusBadge = (status: string) => {
  const map: Record<string, string> = {
    Pending: 'bg-amber-50 text-amber-700 border-amber-200',
    Processing: 'bg-blue-50 text-blue-700 border-blue-200',
    Shipped: 'bg-purple-50 text-purple-700 border-purple-200',
    Delivered: 'bg-green-50 text-green-700 border-green-200',
    Cancelled: 'bg-red-50 text-red-700 border-red-200',
    RTO: 'bg-orange-50 text-orange-700 border-orange-200',
  };
  return map[status] || 'bg-gray-50 text-gray-700 border-gray-200';
};

const getStatusDot = (status: string) => {
  const map: Record<string, string> = {
    Pending: 'bg-amber-400',
    Processing: 'bg-blue-400',
    Shipped: 'bg-purple-400',
    Delivered: 'bg-green-400',
    Cancelled: 'bg-red-400',
    RTO: 'bg-orange-400',
  };
  return map[status] || 'bg-gray-400';
};

interface StatCardProps { icon: any; label: string; value: string | number; color: string; bgColor: string; sub?: string; trend?: string }

const StatCard = ({ icon: Icon, label, value, color, bgColor, sub, trend }: StatCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -2 }}
    className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md transition-all duration-300"
  >
    <div className="flex items-start justify-between mb-5">
      <div className={`w-12 h-12 ${bgColor} rounded-xl flex items-center justify-center`}>
        <Icon size={22} style={{ color }} />
      </div>
      {trend && (
        <div className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 border border-green-200 px-2 py-1 rounded-full">
          <ArrowUpRight size={12} />
          {trend}
        </div>
      )}
    </div>
    <p className="text-3xl font-black text-gray-900 mb-1">{value}</p>
    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</p>
    {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
  </motion.div>
);

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalOrders: 0, totalProducts: 0, totalRevenue: 0, totalCustomers: 0 });
  const [chartData, setChartData] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const ordersSnap = await getDocs(collection(db, 'orders'));
        const ordersList: any[] = [];
        ordersSnap.forEach(d => ordersList.push({ id: d.id, ...d.data() }));
        const totalRevenue = ordersList.reduce((s, o) => s + (o.totalAmount || 0), 0);

        const monthMap: Record<number, { revenue: number; orders: number }> = {};
        for (let i = 0; i < 12; i++) monthMap[i] = { revenue: 0, orders: 0 };
        ordersList.forEach(o => {
          const d = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt?.seconds * 1000 || Date.now());
          const m = d.getMonth();
          monthMap[m].revenue += o.totalAmount || 0;
          monthMap[m].orders += 1;
        });

        const now = new Date();
        const last6 = Array.from({ length: 6 }, (_, i) => {
          const m = (now.getMonth() - 5 + i + 12) % 12;
          return { month: MONTH_LABELS[m], revenue: monthMap[m].revenue, orders: monthMap[m].orders };
        });
        setChartData(last6);

        const sorted = [...ordersList].sort((a, b) => {
          const da = a.createdAt?.seconds || 0;
          const db2 = b.createdAt?.seconds || 0;
          return db2 - da;
        });
        setRecentOrders(sorted.slice(0, 5));

        const productsSnap = await getDocs(collection(db, 'products'));
        const productsList: any[] = [];
        productsSnap.forEach(d => productsList.push({ id: d.id, ...d.data() }));
        const lowStock = productsList.filter(p => (p.stock ?? 0) <= 10).sort((a, b) => (a.stock ?? 0) - (b.stock ?? 0)).slice(0, 5);
        setLowStockProducts(lowStock);

        const customersSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'customer')));
        setStats({ totalOrders: ordersList.length, totalProducts: productsList.length, totalRevenue, totalCustomers: customersSnap.size });
      } catch (e) {
        console.error('Dashboard fetch error:', e);
        setChartData(['Jan','Feb','Mar','Apr','May','Jun'].map(m => ({ month: m, revenue: 0, orders: 0 })));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500" />
          <p className="text-gray-500 font-semibold text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 bg-gray-50 min-h-screen space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 border border-green-200 rounded-xl flex items-center justify-center">
              <TrendingUp size={20} className="text-green-600" />
            </div>
            Dashboard
          </h1>
          <p className="text-gray-500 mt-1 text-sm">Live business overview — all data from Firestore</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-500 font-medium shadow-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          Live Data
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard icon={ShoppingCart} label="Total Orders" value={stats.totalOrders} color="#16a34a" bgColor="bg-green-50" sub="All time" />
        <StatCard icon={Package} label="Total Products" value={stats.totalProducts} color="#059669" bgColor="bg-emerald-50" sub="In catalog" />
        <StatCard icon={DollarSign} label="Total Revenue" value={`₹${stats.totalRevenue.toLocaleString()}`} color="#0284c7" bgColor="bg-sky-50" sub="Gross sales" />
        <StatCard icon={Users} label="Customers" value={stats.totalCustomers} color="#7c3aed" bgColor="bg-violet-50" sub="Registered" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp size={18} className="text-green-600" /> Revenue Trend
            </h2>
            <span className="text-xs text-gray-400 font-medium">Last 6 Months</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16a34a" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#9ca3af" tick={{ fontSize: 11, fontWeight: 600 }} />
              <YAxis stroke="#9ca3af" tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: 12 }} formatter={(v: any) => [`₹${v.toLocaleString()}`, 'Revenue']} />
              <Area type="monotone" dataKey="revenue" stroke="#16a34a" strokeWidth={2.5} fill="url(#revGrad)" dot={{ fill: '#16a34a', r: 4, strokeWidth: 2, stroke: '#fff' }} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <ShoppingCart size={18} className="text-blue-600" /> Orders by Month
            </h2>
            <span className="text-xs text-gray-400 font-medium">Last 6 Months</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#9ca3af" tick={{ fontSize: 11, fontWeight: 600 }} />
              <YAxis stroke="#9ca3af" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: 12 }} formatter={(v: any) => [v, 'Orders']} />
              <Bar dataKey="orders" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900 flex items-center gap-2 text-sm">
              <ShoppingCart size={16} className="text-green-600" /> Recent Orders
            </h2>
            <Link href="/admin/orders" className="text-xs text-green-600 hover:text-green-700 font-bold transition flex items-center gap-1">View all <ArrowUpRight size={12} /></Link>
          </div>
          {recentOrders.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">No orders yet</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentOrders.map(order => (
                <div key={order.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition group">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${getStatusDot(order.status)}`} />
                    <div className="min-w-0">
                      <p className="text-gray-900 font-semibold text-sm truncate">{order.customerName || 'Guest'}</p>
                      <p className="text-gray-400 text-xs font-mono">{(order.orderId || order.id).slice(0, 14)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusBadge(order.status)}`}>{order.status}</span>
                    <span className="text-green-600 font-black text-sm font-mono whitespace-nowrap">₹{(order.totalAmount || 0).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Low Stock Alert */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900 flex items-center gap-2 text-sm">
              <AlertTriangle size={16} className="text-amber-500" /> Low Stock Alerts
            </h2>
            <Link href="/admin/stock" className="text-xs text-green-600 hover:text-green-700 font-bold transition flex items-center gap-1">Manage <ArrowUpRight size={12} /></Link>
          </div>
          {lowStockProducts.length === 0 ? (
            <div className="p-8 text-center flex flex-col items-center gap-3">
              <div className="w-12 h-12 bg-green-50 border border-green-200 rounded-full flex items-center justify-center">
                <CheckCircle size={22} className="text-green-500" />
              </div>
              <p className="text-gray-400 text-sm">All products are well-stocked!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {lowStockProducts.map(product => (
                <div key={product.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition">
                  <div className="min-w-0 flex-1">
                    <p className="text-gray-900 font-semibold text-sm truncate">{product.name}</p>
                    <p className="text-gray-400 text-xs">{product.category}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    product.stock === 0 ? 'bg-red-50 text-red-600 border-red-200' : 'bg-amber-50 text-amber-600 border-amber-200'
                  }`}>
                    {product.stock === 0 ? 'Out of Stock' : `${product.stock} left`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
