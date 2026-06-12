'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, BarChart3, Package, ShoppingCart, Users, Settings, LogOut, Zap, Tag, Star, LayoutDashboard, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

interface AdminSidebarProps {
  open: boolean;
  onToggle: () => void;
}

const navItems = [
  { label: 'Dashboard', href: '/admin', icon: BarChart3, category: 'Main' },
  { label: 'Homepage', href: '/admin/homepage', icon: LayoutDashboard, category: 'Main' },
  { label: 'Products', href: '/admin/products', icon: Package, category: 'Store' },
  { label: 'Orders', href: '/admin/orders', icon: ShoppingCart, category: 'Store' },
  { label: 'Stock', href: '/admin/stock', icon: Zap, category: 'Store' },
  { label: 'Offers', href: '/admin/offers', icon: Tag, category: 'Store' },
  { label: 'Customers', href: '/admin/customers', icon: Users, category: 'People' },
  { label: 'Reviews', href: '/admin/reviews', icon: Star, category: 'People' },
  { label: 'Settings', href: '/admin/settings', icon: Settings, category: 'System' },
];

const categories = ['Main', 'Store', 'People', 'System'];

export function AdminSidebar({ open, onToggle }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      router.push('/auth/login');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  return (
    <>
      {/* Mobile Toggle */}
      <motion.button
        onClick={onToggle}
        whileTap={{ scale: 0.95 }}
        className="fixed top-4 left-4 z-50 lg:hidden bg-white p-2.5 rounded-xl shadow-lg border border-gray-200"
      >
        {open ? <X size={20} className="text-gray-700" /> : <Menu size={20} className="text-gray-700" />}
      </motion.button>

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: open ? 0 : -300 }}
        className="fixed lg:static top-0 left-0 h-screen w-64 bg-white border-r border-gray-200 text-gray-900 z-40 overflow-y-auto lg:translate-x-0 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.04)]"
      >
        {/* Logo Area */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md shadow-green-500/20">
              <span className="text-white font-black text-sm">NV</span>
            </div>
            <div>
              <h1 className="text-base font-black text-gray-900">NVA Admin</h1>
              <p className="text-xs text-gray-400 font-medium">Brand Management</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
          {categories.map((cat) => {
            const items = navItems.filter(i => i.category === cat);
            return (
              <div key={cat}>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-3">{cat}</p>
                <div className="space-y-1">
                  {items.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${
                          isActive
                            ? 'bg-green-50 text-green-700'
                            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                        }`}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="activeIndicator"
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-green-500 rounded-r-full"
                          />
                        )}
                        <Icon size={18} className={isActive ? 'text-green-600' : 'text-gray-400 group-hover:text-gray-600'} />
                        <span className={`text-sm font-semibold flex-1 ${isActive ? 'text-green-700' : ''}`}>{item.label}</span>
                        {isActive && <ChevronRight size={14} className="text-green-500" />}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Footer / Logout */}
        <div className="p-4 border-t border-gray-100">
          <motion.button
            onClick={handleLogout}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-red-500 hover:bg-red-50 rounded-xl transition text-sm font-semibold"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </motion.button>
        </div>
      </motion.aside>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30 lg:hidden"
            onClick={onToggle}
          />
        )}
      </AnimatePresence>
    </>
  );
}
