'use client';

import Link from 'next/link';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { ChevronDown, ChevronLeft, ChevronRight, ExternalLink, Percent, Gift, Tag, ShoppingBag, Zap, Sparkles } from 'lucide-react';
import { useEffect, useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Banner {
 id: string;
 imageUrl: string;
 linkUrl?: string;
 title?: string;
 order: number;
 active: boolean;
}

const PLACEHOLDER_BANNERS: Banner[] = [
 {
 id: 'placeholder-1',
 imageUrl: '',
 title: 'Exclusive Offer: Buy 2 Get 1 Free',
 linkUrl: '/products',
 order: 0,
 active: true,
 },
 {
 id: 'placeholder-2',
 imageUrl: '',
 title: '50% OFF for First 200 Users',
 linkUrl: '/products',
 order: 1,
 active: true,
 },
];

function BannerPlaceholder({ index }: { index: number }) {
 const gradients = [
 'from-green-50 via-emerald-100 to-green-50',
 'from-emerald-50 via-green-100 to-emerald-50',
 ];
 const icons = ['🏋️', '⚡'];
 return (
 <div className={`w-full h-full flex flex-col items-center justify-center bg-gradient-to-br ${gradients[index % 2]} gap-3`}>
 <span className="text-6xl opacity-40">{icons[index % 2]}</span>
 <p className="text-green-800 text-xs font-semibold">Upload banner in Admin → Homepage</p>
 </div>
 );
}

interface LiveOffer {
 id: string;
 name: string;
 offerType: 'free_product' | 'percentage_discount' | 'flat_discount' | 'bxgy' | 'flash_sale' | 'combo_discount';
 rewardValue?: number;
 minCartValue?: number;
}

const OFFER_PILL_STYLES = {
 percentage_discount: { icon: Percent, bg: 'from-green-600/80 to-emerald-700/80', label: 'SALE', accent: 'text-green-300' },
 flat_discount: { icon: Tag, bg: 'from-blue-600/80 to-indigo-700/80', label: 'DEAL', accent: 'text-blue-300' },
 free_product: { icon: Gift, bg: 'from-purple-600/80 to-pink-700/80', label: 'FREE', accent: 'text-purple-300'},
 bxgy: { icon: ShoppingBag, bg: 'from-orange-600/80 to-red-700/80', label: 'BXGY', accent: 'text-orange-300'},
 flash_sale: { icon: Zap, bg: 'from-yellow-500/80 to-orange-600/80', label: 'FLASH', accent: 'text-yellow-300'},
 combo_discount: { icon: Sparkles, bg: 'from-teal-600/80 to-cyan-700/80', label: 'COMBO', accent: 'text-teal-300' },
};
function HeroOffersStrip() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [offers, setOffers] = useState<LiveOffer[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

 useEffect(() => {
 (async () => {
      try {
        const snap = await getDocs(collection(db, 'live_offer_banners'));
        const allBanners = snap.docs.map(d => ({ id: d.id, ...d.data() } as Banner));
        setBanners(allBanners.filter(b => b.active).sort((a, b) => (a.order || 0) - (b.order || 0)));
      } catch (e) {
        console.error("Live offers fetch error:", e);
      }
 
 try {
 const q2 = query(collection(db, 'offers'), where('status', '==', 'live'));
 const snap2 = await getDocs(q2);
 setOffers(snap2.docs.map(d => ({ id: d.id, ...d.data() } as LiveOffer)));
 } catch { /* silent */ }
 })();
 }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || (banners.length === 0 && offers.length === 0)) return;

    const intervalId = setInterval(() => {
      if (container) {
        const { scrollLeft, scrollWidth, clientWidth } = container;
        // Check if we are at the end. Use a small threshold (10px) to account for float rounding.
        const isEnd = scrollLeft + clientWidth >= scrollWidth - 10;
        
        if (isEnd) {
          container.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          container.scrollBy({ left: clientWidth, behavior: 'smooth' });
        }
      }
    }, 4000);

    return () => clearInterval(intervalId);
  }, [banners.length, offers.length]);

 if (banners.length === 0 && offers.length === 0) return null;

 const getDesc = (o: LiveOffer): string => {
 if (o.offerType === 'percentage_discount') return `${o.rewardValue}% Off`;
 if (o.offerType === 'flat_discount') return `₹${o.rewardValue} Off`;
 if (o.offerType === 'free_product') return 'Free Product';
 if (o.offerType === 'bxgy') return 'Buy X Get Y';
 if (o.offerType === 'flash_sale') return `${o.rewardValue}% Flash`;
 if (o.offerType === 'combo_discount') return 'Combo Deal';
 return 'Special Offer';
 };

 return (
 <motion.div
 initial={{ opacity: 0, y: 16 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 1, duration: 0.5 }}
 className="relative w-full z-20 bg-green-500/5 border-t border-green-500/20 backdrop-blur-md mt-0 py-2"
 >
 <div className="max-w-[100vw] overflow-hidden py-1">
 {/* Divider label */}
 <div className="flex items-center gap-3 mb-4 w-full px-4 md:px-7 opacity-70">
 <div className="h-px flex-1 bg-gradient-to-r from-transparent via-green-500/50 to-transparent" />
 <div className="flex items-center gap-1.5 px-3 py-1 rounded-full">
 <Zap size={12} className="text-green-600" />
 <span className="text-[15px] font-black tracking-[0.2em] uppercase text-green-700">Live Offers</span>
 </div>
 <div className="h-px flex-1 bg-gradient-to-r from-transparent via-green-500/50 to-transparent" />
 </div>

  {/* Scrollable image banner row */}
  <div className="relative group">
    <button 
      onClick={() => scrollContainerRef.current?.scrollBy({ left: -scrollContainerRef.current.clientWidth, behavior: 'smooth' })}
      className="absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-background/90 backdrop-blur-md border border-border p-2 rounded-full shadow-lg hover:scale-110 transition hidden md:flex"
    >
      <ChevronLeft size={20} className="text-foreground" />
    </button>
    <button 
      onClick={() => scrollContainerRef.current?.scrollBy({ left: scrollContainerRef.current.clientWidth, behavior: 'smooth' })}
      className="absolute right-4 top-1/2 -translate-y-1/2 z-30 bg-background/90 backdrop-blur-md border border-border p-2 rounded-full shadow-lg hover:scale-110 transition hidden md:flex"
    >
      <ChevronRight size={20} className="text-foreground" />
    </button>
    <div ref={scrollContainerRef} className="flex overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
  {banners.map((b) => (
  <Link key={b.id} href={b.linkUrl || '/products'} className="flex-shrink-0 snap-center w-full px-4 md:px-8 block group">
  <motion.div
  className="relative w-full max-w-7xl mx-auto h-[256px] rounded-2xl overflow-hidden">
 {b.imageUrl ? (
 <Image src={b.imageUrl} alt={b.title || 'Live Offer'} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
 ) : (
 <div className="w-full h-full bg-green-900/40 flex items-center justify-center text-green-300 text-sm font-semibold">Image not found</div>
 )}
 
 {/* Optional dark overlay gradient for readability if you overlay text later */}
 <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
 </motion.div>
 </Link>
 ))}

 {/* Running Offer Pills */}
 {offers.map((o) => {
 const style = OFFER_PILL_STYLES[o.offerType] || OFFER_PILL_STYLES.flat_discount;
 const Icon = style.icon as React.ElementType;
 return (
 <Link key={o.id} href="/products" className="flex-shrink-0 snap-center w-full px-4 md:px-8 block group">
 <motion.div
  whileHover={{ scale: 1.02, y: -2 }}
  whileTap={{ scale: 0.98 }}
  className={`relative overflow-hidden flex items-center justify-between bg-gradient-to-r ${style.bg} border border-border px-6 py-4 rounded-2xl cursor-pointer shadow-xl shadow-green-900/10 group w-full h-full min-h-[256px] max-w-7xl mx-auto`}
  >
  {/* Premium Background Decorations */}
  <div className="absolute right-32 top-1/2 -translate-y-1/2 text-white/10 group-hover:text-white/20 transition-all duration-500 pointer-events-none rotate-12 scale-150 blur-[1px]">
    <Gift size={160} strokeWidth={1} />
  </div>
  <div className="absolute right-[25%] top-2 text-white/10 pointer-events-none -rotate-12 scale-75 hidden md:block animate-pulse">
    <Sparkles size={80} strokeWidth={1} />
  </div>
  <div className="absolute left-1/3 -bottom-8 text-white/10 pointer-events-none rotate-[30deg] scale-50 hidden md:block">
    <Gift size={120} strokeWidth={1.5} />
  </div>

  <div className="relative z-10 flex items-center gap-4">
  <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 shadow-inner backdrop-blur-md border border-white/30">
  <Icon size={24} className="text-white" />
  </div>
  <div className="flex flex-col md:flex-row md:items-baseline gap-1 md:gap-3">
  <span className="text-white font-black text-xl md:text-3xl whitespace-nowrap drop-shadow-md">{o.name}</span>
  <span className="text-white/90 text-sm md:text-lg font-bold whitespace-nowrap drop-shadow-sm">— {getDesc(o)}</span>
  </div>
  </div>
  
  <div className="relative z-10 flex items-center gap-4">
  {o.minCartValue && (
  <span className="text-white/90 text-xs md:text-sm font-bold whitespace-nowrap hidden sm:block border-r border-white/30 pr-4">
  Min. ₹{o.minCartValue}
  </span>
  )}
  <span className="text-white/90 text-lg group-hover:text-white transition-transform group-hover:translate-x-2">→</span>
  </div>
  </motion.div>
 </Link>
 );
 })}
 </div>
 </div>
 </div>
 </motion.div>
 );
}

export function HeroSection() {
 const containerRef = useRef<HTMLDivElement>(null);

 const [banners, setBanners] = useState<Banner[]>([]);
 const [currentBanner, setCurrentBanner] = useState(0);
 const [isAutoPlaying, setIsAutoPlaying] = useState(true);
 const autoPlayRef = useRef<NodeJS.Timeout | null>(null);
 const touchStartX = useRef<number>(0);
 const touchEndX = useRef<number>(0);

 useEffect(() => {
 async function loadBanners() {
 try {
        const snap = await getDocs(collection(db, 'banners'));
        const list: Banner[] = snap.docs.map(d => ({ id: d.id, ...d.data() } as Banner))
                                    .filter(b => b.active)
                                    .sort((a, b) => (a.order || 0) - (b.order || 0));
        setBanners(list.length > 0 ? list : PLACEHOLDER_BANNERS);
 } catch {
 setBanners(PLACEHOLDER_BANNERS);
 }
 }
 loadBanners();
 }, []);

 const displayBanners = banners.length > 0 ? banners : PLACEHOLDER_BANNERS;

 const goTo = useCallback((idx: number) => {
 setCurrentBanner(idx);
 setIsAutoPlaying(false);
 setTimeout(() => setIsAutoPlaying(true), 5000);
 }, []);

 const goNext = useCallback(() => {
 setCurrentBanner(p => (p + 1) % displayBanners.length);
 }, [displayBanners.length]);

 const goPrev = useCallback(() => {
 setCurrentBanner(p => (p - 1 + displayBanners.length) % displayBanners.length);
 }, [displayBanners.length]);

 // Auto-scroll
 useEffect(() => {
 if (!isAutoPlaying || displayBanners.length <= 1) return;
 autoPlayRef.current = setInterval(goNext, 5000);
 return () => { if (autoPlayRef.current) clearInterval(autoPlayRef.current); };
 }, [isAutoPlaying, displayBanners.length, goNext]);

 // Touch/swipe handlers
 const handleTouchStart = (e: React.TouchEvent) => {
 touchStartX.current = e.changedTouches[0].screenX;
 };
 const handleTouchEnd = (e: React.TouchEvent) => {
 touchEndX.current = e.changedTouches[0].screenX;
 const diff = touchStartX.current - touchEndX.current;
 if (Math.abs(diff) > 40) {
 diff > 0 ? goNext() : goPrev();
 }
 };

 const containerVariants: Variants = {
 hidden: { opacity: 0 },
 visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.3 } },
 };
 const itemVariants: Variants = {
 hidden: { opacity: 0, y: 40 },
 visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
 };

 const activeBanner = displayBanners[currentBanner];

 return (
 <div ref={containerRef} className="relative min-h-screen overflow-hidden bg-gradient-hero pt-20">
 {/* Grid background */}
 <div
 className="absolute inset-0 opacity-[0.025]"
 style={{
 backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,200,83,0.6) 1px, transparent 0)`,
 backgroundSize: '48px 48px',
 }}
 />
 {/* Subtle glow orbs */}
 <div className="absolute top-20 -right-32 w-[500px] h-[500px] rounded-full pointer-events-none"
 style={{ background: 'radial-gradient(circle, rgba(0,200,83,0.07) 0%, transparent 70%)' }} />
 <div className="absolute bottom-0 -left-32 w-[400px] h-[400px] rounded-full pointer-events-none"
 style={{ background: 'radial-gradient(circle, rgba(0,200,83,0.05) 0%, transparent 70%)' }} />

 {/* Main Content */}
 <motion.div
 className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-[calc(100vh-80px)] flex items-center py-12"
 >
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center w-full">

 {/* Left – Copy */}
 <motion.div
 variants={containerVariants}
 initial="hidden"
 animate="visible"
 className="max-w-2xl"
 >
 {/* Headline */}
 <motion.div variants={itemVariants} className="mb-6">
 <h1 className="text-5xl sm:text-6xl lg:text-[3.8rem] xl:text-[4.2rem] font-black text-foreground leading-[1.08] tracking-tight">
 NVA Nutrition:{' '}
 <span className="block">Fuel Your</span>
 <span className="text-gradient-green">Performance.</span>
 <span className="block relative mt-1">
 Transform Your{' '}
 <span className="relative inline-block">
 Body.
 <motion.div
 className="absolute -bottom-2 left-0 h-[3px] bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"
 initial={{ width: 0 }}
 animate={{ width: '100%' }}
 transition={{ delay: 1.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
 />
 </span>
 </span>
 </h1>
 </motion.div>

 {/* Sub-headline */}
 <motion.p variants={itemVariants} className="text-base md:text-lg text-gray-500 leading-relaxed max-w-xl mb-10 font-light">
 Premium NVA Nutrition Designed For Athletes Who Refuse Average. Scientifically formulated. Lab tested. Results guaranteed.
 </motion.p>

 {/* CTAs */}
  <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 mb-8">
 <Link href="/products">
 <motion.button
 whileHover={{ scale: 1.03, boxShadow: '0 20px 60px rgba(0,200,83,0.3)' }}
 whileTap={{ scale: 0.97 }}
 className="group bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold px-8 py-4 rounded-xl text-base transition-all duration-300 shadow-lg shadow-green-500/20 flex items-center gap-3 w-full sm:w-auto justify-center"
 >
 Shop Now
 <motion.span
 className="inline-block"
 animate={{ x: [0, 4, 0] }}
 transition={{ duration: 1.5, repeat: Infinity }}
 >→</motion.span>
 </motion.button>
 </Link>
  <Link href="/products">
  <motion.button
  whileHover={{ scale: 1.03, backgroundColor: 'rgba(0,0,0,0.04)', boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }}
  whileTap={{ scale: 0.97 }}
  className="glass text-foreground font-semibold px-8 py-4 rounded-xl text-base transition-all duration-300 w-full sm:w-auto shadow-[0_4px_20px_rgba(0,0,0,0.04)]"
  >
  Explore Products
  </motion.button>
  </Link>
 </motion.div>
 </motion.div>

 {/* Right – Banner Carousel */}
 <motion.div
 initial={{ opacity: 0, x: 40 }}
 animate={{ opacity: 1, x: 0 }}
 transition={{ duration: 0.9, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
 className="w-full"
 >
 <div
 className="banner-carousel-container relative w-full rounded-3xl overflow-hidden border border-gray-200 shadow-[0_20px_60px_rgba(0,0,0,0.08)] bg-white"
 style={{ aspectRatio: '1/1' }}
 onTouchStart={handleTouchStart}
 onTouchEnd={handleTouchEnd}
 >
 {/* Slides */}
 <AnimatePresence mode="wait">
 <motion.div
 key={currentBanner}
 initial={{ opacity: 0, x: 30 }}
 animate={{ opacity: 1, x: 0 }}
 exit={{ opacity: 0, x: -30 }}
 transition={{ duration: 0.45, ease: 'easeInOut' }}
 className="absolute inset-0"
 >
 {/* Image only — no text overlay */}
 {activeBanner?.imageUrl ? (
 <Image
 src={activeBanner.imageUrl}
 alt={activeBanner.title || 'NVA Nutrition Banner'}
 fill
 className="object-cover"
 priority
 />
 ) : (
 <BannerPlaceholder index={currentBanner} />
 )}

 {/* Clickable link over whole banner if linkUrl set */}
 {activeBanner?.linkUrl && (
 <Link href={activeBanner.linkUrl} className="absolute inset-0 z-10" aria-label={activeBanner.title || 'View offer'} />
 )}
 </motion.div>
 </AnimatePresence>

 {/* Nav Arrows */}
 {displayBanners.length > 1 && (
 <>
 <button
 onClick={goPrev}
 className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/50 hover:bg-white/75 backdrop-blur-sm flex items-center justify-center text-foreground transition cursor-pointer border border-border"
 >
 <ChevronLeft size={18} />
 </button>
 <button
 onClick={goNext}
 className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/50 hover:bg-white/75 backdrop-blur-sm flex items-center justify-center text-foreground transition cursor-pointer border border-border"
 >
 <ChevronRight size={18} />
 </button>
 </>
 )}

 {/* Dot Indicators */}
 {displayBanners.length > 1 && (
 <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
 {displayBanners.map((_, i) => (
 <button
 key={i}
 onClick={() => goTo(i)}
 className={`rounded-full transition-all duration-300 cursor-pointer ${
 i === currentBanner
 ? 'w-5 h-1.5 bg-green-400'
 : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/70'
 }`}
 />
 ))}
 </div>
 )}

 {/* Auto-play progress bar */}
 {displayBanners.length > 1 && (
 <div className="absolute top-0 left-0 right-0 h-0.5 bg-muted z-20">
 <motion.div
 key={currentBanner}
 className="h-full bg-green-500"
 initial={{ width: '0%' }}
 animate={{ width: '100%' }}
 transition={{ duration: 5, ease: 'linear' }}
 />
 </div>
 )}
 </div>

 {/* Below carousel hint */}
 <div className="mt-3 flex items-center justify-center gap-2 text-gray-500 text-xs">
 <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
 <span>Swipe or click arrows to browse</span>
 </div>
 </motion.div>
 </div>
 </motion.div>

 {/* ── Live Offers Strip — full screen width at the absolute bottom ── */}
 <HeroOffersStrip />
 </div>
 );
}
