'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';
import { Quote, ChevronLeft, ChevronRight, Zap } from 'lucide-react';

const motivationalQuotes = [
 {
 text: "Your Body Can Stand Almost Anything. It's Your Mind You Have To Convince.",
 author: 'Champions Mindset',
 stat: '90% mental'
 },
 {
 text: 'No Excuses. Just Results. Refuse Average Every Single Day.',
 author: 'The NV Philosophy',
 stat: '100% focus'
 },
 {
 text: 'Train Hard. Recover Harder. Elevate Your Fuel, Elevate Your Game.',
 author: 'Success Formula',
 stat: 'Pure recovery'
 },
 {
 text: 'Become Stronger Than Your Strongest Excuse. You Are Limitless.',
 author: 'Champions Daily',
 stat: 'No limits'
 },
 {
 text: 'Pain Is Temporary. Pride Is Forever. Choose The Path Of Excellence.',
 author: 'Fitness Wisdom',
 stat: 'Infinite pride'
 },
 {
 text: 'Your Only True Limit Is You. Redefine What Is Possible.',
 author: 'Unlimited Potential',
 stat: 'Break boundaries'
 },
];

export function MotivationSection() {
 const [currentQuote, setCurrentQuote] = useState(0);
 const [progress, setProgress] = useState(0);
 const progressInterval = useRef<NodeJS.Timeout | null>(null);

 useEffect(() => {
 // Progress bar auto-scroller
 const duration = 6000; // 6 seconds per quote
 const stepTime = 100;
 const increment = (stepTime / duration) * 100;

 setProgress(0);

 const startTimer = () => {
 progressInterval.current = setInterval(() => {
 setProgress((prev) => {
 if (prev >= 100) {
 setCurrentQuote((curr) => (curr + 1) % motivationalQuotes.length);
 return 0;
 }
 return prev + increment;
 });
 }, stepTime);
 };

 startTimer();

 return () => {
 if (progressInterval.current) clearInterval(progressInterval.current);
 };
 }, [currentQuote]);

 const handlePrevious = () => {
 setCurrentQuote((prev) => (prev - 1 + motivationalQuotes.length) % motivationalQuotes.length);
 setProgress(0);
 };

 const handleNext = () => {
 setCurrentQuote((prev) => (prev + 1) % motivationalQuotes.length);
 setProgress(0);
 };

 return (
 <section className="relative py-28 overflow-hidden bg-background text-foreground">
 {/* Background Radial Glow */}
 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none opacity-[0.06]"
 style={{
 background: 'radial-gradient(circle, rgba(0,320,83,0.3) 0%, transparent 70%)',
 }}
 />

 {/* Grid Pattern */}
 <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
 style={{
 backgroundImage: `linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)`,
 backgroundSize: '80px 80px',
 }}
 />

 <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
 
 {/* Section Tag */}
 <div className="flex justify-center mb-12">
 <div className="inline-flex items-center gap-2 px-4 py-2 glass rounded-full border border-border">
 <Zap size={14} className="text-green-400 animate-pulse" />
 <span className="text-green-400 font-bold text-xs tracking-[0.2em] uppercase">Daily Fuel</span>
 </div>
 </div>

 {/* Quote Container */}
 <div className="relative min-h-[220px] flex flex-col items-center justify-center text-center px-4 md:px-12">
 
 {/* Glowing Quote Mark Icon */}
 <div className="absolute -top-12 opacity-10">
 <Quote size={80} className="text-green-400" />
 </div>

 <AnimatePresence mode="wait">
 <motion.div
 key={currentQuote}
 initial={{ opacity: 0, y: 30 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -30 }}
 transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
 className="max-w-4xl"
 >
 <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight mb-8 uppercase italic font-sans text-foreground/90">
 &ldquo;{motivationalQuotes[currentQuote].text}&rdquo;
 </h2>
 
 <div className="flex items-center justify-center gap-3">
 <div className="h-[2px] w-8 bg-green-500/50" />
 <p className="text-green-400 text-sm md:text-base font-bold tracking-[0.25em] uppercase">
 {motivationalQuotes[currentQuote].author}
 </p>
 <div className="h-[2px] w-8 bg-green-500/50" />
 </div>

 {/* Tag Stat */}
 <div className="mt-4">
 <span className="inline-block text-[10px] tracking-widest font-mono text-gray-500 uppercase px-3 py-1 border border-border rounded-full bg-muted">
 {motivationalQuotes[currentQuote].stat}
 </span>
 </div>
 </motion.div>
 </AnimatePresence>
 </div>

 {/* Controls Layout */}
 <div className="mt-16 flex flex-col items-center gap-6">
 
 {/* Progress Bar */}
 <div className="w-64 h-[3px] bg-muted rounded-full overflow-hidden">
 <div 
 className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-100 ease-linear rounded-full shadow-[0_0_8px_#00c853]"
 style={{ width: `${progress}%` }}
 />
 </div>

 {/* Navigation Arrows */}
 <div className="flex gap-4">
 <motion.button
 whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(0,200,83,0.3)' }}
 whileTap={{ scale: 0.9 }}
 onClick={handlePrevious}
 className="p-3 border border-border rounded-full transition-all duration-300 flex items-center justify-center text-foreground/70 hover:text-green-400 bg-muted backdrop-blur-md"
 aria-label="Previous Quote"
 >
 <ChevronLeft size={20} />
 </motion.button>
 
 <motion.button
 whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(0,200,83,0.3)' }}
 whileTap={{ scale: 0.9 }}
 onClick={handleNext}
 className="p-3 border border-border rounded-full transition-all duration-300 flex items-center justify-center text-foreground/70 hover:text-green-400 bg-muted backdrop-blur-md"
 aria-label="Next Quote"
 >
 <ChevronRight size={20} />
 </motion.button>
 </div>

 {/* Indicator Dots */}
 <div className="flex gap-2">
 {motivationalQuotes.map((_, index) => (
 <button
 key={index}
 onClick={() => {
 setCurrentQuote(index);
 setProgress(0);
 }}
 className={`h-1 rounded-full transition-all duration-300 ${
 index === currentQuote ? 'bg-green-500 w-6' : 'bg-muted/50 w-1.5'
 }`}
 aria-label={`Go to slide ${index + 1}`}
 />
 ))}
 </div>

 </div>

 </div>
 </section>
 );
}
