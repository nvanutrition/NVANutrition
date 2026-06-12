'use client';

import { useState, useEffect, useRef } from 'react';
import { db, storage } from '@/lib/firebase';
import {
 collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, serverTimestamp
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import toast from 'react-hot-toast';
import {
 Image as ImageIcon, Trash2, Eye, EyeOff, Link as LinkIcon,
 Upload, Loader2, LayoutDashboard, Palette, Type,
 ChevronUp, ChevronDown, Save, RefreshCw, Zap
} from 'lucide-react';

interface Banner {
 id: string;
 imageUrl: string;
 storagePath?: string;
 title?: string;
 linkUrl?: string;
 order: number;
 active: boolean;
 createdAt?: any;
}

const TABS = [
 { id: 'banners', label: 'Hero Banners', icon: ImageIcon },
 { id: 'offers-strip', label: 'Live Offer Banners', icon: Zap },
];

// ─── Banner Card ───────────────────────────────────────────────────────────────
function BannerCard({ banner, onToggle, onDelete, onMoveUp, onMoveDown, onChange, isFirst, isLast }:
 { banner: Banner; onToggle: () => void; onDelete: () => void; onMoveUp: () => void; onMoveDown: () => void; onChange: (field: string, value: string) => void; isFirst: boolean; isLast: boolean }) {
 return (
 <motion.div
 layout
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.97 }}
 className={`bg-gray-50/60 border rounded-2xl overflow-hidden ${banner.active ? 'border-green-500/30' : 'border-gray-200/50'}`}
 >
 <div className="flex flex-col md:flex-row">
 {/* Image preview */}
 <div className="relative w-full md:w-44 h-44 bg-white flex-shrink-0">
 {banner.imageUrl ? (
 <Image src={banner.imageUrl} alt={banner.title || 'Banner'} fill className="object-cover" />
 ) : (
 <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-600">
 <ImageIcon size={28} />
 <p className="text-xs">No image</p>
 </div>
 )}
 <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${banner.active ? 'bg-green-500 text-black' : 'bg-gray-200 text-gray-500'}`}>
 {banner.active ? 'Live' : 'Hidden'}
 </div>
 </div>

 {/* Information */}
 <div className="flex-1 p-5 flex flex-col justify-center">
 <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 space-y-2 mb-3">
 <h4 className="text-sm font-bold text-blue-800 flex items-center gap-1.5">
 <ImageIcon size={14} /> Image Requirements
 </h4>
 <p className="text-xs text-blue-600 leading-relaxed">
 For a perfect fit without cutting off, upload a <strong>Square Image (1:1 ratio)</strong>.
 Recommended size: 1080x1080px or higher.
 </p>
 </div>

 {/* Actions */}
 <div className="flex flex-wrap items-center gap-2 pt-1">
 <button onClick={onToggle}
 className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
 banner.active
 ? 'border-green-500/40 bg-green-500/10 text-green-400 hover:bg-green-500/20'
 : 'border-gray-600 bg-gray-200 text-gray-500 hover:bg-gray-200'
 }`}>
 {banner.active ? <Eye size={13} /> : <EyeOff size={13} />}
 {banner.active ? 'Hide' : 'Show'}
 </button>
 <button onClick={onMoveUp} disabled={isFirst}
 className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-900 hover:border-gray-500 disabled:opacity-30 transition cursor-pointer">
 <ChevronUp size={14} />
 </button>
 <button onClick={onMoveDown} disabled={isLast}
 className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-900 hover:border-gray-500 disabled:opacity-30 transition cursor-pointer">
 <ChevronDown size={14} />
 </button>
 <button onClick={onDelete}
 className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition cursor-pointer ml-auto">
 <Trash2 size={13} /> Delete
 </button>
 </div>
 </div>
 </div>
 </motion.div>
 );
}

// ─── Upload Zone ───────────────────────────────────────────────────────────────
function UploadZone({ onUploaded }: { onUploaded: (url: string, path: string, file: File) => void }) {
 const inputRef = useRef<HTMLInputElement>(null);
 const [progress, setProgress] = useState<number | null>(null);
 const [dragging, setDragging] = useState(false);

 const upload = (file: File) => {
 if (!file.type.startsWith('image/')) { toast.error('Only images allowed'); return; }
 const path = `banners/${Date.now()}_${file.name}`;
 const storageRef = ref(storage, path);
 const task = uploadBytesResumable(storageRef, file);
 task.on('state_changed',
 snap => setProgress(Math.round(snap.bytesTransferred / snap.totalBytes * 100)),
 () => { toast.error('Upload failed'); setProgress(null); },
 async () => {
 const url = await getDownloadURL(task.snapshot.ref);
 onUploaded(url, path, file);
 setProgress(null);
 toast.success('Banner image uploaded!');
 }
 );
 };

 const handleDrop = (e: React.DragEvent) => {
 e.preventDefault(); setDragging(false);
 const file = e.dataTransfer.files?.[0];
 if (file) upload(file);
 };

 return (
 <div
 onDragOver={e => { e.preventDefault(); setDragging(true); }}
 onDragLeave={() => setDragging(false)}
 onDrop={handleDrop}
 onClick={() => inputRef.current?.click()}
 className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition ${
 dragging ? 'border-green-500 bg-green-500/5' : 'border-gray-200 hover:border-gray-500 bg-gray-50/30'
 }`}
 >
 <input ref={inputRef} type="file" accept="image/*" className="hidden"
 onChange={e => { const f = e.target.files?.[0]; if (f) upload(f); }} />
 {progress !== null ? (
 <div className="space-y-3">
 <Loader2 size={32} className="mx-auto text-green-400 animate-spin" />
 <div className="w-full bg-gray-200 rounded-full h-2">
 <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
 </div>
 <p className="text-green-400 font-bold text-sm">{progress}% uploaded</p>
 </div>
 ) : (
 <>
 <Upload size={32} className="mx-auto text-gray-500 mb-3" />
 <p className="text-gray-500 font-semibold text-sm mb-1">Drop an image here or click to browse</p>
 <p className="text-gray-600 text-xs">PNG, JPG, WebP — square (1:1) recommended</p>
 </>
 )}
 </div>
 );
}

interface LiveOffer {
 id: string;
 name: string;
 status: 'live' | 'draft';
 offerType: string;
 rewardValue?: number;
 minCartValue?: number;
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function HomepageSettingsPage() {
 const [activeTab, setActiveTab] = useState('banners');
 
 const [banners, setBanners] = useState<Banner[]>([]);
 const [liveOfferBanners, setLiveOfferBanners] = useState<Banner[]>([]);
 const [liveOffers, setLiveOffers] = useState<LiveOffer[]>([]);
 const [loading, setLoading] = useState(true);
 const [offersLoading, setOffersLoading] = useState(true);
 const [pillsLoading, setPillsLoading] = useState(true);
 const [saving, setSaving] = useState<string | null>(null);

 const fetchBanners = async () => {
 try {
 const q = query(collection(db, 'banners'), orderBy('order', 'asc'));
 const snap = await getDocs(q);
 setBanners(snap.docs.map(d => ({ id: d.id, ...d.data() } as Banner)));
 } catch {
 toast.error('Failed to load banners');
 } finally { setLoading(false); }
 };

 const fetchLiveOfferBanners = async () => {
 setOffersLoading(true);
 try {
 const q = query(collection(db, 'live_offer_banners'), orderBy('order', 'asc'));
 const snap = await getDocs(q);
 setLiveOfferBanners(snap.docs.map(d => ({ id: d.id, ...d.data() } as Banner)));
 } catch { toast.error('Failed to load live offer banners'); }
 finally { setOffersLoading(false); }
 };

 const fetchLiveOffers = async () => {
 setPillsLoading(true);
 try {
 const snap = await getDocs(collection(db, 'offers'));
 setLiveOffers(snap.docs.map(d => ({ id: d.id, ...d.data() } as LiveOffer)));
 } catch { /* silent */ }
 finally { setPillsLoading(false); }
 };

 useEffect(() => {
 fetchBanners();
 fetchLiveOfferBanners();
 fetchLiveOffers();
 }, []);

 const handleToggle = async (id: string, isLiveOffer = false) => {
 const list = isLiveOffer ? liveOfferBanners : banners;
 const b = list.find(x => x.id === id)!;
 const collectionName = isLiveOffer ? 'live_offer_banners' : 'banners';
 await updateDoc(doc(db, collectionName, id), { active: !b.active });
 if (isLiveOffer) setLiveOfferBanners(prev => prev.map(x => x.id === id ? { ...x, active: !x.active } : x));
 else setBanners(prev => prev.map(x => x.id === id ? { ...x, active: !x.active } : x));
 toast.success(`Banner ${!b.active ? 'shown' : 'hidden'}`);
 };

 const handleDelete = async (id: string, isLiveOffer = false) => {
 const list = isLiveOffer ? liveOfferBanners : banners;
 const b = list.find(x => x.id === id)!;
 const collectionName = isLiveOffer ? 'live_offer_banners' : 'banners';
 try {
 if (b.storagePath) await deleteObject(ref(storage, b.storagePath)).catch(() => {});
 await deleteDoc(doc(db, collectionName, id));
 if (isLiveOffer) setLiveOfferBanners(prev => prev.filter(x => x.id !== id));
 else setBanners(prev => prev.filter(x => x.id !== id));
 toast.success('Banner deleted');
 } catch { toast.error('Failed to delete'); }
 };

 const swapOrder = async (idx1: number, idx2: number, isLiveOffer = false) => {
 const list = isLiveOffer ? liveOfferBanners : banners;
 const collectionName = isLiveOffer ? 'live_offer_banners' : 'banners';
 const newArr = [...list];
 [newArr[idx1].order, newArr[idx2].order] = [newArr[idx2].order, newArr[idx1].order];
 [newArr[idx1], newArr[idx2]] = [newArr[idx2], newArr[idx1]];
 if (isLiveOffer) setLiveOfferBanners(newArr);
 else setBanners(newArr);
 await Promise.all([
 updateDoc(doc(db, collectionName, newArr[idx1].id), { order: newArr[idx1].order }),
 updateDoc(doc(db, collectionName, newArr[idx2].id), { order: newArr[idx2].order })
 ]);
 };

 const handleMoveUp = (idx: number, isLiveOffer = false) => { if (idx > 0) swapOrder(idx, idx - 1, isLiveOffer); };
 const handleMoveDown = (idx: number, isLiveOffer = false) => {
 const list = isLiveOffer ? liveOfferBanners : banners;
 if (idx < list.length - 1) swapOrder(idx, idx + 1, isLiveOffer);
 };

 const handleUploaded = async (url: string, path: string, isLiveOffer = false) => {
 const coll = isLiveOffer ? 'live_offer_banners' : 'banners';
 const stateSetter = isLiveOffer ? setLiveOfferBanners : setBanners;
 const list = isLiveOffer ? liveOfferBanners : banners;
 try {
 const newBanner = { imageUrl: url, storagePath: path, title: '', linkUrl: '', order: list.length, active: true, createdAt: serverTimestamp() };
 const docRef = await addDoc(collection(db, coll), newBanner);
 stateSetter(prev => [...prev, { ...newBanner, id: docRef.id }]);
 toast.success('Banner added!');
 } catch { toast.error('Failed to save banner'); }
 };

 return (
 <div className="max-w-5xl mx-auto px-6 py-10">
 <div className="bg-white/40 backdrop-blur-3xl border border-border rounded-[2rem] shadow-2xl overflow-hidden p-6 md:p-10">
 <div className="max-w-4xl mx-auto">
 {/* Header */}
 <div className="mb-8">
 <div className="flex items-center gap-3 mb-2">
 <div className="w-9 h-9 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center justify-center">
 <LayoutDashboard size={18} className="text-green-400" />
 </div>
 <div>
 <h1 className="text-2xl font-black text-gray-900">Homepage Settings</h1>
 <p className="text-gray-500 text-sm">Control banners and live offer strip images</p>
 </div>
 </div>
 </div>

 {/* Tab strip */}
 <div className="flex gap-1 p-1.5 bg-white/60 border border-white/8 rounded-2xl mb-8 overflow-x-auto">
 {TABS.map(tab => {
 const Icon = tab.icon;
 return (
 <button key={tab.id} onClick={() => setActiveTab(tab.id)}
 className={`flex-1 min-w-max flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition cursor-pointer whitespace-nowrap ${
 activeTab === tab.id
 ? 'bg-green-500/15 text-green-400 border border-green-500/25'
 : 'text-gray-500 hover:text-gray-800 hover:bg-white/3'
 }`}>
 <Icon size={14} /> {tab.label}
 </button>
 );
 })}
 </div>

 {/* ──────── BANNERS TAB ──────── */}
 {activeTab === 'banners' && (
 <div className="space-y-6">
 <div className="bg-green-500/5 border border-green-500/15 rounded-2xl p-4 text-sm text-green-400/80">
 ℹ️ Banners appear in the hero section as a <strong>1:1 (square)</strong> auto-scrolling carousel. Upload square images for best results.
 </div>

 {/* Upload zone */}
 <div>
 <h2 className="text-sm font-black text-gray-800 uppercase tracking-wider mb-3">Add New Banner</h2>
 <UploadZone onUploaded={(url, path) => handleUploaded(url, path, false)} />
 </div>

 {/* Banner list */}
 <div>
 <div className="flex items-center justify-between mb-4">
 <h2 className="text-sm font-black text-gray-800 uppercase tracking-wider">
 Current Banners ({banners.length})
 </h2>
 <button onClick={fetchBanners} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 transition cursor-pointer">
 <RefreshCw size={12} /> Refresh
 </button>
 </div>

 {loading ? (
 <div className="flex justify-center py-12">
 <Loader2 size={28} className="text-green-400 animate-spin" />
 </div>
 ) : banners.length === 0 ? (
 <div className="text-center py-12 border border-dashed border-gray-200 rounded-2xl text-gray-600">
 <ImageIcon size={36} className="mx-auto mb-3" />
 <p className="font-semibold">No banners yet. Upload one above.</p>
 </div>
 ) : (
 <AnimatePresence>
 <div className="space-y-4">
 {banners.map((b, idx) => (
 <div key={b.id}>
 <BannerCard
 banner={b}
 isFirst={idx === 0}
 isLast={idx === banners.length - 1}
 onToggle={() => handleToggle(b.id, false)}
 onDelete={() => handleDelete(b.id, false)}
 onMoveUp={() => handleMoveUp(idx, false)}
 onMoveDown={() => handleMoveDown(idx, false)}
 onChange={() => {}}
 />
 </div>
 ))}
 </div>
 </AnimatePresence>
 )}
 </div>
 </div>
 )}

 {/* ──────── OFFERS STRIP TAB ──────── */}
 {activeTab === 'offers-strip' && (
 <div className="space-y-6">
  <div className="bg-green-500/5 border border-green-500/15 rounded-2xl p-4 text-sm text-green-400/80">
  ⚡ These banners appear in the Live Offers Strip at the bottom of the hero section. Upload <strong>Extra-wide Pill-shaped images (e.g., 1280x160px or ~8:1 ratio)</strong> for best results.
  </div>

 {/* Upload zone */}
 <div>
 <h2 className="text-sm font-black text-gray-800 uppercase tracking-wider mb-3">Add New Live Offer Banner</h2>
 <UploadZone onUploaded={(url, path) => handleUploaded(url, path, true)} />
 </div>

 {/* Banner list */}
 <div>
 <div className="flex items-center justify-between mb-4">
 <h2 className="text-sm font-black text-gray-800 uppercase tracking-wider">
 Current Live Offer Banners ({liveOfferBanners.length})
 </h2>
 <button onClick={fetchLiveOfferBanners} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 transition cursor-pointer">
 <RefreshCw size={12} /> Refresh
 </button>
 </div>

 {offersLoading ? (
 <div className="flex justify-center py-12">
 <Loader2 size={28} className="text-green-400 animate-spin" />
 </div>
 ) : liveOfferBanners.length === 0 ? (
 <div className="text-center py-12 border border-dashed border-gray-200 rounded-2xl text-gray-600">
 <ImageIcon size={36} className="mx-auto mb-3" />
 <p className="font-semibold">No live offer banners yet. Upload one above.</p>
 <p className="text-xs text-muted-foreground mt-1">Recommended ratio: Wide Rectangle (21:9)</p>
 </div>
 ) : (
 <AnimatePresence>
 <div className="space-y-4">
 {liveOfferBanners.map((b, idx) => (
 <div key={b.id}>
 <BannerCard
 banner={b}
 isFirst={idx === 0}
 isLast={idx === liveOfferBanners.length - 1}
 onToggle={() => handleToggle(b.id, true)}
 onDelete={() => handleDelete(b.id, true)}
 onMoveUp={() => handleMoveUp(idx, true)}
 onMoveDown={() => handleMoveDown(idx, true)}
 onChange={() => {}}
 />
 </div>
 ))}
 </div>
 </AnimatePresence>
 )}
 </div>

 {/* Running Offers (Pills) */}
 <div className="pt-8 border-t border-gray-200/60 mt-8">
 <div className="flex items-center justify-between mb-4">
 <h2 className="text-sm font-black text-gray-800 uppercase tracking-wider">
 Running Offers ({liveOffers.length})
 </h2>
 <button onClick={fetchLiveOffers} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 transition cursor-pointer">
 <RefreshCw size={12} /> Refresh
 </button>
 </div>

 {pillsLoading ? (
 <div className="flex justify-center py-8"><Loader2 size={24} className="text-green-400 animate-spin" /></div>
 ) : liveOffers.length === 0 ? (
 <div className="text-center py-8 border border-dashed border-gray-200 rounded-2xl text-gray-500">
 <p>No running offers found.</p>
 <p className="text-xs mt-1">Manage them in Admin → Offers</p>
 </div>
 ) : (
 <div className="space-y-3">
 {liveOffers.map(o => (
 <div key={o.id} className={`flex items-center justify-between p-4 rounded-xl border transition ${
 o.status === 'live' ? 'bg-green-500/5 border-green-500/20' : 'bg-gray-50/40 border-gray-200/50'
 }`}>
 <div className="flex items-center gap-3">
 <div className={`w-2 h-2 rounded-full flex-shrink-0 ${o.status === 'live' ? 'bg-green-400 shadow-lg shadow-green-400/40' : 'bg-gray-600'}`} />
 <div>
 <p className="text-gray-900 font-bold text-sm">{o.name}</p>
 <p className="text-gray-500 text-xs capitalize">{o.offerType?.replace(/_/g, ' ')} {o.rewardValue ? `· ${o.rewardValue}${o.offerType?.includes('percentage') || o.offerType?.includes('flash') ? '%' : '₹'} off` : ''}</p>
 </div>
 </div>
 <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
 o.status === 'live' ? 'bg-green-500/20 text-green-400' : 'bg-gray-200 text-gray-500'
 }`}>
 {o.status}
 </span>
 </div>
 ))}
 <p className="text-xs text-gray-600 text-center pt-2">Toggle live/draft status in Admin → Offers</p>
 </div>
 )}
 </div>
 </div>
 )}
 </div>
 </div>
 </div>
 );
}
