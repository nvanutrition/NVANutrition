'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
 Settings, Save, Phone, Mail, MapPin, Store,
 Bell, Shield, Globe, CheckCircle, Flame, Edit
} from 'lucide-react';

interface StoreSettings {
 storeName: string;
 storeEmail: string;
 storePhone: string;
 storeAddress: string;
 storeCity: string;
 storeState: string;
 storePincode: string;
 orderNotifications: boolean;
 stockAlerts: boolean;
 lowStockThreshold: number;
 storeOpen: boolean;
 gstNumber: string;
 currencySymbol: string;
}

const defaultSettings: StoreSettings = {
 storeName: 'NVA Nutrition',
 storeEmail: 'info@nvanutrition.in',
 storePhone: '+91 9876543210',
 storeAddress: 'Mumbai, Maharashtra',
 storeCity: 'Mumbai',
 storeState: 'Maharashtra',
 storePincode: '400001',
 orderNotifications: true,
 stockAlerts: true,
 lowStockThreshold: 10,
 storeOpen: true,
 gstNumber: '',
 currencySymbol: '₹',
};

export default function AdminSettings() {
 const [settings, setSettings] = useState<StoreSettings>(defaultSettings);
 const [marquee, setMarquee] = useState({
 message: '',
 isActive: false,
 speed: 60,
 bgColor: '#00C853',
 textColor: '#000000',
 });
 const [policies, setPolicies] = useState({
 returnPolicy: '',
 shippingPolicy: '',
 termsAndConditions: '',
 });

 const [loading, setLoading] = useState(true);
 const [saving, setSaving] = useState(false);
 const [saved, setSaved] = useState(false);

 useEffect(() => {
 (async () => {
 try {
 const docSnap = await getDoc(doc(db, 'config', 'storeSettings'));
 if (docSnap.exists()) {
 setSettings({ ...defaultSettings, ...docSnap.data() as StoreSettings });
 }

 const marqueeSnap = await getDoc(doc(db, 'config', 'marquee'));
 if (marqueeSnap.exists()) {
 setMarquee(prev => ({ ...prev, ...marqueeSnap.data() }));
 }

 const policiesSnap = await getDoc(doc(db, 'config', 'policies'));
 if (policiesSnap.exists()) {
 setPolicies(prev => ({ ...prev, ...policiesSnap.data() }));
 }
 } catch (e) {
 console.error('Error loading settings:', e);
 } finally {
 setLoading(false);
 }
 })();
 }, []);

 const handleSave = async () => {
 setSaving(true);
 try {
 await setDoc(doc(db, 'config', 'storeSettings'), {
 ...settings,
 updatedAt: new Date(),
 });
 await setDoc(doc(db, 'config', 'marquee'), marquee);
 await setDoc(doc(db, 'config', 'policies'), policies);

 toast.success('Settings saved successfully!');
 setSaved(true);
 setTimeout(() => setSaved(false), 3000);
 } catch (e) {
 toast.error('Failed to save settings');
 } finally {
 setSaving(false);
 }
 };

 const Field = ({ label, name, type = 'text', placeholder = '' }: { label: string; name: keyof StoreSettings; type?: string; placeholder?: string }) => (
 <div>
 <label className="block text-sm font-bold text-muted-foreground mb-2 uppercase tracking-wider">{label}</label>
 <input
 type={type}
 value={settings[name] as string | number}
 onChange={e => setSettings(prev => ({ ...prev, [name]: type === 'number' ? parseInt(e.target.value) || 0 : e.target.value }))}
 placeholder={placeholder}
 className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-foreground placeholder-gray-600 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition"
 />
 </div>
 );

 const Toggle = ({ label, name, description }: { label: string; name: keyof StoreSettings; description: string }) => (
 <div className="flex items-center justify-between p-4 bg-muted rounded-xl border border-border">
 <div>
 <p className="text-foreground font-semibold">{label}</p>
 <p className="text-gray-500 text-sm">{description}</p>
 </div>
 <button
 onClick={() => setSettings(prev => ({ ...prev, [name]: !prev[name] }))}
 className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${settings[name] ? 'bg-green-500' : 'bg-gray-700'}`}
 >
 <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${settings[name] ? 'translate-x-6' : 'translate-x-1'}`} />
 </button>
 </div>
 );

 if (loading) {
 return (
 <div className="flex items-center justify-center h-screen bg-gradient-dark">
 <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-500" />
 </div>
 );
 }

 return (
 <div className="p-8 bg-gradient-dark min-h-screen">
 {/* Header */}
 <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
 <div>
 <h1 className="text-4xl font-black text-foreground flex items-center gap-3">
 <Settings className="text-green-500" /> Store Settings
 </h1>
 <p className="text-muted-foreground mt-1">Configure your NVA Nutrition store preferences</p>
 </div>
 <button
 onClick={handleSave}
 disabled={saving}
 className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition cursor-pointer ${
 saved
 ? 'bg-green-500/20 text-green-400 border border-green-500/30'
 : 'bg-green-500 hover:bg-green-600 text-black shadow-lg shadow-green-500/20'
 } disabled:opacity-50`}
 >
 {saving ? (
 <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
 ) : saved ? (
 <CheckCircle size={18} />
 ) : (
 <Save size={18} />
 )}
 {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Settings'}
 </button>
 </motion.div>

 <div className="space-y-6 max-w-4xl">
 {/* Store Info */}
 <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-6 border border-border">
 <h2 className="text-lg font-bold text-foreground mb-5 flex items-center gap-2">
 <Store size={20} className="text-green-400" /> Store Information
 </h2>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <Field label="Store Name" name="storeName" placeholder="NVA Nutrition" />
 <Field label="Currency Symbol" name="currencySymbol" placeholder="₹" />
 <Field label="GST Number" name="gstNumber" placeholder="29XXXXX1234X1ZX" />
 </div>
 </motion.div>

 {/* Marquee announcement ticker settings */}
 <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-6 border border-border">
 <h2 className="text-lg font-bold text-foreground mb-5 flex items-center gap-2">
 <Flame size={20} className="text-green-400" /> Announcement Ticker
 </h2>
 <div className="space-y-4">
 <div className="flex items-center justify-between p-4 bg-muted rounded-xl border border-border">
 <div>
 <p className="text-foreground font-semibold">Enable Announcement Ticker</p>
 <p className="text-gray-500 text-sm">Toggle global top marquee ticker visibility</p>
 </div>
 <button
 onClick={() => setMarquee(prev => ({ ...prev, isActive: !prev.isActive }))}
 className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${marquee.isActive ? 'bg-green-500' : 'bg-gray-700'}`}
 >
 <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${marquee.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
 </button>
 </div>

 <div>
 <label className="block text-sm font-bold text-muted-foreground mb-2 uppercase tracking-wider">Ticker Message</label>
 <textarea
 value={marquee.message}
 onChange={e => setMarquee(prev => ({ ...prev, message: e.target.value }))}
 placeholder="🔥 FLASH SALE: 20% OFF ALL WHEY PROTEIN ISOLATE! USE CODE 'NVA20' 🔥"
 rows={2}
 className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-foreground placeholder-gray-600 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition"
 />
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <div>
 <label className="block text-sm font-bold text-muted-foreground mb-2 uppercase tracking-wider">Scroll Speed (px/s)</label>
 <input
 type="number"
 value={marquee.speed}
 onChange={e => setMarquee(prev => ({ ...prev, speed: parseInt(e.target.value) || 60 }))}
 className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-foreground focus:outline-none focus:border-green-500 transition"
 />
 </div>
 <div>
 <label className="block text-sm font-bold text-muted-foreground mb-2 uppercase tracking-wider">Background Color</label>
 <input
 type="color"
 value={marquee.bgColor}
 onChange={e => setMarquee(prev => ({ ...prev, bgColor: e.target.value }))}
 className="w-full h-[50px] bg-muted border border-border rounded-xl p-1 focus:outline-none cursor-pointer"
 />
 </div>
 <div>
 <label className="block text-sm font-bold text-muted-foreground mb-2 uppercase tracking-wider">Text Color</label>
 <input
 type="color"
 value={marquee.textColor}
 onChange={e => setMarquee(prev => ({ ...prev, textColor: e.target.value }))}
 className="w-full h-[50px] bg-muted border border-border rounded-xl p-1 focus:outline-none cursor-pointer"
 />
 </div>
 </div>
 </div>
 </motion.div>

 {/* Store Policies settings */}
 <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-6 border border-border">
 <h2 className="text-lg font-bold text-foreground mb-5 flex items-center gap-2">
 <Edit size={20} className="text-green-400" /> Store Policies & Legal Pages
 </h2>
 <div className="space-y-4">
 <div>
 <label className="block text-sm font-bold text-muted-foreground mb-2 uppercase tracking-wider">Return & Refund Policy</label>
 <textarea
 value={policies.returnPolicy}
 onChange={e => setPolicies(prev => ({ ...prev, returnPolicy: e.target.value }))}
 placeholder="Detail return, replacement, refund timelines and rules..."
 rows={4}
 className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-foreground placeholder-gray-600 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition"
 />
 </div>
 <div>
 <label className="block text-sm font-bold text-muted-foreground mb-2 uppercase tracking-wider">Shipping & Delivery Policy</label>
 <textarea
 value={policies.shippingPolicy}
 onChange={e => setPolicies(prev => ({ ...prev, shippingPolicy: e.target.value }))}
 placeholder="Detail shipping charges, delivery times, carrier partners..."
 rows={4}
 className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-foreground placeholder-gray-600 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition"
 />
 </div>
 <div>
 <label className="block text-sm font-bold text-muted-foreground mb-2 uppercase tracking-wider">Terms & Conditions</label>
 <textarea
 value={policies.termsAndConditions}
 onChange={e => setPolicies(prev => ({ ...prev, termsAndConditions: e.target.value }))}
 placeholder="Store user terms of service, liabilities, governing laws..."
 rows={4}
 className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-foreground placeholder-gray-600 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition"
 />
 </div>
 </div>
 </motion.div>

 {/* Contact Info */}
 <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-6 border border-border">
 <h2 className="text-lg font-bold text-foreground mb-5 flex items-center gap-2">
 <Phone size={20} className="text-blue-400" /> Contact Details
 </h2>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <Field label="Store Email" name="storeEmail" type="email" placeholder="info@nvanutrition.in" />
 <Field label="Store Phone" name="storePhone" placeholder="+91 9876543210" />
 </div>
 </motion.div>

 {/* Address */}
 <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-6 border border-border">
 <h2 className="text-lg font-bold text-foreground mb-5 flex items-center gap-2">
 <MapPin size={20} className="text-amber-400" /> Store Address
 </h2>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="md:col-span-2">
 <Field label="Street Address" name="storeAddress" placeholder="123 Nutrition Street" />
 </div>
 <Field label="City" name="storeCity" placeholder="Mumbai" />
 <Field label="State" name="storeState" placeholder="Maharashtra" />
 <Field label="Pincode" name="storePincode" placeholder="400001" />
 </div>
 </motion.div>

 {/* Notifications & Preferences */}
 <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-6 border border-border">
 <h2 className="text-lg font-bold text-foreground mb-5 flex items-center gap-2">
 <Bell size={20} className="text-purple-400" /> Notifications & Operations
 </h2>
 <div className="space-y-3">
 <Toggle label="Order Notifications" name="orderNotifications" description="Receive alerts when new orders are placed" />
 <Toggle label="Stock Alerts" name="stockAlerts" description="Receive alerts when products are running low" />
 <Toggle label="Store Open" name="storeOpen" description="Accept new orders from customers" />
 </div>
 <div className="mt-4">
 <label className="block text-sm font-bold text-muted-foreground mb-2 uppercase tracking-wider">Low Stock Threshold (units)</label>
 <input
 type="number"
 min={1}
 value={settings.lowStockThreshold}
 onChange={e => setSettings(prev => ({ ...prev, lowStockThreshold: parseInt(e.target.value) || 10 }))}
 className="w-32 px-4 py-3 bg-muted border border-border rounded-xl text-foreground focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition font-mono font-bold"
 />
 </div>
 </motion.div>
 </div>
 </div>
 );
}
