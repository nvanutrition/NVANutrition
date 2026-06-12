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
 { icon: Shield, label: 'Lab Tested', sub: 'Quality Assured', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
 { icon: Truck, label: 'Free Shipping', sub: 'Pan India', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
 { icon: Award, label: '100% Genuine', sub: 'Certified', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
 { icon: Clock, label: '3-5 Day', sub: 'Delivery', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
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
 return { ...r, id: d.id, date: r.createdAt?.toDate ? r.createdAt.toDate().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Recently' };
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
 <main className="bg-background min-h-screen text-foreground">
 <Navbar />
 <div className="max-w-7xl mx-auto px-4 py-32 flex flex-col items-center justify-center">
 <div className="relative w-16 h-16 mb-6">
 <div className="absolute inset-0 rounded-full border-2 border-green-500/20" />
 <div className="absolute inset-0 rounded-full border-t-2 border-green-500 animate-spin" />
 </div>
 <p className="text-gray-500 font-semibold">Loading product…</p>
 </div>
 <Footer />
 </main>
 );
 }

 if (!product) {
 return (
 <main className="bg-background min-h-screen text-foreground">
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
 const stockBadge = product.stock > 10
 ? { label: 'In Stock', cls: 'bg-green-500/10 text-green-400 border-green-500/25' }
 : product.stock > 0
 ? { label: `Only ${product.stock} Left!`, cls: 'bg-amber-500/10 text-amber-400 border-amber-500/25 animate-pulse' }
 : { label: 'Out of Stock', cls: 'bg-red-500/10 text-red-400 border-red-500/25' };

 const hasSalePrice = product.originalMrp && (product.discountPercent ?? 0) > 0;
 const savings = hasSalePrice ? product.originalMrp! - product.price : 0;

 return (
 <main className="bg-background min-h-screen text-foreground">
 <Navbar />

 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">

 {/* Breadcrumb */}
 <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
 <Link href="/" className="hover:text-green-400 transition">Home</Link>
 <ChevronRight size={14} />
 <Link href="/products" className="hover:text-green-400 transition">Products</Link>
 <ChevronRight size={14} />
 <span className="text-gray-500 font-medium truncate max-w-[200px]">{product.name}</span>
 </div>

 {/* Hero: Gallery + Buy Panel */}
 <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-20">

 {/* Gallery — 6 cols */}
 <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-6 space-y-4">
 {/* Main Image */}
 <div
 className="relative w-full aspect-square bg-gradient-to-br from-gray-50 to-gray-200 rounded-3xl overflow-hidden border border-gray-200 shadow-xl group"
 onTouchStart={handleTouchStart}
 onTouchEnd={handleTouchEnd}
 >
 <AnimatePresence mode="wait">
 <motion.div
 key={currentImg}
 initial={{ opacity: 0, scale: 1.02 }}
 animate={{ opacity: 1, scale: 1 }}
 exit={{ opacity: 0, scale: 0.98 }}
 transition={{ duration: 0.35 }}
 className="w-full h-full"
 >
 <Image src={activeImage} alt={product.name} fill className="object-contain p-8" priority />
 </motion.div>
 </AnimatePresence>

 {/* Nav arrows */}
 {(product.images?.length ?? 0) > 1 && (
 <>
 <button onClick={() => setCurrentImg(p => (p - 1 + (product.images?.length ?? 1)) % (product.images?.length ?? 1))}
 className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center text-foreground transition cursor-pointer z-10 border border-gray-200 backdrop-blur-sm opacity-0 group-hover:opacity-100">
 <ChevronLeft size={18} />
 </button>
 <button onClick={() => setCurrentImg(p => (p + 1) % (product.images?.length ?? 1))}
 className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center text-foreground transition cursor-pointer z-10 border border-gray-200 backdrop-blur-sm opacity-0 group-hover:opacity-100">
 <ChevronRight size={18} />
 </button>
 </>
 )}

 {!inStock && (
 <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-20">
 <span className="bg-red-600 text-foreground font-black text-sm px-6 py-2 rounded-full uppercase tracking-widest">Out of Stock</span>
 </div>
 )}
 {hasSalePrice && (
 <div className="absolute top-4 left-4 bg-gradient-to-r from-green-500 to-emerald-600 text-black font-black text-xs px-3 py-1.5 rounded-full z-10 shadow-lg">
 {product.discountPercent}% OFF
 </div>
 )}
 </div>

 {/* Thumbnails */}
 {(product.images?.length ?? 0) > 1 && (
 <div className="flex gap-2.5 justify-center flex-wrap">
 {product.images!.map((img, i) => (
 <button key={i} onClick={() => setCurrentImg(i)}
 className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 transition duration-200 cursor-pointer ${i === currentImg ? 'border-green-500 ring-2 ring-green-500/20 shadow-lg shadow-green-500/10' : 'border-gray-200 hover:border-gray-300'}`}>
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
 className={`rounded-full transition-all duration-300 cursor-pointer ${i === currentImg ? 'w-5 h-1.5 bg-green-500' : 'w-1.5 h-1.5 bg-muted/50 hover:bg-white/40'}`} />
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
 <div className="flex items-center gap-1 text-sm">
 {[...Array(5)].map((_, i) => (
 <Star key={i} size={13} className={i < Math.floor(product.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-700'} />
 ))}
 <span className="text-gray-500 ml-1 text-xs">({product.reviews} reviews)</span>
 </div>
 <span className={`text-xs font-bold px-3 py-1 rounded-full border ${stockBadge.cls}`}>{stockBadge.label}</span>
 </div>

 {/* Product name */}
 <h1 className="text-3xl md:text-4xl font-black leading-tight text-foreground">{product.name}</h1>

 {/* Free Gift Banner */}
 {freeGiftOffer && (
 <div className="bg-gradient-to-r from-blue-600/15 to-indigo-600/15 border border-blue-500/25 rounded-2xl p-4 flex items-center gap-4">
 <div className="relative w-12 h-12 bg-blue-500/10 rounded-xl overflow-hidden flex-shrink-0 border border-blue-500/20">
 <Image src={freeGiftOffer.image} alt={freeGiftOffer.name} fill className="object-contain p-1" />
 </div>
 <div>
 <p className="text-blue-400 font-black text-xs uppercase tracking-widest flex items-center gap-1.5 mb-1"><Gift size={12} /> Special Offer</p>
 <p className="text-foreground text-sm font-semibold">Get <span className="font-black text-blue-300">{freeGiftOffer.name}</span> FREE with this product!</p>
 </div>
 </div>
 )}

 {/* Short description */}
 <p className="text-gray-500 text-sm leading-relaxed border-l-2 border-green-500/30 pl-4">{product.description}</p>

 {/* Pricing – Premium card */}
 <div className="relative rounded-2xl overflow-hidden">
 <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-600/5" />
 <div className="relative p-5 border border-green-500/15 rounded-2xl">
 {hasSalePrice ? (
 <div className="flex items-end gap-4 flex-wrap">
 <div>
 <p className="text-xs text-gray-500 mb-1 font-semibold uppercase tracking-wider">Your Price</p>
 <span className="text-5xl font-black text-green-600 font-mono leading-none">₹{product.price.toLocaleString()}</span>
 </div>
 <div className="pb-1">
 <span className="text-xl text-gray-600 line-through font-mono">₹{product.originalMrp!.toLocaleString()}</span>
 <div className="mt-1 flex items-center gap-2">
 <span className="bg-green-500/15 border border-green-500/25 text-green-400 font-bold text-xs px-3 py-1 rounded-lg">
 {product.discountPercent}% OFF
 </span>
 <span className="text-xs text-gray-500">You save <span className="text-green-400 font-bold">₹{savings.toLocaleString()}</span></span>
 </div>
 </div>
 </div>
 ) : (
 <div>
 <p className="text-xs text-gray-500 mb-1 font-semibold uppercase tracking-wider">Price</p>
 <span className="text-5xl font-black text-green-600 font-mono">₹{product.price.toLocaleString()}</span>
 </div>
 )}
 <p className="text-xs text-gray-600 mt-3 flex items-center gap-1.5">
 <Check size={11} className="text-green-500" />
 Inclusive of all taxes • Free shipping across India
 </p>
 </div>
 </div>

 {/* Nutrition quick stats */}
 {product.nutritionOptions && product.nutritionOptions.length > 0 && (
 <div>
 <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-3">Per Serving</p>
 <div className="grid grid-cols-4 gap-2">
 {product.nutritionOptions.slice(0, 4).map((opt, i) => (
 <div key={i} className="text-center p-3 bg-gray-50 border border-gray-200 rounded-xl hover:border-green-500/20 transition">
 <p className="text-[10px] text-gray-500 font-bold uppercase mb-1.5 leading-tight">{opt.name}</p>
 <p className="text-base font-black text-green-600 font-mono leading-none">{opt.quantity}<span className="text-[9px] text-green-600">{opt.unit}</span></p>
 </div>
 ))}
 </div>
 </div>
 )}

 {/* Flavor selector */}
 {product.flavors && product.flavors.length > 0 && (
 <div>
 <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-3">
 Flavor: <span className="text-gray-900 normal-case font-bold ml-1">{selectedFlavor}</span>
 </p>
 <div className="flex flex-wrap gap-2">
 {product.flavors.map(f => (
 <button key={f} onClick={() => setSelectedFlavor(f)} disabled={!inStock}
 className={`px-4 py-2 rounded-xl font-bold text-sm border-2 transition duration-200 cursor-pointer disabled:cursor-not-allowed ${
 selectedFlavor === f
 ? 'border-green-500 bg-green-50 text-gray-900 shadow-md shadow-green-500/10'
 : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300 hover:text-gray-900'
 }`}>
 {f}
 </button>
 ))}
 </div>
 </div>
 )}

 {/* Size/Weight */}
 {product.weight && inStock && (
 <div>
 <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-3">Package</p>
 <button className="px-5 py-2.5 rounded-xl font-bold text-sm border-2 border-green-500 bg-green-50 text-gray-900 cursor-default">
 {product.weight} {product.weightUnit} · {product.servings} Servings
 </button>
 </div>
 )}

 {/* Divider */}
 <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

 {/* Quantity + CTA */}
 {inStock ? (
 <div className="space-y-4">
 <div className="flex items-center justify-between">
 <div>
 <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-2">Quantity</p>
 <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl p-1 w-fit">
 <button onClick={() => setQuantity(q => Math.max(1, q - 1))}
 className="w-9 h-9 flex items-center justify-center hover:bg-gray-200 rounded-lg transition cursor-pointer text-gray-500 hover:text-gray-900">
 <Minus size={16} />
 </button>
 <span className="w-12 text-center font-black text-gray-900 font-mono text-lg">{quantity}</span>
 <button onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
 className="w-9 h-9 flex items-center justify-center hover:bg-gray-200 rounded-lg transition cursor-pointer text-gray-500 hover:text-gray-900">
 <Plus size={16} />
 </button>
 </div>
 {product.stock <= 5 && <p className="text-xs text-amber-500 font-semibold mt-1.5 animate-pulse">Only {product.stock} units left!</p>}
 </div>
 <div className="text-right">
 <p className="text-xs text-gray-500 mb-1">Total</p>
 <p className="text-3xl font-black text-green-600 font-mono">₹{(product.price * quantity).toLocaleString()}</p>
 </div>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 <button onClick={handleAddToCart}
 className="flex items-center justify-center gap-2.5 py-4 rounded-2xl font-black text-sm border-2 border-gray-200 bg-gray-100 hover:bg-gray-200 text-gray-900 transition cursor-pointer">
 <ShoppingCart size={17} /> Add to Cart
 </button>
 <button onClick={handleBuyNow}
 className="flex items-center justify-center gap-2.5 py-4 rounded-2xl font-black text-sm bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white transition shadow-xl shadow-green-500/25 cursor-pointer">
 <Zap size={17} /> Buy Now
 </button>
 </div>
 </div>
 ) : (
 <div className="py-5 text-center border border-red-200 bg-red-50 rounded-2xl">
 <p className="text-red-600 font-bold mb-1">Currently Out of Stock</p>
 <p className="text-gray-500 text-sm">Check back soon or explore similar products below</p>
 </div>
 )}

 {/* Trust badges */}
 <div className="grid grid-cols-4 gap-2 pt-1">
 {TRUST.map(t => (
 <div key={t.label} className={`text-center p-3 rounded-xl border ${t.bg} transition`}>
 <t.icon size={16} className={`mx-auto ${t.color} mb-1.5`} />
 <p className="text-[10px] font-bold text-gray-900 leading-tight">{t.label}</p>
 <p className="text-[9px] text-gray-500 mt-0.5">{t.sub}</p>
 </div>
 ))}
 </div>
 </div>
 </motion.div>
 </div>

 {/* Tabs Section */}
 <div className="mb-20">
 {/* Tab strip */}
 <div className="flex gap-1 p-1.5 bg-gray-50 border border-gray-200 rounded-2xl mb-8 overflow-x-auto">
 {TABS.map(tab => {
 const Icon = tab.icon;
 return (
 <button key={tab.id} onClick={() => setActiveTab(tab.id)}
 className={`flex-1 min-w-max flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition cursor-pointer whitespace-nowrap ${
 activeTab === tab.id
 ? 'bg-green-500/15 text-green-400 border border-green-500/25 shadow-sm'
 : 'text-gray-500 hover:text-gray-500 hover:bg-white/3'
 }`}>
 <Icon size={14} />
 {tab.label}
 </button>
 );
 })}
 </div>

 <AnimatePresence mode="wait">

 {/* Overview tab */}
 {activeTab === 'overview' && (
 <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
 {product.longDescription && (
 <div className="p-6 bg-gray-50 border border-gray-200 rounded-2xl">
 <h3 className="font-black text-foreground text-lg mb-4 flex items-center gap-2.5">
 <div className="w-7 h-7 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center justify-center">
 <Package size={14} className="text-green-400" />
 </div>
 About This Product
 </h3>
 <p className="text-gray-500 leading-relaxed text-sm">{product.longDescription}</p>
 </div>
 )}
 {product.benefits && product.benefits.length > 0 && (
 <div className="p-6 bg-gray-50 border border-gray-200 rounded-2xl">
 <h3 className="font-black text-foreground text-lg mb-5 flex items-center gap-2.5">
 <div className="w-7 h-7 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center justify-center">
 <Award size={14} className="text-green-400" />
 </div>
 Key Benefits
 </h3>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 {product.benefits.map((b, i) => (
 <div key={i} className="flex items-start gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-green-500/20 transition">
 <div className="w-5 h-5 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
 <Check size={10} className="text-green-400" />
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
 <div className="p-6 bg-gray-50 border border-gray-200 rounded-2xl">
 <div className="flex items-center gap-2.5 mb-1">
 <div className="w-7 h-7 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center justify-center">
 <Activity size={14} className="text-green-400" />
 </div>
 <h3 className="font-black text-foreground text-lg">Nutrition Facts</h3>
 </div>
 <p className="text-xs text-gray-500 mb-6 ml-9.5">Per serving ({product.servings} servings per container)</p>
 {product.nutritionOptions && product.nutritionOptions.length > 0 ? (
 <div className="space-y-2">
 {product.nutritionOptions.map((opt, i) => (
 <div key={i} className={`flex items-center justify-between p-4 rounded-xl border transition ${i % 2 === 0 ? 'bg-white/3 border-white/6' : 'bg-transparent border-white/4'} hover:border-green-500/15`}>
 <div className="flex items-center gap-2.5">
 <div className="w-2 h-2 rounded-full bg-green-500/50" />
 <span className="text-sm font-semibold text-gray-200">{opt.name}</span>
 </div>
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
 <div key={n.label} className="text-center p-5 bg-white border border-gray-200 rounded-2xl hover:border-green-500/20 transition">
 <n.icon size={18} className="text-green-400 mx-auto mb-2" />
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
 <div className="p-6 bg-gray-50 border border-gray-200 rounded-2xl">
 <h3 className="font-black text-foreground text-lg mb-5 flex items-center gap-2.5">
 <div className="w-7 h-7 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center justify-center">
 <Zap size={14} className="text-green-400" />
 </div>
 Key Active Ingredients
 </h3>
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
 <div key={i} className="bg-white border border-gray-200 p-4 rounded-2xl flex flex-col items-center text-center hover:border-green-500/30 transition group">
 <div className="w-11 h-11 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mb-3 text-green-400 group-hover:scale-110 transition-transform">
 <Icon size={16} />
 </div>
 <p className="text-sm font-bold text-gray-200 mb-1 leading-tight">{isObj ? (ing as any).name : ing}</p>
 {isObj && (ing as any).quantity && (
 <span className="text-xs font-black text-green-400 bg-green-500/10 border border-green-500/15 px-2 py-0.5 rounded-lg">{(ing as any).quantity}{(ing as any).unit}</span>
 )}
 </div>
 );
 })}
 </div>
 </div>
 )}
 {product.fullIngredients && (
 <div className="p-6 bg-gray-50 border border-gray-200 rounded-2xl">
 <h3 className="font-black text-foreground text-sm mb-3 uppercase tracking-wider">Full Ingredient Label</h3>
 <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-200">{product.fullIngredients}</p>
 </div>
 )}
 </motion.div>
 )}

 {/* Usage tab */}
 {activeTab === 'usage' && (
 <motion.div key="usage" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
 <div className="p-6 bg-gray-50 border border-gray-200 rounded-2xl">
 <h3 className="font-black text-foreground text-lg mb-5 flex items-center gap-2.5">
 <div className="w-7 h-7 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center justify-center">
 <Clock size={14} className="text-green-400" />
 </div>
 How to Use
 </h3>
 <div className="bg-white border border-gray-200 rounded-2xl p-5">
 <p className="text-gray-500 font-medium leading-relaxed whitespace-pre-line text-sm">{product.usage || 'Usage instructions not available.'}</p>
 </div>
 <div className="mt-4 p-4 bg-amber-500/5 border border-amber-500/15 rounded-xl flex items-start gap-3">
 <div className="w-6 h-6 bg-amber-500/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
 <Shield size={12} className="text-amber-400" />
 </div>
 <p className="text-xs text-amber-400/80 leading-relaxed">Always consult a healthcare professional before starting any supplement. Keep out of reach of children. Store in a cool, dry place.</p>
 </div>
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </div>

 {/* Reviews Section */}
 <div className="mb-20 grid grid-cols-1 lg:grid-cols-12 gap-8">
 {/* Review summary */}
 <div className="lg:col-span-4">
 <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 lg:sticky lg:top-28">
 <h2 className="text-xl font-black text-foreground mb-5 flex items-center gap-2.5">
 <div className="w-7 h-7 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-center justify-center">
 <Star size={14} className="text-yellow-400" />
 </div>
 Athlete Reviews
 </h2>
 <div className="flex items-center gap-5 mb-6">
 <div className="text-center">
 <span className="text-6xl font-black text-green-400 font-mono block leading-none">{product.rating}</span>
 <div className="flex gap-0.5 justify-center mt-2">
 {[...Array(5)].map((_, i) => <Star key={i} size={14} className={i < Math.floor(product.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-700'} />)}
 </div>
 </div>
 <div>
 <p className="text-xs text-gray-500 font-semibold">{product.reviews} verified reviews</p>
 <p className="text-xs text-green-400 font-bold flex items-center gap-1 mt-1"><Users size={10} /> Athletes Recommend</p>
 </div>
 </div>
 {[5, 4, 3, 2, 1].map(n => {
 const pct = n >= 4 ? (n === 5 ? 78 : 15) : n === 3 ? 5 : 2;
 return (
 <div key={n} className="flex items-center gap-3 mb-2">
 <span className="text-xs text-gray-500 w-3 text-right">{n}</span>
 <Star size={10} className="text-yellow-400 fill-yellow-400 flex-shrink-0" />
 <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
 <div className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full" style={{ width: `${pct}%` }} />
 </div>
 <span className="text-xs text-gray-600 w-7 text-right">{pct}%</span>
 </div>
 );
 })}
 <Link href="/account"
 className="w-full mt-5 bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold py-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 text-sm">
 <MessageSquarePlus size={15} /> Write a Review
 </Link>
 </div>
 </div>

 {/* Reviews list */}
 <div className="lg:col-span-8 space-y-4">
 <h3 className="font-black text-foreground text-lg">Customer Feedback ({reviews.length})</h3>
 {reviews.length === 0 ? (
 <div className="p-8 text-center border border-gray-200 rounded-2xl bg-gray-50">
 <Star size={32} className="text-gray-700 mx-auto mb-3" />
 <p className="text-gray-500 font-semibold">Be the first to review this product!</p>
 </div>
 ) : (
 reviews.map((rev, i) => (
 <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
 className="bg-gray-50 border border-gray-200 rounded-2xl p-5 hover:border-gray-300 transition">
 <div className="flex items-start justify-between mb-3">
 <div>
 <h4 className="font-bold text-foreground mb-1.5">{rev.title}</h4>
 <div className="flex items-center gap-2">
 <div className="flex gap-0.5">{[...Array(5)].map((_, j) => <Star key={j} size={11} className={j < rev.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-700'} />)}</div>
 <span className="text-xs text-gray-500">{rev.date}</span>
 </div>
 </div>
 {rev.verified && (
 <span className="flex items-center gap-1 text-[10px] font-bold text-green-400 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full flex-shrink-0">
 <BadgeCheck size={11} /> Verified
 </span>
 )}
 </div>
 <p className="text-sm text-gray-500 leading-relaxed mb-2">{rev.comment}</p>
 <p className="text-xs text-gray-600 font-bold">— {rev.name}</p>
 </motion.div>
 ))
 )}
 </div>
 </div>

 {/* Related Products */}
 {relatedProducts.length > 0 && (
 <div>
 <div className="flex items-center gap-3 mb-8">
 <div className="w-8 h-8 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center justify-center">
 <Zap size={16} className="text-green-500" />
 </div>
 <h2 className="text-2xl font-black text-foreground">You May Also Like</h2>
 </div>
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
 {relatedProducts.slice(0, 4).map(rp => (
 <Link key={rp.id} href={`/products/${rp.sku || rp.id}`}
 className="group bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden hover:border-green-500/30 hover:shadow-xl hover:shadow-green-500/5 transition duration-300">
 <div className="relative aspect-square bg-gray-50 p-4">
 <Image src={rp.images?.[0] || '/products/placeholder.jpg'} alt={rp.name} fill className="object-contain p-3 group-hover:scale-105 transition duration-300" />
 </div>
 <div className="p-4 border-t border-gray-200">
 <p className="text-xs text-gray-500 mb-1 font-medium">{rp.category}</p>
 <p className="text-sm font-bold text-foreground truncate group-hover:text-green-400 transition mb-1">{rp.name}</p>
 <p className="text-green-400 font-black text-lg font-mono">₹{rp.price.toLocaleString()}</p>
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
