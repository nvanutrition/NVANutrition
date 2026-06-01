'use client';

import { motion, type Variants } from 'framer-motion';
import { ShieldCheck, Sparkles, Activity, Award, Flame, Zap } from 'lucide-react';

const benefits = [
  {
    icon: Sparkles,
    title: 'Premium Ingredients',
    description: 'We source only the purest, highly bioavailable ingredients. No fillers, no spikes, no compromises.',
    color: 'from-green-400 to-emerald-500',
    highlight: 'Purest Grade'
  },
  {
    icon: ShieldCheck,
    title: 'Lab Tested Integrity',
    description: 'Every single batch undergoes rigorous 3rd-party testing for purity, heavy metals, and label accuracy.',
    color: 'from-emerald-400 to-teal-500',
    highlight: '100% Verified'
  },
  {
    icon: Activity,
    title: 'Rapid Post-Workout Recovery',
    description: 'Formulated with crucial micronutrients and standard-setting amino acids to shorten recovery windows.',
    color: 'from-green-500 to-green-600',
    highlight: 'Zero Downtime'
  },
  {
    icon: Flame,
    title: 'Lean Muscle & Strength',
    description: 'Clinically-dosed formulas engineered to optimize muscle synthesis and increase power thresholds.',
    color: 'from-green-600 to-emerald-700',
    highlight: 'Max Performance'
  },
  {
    icon: Zap,
    title: 'Clean Performance Energy',
    description: 'Sustained energy release matrix without the harsh crashes or high-stimulant jitters.',
    color: 'from-teal-400 to-green-500',
    highlight: 'Crash-Free'
  },
  {
    icon: Award,
    title: 'Certifications of Trust',
    description: 'Manufactured in state-of-the-art facilities complying with ISO, WHO-GMP, and FSSAI guidelines.',
    color: 'from-emerald-500 to-teal-600',
    highlight: 'Global Standard'
  },
];

export function BenefitsSection() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 },
    },
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.25, 1, 0.5, 1] as [number, number, number, number] },
    },
  };

  return (
    <section className="relative py-28 overflow-hidden bg-white text-gray-900">
      {/* Background abstract shape */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-green-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />

      {/* Decorative dot grid */}
      <div className="absolute top-12 left-12 w-24 h-24 opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)',
          backgroundSize: '12px 12px',
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-5 py-2.5 mb-6"
          >
            <ShieldCheck size={14} className="text-green-600" />
            <span className="text-green-600 font-bold text-xs tracking-[0.2em] uppercase">The NV Standard</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-black tracking-tight text-gray-900 mb-6 uppercase"
          >
            Science-Backed <br />
            <span className="text-gradient-green">Performance Enhancements</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="text-lg text-gray-600 max-w-2xl mx-auto font-light"
          >
            At NVA Nutrition, we don&apos;t guess — we formulate. Every ingredient is backed by clinical research and engineered to deliver real, noticeable results.
          </motion.p>
        </div>

        {/* Benefits Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <motion.div
                key={index}
                variants={cardVariants}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                className="group relative bg-white border border-gray-150 rounded-3xl p-8 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgba(0,200,83,0.06)] hover:border-green-500/20 transition-all duration-300 overflow-hidden cursor-default"
              >
                {/* Glow Backdrop */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-500/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                {/* Icon Container */}
                <div className="mb-6 relative">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center group-hover:bg-gradient-to-br group-hover:from-green-500 group-hover:to-emerald-600 border border-gray-200/60 group-hover:border-green-500 transition-all duration-300 shadow-[0_4px_10px_rgba(0,0,0,0.02)] group-hover:shadow-[0_8px_20px_rgba(0,200,83,0.2)]">
                    <Icon className="w-6 h-6 text-gray-700 group-hover:text-black transition-colors duration-300" />
                  </div>
                </div>

                {/* Highlight Badge */}
                <div className="mb-4">
                  <span className="text-[10px] tracking-wider uppercase font-semibold text-green-600 bg-green-50 px-2.5 py-1 rounded-md">
                    {benefit.highlight}
                  </span>
                </div>

                {/* Text Details */}
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-green-600 transition-colors duration-300">
                  {benefit.title}
                </h3>
                
                <p className="text-gray-600 text-sm leading-relaxed font-light">
                  {benefit.description}
                </p>

                {/* Premium border accents on card bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-green-500 to-emerald-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
              </motion.div>
            );
          })}
        </motion.div>

      </div>
    </section>
  );
}
