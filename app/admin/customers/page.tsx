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

  // Helper to compute stats for a single user
  const getUserStats = (user: CustomerUser) => {
    const userOrders = orders.filter(
      (o) => o.userId === user.id || o.email.toLowerCase() === user.email.toLowerCase()
    );
    const orderCount = userOrders.length;
    const totalSpent = userOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    return { orderCount, totalSpent };
  };

  // Filtered users list based on search term
  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // General dashboard summary metrics
  const totalRegistered = customers.length;
  const activeCustomersCount = customers.filter((c) => getUserStats(c).orderCount > 0).length;
  const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const averageSpent = activeCustomersCount > 0 ? Math.round(totalRevenue / activeCustomersCount) : 0;

  return (
    <div className="p-8 bg-gradient-dark min-h-screen">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="text-4xl font-bold text-white flex items-center gap-3">
            <Users className="text-green-500" /> Customers
          </h1>
          <p className="text-gray-400 mt-2">View and manage customer details, orders, and lifetime value</p>
        </div>
        <div className="relative max-w-md w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
          />
        </div>
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Summary stats cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="glass rounded-xl p-6 border-l-4 border-green-500">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Total Registered</p>
              <h3 className="text-3xl font-black text-white mt-2">{totalRegistered}</h3>
              <p className="text-xs text-gray-500 mt-1">Users in Authentication database</p>
            </div>
            <div className="glass rounded-xl p-6 border-l-4 border-blue-500">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Active Customers</p>
              <h3 className="text-3xl font-black text-white mt-2">{activeCustomersCount}</h3>
              <p className="text-xs text-gray-500 mt-1">Users with at least 1 order</p>
            </div>
            <div className="glass rounded-xl p-6 border-l-4 border-emerald-500">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Avg Customer LTV</p>
              <h3 className="text-3xl font-black text-green-500 mt-2">₹{averageSpent.toLocaleString()}</h3>
              <p className="text-xs text-gray-500 mt-1">Average revenue per active customer</p>
            </div>
          </div>

          {/* Customers Table */}
          {filteredCustomers.length === 0 ? (
            <div className="glass text-center py-16 border border-white/10 rounded-xl">
              <p className="text-gray-400 text-lg">No customers match your search filters.</p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-xl shadow-lg overflow-hidden border border-white/10"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-white/5 border-b border-white/10">
                    <tr>
                      <th className="px-6 py-4 text-sm font-bold text-white uppercase tracking-wider">Customer Info</th>
                      <th className="px-6 py-4 text-sm font-bold text-white uppercase tracking-wider">Role</th>
                      <th className="px-6 py-4 text-sm font-bold text-white uppercase tracking-wider">Contact</th>
                      <th className="px-6 py-4 text-sm font-bold text-white uppercase tracking-wider">Orders Count</th>
                      <th className="px-6 py-4 text-sm font-bold text-white uppercase tracking-wider">Total Spending</th>
                      <th className="px-6 py-4 text-sm font-bold text-white uppercase tracking-wider">Registration Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-medium">
                    {filteredCustomers.map((user) => {
                      const { orderCount, totalSpent } = getUserStats(user);
                      const isUserAdmin = user.role === 'admin';
                      const formattedDate = user.createdAt
                        ? typeof user.createdAt.toDate === 'function'
                          ? user.createdAt.toDate().toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })
                          : new Date(user.createdAt).toLocaleDateString()
                        : 'N/A';

                      return (
                        <tr key={user.id} className="hover:bg-white/5 transition duration-150">
                          {/* Name and Email */}
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-white font-bold text-base">{user.name}</p>
                              <p className="text-gray-400 text-xs font-mono mt-0.5">{user.email}</p>
                            </div>
                          </td>

                          {/* Role */}
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border ${
                              isUserAdmin
                                ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                : 'bg-green-500/10 text-green-400 border-green-500/20'
                            }`}>
                              {isUserAdmin && <ShieldAlert size={12} />}
                              {user.role.toUpperCase()}
                            </span>
                          </td>

                          {/* Contact Info */}
                          <td className="px-6 py-4">
                            <p className="text-gray-300 text-sm font-mono">{user.phone || '—'}</p>
                          </td>

                          {/* Orders Count */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <ShoppingBag size={14} className="text-gray-500" />
                              <span className="text-white font-mono text-base">{orderCount}</span>
                            </div>
                          </td>

                          {/* Total Spend */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1 text-green-400">
                              <DollarSign size={14} />
                              <span className="font-black text-base font-mono">
                                {totalSpent.toLocaleString()}
                              </span>
                            </div>
                          </td>

                          {/* Join date */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-gray-400 text-xs">
                              <Calendar size={14} />
                              <span>{formattedDate}</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
