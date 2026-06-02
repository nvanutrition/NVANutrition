const fs = require('fs');
const file = '/Users/sandeepkumar/Desktop/NVANutrition/app/admin/products/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// The form starts at: <form onSubmit={handleAddProduct} className="space-y-6">
// And ends before: {/* Action Buttons */}

const newForm = `              <form onSubmit={handleAddProduct} className="space-y-8">
                {/* 1. Basic Information */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Tag size={18} className="text-green-400" /> Basic Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-sm font-semibold text-gray-300 mb-2">Product Name *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-2 bg-black/20 border border-white/10 text-white placeholder:text-white/30 rounded-lg focus:outline-none focus:border-green-500 transition"
                        placeholder="e.g., Premium Whey Protein"
                        required
                      />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-sm font-semibold text-gray-300 mb-2">Category *</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-4 py-2 bg-black/20 border border-white/10 text-white rounded-lg focus:outline-none focus:border-green-500 transition"
                      >
                        <option className="bg-gray-900">Whey Protein</option>
                        <option className="bg-gray-900">Mass Gainer</option>
                        <option className="bg-gray-900">Creatine</option>
                        <option className="bg-gray-900">BCAA</option>
                        <option className="bg-gray-900">Pre Workout</option>
                        <option className="bg-gray-900">Fat Burner</option>
                        <option className="bg-gray-900">Multivitamin</option>
                        <option className="bg-gray-900">Supplements</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">Stock *</label>
                      <input
                        type="number"
                        value={formData.stock}
                        onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                        className="w-full px-4 py-2 bg-black/20 border border-white/10 text-white placeholder:text-white/30 rounded-lg focus:outline-none focus:border-green-500 transition"
                        placeholder="100"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">SKU (Auto-generated)</label>
                      <input
                        type="text"
                        value={formData.sku || 'Auto-generated on save'}
                        disabled
                        className="w-full px-4 py-2 bg-black/40 border border-white/5 text-gray-500 placeholder:text-gray-600 rounded-lg font-mono uppercase cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">Display Priority (1-10)</label>
                      <input
                        type="number"
                        min={1} max={10}
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                        className="w-full px-4 py-2 bg-black/20 border border-white/10 text-white placeholder:text-white/30 rounded-lg focus:outline-none focus:border-green-500 transition"
                        placeholder="5"
                      />
                    </div>
                    <div className="flex items-end pb-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.isFeatured}
                          onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                          className="w-5 h-5 rounded border-gray-300 text-green-500 focus:ring-green-500"
                        />
                        <span className="text-sm font-semibold text-white">Mark as Featured Product</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* 2. Pricing Options */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">Pricing Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">Original MRP (₹)</label>
                      <input
                        type="number"
                        value={formData.originalMrp}
                        onChange={(e) => setFormData({ ...formData, originalMrp: e.target.value })}
                        className="w-full px-4 py-2 bg-black/20 border border-white/10 text-white placeholder:text-white/30 rounded-lg focus:outline-none focus:border-green-500 transition"
                        placeholder="3299"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">Discount %</label>
                      <input
                        type="number"
                        value={formData.discountPercent}
                        onChange={(e) => setFormData({ ...formData, discountPercent: e.target.value })}
                        className="w-full px-4 py-2 bg-black/20 border border-white/10 text-white placeholder:text-white/30 rounded-lg focus:outline-none focus:border-green-500 transition"
                        placeholder="23"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-green-400 mb-2">Final Selling Price (₹) *</label>
                      <input
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        className="w-full px-4 py-2 bg-green-500/10 border border-green-500/30 text-green-400 font-mono rounded-lg focus:outline-none focus:border-green-400 transition"
                        placeholder="2499"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Specs & Variants */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">Specs & Variants</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-2">Total Weight</label>
                        <input
                          type="text"
                          value={formData.weight}
                          onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                          className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:border-green-500 transition"
                          placeholder="e.g., 2, 500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-2">Unit</label>
                        <select
                          value={formData.weightUnit}
                          onChange={(e) => setFormData({ ...formData, weightUnit: e.target.value })}
                          className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:border-green-500 transition"
                        >
                          <option className="bg-gray-900" value="g">g</option>
                          <option className="bg-gray-900" value="kg">kg</option>
                          <option className="bg-gray-900" value="lbs">lbs</option>
                          <option className="bg-gray-900" value="ml">ml</option>
                          <option className="bg-gray-900" value="l">l</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">Total Servings</label>
                      <input
                        type="number"
                        value={formData.servings}
                        onChange={(e) => setFormData({ ...formData, servings: e.target.value })}
                        className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:border-green-500 transition"
                        placeholder="30"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-semibold text-gray-300 mb-2">Available Flavors (comma separated)</label>
                      <input
                        type="text"
                        value={formData.flavors}
                        onChange={(e) => setFormData({ ...formData, flavors: e.target.value })}
                        className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:border-green-500 transition"
                        placeholder="e.g., Double Rich Chocolate, Vanilla Ice Cream"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Product Descriptions */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">Descriptions & Benefits</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">Short Description (Product Card)</label>
                      <textarea
                        value={formData.shortDescription}
                        onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                        className="w-full px-4 py-2 bg-black/20 border border-white/10 text-white rounded-lg focus:outline-none focus:border-green-500 transition"
                        placeholder="Brief summary..."
                        rows={2}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">Long Description (Details Page)</label>
                      <textarea
                        value={formData.longDescription}
                        onChange={(e) => setFormData({ ...formData, longDescription: e.target.value })}
                        className="w-full px-4 py-2 bg-black/20 border border-white/10 text-white rounded-lg focus:outline-none focus:border-green-500 transition"
                        placeholder="Detailed product description..."
                        rows={4}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">Key Benefits (comma separated)</label>
                      <input
                        type="text"
                        value={formData.benefits}
                        onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                        className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:border-green-500 transition"
                        placeholder="e.g., Builds Muscle, Fast Recovery"
                      />
                    </div>
                  </div>
                </div>

                {/* 5. Nutrition Options */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">Nutrition Macros</h3>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, nutritionOptions: [...formData.nutritionOptions, { name: '', quantity: '', unit: 'g', basis: 'per_serving' }] })}
                      className="text-xs font-bold bg-green-500/20 text-green-400 px-3 py-1.5 rounded-lg hover:bg-green-500/30 transition flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={14} /> Add Macro
                    </button>
                  </div>
                  <div className="space-y-3">
                    {formData.nutritionOptions.map((opt, idx) => (
                      <div key={idx} className="flex flex-wrap items-start gap-2 bg-black/20 p-3 rounded-lg border border-white/5">
                        <div className="flex-1 min-w-[150px]">
                          <input
                            type="text"
                            placeholder="e.g. Protein"
                            value={opt.name}
                            onChange={(e) => {
                              const newOpts = [...formData.nutritionOptions];
                              newOpts[idx].name = e.target.value;
                              setFormData({ ...formData, nutritionOptions: newOpts });
                            }}
                            className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white text-sm focus:border-green-500"
                          />
                        </div>
                        <div className="w-24">
                          <input
                            type="text"
                            placeholder="Qty"
                            value={opt.quantity}
                            onChange={(e) => {
                              const newOpts = [...formData.nutritionOptions];
                              newOpts[idx].quantity = e.target.value;
                              setFormData({ ...formData, nutritionOptions: newOpts });
                            }}
                            className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white text-sm focus:border-green-500"
                          />
                        </div>
                        <div className="w-20">
                          <input
                            type="text"
                            placeholder="Unit"
                            value={opt.unit}
                            onChange={(e) => {
                              const newOpts = [...formData.nutritionOptions];
                              newOpts[idx].unit = e.target.value;
                              setFormData({ ...formData, nutritionOptions: newOpts });
                            }}
                            className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white text-sm focus:border-green-500"
                          />
                        </div>
                        <div className="w-36">
                          <select
                            value={opt.basis}
                            onChange={(e) => {
                              const newOpts = [...formData.nutritionOptions];
                              newOpts[idx].basis = e.target.value as any;
                              setFormData({ ...formData, nutritionOptions: newOpts });
                            }}
                            className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white text-sm focus:border-green-500"
                          >
                            <option value="per_serving" className="bg-gray-900">Per Serving</option>
                            <option value="per_100g" className="bg-gray-900">Per 100g</option>
                            <option value="per_gram" className="bg-gray-900">Per Gram</option>
                          </select>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const newOpts = formData.nutritionOptions.filter((_, i) => i !== idx);
                            setFormData({ ...formData, nutritionOptions: newOpts });
                          }}
                          className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition cursor-pointer"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                    {formData.nutritionOptions.length === 0 && (
                       <p className="text-sm text-gray-500 text-center py-4 bg-black/10 rounded-lg border border-dashed border-white/10">No nutrition macros added.</p>
                    )}
                  </div>
                </div>

                {/* 6. Active Ingredients */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">Detailed Ingredients</h3>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, ingredients: [...formData.ingredients, { name: '', quantity: '', unit: 'g', logo: 'default' }] })}
                      className="text-xs font-bold bg-green-500/20 text-green-400 px-3 py-1.5 rounded-lg hover:bg-green-500/30 transition flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={14} /> Add Ingredient
                    </button>
                  </div>
                  <div className="space-y-3">
                    {formData.ingredients.map((ing, idx) => (
                      <div key={idx} className="flex flex-wrap items-start gap-2 bg-black/20 p-3 rounded-lg border border-white/5">
                        <div className="flex-1 min-w-[150px]">
                          <input
                            type="text"
                            placeholder="Ingredient Name"
                            value={ing.name}
                            onChange={(e) => {
                              const newIngs = [...formData.ingredients];
                              newIngs[idx].name = e.target.value;
                              setFormData({ ...formData, ingredients: newIngs });
                            }}
                            className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white text-sm focus:border-green-500"
                          />
                        </div>
                        <div className="w-24">
                          <input
                            type="text"
                            placeholder="Qty"
                            value={ing.quantity}
                            onChange={(e) => {
                              const newIngs = [...formData.ingredients];
                              newIngs[idx].quantity = e.target.value;
                              setFormData({ ...formData, ingredients: newIngs });
                            }}
                            className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white text-sm focus:border-green-500"
                          />
                        </div>
                        <div className="w-20">
                          <input
                            type="text"
                            placeholder="Unit"
                            value={ing.unit}
                            onChange={(e) => {
                              const newIngs = [...formData.ingredients];
                              newIngs[idx].unit = e.target.value;
                              setFormData({ ...formData, ingredients: newIngs });
                            }}
                            className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white text-sm focus:border-green-500"
                          />
                        </div>
                        <div className="w-36">
                          <select
                            value={ing.logo || 'default'}
                            onChange={(e) => {
                              const newIngs = [...formData.ingredients];
                              newIngs[idx].logo = e.target.value;
                              setFormData({ ...formData, ingredients: newIngs });
                            }}
                            className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white text-sm focus:border-green-500"
                          >
                            <option value="default" className="bg-gray-900">Default Icon</option>
                            <option value="leaf" className="bg-gray-900">Leaf</option>
                            <option value="zap" className="bg-gray-900">Energy (Zap)</option>
                            <option value="dumbbell" className="bg-gray-900">Muscle</option>
                            <option value="flame" className="bg-gray-900">Flame</option>
                            <option value="droplet" className="bg-gray-900">Liquid / Drop</option>
                            <option value="activity" className="bg-gray-900">Health Pulse</option>
                          </select>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const newIngs = formData.ingredients.filter((_, i) => i !== idx);
                            setFormData({ ...formData, ingredients: newIngs });
                          }}
                          className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition cursor-pointer"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                    {formData.ingredients.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4 bg-black/10 rounded-lg border border-dashed border-white/10">No specific ingredients added.</p>
                    )}
                  </div>
                </div>

                {/* 7. Product Images */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">Product Images</h3>
                  <div className="flex flex-col gap-4">
                    {/* Add Image URL directly */}
                    <div className="flex gap-2">
                      <input
                        type="url"
                        placeholder="Paste image URL here..."
                        className="flex-1 px-4 py-2 bg-black/20 border border-white/10 text-white rounded-lg focus:border-green-500"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const val = e.currentTarget.value.trim();
                            if (val) {
                              setFormData({ ...formData, images: [...formData.images, val] });
                              e.currentTarget.value = '';
                            }
                          }
                        }}
                      />
                      <button type="button" className="px-4 py-2 bg-white/10 text-white rounded-lg font-semibold cursor-pointer">Add URL</button>
                    </div>
                    {/* Upload */}
                    <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-white/20 hover:border-green-500/50 rounded-xl cursor-pointer bg-black/20 hover:bg-black/40 transition">
                      <div className="flex flex-col items-center gap-2">
                        <Upload size={24} className="text-gray-400" />
                        <span className="text-sm font-semibold text-gray-400">Click to upload images</span>
                        <span className="text-xs text-gray-500">Max 5MB per image</span>
                      </div>
                      <input type="file" className="hidden" multiple accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} />
                    </label>
                    {uploadingImage && (
                      <div className="text-center text-sm text-green-400 font-semibold animate-pulse">Uploading image...</div>
                    )}
                    {formData.images.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-2">
                        {formData.images.map((img, idx) => (
                          <div key={idx} className="relative aspect-square rounded-lg overflow-hidden bg-black/40 border border-white/10 group">
                            <Image src={img} alt="Product image" fill className="object-contain p-2" />
                            <button
                              type="button"
                              onClick={() => removeImage(idx)}
                              className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition cursor-pointer"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
`;

const startIndex = content.indexOf('<form onSubmit={handleAddProduct} className="space-y-6">');
const endIndex = content.indexOf('{/* Action Buttons */}');

if (startIndex !== -1 && endIndex !== -1) {
  const newContent = content.slice(0, startIndex) + newForm + content.slice(endIndex);
  fs.writeFileSync(file, newContent, 'utf8');
  console.log("Form updated successfully.");
} else {
  console.log("Could not find bounds.");
}
