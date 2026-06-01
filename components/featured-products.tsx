'use client';

import { useEffect, useState } from 'react';
import { fetchFeaturedProducts, DbProduct } from '@/lib/db-products';
import { motion, type Variants } from 'framer-motion';
import Link from 'next/link';
import { ShoppingCart, Eye, Star, Zap } from 'lucide-react';
import { useCartStore } from '@/lib/store';
import Image from 'next/image';
import toast from 'react-hot-toast';

export function FeaturedProductsSection() {
  const [featuredProducts, setFeaturedProducts] = useState<DbProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFlavors, setSelectedFlavors] = useState<Record<string, string>>({});
  const addItem = useCartStore((state) => state.addItem);

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
      id: product.id,
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
                {/* Product Image Container */}
                <div className="relative h-64 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                  <Image
                    src={product.images?.[0] || '/products/placeholder.jpg'}
                    alt={product.name}
                    fill
                    className="object-contain p-4 group-hover:scale-110 transition-transform duration-500"
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
                    <motion.div
                      initial={{ x: -20, opacity: 0 }}
                      whileInView={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="absolute top-4 right-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg"
                    >
                      Bestseller
                    </motion.div>
                  )}

                  {/* Overlay on Hover */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300"></div>
                </div>

                {/* Product Info */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Rating */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={14}
                            className={i < Math.floor(product.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-bold text-gray-600">({product.reviews} reviews)</span>
                    </div>

                    {/* Product Name */}
                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">{product.name}</h3>

                    {/* Description */}
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{product.description}</p>

                    {/* Benefits */}
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2">
                        {product.benefits.slice(0, 2).map((benefit, i) => (
                          <motion.span
                            key={i}
                            initial={{ opacity: 0, scale: 0.8 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.1 }}
                            className="text-xs font-semibold bg-green-100 text-green-700 px-3 py-1 rounded-full animate-scaleIn"
                          >
                            ✓ {benefit}
                          </motion.span>
                        ))}
                      </div>
                    </div>

                    {/* Flavor Selector */}
                    {product.flavors.length > 0 && (
                      <div className="mb-4">
                        <label className="text-xs font-semibold text-gray-700 mb-2 block">Choose Flavor</label>
                        <select
                          value={selectedFlavors[product.id] || product.flavors[0]}
                          onChange={(e) => setSelectedFlavors({ ...selectedFlavors, [product.id]: e.target.value })}
                          className="w-full px-3 py-2 border-2 border-gray-300 hover:border-green-400 focus:border-green-500 rounded-lg text-sm font-medium transition focus:outline-none bg-white text-gray-900"
                          disabled={product.stock <= 0}
                        >
                          {product.flavors.map((flavor) => (
                            <option key={flavor} value={flavor}>
                              {flavor}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Price and Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 mt-4">
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
                    <div className="flex gap-2">
                      <Link href={`/products/${product.id}`}>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          className="p-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition cursor-pointer"
                        >
                          <Eye className="w-5 h-5 text-gray-700" />
                        </motion.button>
                      </Link>
                      <motion.button
                        whileHover={product.stock > 0 ? { scale: 1.05 } : {}}
                        whileTap={product.stock > 0 ? { scale: 0.95 } : {}}
                        disabled={product.stock <= 0}
                        onClick={() => handleAddToCart(product, selectedFlavors[product.id] || product.flavors[0])}
                        className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 disabled:text-gray-300 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg font-bold transition flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                      >
                        <ShoppingCart className="w-5 h-5" />
                        {product.stock <= 0 ? 'Out' : 'Add'}
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
