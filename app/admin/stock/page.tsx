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
    if (stock === 0) return { label: 'Out of Stock', color: 'bg-red-50 text-red-600 border-red-200', icon: XCircle };
    if (stock <= 10) return { label: 'Low Stock', color: 'bg-amber-50 text-amber-600 border-amber-200', icon: AlertTriangle };
    return { label: 'In Stock', color: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle };
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalProducts = products.length;
  const outOfStock = products.filter((p) => p.stock === 0).length;
  const lowStock = products.filter((p) => p.stock > 0 && p.stock <= 10).length;
  const inStock = products.filter((p) => p.stock > 10).length;

  return (
    <div className="p-4 sm:p-8 bg-[#fcfcfc] min-h-screen font-sans">
      
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-lg">
              <Package size={20} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Stock</h1>
          </div>
          <p className="text-gray-500 text-sm mt-1">Monitor and update inventory levels in real time</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative w-full sm:w-72">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
            />
          </div>
          <button onClick={fetchProducts} disabled={loading}
            className="flex items-center justify-center gap-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 px-5 py-3 rounded-xl font-bold text-sm shadow-sm transition disabled:opacity-50">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-gray-100 border-t-black rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center mb-4"><Package size={18} className="text-gray-900" /></div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Total Products</p>
              <h3 className="text-3xl font-black text-gray-900 mt-2">{totalProducts}</h3>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center mb-4"><CheckCircle size={18} className="text-green-600" /></div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Healthy Stock</p>
              <h3 className="text-3xl font-black text-green-600 mt-2">{inStock}</h3>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center mb-4"><AlertTriangle size={18} className="text-amber-500" /></div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Low Stock (≤10)</p>
              <h3 className="text-3xl font-black text-amber-500 mt-2">{lowStock}</h3>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center mb-4"><XCircle size={18} className="text-red-500" /></div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Out of Stock</p>
              <h3 className="text-3xl font-black text-red-500 mt-2">{outOfStock}</h3>
            </motion.div>
          </div>

          {/* Table Container */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-20">
                <Package size={40} className="mx-auto text-gray-200 mb-4" />
                <p className="text-gray-500 font-semibold">No products found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50/50 text-gray-400 text-xs uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="px-6 py-5 font-medium border-b border-gray-50">Product</th>
                      <th className="px-6 py-5 font-medium border-b border-gray-50">Category</th>
                      <th className="px-6 py-5 font-medium border-b border-gray-50">Price</th>
                      <th className="px-6 py-5 font-medium border-b border-gray-50">Status</th>
                      <th className="px-6 py-5 font-medium border-b border-gray-50 w-56 text-right">Update Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredProducts.map((product) => {
                      const status = getStockStatus(product.stock);
                      const StatusIcon = status.icon;
                      const hasChanged = editingStocks[product.id] !== product.stock.toString();

                      return (
                        <tr key={product.id} className="hover:bg-gray-50/50 transition group">
                          
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-white border border-gray-100 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm">
                                {product.images?.[0] ? (
                                  <img src={product.images[0]} alt={product.name} className="w-full h-full object-contain p-1.5" />
                                ) : (
                                  <Package size={20} className="text-gray-300" />
                                )}
                              </div>
                              <div>
                                <p className="text-gray-900 font-bold text-sm line-clamp-1 mb-0.5">{product.name}</p>
                                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">SKU: {product.sku || 'N/A'}</p>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-5">
                            <span className="text-gray-600 text-[10px] font-bold uppercase tracking-wider bg-gray-50 px-2.5 py-1 rounded-md border border-gray-200">
                              {product.category}
                            </span>
                          </td>

                          <td className="px-6 py-5">
                            <div>
                              <span className="text-gray-900 font-black text-sm">₹{product.price.toLocaleString()}</span>
                              {product.originalMrp && product.originalMrp > product.price && (
                                <span className="block text-[10px] font-bold text-gray-400 line-through mt-0.5">₹{product.originalMrp.toLocaleString()}</span>
                              )}
                            </div>
                          </td>

                          <td className="px-6 py-5">
                            <div className="space-y-1.5">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${status.color}`}>
                                <StatusIcon size={12} />
                                {status.label}
                              </span>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                                Current: <span className="text-gray-900">{product.stock}</span> units
                              </p>
                            </div>
                          </td>

                          <td className="px-6 py-5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <input
                                type="number" min="0" value={editingStocks[product.id] ?? product.stock}
                                onChange={(e) => setEditingStocks((prev) => ({ ...prev, [product.id]: e.target.value }))}
                                className="w-20 px-3 py-2.5 bg-gray-50 border border-gray-200 focus:bg-white focus:border-gray-300 focus:ring-4 focus:ring-gray-100 rounded-xl text-gray-900 text-sm font-bold font-mono focus:outline-none transition text-center shadow-inner"
                              />
                              <button
                                onClick={() => handleSaveStock(product.id)}
                                disabled={!hasChanged || savingId === product.id}
                                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-sm ${
                                  hasChanged && savingId !== product.id
                                    ? 'bg-black hover:bg-gray-800 text-white shadow-black/10'
                                    : 'bg-white border border-gray-200 text-gray-400 cursor-not-allowed'
                                }`}
                              >
                                {savingId === product.id ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={14} />}
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
            )}
            <div className="px-6 py-4 border-t border-gray-50 bg-gray-50/50 flex gap-6 text-[10px] font-bold uppercase tracking-wider text-gray-500">
              <span className="flex items-center gap-1.5"><CheckCircle size={12} className="text-green-600" /> &gt;10 units</span>
              <span className="flex items-center gap-1.5"><AlertTriangle size={12} className="text-amber-500" /> 1–10 units</span>
              <span className="flex items-center gap-1.5"><XCircle size={12} className="text-red-500" /> 0 units</span>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
