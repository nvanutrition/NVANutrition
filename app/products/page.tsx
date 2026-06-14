'use client';

import { useEffect, useState } from 'react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { fetchDbProducts, DbProduct } from '@/lib/db-products';
import { categories } from '@/lib/products';
import { useCartStore } from '@/lib/store';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShoppingCart, Eye, Filter, Grid3X3, Dumbbell,
  Zap, Activity, Flame, Check, Scale, Star, Package,
  ArrowRight, SlidersHorizontal, Tag
} from 'lucide-react';
import toast from 'react-hot-toast';

const iconForNutrition = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('protein')) return Dumbbell;
  if (n.includes('carb')) return Scale;
  if (n.includes('fat') || n.includes('cal')) return Flame;
  if (n.includes('vit')) return Activity;
  return Check;
};

export default function ProductsPage() {
  const [productsList, setProductsList] = useState<DbProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All Products');
  const [selectedFlavors, setSelectedFlavors] = useState<Record<string, string>>({});
  const addItem = useCartStore((state) => state.addItem);
  const router = useRouter();

  useEffect(() => {
    async function loadProducts() {
      try {
        const dbProducts = await fetchDbProducts();
        setProductsList(dbProducts);
      } catch (error) {
        console.error('Error loading products catalog:', error);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  const filteredProducts = selectedCategory === 'All Products'
    ? productsList
    : productsList.filter((p) => p.category === selectedCategory);

  const handleAddToCart = (product: DbProduct, flavor: string) => {
    if (product.stock <= 0) { toast.error('This product is out of stock!'); return; }
    addItem({
      id: product.sku || product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      flavor: flavor || product.flavors[0],
      image: product.images?.[0] || '/products/placeholder.jpg',
    });
    toast.success(`${product.name} added to cart!`);
  };

  return (
    <main className="bg-gray-50 min-h-screen">
      <Navbar />
      <div className="pt-16">

        {/* ── Hero Banner ── */}
        <section className="relative bg-gradient-to-br from-green-700 via-emerald-700 to-green-900 py-20 overflow-hidden">
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/5 rounded-full" />
          <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-white/5 rounded-full" />
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-5 py-2 mb-6">
                <Tag size={14} className="text-green-300" />
                <span className="text-green-200 text-xs font-black uppercase tracking-widest">Premium Selection</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-black text-white mb-4 leading-tight">
                Our <span className="text-green-300">Products</span>
              </h1>
              <p className="text-green-100 text-lg max-w-xl font-medium">
                Scientifically formulated supplements designed for peak performance. Lab tested. Results guaranteed.
              </p>
              <div className="mt-8 flex flex-wrap gap-6">
                {[
                  { value: '100K+', label: 'Happy Athletes' },
                  { value: 'Lab', label: 'Tested Every Batch' },
                  { value: 'FSSAI', label: 'Certified & Safe' },
                  { value: 'GMP', label: 'Certified Facility' },
                ].map(item => (
                  <div key={item.label} className="text-center">
                    <p className="text-2xl font-black text-white">{item.value}</p>
                    <p className="text-green-200 text-xs font-medium">{item.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

          {/* ── Sticky Filter Bar ── */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
            <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.07)] border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-green-50 border border-green-200 rounded-lg flex items-center justify-center">
                  <SlidersHorizontal size={15} className="text-green-600" />
                </div>
                <span className="text-sm font-black text-gray-700 uppercase tracking-wider">Filter by Category</span>
                <span className="ml-auto text-xs text-gray-400 font-medium bg-gray-100 px-3 py-1 rounded-full">
                  {filteredProducts.length} products
                  </span>
                </div>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <motion.button
                    key={category}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      setSelectedCategory(category);
                    }}
                    className={`px-5 py-2 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                      selectedCategory === category
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-[0_4px_12px_rgba(0,200,83,0.3)]'
                        : 'bg-gray-50 text-gray-600 hover:bg-green-50 hover:text-green-700 border border-gray-200 hover:border-green-200'
                    }`}
                  >
                    {category}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* ── Catalog Grid ── */}
          <AnimatePresence mode="wait">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl p-5 space-y-4 animate-pulse shadow-sm border border-gray-100">
                    <div className="h-64 bg-gray-100 rounded-xl w-full" />
                    <div className="h-5 bg-gray-100 rounded w-3/4" />
                    <div className="h-4 bg-gray-100 rounded w-1/2" />
                    <div className="h-11 bg-gray-100 rounded-xl w-full" />
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-center py-24 bg-white rounded-2xl border border-gray-200 shadow-sm"
              >
                <Package size={52} className="mx-auto text-gray-200 mb-4" />
                <p className="text-gray-500 text-lg font-semibold">No products found in this category.</p>
                <button
                  onClick={() => setSelectedCategory('All Products')}
                  className="mt-4 text-green-600 text-sm font-bold hover:underline"
                >
                  Show all products →
                </button>
              </motion.div>
            ) : (
              <motion.div
                key={selectedCategory}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {filteredProducts.map((product, index) => {
                  const selectedFlavor = selectedFlavors[product.sku || product.id] || product.flavors?.[0];
                  const hasDiscount = !!(product.originalMrp && product.discountPercent && product.discountPercent > 0);

                  return (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.06 }}
                      className="bg-white rounded-[2rem] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-[0_20px_50px_rgba(16,185,129,0.15)] border border-gray-100 hover:border-emerald-300 transition-all duration-500 group flex flex-col relative"
                    >
                      {/* Image area */}
                      <div
                        className="relative w-full aspect-[4/3] bg-gradient-to-br from-emerald-50/50 via-teal-50/30 to-white border-b border-gray-50 overflow-hidden cursor-pointer flex-shrink-0 flex items-center justify-center p-4 group-hover:bg-gradient-to-br group-hover:from-emerald-100/50 group-hover:via-teal-50/50 transition-colors duration-500"
                        onClick={() => router.push(`/products/${product.sku || product.id}`)}
                      >
                        <Image
                          src={product.images?.[0] || '/products/placeholder.jpg'}
                          alt={product.name}
                          fill
                          className="object-contain p-2 mix-blend-multiply drop-shadow-xl group-hover:scale-110 group-hover:-translate-y-2 transition-transform duration-700 ease-out"
                        />

                        {/* Top badges row */}
                        <div className="absolute top-4 left-4 right-4 flex items-start justify-between z-10">
                          {hasDiscount && (
                            <span className="bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg shadow-rose-500/30 uppercase tracking-widest border border-rose-400">
                              {product.discountPercent}% OFF
                            </span>
                          )}
                          {product.stock <= 0 ? (
                            <span className="bg-red-50 text-red-700 border border-red-200 text-[10px] font-black px-2.5 py-1 rounded-full ml-auto shadow-sm uppercase tracking-widest">
                              Out of Stock
                            </span>
                          ) : product.stock <= 10 ? (
                            <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-black px-2.5 py-1 rounded-full ml-auto shadow-sm uppercase tracking-widest animate-pulse">
                              Only {product.stock} Left
                            </span>
                          ) : null}
                        </div>

                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-white/20 backdrop-blur-[1px] transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100 z-20">
                          <span className="bg-black/90 text-white text-[11px] uppercase tracking-widest font-black px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 border border-white/20 backdrop-blur-md">
                            <Eye size={14} className="text-emerald-400" /> View Details
                          </span>
                        </div>
                      </div>

                      {/* Content area */}
                      <div className="p-6 flex-1 flex flex-col relative z-30 bg-white">
                        <div
                          className="cursor-pointer flex-1"
                          onClick={() => router.push(`/products/${product.sku || product.id}`)}
                        >
                          {/* Category chip */}
                          {product.category && (
                            <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md uppercase tracking-widest mb-3 inline-block border border-emerald-100">
                              {product.category}
                            </span>
                          )}

                          <h3 className="text-lg font-black text-gray-900 mb-2 leading-snug line-clamp-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-emerald-600 group-hover:to-teal-600 transition-all duration-300">
                            {product.name}
                          </h3>

                          <p className="text-gray-500 text-xs mb-4 line-clamp-2 leading-relaxed font-medium">
                            {product.shortDescription || product.description}
                          </p>

                          {/* Nutrition chips */}
                          {(product.nutritionOptions?.length ?? 0) > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                              {product.nutritionOptions?.slice(0, 3).map((opt, idx) => {
                                const Icon = iconForNutrition(opt.name);
                                return (
                                  <div key={idx} className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-lg group-hover:border-emerald-100 group-hover:bg-emerald-50/30 transition-colors duration-300">
                                    <Icon size={12} className="text-emerald-500" />
                                    <span className="text-[10px] font-black text-gray-900 whitespace-nowrap">
                                      {opt.quantity}{opt.unit} <span className="text-gray-500 font-bold uppercase">{opt.name}</span>
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Flavor selector */}
                        {(product.flavors?.length ?? 0) > 0 && (
                          <div className="mb-5 pt-2">
                            <p className="text-[9px] font-black text-gray-400 mb-2 uppercase tracking-widest">Select Flavor</p>
                            <div className="flex flex-wrap gap-2">
                              {product.flavors.map((flavor) => {
                                const isSel = selectedFlavor === flavor;
                                return (
                                  <button
                                    key={flavor}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedFlavors({ ...selectedFlavors, [product.sku || product.id]: flavor });
                                    }}
                                    disabled={product.stock <= 0}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border cursor-pointer ${
                                      isSel
                                        ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20'
                                        : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300 hover:text-emerald-700 shadow-sm'
                                    }`}
                                  >
                                    {flavor}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Price + CTA row */}
                        <div className="pt-5 border-t border-gray-50 flex items-end justify-between gap-3 mt-auto">
                          <div>
                            <div className="flex items-baseline gap-2 flex-wrap">
                              <span className="text-2xl font-black text-emerald-700 font-mono tracking-tight drop-shadow-sm group-hover:text-emerald-600 transition-colors">
                                ₹{product.price.toLocaleString()}
                              </span>
                              {hasDiscount && (
                                <span className="text-sm text-gray-400 line-through font-semibold font-mono">
                                  ₹{product.originalMrp!.toLocaleString()}
                                </span>
                              )}
                            </div>
                            {hasDiscount && (
                              <span className="text-[10px] font-black text-emerald-600/80 uppercase tracking-wider mt-0.5 block flex items-center gap-1">
                                <Zap size={10} className="text-amber-500" /> Save ₹{(product.originalMrp! - product.price).toLocaleString()}
                              </span>
                            )}
                          </div>
                          <motion.button
                            whileHover={product.stock > 0 ? { scale: 1.08, rotate: -2 } : {}}
                            whileTap={product.stock > 0 ? { scale: 0.92 } : {}}
                            disabled={product.stock <= 0}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToCart(product, selectedFlavor || product.flavors?.[0]);
                            }}
                            className="flex-shrink-0 flex items-center justify-center w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 disabled:from-gray-100 disabled:to-gray-200 disabled:text-gray-400 disabled:shadow-none text-white rounded-[1rem] font-bold transition-all duration-300 shadow-lg shadow-emerald-500/30 cursor-pointer group-hover:shadow-emerald-500/50"
                          >
                            <ShoppingCart size={18} />
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Bottom CTA ── */}
          {!loading && filteredProducts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-16 bg-gradient-to-r from-green-600 to-emerald-700 rounded-3xl p-10 text-center text-white relative overflow-hidden shadow-[0_20px_60px_rgba(0,200,83,0.2)]"
            >
              <div className="absolute inset-0 opacity-10"
                style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
              <div className="relative z-10">
                <h2 className="text-3xl font-black mb-2">Can't find what you need?</h2>
                <p className="text-green-100 mb-6">Contact us directly and our nutrition experts will help you.</p>
                <Link href="/contact">
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    className="bg-white text-green-700 px-8 py-3.5 rounded-xl font-bold text-sm shadow-lg transition flex items-center gap-2 mx-auto">
                    Talk to an Expert <ArrowRight size={16} />
                  </motion.button>
                </Link>
              </div>
            </motion.div>
          )}
        </div>
      </div>
      <Footer />
    </main>
  );
}
