'use client';

import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { useCartStore } from '@/lib/store';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { Trash2, Plus, Minus, ShoppingBag, CheckCircle2, Gift } from 'lucide-react';
import { useState, useEffect } from 'react';
import { evaluateOffers, AppliedOfferResult } from '@/lib/offers-engine';

export default function CartPage() {
 const { items, removeItem, updateQuantity, getTotalPrice, clearCart } = useCartStore();
 const [isCheckingOut, setIsCheckingOut] = useState(false);
 const [appliedOffers, setAppliedOffers] = useState<AppliedOfferResult[]>([]);

 const totalPrice = getTotalPrice();

 useEffect(() => {
 (async () => {
 const results = await evaluateOffers(items, totalPrice);
 setAppliedOffers(results);
 })();
 }, [items, totalPrice]);

 const discountAmount = appliedOffers.reduce((sum, offer) => sum + offer.discountAmount, 0);
 const freeGifts = appliedOffers.flatMap(offer => offer.freeProducts);
 const finalTotal = Math.max(0, totalPrice - discountAmount);

 if (items.length === 0 && !isCheckingOut) {
 return (
 <main>
 <Navbar />
 <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 pt-20">
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
 <motion.div
 initial={{ opacity: 0, scale: 0.9 }}
 animate={{ opacity: 1, scale: 1 }}
 transition={{ duration: 0.6 }}
 className="max-w-md mx-auto"
 >
 <div className="mb-6 flex justify-center">
 <div className="bg-gradient-to-br from-green-100 to-emerald-100 rounded-full p-8">
 <ShoppingBag size={48} className="text-green-600" />
 </div>
 </div>
 <h1 className="text-5xl font-bold text-gray-900 mb-4">Your Cart is Empty</h1>
 <p className="text-gray-600 mb-10 text-lg">
 Let&apos;s fill it up with premium nutrition designed for your goals!
 </p>
 <Link href="/products">
 <motion.button
 whileHover={{ scale: 1.05 }}
 whileTap={{ scale: 0.95 }}
 className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-10 py-4 rounded-xl font-bold text-lg transition shadow-[0_8px_20px_rgba(0,200,83,0.25)] hover:shadow-[0_12px_30px_rgba(0,200,83,0.35)] cursor-pointer"
 >
 Explore Products
 </motion.button>
 </Link>
 </motion.div>
 </div>
 </div>
 <Footer />
 </main>
 );
 }

 return (
 <main>
 <Navbar />
 <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 pt-20">
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
 {/* Header */}
 <motion.div
 initial={{ opacity: 0, y: -20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.6 }}
 className="mb-12"
 >
 <h1 className="text-5xl font-bold text-gray-900 flex items-center gap-3">
 <ShoppingBag size={40} className="text-green-600" />
 Shopping Cart
 </h1>
 <p className="text-gray-600 mt-3 text-lg">{items.length} item{items.length !== 1 ? 's' : ''} in your cart</p>
 </motion.div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
 {/* Cart Items */}
 <div className="lg:col-span-2">
 <div className="space-y-4">
 {items.map((item, index) => (
 <motion.div
 key={`${item.id}-${item.flavor || ''}-${item.unit || ''}`}
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.5, delay: index * 0.08 }}
 className="bg-white border border-gray-200 hover:border-green-300 rounded-2xl p-6 flex gap-6 shadow-sm hover:shadow-md transition-all"
 >
 {/* Product Image */}
 <div className="relative w-28 h-28 flex-shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 shadow-md">
 <Image
 src={item.image}
 alt={item.name}
 fill
 className="object-cover"
 />
 </div>

 {/* Product Details */}
 <div className="flex-1">
 <h3 className="text-lg font-bold text-gray-900 mb-1">{item.name}</h3>
 {(item.flavor || item.unit) && (
 <p className="text-sm text-gray-600 mb-3 flex flex-wrap gap-x-2 gap-y-1 items-center">
 {item.flavor && (
 <>
 <span className="font-semibold">Flavor:</span> <span>{item.flavor}</span>
 </>
 )}
 {item.flavor && item.unit && <span className="text-muted-foreground">|</span>}
 {item.unit && (
 <>
 <span className="font-semibold">Unit:</span> <span className="uppercase">{item.unit}</span>
 </>
 )}
 </p>
 )}
 <p className="text-2xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
 ₹{item.price}
 </p>
 </div>

 {/* Quantity Control */}
 <div className="flex flex-col items-end gap-3">
 <div className="flex items-center gap-2 bg-gradient-to-r from-gray-100 to-gray-50 rounded-xl p-2 border border-gray-200">
 <motion.button
 whileTap={{ scale: 0.9 }}
 onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1), item.flavor, item.unit)}
 className="p-2 hover:bg-gray-200 rounded-lg transition"
 >
 <Minus className="w-4 h-4 text-gray-700" />
 </motion.button>
 <span className="w-8 text-center font-bold text-gray-900">{item.quantity}</span>
 <motion.button
 whileTap={{ scale: 0.9 }}
 onClick={() => updateQuantity(item.id, item.quantity + 1, item.flavor, item.unit)}
 className="p-2 hover:bg-gray-200 rounded-lg transition"
 >
 <Plus className="w-4 h-4 text-gray-700" />
 </motion.button>
 </div>

 {/* Total & Delete */}
 <div className="text-right">
 <p className="text-sm text-gray-600 mb-2">
 <span className="font-semibold">Subtotal:</span> ₹{item.price * item.quantity}
 </p>
 <motion.button
 whileHover={{ scale: 1.1 }}
 whileTap={{ scale: 0.95 }}
 onClick={() => removeItem(item.id, item.flavor, item.unit)}
 className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition cursor-pointer"
 >
 <Trash2 className="w-5 h-5" />
 </motion.button>
 </div>
 </div>
 </motion.div>
 ))}

 {/* Free Gifts / Promotional Products */}
 {freeGifts.length > 0 && (
 <div className="mt-8 space-y-4">
 <h3 className="text-lg font-black text-green-600 flex items-center gap-2 uppercase tracking-wider">
 <Gift size={20} /> Unlocked Free Rewards ({freeGifts.length})
 </h3>
 {freeGifts.map((gift, idx) => (
 <motion.div
 key={`gift-${gift.sku}-${idx}`}
 initial={{ opacity: 0, y: 15 }}
 animate={{ opacity: 1, y: 0 }}
 className="bg-green-50 border border-green-200 rounded-2xl p-6 flex gap-6 shadow-sm"
 >
 <div className="relative w-28 h-28 flex-shrink-0 rounded-xl overflow-hidden bg-white border border-green-200 shadow-md">
 <Image
 src={gift.image}
 alt={gift.name}
 fill
 className="object-contain p-2"
 />
 </div>
 <div className="flex-1 flex flex-col justify-between py-1">
 <div>
 <span className="inline-block text-[10px] font-black tracking-widest uppercase bg-green-500 text-foreground px-2 py-0.5 rounded mb-2">
 Free Gift
 </span>
 <h3 className="text-lg font-bold text-gray-900 mb-1">{gift.name}</h3>
 <p className="text-xs text-gray-500 font-mono">SKU: {gift.sku}</p>
 </div>
 <p className="text-sm font-extrabold text-green-600">Automatically added to order</p>
 </div>
 <div className="flex flex-col items-end justify-between py-1">
 <div className="bg-green-100 text-green-800 font-extrabold text-xs px-3 py-1.5 rounded-lg border border-green-200">
 Qty: {gift.quantity}
 </div>
 <p className="text-2xl font-black text-green-600 uppercase tracking-wide">Free</p>
 </div>
 </motion.div>
 ))}
 </div>
 )}
 </div>
 </div>

 {/* Order Summary */}
 <motion.div
 initial={{ opacity: 0, x: 20 }}
 animate={{ opacity: 1, x: 0 }}
 transition={{ duration: 0.8 }}
 className="lg:col-span-1"
 >
 <div className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 p-8 rounded-2xl h-fit sticky top-24 shadow-lg">
 <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-2">
 <CheckCircle2 size={24} className="text-green-600" />
 Order Summary
 </h2>

 <div className="space-y-5 mb-8 border-b-2 border-gray-200 pb-8">
 <div className="flex justify-between">
 <span className="text-gray-600 font-medium">Subtotal</span>
 <span className="font-bold text-gray-900">₹{totalPrice.toLocaleString()}</span>
 </div>

 {discountAmount > 0 && (
 <div className="flex justify-between text-green-600 font-semibold bg-green-50 px-3 py-2 rounded-xl">
 <span>Promo Discount</span>
 <span>-₹{discountAmount.toLocaleString()}</span>
 </div>
 )}

 <div className="flex justify-between">
 <span className="text-gray-600 font-medium">Shipping</span>
 <span className="font-bold text-green-600 bg-green-50 px-3 py-1 rounded-lg text-sm">
 Free
 </span>
 </div>
 </div>

 <div className="flex justify-between mb-8 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
 <span className="text-xl font-bold text-gray-900">Total</span>
 <span className="text-2xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
 ₹{finalTotal.toLocaleString()}
 </span>
 </div>

 <div className="space-y-3">
 <Link href="/checkout" className="block">
 <motion.button
 whileHover={{ scale: 1.02 }}
 whileTap={{ scale: 0.98 }}
 className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-4 rounded-xl font-bold text-lg transition shadow-[0_8px_20px_rgba(0,200,83,0.25)] hover:shadow-[0_12px_30px_rgba(0,200,83,0.35)] cursor-pointer"
 >
 Proceed to Checkout
 </motion.button>
 </Link>

 <Link href="/products" className="block">
 <motion.button
 whileHover={{ scale: 1.02 }}
 whileTap={{ scale: 0.98 }}
 className="w-full border-2 border-green-600 text-green-600 hover:bg-green-50 py-3 rounded-xl font-bold transition cursor-pointer"
 >
 Continue Shopping
 </motion.button>
 </Link>

 <motion.button
 whileHover={{ scale: 1.02 }}
 whileTap={{ scale: 0.98 }}
 onClick={() => clearCart()}
 className="w-full border-2 border-gray-300 text-gray-700 hover:bg-gray-50 py-3 rounded-xl font-semibold transition text-sm cursor-pointer"
 >
 Clear Cart
 </motion.button>
 </div>

 {/* Trust Badge */}
 <div className="mt-8 pt-8 border-t-2 border-gray-200 space-y-3 text-center text-sm text-gray-600">
 <p>✓ Free Shipping on Orders</p>
 <p>✓ 100% Authentic Products</p>
 </div>
 </div>
 </motion.div>
 </div>
 </div>
 </div>
 <Footer />
 </main>
 );
}
