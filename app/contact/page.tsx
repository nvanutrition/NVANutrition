'use client';

import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Clock, Send, MessageCircle, Instagram, Facebook, Youtube, Linkedin, Twitter } from 'lucide-react';
import { useState } from 'react';

interface ContactForm {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

const contactCards = [
  { icon: Phone, title: 'Phone', lines: ['+91 9876543210', '+91 8765432109'], color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  { icon: Mail, title: 'Email', lines: ['info@nvanutrition.in', 'support@nvanutrition.in'], color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
  { icon: MapPin, title: 'Location', lines: ['Mumbai, Maharashtra', 'India'], color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
  { icon: Clock, title: 'Hours', lines: ['Mon - Fri: 9AM - 6PM', 'Sat - Sun: 10AM - 4PM'], color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
];

const socials = [
  { name: 'Instagram', handle: '@nva_nutrition', url: 'https://instagram.com/nva_nutrition', color: 'from-pink-500 to-rose-600' },
  { name: 'Facebook', handle: 'NVA Nutrition', url: '#', color: 'from-blue-500 to-blue-700' },
  { name: 'YouTube', handle: 'NVA Nutrition Channel', url: '#', color: 'from-red-500 to-red-700' },
  { name: 'LinkedIn', handle: 'NVA Nutrition', url: '#', color: 'from-sky-500 to-blue-700' },
  { name: 'Twitter/X', handle: '@NVANutrition', url: '#', color: 'from-gray-700 to-gray-900' },
];

export default function ContactPage() {
  const [formData, setFormData] = useState<ContactForm>({ name: '', email: '', phone: '', subject: '', message: '' });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        setIsSubmitted(true);
        setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
        setTimeout(() => setIsSubmitted(false), 5000);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Error sending message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-3.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/10 outline-none transition text-sm";
  const labelClass = "block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider";

  return (
    <main>
      <Navbar />
      <div className="pt-16 bg-white">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-green-600 via-emerald-700 to-green-900 text-white py-24">
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
          <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-5 py-2 mb-6">
              <MessageCircle size={14} className="text-green-300" />
              <span className="text-green-200 text-sm font-semibold">WE'D LOVE TO HEAR FROM YOU</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black mb-6 leading-tight">Get in Touch</h1>
            <p className="text-xl text-green-100 max-w-2xl mx-auto">Our team is here to help. Reach out and let&apos;s talk about your fitness goals.</p>
          </motion.div>
        </section>

        {/* Contact Cards */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {contactCards.map((card, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  className={`bg-white rounded-2xl p-6 border ${card.border} shadow-sm hover:shadow-md transition-all text-center`}>
                  <div className={`w-12 h-12 ${card.bg} rounded-xl flex items-center justify-center mx-auto mb-4`}>
                    <card.icon size={22} className={card.color} />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-3">{card.title}</h3>
                  {card.lines.map((line, j) => <p key={j} className="text-gray-600 text-sm">{line}</p>)}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Form + Socials */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
              {/* Contact Form */}
              <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
                <div className="mb-8">
                  <h2 className="text-4xl font-black text-gray-900 mb-3">Send us a Message</h2>
                  <p className="text-gray-500">Fill out the form and we&apos;ll get back to you within 24 hours.</p>
                </div>

                {isSubmitted ? (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="bg-green-50 border-2 border-green-200 rounded-2xl p-8 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Send size={24} className="text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Message Sent!</h3>
                    <p className="text-gray-600">Thank you for reaching out. We&apos;ll get back to you as soon as possible.</p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className={labelClass}>Name *</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="John Doe" className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Phone</label>
                        <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="+91 98765 43210" className={inputClass} />
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Email *</label>
                      <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="you@example.com" className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Subject *</label>
                      <input type="text" name="subject" value={formData.subject} onChange={handleChange} required placeholder="How can we help?" className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Message *</label>
                      <textarea name="message" value={formData.message} onChange={handleChange} required rows={5} placeholder="Tell us more about your inquiry..."
                        className={`${inputClass} resize-none`} />
                    </div>
                    <motion.button type="submit" disabled={isLoading} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-4 rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(0,200,83,0.25)] hover:shadow-[0_12px_30px_rgba(0,200,83,0.35)] disabled:opacity-50">
                      <Send size={18} />
                      {isLoading ? 'Sending...' : 'Send Message'}
                    </motion.button>
                  </form>
                )}
              </motion.div>

              {/* Social Media + WhatsApp */}
              <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
                <div className="mb-8">
                  <h2 className="text-4xl font-black text-gray-900 mb-3">Follow Us</h2>
                  <p className="text-gray-500">Daily fitness tips, product updates, and transformation stories.</p>
                </div>

                <div className="space-y-3 mb-8">
                  {socials.map((social, i) => (
                    <motion.a key={i} href={social.url} target={social.url !== '#' ? "_blank" : undefined} rel={social.url !== '#' ? "noopener noreferrer" : undefined} whileHover={{ x: 4 }}
                      className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-xl hover:border-green-300 hover:bg-green-50 transition group">
                      <div>
                        <p className="font-bold text-gray-900 group-hover:text-green-700 transition">{social.name}</p>
                        <p className="text-gray-500 text-sm">{social.handle}</p>
                      </div>
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${social.color} flex items-center justify-center`}>
                        <span className="text-white text-xs font-black">{social.name[0]}</span>
                      </div>
                    </motion.a>
                  ))}
                </div>

                {/* WhatsApp Card */}
                <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
                      <MessageCircle size={20} className="text-white" />
                    </div>
                    <h3 className="font-black text-gray-900 text-lg">WhatsApp Support</h3>
                  </div>
                  <p className="text-gray-600 mb-4 text-sm">Connect with us via WhatsApp for quick support and queries. We typically respond within minutes!</p>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    className="w-full bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-bold transition shadow-[0_4px_12px_rgba(0,200,83,0.2)] hover:shadow-[0_8px_20px_rgba(0,200,83,0.3)]">
                    Chat on WhatsApp
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </main>
  );
}
