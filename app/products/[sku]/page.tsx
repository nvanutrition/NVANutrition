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
  Star, ShoppingCart, Zap, Flame, ArrowLeft, Dumbbell, Scale, Activity, Check,
  MessageSquarePlus, Shield, Truck, Package, Award, ChevronLeft, ChevronRight,
  Minus, Plus, Clock, Users, BadgeCheck, Gift
} from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

// ─── Mock Reviews ─────────────────────────────────────────────────────────────
const INITIAL_REVIEWS = [
  { name: 'Vikram Singh', rating: 5, date: 'May 20, 2026', title: 'Outstanding Quality & Mixability', comment: 'Absolutely love the quality. Mixes perfectly without any lumps and the taste is fantastic. Seen great gains in recovery over the past month.', verified: true },
  { name: 'Priya Sharma', rating: 5, date: 'April 14, 2026', title: 'Highly Recommended', comment: 'Been using NV supplements for six months now. The lab-tested guarantee gives me peace of mind. Excellent post-workout companion.', verified: true },
  { name: 'Rahul Mehta', rating: 4, date: 'March 28, 2026', title: 'Great taste and results', comment: 'Solid results, energy levels are up during workouts. Highly premium packaging too.', verified: true },
];

// ─── Tab definitions ──────────────────────────────────────────────────────────
type TabId = 'overview' | 'nutrition' | 'ingredients' | 'usage';
const TABS: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Overview & Benefits' },
  { id: 'nutrition', label: 'Nutrition Facts' },
  { id: 'ingredients', label: 'Ingredients' },
  { id: 'usage', label: 'How to Use' },
];

// ─── Trust Badges ─────────────────────────────────────────────────────────────
const TRUST = [
  { icon: Shield, label: 'Lab Tested', sub: 'Quality Assured' },
  { icon: Truck, label: 'Free Shipping', sub: 'Pan India' },
  { icon: Award, label: '100% Genuine', sub: 'Certified' },
  { icon: Clock, label: '3-5 Day', sub: 'Delivery' },
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
  const [reviews, setReviews] = useState(INITIAL_REVIEWS);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({ name: '', rating: 5, title: '', comment: '' });
  const [imgZoom, setImgZoom] = useState({ origin: 'center center', scale: 1 });
  const [freeGiftOffer, setFreeGiftOffer] = useState<{name: string, image: string} | null>(null);
  const buyPanelRef = useRef<HTMLDivElement>(null);

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
          
          // Check for active free gift offer
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
          } catch (e) {
            console.error('Failed to fetch offer', e);
          }
        }
      } finally { setLoading(false); }
    })();
  }, [sku]);

  const activeImage = product?.images?.[currentImg] || '/products/placeholder.jpg';

  const handleAddToCart = () => {
    if (!product) return;
    if (product.stock <= 0) { toast.error('Out of stock!'); return; }
    if (quantity > product.stock) { toast.error(`Only ${product.stock} units left`); return; }
    addItem({ id: product.sku || product.id, name: product.name, price: product.price, quantity, flavor: selectedFlavor, unit: product.weight ? `${product.weight}${product.weightUnit}` : 'Standard', image: activeImage });
    toast.success(`${quantity} × ${product.name} added to cart!`);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    router.push('/checkout');
  };

  const submitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewForm.name || !reviewForm.title || !reviewForm.comment) { toast.error('Please fill all fields'); return; }
    setReviews(prev => [{ ...reviewForm, date: 'Just Now', verified: true }, ...prev]);
    toast.success('Review submitted!');
    setReviewForm({ name: '', rating: 5, title: '', comment: '' });
    setShowReviewForm(false);
  };

  // ── Loading ──
  if (loading) {
    return (
      <main className="bg-slate-950 min-h-screen text-white">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-32 flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-2 border-green-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-400 font-semibold">Loading product…</p>
        </div>
        <Footer />
      </main>
    );
  }

  if (!product) {
    return (
      <main className="bg-slate-950 min-h-screen text-white">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-32 text-center">
          <h1 className="text-4xl font-black mb-4">Product Not Found</h1>
          <Link href="/products" className="bg-green-500 text-black font-bold px-8 py-3 rounded-xl">Back to Catalog</Link>
        </div>
        <Footer />
      </main>
    );
  }

  const inStock = product.stock > 0;
  const stockBadge = product.stock > 10 ? { label: 'In Stock', cls: 'bg-green-500/10 text-green-400 border-green-500/25' }
    : product.stock > 0 ? { label: `Only ${product.stock} Left!`, cls: 'bg-amber-500/10 text-amber-400 border-amber-500/25 animate-pulse' }
    : { label: 'Out of Stock', cls: 'bg-red-500/10 text-red-400 border-red-500/25' };

  const hasSalePrice = product.originalMrp && (product.discountPercent ?? 0) > 0;
  const savings = hasSalePrice ? product.originalMrp! - product.price : 0;

  const inpCls = "w-full px-4 py-2.5 bg-white/5 border border-white/10 text-white placeholder:text-gray-600 rounded-xl focus:outline-none focus:border-green-500/60 transition text-sm";

  return (
    <main className="bg-slate-950 min-h-screen text-white">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">

        {/* ── Breadcrumb ── */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <Link href="/" className="hover:text-green-400 transition">Home</Link>
          <ChevronRight size={14} />
          <Link href="/products" className="hover:text-green-400 transition">Products</Link>
          <ChevronRight size={14} />
          <span className="text-gray-300 font-medium truncate max-w-[200px]">{product.name}</span>
        </div>

        {/* ── Hero Section: Gallery + Buy Panel ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-16">

          {/* Gallery — 6 cols */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-6 space-y-4">
            {/* Main Image */}
            <div
              className="relative w-full aspect-square bg-gradient-to-br from-neutral-900 to-neutral-950 rounded-3xl overflow-hidden border border-neutral-800 cursor-zoom-in shadow-2xl"
              onMouseMove={e => {
                const r = e.currentTarget.getBoundingClientRect();
                setImgZoom({ origin: `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`, scale: 1.75 });
              }}
              onMouseLeave={() => setImgZoom({ origin: 'center center', scale: 1 })}
            >
              <AnimatePresence mode="wait">
                <motion.div key={currentImg} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
                  className="w-full h-full transition-transform duration-100"
                  style={{ transformOrigin: imgZoom.origin, transform: `scale(${imgZoom.scale})` }}>
                  <Image src={activeImage} alt={product.name} fill className="object-contain p-8" priority />
                </motion.div>
              </AnimatePresence>

              {/* Nav arrows */}
              {(product.images?.length ?? 0) > 1 && (
                <>
                  <button onClick={() => setCurrentImg(p => (p - 1 + (product.images?.length ?? 1)) % (product.images?.length ?? 1))}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/50 hover:bg-black/80 rounded-full flex items-center justify-center text-white transition cursor-pointer z-10">
                    <ChevronLeft size={18} />
                  </button>
                  <button onClick={() => setCurrentImg(p => (p + 1) % (product.images?.length ?? 1))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/50 hover:bg-black/80 rounded-full flex items-center justify-center text-white transition cursor-pointer z-10">
                    <ChevronRight size={18} />
                  </button>
                </>
              )}

              {/* Out of stock overlay */}
              {!inStock && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-20">
                  <span className="bg-red-600 text-white font-black text-sm px-6 py-2 rounded-full uppercase tracking-widest">Out of Stock</span>
                </div>
              )}

              {/* Sale badge */}
              {hasSalePrice && <div className="absolute top-4 left-4 bg-green-500 text-black font-black text-xs px-3 py-1 rounded-full z-10">{product.discountPercent}% OFF</div>}
            </div>

            {/* Thumbnails */}
            {(product.images?.length ?? 0) > 1 && (
              <div className="flex gap-2.5 justify-center">
                {product.images!.map((img, i) => (
                  <button key={i} onClick={() => setCurrentImg(i)}
                    className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 transition duration-200 cursor-pointer ${i === currentImg ? 'border-green-500 ring-2 ring-green-500/20' : 'border-neutral-800 hover:border-neutral-600'}`}>
                    <Image src={img} alt="" fill className="object-contain p-1.5" />
                  </button>
                ))}
              </div>
            )}

            {/* Dot indicator */}
            {(product.images?.length ?? 0) > 1 && (
              <div className="flex gap-1.5 justify-center">
                {product.images!.map((_, i) => (
                  <button key={i} onClick={() => setCurrentImg(i)}
                    className={`rounded-full transition-all duration-300 cursor-pointer ${i === currentImg ? 'w-5 h-1.5 bg-green-500' : 'w-1.5 h-1.5 bg-white/20 hover:bg-white/40'}`} />
                ))}
              </div>
            )}
          </motion.div>

          {/* Buy Panel — 6 cols */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-6">
            <div ref={buyPanelRef} className="lg:sticky lg:top-28 space-y-5">

              {/* Category + Rating + Stock */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-green-500/10 border border-green-500/30 text-green-400 font-bold text-xs px-3 py-1.5 rounded-full uppercase tracking-wider">
                  {product.category}
                </span>
                <div className="flex items-center gap-1 text-sm text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={13} className={i < Math.floor(product.rating) ? 'fill-yellow-400' : 'text-gray-700'} />
                  ))}
                  <span className="text-gray-400 ml-1 text-xs">({product.reviews} reviews)</span>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full border ${stockBadge.cls}`}>{stockBadge.label}</span>
              </div>

              {/* Product name */}
              <h1 className="text-3xl md:text-4xl font-black leading-tight text-white">{product.name}</h1>

              {/* Free Gift Banner */}
              {freeGiftOffer && (
                <div className="bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border border-blue-500/30 rounded-xl p-4 flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/10 rounded-lg overflow-hidden flex-shrink-0">
                    <img src={freeGiftOffer.image} alt={freeGiftOffer.name} className="w-full h-full object-contain p-1" />
                  </div>
                  <div>
                    <h4 className="text-blue-400 font-bold flex items-center gap-1.5 text-sm uppercase tracking-widest"><Gift size={14} /> Special Offer</h4>
                    <p className="text-white text-base font-semibold">Get <span className="font-black text-blue-300">{freeGiftOffer.name}</span> FREE with this product!</p>
                  </div>
                </div>
              )}

              {/* Short description */}
              <p className="text-gray-400 text-sm leading-relaxed">{product.description}</p>

              {/* Pricing */}
              <div className="p-4 bg-white/3 rounded-2xl border border-white/8">
                {hasSalePrice ? (
                  <div className="space-y-1">
                    <div className="flex items-baseline gap-3">
                      <span className="text-4xl font-black text-green-400 font-mono">₹{product.price.toLocaleString()}</span>
                      <span className="text-xl text-gray-600 line-through font-mono">₹{product.originalMrp!.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="bg-green-500/15 border border-green-500/25 text-green-400 font-bold text-xs px-3 py-1 rounded-lg">
                        {product.discountPercent}% OFF
                      </span>
                      <span className="text-xs text-gray-400">You save <span className="text-green-400 font-bold">₹{savings.toLocaleString()}</span></span>
                    </div>
                  </div>
                ) : (
                  <span className="text-4xl font-black text-green-400 font-mono">₹{product.price.toLocaleString()}</span>
                )}
                <p className="text-xs text-gray-600 mt-2">Inclusive of all taxes • Free shipping across India</p>
              </div>

              {/* Nutrition quick stats */}
              {product.nutritionOptions && product.nutritionOptions.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-2">Per Serving</p>
                  <div className="grid grid-cols-4 gap-2">
                    {product.nutritionOptions.slice(0, 4).map((opt, i) => (
                      <div key={i} className="text-center p-2.5 bg-neutral-900/80 border border-neutral-800 rounded-xl">
                        <p className="text-[10px] text-gray-500 font-bold uppercase mb-1 leading-tight">{opt.name}</p>
                        <p className="text-base font-black text-green-400 font-mono leading-none">{opt.quantity}<span className="text-[9px] text-green-600">{opt.unit}</span></p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Flavor selector */}
              {product.flavors && product.flavors.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-2.5">
                    Flavor: <span className="text-white normal-case font-bold">{selectedFlavor}</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {product.flavors.map(f => (
                      <button key={f} onClick={() => setSelectedFlavor(f)} disabled={!inStock}
                        className={`px-4 py-2 rounded-xl font-bold text-sm border-2 transition duration-200 cursor-pointer disabled:cursor-not-allowed ${selectedFlavor === f ? 'border-green-500 bg-green-500/10 text-white shadow-md shadow-green-500/10' : 'border-neutral-800 bg-neutral-900/50 text-gray-400 hover:border-neutral-700'}`}>
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Size/Weight */}
              {product.weight && inStock && (
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-2.5">Size</p>
                  <button className="px-5 py-2.5 rounded-xl font-bold text-sm border-2 border-green-500 bg-green-500/10 text-white cursor-default">
                    {product.weight} {product.weightUnit} · {product.servings} Servings
                  </button>
                </div>
              )}

              {/* Quantity + CTA */}
              {inStock && (
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-2">Quantity</p>
                      <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-xl p-1 w-fit">
                        <button onClick={() => setQuantity(q => Math.max(1, q - 1))}
                          className="w-9 h-9 flex items-center justify-center hover:bg-neutral-800 rounded-lg transition cursor-pointer text-gray-400 hover:text-white">
                          <Minus size={16} />
                        </button>
                        <span className="w-10 text-center font-black text-white font-mono">{quantity}</span>
                        <button onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                          className="w-9 h-9 flex items-center justify-center hover:bg-neutral-800 rounded-lg transition cursor-pointer text-gray-400 hover:text-white">
                          <Plus size={16} />
                        </button>
                      </div>
                      {product.stock <= 5 && <p className="text-xs text-amber-400 font-semibold mt-1 animate-pulse">Max: {product.stock} units</p>}
                    </div>
                    <div className="flex-1 text-right">
                      <p className="text-xs text-gray-500 mb-1">Total</p>
                      <p className="text-2xl font-black text-green-400 font-mono">₹{(product.price * quantity).toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={handleAddToCart}
                      className="flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-sm border-2 border-white/10 bg-white/5 hover:bg-white/10 text-white transition cursor-pointer">
                      <ShoppingCart size={16} /> Add to Cart
                    </button>
                    <button onClick={handleBuyNow}
                      className="flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-sm bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-black transition shadow-lg shadow-green-500/20 cursor-pointer">
                      <Zap size={16} /> Buy Now
                    </button>
                  </div>
                </div>
              )}

              {/* Out of stock state */}
              {!inStock && (
                <div className="py-4 text-center border border-red-500/20 bg-red-500/5 rounded-2xl">
                  <p className="text-red-400 font-bold">Currently Out of Stock</p>
                  <p className="text-gray-500 text-sm mt-1">Check back soon or explore similar products below</p>
                </div>
              )}

              {/* Trust badges */}
              <div className="grid grid-cols-4 gap-2 pt-2">
                {TRUST.map(t => (
                  <div key={t.label} className="text-center p-2.5 bg-white/3 rounded-xl border border-white/5">
                    <t.icon size={15} className="mx-auto text-green-400 mb-1" />
                    <p className="text-[10px] font-bold text-white leading-tight">{t.label}</p>
                    <p className="text-[9px] text-gray-500">{t.sub}</p>
                  </div>
                ))}
              </div>

              {/* SKU */}
              {product.sku && (
                <p className="text-xs text-gray-700">SKU: <span className="text-green-600 font-mono">{product.sku}</span></p>
              )}
            </div>
          </motion.div>
        </div>

        {/* ── Tabs Section ── */}
        <div className="mb-16">
          {/* Tab strip */}
          <div className="flex gap-1 p-1 bg-white/3 border border-white/8 rounded-2xl mb-6 overflow-x-auto">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-max px-5 py-2.5 rounded-xl font-bold text-sm transition cursor-pointer whitespace-nowrap ${activeTab === tab.id ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'text-gray-500 hover:text-gray-300'}`}>
                {tab.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">

            {/* Overview tab */}
            {activeTab === 'overview' && (
              <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                {product.longDescription && (
                  <div className="p-6 bg-neutral-900/60 border border-neutral-800 rounded-2xl">
                    <h3 className="font-black text-white text-lg mb-3 flex items-center gap-2"><Package size={16} className="text-green-400" /> About This Product</h3>
                    <p className="text-gray-400 leading-relaxed">{product.longDescription}</p>
                  </div>
                )}
                {product.benefits && product.benefits.length > 0 && (
                  <div className="p-6 bg-neutral-900/60 border border-neutral-800 rounded-2xl">
                    <h3 className="font-black text-white text-lg mb-4 flex items-center gap-2"><Award size={16} className="text-green-400" /> Key Benefits</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {product.benefits.map((b, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-neutral-950 rounded-xl border border-neutral-850 hover:border-green-500/20 transition">
                          <div className="w-5 h-5 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Check size={11} className="text-green-400" />
                          </div>
                          <span className="text-sm font-semibold text-gray-200 leading-snug">{b}</span>
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
                <div className="p-6 bg-neutral-900/60 border border-neutral-800 rounded-2xl">
                  <h3 className="font-black text-white text-lg mb-1 flex items-center gap-2"><Activity size={16} className="text-green-400" /> Nutrition Facts</h3>
                  <p className="text-xs text-gray-500 mb-5">Per serving ({product.servings} servings per container)</p>
                  {product.nutritionOptions && product.nutritionOptions.length > 0 ? (
                    <div className="space-y-2">
                      {product.nutritionOptions.map((opt, i) => (
                        <div key={i} className={`flex items-center justify-between p-3.5 rounded-xl border transition ${i % 2 === 0 ? 'bg-white/3 border-white/6' : 'bg-transparent border-white/4'}`}>
                          <span className="text-sm font-semibold text-gray-300">{opt.name}</span>
                          <span className="text-base font-black text-green-400 font-mono">{opt.quantity}<span className="text-xs text-green-600 ml-0.5">{opt.unit}</span></span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {[
                        { label: 'Protein', icon: Dumbbell, val: product.nutritionFacts?.protein },
                        { label: 'Carbohydrates', icon: Scale, val: product.nutritionFacts?.carbs },
                        { label: 'Fats', icon: Activity, val: product.nutritionFacts?.fats },
                        { label: 'Calories', icon: Flame, val: product.nutritionFacts?.calories },
                      ].map(n => (
                        <div key={n.label} className="text-center p-4 bg-neutral-950 border border-neutral-850 rounded-xl">
                          <n.icon size={16} className="text-green-400 mx-auto mb-2" />
                          <p className="text-xs text-gray-500 font-bold uppercase mb-2">{n.label}</p>
                          <p className="text-2xl font-black text-green-400 font-mono">{n.val || 'N/A'}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Ingredients tab */}
            {activeTab === 'ingredients' && (
              <motion.div key="ingredients" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-5">
                {product.ingredients && product.ingredients.length > 0 && (
                  <div className="p-6 bg-neutral-900/60 border border-neutral-800 rounded-2xl">
                    <h3 className="font-black text-white text-lg mb-4 flex items-center gap-2"><Zap size={16} className="text-green-400" /> Key Active Ingredients</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {product.ingredients.map((ing, i) => {
                        const isObj = typeof ing === 'object';
                        const logoType = isObj ? (ing as any).logo : 'default';
                        let Icon: any = Check;
                        if (logoType === 'protein') Icon = Dumbbell;
                        if (logoType === 'energy') Icon = Zap;
                        if (logoType === 'vitamin') Icon = Activity;
                        if (logoType === 'carb' || logoType === 'fat') Icon = Flame;
                        return (
                          <div key={i} className="bg-neutral-950 border border-neutral-800 p-4 rounded-2xl flex flex-col items-center text-center hover:border-green-500/30 transition">
                            <div className="w-10 h-10 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mb-3 text-green-400">
                              <Icon size={16} />
                            </div>
                            <p className="text-sm font-bold text-gray-200 mb-1">{isObj ? (ing as any).name : ing}</p>
                            {isObj && (ing as any).quantity && (
                              <span className="text-xs font-black text-green-400 bg-green-500/10 px-2 py-0.5 rounded-lg">{(ing as any).quantity}{(ing as any).unit}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {product.fullIngredients && (
                  <div className="p-6 bg-neutral-900/60 border border-neutral-800 rounded-2xl">
                    <h3 className="font-black text-white text-base mb-3 uppercase tracking-wider">Full Ingredient Label</h3>
                    <p className="text-sm text-gray-400 leading-relaxed bg-neutral-950/50 p-4 rounded-xl border border-neutral-800/50">{product.fullIngredients}</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Usage tab */}
            {activeTab === 'usage' && (
              <motion.div key="usage" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <div className="p-6 bg-neutral-900/60 border border-neutral-800 rounded-2xl">
                  <h3 className="font-black text-white text-lg mb-4 flex items-center gap-2"><Clock size={16} className="text-green-400" /> How to Use</h3>
                  <div className="bg-neutral-950 border border-neutral-850 rounded-2xl p-5">
                    <p className="text-gray-300 font-medium leading-relaxed whitespace-pre-line">{product.usage || 'Usage instructions not available.'}</p>
                  </div>
                  <div className="mt-4 p-4 bg-amber-500/5 border border-amber-500/15 rounded-xl flex items-start gap-2.5">
                    <Shield size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-400/80 leading-relaxed">Always consult a healthcare professional before starting any supplement. Keep out of reach of children. Store in a cool, dry place.</p>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* ── Reviews Section ── */}
        <div className="mb-16 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Review summary */}
          <div className="lg:col-span-4">
            <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 lg:sticky lg:top-28">
              <h2 className="text-xl font-black text-white mb-5 flex items-center gap-2"><Star size={18} className="text-yellow-400" /> Athlete Reviews</h2>
              <div className="flex items-center gap-4 mb-5">
                <span className="text-6xl font-black text-green-400 font-mono">{product.rating}</span>
                <div>
                  <div className="flex gap-0.5 mb-1">
                    {[...Array(5)].map((_, i) => <Star key={i} size={16} className={i < Math.floor(product.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-700'} />)}
                  </div>
                  <p className="text-xs text-gray-500 font-semibold">{product.reviews} verified reviews</p>
                  <p className="text-xs text-green-400 font-bold flex items-center gap-1 mt-1"><Users size={10} /> Athletes Recommend</p>
                </div>
              </div>

              {/* Rating bars */}
              {[5, 4, 3, 2, 1].map(n => {
                const pct = n >= 4 ? (n === 5 ? 78 : 15) : n === 3 ? 5 : 2;
                return (
                  <div key={n} className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs text-gray-500 w-2">{n}</span>
                    <Star size={10} className="text-yellow-400 fill-yellow-400 flex-shrink-0" />
                    <div className="flex-1 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-gray-600 w-6 text-right">{pct}%</span>
                  </div>
                );
              })}

              <button onClick={() => setShowReviewForm(s => !s)}
                className="w-full mt-5 bg-green-500 hover:bg-green-400 text-black font-black py-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 text-sm">
                <MessageSquarePlus size={15} /> Write a Review
              </button>

              <AnimatePresence>
                {showReviewForm && (
                  <motion.form onSubmit={submitReview} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    className="space-y-3 mt-5 pt-5 border-t border-neutral-800 overflow-hidden">
                    <input required value={reviewForm.name} onChange={e => setReviewForm(p => ({ ...p, name: e.target.value }))} placeholder="Your Name" className={inpCls} />
                    <select value={reviewForm.rating} onChange={e => setReviewForm(p => ({ ...p, rating: Number(e.target.value) }))} className={inpCls}>
                      {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{'⭐'.repeat(n)} ({n}/5)</option>)}
                    </select>
                    <input required value={reviewForm.title} onChange={e => setReviewForm(p => ({ ...p, title: e.target.value }))} placeholder="Review headline" className={inpCls} />
                    <textarea required rows={3} value={reviewForm.comment} onChange={e => setReviewForm(p => ({ ...p, comment: e.target.value }))} placeholder="Share your experience…" className={`${inpCls} resize-none`} />
                    <button type="submit" className="w-full bg-neutral-800 hover:bg-neutral-700 text-white font-bold py-2.5 rounded-xl text-sm transition cursor-pointer">Submit Review</button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Reviews list */}
          <div className="lg:col-span-8 space-y-4">
            <h3 className="font-black text-white text-lg">Customer Feedback ({reviews.length})</h3>
            {reviews.map((rev, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-bold text-white mb-1">{rev.title}</h4>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">{[...Array(5)].map((_, j) => <Star key={j} size={11} className={j < rev.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-700'} />)}</div>
                      <span className="text-xs text-gray-500">{rev.date}</span>
                    </div>
                  </div>
                  {rev.verified && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-green-400 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full">
                      <BadgeCheck size={11} /> Verified Athlete
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-400 leading-relaxed mb-2">{rev.comment}</p>
                <p className="text-xs text-gray-600 font-bold">— {rev.name}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── Related Products ── */}
        {relatedProducts.length > 0 && (
          <div>
            <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-2.5">
              <Zap className="text-green-500" size={20} /> You May Also Like
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedProducts.slice(0, 4).map(rp => (
                <Link key={rp.id} href={`/products/${rp.sku || rp.id}`}
                  className="group bg-neutral-900/60 border border-neutral-800 rounded-2xl overflow-hidden hover:border-green-500/30 hover:shadow-lg hover:shadow-green-500/5 transition duration-300">
                  <div className="relative aspect-square bg-neutral-900 p-4">
                    <Image src={rp.images?.[0] || '/products/placeholder.jpg'} alt={rp.name} fill className="object-contain p-3 group-hover:scale-105 transition duration-300" />
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-gray-500 mb-1">{rp.category}</p>
                    <p className="text-sm font-bold text-white truncate group-hover:text-green-400 transition">{rp.name}</p>
                    <p className="text-green-400 font-black text-base mt-1 font-mono">₹{rp.price.toLocaleString()}</p>
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
