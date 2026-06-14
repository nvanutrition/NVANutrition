'use client';

import { motion } from 'framer-motion';
import { ShieldCheck, Search, Activity, FileText } from 'lucide-react';
import Image from 'next/image';

const VERIFICATION_STEPS = [
  {
    icon: Search,
    title: 'Scratch & Scan',
    description: 'Every product comes with a unique, scratch-off authentication code. Scan it to verify instantly.',
  },
  {
    icon: Activity,
    title: 'Lab Results',
    description: 'We publish heavy metal and protein-spiking test results for every batch we produce.',
  },
  {
    icon: FileText,
    title: 'FSSAI Certified',
    description: 'Manufactured in state-of-the-art facilities compliant with strict FSSAI regulations.',
  },
];

export function VerificationSection() {
  return (
    <section className="py-24 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Left - Content */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-full px-5 py-2 mb-6 shadow-sm">
              <ShieldCheck size={16} className="text-blue-600" />
              <span className="text-blue-700 font-black text-xs uppercase tracking-widest">100% Authentic</span>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 leading-tight tracking-tight">
              Don't Just Trust Us.<br />
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Verify It Yourself.
              </span>
            </h2>
            
            <p className="text-gray-500 text-lg mb-10 font-medium leading-relaxed">
              The supplement industry is filled with fake products and hidden proprietary blends. We believe in absolute transparency. Every tub of NVA Nutrition is verifiable, lab-tested, and guaranteed pure.
            </p>

            <div className="space-y-8">
              {VERIFICATION_STEPS.map((step, idx) => {
                const Icon = step.icon;
                return (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: idx * 0.15 }}
                    className="flex gap-5"
                  >
                    <div className="w-12 h-12 rounded-[1rem] bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <Icon size={24} className="text-blue-600" />
                    </div>
                    <div>
                      <h4 className="text-xl font-black text-gray-900 mb-2">{step.title}</h4>
                      <p className="text-gray-500 font-medium leading-relaxed">{step.description}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Right - Visuals */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative"
          >
            <div className="relative w-full aspect-square rounded-[3rem] bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.05)] flex items-center justify-center p-12">
              
              {/* Decorative elements */}
              <div className="absolute top-10 right-10 w-32 h-32 bg-blue-400/10 blur-[40px] rounded-full pointer-events-none" />
              <div className="absolute bottom-10 left-10 w-40 h-40 bg-indigo-400/10 blur-[40px] rounded-full pointer-events-none" />
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none" />

              {/* Main Graphic - Abstract Representation of a Lab Report / Phone Scan */}
              <div className="relative w-full h-full max-w-sm mx-auto">
                <div className="absolute inset-0 bg-white rounded-[2rem] shadow-2xl border border-gray-100 transform rotate-3 transition-transform hover:rotate-6 duration-500"></div>
                <div className="absolute inset-0 bg-white rounded-[2rem] shadow-xl border border-gray-100 p-8 flex flex-col z-10 transform -rotate-2 transition-transform hover:rotate-0 duration-500">
                  <div className="w-full h-48 bg-gray-50 rounded-xl border border-gray-100 mb-6 flex items-center justify-center relative overflow-hidden">
                    <ShieldCheck size={64} className="text-blue-500/20" />
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
                  </div>
                  
                  <div className="space-y-4 w-full">
                    <div className="h-4 bg-gray-100 rounded-md w-3/4"></div>
                    <div className="h-4 bg-gray-100 rounded-md w-1/2"></div>
                    <div className="h-4 bg-gray-100 rounded-md w-5/6"></div>
                  </div>

                  <div className="mt-auto pt-6 flex items-center justify-between border-t border-gray-50">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
                        <CheckCircleIcon />
                      </div>
                      <span className="text-sm font-black text-green-600 uppercase tracking-wider">Verified</span>
                    </div>
                    <div className="w-16 h-16 bg-gray-100 rounded-lg p-1 border border-gray-200">
                      <div className="w-full h-full bg-[url('https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/QR_code_for_mobile_English_Wikipedia.svg/1200px-QR_code_for_mobile_English_Wikipedia.svg.png')] bg-cover opacity-50" />
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function CheckCircleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
  );
}
