'use client';

import { motion } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';
import { Users, TrendingUp, Zap, Star } from 'lucide-react';

function useCounter(end: number, duration: number = 2000) {
 const [count, setCount] = useState(0);
 const [started, setStarted] = useState(false);
 const ref = useRef<HTMLDivElement>(null);

 useEffect(() => {
 const observer = new IntersectionObserver(
 ([entry]) => { if (entry.isIntersecting) setStarted(true); },
 { threshold: 0.3 }
 );
 if (ref.current) observer.observe(ref.current);
 return () => observer.disconnect();
 }, []);

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
 { icon: Users, value: 200, suffix: '+', label: 'Happy Customers', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
 { icon: TrendingUp, value: 10, suffix: '+', label: 'Cities Served', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
 { icon: Zap, value: 3000, suffix: '+', label: 'Servings Delivered', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
 { icon: Star, value: 49, suffix: '★', label: 'Customer Rating', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20', isDecimal: true },
];

export function StatsBar() {
 return (
 <section className="relative py-10 bg-gradient-to-b from-transparent to-transparent overflow-hidden">
 {/* Divider line */}
 <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-green-500/30 to-transparent" />
 <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-green-500/20 to-transparent" />

 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 transition={{ duration: 0.7 }}
 className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6"
 >
 {stats.map((stat, idx) => {
 const counter = useCounter(stat.value, stat.value > 1000 ? 2500 : 2000);
 const Icon = stat.icon;
 return (
 <motion.div
 key={idx}
 ref={counter.ref}
 initial={{ opacity: 0, y: 20 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 transition={{ duration: 0.6, delay: idx * 0.1 }}
 whileHover={{ y: -3, transition: { duration: 0.2 } }}
 className={`glass rounded-2xl p-5 border ${stat.bg} flex flex-col items-center text-center group cursor-default`}
 >
 <div className={`w-10 h-10 rounded-xl border ${stat.bg} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}>
 <Icon className={`w-5 h-5 ${stat.color}`} />
 </div>
 <p className={`text-2xl md:text-3xl font-black font-mono ${stat.color} leading-none mb-1`}>
 {stat.isDecimal
 ? `${Math.floor(counter.count / 10)}.${counter.count % 10}`
 : counter.count.toLocaleString()
 }
 <span className="text-lg">{stat.suffix}</span>
 </p>
 <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">{stat.label}</p>
 </motion.div>
 );
 })}
 </motion.div>
 </div>
 </section>
 );
}
