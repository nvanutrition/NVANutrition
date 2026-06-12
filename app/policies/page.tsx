'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Truck, RotateCcw } from 'lucide-react';

interface Policies {
 returnPolicy: string;
 shippingPolicy: string;
 termsAndConditions: string;
}

export default function PoliciesPage() {
 const [policies, setPolicies] = useState<Policies | null>(null);
 const [loading, setLoading] = useState(true);
 const [activeTab, setActiveTab] = useState<'return' | 'shipping' | 'terms'>('return');

 useEffect(() => {
 (async () => {
 try {
 const snap = await getDoc(doc(db, 'config', 'policies'));
 if (snap.exists()) {
 setPolicies(snap.data() as Policies);
 }
 } catch (e) {
 console.error('Failed to load policies:', e);
 } finally {
 setLoading(false);
 }
 })();
 }, []);

 const tabs = [
 { id: 'return' as const, label: 'Return Policy', icon: RotateCcw, text: policies?.returnPolicy || 'No policy specified.' },
 { id: 'shipping' as const, label: 'Shipping & Delivery', icon: Truck, text: policies?.shippingPolicy || 'No policy specified.' },
 { id: 'terms' as const, label: 'Terms & Conditions', icon: ShieldCheck, text: policies?.termsAndConditions || 'No policy specified.' },
 ];

 const activeContent = tabs.find(t => t.id === activeTab);

 return (
 <main className="min-h-screen bg-gradient-dark text-foreground flex flex-col">
 <Navbar />

 <div className="flex-grow pt-32 pb-24 max-w-5xl mx-auto px-4 w-full">
 {/* Header */}
 <div className="text-center mb-12">
 <h1 className="text-5xl font-black tracking-tight mb-4">
 Store <span className="text-green-500">Policies</span>
 </h1>
 <p className="text-muted-foreground">Read our shipping, return terms, and store usage policies.</p>
 </div>

 {loading ? (
 <div className="flex justify-center items-center py-24">
 <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-500" />
 </div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
 {/* Sidebar Tabs */}
 <div className="md:col-span-1 flex flex-row md:flex-col gap-2 overflow-x-auto pb-4 md:pb-0">
 {tabs.map(tab => {
 const Icon = tab.icon;
 const isActive = activeTab === tab.id;
 return (
 <button
 key={tab.id}
 onClick={() => setActiveTab(tab.id)}
 className={`flex items-center gap-3 px-5 py-4 rounded-xl font-bold text-sm transition whitespace-nowrap cursor-pointer ${
 isActive
 ? 'bg-green-500 text-black shadow-lg shadow-green-500/20'
 : 'bg-muted border border-border text-muted-foreground hover:text-foreground hover:bg-muted'
 }`}
 >
 <Icon size={18} />
 {tab.label}
 </button>
 );
 })}
 </div>

 {/* Policy Content Viewer */}
 <div className="md:col-span-3">
 <AnimatePresence mode="wait">
 <motion.div
 key={activeTab}
 initial={{ opacity: 0, y: 15 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -15 }}
 transition={{ duration: 0.25 }}
 className="glass p-8 md:p-10 rounded-3xl border border-border shadow-2xl bg-muted/30/60 backdrop-blur-md"
 >
 <h2 className="text-2xl font-extrabold text-foreground mb-6 flex items-center gap-3 pb-4 border-b border-border">
 {activeContent && <activeContent.icon className="text-green-500" />}
 {activeContent?.label}
 </h2>
 <div className="text-muted-foreground leading-relaxed whitespace-pre-wrap text-sm md:text-base font-medium space-y-4">
 {activeContent?.text}
 </div>
 </motion.div>
 </AnimatePresence>
 </div>
 </div>
 )}
 </div>

 <Footer />
 </main>
 );
}
