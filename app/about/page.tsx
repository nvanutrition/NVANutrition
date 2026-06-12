'use client';

import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { StatsBar } from '@/components/stats-bar';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Eye, Heart, Zap, Shield, Users, Rocket, Award, Target, CheckCircle } from 'lucide-react';
import Link from 'next/link';

const audience = [
  { icon: Zap, title: 'Athletes', desc: 'Chasing greatness and peak performance', color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  { icon: Heart, title: 'Gym Enthusiasts', desc: 'Building strength and sculpting their physique', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
  { icon: Rocket, title: 'School & College Youth', desc: 'Chasing dreams while staying fit', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
  { icon: Users, title: 'Senior Citizens', desc: 'Staying active and healthy', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  { icon: Shield, title: 'Servicemen', desc: 'Serving with pride and maintaining peak condition', color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200' },
  { icon: Award, title: 'Corporate Warriors', desc: 'Balancing hustle, health, and diet', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
];

const values = [
  { title: 'Integrity', desc: 'Honest products, honest prices, honest results', num: '01' },
  { title: 'Transparency', desc: 'Every ingredient listed, every claim backed by science', num: '02' },
  { title: 'Quality', desc: 'Lab tested, GMP certified, premium standards always', num: '03' },
  { title: 'Performance', desc: 'Products designed for real, measurable results', num: '04' },
  { title: 'Customer First', desc: 'Your satisfaction and trust is our success', num: '05' },
  { title: 'Innovation', desc: 'Constantly evolving to serve you better', num: '06' },
];

export default function AboutPage() {
  return (
    <main>
      <Navbar />
      <div className="pt-16 bg-white">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-green-600 via-emerald-700 to-green-900 text-white py-28">
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-5 py-2 mb-6">
              <Target size={14} className="text-green-300" />
              <span className="text-green-200 text-sm font-semibold tracking-widest uppercase">Our Story</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">About NVA<br /><span className="text-green-300">Nutrition</span></h1>
            <p className="text-xl text-green-100 max-w-2xl mx-auto font-medium">
              Built for Hustlers. Powered by Nutrition. A movement, not just a brand.
            </p>
          </motion.div>
        </section>

        {/* Stats Bar */}
        <StatsBar />

        {/* Our Story */}
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
                <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-4 py-1.5 mb-6">
                  <span className="text-green-600 text-xs font-bold uppercase tracking-wider">Our Journey</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-8 leading-tight">Built by a<br /><span className="text-green-600">Corporate Hustler</span></h2>
                <div className="space-y-5 text-gray-600 text-lg leading-relaxed">
                  <p>NVA Nutrition was founded by a corporate hustler who knows the real struggle. Balancing a demanding job, maintaining your health, and sticking to a proper diet? It&apos;s damn hard.</p>
                  <p>We started this brand because we believe premium nutrition shouldn&apos;t be a luxury. It should be accessible, affordable, and effective for everyone grinding it out daily.</p>
                  <p className="text-lg font-bold text-green-700 border-l-4 border-green-500 pl-4">
                    This is not just a supplement brand — it&apos;s a lifestyle. A movement for everyone who hustles.
                  </p>
                </div>
                <div className="mt-8 grid grid-cols-2 gap-4">
                  {['Lab Tested', 'GMP Certified', 'FSSAI Approved', '100K+ Athletes'].map((badge) => (
                    <div key={badge} className="flex items-center gap-2 text-gray-700">
                      <CheckCircle size={18} className="text-green-500 flex-shrink-0" />
                      <span className="font-semibold text-sm">{badge}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
              <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="relative h-[500px] rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.1)]">
                <Image src="/gym-hero.png" alt="Our Story" fill className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Who We Serve */}
        <section className="py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-4 py-1.5 mb-4">
                <span className="text-green-600 text-xs font-bold uppercase tracking-wider">Community</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">Who We Serve</h2>
              <p className="text-xl text-gray-500 font-medium max-w-xl mx-auto">No matter who you are — if you hustle, this brand is for you.</p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {audience.map((item, idx) => (
                <motion.div key={idx} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.08 }}
                  whileHover={{ y: -4 }}
                  className={`bg-white rounded-2xl p-7 shadow-sm hover:shadow-md transition-all border ${item.border}`}>
                  <div className={`w-12 h-12 ${item.bg} rounded-xl flex items-center justify-center mb-5`}>
                    <item.icon size={22} className={item.color} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-black text-gray-900">Mission & Vision</h2>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                className="bg-gradient-to-br from-green-50 to-emerald-100 p-10 rounded-3xl border border-green-200 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-green-200/30 rounded-full -translate-y-1/2 translate-x-1/2" />
                <Rocket className="text-green-600 mb-5" size={32} />
                <h3 className="text-2xl font-black text-gray-900 mb-4">Our Mission</h3>
                <p className="text-gray-700 text-lg leading-relaxed">
                  To empower hustlers everywhere by providing premium, scientifically-formulated nutrition products that support their fitness goals, health aspirations, and lifestyle demands — affordable, effective, and trusted.
                </p>
              </motion.div>
              <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                className="bg-gradient-to-br from-blue-50 to-indigo-100 p-10 rounded-3xl border border-blue-200 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200/30 rounded-full -translate-y-1/2 translate-x-1/2" />
                <Eye className="text-blue-600 mb-5" size={32} />
                <h3 className="text-2xl font-black text-gray-900 mb-4">Our Vision</h3>
                <p className="text-gray-700 text-lg leading-relaxed">
                  To become India&apos;s most trusted premium nutrition brand for hustlers. A brand that understands the struggle, respects the grind, and delivers results that matter. Building stronger bodies, sharper minds.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Core Values */}
        <section className="py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-4 py-1.5 mb-4">
                <span className="text-green-600 text-xs font-bold uppercase tracking-wider">What We Stand For</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">Core Values</h2>
              <p className="text-gray-500 max-w-xl mx-auto">The principles that drive everything we do, every single day.</p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {values.map((value, idx) => (
                <motion.div key={idx} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.08 }}
                  whileHover={{ y: -4 }}
                  className="bg-white rounded-2xl p-7 shadow-sm hover:shadow-md transition-all border border-gray-200 hover:border-green-300 group">
                  <span className="text-5xl font-black text-gray-100 group-hover:text-green-100 transition mb-4 block">{value.num}</span>
                  <h3 className="text-xl font-bold text-gray-900 mb-2 -mt-6">{value.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{value.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="py-24 bg-gradient-to-r from-green-600 to-emerald-700 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl md:text-5xl font-black mb-4">Join the Hustle</h2>
            <p className="text-xl mb-10 text-green-100 max-w-xl mx-auto">Experience premium nutrition designed for champions. Start your journey today.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/products">
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  className="bg-white text-green-700 px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition">
                  Shop Products
                </motion.button>
              </Link>
              <Link href="/contact">
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  className="border-2 border-white/50 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/10 transition">
                  Contact Us
                </motion.button>
              </Link>
            </div>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-6 text-green-100 text-sm">
              <span>📞 +91 95087 16607</span>
              <span className="hidden sm:block">•</span>
              <span>📧 info@nvanutrition.in</span>
            </div>
          </motion.div>
        </section>
      </div>
      <Footer />
    </main>
  );
}
