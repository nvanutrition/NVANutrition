'use client';

import { motion } from 'framer-motion';
import { Mail, CheckCircle2, Send, Bell, Gift, ShieldCheck } from 'lucide-react';
import { useState } from 'react';

const perks = [
  { icon: Gift, text: 'Exclusive VIP offers & discounts', color: 'text-green-600', bg: 'bg-green-100' },
  { icon: Bell, text: 'First to know about new products', color: 'text-blue-600', bg: 'bg-blue-100' },
  { icon: ShieldCheck, text: 'Zero spam, unsubscribe anytime', color: 'text-purple-600', bg: 'bg-purple-100' },
];

export function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsSubmitted(true);
      setTimeout(() => { setIsSubmitted(false); setEmail(''); }, 4000);
    }
  };

  return (
    <section className="relative py-24 overflow-hidden bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative bg-gradient-to-br from-green-600 via-emerald-700 to-green-900 rounded-3xl p-10 md:p-16 overflow-hidden shadow-[0_20px_60px_rgba(0,200,83,0.25)]"
        >
          {/* Dot grid bg */}
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '28px 28px' }} />
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/5 rounded-full" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-white/5 rounded-full" />

          <div className="relative z-10 text-center">
            {/* Icon */}
            <div className="flex justify-center mb-7">
              <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
                <Mail className="w-7 h-7 text-white" />
              </div>
            </div>

            <h2 className="text-3xl md:text-5xl font-black text-white mb-3 leading-tight tracking-tight">
              Unlock The Vault
            </h2>
            <p className="text-green-100 text-base md:text-lg mb-8 max-w-xl mx-auto font-medium">
              Get VIP access to unreleased flavors, private flash sales, and elite performance protocols straight to your inbox.
            </p>

            {/* Perks row */}
            <div className="flex flex-wrap justify-center gap-3 mb-10">
              {perks.map(({ icon: Icon, text, color, bg }) => (
                <div key={text} className="flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-4 py-2 backdrop-blur-sm">
                  <div className={`w-6 h-6 rounded-full ${bg} flex items-center justify-center`}>
                    <Icon size={12} className={color} />
                  </div>
                  <span className="text-white text-xs font-bold tracking-wider uppercase">{text}</span>
                </div>
              ))}
            </div>

            {isSubmitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/10 border border-white/20 p-8 rounded-2xl inline-flex flex-col items-center gap-3 backdrop-blur-md"
              >
                <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                  <CheckCircle2 className="w-7 h-7 text-green-600" />
                </div>
                <div>
                  <p className="text-white font-black text-xl uppercase tracking-widest">Access Granted</p>
                  <p className="text-green-200 text-sm mt-1 font-medium">Welcome to the Elite Roster 🏆</p>
                </div>
              </motion.div>

            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 px-5 py-4 rounded-xl bg-white/10 border border-white/20 hover:border-white/40 focus:border-white text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/20 transition font-medium text-sm"
                  required
                  aria-label="Email address"
                />
                <motion.button
                  whileHover={{ scale: 1.03, boxShadow: '0 10px 30px rgba(255,255,255,0.2)' }}
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  className="bg-white hover:bg-gray-50 text-green-700 font-black px-8 py-4 rounded-xl transition flex items-center justify-center gap-2 text-sm shadow-lg whitespace-nowrap"
                >
                  Subscribe <Send size={15} />
                </motion.button>
              </form>
            )}

            <p className="text-green-200/70 text-xs mt-5">
              🔒 SSL encrypted · Unsubscribe with 1 click · No spam, ever.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
