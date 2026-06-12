'use client';

import { motion, type Variants } from 'framer-motion';
import { ShieldCheck, Sparkles, Activity, Award, Flame, Zap } from 'lucide-react';

const benefits = [
  {
    icon: Sparkles,
    title: 'Premium Ingredients',
    description: 'We source only the purest, highly bioavailable ingredients. No fillers, no spikes, no compromises.',
    highlight: 'Purest Grade',
    accent: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    iconBg: 'from-yellow-400 to-orange-500',
  },
  {
    icon: ShieldCheck,
    title: 'Lab Tested Integrity',
    description: 'Every single batch undergoes rigorous 3rd-party testing for purity, heavy metals, and label accuracy.',
    highlight: '100% Verified',
    accent: 'bg-green-50 border-green-200 text-green-700',
    iconBg: 'from-green-500 to-emerald-600',
  },
  {
    icon: Activity,
    title: 'Rapid Recovery',
    description: 'Formulated with crucial micronutrients and amino acids to dramatically shorten recovery windows.',
    highlight: 'Zero Downtime',
    accent: 'bg-blue-50 border-blue-200 text-blue-700',
    iconBg: 'from-blue-500 to-indigo-600',
  },
  {
    icon: Flame,
    title: 'Lean Muscle & Strength',
    description: 'Clinically-dosed formulas engineered to optimize muscle synthesis and increase power thresholds.',
    highlight: 'Max Performance',
    accent: 'bg-red-50 border-red-200 text-red-700',
    iconBg: 'from-red-500 to-rose-600',
  },
  {
    icon: Zap,
    title: 'Clean Energy',
    description: 'Sustained energy release matrix without harsh crashes or high-stimulant jitters. All day power.',
    highlight: 'Crash-Free',
    accent: 'bg-amber-50 border-amber-200 text-amber-700',
    iconBg: 'from-amber-400 to-yellow-500',
  },
  {
    icon: Award,
    title: 'Certified Excellence',
    description: 'Manufactured in state-of-the-art facilities complying with ISO, WHO-GMP, and FSSAI guidelines.',
    highlight: 'Global Standard',
    accent: 'bg-purple-50 border-purple-200 text-purple-700',
    iconBg: 'from-purple-500 to-violet-600',
  },
];

export function BenefitsSection() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.09, delayChildren: 0.1 } },
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 28 },
    visible: {
      opacity: 1, y: 0,
      transition: { duration: 0.55, ease: [0.25, 1, 0.5, 1] as [number, number, number, number] },
    },
  };

  return (
    <section className="relative py-24 overflow-hidden bg-gray-50">
      {/* Subtle decorations */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-green-100/40 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-emerald-100/40 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-5 py-2 mb-5"
          >
            <ShieldCheck size={14} className="text-green-600" />
            <span className="text-green-700 font-black text-xs tracking-widest uppercase">The NVA Standard</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-black text-gray-900 mb-5 leading-tight"
          >
            Science-Backed<br />
            <span className="bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent">
              Performance Enhancements
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="text-gray-500 text-lg max-w-2xl mx-auto"
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
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <motion.div
                key={index}
                variants={cardVariants}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className="relative bg-white border border-gray-200 hover:border-gray-300 rounded-2xl p-7 shadow-[0_4px_20px_rgba(0,0,0,0.05)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)] transition-all duration-300 overflow-hidden group cursor-default"
              >
                {/* Corner glow */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-green-50 to-transparent rounded-bl-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* Icon */}
                <div className={`w-13 h-13 rounded-2xl bg-gradient-to-br ${benefit.iconBg} flex items-center justify-center mb-5 shadow-md`}
                  style={{ width: '52px', height: '52px' }}>
                  <Icon className="w-6 h-6 text-white" />
                </div>

                {/* Badge */}
                <span className={`inline-block text-[10px] tracking-widest uppercase font-black px-2.5 py-1 rounded-full border mb-4 ${benefit.accent}`}>
                  {benefit.highlight}
                </span>

                {/* Text */}
                <h3 className="text-base font-black text-gray-900 mb-2">{benefit.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{benefit.description}</p>

                {/* Bottom accent bar */}
                <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${benefit.iconBg} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
