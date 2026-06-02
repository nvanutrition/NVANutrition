'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Package, AlertTriangle, CheckCircle, XCircle, Save, Search, RefreshCw } from 'lucide-react';

interface StockProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  images: string[];
  originalMrp?: number;
  discountPercent?: number;
  sku?: string;
}

export default function AdminStock() {
  const [products, setProducts] = useState<StockProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingStocks, setEditingStocks] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'products'));
      const list: StockProduct[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          name: data.name || 'Unnamed Product',
          category: data.category || 'Uncategorized',
          price: data.price || 0,
          stock: data.stock ?? 0,
          images: data.images || [],
          originalMrp: data.originalMrp,
          discountPercent: data.discountPercent,
          sku: data.sku,
        });
      });
      // Sort by stock ascending (low stock first)
      list.sort((a, b) => a.stock - b.stock);
      setProducts(list);
      // Initialize editing state
      const initialStocks: Record<string, string> = {};
      list.forEach((p) => { initialStocks[p.id] = p.stock.toString(); });
      setEditingStocks(initialStocks);
    } catch (error) {
      console.error('Error fetching products for stock management:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveStock = async (productId: string) => {
    const newStockStr = editingStocks[productId];
    const newStock = parseInt(newStockStr);
    if (isNaN(newStock) || newStock < 0) {
      toast.error('Please enter a valid stock quantity (0 or more).');
      return;
    }

    setSavingId(productId);
    try {
      await updateDoc(doc(db, 'products', productId), {
        stock: newStock,
        updatedAt: new Date(),
      });
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, stock: newStock } : p)).sort((a, b) => a.stock - b.stock)
      );
      toast.success('Stock updated successfully!');
    } catch (error) {
      toast.error('Failed to update stock');
      console.error('Error updating stock:', error);
    } finally {
      setSavingId(null);
    }
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: 'Out of Stock', color: 'bg-red-500/10 text-red-400 border-red-500/20', icon: XCircle };
    if (stock <= 10) return { label: 'Low Stock', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: AlertTriangle };
    return { label: 'In Stock', color: 'bg-green-500/10 text-green-400 border-green-500/20', icon: CheckCircle };
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Summary stats
  const totalProducts = products.length;
  const outOfStock = products.filter((p) => p.stock === 0).length;
  const lowStock = products.filter((p) => p.stock > 0 && p.stock <= 10).length;
  const inStock = products.filter((p) => p.stock > 10).length;

  return (
    <div className="p-8 bg-gradient-dark min-h-screen">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="text-4xl font-bold text-white flex items-center gap-3">
            <Package className="text-green-500" /> Stock Management
          </h1>
          <p className="text-gray-400 mt-2">Monitor and update inventory levels in real time</p>
        </div>
        <div className="flex gap-3">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 transition"
            />
          </div>
          <button
            onClick={fetchProducts}
            disabled={loading}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-4 py-2.5 rounded-xl font-semibold transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass rounded-xl p-5 border-l-4 border-blue-500">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Total Products</p>
              <h3 className="text-3xl font-black text-white mt-2">{totalProducts}</h3>
            </div>
            <div className="glass rounded-xl p-5 border-l-4 border-green-500">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Healthy Stock</p>
              <h3 className="text-3xl font-black text-green-400 mt-2">{inStock}</h3>
            </div>
            <div className="glass rounded-xl p-5 border-l-4 border-amber-500">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Low Stock (&le;10)</p>
              <h3 className="text-3xl font-black text-amber-400 mt-2">{lowStock}</h3>
            </div>
            <div className="glass rounded-xl p-5 border-l-4 border-red-500">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Out of Stock</p>
              <h3 className="text-3xl font-black text-red-400 mt-2">{outOfStock}</h3>
            </div>
          </div>

          {/* Products Stock Table */}
          {filteredProducts.length === 0 ? (
            <div className="glass text-center py-16 border border-white/10 rounded-xl">
              <Package size={48} className="mx-auto mb-4 text-gray-600" />
              <p className="text-gray-400 text-lg">No products match your search.</p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-xl shadow-lg overflow-hidden border border-white/10"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-white/5 border-b border-white/10">
                    <tr>
                      <th className="px-6 py-4 text-sm font-bold text-white uppercase tracking-wider">Product</th>
                      <th className="px-6 py-4 text-sm font-bold text-white uppercase tracking-wider">Category</th>
                      <th className="px-6 py-4 text-sm font-bold text-white uppercase tracking-wider">Price</th>
                      <th className="px-6 py-4 text-sm font-bold text-white uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-sm font-bold text-white uppercase tracking-wider w-52">Update Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredProducts.map((product) => {
                      const status = getStockStatus(product.stock);
                      const StatusIcon = status.icon;
                      const hasChanged = editingStocks[product.id] !== product.stock.toString();

                      return (
                        <tr key={product.id} className="hover:bg-white/5 transition duration-150">
                          {/* Product */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-white/5 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center border border-white/10">
                                {product.images?.[0] ? (
                                  <img
                                    src={product.images[0]}
                                    alt={product.name}
                                    className="w-full h-full object-contain p-1"
                                  />
                                ) : (
                                  <Package size={20} className="text-gray-600" />
                                )}
                              </div>
                              <div>
                                <p className="text-white font-bold text-sm line-clamp-1">{product.name}</p>
                                <p className="text-green-400 text-xs font-mono mt-0.5 font-bold">SKU: {product.sku || 'N/A'}</p>
                              </div>
                            </div>
                          </td>

                          {/* Category */}
                          <td className="px-6 py-4">
                            <span className="text-gray-300 text-sm font-semibold bg-white/5 px-3 py-1 rounded-lg">
                              {product.category}
                            </span>
                          </td>

                          {/* Price */}
                          <td className="px-6 py-4">
                            <div>
                              <span className="text-green-400 font-black text-base font-mono">
                                ₹{product.price.toLocaleString()}
                              </span>
                              {product.originalMrp && product.originalMrp > product.price && (
                                <span className="block text-xs text-gray-500 line-through font-mono">
                                  ₹{product.originalMrp.toLocaleString()}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-6 py-4">
                            <div className="space-y-1.5">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border ${status.color}`}>
                                <StatusIcon size={12} />
                                {status.label}
                              </span>
                              <p className="text-xs text-gray-500 font-mono pl-1">
                                Current: <span className="text-white font-bold">{product.stock}</span> units
                              </p>
                            </div>
                          </td>

                          {/* Update Stock */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="0"
                                value={editingStocks[product.id] ?? product.stock}
                                onChange={(e) =>
                                  setEditingStocks((prev) => ({ ...prev, [product.id]: e.target.value }))
                                }
                                className="w-24 px-3 py-2 bg-white/5 border border-white/10 hover:border-white/20 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 rounded-lg text-white text-sm font-mono font-bold focus:outline-none transition"
                              />
                              <button
                                onClick={() => handleSaveStock(product.id)}
                                disabled={!hasChanged || savingId === product.id}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                                  hasChanged && savingId !== product.id
                                    ? 'bg-green-500 hover:bg-green-600 text-black shadow-lg shadow-green-500/20'
                                    : 'bg-white/5 text-gray-500 cursor-not-allowed'
                                }`}
                              >
                                {savingId === product.id ? (
                                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                ) : (
                                  <Save size={14} />
                                )}
                                Save
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* Legend */}
          <div className="flex gap-6 text-xs text-gray-500 font-semibold pt-2">
            <span className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500" /> In Stock: More than 10 units</span>
            <span className="flex items-center gap-2"><AlertTriangle size={14} className="text-amber-500" /> Low Stock: 1–10 units remaining</span>
            <span className="flex items-center gap-2"><XCircle size={14} className="text-red-500" /> Out of Stock: 0 units</span>
          </div>
        </div>
      )}
    </div>
  );
}
