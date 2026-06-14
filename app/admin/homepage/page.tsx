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
      className={`bg-white border rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition hover:shadow-lg ${banner.active ? 'border-green-100' : 'border-gray-100'}`}
    >
      <div className="flex flex-col md:flex-row">
        {/* Image preview */}
        <div className="relative w-full md:w-56 h-56 bg-gray-50 flex-shrink-0 border-b md:border-b-0 md:border-r border-gray-100">
          {banner.imageUrl ? (
            <Image src={banner.imageUrl} alt={banner.title || 'Banner'} fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-400">
              <ImageIcon size={28} />
              <p className="text-xs font-bold uppercase tracking-wider">No image</p>
            </div>
          )}
          <div className={`absolute top-3 left-3 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider shadow-sm ${banner.active ? 'bg-green-500 text-white' : 'bg-white text-gray-500 border border-gray-200'}`}>
            {banner.active ? 'Live' : 'Hidden'}
          </div>
        </div>

        {/* Information */}
        <div className="flex-1 p-6 flex flex-col justify-center">
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 space-y-2 mb-5">
            <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider flex items-center gap-1.5">
              <ImageIcon size={14} /> Image Requirements
            </h4>
            <p className="text-sm text-blue-600/80 font-medium leading-relaxed">
              For a perfect fit without cutting off, upload a <strong>Square Image (1:1 ratio)</strong>.
              Recommended size: 1080x1080px or higher.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2 mt-auto">
            <button onClick={onToggle}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold border transition shadow-sm ${
                banner.active
                  ? 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                  : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
              }`}>
              {banner.active ? <Eye size={14} /> : <EyeOff size={14} />}
              {banner.active ? 'Hide Banner' : 'Show Banner'}
            </button>
            <div className="flex gap-1 ml-2">
              <button onClick={onMoveUp} disabled={isFirst}
                className="p-2.5 rounded-xl bg-white border border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-50 disabled:opacity-30 transition shadow-sm">
                <ChevronUp size={14} />
              </button>
              <button onClick={onMoveDown} disabled={isLast}
                className="p-2.5 rounded-xl bg-white border border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-50 disabled:opacity-30 transition shadow-sm">
                <ChevronDown size={14} />
              </button>
            </div>
            <button onClick={onDelete}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition shadow-sm ml-auto">
              <Trash2 size={14} /> Delete
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
      className={`relative border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition ${
        dragging ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-300 bg-white'
      }`}
    >
      <input ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) upload(f); }} />
      {progress !== null ? (
        <div className="space-y-4 max-w-xs mx-auto">
          <Loader2 size={36} className="mx-auto text-black animate-spin" />
          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <div className="bg-black h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-gray-900 font-bold text-sm">{progress}% uploaded</p>
        </div>
      ) : (
        <>
          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gray-100">
            <Upload size={24} className="text-gray-400" />
          </div>
          <p className="text-gray-900 font-bold text-base mb-1">Click to upload or drag and drop</p>
          <p className="text-gray-500 text-xs font-medium">PNG, JPG, WebP — square (1:1) recommended</p>
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
    <div className="p-4 sm:p-8 bg-[#fcfcfc] min-h-screen font-sans">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-lg">
                <LayoutDashboard size={20} className="text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Homepage</h1>
            </div>
            <p className="text-gray-500 text-sm mt-1">Control banners and live offer strip images</p>
          </div>
        </motion.div>

        {/* Content Container */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          
          {/* Tab strip */}
          <div className="flex gap-2 p-1.5 bg-gray-50 rounded-2xl mb-8 overflow-x-auto border border-gray-100 w-fit">
            {TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 min-w-max flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition focus:outline-none whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/50'
                  }`}>
                  <Icon size={16} /> {tab.label}
                </button>
              );
            })}
          </div>

          {/* ──────── BANNERS TAB ──────── */}
          {activeTab === 'banners' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-sm text-blue-800 font-medium">
                ℹ️ Banners appear in the hero section as a <strong>1:1 (square)</strong> auto-scrolling carousel. Upload square images for best results.
              </div>

              {/* Upload zone */}
              <div>
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Add New Banner</h2>
                <UploadZone onUploaded={(url, path) => handleUploaded(url, path, false)} />
              </div>

              {/* Banner list */}
              <div>
                <div className="flex items-center justify-between mb-5 border-b border-gray-50 pb-4">
                  <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Current Banners ({banners.length})
                  </h2>
                  <button onClick={fetchBanners} className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 transition bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm">
                    <RefreshCw size={12} /> Refresh
                  </button>
                </div>

                {loading ? (
                  <div className="flex justify-center py-16">
                    <div className="w-10 h-10 border-4 border-gray-100 border-t-black rounded-full animate-spin" />
                  </div>
                ) : banners.length === 0 ? (
                  <div className="text-center py-16 border-2 border-dashed border-gray-100 rounded-3xl text-gray-400">
                    <ImageIcon size={40} className="mx-auto mb-4 text-gray-200" />
                    <p className="font-bold text-gray-500">No banners yet.</p>
                    <p className="text-sm">Upload one above to get started.</p>
                  </div>
                ) : (
                  <AnimatePresence>
                    <div className="space-y-5">
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
            </motion.div>
          )}

          {/* ──────── OFFERS STRIP TAB ──────── */}
          {activeTab === 'offers-strip' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-sm text-amber-800 font-medium">
                ⚡ These banners appear in the Live Offers Strip at the bottom of the hero section. Upload <strong>Extra-wide Pill-shaped images (e.g., 1280x160px or ~8:1 ratio)</strong> for best results.
              </div>

              {/* Upload zone */}
              <div>
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Add New Live Offer Banner</h2>
                <UploadZone onUploaded={(url, path) => handleUploaded(url, path, true)} />
              </div>

              {/* Banner list */}
              <div>
                <div className="flex items-center justify-between mb-5 border-b border-gray-50 pb-4">
                  <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Current Live Offer Banners ({liveOfferBanners.length})
                  </h2>
                  <button onClick={fetchLiveOfferBanners} className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 transition bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm">
                    <RefreshCw size={12} /> Refresh
                  </button>
                </div>

                {offersLoading ? (
                  <div className="flex justify-center py-16">
                    <div className="w-10 h-10 border-4 border-gray-100 border-t-black rounded-full animate-spin" />
                  </div>
                ) : liveOfferBanners.length === 0 ? (
                  <div className="text-center py-16 border-2 border-dashed border-gray-100 rounded-3xl text-gray-400">
                    <ImageIcon size={40} className="mx-auto mb-4 text-gray-200" />
                    <p className="font-bold text-gray-500">No live offer banners yet.</p>
                    <p className="text-sm">Recommended ratio: Wide Rectangle (21:9)</p>
                  </div>
                ) : (
                  <AnimatePresence>
                    <div className="space-y-5">
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
              <div className="pt-10 mt-10 border-t border-gray-100">
                <div className="flex items-center justify-between mb-5 border-b border-gray-50 pb-4">
                  <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Running Offers Data ({liveOffers.length})
                  </h2>
                  <button onClick={fetchLiveOffers} className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 transition bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm">
                    <RefreshCw size={12} /> Refresh
                  </button>
                </div>

                {pillsLoading ? (
                  <div className="flex justify-center py-8"><div className="w-8 h-8 border-4 border-gray-100 border-t-black rounded-full animate-spin" /></div>
                ) : liveOffers.length === 0 ? (
                  <div className="text-center py-10 bg-gray-50 rounded-2xl border border-gray-100 text-gray-500">
                    <p className="font-bold">No running offers found.</p>
                    <p className="text-sm mt-1">Manage them in Admin → Offers</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {liveOffers.map(o => (
                      <div key={o.id} className={`flex items-center justify-between p-5 rounded-2xl border transition shadow-sm ${
                        o.status === 'live' ? 'bg-green-50/50 border-green-100' : 'bg-gray-50/50 border-gray-100'
                      }`}>
                        <div className="flex items-center gap-4">
                          <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${o.status === 'live' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-gray-300'}`} />
                          <div>
                            <p className="text-gray-900 font-bold text-sm">{o.name}</p>
                            <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mt-1">{o.offerType?.replace(/_/g, ' ')} {o.rewardValue ? `· ${o.rewardValue}${o.offerType?.includes('percentage') || o.offerType?.includes('flash') ? '%' : '₹'} off` : ''}</p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${
                          o.status === 'live' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-white text-gray-400 border-gray-200'
                        }`}>
                          {o.status}
                        </span>
                      </div>
                    ))}
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider text-center pt-4">Toggle live/draft status in Admin → Offers</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

        </div>
      </div>
    </div>
  );
}
