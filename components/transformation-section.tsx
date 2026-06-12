'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { Sparkles, Trophy, Flame, ChevronLeft, ChevronRight } from 'lucide-react';

export function TransformationSection() {
 const [sliderPosition, setSliderPosition] = useState(50);
 const [isDragging, setIsDragging] = useState(false);
 const containerRef = useRef<HTMLDivElement>(null);

 const handleMove = (clientX: number) => {
 if (!containerRef.current) return;
 const rect = containerRef.current.getBoundingClientRect();
 const x = clientX - rect.left;
 const position = (x / rect.width) * 100;
 setSliderPosition(Math.max(0, Math.min(100, position)));
 };

 const handleTouchMove = (e: TouchEvent) => {
 if (!isDragging) return;
 handleMove(e.touches[0].clientX);
 };

 const handleMouseMove = (e: MouseEvent) => {
 if (!isDragging) return;
 handleMove(e.clientX);
 };

 const handleMouseUp = () => {
 setIsDragging(false);
 };

 useEffect(() => {
 if (isDragging) {
 window.addEventListener('mousemove', handleMouseMove);
 window.addEventListener('mouseup', handleMouseUp);
 window.addEventListener('touchmove', handleTouchMove);
 window.addEventListener('touchend', handleMouseUp);
 }

 return () => {
 window.removeEventListener('mousemove', handleMouseMove);
 window.removeEventListener('mouseup', handleMouseUp);
 window.removeEventListener('touchmove', handleTouchMove);
 window.removeEventListener('touchend', handleMouseUp);
 };
 }, [isDragging]);

 return (
 <section className="relative py-28 overflow-hidden bg-gray-50">
 {/* Background elements */}
 <div className="absolute top-1/2 left-0 -translate-y-1/2 w-96 h-96 rounded-full bg-green-500/5 blur-[100px] pointer-events-none" />
 <div className="absolute top-1/3 right-0 w-[450px] h-[450px] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />

 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
 
 {/* Section Header */}
 <div className="text-center mb-20">
 <motion.div
 initial={{ opacity: 0, scale: 0.9 }}
 whileInView={{ opacity: 1, scale: 1 }}
 viewport={{ once: true }}
 className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-5 py-2.5 mb-6"
 >
 <Trophy size={14} className="text-green-600 animate-bounce" />
 <span className="text-green-600 font-bold text-xs tracking-[0.2em] uppercase">Results Speak</span>
 </motion.div>

 <motion.h2
 initial={{ opacity: 0, y: 20 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 transition={{ duration: 0.6 }}
 className="text-4xl md:text-5xl font-black tracking-tight text-gray-900 mb-6 uppercase"
 >
 Real Transformations
 </motion.h2>

 <motion.p
 initial={{ opacity: 0, y: 20 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 transition={{ duration: 0.6, delay: 0.15 }}
 className="text-lg text-gray-600 max-w-2xl mx-auto font-light"
 >
 The difference between average and elite. See how consistency, discipline, and NVA Nutrition premium fuel unlock biological potential.
 </motion.p>
 </div>

 {/* Comparison and Stats Grid */}
 <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
 
 {/* Interactive Before/After Slider (lg:col-span-7) */}
 <div className="lg:col-span-7 flex flex-col items-center">
 
 {/* Instruction Badge */}
 <span className="mb-4 text-xs font-semibold text-muted-foreground tracking-wider uppercase flex items-center gap-1.5 bg-gray-200/50 px-3 py-1 rounded-full">
 ↔ Drag the slider to compare details
 </span>

 <div 
 ref={containerRef}
 className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.15)] border-4 border-white select-none cursor-ew-resize"
 onMouseDown={() => setIsDragging(true)}
 onTouchStart={() => setIsDragging(true)}
 >
 {/* Before Image (Background) */}
 <div className="absolute inset-0 w-full h-full">
 <Image
 src="/transformation-before.png"
 alt="Before Transformation"
 fill
 sizes="(max-width: 768px) 100vw, 50vw"
 className="object-cover pointer-events-none"
 priority
 />
 <div className="absolute bottom-6 left-6 bg-background/70 backdrop-blur-md text-foreground font-bold text-sm tracking-wider uppercase px-4 py-2 rounded-xl">
 Before
 </div>
 </div>

 {/* After Image (Foreground Clip) */}
 <div 
 className="absolute inset-0 w-full h-full overflow-hidden"
 style={{ clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)` }}
 >
 <Image
 src="/transformation-after.png"
 alt="After Transformation"
 fill
 sizes="(max-width: 768px) 100vw, 50vw"
 className="object-cover pointer-events-none"
 priority
 />
 <div className="absolute bottom-6 right-6 bg-green-500 text-black font-black text-sm tracking-wider uppercase px-4 py-2 rounded-xl shadow-lg shadow-green-500/20">
 After
 </div>
 </div>

 {/* Slider Handle Line */}
 <div 
 className="absolute top-0 bottom-0 w-[2px] bg-white cursor-ew-resize pointer-events-none shadow-[0_0_10px_rgba(0,0,0,0.5)]"
 style={{ left: `${sliderPosition}%` }}
 >
 {/* Center Circle Button */}
 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white text-black border border-gray-200 flex items-center justify-center shadow-2xl transition-transform duration-200 hover:scale-110 pointer-events-none">
 <div className="flex gap-0.5 text-gray-700">
 <ChevronLeft size={16} />
 <ChevronRight size={16} />
 </div>
 </div>
 </div>
 </div>
 </div>

 {/* Stats details (lg:col-span-5) */}
 <div className="lg:col-span-5 space-y-8">
 <div className="glass-green rounded-3xl p-8 border border-green-500/10">
 <div className="flex items-center gap-2 mb-4">
 <Flame className="text-green-500 animate-pulse" size={20} />
 <span className="text-sm font-extrabold uppercase tracking-widest text-green-500">Transform Matrix</span>
 </div>
 <h3 className="text-2xl font-black text-gray-900 mb-4 uppercase">
 Optimized Biological Outcomes
 </h3>
 <p className="text-gray-600 text-sm leading-relaxed font-light mb-6">
 Our formulas prioritize nutrient partitioning. This means amino acids and energy go directly to supporting lean muscle recovery and fat oxidation.
 </p>

 {/* Stats Counters */}
 <div className="grid grid-cols-1 gap-4">
 {[
 { label: 'Lean Muscle Mass Gained', val: '12 kg', desc: 'Sustained hyper-synthesis' },
 { label: 'Adipose Tissue / Fat Loss', val: '-6.5%', desc: 'Enhanced lipid beta-oxidation' },
 { label: 'Peak Strength Capacity', val: '+40%', desc: 'Optimized ATP-CP system output' },
 ].map((stat, i) => (
 <motion.div 
 key={i}
 whileHover={{ x: 6 }}
 className="flex justify-between items-center bg-white p-5 rounded-2xl border border-gray-200/50 shadow-sm"
 >
 <div>
 <h4 className="text-sm font-bold text-gray-900">{stat.label}</h4>
 <p className="text-xs text-gray-500">{stat.desc}</p>
 </div>
 <span className="text-2xl font-black text-green-600 tracking-tight font-mono">{stat.val}</span>
 </motion.div>
 ))}
 </div>
 </div>

 {/* Premium Note */}
 <div className="bg-white border border-gray-200/80 rounded-2xl p-6 flex gap-4 items-start shadow-sm">
 <div className="p-3 rounded-xl bg-green-50 text-green-600">
 <Sparkles size={20} />
 </div>
 <div>
 <h4 className="font-bold text-gray-900 text-sm mb-1">Standardized Timeline</h4>
 <p className="text-xs text-gray-500 leading-relaxed font-light">
 Transformations reflect exactly 8 to 12 weeks of high-intensity functional training aligned with NVA Nutrition Iso-Whey & Pre-Workout protocols. Individual outcomes may vary depending on genetic biomarkers and baseline metabolic rate.
 </p>
 </div>
 </div>

 </div>

 </div>

 </div>
 </section>
 );
}
