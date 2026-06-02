'use client';

import Link from 'next/link';
import { motion, useScroll, useTransform, type Variants } from 'framer-motion';
import { ChevronDown, Zap, Award, Users, Star, TrendingUp } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';

// Animated counter hook
function useCounter(end: number, duration: number = 2000, startOnView: boolean = true) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(!startOnView);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!startOnView) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStarted(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [startOnView]);

  useEffect(() => {
    if (!started) return;
    let startTime: number;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [started, end, duration]);

  return { count, ref };
}

const stats = [
  { icon: Users, value: 200, suffix: '+', label: 'Happy Customers', prefix: '' },
  { icon: TrendingUp, value: 10, suffix: '+', label: 'Cities Served', prefix: '' },
  { icon: Zap, value: 3000, suffix: '+', label: 'Servings Delivered', prefix: '' },
  { icon: Star, value: 4.9, suffix: '★', label: 'Customer Rating', prefix: '', isDecimal: true },
];

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  const bgY = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: 0.3 },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1, y: 0,
      transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
    },
  };

  return (
    <div ref={containerRef} className="relative min-h-screen overflow-hidden bg-gradient-hero pt-20">
      {/* Premium gradient background with minimal decorations */}
      <div className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,200,83,0.5) 1px, transparent 0)`,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Subtle gradient orbs - positioned better */}
      <motion.div
        className="absolute top-0 -right-40 w-[500px] h-[500px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(0,200,83,0.06) 0%, transparent 70%)',
          y: bgY,
        }}
      />
      <motion.div
        className="absolute bottom-0 -left-40 w-[400px] h-[400px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(0,200,83,0.04) 0%, transparent 70%)',
        }}
        animate={{ scale: [1, 1.05, 1], opacity: [0.4, 0.6, 0.4] }}
        transition={{ duration: 10, repeat: Infinity }}
      />

      {/* Main Content */}
      <motion.div
        style={{ y: textY, opacity }}
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-screen flex flex-col justify-center"
      >
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-4xl"
        >
          {/* Badge */}
          <motion.div variants={itemVariants} className="mb-6">
            <div className="inline-flex items-center gap-2.5 glass-green rounded-full px-5 py-2.5">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-green-400 font-semibold text-xs tracking-[0.15em] uppercase">Premium Sports Nutrition</span>
            </div>
          </motion.div>

          {/* Headline - Clean and powerful */}
          <motion.div variants={itemVariants} className="mb-8">
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[4.5rem] font-black text-white leading-[1.1] tracking-tight">
              NVA Nutrition: Fuel Your{' '}
              <span className="text-gradient-green">Performance.</span>
              <br />
              Transform Your{' '}
              <span className="relative inline-block">
                Body.
                <motion.div
                  className="absolute -bottom-2 left-0 h-1 bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ delay: 1.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                />
              </span>
            </h1>
          </motion.div>

          {/* Sub headline */}
          <motion.p variants={itemVariants} className="text-base md:text-lg text-gray-400 leading-relaxed max-w-2xl mb-12 font-light">
            Premium NVA Nutrition Designed For Athletes Who Refuse Average. Scientifically formulated. Lab tested. Results guaranteed.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 mb-20">
            <Link href="/products">
              <motion.button
                whileHover={{ scale: 1.03, boxShadow: '0 20px 60px rgba(0,200,83,0.25)' }}
                whileTap={{ scale: 0.98 }}
                className="group bg-gradient-to-r from-green-500 to-emerald-600 text-black font-bold px-8 py-4 rounded-xl text-base transition-all duration-300 shadow-lg shadow-green-500/20 flex items-center gap-3 w-full sm:w-auto justify-center"
              >
                Shop Now
                <motion.span
                  className="inline-block"
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  →
                </motion.span>
              </motion.button>
            </Link>
            <Link href="/products">
              <motion.button
                whileHover={{ scale: 1.03, backgroundColor: 'rgba(255,255,255,0.08)' }}
                whileTap={{ scale: 0.98 }}
                className="glass text-white font-semibold px-8 py-4 rounded-xl text-base transition-all duration-300 w-full sm:w-auto"
              >
                Explore Products
              </motion.button>
            </Link>
          </motion.div>

          {/* Stats - Professional layout */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 pt-8"
          >
            {stats.map((stat, idx) => {
              const counter = useCounter(
                stat.isDecimal ? 49 : stat.value,
                stat.value > 10000 ? 2500 : 2000
              );
              const Icon = stat.icon;

              return (
                <motion.div
                  key={idx}
                  ref={counter.ref}
                  whileHover={{ y: -2 }}
                  className="glass rounded-xl p-4 transition-all duration-300 group cursor-default border border-white/5 hover:border-green-500/20"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center group-hover:bg-green-500/15 transition-colors">
                      <Icon className="w-4 h-4 text-green-400" />
                    </div>
                  </div>
                  <p className="text-xl md:text-2xl font-black text-white tracking-tight font-mono">
                    {stat.prefix}
                    {stat.isDecimal
                      ? `${Math.floor(counter.count / 10)}.${counter.count % 10}`
                      : counter.count.toLocaleString()
                    }
                    {stat.suffix}
                  </p>
                  <p className="text-xs text-gray-500 font-medium mt-1 uppercase tracking-wide">{stat.label}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20"
      >
        <button className="flex flex-col items-center gap-2 text-white/40 hover:text-green-400 transition-colors">
          <span className="text-[10px] font-semibold tracking-[0.2em] uppercase">Scroll</span>
          <ChevronDown size={18} />
        </button>
      </motion.div>
    </div>
  );
}
