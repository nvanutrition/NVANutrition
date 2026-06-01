'use client';

import { motion } from 'framer-motion';
import { Mail, CheckCircle2, Send } from 'lucide-react';
import { useState } from 'react';

export function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsSubmitted(true);
      setTimeout(() => {
        setIsSubmitted(false);
        setEmail('');
      }, 4000);
    }
  };

  return (
    <section className="relative py-24 overflow-hidden bg-nv-dark border-b border-white/5">
      {/* Background Orbs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] rounded-full bg-green-500/5 blur-[120px] pointer-events-none" />

      {/* Decorative Dots */}
      <div className="absolute right-12 bottom-12 w-24 h-24 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
          backgroundSize: '12px 12px',
        }}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Glow Glass card container */}
        <div className="relative bg-gradient-to-br from-white/5 to-white/[0.01] border border-white/10 rounded-3xl p-10 md:p-16 backdrop-blur-md shadow-2xl text-center">
          
          {/* Top Envelope Icon */}
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-600/5 border border-green-500/20 flex items-center justify-center shadow-lg shadow-green-500/5">
              <Mail className="w-6 h-6 text-green-400 animate-pulse" />
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-4 uppercase">
              Join the Inner Circle
            </h2>
            <p className="text-gray-400 text-base md:text-lg mb-10 max-w-xl mx-auto font-light leading-relaxed">
              Get exclusive VIP offers, product drop notifications, and premium athletic guidance straight to your inbox. No spam.
            </p>

            {isSubmitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-green-500/10 border border-green-500/25 p-8 rounded-2xl inline-flex flex-col items-center gap-3"
              >
                <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-black">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-white font-bold text-lg">Subscription Verified!</p>
                  <p className="text-xs text-green-400 mt-1 font-mono tracking-widest uppercase">Welcome To NVA Nutrition</p>
                </div>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
                <input
                  type="email"
                  placeholder="Enter your athletic email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 px-6 py-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 focus:border-green-500 text-white placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-green-500/10 transition duration-300 font-semibold"
                  required
                  aria-label="Email address"
                />
                
                <motion.button
                  whileHover={{ scale: 1.03, boxShadow: '0 10px 30px rgba(0,200,83,0.3)' }}
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-black font-bold px-8 py-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <span>Subscribe</span>
                  <Send size={16} />
                </motion.button>
              </form>
            )}
            
            {/* Small Footer Assurance */}
            <p className="text-gray-600 text-xs mt-6 tracking-wide">
              🔒 Safe & secure encryption. Unsubscribe anytime in 1-click.
            </p>

          </motion.div>
        </div>

      </div>
    </section>
  );
}
