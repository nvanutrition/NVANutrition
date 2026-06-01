'use client';

import { useParams, useRouter } from 'next/navigation';
import { fetchDbProductById, fetchDbProducts, DbProduct } from '@/lib/db-products';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { useCartStore } from '@/lib/store';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Star, 
  ShoppingCart, 
  Zap, 
  Flame, 
  ArrowLeft, 
  Dumbbell, 
  Scale, 
  Activity, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  MessageSquarePlus 
} from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

// Mock reviews for products to make them look premium
const initialReviews = [
  {
    name: 'Vikram Singh',
    rating: 5,
    date: 'May 20, 2026',
    title: 'Outstanding Quality & Mixability',
    comment: 'Absolutely love the quality. Mixes perfectly without any lumps and the taste is fantastic. Seen great gains in recovery over the past month.',
    verified: true,
  },
  {
    name: 'Priya Sharma',
    rating: 5,
    date: 'April 14, 2026',
    title: 'Highly Recommended',
    comment: 'Been using NV supplements for six months now. The lab-tested guarantee gives me peace of mind. Excellent post-workout companion.',
    verified: true,
  },
  {
    name: 'Rahul Mehta',
    rating: 4,
    date: 'March 28, 2026',
    title: 'Great taste and result',
    comment: 'Solid results, energy levels are up during workouts. Highly premium packing too.',
    verified: true,
  },
];

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);

  const productId = params?.id as string;
  
  // Dynamic States
  const [product, setProduct] = useState<DbProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedProducts, setRelatedProducts] = useState<DbProduct[]>([]);
  const [activeImage, setActiveImage] = useState<string>('');
  const [selectedFlavor, setSelectedFlavor] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'description' | 'ingredients' | 'usage'>('description');
  const [imgZoom, setImgZoom] = useState({ transformOrigin: 'center center', scale: 1 });
  const [reviewsList, setReviewsList] = useState(initialReviews);
  const [selectedUnit, setSelectedUnit] = useState<string>('kg');
  
  // Review form states
  const [reviewName, setReviewName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);

  useEffect(() => {
    async function getProductData() {
      if (!productId) return;
      setLoading(true);
      try {
        const data = await fetchDbProductById(productId);
        if (data) {
          setProduct(data);
          setSelectedFlavor(data.flavors?.[0] || '');
          setActiveImage(data.images?.[0] || '/products/placeholder.jpg');
          
          // Fetch related products
          const allProducts = await fetchDbProducts();
          const related = allProducts
            .filter((p) => p.category === data.category && p.id !== data.id)
            .slice(0, 3);
          if (related.length < 3) {
            const diff = 3 - related.length;
            const padding = allProducts.filter((p) => p.id !== data.id && p.category !== data.category).slice(0, diff);
            related.push(...padding);
          }
          setRelatedProducts(related);
        }
      } catch (error) {
        console.error('Error fetching product detail:', error);
      } finally {
        setLoading(false);
      }
    }
    getProductData();
  }, [productId]);

  // Interactive mouse zoom handler
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setImgZoom({
      transformOrigin: `${x}% ${y}%`,
      scale: 1.8,
    });
  };

  const handleMouseLeave = () => {
    setImgZoom({
      transformOrigin: 'center center',
      scale: 1,
    });
  };

  const handleAddToCart = () => {
    if (!product) return;
    if (product.stock <= 0) {
      toast.error('This product is out of stock!');
      return;
    }
    if (quantity > product.stock) {
      toast.error(`Only ${product.stock} units are currently in stock.`);
      return;
    }
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: quantity,
      flavor: selectedFlavor || product.flavors[0],
      unit: selectedUnit,
      image: activeImage,
    });
    toast.success(`${quantity} × ${product.name} (${selectedFlavor || product.flavors[0]} - ${selectedUnit}) added to cart!`);
  };

  const handleBuyNow = () => {
    if (!product) return;
    if (product.stock <= 0) {
      toast.error('This product is out of stock!');
      return;
    }
    if (quantity > product.stock) {
      toast.error(`Only ${product.stock} units are currently in stock.`);
      return;
    }
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: quantity,
      flavor: selectedFlavor || product.flavors[0],
      unit: selectedUnit,
      image: activeImage,
    });
    router.push('/checkout');
  };

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewName || !reviewTitle || !reviewComment) {
      toast.error('Please fill out all review fields');
      return;
    }

    const newReview = {
      name: reviewName,
      rating: reviewRating,
      date: 'Just Now',
      title: reviewTitle,
      comment: reviewComment,
      verified: true,
    };

    setReviewsList([newReview, ...reviewsList]);
    toast.success('Thank you! Your review has been submitted successfully.');
    
    // Reset Form
    setReviewName('');
    setReviewTitle('');
    setReviewComment('');
    setReviewRating(5);
    setShowReviewForm(false);
  };

  if (loading) {
    return (
      <main className="bg-slate-950 min-h-screen text-white">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-32 text-center flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mb-4"></div>
          <p className="text-gray-400 font-bold">Loading product details...</p>
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
          <h1 className="text-4xl font-extrabold mb-6">Product Not Found</h1>
          <p className="text-gray-400 mb-8">We couldn&apos;t find the product you were looking for.</p>
          <Link href="/products" className="bg-green-500 hover:bg-green-600 text-black font-extrabold px-8 py-3 rounded-xl transition">
            Back to Catalog
          </Link>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="bg-slate-950 min-h-screen text-white">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        {/* Back Link */}
        <Link 
          href="/products" 
          className="inline-flex items-center gap-2 text-gray-400 hover:text-green-400 font-bold mb-10 transition duration-300 group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Catalog
        </Link>

        {/* Product presentation section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
          
          {/* Col 1: Visuals with Hover Zoom & Image Gallery */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <div 
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              className="relative h-96 sm:h-[450px] bg-gradient-to-br from-neutral-900 to-neutral-950 rounded-3xl overflow-hidden border border-neutral-850 cursor-zoom-in shadow-2xl flex items-center justify-center group"
            >
              <div 
                className="relative w-full h-full transition-transform duration-100 ease-out"
                style={{
                  transformOrigin: imgZoom.transformOrigin,
                  transform: `scale(${imgZoom.scale})`
                }}
              >
                <Image
                  src={activeImage}
                  alt={product.name}
                  fill
                  className="object-contain p-6"
                  priority
                />
              </div>

              {/* Out of Stock Overlay */}
              {product.stock <= 0 && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-10 pointer-events-none">
                  <span className="bg-red-600 text-white font-extrabold text-sm px-6 py-3 rounded-full uppercase tracking-wider shadow-lg">
                    Out of Stock
                  </span>
                </div>
              )}

              {product.stock > 0 && (
                <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-xs font-semibold text-gray-300 pointer-events-none group-hover:opacity-0 transition-opacity">
                  🔍 Hover to zoom
                </div>
              )}
            </div>

            {/* Thumbnail list */}
            {product.images && product.images.length > 1 && (
              <div className="flex gap-3 justify-center">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(img)}
                    className={`relative w-20 h-20 bg-neutral-900 rounded-xl overflow-hidden border-2 transition duration-300 ${
                      activeImage === img ? 'border-green-500 bg-green-500/5' : 'border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    <Image src={img} alt={`${product.name} ${idx}`} fill className="object-contain p-2" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Col 2: Specifications, purchase options */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col justify-between space-y-8"
          >
            <div>
              {/* Category & Badge */}
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <span className="bg-green-500/10 border border-green-500/30 text-green-400 font-extrabold text-xs px-4 py-1.5 rounded-full uppercase tracking-wider">
                  {product.category}
                </span>
                <span className="text-gray-500 text-sm font-bold flex items-center gap-1">
                  <Star size={14} className="fill-yellow-400 text-yellow-400" />
                  {product.rating} ({product.reviews} Athlete Reviews)
                </span>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                  product.stock > 10 
                    ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                    : product.stock > 0 
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}>
                  {product.stock > 10 
                    ? 'In Stock' 
                    : product.stock > 0 
                    ? `Only ${product.stock} Left!` 
                    : 'Out of Stock'}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight tracking-tight">
                {product.name}
              </h1>

              {/* Pricing */}
              <div className="mb-6">
                {product.originalMrp && product.discountPercent && product.discountPercent > 0 ? (
                  <div className="space-y-1">
                    <div className="flex items-baseline gap-3">
                      <span className="text-4xl font-black text-green-500 font-mono">
                        ₹{product.price.toLocaleString()}
                      </span>
                      <span className="text-xl text-gray-500 line-through font-mono">
                        ₹{product.originalMrp.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <span className="bg-green-500/10 border border-green-500/30 text-green-400 font-extrabold text-xs px-3 py-1 rounded-md uppercase tracking-wider">
                        {product.discountPercent}% OFF
                      </span>
                      <span className="text-xs text-gray-400 font-semibold">
                        You save ₹{(product.originalMrp - product.price).toLocaleString()}!
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-4xl font-black text-green-500 font-mono">
                    ₹{product.price.toLocaleString()}
                  </p>
                )}
              </div>

              {/* Short description */}
              <p className="text-gray-400 text-base leading-relaxed mb-8 font-medium">
                {product.description}
              </p>

              {/* Visual Servings/Nutrition Grid */}
              <div className="grid grid-cols-4 gap-3 p-4 bg-neutral-900/60 border border-neutral-850 rounded-2xl mb-8">
                <div className="text-center p-2">
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
                    <Dumbbell size={12} className="text-green-500" /> Protein
                  </p>
                  <p className="text-xl font-black text-green-500 font-mono">{product.nutritionFacts?.protein || 'N/A'}</p>
                </div>
                <div className="text-center p-2">
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
                    <Scale size={12} className="text-green-500" /> Carbs
                  </p>
                  <p className="text-xl font-black text-green-500 font-mono">{product.nutritionFacts?.carbs || 'N/A'}</p>
                </div>
                <div className="text-center p-2">
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
                    <Activity size={12} className="text-green-500" /> Fats
                  </p>
                  <p className="text-xl font-black text-green-500 font-mono">{product.nutritionFacts?.fats || 'N/A'}</p>
                </div>
                <div className="text-center p-2">
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
                    <Flame size={12} className="text-green-500" /> Calories
                  </p>
                  <p className="text-xl font-black text-green-500 font-mono">{product.nutritionFacts?.calories || 'N/A'}</p>
                </div>
              </div>

              {/* Flavor Selector */}
              {product.flavors && product.flavors.length > 0 && (
                <div className="mb-6">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">
                    Select Flavor
                  </label>
                  <div className="flex flex-wrap gap-2.5">
                    {product.flavors.map((flavor) => (
                      <button
                        key={flavor}
                        onClick={() => setSelectedFlavor(flavor)}
                        className={`px-5 py-3 rounded-xl font-extrabold text-sm border-2 transition duration-300 cursor-pointer ${
                          selectedFlavor === flavor
                            ? 'border-green-500 bg-green-500/10 text-white'
                            : 'border-neutral-800 hover:border-neutral-700 bg-neutral-900/40 text-gray-400'
                        }`}
                        disabled={product.stock <= 0}
                      >
                        {flavor}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Unit Selector */}
              {product.stock > 0 && (
                <div className="mb-6">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">
                    Select Weight / Unit
                  </label>
                  <div className="flex gap-2">
                    {['g', 'kg', 'serving'].map((unit) => (
                      <button
                        key={unit}
                        onClick={() => setSelectedUnit(unit)}
                        className={`px-4 py-2.5 rounded-lg font-bold text-xs uppercase border-2 transition duration-300 cursor-pointer ${
                          selectedUnit === unit
                            ? 'border-green-500 bg-green-500/10 text-white'
                            : 'border-neutral-800 hover:border-neutral-700 bg-neutral-900/40 text-gray-400'
                        }`}
                      >
                        {unit}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity selector */}
              {product.stock > 0 && (
                <div className="flex items-center gap-4 mb-8">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">
                      Quantity
                    </label>
                    <div className="flex items-center bg-neutral-900 border border-neutral-850 rounded-xl p-1.5 w-fit">
                      <button 
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-10 h-10 flex items-center justify-center hover:bg-neutral-800 rounded-lg transition font-bold text-lg text-gray-400 hover:text-white cursor-pointer"
                      >
                        -
                      </button>
                      <span className="w-12 text-center font-black text-white text-base font-mono">{quantity}</span>
                      <button 
                        onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                        className="w-10 h-10 flex items-center justify-center hover:bg-neutral-800 rounded-lg transition font-bold text-lg text-gray-400 hover:text-white cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                    {product.stock <= 5 && (
                      <span className="text-xs text-amber-500 font-semibold block mt-1.5 animate-pulse">
                        Max available: {product.stock} units
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Buying buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-neutral-850">
              <button
                onClick={handleAddToCart}
                disabled={product.stock <= 0}
                className="flex-1 bg-neutral-900 hover:bg-neutral-850 disabled:bg-gray-800 disabled:text-gray-500 border border-neutral-800 text-white font-extrabold py-4 px-6 rounded-2xl transition duration-300 flex items-center justify-center gap-2.5 cursor-pointer shadow-lg disabled:cursor-not-allowed"
              >
                <ShoppingCart size={18} />
                {product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>
              <button
                onClick={handleBuyNow}
                disabled={product.stock <= 0}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-700 disabled:to-gray-800 disabled:text-gray-500 text-black font-extrabold py-4 px-6 rounded-2xl transition duration-300 flex items-center justify-center gap-2.5 cursor-pointer shadow-lg shadow-green-500/10 disabled:cursor-not-allowed"
              >
                <Zap size={18} />
                {product.stock <= 0 ? 'Out of Stock' : 'Buy Now (1-Click)'}
              </button>
            </div>

          </motion.div>
        </div>

        {/* Detailed specifications tab strip */}
        <div className="mb-20 bg-neutral-900/60 border border-neutral-800 rounded-3xl p-8 shadow-2xl">
          <div className="flex border-b border-neutral-800 pb-4 mb-6 gap-6">
            {(['description', 'ingredients', 'usage'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-sm font-black uppercase tracking-wider pb-2 border-b-2 transition duration-300 cursor-pointer ${
                  activeTab === tab
                    ? 'border-green-500 text-white'
                    : 'border-transparent text-gray-500 hover:text-gray-300'
                }`}
              >
                {tab === 'description' ? 'Benefits & Info' : tab === 'ingredients' ? 'Ingredients' : 'Usage & Facts'}
              </button>
            ))}
          </div>

          <div className="min-h-[150px] leading-relaxed text-gray-400 font-medium">
            <AnimatePresence mode="wait">
              {activeTab === 'description' && (
                <motion.div
                  key="desc"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4 text-base"
                >
                  <p>Each batch of our formula is scientifically structured to maximize absorption and nutrient partitioning, leading to optimal muscle development and recovery metrics.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                    {product.benefits?.map((benefit, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-neutral-950 rounded-xl border border-neutral-850">
                        <div className="w-5 h-5 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
                          <Check size={12} className="text-green-500" />
                        </div>
                        <span className="text-sm font-bold text-white">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'ingredients' && (
                <motion.div
                  key="ingredients"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4 text-base"
                >
                  <p className="font-bold text-white mb-2">Purity and Transparency Assured:</p>
                  <div className="flex flex-wrap gap-2.5">
                    {product.ingredients?.map((ing, i) => (
                      <span key={i} className="bg-neutral-950 border border-neutral-800 text-gray-300 px-4 py-2 rounded-xl text-sm font-bold">
                        {ing}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-4 font-semibold">Manufactured in an ISO, GMP, and FSSAI certified facility to maintain 100% safety standards and avoid cross-contamination.</p>
                </motion.div>
              )}

              {activeTab === 'usage' && (
                <motion.div
                  key="usage"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4 text-base"
                >
                  <p className="font-bold text-white">Recommended Serving Guidelines:</p>
                  <p className="p-4 bg-neutral-950 border border-neutral-850 rounded-2xl text-gray-300 font-mono text-sm leading-relaxed">
                    {product.usage}
                  </p>
                  <p className="text-xs text-gray-500 font-semibold">Note: For optimal physiological results, pair with consistent physical resistance training and structured baseline hydration.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Dynamic review system section */}
        <div className="mb-20 grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          
          {/* Review scores card */}
          <div className="lg:col-span-1 bg-neutral-900/60 border border-neutral-800 rounded-3xl p-8 shadow-2xl">
            <h3 className="text-2xl font-black text-white mb-6">Athlete Reviews</h3>
            <div className="flex items-center gap-4 mb-6">
              <span className="text-6xl font-black text-green-500 font-mono">{product.rating}</span>
              <div>
                <div className="flex gap-0.5 mb-1">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      size={18} 
                      className={i < Math.floor(product.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-700'} 
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Based on {product.reviews} reviews</p>
              </div>
            </div>

            <button
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="w-full bg-green-500 hover:bg-green-600 text-black font-extrabold py-3.5 rounded-xl transition duration-300 flex items-center justify-center gap-2 cursor-pointer text-sm shadow-lg shadow-green-500/10"
            >
              <MessageSquarePlus size={16} />
              Write a Review
            </button>

            <AnimatePresence>
              {showReviewForm && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleAddReview}
                  className="space-y-4 mt-6 pt-6 border-t border-neutral-800 overflow-hidden"
                >
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">Review Details</h4>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase">Full Name</label>
                    <input
                      type="text"
                      required
                      value={reviewName}
                      onChange={(e) => setReviewName(e.target.value)}
                      placeholder="Your Name"
                      className="w-full bg-neutral-950 border border-neutral-850 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-700 focus:outline-none focus:border-green-500 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase">Rating</label>
                    <select
                      value={reviewRating}
                      onChange={(e) => setReviewRating(Number(e.target.value))}
                      className="w-full bg-neutral-950 border border-neutral-850 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500 font-bold"
                    >
                      <option value={5}>⭐⭐⭐⭐⭐ (5/5)</option>
                      <option value={4}>⭐⭐⭐⭐ (4/5)</option>
                      <option value={3}>⭐⭐⭐ (3/5)</option>
                      <option value={2}>⭐⭐ (2/5)</option>
                      <option value={1}>⭐ (1/5)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase">Headline</label>
                    <input
                      type="text"
                      required
                      value={reviewTitle}
                      onChange={(e) => setReviewTitle(e.target.value)}
                      placeholder="Mixes great, love the taste!"
                      className="w-full bg-neutral-950 border border-neutral-850 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-700 focus:outline-none focus:border-green-500 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase">Comments</label>
                    <textarea
                      required
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Write your experience..."
                      rows={3}
                      className="w-full bg-neutral-950 border border-neutral-850 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-700 focus:outline-none focus:border-green-500 resize-none font-medium"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-neutral-800 to-neutral-850 hover:bg-neutral-850 text-white font-bold py-2.5 rounded-lg text-xs border border-neutral-750 transition cursor-pointer"
                  >
                    Submit Review
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          {/* Reviews list */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-xl font-bold text-white mb-6 uppercase tracking-wider">Athlete Feedback ({reviewsList.length})</h3>
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {reviewsList.map((review, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 shadow-md"
                >
                  <div className="flex justify-between items-start mb-3.5">
                    <div>
                      <h4 className="font-extrabold text-white text-base mb-1">{review.title}</h4>
                      <div className="flex items-center gap-2">
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, idx) => (
                            <Star 
                              key={idx} 
                              size={12} 
                              className={idx < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-700'} 
                            />
                          ))}
                        </div>
                        <span className="text-[10px] text-gray-500 font-bold">{review.date}</span>
                      </div>
                    </div>
                    {review.verified && (
                      <span className="bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                        ✓ Athlete Verified
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400 font-medium leading-relaxed mb-3">{review.comment}</p>
                  <p className="text-xs text-gray-500 font-bold">— {review.name}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Related Products Strip */}
        {relatedProducts.length > 0 && (
          <div>
            <h3 className="text-3xl font-black text-white mb-10 flex items-center gap-2.5">
              <Zap className="text-green-500" />
              Related Products
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {relatedProducts.map((p) => (
                <motion.div
                  key={p.id}
                  whileHover={{ y: -8 }}
                  className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col justify-between"
                >
                  {/* Visual */}
                  <div className="relative h-56 bg-neutral-950 flex items-center justify-center p-4">
                    <Image src={p.images?.[0] || '/products/placeholder.jpg'} alt={p.name} fill className="object-contain p-6" />
                    
                    {p.stock <= 0 && (
                      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center">
                        <span className="bg-red-600 text-white font-extrabold text-[10px] px-3 py-1.5 rounded-full uppercase tracking-wider">
                          Out of Stock
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-extrabold text-white text-lg mb-2 line-clamp-1">{p.name}</h4>
                      <p className="text-xs text-gray-500 font-bold mb-4 uppercase tracking-wider">{p.category}</p>
                      <p className="text-sm text-gray-400 line-clamp-2 mb-4 font-medium">{p.description}</p>
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-neutral-800 mt-4">
                      <span className="text-xl font-black text-green-500 font-mono">₹{p.price.toLocaleString()}</span>
                      <Link href={`/products/${p.id}`}>
                        <button className="bg-neutral-800 hover:bg-neutral-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition duration-300 cursor-pointer">
                          View Product
                        </button>
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

      </div>

      <Footer />
    </main>
  );
}
