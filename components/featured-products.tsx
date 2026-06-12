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
                  whileHover={{ y: -6, transition: { duration: 0.22 } }}
                  className="group bg-white border border-gray-100 hover:border-green-200 rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_48px_rgba(0,0,0,0.1)] transition-all duration-300 flex flex-col"
                >
                  {/* Image */}
                  <div
                    className="relative w-full aspect-square bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden cursor-pointer flex-shrink-0"
                    onClick={() => router.push(`/products/${product.sku || product.id}`)}
                  >
                    <Image
                      src={product.images?.[0] || '/products/placeholder.jpg'}
                      alt={product.name}
                      fill
                      className="object-contain p-5 group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Badges */}
                    <div className="absolute top-3 left-3 right-3 flex items-start justify-between z-10">
                      {hasDiscount ? (
                        <span className="bg-red-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-sm">
                          {product.discountPercent}% OFF
                        </span>
                      ) : (
                        product.stock > 0 && (
                          <span className="bg-green-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-sm shadow-green-500/30">
                            Bestseller
                          </span>
                        )
                      )}
                      {product.stock <= 0 && (
                        <span className="bg-gray-800 text-white text-[10px] font-black px-2.5 py-1 rounded-full ml-auto">
                          Out of Stock
                        </span>
                      )}
                    </div>

                    {/* Hover CTA */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100 z-20">
                      <span className="bg-white/90 backdrop-blur-sm text-gray-900 text-sm font-bold px-5 py-2 rounded-full shadow-md flex items-center gap-2">
                        <Eye size={14} /> View Details
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="cursor-pointer flex-1" onClick={() => router.push(`/products/${product.sku || product.id}`)}>
                      {product.category && (
                        <span className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-1 block">{product.category}</span>
                      )}
                      <h3 className="text-base font-black text-gray-900 mb-2 leading-snug line-clamp-2 group-hover:text-green-700 transition-colors">{product.name}</h3>
                      <p className="text-gray-400 text-xs mb-3 line-clamp-2 leading-relaxed">{product.shortDescription || product.description}</p>

                      {/* Nutrition chips */}
                      {(product.nutritionOptions?.length ?? 0) > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {product.nutritionOptions?.slice(0, 3).map((opt, i) => {
                            const Icon = iconForNutrition(opt.name);
                            return (
                              <div key={i} className="flex items-center gap-1 bg-green-50 border border-green-100 px-2 py-0.5 rounded-md">
                                <Icon size={10} className="text-green-600" />
                                <span className="text-[10px] font-black text-green-700 whitespace-nowrap">
                                  {opt.quantity}{opt.unit} <span className="text-gray-500 font-semibold uppercase">{opt.name}</span>
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Flavor pills */}
                    {(product.flavors?.length ?? 0) > 0 && (
                      <div className="mb-4">
                        <p className="text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest">Flavor</p>
                        <div className="flex flex-wrap gap-1.5">
                          {product.flavors.map((flavor) => {
                            const isSel = selectedFlavor === flavor;
                            return (
                              <button key={flavor}
                                onClick={(e) => { e.stopPropagation(); setSelectedFlavors({ ...selectedFlavors, [product.sku || product.id]: flavor }); }}
                                disabled={product.stock <= 0}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition border cursor-pointer ${
                                  isSel
                                    ? 'bg-green-500 text-white border-green-500 shadow-sm'
                                    : 'bg-white text-gray-600 border-gray-200 hover:border-green-300 hover:text-green-700 hover:bg-green-50'
                                }`}
                              >{flavor}</button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Price + CTA */}
                    <div className="pt-4 border-t border-gray-100 flex items-end justify-between gap-3">
                      <div>
                        <div className="flex items-baseline gap-1.5 flex-wrap">
                          <span className="text-2xl font-black text-green-600">₹{product.price.toLocaleString()}</span>
                          {hasDiscount && <span className="text-xs text-gray-400 line-through">₹{product.originalMrp!.toLocaleString()}</span>}
                        </div>
                        {hasDiscount && (
                          <span className="text-[10px] font-black text-green-600">
                            Save ₹{(product.originalMrp! - product.price).toLocaleString()}
                          </span>
                        )}
                      </div>
                      <motion.button
                        whileHover={product.stock > 0 ? { scale: 1.04 } : {}}
                        whileTap={product.stock > 0 ? { scale: 0.96 } : {}}
                        disabled={product.stock <= 0}
                        onClick={(e) => { e.stopPropagation(); handleAddToCart(product, selectedFlavor || product.flavors?.[0]); }}
                        className="flex-shrink-0 flex items-center gap-1.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-200 disabled:to-gray-300 disabled:text-gray-400 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-xl font-bold text-sm transition shadow-[0_4px_12px_rgba(0,200,83,0.25)] hover:shadow-[0_8px_20px_rgba(0,200,83,0.35)] cursor-pointer"
                      >
                        <ShoppingCart size={15} />
                        {product.stock <= 0 ? 'Sold Out' : 'Add'}
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
