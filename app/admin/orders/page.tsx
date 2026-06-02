'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Eye } from 'lucide-react';
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
}

const statusOptions = ['All', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'RTO'];

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'orders'));
      const ordersList: Order[] = [];
      querySnapshot.forEach((doc) => {
        ordersList.push({
          id: doc.id,
          ...doc.data(),
        } as Order);
      });
      // Sort by latest first
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

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      Pending: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
      Processing: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
      Shipped: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
      Delivered: 'bg-green-500/20 text-green-300 border border-green-500/30',
      Cancelled: 'bg-red-500/20 text-red-300 border border-red-500/30',
      RTO: 'bg-orange-500/20 text-orange-300 border border-orange-500/30',
    };
    return colors[status] || 'bg-gray-500/20 text-gray-300 border border-gray-500/30';
  };

  const filteredOrders = activeTab === 'All' ? orders : orders.filter(o => o.status === activeTab);

  return (
    <div className="p-8 bg-gradient-dark min-h-screen">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold text-white">Orders</h1>
        <p className="text-gray-400 mt-2">Manage customer orders and fulfillment</p>
      </motion.div>

      {/* Tabs */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex space-x-2 overflow-x-auto pb-4 mb-6 scrollbar-hide"
      >
        {statusOptions.map((status) => (
          <button
            key={status}
            onClick={() => setActiveTab(status)}
            className={`px-6 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
              activeTab === status 
                ? 'bg-green-500 text-black shadow-lg shadow-green-500/25' 
                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            {status}
            {status !== 'All' && (
              <span className="ml-2 text-xs opacity-70">
                ({orders.filter(o => o.status === status).length})
              </span>
            )}
          </button>
        ))}
      </motion.div>

      {/* Orders Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl shadow-lg overflow-hidden border border-white/10"
        >
          {filteredOrders.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <p className="text-lg">No orders found in this category.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Order ID</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Customer</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Amount</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Status</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-white">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-white/5 transition">
                      <td className="px-6 py-4 text-gray-300 font-mono text-sm">{order.id}</td>
                      <td className="px-6 py-4 text-gray-400 text-sm">
                        {order.createdAt?.toDate 
                          ? order.createdAt.toDate().toLocaleDateString() 
                          : (order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A')}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-white font-medium">{order.customerName}</p>
                          <p className="text-gray-400 text-sm">{order.phone}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-white font-semibold">₹{(order.totalAmount || 0).toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-semibold transition inline-flex items-center gap-2"
                        >
                          <Eye size={16} />
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
