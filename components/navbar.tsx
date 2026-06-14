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
import Image from 'next/image';

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
  const [mounted, setMounted] = useState(false);
  const totalItems = useCartStore((state) => state.getTotalItems());
  const { user, userRole, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [hoveredPath, setHoveredPath] = useState(pathname);
  const isHome = pathname === '/';

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
    setShowUserMenu(false);
  }, [pathname]);

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
      <nav className={`w-full transition-all duration-500 ${
        isScrolled || !isHome
          ? 'bg-white/90 backdrop-blur-xl border-b border-gray-100 shadow-[0_4px_30px_rgba(0,0,0,0.03)] py-1'
          : 'bg-transparent backdrop-blur-sm py-2'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">

            {/* Logo */}
            <Link href="/" className="flex-shrink-0 flex items-center gap-3 group">
              <Image src="/logo.png" alt="NVA Nutrition" width={160} height={60} className="w-auto h-10 md:h-12 object-contain group-hover:scale-105 transition-transform duration-500" priority />
              <span className={`text-xl font-black hidden md:inline tracking-tight transition-colors duration-300 ${isScrolled || !isHome ? 'text-gray-900 group-hover:text-emerald-600' : 'text-gray-900 group-hover:text-emerald-600'}`}>
                NVA NUTRITION
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div 
              className="hidden md:flex gap-2 items-center bg-white/50 backdrop-blur-md px-2 py-1.5 rounded-full border border-gray-100 shadow-sm relative"
              onMouseLeave={() => setHoveredPath(pathname)}
            >
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                const isHovered = hoveredPath === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onMouseEnter={() => setHoveredPath(link.href)}
                    className={`relative px-4 py-2 text-sm font-bold tracking-wide transition-all duration-300 rounded-full ${
                      isActive ? 'text-emerald-700' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {isHovered && (
                      <motion.div
                        layoutId="nav-indicator-pill"
                        className="absolute inset-0 bg-emerald-50 border border-emerald-100/50 rounded-full shadow-sm"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        style={{ zIndex: 0 }}
                      />
                    )}
                    <span className="relative z-10">{link.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Right Side: Cart & Auth */}
            <div className="hidden md:flex items-center gap-5">
              {/* Cart */}
              <Link href="/cart" aria-label="View Cart" className="relative p-2 text-gray-600 hover:text-emerald-600 transition duration-300 hover:scale-110 active:scale-95 bg-white rounded-full shadow-sm border border-gray-100 flex items-center justify-center w-10 h-10">
                <ShoppingCart className="w-5 h-5" />
                {mounted && totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[10px] font-black rounded-full w-4 h-4 flex items-center justify-center shadow-md">
                    {totalItems}
                  </span>
                )}
              </Link>

              {/* User Menu */}
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white hover:bg-gray-50 border border-gray-100 shadow-sm transition-all duration-300 hover:shadow-md"
                  >
                    <div className="w-7 h-7 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm">
                      {userInitial}
                    </div>
                    <span className="text-sm font-bold text-gray-700 hidden sm:inline">
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
                        className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.1)] border border-gray-100 overflow-hidden"
                      >
                        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                          <p className="text-xs text-gray-500 font-medium">Signed in as</p>
                          <p className="text-sm font-black text-gray-900 truncate">{user.email}</p>
                        </div>
                        <div className="py-2">
                          <Link href="/account?tab=profile" onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors">
                            <User size={16} className="text-gray-400" />
                            <span className="text-sm font-bold">My Profile</span>
                          </Link>
                          <Link href="/account?tab=orders" onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors">
                            <Package size={16} className="text-gray-400" />
                            <span className="text-sm font-bold">My Orders</span>
                          </Link>
                          {userRole === 'admin' && (
                            <Link href="/admin" onClick={() => setShowUserMenu(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-emerald-700 hover:bg-emerald-50 transition-colors">
                              <LayoutDashboard size={16} className="text-emerald-500" />
                              <span className="text-sm font-bold">Admin Dashboard</span>
                            </Link>
                          )}
                          <div className="border-t border-gray-100 my-1"></div>
                          <button
                            onClick={() => { handleLogout(); setShowUserMenu(false); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <LogOut size={16} className="text-red-400" />
                            <span className="text-sm font-bold">Sign Out</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link href="/auth/login"
                  className="px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-full font-bold transition duration-300 shadow-md hover:shadow-lg text-sm tracking-wide"
                >
                  Sign In
                </Link>
              )}
            </div>

            {/* Mobile right side: Cart + Hamburger */}
            <div className="md:hidden flex items-center gap-3">
              <Link href="/cart" aria-label="View Cart" className="relative p-2 text-gray-800 bg-white border border-gray-100 rounded-full shadow-sm">
                <ShoppingCart className="w-5 h-5" />
                {mounted && totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-sm">
                    {totalItems}
                  </span>
                )}
              </Link>
              <button
                onClick={() => setIsOpen(true)}
                className="p-2 text-gray-800 hover:bg-gray-100 rounded-full bg-white border border-gray-100 shadow-sm transition"
                aria-label="Open menu"
              >
                <Menu size={20} />
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
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 w-80 max-w-[85vw] z-[60] flex flex-col bg-white shadow-2xl"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-5 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <Image src="/logo.png" alt="NVA Nutrition" width={120} height={40} className="w-auto h-8 object-contain" />
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition"
                >
                  <X size={20} />
                </button>
              </div>

              {/* User Info (if logged in) */}
              {user && (
                <div className="mx-4 mt-5 p-4 rounded-2xl border border-gray-100 flex items-center gap-3 bg-gray-50 shadow-sm">
                  <div className="w-11 h-11 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white text-base font-bold flex-shrink-0 shadow-inner">
                    {userInitial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-black text-gray-900 truncate">
                      {user.displayName || 'User'}
                    </p>
                    <p className="text-xs text-gray-500 font-medium truncate">{user.email}</p>
                  </div>
                  {userRole === 'admin' && (
                    <span className="text-[9px] font-black bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full ml-auto flex-shrink-0 uppercase tracking-widest border border-emerald-200">
                      Admin
                    </span>
                  )}
                </div>
              )}

              {/* Navigation Links */}
              <nav className="flex-1 px-4 pt-6 space-y-2 overflow-y-auto">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl font-bold transition-all duration-200 ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={18} className={isActive ? 'text-emerald-500' : 'text-gray-400'} />
                        <span>{link.label}</span>
                      </div>
                      <ChevronRight size={14} className="text-gray-300" />
                    </Link>
                  );
                })}

                {/* Divider */}
                <div className="my-4 border-t border-gray-100 mx-2" />

                {/* Cart link in menu */}
                <Link href="/cart" onClick={() => setIsOpen(false)}
                  className="flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition">
                  <div className="flex items-center gap-3">
                    <ShoppingCart size={18} className="text-gray-400" />
                    <span>Cart</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {mounted && totalItems > 0 && (
                      <span className="bg-emerald-500 text-white text-xs font-black rounded-full px-2 py-0.5 min-w-5 text-center shadow-sm">
                        {totalItems}
                      </span>
                    )}
                    <ChevronRight size={14} className="text-gray-300" />
                  </div>
                </Link>

                {/* Account links if logged in */}
                {user && (
                  <>
                    <Link href="/account?tab=profile" onClick={() => setIsOpen(false)}
                      className="flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition">
                      <div className="flex items-center gap-3">
                        <User size={18} className="text-gray-400" />
                        <span>My Profile</span>
                      </div>
                      <ChevronRight size={14} className="text-gray-300" />
                    </Link>
                    <Link href="/account?tab=orders" onClick={() => setIsOpen(false)}
                      className="flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition">
                      <div className="flex items-center gap-3">
                        <Package size={18} className="text-gray-400" />
                        <span>My Orders</span>
                      </div>
                      <ChevronRight size={14} className="text-gray-300" />
                    </Link>
                    {userRole === 'admin' && (
                      <Link href="/admin" onClick={() => setIsOpen(false)}
                        className="flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition border border-emerald-100 shadow-sm mt-2">
                        <div className="flex items-center gap-3">
                          <LayoutDashboard size={18} className="text-emerald-500" />
                          <span>Admin Dashboard</span>
                        </div>
                        <ChevronRight size={14} className="text-emerald-400" />
                      </Link>
                    )}
                  </>
                )}
              </nav>

              {/* Bottom: Sign in or Logout */}
              <div className="px-5 pb-8 pt-5 border-t border-gray-100 bg-gray-50 mt-auto">
                {user ? (
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-xl bg-white border border-red-100 text-red-600 font-bold hover:bg-red-50 hover:border-red-200 transition shadow-sm"
                  >
                    <LogOut size={16} />
                    Sign Out
                  </button>
                ) : (
                  <Link href="/auth/login" onClick={() => setIsOpen(false)}
                    className="block w-full text-center px-4 py-4 rounded-xl bg-gray-900 text-white font-bold hover:bg-gray-800 transition shadow-lg tracking-wide"
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
