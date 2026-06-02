'use client';

import Link from 'next/link';
import { ShoppingCart, Menu, X, LogOut, LayoutDashboard, User, Home, Package, Info, Mail, ChevronRight } from 'lucide-react';
import { useCartStore } from '@/lib/store';
import { useAuth } from '@/lib/auth-context';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { MarqueeTicker } from './marquee-ticker';
import { motion, AnimatePresence } from 'framer-motion';

const navLinks = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/products', label: 'Products', icon: Package },
  { href: '/about', label: 'About Us', icon: Info },
  { href: '/contact', label: 'Contact', icon: Mail },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const totalItems = useCartStore((state) => state.getTotalItems());
  const { user, userRole, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isHome = pathname === '/';

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
    setShowUserMenu(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      router.push('/');
      setIsOpen(false);
    } catch {
      toast.error('Logout failed');
    }
  };

  const userInitial = user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U';

  return (
    <div className="fixed top-0 w-full z-50 flex flex-col">
      <MarqueeTicker />
      <nav className={`w-full transition-all duration-300 ${
        isScrolled || !isHome
          ? 'bg-black/95 backdrop-blur-md border-b border-white/10 shadow-lg'
          : 'bg-transparent backdrop-blur-sm'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">

            {/* Logo */}
            <Link href="/" className="flex-shrink-0 flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg shadow-green-500/20">
                <span className="text-white font-bold text-sm">NVA</span>
              </div>
              <span className="text-lg font-bold text-white hidden sm:inline tracking-tight">NVA NUTRITION</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex gap-6 items-center">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition duration-300 ${
                    pathname === link.href ? 'text-green-400' : 'text-white/75 hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              {/* Cart */}
              <Link href="/cart" className="relative p-2 text-white/75 hover:text-white transition duration-300">
                <ShoppingCart className="w-5 h-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-green-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-md">
                    {totalItems}
                  </span>
                )}
              </Link>

              {/* User Menu */}
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition"
                  >
                    <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {userInitial}
                    </div>
                    <span className="text-sm font-medium text-white hidden sm:inline">
                      {user.displayName?.split(' ')[0] || 'User'}
                    </span>
                  </button>

                  <AnimatePresence>
                    {showUserMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-52 bg-black/95 backdrop-blur-md rounded-xl shadow-2xl border border-white/10 overflow-hidden"
                      >
                        <div className="px-4 py-3 border-b border-white/10">
                          <p className="text-xs text-gray-400">Signed in as</p>
                          <p className="text-sm font-bold text-white truncate">{user.email}</p>
                        </div>
                        <Link href="/account?tab=profile" onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-3 px-4 py-3 text-white hover:bg-white/10 transition">
                          <User size={16} className="text-green-400" />
                          <span className="text-sm font-medium">My Profile</span>
                        </Link>
                        <Link href="/account?tab=orders" onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-3 px-4 py-3 text-white hover:bg-white/10 transition border-t border-white/10">
                          <Package size={16} className="text-green-400" />
                          <span className="text-sm font-medium">My Orders</span>
                        </Link>
                        {userRole === 'admin' && (
                          <Link href="/admin" onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-3 px-4 py-3 text-white hover:bg-white/10 transition border-t border-white/10">
                            <LayoutDashboard size={16} className="text-green-400" />
                            <span className="text-sm font-medium">Admin Dashboard</span>
                          </Link>
                        )}
                        <button
                          onClick={() => { handleLogout(); setShowUserMenu(false); }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-white/10 transition border-t border-white/10"
                        >
                          <LogOut size={16} />
                          <span className="text-sm font-medium">Logout</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link href="/auth/login"
                  className="px-5 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg font-bold transition duration-300 shadow-md shadow-green-500/20 text-sm"
                >
                  Sign In
                </Link>
              )}
            </div>

            {/* Mobile right side: Cart + Hamburger */}
            <div className="md:hidden flex items-center gap-1">
              <Link href="/cart" className="relative p-2 text-white">
                <ShoppingCart className="w-5 h-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-green-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </Link>
              <button
                onClick={() => setIsOpen(true)}
                className="p-2 text-white hover:bg-white/10 rounded-lg transition"
                aria-label="Open menu"
              >
                <Menu size={22} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Full-Screen Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 w-80 max-w-[90vw] z-[60] flex flex-col"
              style={{ background: 'rgba(5, 10, 15, 0.97)', borderLeft: '1px solid rgba(255,255,255,0.08)' }}
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-5 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-xs">NVA</span>
                  </div>
                  <span className="text-white font-bold">NVA NUTRITION</span>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition"
                >
                  <X size={20} />
                </button>
              </div>

              {/* User Info (if logged in) */}
              {user && (
                <div className="mx-4 mt-5 p-4 rounded-2xl border border-white/10 flex items-center gap-3"
                  style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <div className="w-11 h-11 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white text-base font-bold flex-shrink-0">
                    {userInitial}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">
                      {user.displayName || 'User'}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                  </div>
                  {userRole === 'admin' && (
                    <span className="text-[9px] font-extrabold bg-green-500/20 text-green-400 px-2 py-1 rounded-full border border-green-500/30 ml-auto flex-shrink-0">ADMIN</span>
                  )}
                </div>
              )}

              {/* Navigation Links */}
              <nav className="flex-1 px-4 pt-5 space-y-1 overflow-y-auto">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-green-500/15 text-green-400 border border-green-500/25'
                          : 'text-gray-300 hover:text-white hover:bg-white/8'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={18} className={isActive ? 'text-green-400' : 'text-gray-500'} />
                        <span>{link.label}</span>
                      </div>
                      <ChevronRight size={14} className="text-gray-600" />
                    </Link>
                  );
                })}

                {/* Divider */}
                <div className="my-3 border-t border-white/8" />

                {/* Cart link in menu */}
                <Link href="/cart" onClick={() => setIsOpen(false)}
                  className="flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl font-medium text-gray-300 hover:text-white hover:bg-white/8 transition">
                  <div className="flex items-center gap-3">
                    <ShoppingCart size={18} className="text-gray-500" />
                    <span>Cart</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {totalItems > 0 && (
                      <span className="bg-green-500 text-white text-xs font-bold rounded-full px-2 py-0.5 min-w-5 text-center">
                        {totalItems}
                      </span>
                    )}
                    <ChevronRight size={14} className="text-gray-600" />
                  </div>
                </Link>

                {/* Account links if logged in */}
                {user && (
                  <>
                    <Link href="/account?tab=profile" onClick={() => setIsOpen(false)}
                      className="flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl font-medium text-gray-300 hover:text-white hover:bg-white/8 transition">
                      <div className="flex items-center gap-3">
                        <User size={18} className="text-gray-500" />
                        <span>My Profile</span>
                      </div>
                      <ChevronRight size={14} className="text-gray-600" />
                    </Link>
                    <Link href="/account?tab=orders" onClick={() => setIsOpen(false)}
                      className="flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl font-medium text-gray-300 hover:text-white hover:bg-white/8 transition">
                      <div className="flex items-center gap-3">
                        <Package size={18} className="text-gray-500" />
                        <span>My Orders</span>
                      </div>
                      <ChevronRight size={14} className="text-gray-600" />
                    </Link>
                    {userRole === 'admin' && (
                      <Link href="/admin" onClick={() => setIsOpen(false)}
                        className="flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl font-medium text-green-400 hover:bg-green-500/10 border border-green-500/20 transition">
                        <div className="flex items-center gap-3">
                          <LayoutDashboard size={18} className="text-green-400" />
                          <span>Admin Dashboard</span>
                        </div>
                        <ChevronRight size={14} className="text-green-500/50" />
                      </Link>
                    )}
                  </>
                )}
              </nav>

              {/* Bottom: Sign in or Logout */}
              <div className="px-4 pb-8 pt-4 border-t border-white/10">
                {user ? (
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 font-semibold hover:bg-red-500/20 transition"
                  >
                    <LogOut size={16} />
                    Sign Out
                  </button>
                ) : (
                  <Link href="/auth/login" onClick={() => setIsOpen(false)}
                    className="block w-full text-center px-4 py-3.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold hover:from-green-600 hover:to-emerald-700 transition shadow-lg shadow-green-500/20"
                  >
                    Sign In to Your Account
                  </Link>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
