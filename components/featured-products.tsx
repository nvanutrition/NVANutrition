'use client';

import { useEffect, useState } from 'react';
import { fetchFeaturedProducts, DbProduct } from '@/lib/db-products';
import { motion, type Variants } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShoppingCart, Eye, Zap, Dumbbell, Flame,
  Scale, Activity, Check, ArrowRight, Star, Package
} from 'lucide-react';
import { useCartStore } from '@/lib/store';
import Image from 'next/image';
import toast from 'react-hot-toast';

const iconForNutrition = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('protein')) return Dumbbell;
  if (n.includes('carb')) return Scale;
  if (n.includes('fat') || n.includes('cal')) return Flame;
  if (n.includes('vit')) return Activity;
  return Check;
};

export function FeaturedProductsSection() {
  const [featuredProducts, setFeaturedProducts] = useState<DbProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFlavors, setSelectedFlavors] = useState<Record<string, string>>({});
  const addItem = useCartStore((state) => state.addItem);
  const router = useRouter();

  useEffect(() => {
    async function loadProducts() {
      try {
        const dbProducts = await fetchFeaturedProducts();
        setFeaturedProducts(dbProducts.slice(0, 6));
      } catch (error) {
        console.error('Error loading featured products:', error);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

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

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 28 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' as const } },
  };

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-5 py-2 mb-5">
            <Zap size={14} className="text-green-600" />
            <span className="text-green-700 font-black text-xs uppercase tracking-widest">Bestselling Products</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 leading-tight">
            Premium Nutrition<br />
            <span className="bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent">
              For Champions
            </span>
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Trusted by over 100,000 athletes and fitness enthusiasts. Discover products engineered for results.
          </p>
        </motion.div>

        {/* Loading Skeletons */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-50 border border-gray-100 rounded-2xl p-5 space-y-4 animate-pulse">
                <div className="h-56 bg-gray-200 rounded-xl w-full" />
                <div className="h-5 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="h-11 bg-gray-200 rounded-xl w-full" />
              </div>
            ))}
          </div>
        ) : featuredProducts.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-2xl border border-gray-200 mb-12">
            <Package size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-semibold">No featured products yet.</p>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
          >
            {featuredProducts.map((product, idx) => {
              const selectedFlavor = selectedFlavors[product.sku || product.id] || product.flavors?.[0];
              const hasDiscount = !!(product.originalMrp && product.discountPercent && product.discountPercent > 0);

              return (
                <motion.div
                  key={product.id}
                  variants={itemVariants}
                  className="bg-white rounded-[2rem] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-[0_20px_50px_rgba(16,185,129,0.15)] border border-gray-100 hover:border-emerald-300 transition-all duration-500 group flex flex-col relative"
                >
                  {/* Image */}
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

                    {/* Badges */}
                    <div className="absolute top-4 left-4 right-4 flex items-start justify-between z-10">
                      {hasDiscount ? (
                        <span className="bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg shadow-rose-500/30 uppercase tracking-widest border border-rose-400">
                          {product.discountPercent}% OFF
                        </span>
                      ) : (
                        product.stock > 0 && (
                          <span className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg shadow-emerald-500/30 uppercase tracking-widest border border-emerald-400">
                            Bestseller
                          </span>
                        )
                      )}
                      {product.stock <= 0 && (
                        <span className="bg-red-50 text-red-700 border border-red-200 text-[10px] font-black px-2.5 py-1 rounded-full ml-auto shadow-sm uppercase tracking-widest">
                          Out of Stock
                        </span>
                      )}
                    </div>

                    {/* Hover CTA */}
                    <div className="absolute inset-0 bg-white/20 backdrop-blur-[1px] transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100 z-20">
                      <span className="bg-black/90 text-white text-[11px] uppercase tracking-widest font-black px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 border border-white/20 backdrop-blur-md">
                        <Eye size={14} className="text-emerald-400" /> View Details
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 flex-1 flex flex-col relative z-30 bg-white">
                    <div className="cursor-pointer flex-1" onClick={() => router.push(`/products/${product.sku || product.id}`)}>
                      {product.category && (
                        <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md uppercase tracking-widest mb-3 inline-block border border-emerald-100">{product.category}</span>
                      )}
                      <h3 className="text-lg font-black text-gray-900 mb-2 leading-snug line-clamp-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-emerald-600 group-hover:to-teal-600 transition-all duration-300">{product.name}</h3>
                      <p className="text-gray-500 text-xs mb-4 line-clamp-2 leading-relaxed font-medium">{product.shortDescription || product.description}</p>

                      {/* Nutrition chips */}
                      {(product.nutritionOptions?.length ?? 0) > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {product.nutritionOptions?.slice(0, 3).map((opt, i) => {
                            const Icon = iconForNutrition(opt.name);
                            return (
                              <div key={i} className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-lg group-hover:border-emerald-100 group-hover:bg-emerald-50/30 transition-colors duration-300">
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

                    {/* Flavor pills */}
                    {(product.flavors?.length ?? 0) > 0 && (
                      <div className="mb-5 pt-2">
                        <p className="text-[9px] font-black text-gray-400 mb-2 uppercase tracking-widest">Select Flavor</p>
                        <div className="flex flex-wrap gap-2">
                          {product.flavors.map((flavor) => {
                            const isSel = selectedFlavor === flavor;
                            return (
                              <button key={flavor}
                                onClick={(e) => { e.stopPropagation(); setSelectedFlavors({ ...selectedFlavors, [product.sku || product.id]: flavor }); }}
                                disabled={product.stock <= 0}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border cursor-pointer ${
                                  isSel
                                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20'
                                    : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300 hover:text-emerald-700 shadow-sm'
                                }`}
                              >{flavor}</button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Price + CTA */}
                    <div className="pt-5 border-t border-gray-50 flex items-end justify-between gap-3 mt-auto">
                      <div>
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="text-2xl font-black text-emerald-700 font-mono tracking-tight drop-shadow-sm group-hover:text-emerald-600 transition-colors">₹{product.price.toLocaleString()}</span>
                          {hasDiscount && <span className="text-sm text-gray-400 line-through font-semibold font-mono">₹{product.originalMrp!.toLocaleString()}</span>}
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
                        onClick={(e) => { e.stopPropagation(); handleAddToCart(product, selectedFlavor || product.flavors?.[0]); }}
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

        {/* View All CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Link href="/products">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-10 py-4 rounded-xl font-black text-base transition shadow-[0_8px_24px_rgba(0,200,83,0.3)] hover:shadow-[0_14px_36px_rgba(0,200,83,0.4)] inline-flex items-center gap-3 cursor-pointer"
            >
              View All Premium Products <ArrowRight size={18} />
            </motion.button>
          </Link>
          <p className="text-gray-400 text-sm mt-3 font-medium">Free shipping on orders above ₹999</p>
        </motion.div>
      </div>
    </section>
  );
}
