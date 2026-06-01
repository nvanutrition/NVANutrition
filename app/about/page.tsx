'use client';

import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Eye, Heart, Zap, Shield, Users, Rocket, Award } from 'lucide-react';

export default function AboutPage() {
  return (
    <main>
      <Navbar />
      <div className="pt-20 bg-white">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-green-900 text-white py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-6">About NVA Nutrition</h1>
            <p className="text-2xl text-green-300 font-semibold mb-4">Built for Hustlers. Powered by Nutrition.</p>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Welcome to the future of strength, stamina, and performance. This is not just a supplement brand — it&apos;s a lifestyle.
            </p>
          </motion.div>
        </section>

        {/* Our Story */}
        <section className="py-20 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Story</h2>
                <div className="space-y-4 text-gray-700 text-lg leading-relaxed">
                  <p>
                    NVA Nutrition was founded by a corporate hustler who knows the real struggle. Balancing a demanding job, maintaining your health, and sticking to a proper diet? It&apos;s damn hard.
                  </p>
                  <p>
                    We started this brand because we believe premium nutrition shouldn&apos;t be a luxury. It should be accessible, affordable, and effective for everyone grinding it out daily.
                  </p>
                  <p className="text-lg font-semibold text-green-600">
                    This is not just a supplement brand — it&apos;s a lifestyle. A movement for everyone who hustles.
                  </p>
                  <p className="text-base text-gray-600">
                    Whether you&apos;re an athlete chasing greatness, a gym enthusiast building strength, a student chasing dreams, a senior citizen staying active, a serviceman serving with pride, or a corporate warrior like us — if you hustle, this brand is for you.
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative h-96"
              >
                <Image
                  src="/gym-hero.png"
                  alt="Our Story"
                  fill
                  className="object-cover rounded-lg shadow-lg"
                />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Who We Serve */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Who We Serve</h2>
              <p className="text-xl text-gray-600 font-semibold">No matter who you are — if you hustle, this brand is for you.</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { icon: Zap, title: 'Athletes', desc: 'Chasing greatness and peak performance' },
                { icon: Heart, title: 'Gym Enthusiasts', desc: 'Building strength and sculpting their physique' },
                { icon: Rocket, title: 'School & College Youth', desc: 'Chasing dreams while staying fit' },
                { icon: Users, title: 'Senior Citizens', desc: 'Staying active and healthy' },
                { icon: Shield, title: 'Servicemen', desc: 'Serving with pride and maintaining peak condition' },
                { icon: Award, title: 'Corporate Warriors', desc: 'Balancing hustle, health, and diet' },
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white rounded-lg p-8 shadow-md hover:shadow-lg transition border-l-4 border-green-600"
                >
                  <item.icon size={40} className="mb-4 text-green-600" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="py-20 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-green-50 to-green-100 p-8 rounded-lg border-l-4 border-green-600"
              >
                <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Rocket className="text-green-600" />
                  Our Mission
                </h3>
                <p className="text-gray-700 text-lg leading-relaxed">
                  To empower hustlers everywhere by providing premium, scientifically-formulated nutrition products that support their fitness goals, health aspirations, and lifestyle demands — affordable, effective, and trusted by everyone grinding it out.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-lg border-l-4 border-blue-600"
              >
                <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Eye className="text-blue-600" />
                  Our Vision
                </h3>
                <p className="text-gray-700 text-lg leading-relaxed">
                  To become India&apos;s most trusted premium nutrition brand for hustlers. A brand that understands the struggle, respects the grind, and delivers results that matter. Building stronger bodies, sharper minds, and a healthier nation.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Core Values</h2>
              <p className="text-gray-600">The principles that drive everything we do</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { title: 'Integrity', desc: 'Honest products, honest prices, honest results' },
                { title: 'Transparency', desc: 'Every ingredient listed, every claim backed by science' },
                { title: 'Quality', desc: 'Lab tested, GMP certified, premium standards always' },
                { title: 'Performance', desc: 'Products designed for real, measurable results' },
                { title: 'Customer First', desc: 'Your satisfaction and trust is our success' },
                { title: 'Innovation', desc: 'Constantly evolving to serve you better' },
              ].map((value, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="border-2 border-green-600 rounded-lg p-6 text-center hover:bg-green-50 transition"
                >
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{value.title}</h3>
                  <p className="text-gray-600">{value.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact CTA */}
        <section className="py-20 bg-gradient-to-r from-green-600 to-green-700 text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
          >
            <h2 className="text-4xl font-bold mb-4">Join the Hustle</h2>
            <p className="text-xl mb-8 opacity-90">
              Experience premium nutrition designed for champions. Get in touch with us today.
            </p>
            <div className="text-lg space-y-3">
              <p>📞 Call us: <span className="font-bold text-2xl">+91 95087 16607</span></p>
              <p>📧 Email: info@nvanutrition.in</p>
              <p className="text-sm opacity-75">Official Channel for NVA Nutrition</p>
            </div>
          </motion.div>
        </section>
      </div>
      <Footer />
    </main>
  );
}

