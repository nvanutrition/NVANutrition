'use client';

import { motion, type Variants } from 'framer-motion';
import Image from 'next/image';
import { Star, ShieldCheck, Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'Rajesh Kumar',
    role: 'Competitive Fitness Athlete',
    image: '/athlete-testimonial.png',
    rating: 5,
    text: 'NVA Nutrition has completely changed my competition prep. The purity of the Iso-Whey is outstanding — my muscle fullness and recovery speeds have hit completely new heights.',
    achievement: '1st Place Men\'s Physique'
  },
  {
    name: 'Priya Singh',
    role: 'National Level Powerlifter',
    image: '/athlete-testimonial.png',
    rating: 5,
    text: 'Most proteins taste artificial or feel heavy. NVA Nutrition formulated a clean product that digests flawlessly and supports my aggressive strength goals. Recommended without hesitation.',
    achievement: 'Elite Powerlifter'
  },
  {
    name: 'Arjun Patel',
    role: 'Head Strength Coach & Nutritionist',
    image: '/athlete-testimonial.png',
    rating: 5,
    text: 'I put my elite clients on NVA Nutrition products because lab integrity and heavy metal testing are critical. Every batch delivers exactly what is on the label. Unbeatable purity.',
    achievement: 'Certified Strength Coach'
  },
];

export function TestimonialsSection() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: 0.1 },
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
    <section className="relative py-28 overflow-hidden bg-nv-dark text-white border-b border-white/5">
      {/* Background Orbs */}
      <div className="absolute top-1/4 -right-32 w-[500px] h-[500px] rounded-full bg-green-500/5 blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full bg-emerald-500/5 blur-[100px] pointer-events-none" />

      {/* Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)`,
          backgroundSize: '80px 80px',
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 glass rounded-full border border-white/5 mb-6"
          >
            <ShieldCheck size={14} className="text-green-400" />
            <span className="text-green-400 font-bold text-xs tracking-[0.2em] uppercase">Trusted by Pros</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-black tracking-tight text-white mb-6 uppercase"
          >
            Endorsed by Elite Athletes
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="text-lg text-gray-400 max-w-2xl mx-auto font-light"
          >
            We don&apos;t just pay for testimonials. We fuel competitors who demand the cleanest protein formulations to power their international performance.
          </motion.p>
        </div>

        {/* Testimonials Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              className="group relative bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md hover:bg-white/10 hover:border-green-500/20 transition-all duration-300 flex flex-col cursor-default"
            >
              {/* Quote Graphic Overlay */}
              <div className="absolute top-6 right-8 text-white/5 pointer-events-none group-hover:text-green-500/10 transition-colors">
                <Quote size={60} />
              </div>

              {/* Verified Badge */}
              <div className="flex justify-between items-center mb-6">
                <div className="flex gap-1">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-green-400 text-green-400 shadow-[0_0_8px_#00c853]" />
                  ))}
                </div>
                <span className="text-[10px] tracking-wider uppercase font-semibold text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck size={10} /> Verified Athlete
                </span>
              </div>

              {/* Review Text */}
              <p className="text-gray-300 text-sm md:text-base leading-relaxed font-light mb-8 italic flex-grow">
                &ldquo;{testimonial.text}&rdquo;
              </p>

              {/* Divider */}
              <div className="w-full h-[1px] bg-white/10 mb-6" />

              {/* Profile Block */}
              <div className="flex items-center gap-4">
                <div className="relative w-14 h-14 rounded-2xl overflow-hidden border border-white/10 group-hover:border-green-500/30 transition-colors">
                  <Image
                    src={testimonial.image}
                    alt={testimonial.name}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-bold text-white tracking-wide">{testimonial.name}</h4>
                  <p className="text-xs text-green-400 font-semibold tracking-wider uppercase">{testimonial.role}</p>
                  
                  {/* Achievement Subtitle */}
                  <span className="inline-block mt-1 text-[9px] text-gray-500 font-mono tracking-widest uppercase">
                    🏆 {testimonial.achievement}
                  </span>
                </div>
              </div>

            </motion.div>
          ))}
        </motion.div>

      </div>
    </section>
  );
}
