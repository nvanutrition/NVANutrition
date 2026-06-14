'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Users, Search, ShoppingBag, DollarSign, Calendar, ShieldAlert } from 'lucide-react';

interface CustomerUser {
  id: string; // doc.id is uid
  name: string;
  email: string;
  role: string;
  createdAt?: any;
  phone?: string;
}

interface Order {
  id: string;
  userId?: string;
  email: string;
  totalAmount: number;
}

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<CustomerUser[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // 1. Fetch all users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersList: CustomerUser[] = [];
      usersSnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        usersList.push({
          id: docSnap.id,
          name: data.name || 'No Name',
          email: data.email || 'No Email',
          role: data.role || 'customer',
          createdAt: data.createdAt,
          phone: data.phone || '',
        });
      });
      setCustomers(usersList);

      // 2. Fetch all orders to compute stats
      const ordersSnapshot = await getDocs(collection(db, 'orders'));
      const ordersList: Order[] = [];
      ordersSnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        ordersList.push({
          id: docSnap.id,
          userId: data.userId,
          email: data.email,
          totalAmount: data.totalAmount || 0,
        });
      });
      setOrders(ordersList);

    } catch (error) {
      console.error('Error fetching customer database:', error);
      toast.error('Failed to load customer details');
    } finally {
      setLoading(false);
    }
  };

  const getUserStats = (user: CustomerUser) => {
    const userOrders = orders.filter(
      (o) => o.userId === user.id || o.email.toLowerCase() === user.email.toLowerCase()
    );
    const orderCount = userOrders.length;
    const totalSpent = userOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    return { orderCount, totalSpent };
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalRegistered = customers.length;
  const activeCustomersCount = customers.filter((c) => getUserStats(c).orderCount > 0).length;
  const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const averageSpent = activeCustomersCount > 0 ? Math.round(totalRevenue / activeCustomersCount) : 0;

  return (
    <div className="p-4 sm:p-8 bg-[#fcfcfc] min-h-screen font-sans">
      
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-lg">
              <Users size={20} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
          </div>
          <p className="text-gray-500 text-sm mt-1">View and manage customer details, orders, and lifetime value</p>
        </div>
        
        <div className="relative max-w-md w-full md:w-80">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
          />
        </div>
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-gray-100 border-t-black rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                <Users size={24} className="text-blue-500" />
              </div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Total Registered</p>
              <h3 className="text-4xl font-black text-gray-900 mt-2">{totalRegistered}</h3>
              <p className="text-sm font-medium text-gray-500 mt-2">Users in Auth database</p>
            </motion.div>
            
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center mb-4">
                <ShoppingBag size={24} className="text-green-500" />
              </div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Active Customers</p>
              <h3 className="text-4xl font-black text-gray-900 mt-2">{activeCustomersCount}</h3>
              <p className="text-sm font-medium text-gray-500 mt-2">Users with ≥ 1 order</p>
            </motion.div>
            
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center mb-4">
                <DollarSign size={24} className="text-amber-500" />
              </div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Avg Customer LTV</p>
              <h3 className="text-4xl font-black text-gray-900 mt-2">₹{averageSpent.toLocaleString()}</h3>
              <p className="text-sm font-medium text-gray-500 mt-2">Avg revenue per active user</p>
            </motion.div>
          </div>

          {/* Customers Table Container */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
            {filteredCustomers.length === 0 ? (
              <div className="text-center py-20">
                <Users size={40} className="mx-auto text-gray-200 mb-4" />
                <p className="text-gray-500 font-semibold">No customers found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50/50 text-gray-400 text-xs uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="px-6 py-5 font-medium border-b border-gray-50">Customer Info</th>
                      <th className="px-6 py-5 font-medium border-b border-gray-50">Role</th>
                      <th className="px-6 py-5 font-medium border-b border-gray-50">Contact</th>
                      <th className="px-6 py-5 font-medium border-b border-gray-50">Orders Count</th>
                      <th className="px-6 py-5 font-medium border-b border-gray-50">Total Spent</th>
                      <th className="px-6 py-5 font-medium border-b border-gray-50">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredCustomers.map((user) => {
                      const { orderCount, totalSpent } = getUserStats(user);
                      const isUserAdmin = user.role === 'admin';
                      const formattedDate = user.createdAt
                        ? typeof user.createdAt.toDate === 'function'
                          ? user.createdAt.toDate().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                          : new Date(user.createdAt).toLocaleDateString('en-IN')
                        : 'N/A';

                      return (
                        <tr key={user.id} className="hover:bg-gray-50/50 transition group">
                          {/* Name and Email */}
                          <td className="px-6 py-5">
                            <div>
                              <p className="text-gray-900 font-bold text-sm mb-0.5">{user.name}</p>
                              <p className="text-gray-500 text-xs font-mono">{user.email}</p>
                            </div>
                          </td>

                          {/* Role */}
                          <td className="px-6 py-5">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-bold border uppercase tracking-wider ${
                              isUserAdmin
                                ? 'bg-red-50 text-red-600 border-red-200'
                                : 'bg-gray-50 text-gray-600 border-gray-200'
                            }`}>
                              {isUserAdmin && <ShieldAlert size={12} />}
                              {user.role.toUpperCase()}
                            </span>
                          </td>

                          {/* Contact Info */}
                          <td className="px-6 py-5">
                            <p className="text-gray-500 text-sm font-mono font-medium">{user.phone || '—'}</p>
                          </td>

                          {/* Orders Count */}
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-2">
                              <ShoppingBag size={14} className="text-gray-400" />
                              <span className="text-gray-900 font-mono font-bold text-sm">{orderCount}</span>
                            </div>
                          </td>

                          {/* Total Spend */}
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-1">
                              <span className="font-black text-sm text-gray-900">
                                ₹{totalSpent.toLocaleString()}
                              </span>
                            </div>
                          </td>

                          {/* Join date */}
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-2 text-gray-500 text-xs font-medium">
                              <Calendar size={14} className="text-gray-400" />
                              <span>{formattedDate}</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
