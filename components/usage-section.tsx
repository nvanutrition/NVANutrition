'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { Target, Zap, BatteryCharging, Dumbbell } from 'lucide-react';
import Link from 'next/link';

const USE_CASES = [
  {
    id: 'pre-workout',
    title: 'Pre-Workout Energy',
    description: 'Explosive energy and laser focus to crush your hardest training sessions.',
    icon: Zap,
    image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=2070&auto=format&fit=crop',
    color: 'from-amber-500 to-orange-600',
    tags: ['Pre-Workout', 'Creatine', 'Energy Amino'],
  },
  {
    id: 'muscle-building',
    title: 'Lean Muscle Growth',
    description: 'Premium proteins and BCAAs to build dense, high-quality muscle mass.',
    icon: Dumbbell,
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop',
    color: 'from-emerald-500 to-teal-600',
    tags: ['Whey Protein Iso', 'Mass Gainer', 'BCAA'],
  },
  {
    id: 'recovery',
    title: 'Rapid Recovery',
    description: 'Accelerate muscle repair and reduce soreness so you can train harder, sooner.',
    icon: BatteryCharging,
    image: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=2069&auto=format&fit=crop',
    color: 'from-blue-500 to-indigo-600',
    tags: ['Glutamine', 'ZMA', 'Casein'],
  },
];

export function UsageSection() {
  return (
    <section className="py-24 bg-gray-50 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-amber-500/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-5 py-2 mb-5 shadow-sm">
            <Target size={14} className="text-emerald-600" />
            <span className="text-gray-800 font-black text-xs uppercase tracking-widest">Achieve Your Goals</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 leading-tight tracking-tight">
            Built For Your <br />
            <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Exact Needs
            </span>
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto font-medium">
            Whether you are looking to build muscle, lose fat, or boost your endurance, we have the exact protocol for you.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {USE_CASES.map((useCase, idx) => {
            const Icon = useCase.icon;
            return (
              <motion.div
                key={useCase.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.15 }}
                className="group relative h-[450px] rounded-[2rem] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.08)] cursor-pointer"
              >
                {/* Background Image */}
                <Image
                  src={useCase.image}
                  alt={useCase.title}
                  fill
                  className="object-cover transition-transform duration-1000 group-hover:scale-110"
                />
                
                {/* Gradient Overlay */}
                <div className={`absolute inset-0 bg-gradient-to-t ${useCase.color} opacity-80 mix-blend-multiply transition-opacity duration-500 group-hover:opacity-90`} />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent opacity-90" />

                {/* Content */}
                <div className="absolute inset-0 p-8 flex flex-col justify-end">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 border border-white/30 transform group-hover:-translate-y-2 transition-transform duration-500">
                    <Icon size={28} className="text-white drop-shadow-md" />
                  </div>
                  
                  <h3 className="text-3xl font-black text-white mb-3 tracking-tight drop-shadow-md transform group-hover:-translate-y-2 transition-transform duration-500 delay-75">
                    {useCase.title}
                  </h3>
                  
                  <p className="text-white/80 font-medium mb-6 line-clamp-2 transform group-hover:-translate-y-2 transition-transform duration-500 delay-100">
                    {useCase.description}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-6 transform group-hover:-translate-y-2 transition-transform duration-500 delay-150">
                    {useCase.tags.map((tag, i) => (
                      <span key={i} className="text-[10px] font-black uppercase tracking-widest text-white bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/20">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <Link href={`/products?category=${useCase.tags[0]}`}>
                    <div className="inline-flex items-center gap-2 text-white font-bold text-sm uppercase tracking-wider group-hover:text-emerald-300 transition-colors">
                      Shop Protocol <Zap size={14} />
                    </div>
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
