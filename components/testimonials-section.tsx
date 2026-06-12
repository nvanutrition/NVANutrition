'use client';

import { motion, type Variants } from 'framer-motion';
import Image from 'next/image';
import { Star, ShieldCheck, Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'Karan Shergill',
    role: 'Competitive Bodybuilder',
    image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=200&auto=format&fit=crop',
    rating: 5,
    text: "Switching to NVA Nutrition's isolate completely changed my prep. The absolute lack of bloating and incredible mixability is exactly what I need during peak week. It's the cleanest protein I've used in India.",
    achievement: "1st Place Men's Physique",
    color: 'border-green-200 bg-green-50/50',
    badge: 'from-green-500 to-emerald-600',
  },
  {
    name: 'Sneha Rao',
    role: 'National Level Powerlifter',
    image: 'https://images.unsplash.com/photo-1608223661148-d3e3becc8245?q=80&w=200&auto=format&fit=crop',
    rating: 5,
    text: "As a powerlifter, muscle recovery is my top priority. Most proteins are heavy and digest poorly. NVA's formulation absorbs so cleanly, and my strength gains have been noticeably more consistent since I made the switch.",
    achievement: 'Elite Powerlifter',
    color: 'border-blue-200 bg-blue-50/50',
    badge: 'from-blue-500 to-indigo-600',
  },
  {
    name: 'Rahul Khanna',
    role: 'Head Strength Coach',
    image: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=200&auto=format&fit=crop',
    rating: 5,
    text: "I mandate NVA Nutrition for all my elite clients. The heavy metal testing and strict label accuracy give me total peace of mind. Every scoop delivers exactly the macros promised. It's unmatched purity.",
    achievement: 'Certified Strength Coach',
    color: 'border-purple-200 bg-purple-50/50',
    badge: 'from-purple-500 to-pink-600',
  },
];

export function TestimonialsSection() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1, y: 0,
      transition: { duration: 0.6, ease: [0.25, 1, 0.5, 1] as [number, number, number, number] },
    },
  };

  return (
    <section className="relative py-24 overflow-hidden bg-gray-50">
      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-green-200/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-200/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl pointer-events-none" />

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
            <span className="text-green-700 font-black text-xs tracking-widest uppercase">Trusted by Pros</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-black tracking-tight text-gray-900 mb-5"
          >
            Endorsed by<br />
            <span className="bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent">
              Elite Athletes
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="text-gray-500 text-lg max-w-2xl mx-auto"
          >
            We don&apos;t pay for endorsements — we fuel competitors who demand the cleanest protein formulations for international performance.
          </motion.p>
        </div>

        {/* Testimonials Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className={`group relative bg-white border-2 ${testimonial.color} rounded-3xl p-8 shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_20px_48px_rgba(0,0,0,0.1)] transition-all duration-300 flex flex-col cursor-default`}
            >
              {/* Giant Quote Mark */}
              <div className="absolute top-6 right-6 text-gray-100 group-hover:text-green-100 transition-colors pointer-events-none">
                <Quote size={56} />
              </div>

              {/* Stars + Verified badge */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex gap-1">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="text-[10px] tracking-wider uppercase font-bold text-green-700 bg-green-100 border border-green-200 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <ShieldCheck size={10} /> Verified
                </span>
              </div>

              {/* Review Text */}
              <p className="text-gray-600 text-sm leading-relaxed mb-7 flex-grow italic relative z-10">
                &ldquo;{testimonial.text}&rdquo;
              </p>

              {/* Divider */}
              <div className="w-full h-px bg-gray-100 mb-5" />

              {/* Profile */}
              <div className="flex items-center gap-4">
                <div className={`relative w-14 h-14 rounded-2xl overflow-hidden ring-2 ring-offset-2 bg-gradient-to-br ${testimonial.badge}`}>
                  <Image
                    src={testimonial.image}
                    alt={testimonial.name}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-black text-gray-900 text-sm">{testimonial.name}</h4>
                  <p className="text-xs text-gray-500 font-medium">{testimonial.role}</p>
                  <span className="inline-flex items-center gap-1 mt-1 text-[10px] text-amber-600 font-black uppercase tracking-wider">
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
