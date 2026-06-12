'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Tag, Percent, Gift, Zap, ShoppingBag, Clock, ArrowRight, Sparkles } from 'lucide-react';

interface LiveOffer {
 id: string;
 name: string;
 offerType: 'free_product' | 'percentage_discount' | 'flat_discount' | 'bxgy' | 'flash_sale' | 'combo_discount';
 rewardValue?: number;
 minCartValue?: number;
 endTime?: any;
}

const OFFER_STYLES = {
 percentage_discount: { icon: Percent, bg: 'from-green-600 to-emerald-700', badge: 'bg-green-500', label: 'SALE' },
 flat_discount: { icon: Tag, bg: 'from-blue-600 to-indigo-700', badge: 'bg-blue-500', label: 'DEAL' },
 free_product: { icon: Gift, bg: 'from-purple-600 to-pink-700', badge: 'bg-purple-500', label: 'FREE' },
 bxgy: { icon: ShoppingBag, bg: 'from-orange-600 to-red-700', badge: 'bg-orange-500', label: 'BXGY' },
 flash_sale: { icon: Zap, bg: 'from-yellow-500 to-orange-600', badge: 'bg-yellow-500', label: 'FLASH' },
 combo_discount: { icon: Sparkles, bg: 'from-teal-600 to-cyan-700', badge: 'bg-teal-500', label: 'COMBO' },
};

function OfferCard({ offer, index }: { offer: LiveOffer; index: number }) {
 const style = OFFER_STYLES[offer.offerType] || OFFER_STYLES.flat_discount;
 const Icon = style.icon;

 const getOfferDesc = () => {
 if (offer.offerType === 'percentage_discount') return `${offer.rewardValue}% Off Your Order`;
 if (offer.offerType === 'flat_discount') return `₹${offer.rewardValue} Flat Off`;
 if (offer.offerType === 'free_product') return 'Get a FREE Product';
 if (offer.offerType === 'bxgy') return 'Buy X, Get Y Free';
 if (offer.offerType === 'flash_sale') return `${offer.rewardValue}% Flash Sale`;
 if (offer.offerType === 'combo_discount') return 'Combo Discount Active';
 return 'Special Offer';
 };

 return (
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 transition={{ delay: index * 0.1, duration: 0.5 }}
 whileHover={{ y: -4, transition: { duration: 0.2 } }}
 className={`relative flex-shrink-0 w-[280px] sm:w-auto rounded-2xl overflow-hidden bg-gradient-to-br ${style.bg} shadow-xl cursor-pointer group`}
 >
 {/* Glass inner */}
 <div className="relative p-5">
 {/* Badge */}
 <div className={`inline-flex items-center gap-1.5 ${style.badge} text-foreground text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest mb-3 shadow-lg`}>
 <Icon size={10} />
 {style.label}
 </div>

 {/* Offer name */}
 <h3 className="text-foreground font-black text-base leading-snug mb-1.5">{offer.name}</h3>
 <p className="text-foreground/75 text-xs font-semibold mb-4">{getOfferDesc()}</p>

 {offer.minCartValue && (
 <p className="text-foreground/60 text-[10px] mb-3">Min cart: ₹{offer.minCartValue}</p>
 )}

 <Link href="/products" className="inline-flex items-center gap-1.5 bg-muted/50 hover:bg-white/30 text-foreground text-xs font-bold px-4 py-2 rounded-lg transition group-hover:gap-2.5 duration-200">
 Shop Now <ArrowRight size={12} />
 </Link>
 </div>

 {/* Decorative circle */}
 <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-muted pointer-events-none" />
 <div className="absolute -bottom-6 -right-4 w-20 h-20 rounded-full bg-muted pointer-events-none" />

 {/* Icon watermark */}
 <div className="absolute top-4 right-4 opacity-10">
 <Icon size={40} className="text-foreground" />
 </div>
 </motion.div>
 );
}

export function OfferBannerStrip() {
 const [offers, setOffers] = useState<LiveOffer[]>([]);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 async function loadOffers() {
 try {
 const q = query(collection(db, 'offers'), where('status', '==', 'live'));
 const snap = await getDocs(q);
 const list: LiveOffer[] = snap.docs.map(d => ({ id: d.id, ...d.data() } as LiveOffer));
 setOffers(list);
 } catch {
 setOffers([]);
 } finally {
 setLoading(false);
 }
 }
 loadOffers();
 }, []);

 if (loading || offers.length === 0) return null;

 return (
 <section className="py-14 overflow-hidden">
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
 {/* Header */}
 <motion.div
 initial={{ opacity: 0, y: -20 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 className="flex items-center justify-between mb-8"
 >
 <div>
 <div className="inline-flex items-center gap-2 glass-green rounded-full px-4 py-2 mb-3">
 <Zap size={14} className="text-green-400" />
 <span className="text-green-400 font-bold text-xs tracking-widest uppercase">Exclusive Offers</span>
 </div>
 <h2 className="text-3xl md:text-4xl font-black text-foreground">
 Live Promotions
 </h2>
 </div>
 <Link
 href="/products"
 className="hidden sm:flex items-center gap-2 text-green-400 hover:text-green-300 font-bold text-sm transition"
 >
 Shop All <ArrowRight size={16} />
 </Link>
 </motion.div>

 {/* Offers horizontal scroll */}
 <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-premium snap-x snap-mandatory">
 {offers.map((offer, i) => (
 <div key={offer.id} className="snap-start">
 <OfferCard offer={offer} index={i} />
 </div>
 ))}
 </div>
 </div>
 </section>
 );
}
