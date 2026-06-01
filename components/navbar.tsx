'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Menu, X, LogOut, LayoutDashboard, User } from 'lucide-react';
import { useCartStore } from '@/lib/store';
import { useAuth } from '@/lib/auth-context';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { MarqueeTicker } from './marquee-ticker';

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
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      router.push('/');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

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
            <Link href="/" className="flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg shadow-green-500/20">
                  <span className="text-white font-bold text-lg">NVA</span>
                </div>
                <span className="text-xl font-bold text-white hidden sm:inline">NVA NUTRITION</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex gap-8 items-center">
              <Link href="/" className="text-white/80 hover:text-white font-medium transition duration-300">Home</Link>
              <Link href="/products" className="text-white/80 hover:text-white font-medium transition duration-300">Products</Link>
              <Link href="/about" className="text-white/80 hover:text-white font-medium transition duration-300">About</Link>
              <Link href="/contact" className="text-white/80 hover:text-white font-medium transition duration-300">Contact</Link>
              
              {/* Cart Icon */}
              <Link 
                href="/cart" 
                className="relative p-2 text-white/80 hover:text-white transition duration-300"
              >
                <ShoppingCart className="w-5 h-5" />
                {totalItems > 0 && (
                  <span className="absolute top-0 right-0 bg-green-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-md">
                    {totalItems}
                  </span>
                )}
              </Link>

              {/* User Menu */}
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition duration-300"
                  >
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                    </div>
                    <span className="text-sm font-medium text-white hidden sm:inline">{user.displayName || 'User'}</span>
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-black/95 backdrop-blur-md rounded-lg shadow-lg border border-white/10">
                      <Link
                        href="/account"
                        className="flex items-center gap-2 px-4 py-3 text-white hover:bg-white/10 border-b border-white/10 transition duration-300"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <User size={18} className="text-green-400" />
                        <span className="font-medium">Profile</span>
                      </Link>
                      {userRole === 'admin' && (
                        <Link
                          href="/admin"
                          className="flex items-center gap-2 px-4 py-3 text-white hover:bg-white/10 border-b border-white/10 transition duration-300"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <LayoutDashboard size={18} className="text-green-400" />
                          <span className="font-medium">Admin Dashboard</span>
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          handleLogout();
                          setShowUserMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-3 text-red-400 hover:bg-white/10 transition duration-300"
                      >
                        <LogOut size={18} />
                        <span className="font-medium">Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link 
                  href="/auth/login"
                  className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg font-bold transition duration-300 shadow-md shadow-green-500/10"
                >
                  Sign In
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 text-white"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isOpen && (
            <div className="md:hidden pb-4 space-y-2 bg-black/90 rounded-lg border border-white/10">
              <Link href="/" className="block px-4 py-2 text-white hover:bg-white/10 font-medium transition duration-300">Home</Link>
              <Link href="/products" className="block px-4 py-2 text-white hover:bg-white/10 font-medium transition duration-300">Products</Link>
              <Link href="/about" className="block px-4 py-2 text-white hover:bg-white/10 font-medium transition duration-300">About</Link>
              <Link href="/contact" className="block px-4 py-2 text-white hover:bg-white/10 font-medium transition duration-300">Contact</Link>
              <Link href="/cart" className="block px-4 py-2 text-white hover:bg-white/10 font-medium transition duration-300">Cart ({totalItems})</Link>
              {user && <Link href="/account" className="block px-4 py-2 text-white hover:bg-white/10 font-medium transition duration-300">Profile</Link>}
              {user && userRole === 'admin' && (
                <Link href="/admin" className="block px-4 py-2 text-green-400 hover:bg-white/10 font-medium transition duration-300">Admin</Link>
              )}
              {user ? (
                <button
                  onClick={() => {
                    handleLogout();
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-red-400 hover:bg-white/10 font-medium transition duration-300"
                >
                  Logout
                </button>
              ) : (
                <Link href="/auth/login" className="block px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-bold text-center transition duration-300">Sign In</Link>
              )}
            </div>
          )}
        </div>
      </nav>
    </div>
  );
}
