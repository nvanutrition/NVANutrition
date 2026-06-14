'use client';

import { useEffect, useState, useMemo } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart, Package, DollarSign, Users, TrendingUp,
  AlertTriangle, CheckCircle, XCircle, ArrowUpRight,
  Download, Calendar, Filter, Star
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

export default function AdminDashboard() {
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [allUsersCount, setAllUsersCount] = useState(0);
  
  const [timeFilter, setTimeFilter] = useState<'7D' | '30D' | 'ALL'>('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const ordersSnap = await getDocs(collection(db, 'orders'));
        const ordersList: any[] = [];
        ordersSnap.forEach(d => ordersList.push({ id: d.id, ...d.data() }));
        
        // Sort orders by date descending
        ordersList.sort((a, b) => {
          const da = a.createdAt?.seconds || 0;
          const db2 = b.createdAt?.seconds || 0;
          return db2 - da;
        });
        setAllOrders(ordersList);

        const productsSnap = await getDocs(collection(db, 'products'));
        const productsList: any[] = [];
        productsSnap.forEach(d => productsList.push({ id: d.id, ...d.data() }));
        setAllProducts(productsList);

        const customersSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'customer')));
        setAllUsersCount(customersSnap.size);
      } catch (e) {
        console.error('Dashboard fetch error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Filtered data memoization
  const { filteredOrders, stats, chartData, topProducts, orderStatuses } = useMemo(() => {
    const now = new Date();
    const filtered = allOrders.filter(o => {
      if (timeFilter === 'ALL') return true;
      const d = o.createdAt?.toDate ? o.createdAt.toDate() : new Date((o.createdAt?.seconds || 0) * 1000);
      const diffDays = (now.getTime() - d.getTime()) / (1000 * 3600 * 24);
      if (timeFilter === '7D') return diffDays <= 7;
      if (timeFilter === '30D') return diffDays <= 30;
      return true;
    });

    const totalRevenue = filtered.reduce((s, o) => s + (o.totalAmount || 0), 0);
    
    // Status counts
    const statuses = { Pending: 0, Processing: 0, Shipped: 0, Delivered: 0, Cancelled: 0 };
    filtered.forEach(o => {
      if (statuses[o.status as keyof typeof statuses] !== undefined) {
        statuses[o.status as keyof typeof statuses]++;
      }
    });

    // Chart Data (Last 6 Months based on ALL orders for context)
    const monthMap: Record<number, { revenue: number; orders: number }> = {};
    for (let i = 0; i < 12; i++) monthMap[i] = { revenue: 0, orders: 0 };
    allOrders.forEach(o => {
      const d = o.createdAt?.toDate ? o.createdAt.toDate() : new Date((o.createdAt?.seconds || 0) * 1000);
      const m = d.getMonth();
      monthMap[m].revenue += o.totalAmount || 0;
      monthMap[m].orders += 1;
    });

    const last6 = Array.from({ length: 6 }, (_, i) => {
      const m = (now.getMonth() - 5 + i + 12) % 12;
      return { month: MONTH_LABELS[m], revenue: monthMap[m].revenue, orders: monthMap[m].orders };
    });

    // Top Selling Products based on filtered orders
    const productSales: Record<string, { name: string; qty: number; rev: number }> = {};
    filtered.forEach(o => {
      if (o.status !== 'Cancelled' && o.items) {
        o.items.forEach((item: any) => {
          if (!productSales[item.id]) {
            productSales[item.id] = { name: item.name, qty: 0, rev: 0 };
          }
          productSales[item.id].qty += item.quantity || 1;
          productSales[item.id].rev += (item.price * item.quantity) || 0;
        });
      }
    });
    
    const top = Object.values(productSales)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    return {
      filteredOrders: filtered,
      stats: { totalOrders: filtered.length, totalRevenue, totalProducts: allProducts.length, totalCustomers: allUsersCount },
      chartData: last6,
      topProducts: top,
      orderStatuses: statuses
    };
  }, [allOrders, allProducts, allUsersCount, timeFilter]);

  const lowStockProducts = useMemo(() => {
    return allProducts.filter(p => (p.stock ?? 0) <= 10).sort((a, b) => (a.stock ?? 0) - (b.stock ?? 0)).slice(0, 5);
  }, [allProducts]);

  const exportCSV = () => {
    if (filteredOrders.length === 0) return alert('No orders to export.');
    const headers = ['Order ID', 'Customer', 'Email', 'Phone', 'Amount', 'Method', 'Status', 'Date'];
    const rows = filteredOrders.map(o => {
      const date = o.createdAt?.toDate ? o.createdAt.toDate().toLocaleDateString() : new Date((o.createdAt?.seconds || 0) * 1000).toLocaleDateString();
      return [
        o.orderId || o.id,
        `"${o.customerName || 'Guest'}"`,
        `"${o.email || ''}"`,
        `"${o.phone || ''}"`,
        o.totalAmount || 0,
        o.paymentMethod || 'Online',
        o.status || 'Pending',
        date
      ].join(',');
    });
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `orders_${timeFilter}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#fcfcfc]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin" />
          <p className="text-gray-500 font-semibold text-sm">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 bg-[#fcfcfc] min-h-screen space-y-8 font-sans">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white shadow-lg">
              <TrendingUp size={20} />
            </div>
            Overview
          </h1>
          <p className="text-gray-500 mt-1 text-sm font-medium">Business intelligence and performance metrics.</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
          {/* Time Filter */}
          <div className="bg-white border border-gray-200 rounded-xl p-1 flex items-center shadow-sm">
            {['7D', '30D', 'ALL'].map(f => (
              <button
                key={f}
                onClick={() => setTimeFilter(f as any)}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  timeFilter === f ? 'bg-black text-white shadow-md' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {f === 'ALL' ? 'All Time' : f}
              </button>
            ))}
          </div>

          <button onClick={exportCSV} className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm">
            <Download size={14} /> Export CSV
          </button>
        </motion.div>
      </div>

      {/* Quick Status Bar */}
      <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="bg-white border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl p-4 flex flex-wrap gap-4 items-center justify-between lg:justify-start lg:gap-8">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-400" /> <span className="text-xs font-bold text-gray-400 uppercase">Statuses</span>
        </div>
        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-amber-400" /> <span className="text-sm font-semibold">{orderStatuses.Pending} Pending</span></div>
        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-blue-400" /> <span className="text-sm font-semibold">{orderStatuses.Processing} Processing</span></div>
        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-purple-400" /> <span className="text-sm font-semibold">{orderStatuses.Shipped} Shipped</span></div>
        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-green-400" /> <span className="text-sm font-semibold">{orderStatuses.Delivered} Delivered</span></div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Revenue', value: `₹${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Total Orders', value: stats.totalOrders, icon: ShoppingCart, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Total Products', value: stats.totalProducts, icon: Package, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Customers', value: stats.totalCustomers, icon: Users, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group hover:border-gray-200 transition-colors">
            <div className={`absolute -right-6 -top-6 w-24 h-24 ${s.bg} rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500`} />
            <div className={`w-12 h-12 ${s.bg} rounded-2xl flex items-center justify-center mb-6 relative z-10`}>
              <s.icon size={22} className={s.color} />
            </div>
            <p className="text-3xl font-black text-gray-900 mb-1 relative z-10">{s.value}</p>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider relative z-10">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp size={18} className="text-emerald-500" /> Revenue Trend
            </h2>
            <span className="text-xs text-gray-400 font-bold bg-gray-50 px-3 py-1 rounded-full">Last 6 Months</span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="month" stroke="#9ca3af" tick={{ fontSize: 12, fontWeight: 500 }} axisLine={false} tickLine={false} />
              <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #f3f4f6', borderRadius: 16, boxShadow: '0 10px 40px rgba(0,0,0,0.08)', fontSize: 12, fontWeight: 600 }} formatter={(v: any) => [`₹${v.toLocaleString()}`, 'Revenue']} />
              <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fill="url(#revGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <ShoppingCart size={18} className="text-blue-500" /> Orders by Month
            </h2>
            <span className="text-xs text-gray-400 font-bold bg-gray-50 px-3 py-1 rounded-full">Last 6 Months</span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="month" stroke="#9ca3af" tick={{ fontSize: 12, fontWeight: 500 }} axisLine={false} tickLine={false} />
              <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ backgroundColor: '#fff', border: '1px solid #f3f4f6', borderRadius: 16, boxShadow: '0 10px 40px rgba(0,0,0,0.08)', fontSize: 12, fontWeight: 600 }} formatter={(v: any) => [v, 'Orders']} />
              <Bar dataKey="orders" fill="#000" radius={[6, 6, 6, 6]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Orders */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between bg-white">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <Calendar size={18} className="text-gray-400" /> Recent Orders
            </h2>
            <Link href="/admin/orders" className="text-xs font-bold bg-gray-50 hover:bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg transition flex items-center gap-1">
              View All <ArrowUpRight size={14} />
            </Link>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50/50 text-gray-500 text-xs uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-6 py-4 font-medium">Order ID</th>
                  <th className="px-6 py-4 font-medium">Customer</th>
                  <th className="px-6 py-4 font-medium">Amount</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredOrders.slice(0, 5).map(order => (
                  <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-gray-500">
                      {(order.orderId || order.id).slice(0, 12)}...
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {order.customerName || 'Guest User'}
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900">
                      ₹{(order.totalAmount || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold border ${getStatusBadge(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredOrders.length === 0 && (
                  <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-400">No orders found for this period.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        <div className="space-y-6">
          {/* Top Products */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-50">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <Star size={18} className="text-amber-500" /> Top Sellers
              </h2>
            </div>
            <div className="divide-y divide-gray-50 p-2">
              {topProducts.length === 0 ? (
                <div className="p-6 text-center text-sm text-gray-400">No sales data yet.</div>
              ) : (
                topProducts.map((p, idx) => (
                  <div key={idx} className="px-4 py-3 flex items-center justify-between">
                    <div className="min-w-0 flex-1 pr-4">
                      <p className="text-sm font-bold text-gray-900 truncate">{p.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{p.qty} units sold</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-emerald-600">₹{(p.rev).toLocaleString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>

          {/* Low Stock */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-50 flex justify-between items-center">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <AlertTriangle size={18} className="text-red-500" /> Low Stock
              </h2>
              <Link href="/admin/stock" className="text-[10px] font-bold text-gray-400 hover:text-gray-900 uppercase">Manage</Link>
            </div>
            <div className="divide-y divide-gray-50 p-2">
              {lowStockProducts.length === 0 ? (
                <div className="p-6 text-center text-sm text-gray-400 flex flex-col items-center gap-2">
                  <CheckCircle size={20} className="text-emerald-500" /> Inventory is healthy!
                </div>
              ) : (
                lowStockProducts.map((p, idx) => (
                  <div key={idx} className="px-4 py-3 flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-900 truncate pr-4">{p.name}</p>
                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${p.stock === 0 ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                      {p.stock === 0 ? 'Empty' : `${p.stock} left`}
                    </span>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  );
}
