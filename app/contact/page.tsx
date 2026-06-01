'use client';

import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Clock, Send } from 'lucide-react';
import { useState } from 'react';

interface ContactForm {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

export default function ContactPage() {
  const [formData, setFormData] = useState<ContactForm>({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
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

  return (
    <main>
      <Navbar />
      <div className="bg-white pt-20">
        {/* Hero */}
        <section className="bg-gradient-to-br from-green-600 to-green-700 text-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center"
            >
              <h1 className="text-5xl md:text-6xl font-bold mb-6">Get in Touch</h1>
              <p className="text-xl opacity-90">We'd love to hear from you. Let's talk!</p>
            </motion.div>
          </div>
        </section>

        {/* Contact Info */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center p-6 bg-gray-50 rounded-xl"
              >
                <Phone className="w-10 h-10 text-green-600 mx-auto mb-4" />
                <h3 className="font-bold text-gray-900 mb-2">Phone</h3>
                <p className="text-gray-600">+91 9876543210</p>
                <p className="text-gray-600">+91 8765432109</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-center p-6 bg-gray-50 rounded-xl"
              >
                <Mail className="w-10 h-10 text-green-600 mx-auto mb-4" />
                <h3 className="font-bold text-gray-900 mb-2">Email</h3>
                <p className="text-gray-600">info@nvanutrition.in</p>
                <p className="text-gray-600">support@nvanutrition.in</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-center p-6 bg-gray-50 rounded-xl"
              >
                <MapPin className="w-10 h-10 text-green-600 mx-auto mb-4" />
                <h3 className="font-bold text-gray-900 mb-2">Location</h3>
                <p className="text-gray-600">Mumbai, Maharashtra</p>
                <p className="text-gray-600">India</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="text-center p-6 bg-gray-50 rounded-xl"
              >
                <Clock className="w-10 h-10 text-green-600 mx-auto mb-4" />
                <h3 className="font-bold text-gray-900 mb-2">Hours</h3>
                <p className="text-gray-600">Mon - Fri: 9AM - 6PM</p>
                <p className="text-gray-600">Sat - Sun: 10AM - 4PM</p>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Contact Form */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
              >
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Send us a Message</h2>

                {isSubmitted ? (
                  <div className="bg-green-100 border-2 border-green-600 text-green-700 p-6 rounded-lg">
                    <p className="font-bold">Thank you for your message!</p>
                    <p>We'll get back to you as soon as possible.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Name *</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Email *</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Phone</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Subject *</label>
                      <input
                        type="text"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Message *</label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        rows={5}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-3 rounded-lg font-bold transition flex items-center justify-center gap-2"
                    >
                      <Send className="w-5 h-5" />
                      {isLoading ? 'Sending...' : 'Send Message'}
                    </button>
                  </form>
                )}
              </motion.div>

              {/* Social Media */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
              >
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Follow Us</h2>
                <p className="text-gray-600 mb-8">
                  Connect with us on social media for daily fitness tips, product updates, and transformation stories.
                </p>

                <div className="space-y-4">
                  {[
                    { name: 'Instagram', handle: '@NVANutrition' },
                    { name: 'Facebook', handle: 'NVA Nutrition' },
                    { name: 'YouTube', handle: 'NVA Nutrition Channel' },
                    { name: 'LinkedIn', handle: 'NVA Nutrition' },
                    { name: 'Twitter', handle: '@NVANutrition' },
                  ].map((social, i) => (
                    <a
                      key={i}
                      href="#"
                      className="block p-4 bg-gray-50 rounded-lg hover:bg-green-50 transition"
                    >
                      <p className="font-bold text-gray-900">{social.name}</p>
                      <p className="text-gray-600 text-sm">{social.handle}</p>
                    </a>
                  ))}
                </div>

                <div className="mt-12 p-6 bg-green-50 rounded-xl border border-green-200">
                  <h3 className="font-bold text-gray-900 mb-2">WhatsApp Support</h3>
                  <p className="text-gray-600 mb-4">
                    Connect with us via WhatsApp for quick support and queries.
                  </p>
                  <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold transition">
                    Chat on WhatsApp
                  </button>
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
