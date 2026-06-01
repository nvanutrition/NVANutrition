'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import { motion } from 'framer-motion';
import {
  ShoppingCart, Package, DollarSign, Users, TrendingUp,
  AlertTriangle, Clock, CheckCircle, XCircle, Truck
} from 'lucide-react';

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const getStatusIcon = (status: string) => {
  const map: Record<string, any> = {
    Pending:    { icon: Clock,         color: 'text-yellow-400' },
    Processing: { icon: Package,       color: 'text-blue-400' },
    Shipped:    { icon: Truck,         color: 'text-purple-400' },
    Delivered:  { icon: CheckCircle,   color: 'text-green-400' },
    Cancelled:  { icon: XCircle,       color: 'text-red-400' },
  };
  return map[status] || { icon: Clock, color: 'text-gray-400' };
};

const getStatusBadge = (status: string) => {
  const map: Record<string, string> = {
    Pending:    'bg-yellow-500/10 text-yellow-300 border-yellow-500/20',
    Processing: 'bg-blue-500/10   text-blue-300   border-blue-500/20',
    Shipped:    'bg-purple-500/10 text-purple-300  border-purple-500/20',
    Delivered:  'bg-green-500/10  text-green-300   border-green-500/20',
    Cancelled:  'bg-red-500/10    text-red-300     border-red-500/20',
  };
  return map[status] || 'bg-gray-500/10 text-gray-300 border-gray-500/20';
};

interface StatCardProps { icon: any; label: string; value: string | number; color: string; sub?: string }

const StatCard = ({ icon: Icon, label, value, color, sub }: StatCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="glass rounded-xl p-6 border border-white/10 hover:border-green-500/30 transition-all duration-300 group"
  >
    <div className="flex items-start justify-between mb-4">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center"
        style={{ backgroundColor: `${color}15` }}
      >
        <Icon size={24} style={{ color }} />
      </div>
      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</span>
    </div>
    <p className="text-3xl font-black text-white">{value}</p>
    {sub && <p className="text-xs text-gray-500 mt-1 font-semibold">{sub}</p>}
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
        // ---- Orders ----
        const ordersSnap = await getDocs(collection(db, 'orders'));
        const ordersList: any[] = [];
        ordersSnap.forEach(d => ordersList.push({ id: d.id, ...d.data() }));

        const totalRevenue = ordersList.reduce((s, o) => s + (o.totalAmount || 0), 0);

        // Group revenue + orders by month
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

        // Recent 5 orders (newest first)
        const sorted = [...ordersList].sort((a, b) => {
          const da = a.createdAt?.seconds || 0;
          const db2 = b.createdAt?.seconds || 0;
          return db2 - da;
        });
        setRecentOrders(sorted.slice(0, 5));

        // ---- Products ----
        const productsSnap = await getDocs(collection(db, 'products'));
        const productsList: any[] = [];
        productsSnap.forEach(d => productsList.push({ id: d.id, ...d.data() }));
        const lowStock = productsList
          .filter(p => (p.stock ?? 0) <= 10)
          .sort((a, b) => (a.stock ?? 0) - (b.stock ?? 0))
          .slice(0, 5);
        setLowStockProducts(lowStock);

        // ---- Customers ----
        const customersSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'customer')));

        setStats({
          totalOrders: ordersList.length,
          totalProducts: productsList.length,
          totalRevenue,
          totalCustomers: customersSnap.size,
        });
      } catch (e) {
        console.error('Dashboard fetch error:', e);
        // Fallback chart
        setChartData(['Jan','Feb','Mar','Apr','May','Jun'].map(m => ({ month: m, revenue: 0, orders: 0 })));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-dark">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500" />
          <p className="text-white/70 font-semibold">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gradient-dark min-h-screen space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl font-black text-white flex items-center gap-3">
          <TrendingUp className="text-green-500" /> Dashboard
        </h1>
        <p className="text-gray-400 mt-1">Live business overview — all data from Firestore</p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard icon={ShoppingCart} label="Total Orders"    value={stats.totalOrders}                             color="#00C853" sub="All time" />
        <StatCard icon={Package}      label="Total Products"  value={stats.totalProducts}                           color="#69F0AE" sub="In catalog" />
        <StatCard icon={DollarSign}   label="Total Revenue"   value={`₹${stats.totalRevenue.toLocaleString()}`}    color="#10B981" sub="Gross sales" />
        <StatCard icon={Users}        label="Customers"       value={stats.totalCustomers}                          color="#3B82F6" sub="Registered" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Area Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl p-6 border border-white/10"
        >
          <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
            <TrendingUp size={20} className="text-green-400" /> Revenue Trend (Last 6 Months)
          </h2>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#00C853" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00C853" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="month" stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 11 }} />
              <YAxis stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(0,200,83,0.3)', borderRadius: 12 }}
                labelStyle={{ color: '#fff', fontWeight: 700 }}
                formatter={(v: any) => [`₹${v.toLocaleString()}`, 'Revenue']}
              />
              <Area type="monotone" dataKey="revenue" stroke="#00C853" strokeWidth={2.5} fill="url(#revGrad)" dot={{ fill: '#00C853', r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Orders Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl p-6 border border-white/10"
        >
          <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
            <ShoppingCart size={20} className="text-blue-400" /> Orders by Month
          </h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="month" stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 11 }} />
              <YAxis stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 12 }}
                labelStyle={{ color: '#fff', fontWeight: 700 }}
                formatter={(v: any) => [v, 'Orders']}
              />
              <Bar dataKey="orders" fill="#3B82F6" radius={[6, 6, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Bottom Row: Recent Orders + Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl border border-white/10 overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
            <h2 className="font-bold text-white flex items-center gap-2">
              <ShoppingCart size={18} className="text-green-400" /> Recent Orders
            </h2>
            <a href="/admin/orders" className="text-xs text-green-400 hover:text-green-300 font-bold transition">View all →</a>
          </div>
          {recentOrders.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No orders yet</div>
          ) : (
            <div className="divide-y divide-white/5">
              {recentOrders.map(order => {
                const { icon: StatusIcon, color } = getStatusIcon(order.status);
                return (
                  <div key={order.id} className="px-6 py-3.5 flex items-center justify-between hover:bg-white/5 transition">
                    <div className="flex items-center gap-3 min-w-0">
                      <StatusIcon size={16} className={color} />
                      <div className="min-w-0">
                        <p className="text-white font-semibold text-sm truncate">{order.customerName || 'Guest'}</p>
                        <p className="text-gray-500 text-xs font-mono">{(order.orderId || order.id).slice(0, 14)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${getStatusBadge(order.status)}`}>
                        {order.status}
                      </span>
                      <span className="text-green-400 font-black text-sm font-mono whitespace-nowrap">
                        ₹{(order.totalAmount || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Low Stock Alert */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl border border-white/10 overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
            <h2 className="font-bold text-white flex items-center gap-2">
              <AlertTriangle size={18} className="text-amber-400" /> Low Stock Alerts
            </h2>
            <a href="/admin/stock" className="text-xs text-green-400 hover:text-green-300 font-bold transition">Manage stock →</a>
          </div>
          {lowStockProducts.length === 0 ? (
            <div className="p-8 text-center text-gray-500 flex flex-col items-center gap-2">
              <CheckCircle size={24} className="text-green-500" />
              <span>All products are well-stocked!</span>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {lowStockProducts.map(product => (
                <div key={product.id} className="px-6 py-3.5 flex items-center justify-between hover:bg-white/5 transition">
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-semibold text-sm truncate">{product.name}</p>
                    <p className="text-gray-500 text-xs">{product.category}</p>
                  </div>
                  <div className="flex items-center gap-3 ml-3 flex-shrink-0">
                    <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${
                      product.stock === 0
                        ? 'bg-red-500/10 text-red-400 border-red-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {product.stock === 0 ? 'Out of Stock' : `${product.stock} left`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
