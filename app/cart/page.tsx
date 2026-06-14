'use client';

import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { useCartStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, ShieldCheck, Tag } from 'lucide-react';
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
      <main className="bg-[#fcfcfc] min-h-screen">
        <Navbar />
        <div className="pt-32 pb-20 flex flex-col items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-gray-100 rounded-3xl p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-center max-w-md w-full mx-4"
          >
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag size={32} className="text-gray-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Your Cart is Empty</h1>
            <p className="text-gray-500 mb-8">Looks like you haven't added anything to your cart yet.</p>
            <Link href="/products">
              <button className="w-full bg-black hover:bg-gray-800 text-white px-8 py-4 rounded-xl font-medium transition flex items-center justify-center gap-2">
                Start Shopping <ArrowRight size={18} />
              </button>
            </Link>
          </motion.div>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="bg-[#fcfcfc] min-h-screen text-gray-900">
      <Navbar />
      
      <div className="pt-28 pb-20">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <ShoppingBag className="text-gray-400" size={28} />
              Shopping Cart
            </h1>
            <p className="text-gray-500 mt-2 text-sm">You have {items.length} item{items.length !== 1 ? 's' : ''} in your cart.</p>
          </motion.div>

          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
            
            {/* Left Column: Items */}
            <div className="flex-1 space-y-6">
              <AnimatePresence>
                {items.map((item, index) => (
                  <motion.div
                    key={`${item.id}-${item.flavor || ''}-${item.unit || ''}`}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                    className="bg-white rounded-3xl p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col sm:flex-row gap-6 relative group"
                  >
                    <button
                      onClick={() => removeItem(item.id, item.flavor, item.unit)}
                      className="absolute top-4 right-4 sm:top-6 sm:right-6 text-gray-300 hover:text-red-500 transition-colors p-1"
                    >
                      <Trash2 size={18} />
                    </button>

                    <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 shrink-0">
                      <Image src={item.image} alt={item.name} fill className="object-cover" />
                    </div>

                    <div className="flex-1 flex flex-col justify-between">
                      <div className="pr-8">
                        <h3 className="text-lg font-bold text-gray-900 leading-tight mb-1">{item.name}</h3>
                        {(item.flavor || item.unit) && (
                          <div className="flex flex-wrap gap-2 text-xs font-semibold text-gray-500 mb-4 mt-2">
                            {item.flavor && <span className="bg-gray-100 px-2 py-1 rounded-md">{item.flavor}</span>}
                            {item.unit && <span className="bg-gray-100 px-2 py-1 rounded-md uppercase">{item.unit}</span>}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-xl p-1">
                          <button
                            onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1), item.flavor, item.unit)}
                            className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-lg transition-colors text-gray-600 hover:shadow-sm"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-8 text-center text-sm font-bold text-gray-900">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1, item.flavor, item.unit)}
                            className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-lg transition-colors text-gray-600 hover:shadow-sm"
                          >
                            <Plus size={14} />
                          </button>
                        </div>

                        <div className="text-right">
                          <p className="text-xl font-bold text-gray-900">₹{(item.price * item.quantity).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Free Gifts */}
              {freeGifts.length > 0 && (
                <div className="mt-8 space-y-4">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 px-2">
                    <Tag size={16} className="text-green-500" /> Unlocked Rewards
                  </h3>
                  {freeGifts.map((gift, idx) => (
                    <motion.div
                      key={`gift-${gift.sku}-${idx}`}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-green-50/50 border border-green-100 rounded-2xl p-4 flex gap-4 shadow-sm"
                    >
                      <div className="relative w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-white border border-green-100">
                        <Image src={gift.image} alt={gift.name} fill className="object-cover p-1" />
                      </div>
                      <div className="flex-1 flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-black uppercase tracking-wider bg-green-500 text-white px-2 py-0.5 rounded-md">
                            Free Gift
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-gray-900 truncate">{gift.name}</h3>
                        <p className="text-xs font-semibold text-green-600 mt-0.5">Quantity: {gift.quantity}</p>
                      </div>
                      <div className="flex items-center pr-2">
                        <span className="text-lg font-black text-green-500 uppercase tracking-wider">Free</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Order Summary */}
            <div className="lg:w-[380px] shrink-0">
              <div className="sticky top-28 bg-white rounded-3xl p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Order Summary</h3>

                <div className="space-y-4 py-5 border-y border-gray-100 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span className="font-medium text-gray-900">₹{totalPrice.toLocaleString()}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount Applied</span>
                      <span className="font-medium">-₹{discountAmount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span className="font-medium text-green-600">FREE</span>
                  </div>
                </div>

                <div className="pt-5 pb-6 flex justify-between items-end">
                  <div>
                    <p className="text-sm text-gray-500">Total to pay</p>
                  </div>
                  <div className="text-3xl font-black text-gray-900">
                    ₹{finalTotal.toLocaleString()}
                  </div>
                </div>

                <div className="space-y-3">
                  <Link href="/checkout" className="block">
                    <button className="w-full bg-black hover:bg-gray-800 text-white font-medium py-4 rounded-xl transition shadow-[0_8px_20px_rgb(0,0,0,0.15)] flex items-center justify-center gap-2">
                      Proceed to Checkout <ArrowRight size={18} />
                    </button>
                  </Link>

                  <Link href="/products" className="block">
                    <button className="w-full bg-white border border-gray-200 hover:bg-gray-50 text-gray-900 font-medium py-3.5 rounded-xl transition">
                      Continue Shopping
                    </button>
                  </Link>
                </div>

                <div className="mt-6 flex items-center justify-center gap-2 text-[11px] font-semibold text-gray-400">
                  <ShieldCheck size={14} /> 256-bit SSL Encrypted
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
