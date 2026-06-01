'use client';

import { useEffect, useState } from 'react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { fetchDbProducts, DbProduct } from '@/lib/db-products';
import { categories } from '@/lib/products';
import { useCartStore } from '@/lib/store';
import Image from 'next/image';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ShoppingCart, Eye, Filter, Grid3X3, BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProductsPage() {
  const [productsList, setProductsList] = useState<DbProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All Products');
  const [selectedFlavors, setSelectedFlavors] = useState<Record<string, string>>({});
  const addItem = useCartStore((state) => state.addItem);

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

  return (
    <main>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-16"
          >
            <div className="flex items-start justify-between">
              <div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-full px-6 py-3 mb-6"
                >
                  <BarChart3 size={18} className="text-green-600" />
                  <span className="text-green-600 font-bold text-sm">PREMIUM SELECTION</span>
                </motion.div>
                <h1 className="text-6xl font-black text-gray-900 mb-4">Our Products</h1>
                <p className="text-xl text-gray-600 max-w-2xl">
                  Premium nutrition for premium results. Explore our complete range of scientifically formulated supplements designed for maximum performance.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Category Filter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-12"
          >
            <div className="flex items-center gap-4 mb-6">
              <Filter size={24} className="text-gray-700" />
              <h3 className="text-xl font-bold text-gray-900">Filter by Category</h3>
            </div>
            <div className="flex flex-wrap gap-3">
              {categories.map((category, idx) => (
                <motion.button
                  key={category}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => {
                    setSelectedCategory(category);
                    toast.success(`Showing ${category}`);
                  }}
                  className={`px-6 py-3 rounded-xl font-bold transition shadow-md cursor-pointer ${
                    selectedCategory === category
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg'
                      : 'bg-white text-gray-900 hover:bg-gray-100 border-2 border-gray-200'
                  }`}
                >
                  {category}
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Products Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mb-8 flex items-center gap-3 text-gray-600 font-semibold"
          >
            <Grid3X3 size={20} className="text-green-600" />
            <span>{filteredProducts.length} products found</span>
          </motion.div>

          {/* Catalog Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white border-2 border-gray-100 rounded-2xl p-6 space-y-4 animate-pulse">
                  <div className="h-80 bg-gray-200 rounded-xl w-full"></div>
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-10 bg-gray-200 rounded w-full"></div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl shadow">
              <p className="text-gray-500 text-lg font-semibold">No products found in this category.</p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {filteredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.08 }}
                  whileHover={{ y: -10, transition: { duration: 0.3 } }}
                  className="bg-white border-2 border-gray-100 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all group flex flex-col justify-between"
                >
                  {/* Product Image */}
                  <div className="relative h-80 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.4 }}
                      className="w-full h-full relative flex items-center justify-center p-4"
                    >
                      <Image
                        src={product.images?.[0] || '/products/placeholder.jpg'}
                        alt={product.name}
                        fill
                        className="object-contain p-4"
                      />
                    </motion.div>

                    {/* Out of Stock Overlay */}
                    {product.stock <= 0 && (
                      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center z-10">
                        <span className="bg-red-600 text-white font-extrabold text-xs px-4 py-2 rounded-full uppercase tracking-wider shadow-lg">
                          Out of Stock
                        </span>
                      </div>
                    )}

                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      whileHover={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                      className="absolute top-0 left-0 right-0 bottom-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                    >
                      <motion.span
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="text-white text-sm font-bold px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full"
                      >
                        View Details
                      </motion.span>
                    </motion.div>
                    
                    {product.stock > 0 && (
                      <motion.div
                        initial={{ scale: 0, rotate: -10 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: index * 0.08 + 0.2, type: 'spring' }}
                        className="absolute top-4 right-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg"
                      >
                        ₹{product.price.toLocaleString()}
                      </motion.div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-green-600 transition">
                        {product.name}
                      </h3>
                      
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex items-center gap-1">
                          <span className="text-lg font-bold text-amber-500">⭐</span>
                          <span className="text-sm font-bold text-gray-900">{product.rating}</span>
                        </div>
                        <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                          ({product.reviews} reviews)
                        </span>
                      </div>

                      <p className="text-gray-700 text-sm mb-5 line-clamp-2">{product.description}</p>

                      {/* Nutrition Info */}
                      {product.nutritionFacts && (
                        <div className="grid grid-cols-4 gap-2 mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
                          <div className="text-center">
                            <p className="font-bold text-green-600 text-base">{product.nutritionFacts?.protein ?? '—'}</p>
                            <p className="text-[10px] text-gray-600 font-semibold">Protein</p>
                          </div>
                          <div className="text-center">
                            <p className="font-bold text-green-600 text-base">{product.nutritionFacts?.carbs ?? '—'}</p>
                            <p className="text-[10px] text-gray-600 font-semibold">Carbs</p>
                          </div>
                          <div className="text-center">
                            <p className="font-bold text-green-600 text-base">{product.nutritionFacts?.fats ?? '—'}</p>
                            <p className="text-[10px] text-gray-600 font-semibold">Fats</p>
                          </div>
                          <div className="text-center">
                            <p className="font-bold text-green-600 text-base">{product.nutritionFacts?.calories ?? '—'}</p>
                            <p className="text-[10px] text-gray-600 font-semibold">Cal</p>
                          </div>
                        </div>
                      )}

                      {/* Flavor Selector */}
                      {(product.flavors?.length ?? 0) > 0 && (
                        <div className="mb-5">
                          <p className="text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Flavor:</p>
                          <select
                            value={selectedFlavors[product.id] || product.flavors[0]}
                            onChange={(e) => setSelectedFlavors({ ...selectedFlavors, [product.id]: e.target.value })}
                            className="w-full px-3 py-3 border-2 border-gray-200 rounded-lg text-sm font-semibold focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition bg-white"
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

                    {/* Price and Buttons */}
                    <div>
                      {product.originalMrp && product.discountPercent && product.discountPercent > 0 && (
                        <div className="mb-4 bg-gray-50 border border-gray-100 p-3 rounded-xl flex justify-between items-center">
                          <div>
                            <span className="text-xs text-gray-400 block font-semibold">Original Price:</span>
                            <span className="text-sm text-gray-500 line-through">₹{product.originalMrp.toLocaleString()}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs text-green-600 font-extrabold bg-green-100 border border-green-200 px-2.5 py-1 rounded-md">
                              {product.discountPercent}% OFF
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-3">
                        <Link href={`/products/${product.id}`} className="flex-1">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="w-full p-3 bg-gray-150 hover:bg-gray-200 rounded-xl transition font-bold text-gray-900 flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <Eye className="w-5 h-5" />
                            View
                          </motion.button>
                        </Link>
                        <motion.button
                          whileHover={product.stock > 0 ? { scale: 1.05 } : {}}
                          whileTap={product.stock > 0 ? { scale: 0.95 } : {}}
                          disabled={product.stock <= 0}
                          onClick={() => handleAddToCart(product, selectedFlavors[product.id] || product.flavors[0])}
                          className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 disabled:text-gray-300 disabled:cursor-not-allowed text-white px-4 py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-lg cursor-pointer"
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
        </div>
      </div>
      <Footer />
    </main>
  );
}
