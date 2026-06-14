'use client';

import { useParams, useRouter } from 'next/navigation';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { fetchDbProductBySku, fetchDbProducts, DbProduct } from '@/lib/db-products';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { useCartStore } from '@/lib/store';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, ShoppingCart, Zap, Flame, Dumbbell, Scale, Activity, Check,
  MessageSquarePlus, Shield, Truck, Package, Award, ChevronLeft, ChevronRight,
  Minus, Plus, Clock, Users, BadgeCheck, Gift, ArrowLeft, ChevronDown
} from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

const INITIAL_REVIEWS: any[] = [];

type TabId = 'overview' | 'nutrition' | 'ingredients' | 'usage';
const TABS: { id: TabId; label: string; icon: any }[] = [
  { id: 'overview', label: 'Overview', icon: Package },
  { id: 'nutrition', label: 'Nutrition', icon: Activity },
  { id: 'ingredients', label: 'Ingredients', icon: Zap },
  { id: 'usage', label: 'How to Use', icon: Clock },
];

const TRUST = [
  { icon: Shield, label: 'Lab Tested', sub: 'Quality Assured', color: 'text-blue-500', bg: 'bg-blue-50 border-blue-100 group-hover:bg-blue-100 group-hover:border-blue-200' },
  { icon: Truck, label: 'Free Shipping', sub: 'Pan India', color: 'text-emerald-500', bg: 'bg-emerald-50 border-emerald-100 group-hover:bg-emerald-100 group-hover:border-emerald-200' },
  { icon: Award, label: '100% Genuine', sub: 'Certified', color: 'text-amber-500', bg: 'bg-amber-50 border-amber-100 group-hover:bg-amber-100 group-hover:border-amber-200' },
  { icon: Clock, label: '3-5 Day', sub: 'Delivery', color: 'text-purple-500', bg: 'bg-purple-50 border-purple-100 group-hover:bg-purple-100 group-hover:border-purple-200' },
];

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const addItem = useCartStore(s => s.addItem);
  const sku = params?.sku as string;

  const [product, setProduct] = useState<DbProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedProducts, setRelatedProducts] = useState<DbProduct[]>([]);
  const [currentImg, setCurrentImg] = useState(0);
  const [selectedFlavor, setSelectedFlavor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [reviews, setReviews] = useState<any[]>(INITIAL_REVIEWS);
  const [freeGiftOffer, setFreeGiftOffer] = useState<{name: string, image: string} | null>(null);
  const buyPanelRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Auto-carousel
  useEffect(() => {
    if (!product?.images || product.images.length <= 1) return;
    const iv = setInterval(() => setCurrentImg(p => (p + 1) % (product?.images?.length || 1)), 4500);
    return () => clearInterval(iv);
  }, [product]);

  useEffect(() => {
    if (!sku) return;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchDbProductBySku(sku);
        if (data) {
          setProduct(data);
          setSelectedFlavor(data.flavors?.[0] || '');
          const all = await fetchDbProducts();
          const related = all.filter(p => p.category === data.category && p.id !== data.id).slice(0, 4);
          setRelatedProducts(related.length >= 3 ? related : [...related, ...all.filter(p => p.id !== data.id && p.category !== data.category).slice(0, 4 - related.length)]);
          
          try {
            const offersQ = query(collection(db, 'offers'), where('status', '==', 'live'), where('offerType', '==', 'free_product'), where('targetSku', '==', data.sku));
            const offerSnap = await getDocs(offersQ);
            if (!offerSnap.empty) {
              const offerData = offerSnap.docs[0].data();
              if (offerData.rewardSku) {
                const prodQ = query(collection(db, 'products'), where('sku', '==', offerData.rewardSku));
                const pSnap = await getDocs(prodQ);
                if (!pSnap.empty) {
                  setFreeGiftOffer({
                    name: pSnap.docs[0].data().name,
                    image: pSnap.docs[0].data().images?.[0] || '/products/placeholder.jpg'
                  });
                }
              }
            }
          } catch (e) { console.error('Failed to fetch offer', e); }

          try {
            const reviewsQ = query(collection(db, 'reviews'), where('sku', '==', data.sku), where('status', '==', 'approved'));
            const revSnap = await getDocs(reviewsQ);
            const fetchedReviews = revSnap.docs.map(d => {
              const r = d.data() as any;
              return { ...r, id: d.id, date: r.createdAt?.toDate ? r.createdAt.toDate().toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Recently' };
            });
            fetchedReviews.sort((a: any, b: any) => b.createdAt?.toDate?.()?.getTime?.() - a.createdAt?.toDate?.()?.getTime?.() || 0);
            setReviews(fetchedReviews);
          } catch (e) { console.error('Failed to fetch reviews', e); }
        }
      } finally { setLoading(false); }
    })();
  }, [sku]);

  const activeImage = product?.images?.[currentImg] || '/products/placeholder.jpg';

  const handleAddToCart = () => {
    if (!product) return;
    if (product.stock <= 0) { toast.error('Out of stock!'); return; }
    if (quantity > product.stock) { toast.error(`Only ${product.stock} units left`); return; }
    addItem({ id: product.sku || product.id, sku: product.sku, name: product.name, price: product.price, quantity, flavor: selectedFlavor, unit: product.weight ? `${product.weight}${product.weightUnit}` : 'Standard', image: product.images?.[0] || '/products/placeholder.jpg' });
    toast.success(`${quantity} × ${product.name} added to cart!`);
  };

  const handleBuyNow = () => { handleAddToCart(); router.push('/checkout'); };

  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.changedTouches[0].screenX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].screenX;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 40) {
      if (diff > 0) setCurrentImg(p => (p + 1) % (product?.images?.length || 1));
      else setCurrentImg(p => (p - 1 + (product?.images?.length || 1)) % (product?.images?.length || 1));
    }
  };

  if (loading) {
    return (
      <main className="bg-[#fcfcfc] min-h-screen text-gray-900 font-sans">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-32 flex flex-col items-center justify-center min-h-[70vh]">
          <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin mb-6" />
          <p className="text-gray-500 font-bold uppercase tracking-wider text-sm">Loading product…</p>
        </div>
        <Footer />
      </main>
    );
  }

  if (!product) {
    return (
      <main className="bg-[#fcfcfc] min-h-screen text-gray-900 font-sans">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-32 text-center min-h-[70vh] flex flex-col items-center justify-center">
          <h1 className="text-4xl font-black mb-4 text-gray-900">Product Not Found</h1>
          <p className="text-gray-500 mb-8">The product you're looking for doesn't exist or has been removed.</p>
          <Link href="/products" className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold px-8 py-3.5 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.1)] hover:from-emerald-600 hover:to-teal-700 transition">Back to Catalog</Link>
        </div>
        <Footer />
      </main>
    );
  }

  const inStock = product.stock > 0;
  const stockBadge = product.stock > 10
    ? { label: 'In Stock', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
    : product.stock > 0
    ? { label: `Only ${product.stock} Left!`, cls: 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse' }
    : { label: 'Out of Stock', cls: 'bg-red-50 text-red-700 border-red-200' };

  const hasSalePrice = product.originalMrp && (product.discountPercent ?? 0) > 0;
  const savings = hasSalePrice ? product.originalMrp! - product.price : 0;

  return (
    <main className="bg-[#fcfcfc] min-h-screen text-gray-900 font-sans">
      <Navbar />

      <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-8">
          <Link href="/" className="hover:text-emerald-600 transition">Home</Link>
          <ChevronRight size={12} className="text-gray-300" />
          <Link href="/products" className="hover:text-emerald-600 transition">Products</Link>
          <ChevronRight size={12} className="text-gray-300" />
          <span className="text-gray-900 truncate max-w-[200px]">{product.name}</span>
        </div>

        {/* Hero: Gallery + Buy Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 xl:gap-16 mb-24">

          {/* Gallery — 7 cols */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-7 space-y-4">
            {/* Main Image */}
            <div
              className="relative w-full aspect-square bg-white rounded-[2rem] overflow-hidden border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] group flex items-center justify-center"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentImg}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.3 }}
                  className="w-full h-full p-8 sm:p-12"
                >
                  <Image src={activeImage} alt={product.name} fill className="object-contain p-8 mix-blend-multiply drop-shadow-sm" priority />
                </motion.div>
              </AnimatePresence>

              {/* Nav arrows */}
              {(product.images?.length ?? 0) > 1 && (
                <>
                  <button onClick={() => setCurrentImg(p => (p - 1 + (product.images?.length ?? 1)) % (product.images?.length ?? 1))}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-emerald-700 shadow-lg border border-emerald-100 transition cursor-pointer z-10 opacity-0 group-hover:opacity-100 hover:scale-105 hover:bg-white hover:text-emerald-600">
                    <ChevronLeft size={20} />
                  </button>
                  <button onClick={() => setCurrentImg(p => (p + 1) % (product.images?.length ?? 1))}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-emerald-700 shadow-lg border border-emerald-100 transition cursor-pointer z-10 opacity-0 group-hover:opacity-100 hover:scale-105 hover:bg-white hover:text-emerald-600">
                    <ChevronRight size={20} />
                  </button>
                </>
              )}

              {!inStock && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-20">
                  <span className="bg-red-50 text-red-700 border border-red-200 font-black text-sm px-6 py-2.5 rounded-full uppercase tracking-widest shadow-sm">Out of Stock</span>
                </div>
              )}
              {hasSalePrice && (
                <div className="absolute top-6 left-6 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black text-[10px] px-3 py-1.5 rounded-md z-10 shadow-sm uppercase tracking-widest">
                  {product.discountPercent}% OFF
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {(product.images?.length ?? 0) > 1 && (
              <div className="flex gap-3 justify-center flex-wrap pt-2">
                {product.images!.map((img, i) => (
                  <button key={i} onClick={() => setCurrentImg(i)}
                    className={`relative w-20 h-20 rounded-2xl overflow-hidden border-2 bg-white transition duration-200 cursor-pointer ${i === currentImg ? 'border-emerald-500 shadow-md ring-2 ring-emerald-500/20' : 'border-gray-100 hover:border-emerald-300'}`}>
                    <Image src={img} alt="" fill className="object-contain p-2 mix-blend-multiply" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Buy Panel — 5 cols */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-5">
            <div ref={buyPanelRef} className="lg:sticky lg:top-32 space-y-8 bg-white p-6 sm:p-8 rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">

              {/* Category + Rating + Stock */}
              <div className="flex flex-wrap items-center gap-3">
                <span className="bg-emerald-50 border border-emerald-100 text-emerald-700 font-black text-[10px] px-2.5 py-1 rounded-md uppercase tracking-wider">
                  {product.category}
                </span>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} className={i < Math.floor(product.rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'} />
                  ))}
                  <span className="text-gray-500 font-bold text-xs ml-1 hover:text-emerald-600 transition cursor-pointer underline decoration-gray-300 underline-offset-2 hover:decoration-emerald-400">({product.reviews} reviews)</span>
                </div>
                <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md border ml-auto shadow-sm ${stockBadge.cls}`}>{stockBadge.label}</span>
              </div>

              {/* Product name */}
              <h1 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight">{product.name}</h1>

              {/* Free Gift Banner */}
              {freeGiftOffer && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
                  <div className="relative w-12 h-12 bg-white rounded-xl overflow-hidden flex-shrink-0 border border-indigo-100">
                    <Image src={freeGiftOffer.image} alt={freeGiftOffer.name} fill className="object-contain p-1 mix-blend-multiply" />
                  </div>
                  <div>
                    <p className="text-indigo-600 font-black text-[10px] uppercase tracking-widest flex items-center gap-1 mb-0.5"><Gift size={12} /> Special Offer</p>
                    <p className="text-indigo-900 text-sm font-bold">Get <span className="font-black underline decoration-indigo-300">{freeGiftOffer.name}</span> FREE!</p>
                  </div>
                </div>
              )}

              {/* Short description */}
              <p className="text-gray-600 text-sm leading-relaxed border-l-4 border-emerald-500/50 pl-4 font-medium bg-gradient-to-r from-emerald-50/50 to-transparent py-2">{product.description}</p>

              {/* Pricing */}
              <div className="bg-gradient-to-br from-emerald-50/50 to-teal-50/50 rounded-2xl p-5 border border-emerald-100/50">
                {hasSalePrice ? (
                  <div className="flex items-end gap-4 flex-wrap">
                    <div>
                      <span className="text-4xl font-black text-emerald-700 font-mono tracking-tight drop-shadow-sm">₹{product.price.toLocaleString()}</span>
                    </div>
                    <div className="pb-1.5 flex items-center gap-2">
                      <span className="text-lg text-gray-400 line-through font-mono font-semibold">₹{product.originalMrp!.toLocaleString()}</span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <span className="text-4xl font-black text-emerald-700 font-mono tracking-tight drop-shadow-sm">₹{product.price.toLocaleString()}</span>
                  </div>
                )}
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600/80 mt-3 flex items-center gap-1.5">
                  <Check size={12} className="text-emerald-500" />
                  Inclusive of all taxes • Free shipping
                </p>
              </div>

              {/* Flavor selector */}
              {product.flavors && product.flavors.length > 0 && (
                <div className="pt-2">
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                      Flavor: <span className="text-gray-900 normal-case font-black ml-1">{selectedFlavor}</span>
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {product.flavors.map(f => (
                      <button key={f} onClick={() => setSelectedFlavor(f)} disabled={!inStock}
                        className={`px-4 py-2.5 rounded-xl font-bold text-sm border-2 transition duration-200 cursor-pointer disabled:cursor-not-allowed ${
                          selectedFlavor === f
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm'
                            : 'border-gray-100 bg-gray-50 text-gray-600 hover:border-emerald-300 hover:bg-white hover:text-emerald-700'
                        }`}>
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Size/Weight */}
              {product.weight && inStock && (
                <div className="pt-2">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-3">Package Size</p>
                  <button className="px-5 py-2.5 rounded-xl font-bold text-sm border-2 border-emerald-500 bg-emerald-50 text-emerald-800 cursor-default shadow-sm">
                    {product.weight} {product.weightUnit} · <span className="text-emerald-600/80 font-semibold">{product.servings} Servings</span>
                  </button>
                </div>
              )}

              {/* Divider */}
              <div className="h-px bg-gray-100 my-6" />

              {/* Quantity + CTA */}
              {inStock ? (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2">Quantity</p>
                      <div className="flex items-center bg-white border border-gray-200 rounded-xl p-1 w-fit shadow-sm">
                        <button onClick={() => setQuantity(q => Math.max(1, q - 1))}
                          className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 hover:text-emerald-600 rounded-lg transition cursor-pointer text-gray-500">
                          <Minus size={16} />
                        </button>
                        <span className="w-12 text-center font-black text-gray-900 font-mono text-lg">{quantity}</span>
                        <button onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                          className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 hover:text-emerald-600 rounded-lg transition cursor-pointer text-gray-500">
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Total</p>
                      <p className="text-3xl font-black text-emerald-700 font-mono tracking-tight drop-shadow-sm">₹{(product.price * quantity).toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <button onClick={handleAddToCart}
                      className="flex items-center justify-center gap-2.5 py-4 rounded-xl font-bold text-sm border-2 border-gray-200 bg-white hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 text-gray-900 transition cursor-pointer shadow-sm">
                      <ShoppingCart size={18} /> Add to Cart
                    </button>
                    <button onClick={handleBuyNow}
                      className="flex items-center justify-center gap-2.5 py-4 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white transition shadow-lg shadow-emerald-500/25 cursor-pointer">
                      <Zap size={18} /> Buy Now
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center border border-red-200 bg-red-50 rounded-2xl shadow-sm">
                  <p className="text-red-700 font-black mb-1 uppercase tracking-wider text-sm">Currently Out of Stock</p>
                  <p className="text-red-500/80 text-xs font-semibold">Check back soon or explore similar products below</p>
                </div>
              )}

              {/* Trust badges */}
              <div className="grid grid-cols-4 gap-2 pt-6 border-t border-gray-100 mt-8">
                {TRUST.map(t => (
                  <div key={t.label} className="text-center group cursor-default">
                    <div className={`w-10 h-10 mx-auto rounded-full border flex items-center justify-center mb-2 transition shadow-sm ${t.bg}`}>
                      <t.icon size={16} className={`transition ${t.color}`} />
                    </div>
                    <p className="text-[9px] font-black uppercase tracking-wider text-gray-900 leading-tight">{t.label}</p>
                    <p className="text-[9px] font-semibold text-gray-500 mt-0.5">{t.sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Tabs Section */}
        <div className="mb-24">
          {/* Tab strip */}
          <div className="flex gap-2 p-1.5 bg-white border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] rounded-2xl mb-8 overflow-x-auto w-fit mx-auto lg:mx-0">
            {TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 min-w-max flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition cursor-pointer whitespace-nowrap focus:outline-none ${
                    activeTab === tab.id
                      ? 'bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100'
                      : 'text-gray-500 hover:text-emerald-600 hover:bg-emerald-50/50 border border-transparent'
                  }`}>
                  <Icon size={16} className={activeTab === tab.id ? 'text-emerald-500' : 'text-gray-400'} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="bg-white border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] p-6 sm:p-10">
            <AnimatePresence mode="wait">

              {/* Overview tab */}
              {activeTab === 'overview' && (
                <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                  {product.longDescription && (
                    <div>
                      <h3 className="font-black text-gray-900 text-xl mb-4 flex items-center gap-3">
                        <div className="bg-indigo-50 p-2 rounded-xl border border-indigo-100"><Package size={20} className="text-indigo-500" /></div>
                        About This Product
                      </h3>
                      <p className="text-gray-600 font-medium leading-relaxed text-base">{product.longDescription}</p>
                    </div>
                  )}
                  {product.benefits && product.benefits.length > 0 && (
                    <div className="pt-6 border-t border-gray-100">
                      <h3 className="font-black text-gray-900 text-xl mb-6 flex items-center gap-3">
                        <div className="bg-amber-50 p-2 rounded-xl border border-amber-100"><Award size={20} className="text-amber-500" /></div>
                        Key Benefits
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {product.benefits.map((b, i) => (
                          <div key={i} className="flex items-start gap-4 p-5 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-white hover:border-amber-200 hover:shadow-sm transition">
                            <div className="w-6 h-6 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
                              <Check size={12} className="text-amber-600" />
                            </div>
                            <span className="text-sm font-bold text-gray-700 leading-snug">{b}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Nutrition tab */}
              {activeTab === 'nutrition' && (
                <motion.div key="nutrition" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
                    <h3 className="font-black text-gray-900 text-xl flex items-center gap-3">
                      <div className="bg-rose-50 p-2 rounded-xl border border-rose-100"><Activity size={20} className="text-rose-500" /></div>
                      Nutrition Facts
                    </h3>
                    <p className="text-xs font-bold text-rose-600 uppercase tracking-wider bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100 shadow-sm">
                      Per serving ({product.servings} servings)
                    </p>
                  </div>

                  {product.nutritionOptions && product.nutritionOptions.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {product.nutritionOptions.map((opt, i) => (
                        <div key={i} className="flex items-center justify-between p-5 rounded-2xl bg-gray-50 border border-gray-100 hover:bg-rose-50/50 hover:border-rose-200 hover:shadow-sm transition">
                          <span className="text-sm font-bold text-gray-600 uppercase tracking-wider">{opt.name}</span>
                          <span className="text-xl font-black text-gray-900 font-mono">{opt.quantity}<span className="text-sm text-gray-500 ml-0.5">{opt.unit}</span></span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {[
                        { label: 'Protein', icon: Dumbbell, val: product.nutritionFacts?.protein },
                        { label: 'Carbs', icon: Scale, val: product.nutritionFacts?.carbs },
                        { label: 'Fats', icon: Activity, val: product.nutritionFacts?.fats },
                        { label: 'Calories', icon: Flame, val: product.nutritionFacts?.calories },
                      ].map(n => (
                        <div key={n.label} className="text-center p-6 bg-gray-50 border border-gray-100 rounded-2xl hover:bg-rose-50/50 hover:border-rose-200 hover:shadow-sm transition">
                          <n.icon size={24} className="text-rose-400 mx-auto mb-3" />
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">{n.label}</p>
                          <p className="text-2xl font-black text-gray-900 font-mono">{n.val || '—'}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Ingredients tab */}
              {activeTab === 'ingredients' && (
                <motion.div key="ingredients" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                  {product.ingredients && product.ingredients.length > 0 && (
                    <div>
                      <h3 className="font-black text-gray-900 text-xl mb-6 flex items-center gap-3">
                        <div className="bg-cyan-50 p-2 rounded-xl border border-cyan-100"><Zap size={20} className="text-cyan-500" /></div>
                        Key Active Ingredients
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {product.ingredients.map((ing, i) => {
                          const isObj = typeof ing === 'object';
                          const logoType = isObj ? (ing as any).logo : 'default';
                          let Icon: any = Check;
                          if (logoType === 'protein') Icon = Dumbbell;
                          if (logoType === 'energy') Icon = Zap;
                          if (logoType === 'vitamin') Icon = Activity;
                          if (logoType === 'carb' || logoType === 'fat') Icon = Flame;
                          return (
                            <div key={i} className="bg-gray-50 border border-gray-100 p-6 rounded-2xl flex flex-col items-center text-center hover:bg-cyan-50/50 hover:shadow-sm hover:border-cyan-200 transition group">
                              <div className="w-12 h-12 bg-white border border-gray-100 shadow-sm rounded-full flex items-center justify-center mb-4 text-cyan-400 group-hover:text-cyan-600 transition-colors">
                                <Icon size={20} />
                              </div>
                              <p className="text-sm font-bold text-gray-900 mb-2 leading-tight">{isObj ? (ing as any).name : ing}</p>
                              {isObj && (ing as any).quantity && (
                                <span className="text-[10px] font-black uppercase tracking-wider text-cyan-700 bg-cyan-100 border border-cyan-200 shadow-sm px-2.5 py-1 rounded-md">{(ing as any).quantity}{(ing as any).unit}</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {product.fullIngredients && (
                    <div className="pt-6 border-t border-gray-100">
                      <h3 className="font-black text-gray-900 text-[10px] uppercase tracking-wider mb-4">Full Ingredient Label</h3>
                      <p className="text-sm font-medium text-gray-600 leading-relaxed bg-gray-50 p-6 rounded-2xl border border-gray-100">{product.fullIngredients}</p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Usage tab */}
              {activeTab === 'usage' && (
                <motion.div key="usage" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <h3 className="font-black text-gray-900 text-xl mb-6 flex items-center gap-3">
                    <div className="bg-purple-50 p-2 rounded-xl border border-purple-100"><Clock size={20} className="text-purple-500" /></div>
                    How to Use
                  </h3>
                  <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 md:p-8">
                    <p className="text-gray-700 font-semibold leading-relaxed whitespace-pre-line text-base">{product.usage || 'Usage instructions not available.'}</p>
                  </div>
                  <div className="mt-6 p-5 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-4 shadow-sm">
                    <div className="w-8 h-8 bg-white rounded-xl shadow-sm border border-amber-100 flex items-center justify-center flex-shrink-0">
                      <Shield size={16} className="text-amber-500" />
                    </div>
                    <p className="text-xs font-bold text-amber-800 leading-relaxed pt-1">Always consult a healthcare professional before starting any supplement. Keep out of reach of children. Store in a cool, dry place.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mb-24 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Review summary */}
          <div className="lg:col-span-4">
            <div className="bg-white border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] p-8 lg:sticky lg:top-32">
              <h2 className="text-xl font-black text-gray-900 mb-8 flex items-center gap-3">
                <div className="bg-amber-50 p-2 rounded-xl border border-amber-100"><Star size={20} className="text-amber-500" /></div>
                Athlete Reviews
              </h2>
              <div className="flex items-center gap-6 mb-8 pb-8 border-b border-gray-100">
                <div className="text-center">
                  <span className="text-6xl font-black text-gray-900 font-mono tracking-tighter block leading-none">{product.rating}</span>
                  <div className="flex gap-0.5 justify-center mt-3">
                    {[...Array(5)].map((_, i) => <Star key={i} size={14} className={i < Math.floor(product.rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'} />)}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-1">{product.reviews} verified reviews</p>
                  <p className="text-xs font-bold text-emerald-600 flex items-center gap-1.5"><Users size={14} className="text-emerald-500" /> Highly Recommended</p>
                </div>
              </div>
              
              <div className="space-y-3 mb-8">
                {[5, 4, 3, 2, 1].map(n => {
                  const pct = n >= 4 ? (n === 5 ? 78 : 15) : n === 3 ? 5 : 2;
                  return (
                    <div key={n} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-gray-500 w-3 text-right">{n}</span>
                      <Star size={12} className="text-amber-400 fill-amber-400 flex-shrink-0" />
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs font-bold text-gray-900 w-8 text-right">{pct}%</span>
                    </div>
                  );
                })}
              </div>

              <Link href="/account"
                className="w-full bg-white border-2 border-gray-200 hover:border-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 text-gray-900 font-bold py-3.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 text-sm shadow-sm">
                <MessageSquarePlus size={16} /> Write a Review
              </Link>
            </div>
          </div>

          {/* Reviews list */}
          <div className="lg:col-span-8">
            <h3 className="font-black text-gray-900 text-xl mb-6 flex items-center gap-2">Customer Feedback <span className="text-gray-400 text-base font-bold ml-1">({reviews.length})</span></h3>
            
            <div className="space-y-4">
              {reviews.length === 0 ? (
                <div className="p-10 text-center border-2 border-dashed border-gray-200 rounded-[2rem] bg-gray-50">
                  <Star size={32} className="text-amber-300 mx-auto mb-3" />
                  <p className="text-gray-900 font-bold">Be the first to review this product!</p>
                  <p className="text-sm font-semibold text-gray-500 mt-1">Share your experience with other athletes.</p>
                </div>
              ) : (
                reviews.map((rev, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="bg-white border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] rounded-3xl p-6 sm:p-8 hover:border-emerald-100 hover:shadow-md transition">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex gap-0.5">{[...Array(5)].map((_, j) => <Star key={j} size={12} className={j < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'} />)}</div>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{rev.date}</span>
                        </div>
                        <h4 className="font-black text-gray-900 text-base">{rev.title}</h4>
                      </div>
                      {rev.verified && (
                        <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-700 uppercase tracking-wider bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-md flex-shrink-0 w-fit shadow-sm">
                          <BadgeCheck size={14} className="text-emerald-500" /> Verified Buyer
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 font-medium leading-relaxed mb-4">{rev.comment}</p>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 border border-indigo-100 shadow-sm">
                        <Users size={12} />
                      </div>
                      {rev.name}
                    </p>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="pt-10 border-t border-gray-200">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-md shadow-emerald-500/20">
                <Zap size={18} className="text-white" />
              </div>
              <h2 className="text-2xl font-black text-gray-900">You May Also Like</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {relatedProducts.slice(0, 4).map(rp => (
                <Link key={rp.id} href={`/products/${rp.sku || rp.id}`}
                  className="group bg-white border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] overflow-hidden hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-500/5 transition duration-300 flex flex-col">
                  <div className="relative aspect-square bg-gray-50 p-6 flex items-center justify-center border-b border-gray-100">
                    <Image src={rp.images?.[0] || '/products/placeholder.jpg'} alt={rp.name} fill className="object-contain p-6 mix-blend-multiply group-hover:scale-105 transition duration-500" />
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider mb-1.5">{rp.category}</p>
                    <p className="text-sm font-bold text-gray-900 group-hover:text-emerald-700 transition mb-3 leading-snug line-clamp-2">{rp.name}</p>
                    <p className="text-lg font-black text-emerald-700 font-mono mt-auto drop-shadow-sm">₹{rp.price.toLocaleString()}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
      <Footer />
    </main>
  );
}
