'use client';

import Link from 'next/link';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { Sparkles, ArrowRight, ChevronLeft, ChevronRight, Play, CheckCircle2, Dumbbell, Zap, Trophy, BatteryCharging, Percent, Tag, Gift, ShoppingBag } from 'lucide-react';
import { useEffect, useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { collection, getDocs, query, where } from 'firebase/firestore';
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
    title: 'Unleash Your Potential',
    linkUrl: '/products',
    order: 0,
    active: true,
  },
];

function BannerPlaceholder() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-emerald-900 to-teal-900 relative overflow-hidden group">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/30 blur-[80px] rounded-full group-hover:bg-emerald-400/40 transition-colors duration-700"></div>
      <Zap size={64} className="text-emerald-400 mb-6 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)] z-10" />
      <h3 className="text-3xl font-black text-white tracking-tight z-10">Unleash Potential</h3>
      <p className="text-emerald-200/80 mt-2 z-10 font-medium">Add high-quality banners in Admin Panel</p>
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
  percentage_discount: { icon: Percent, bg: 'from-emerald-600 to-teal-600', label: 'SALE' },
  flat_discount: { icon: Tag, bg: 'from-blue-600 to-indigo-600', label: 'DEAL' },
  free_product: { icon: Gift, bg: 'from-fuchsia-600 to-pink-600', label: 'FREE' },
  bxgy: { icon: ShoppingBag, bg: 'from-amber-500 to-orange-600', label: 'BXGY' },
  flash_sale: { icon: Zap, bg: 'from-rose-500 to-red-600', label: 'FLASH' },
  combo_discount: { icon: Sparkles, bg: 'from-cyan-500 to-blue-600', label: 'COMBO' },
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
        const isEnd = scrollLeft + clientWidth >= scrollWidth - 10;
        if (isEnd) container.scrollTo({ left: 0, behavior: 'smooth' });
        else container.scrollBy({ left: clientWidth, behavior: 'smooth' });
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
      transition={{ delay: 0.8, duration: 0.5 }}
      className="relative w-full z-30 bg-white/80 backdrop-blur-xl border-t border-gray-100 mt-0 py-4 shadow-[0_-10px_40px_rgba(0,0,0,0.03)]"
    >
      <div className="max-w-[100vw] overflow-hidden">
        <div className="flex items-center gap-4 mb-4 w-full px-4 md:px-8">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 shadow-sm">
            <Sparkles size={14} className="text-emerald-500 animate-pulse" />
            <span className="text-xs font-black tracking-[0.25em] uppercase text-emerald-600">Live Promotions</span>
          </div>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
        </div>

        <div className="relative group max-w-[1400px] mx-auto">
          <button onClick={() => scrollContainerRef.current?.scrollBy({ left: -scrollContainerRef.current.clientWidth, behavior: 'smooth' })} className="absolute left-4 top-1/2 -translate-y-1/2 z-40 bg-white/90 backdrop-blur-md border border-gray-200 p-3 rounded-full shadow-lg hover:bg-gray-50 hover:scale-110 transition hidden md:flex cursor-pointer text-gray-700">
            <ChevronLeft size={20} />
          </button>
          <button onClick={() => scrollContainerRef.current?.scrollBy({ left: scrollContainerRef.current.clientWidth, behavior: 'smooth' })} className="absolute right-4 top-1/2 -translate-y-1/2 z-40 bg-white/90 backdrop-blur-md border border-gray-200 p-3 rounded-full shadow-lg hover:bg-gray-50 hover:scale-110 transition hidden md:flex cursor-pointer text-gray-700">
            <ChevronRight size={20} />
          </button>

          <div ref={scrollContainerRef} className="flex overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {banners.map((b) => (
              <Link key={b.id} href={b.linkUrl || '/products'} className="flex-shrink-0 snap-center w-full px-4 md:px-8 block group">
                <motion.div className="relative w-full h-[220px] md:h-[280px] rounded-[2rem] overflow-hidden shadow-2xl border border-white/10">
                  {b.imageUrl ? (
                    <Image src={b.imageUrl} alt={b.title || 'Offer'} fill className="object-cover transition-transform duration-1000 group-hover:scale-110" />
                  ) : (
                    <div className="w-full h-full bg-gray-900 flex items-center justify-center text-gray-500 text-sm font-bold">Image not found</div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
                </motion.div>
              </Link>
            ))}

            {offers.map((o) => {
              const style = OFFER_PILL_STYLES[o.offerType] || OFFER_PILL_STYLES.flat_discount;
              const Icon = style.icon as React.ElementType;
              return (
                <Link key={o.id} href="/products" className="flex-shrink-0 snap-center w-full px-4 md:px-8 block group">
                  <motion.div whileHover={{ scale: 1.02, y: -4 }} whileTap={{ scale: 0.98 }}
                    className={`relative overflow-hidden flex items-center justify-between bg-gradient-to-br ${style.bg} px-8 py-10 rounded-[2rem] cursor-pointer shadow-2xl group w-full h-[220px] md:h-[280px] border border-white/20`}>
                    
                    <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-white/10 to-transparent pointer-events-none" />
                    <div className="absolute -right-10 -top-10 w-64 h-64 bg-white/10 rounded-full blur-[40px] pointer-events-none group-hover:bg-white/20 transition-all duration-700" />
                    
                    <div className="relative z-10 flex items-center gap-6">
                      <div className="w-16 h-16 md:w-24 md:h-24 rounded-[1.5rem] bg-white/20 flex items-center justify-center flex-shrink-0 shadow-[0_8px_32px_rgba(0,0,0,0.15)] backdrop-blur-xl border border-white/30 group-hover:scale-110 transition-transform duration-500 group-hover:rotate-6">
                        <Icon size={36} className="text-white drop-shadow-md" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-white/80 font-bold text-sm md:text-base uppercase tracking-widest mb-1 drop-shadow-sm">{style.label}</span>
                        <span className="text-white font-black text-3xl md:text-5xl drop-shadow-lg tracking-tight leading-none mb-2">{o.name}</span>
                        <span className="text-white/90 text-lg md:text-2xl font-bold drop-shadow-md">{getDesc(o)}</span>
                      </div>
                    </div>
                    
                    <div className="relative z-10 flex flex-col items-end gap-3">
                      {o.minCartValue && (
                        <span className="text-white bg-black/20 backdrop-blur-md px-4 py-2 rounded-xl text-xs md:text-sm font-bold uppercase tracking-wider border border-white/10">
                          Min. ₹{o.minCartValue}
                        </span>
                      )}
                      <div className="w-14 h-14 bg-white text-gray-900 rounded-full flex items-center justify-center shadow-xl group-hover:bg-gray-50 transition-all duration-300 group-hover:translate-x-2">
                        <ArrowRight size={24} />
                      </div>
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

const FloatingElement = ({ children, delay, duration, className }: { children: React.ReactNode, delay: number, duration: number, className: string }) => (
  <motion.div
    initial={{ y: 0, opacity: 0.1 }}
    animate={{ 
      y: [0, -20, 0],
      rotate: [0, 5, -5, 0],
      opacity: [0.1, 0.3, 0.1]
    }}
    transition={{
      duration: duration,
      delay: delay,
      repeat: Infinity,
      ease: "easeInOut"
    }}
    className={`absolute pointer-events-none ${className}`}
  >
    {children}
  </motion.div>
);

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

  useEffect(() => {
    if (!isAutoPlaying || displayBanners.length <= 1) return;
    autoPlayRef.current = setInterval(goNext, 5000);
    return () => { if (autoPlayRef.current) clearInterval(autoPlayRef.current); };
  }, [isAutoPlaying, displayBanners.length, goNext]);

  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.changedTouches[0].screenX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].screenX;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 40) diff > 0 ? goNext() : goPrev();
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
  };
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
  };

  const activeBanner = displayBanners[currentBanner];

  return (
    <div ref={containerRef} className="relative min-h-screen overflow-hidden bg-white pt-20">
      
      {/* ── Crisp Light Theme Background ── */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.02] pointer-events-none" />
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-emerald-100 blur-[120px] rounded-full pointer-events-none transform translate-x-1/3 -translate-y-1/3" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-teal-50 blur-[120px] rounded-full pointer-events-none transform -translate-x-1/3 translate-y-1/3" />
      <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: `radial-gradient(circle at 2px 2px, black 1px, transparent 0)`, backgroundSize: '48px 48px' }} />

      {/* Floating Elements */}
      <FloatingElement delay={0} duration={6} className="top-[20%] left-[10%]">
        <Dumbbell size={64} className="text-emerald-500" />
      </FloatingElement>
      <FloatingElement delay={2} duration={8} className="top-[60%] left-[5%]">
        <Zap size={48} className="text-teal-400" />
      </FloatingElement>
      <FloatingElement delay={1} duration={7} className="top-[15%] right-[10%]">
        <Trophy size={56} className="text-amber-400" />
      </FloatingElement>
      <FloatingElement delay={3} duration={9} className="bottom-[25%] right-[8%]">
        <BatteryCharging size={72} className="text-blue-400" />
      </FloatingElement>
      <FloatingElement delay={0.5} duration={7.5} className="top-[40%] right-[40%]">
        <Sparkles size={32} className="text-rose-400" />
      </FloatingElement>

      {/* Main Content */}
      <motion.div className="relative z-20 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 min-h-[calc(100vh-100px)] flex flex-col justify-center py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center w-full h-full">

          {/* Left – Copy */}
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="lg:col-span-6 2xl:col-span-5 max-w-2xl mx-auto lg:mx-0 text-center lg:text-left pt-10 lg:pt-0">
            
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-full px-5 py-2 mb-8 shadow-sm">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
              </span>
              <span className="text-gray-600 text-xs font-black uppercase tracking-widest">Scientifically Formulated</span>
            </motion.div>

            {/* Headline */}
            <motion.div variants={itemVariants} className="mb-6 relative">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-gray-900 leading-[1.05] tracking-tight">
                Fuel Your<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500">
                  Performance.
                </span>
                <span className="block mt-2">Break Limits.</span>
              </h1>
            </motion.div>

            {/* Sub-headline */}
            <motion.p variants={itemVariants} className="text-lg md:text-xl text-gray-500 leading-relaxed max-w-xl mb-10 font-medium mx-auto lg:mx-0">
              Premium sports nutrition designed for athletes who refuse to be average. 100% Genuine. Lab Tested. Results Guaranteed.
            </motion.p>

            {/* CTAs */}
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              <Link href="/products" className="w-full sm:w-auto">
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(16, 185, 129, 0.25)' }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black px-10 py-4 rounded-xl text-base transition-all duration-300 shadow-[0_8px_30px_rgba(16,185,129,0.2)] flex items-center justify-center gap-3 uppercase tracking-wider"
                >
                  Shop Now
                  <ArrowRight size={18} />
                </motion.button>
              </Link>
              <Link href="/about" className="w-full sm:w-auto">
                <motion.button
                  whileHover={{ scale: 1.05, backgroundColor: 'rgba(243,244,246,1)' }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full sm:w-auto bg-gray-50 text-gray-900 font-bold px-10 py-4 rounded-xl text-base transition-all duration-300 shadow-sm border border-gray-200 flex items-center justify-center gap-3"
                >
                  <Play size={16} className="fill-gray-900" /> How It Works
                </motion.button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Right – Banner Carousel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-6 2xl:col-span-7 w-full pb-10 lg:pb-0 flex justify-center lg:justify-end"
          >
            <div
              className="relative w-full max-w-[600px] rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-[0_30px_100px_rgba(0,0,0,0.1)] bg-gray-50 group aspect-square"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {/* Slides */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentBanner}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.6, ease: 'easeInOut' }}
                  className="absolute inset-0"
                >
                  {activeBanner?.imageUrl ? (
                    <Image
                      src={activeBanner.imageUrl}
                      alt={activeBanner.title || 'NVA Nutrition Banner'}
                      fill
                      className="object-cover"
                      priority
                    />
                  ) : (
                    <BannerPlaceholder />
                  )}

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
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/30 hover:bg-black/60 backdrop-blur-md flex items-center justify-center text-white transition cursor-pointer border border-white/20 opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    onClick={goNext}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/30 hover:bg-black/60 backdrop-blur-md flex items-center justify-center text-white transition cursor-pointer border border-white/20 opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100"
                  >
                    <ChevronRight size={24} />
                  </button>
                </>
              )}

              {/* Dot Indicators */}
              {displayBanners.length > 1 && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2 bg-black/30 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                  {displayBanners.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => goTo(i)}
                      className={`rounded-full transition-all duration-300 cursor-pointer ${
                        i === currentBanner
                          ? 'w-6 h-2 bg-emerald-400'
                          : 'w-2 h-2 bg-white/40 hover:bg-white/80'
                      }`}
                    />
                  ))}
                </div>
              )}

              {/* Auto-play progress bar */}
              {displayBanners.length > 1 && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-white/10 z-20">
                  <motion.div
                    key={currentBanner}
                    className="h-full bg-gradient-to-r from-emerald-400 to-teal-400"
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 5, ease: 'linear' }}
                  />
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* ── Live Offers Strip ── */}
      <HeroOffersStrip />
    </div>
  );
}
