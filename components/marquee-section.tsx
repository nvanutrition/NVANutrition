'use client';

import { motion } from 'framer-motion';
import { Shield, Zap, Activity, CheckCircle, Flame, Droplets } from 'lucide-react';

const MARQUEE_ITEMS = [
  { text: '100% GENUINE', icon: Shield, color: 'text-emerald-400' },
  { text: 'LAB TESTED', icon: Activity, color: 'text-teal-400' },
  { text: 'FAST RECOVERY', icon: Zap, color: 'text-amber-400' },
  { text: 'PREMIUM WHEY', icon: Droplets, color: 'text-cyan-400' },
  { text: 'MAX PERFORMANCE', icon: Flame, color: 'text-rose-400' },
  { text: 'FSSAI CERTIFIED', icon: CheckCircle, color: 'text-blue-400' },
];

export function MarqueeSection() {
  return (
    <div className="relative py-5 bg-gray-950 overflow-hidden border-b border-white/5 shadow-inner">
      {/* Subtle background glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 opacity-50 pointer-events-none" />
      
      {/* Fading edges */}
      <div className="absolute left-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-r from-gray-950 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-l from-gray-950 to-transparent z-10 pointer-events-none" />

      <div className="flex overflow-hidden whitespace-nowrap">
        <motion.div
          animate={{ x: [0, -1000] }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: 'loop',
              duration: 25,
              ease: 'linear',
            },
          }}
          className="flex items-center gap-12 sm:gap-24 whitespace-nowrap pl-12 sm:pl-24"
        >
          {/* Double the items to create seamless infinite loop */}
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS, ...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="flex items-center gap-3">
                <Icon size={24} className={item.color} />
                <span className="text-xl sm:text-2xl font-black text-white uppercase tracking-[0.2em]">
                  {item.text}
                </span>
              </div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
