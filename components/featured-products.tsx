'use client';

import { useEffect, useState } from 'react';
import { fetchFeaturedProducts, DbProduct } from '@/lib/db-products';
import { motion, type Variants } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Eye, Star, Zap, Dumbbell, Flame, Scale, Activity, Check } from 'lucide-react';
import { useCartStore } from '@/lib/store';
import Image from 'next/image';
import toast from 'react-hot-toast';

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
    if (product.stock <= 0) {
      toast.error('This product is out of stock!');
      return;
    }
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' as const },
    },
  };

  return (
    <section className="py-24 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-full px-6 py-3 mb-6">
            <Zap size={16} className="text-green-600" />
            <span className="text-green-600 font-semibold text-sm">BESTSELLING PRODUCTS</span>
          </div>
          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Premium Nutrition <br />
            <span className="bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent">
              For Champions
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Trusted by over 100,000 athletes and fitness enthusiasts. Discover products designed for performance.
          </p>
        </motion.div>

        {/* Loading Skeletons */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-lg p-6 space-y-4 animate-pulse">
                <div className="h-64 bg-gray-200 rounded-xl w-full"></div>
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-10 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        ) : featuredProducts.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            <p className="text-lg font-semibold">No products found. Please check back later!</p>
          </div>
        ) : (
          /* Products Grid */
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16"
          >
            {featuredProducts.map((product, idx) => (
              <motion.div
                key={product.id}
                variants={itemVariants}
                whileHover={{ y: -8 }}
                className="group bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col justify-between"
              >
                <div 
                  className="relative w-full aspect-square bg-gradient-to-br from-gray-50 to-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center cursor-pointer"
                  onClick={() => router.push(`/products/${product.sku || product.id}`)}
                >
                  <Image
                    src={product.images?.[0] || '/products/placeholder.jpg'}
                    alt={product.name}
                    fill
                    className="object-contain p-2 group-hover:scale-105 transition-transform duration-500"
                  />
                  
                  {/* Out of Stock Overlay */}
                  {product.stock <= 0 && (
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center z-10">
                      <span className="bg-red-600 text-white font-extrabold text-xs px-4 py-2 rounded-full uppercase tracking-wider shadow-lg">
                        Out of Stock
                      </span>
                    </div>
                  )}

                  {/* Bestseller Badge */}
                  {product.stock > 0 && (
                    <div className="absolute top-4 right-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1 md:px-4 md:py-1.5 rounded-full text-[10px] md:text-xs font-bold shadow-lg">
                      Bestseller
                    </div>
                  )}

                  {/* SKU / ID Badge */}
                  <div className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-md text-gray-300 px-2 py-1 rounded text-[9px] font-mono tracking-widest uppercase border border-white/10 shadow-sm z-20">
                    {product.sku ? `SKU: ${product.sku}` : `ID: ${product.id.slice(0, 6)}`}
                  </div>

                  {/* Overlay on Hover */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300 z-10 pointer-events-none"></div>
                </div>

                {/* Product Info */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div className="cursor-pointer" onClick={() => router.push(`/products/${product.sku || product.id}`)}>
                    {/* Product Name */}
                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">{product.name}</h3>

                    {/* Description */}
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{product.shortDescription || product.description}</p>

                    {/* Nutrition Options */}
                    {(product.nutritionOptions?.length ?? 0) > 0 && (
                      <div className="mb-4 flex flex-wrap gap-2">
                        {product.nutritionOptions?.slice(0, 4).map((opt, idx) => {
                          let LogoIcon = Check;
                          const name = opt.name.toLowerCase();
                          if (name.includes('protein')) LogoIcon = Dumbbell;
                          else if (name.includes('carb')) LogoIcon = Scale;
                          else if (name.includes('fat') || name.includes('cal')) LogoIcon = Flame;
                          else if (name.includes('vit')) LogoIcon = Activity;

                          return (
                            <div key={idx} className="flex items-center gap-1.5 bg-green-50 border border-green-100 px-2 py-1 rounded-md" title={opt.basis === 'per_serving' ? 'Per Serving' : opt.basis === 'per_100g' ? 'Per 100g' : 'Per Gram'}>
                              <LogoIcon size={12} className="text-green-600" />
                              <span className="text-[10px] font-black text-green-700 whitespace-nowrap">
                                {opt.quantity}<span className="text-xs">{opt.unit}</span> <span className="text-gray-500 font-bold uppercase">{opt.name}</span>
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Flavor Selector (Pills) */}
                    {(product.flavors?.length ?? 0) > 0 && (
                      <div className="mb-5">
                        <p className="text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Flavor:</p>
                        <div className="flex flex-wrap gap-2">
                          {product.flavors.map((flavor) => {
                            const isSelected = (selectedFlavors[product.sku || product.id] || product.flavors[0]) === flavor;
                            return (
                              <button
                                key={flavor}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedFlavors({ ...selectedFlavors, [product.sku || product.id]: flavor });
                                }}
                                disabled={product.stock <= 0}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold transition border cursor-pointer ${
                                  isSelected 
                                    ? 'bg-green-500 text-white border-green-500 shadow-md' 
                                    : 'bg-white text-gray-600 border-gray-200 hover:border-green-300'
                                }`}
                              >
                                {flavor}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Price and Actions */}
                  <div className="flex flex-col pt-4 border-t border-gray-200 mt-4 gap-4">
                    <div>
                      {product.originalMrp && product.discountPercent && product.discountPercent > 0 ? (
                        <div className="space-y-1">
                          <div className="flex items-baseline gap-2 flex-wrap">
                            <span className="text-2xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                              ₹{product.price.toLocaleString()}
                            </span>
                            <span className="text-sm text-gray-400 line-through">
                              ₹{product.originalMrp.toLocaleString()}
                            </span>
                          </div>
                          <span className="inline-block text-[10px] font-extrabold bg-green-500/10 border border-green-500/20 text-green-600 px-2 py-0.5 rounded-md">
                            {product.discountPercent}% OFF
                          </span>
                        </div>
                      ) : (
                        <p className="text-3xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                          ₹{product.price.toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="w-full">
                      <motion.button
                        whileHover={product.stock > 0 ? { scale: 1.02 } : {}}
                        whileTap={product.stock > 0 ? { scale: 0.98 } : {}}
                        disabled={product.stock <= 0}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(product, selectedFlavors[product.sku || product.id] || product.flavors[0]);
                        }}
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 disabled:text-gray-300 disabled:cursor-not-allowed text-white px-4 py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                      >
                        <ShoppingCart className="w-5 h-5" />
                        {product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* View All Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-center"
        >
          <Link href="/products" className="inline-block group">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-10 py-4 rounded-xl font-bold text-lg transition shadow-lg group-hover:shadow-xl cursor-pointer"
            >
              View All Premium Products
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
