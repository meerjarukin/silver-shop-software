'use client';

import React, { useState, useEffect } from 'react';
import {
  Gem,
  Plus,
  Search,
  Filter,
  QrCode,
  Edit2,
  PackagePlus,
  ArrowUpDown,
  Tag,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sparkles,
  Trash2,
} from 'lucide-react';
import ProductModal from '@/components/ProductModal';
import QRTagModal from '@/components/QRTagModal';
import CategoryManagementModal from '@/components/CategoryManagementModal';
import DeleteProductModal from '@/components/DeleteProductModal';
import { Product, SilverRates, Category } from '@/lib/types';
import { useRates } from '@/context/RatesContext';

const DEFAULT_CATEGORIES = [
  'All',
  'Anklets',
  'Rings',
  'Chains',
  'Utensils',
  'Idols',
  'Coins',
  'Giftware',
];

export default function ProductsPage() {
  const { rates } = useRates();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryNames, setCategoryNames] = useState<string[]>(DEFAULT_CATEGORIES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPurity, setSelectedPurity] = useState('All');
  const [selectedMetal, setSelectedMetal] = useState<'All' | 'GOLD' | 'SILVER'>('All');

  // Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [selectedProductForQR, setSelectedProductForQR] = useState<Product | null>(null);

  const loadData = () => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setProducts(data);
      })
      .catch(() => {});

    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setCategories(data);
          setCategoryNames(['All', ...data.map((c: any) => c.name)]);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadData();

    const handleCategoriesUpdated = (e: any) => {
      const data = e.detail;
      if (Array.isArray(data) && data.length > 0) {
        setCategories(data);
        setCategoryNames(['All', ...data.map((c: any) => c.name)]);
      }
    };
    window.addEventListener('categoriesUpdated', handleCategoriesUpdated);

    return () => {
      window.removeEventListener('categoriesUpdated', handleCategoriesUpdated);
    };
  }, []);

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesPurity =
      selectedPurity === 'All' ||
      (selectedPurity === '925' && p.purity >= 92 && p.purity < 99) ||
      (selectedPurity === '999' && p.purity >= 99) ||
      (selectedPurity === '800' && p.purity < 90);
    const isGold = p.metalType === 'GOLD' || p.sku?.startsWith('GLD');
    const matchesMetal =
      selectedMetal === 'All' ||
      (selectedMetal === 'GOLD' && isGold) ||
      (selectedMetal === 'SILVER' && !isGold);

    return matchesSearch && matchesCat && matchesPurity && matchesMetal;
  });

  const getProductRate = (purity: number, metalType?: string, purityGrade?: string): number => {
    if (metalType === 'GOLD') {
      if (purityGrade?.includes('750') || purityGrade?.includes('18K') || (purity > 70 && purity <= 76)) {
        return Math.round((rates.goldRate916 || 7150) * (75.0 / 91.6));
      }
      if (purityGrade?.includes('999') || purityGrade?.includes('24K') || purity >= 99) {
        return Math.round((rates.goldRate916 || 7150) * (99.9 / 91.6));
      }
      return rates.goldRate916 || 7150;
    }
    if (purity >= 99) return rates.fineRate999;
    if (purity <= 85) return rates.utensilRate800;
    return rates.sterlingRate925;
  };

  const handleSaveProduct = async (prodData: Partial<Product>) => {
    const saved = {
      ...prodData,
      id: prodData.id || `prod-${Date.now()}`,
      createdAt: new Date().toISOString(),
    } as Product;

    setProducts((prev) => [saved, ...prev.filter((p) => p.id !== saved.id && p.sku !== saved.sku)]);

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prodData),
      });
      if (res.ok) {
        const savedDB = await res.json();
        if (savedDB && savedDB.id) {
          setProducts((prev) =>
            prev.map((p) => (p.sku === savedDB.sku || p.id === savedDB.id ? { ...p, ...savedDB } : p))
          );
        }
      }
    } catch (e) {}
  };

  const handleDeleteProduct = async (product: Product) => {
    try {
      const res = await fetch(`/api/products/${encodeURIComponent(product.sku)}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete product');
      }
      setProducts((prev) => prev.filter((p) => p.id !== product.id && p.sku !== product.sku));
    } catch (err: any) {
      console.error('Delete error:', err);
      throw err;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-8 py-5 sm:py-8 space-y-5 sm:space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg border border-amber-200/60 flex-shrink-0">
              <Gem className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span>Product Catalog</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage jewellery items, gross/net weights, hallmark purity, and making charges.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-2xs transition active:scale-98"
            title="Manage product categories"
          >
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span>Manage Categories</span>
          </button>

          <button
            onClick={() => {
              setProductToEdit(null);
              setIsProductModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs shadow-blue-500/20 transition active:scale-98"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200/90 p-3.5 sm:p-4 rounded-2xl shadow-card space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition font-medium"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedPurity}
              onChange={(e) => setSelectedPurity(e.target.value)}
              className="w-full sm:w-auto bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-semibold focus:outline-none focus:border-blue-500"
            >
              <option value="All">All Purities</option>
              <option value="925">925 Sterling</option>
              <option value="999">999 Fine</option>
              <option value="800">800 Utensil</option>
            </select>
          </div>
        </div>

        {/* Category & Metal Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200/80 flex-shrink-0">
            <button
              type="button"
              onClick={() => setSelectedMetal('All')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                selectedMetal === 'All'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All Metals
            </button>
            <button
              type="button"
              onClick={() => setSelectedMetal('GOLD')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                selectedMetal === 'GOLD'
                  ? 'bg-amber-500 text-white shadow-2xs shadow-amber-500/30'
                  : 'text-amber-800 hover:text-amber-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-300"></span>
              Gold
            </button>
            <button
              type="button"
              onClick={() => setSelectedMetal('SILVER')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                selectedMetal === 'SILVER'
                  ? 'bg-slate-800 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
              Silver
            </button>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {categoryNames.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl font-semibold transition whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-2xs shadow-blue-500/20'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Card List (< sm screens) */}
      <div className="block sm:hidden space-y-2.5">
        {filteredProducts.map((prod) => {
          const isGold = prod.metalType === 'GOLD' || prod.sku?.startsWith('GLD');
          const rate = getProductRate(prod.purity, isGold ? 'GOLD' : prod.metalType, prod.purityGrade);
          let making = 0;
          if (prod.makingChargeType === 'PER_GRAM') making = prod.netWeight * prod.makingChargeValue;
          else if (prod.makingChargeType === 'FLAT') making = prod.makingChargeValue;
          else making = prod.netWeight * rate * (prod.makingChargeValue / 100);

          const estPrice = prod.netWeight * rate + making;
          const isLow = prod.stockQuantity <= prod.minStockAlert && prod.stockQuantity > 0;
          const isOut = prod.stockQuantity <= 0;

          return (
            <div
              key={prod.id}
              className="bg-white border border-slate-200/90 p-3.5 rounded-2xl shadow-card space-y-2.5"
            >
              <div className="flex items-start gap-3">
                <img
                  src={
                    prod.imageUrl ||
                    'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&auto=format&fit=crop&q=80'
                  }
                  alt={prod.name}
                  className="w-12 h-12 rounded-xl object-cover bg-slate-100 border border-slate-200/90 flex-shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-semibold text-xs text-slate-900 truncate block">
                      {prod.name}
                    </span>
                    {isOut ? (
                      <span className="bg-rose-50 text-rose-700 border border-rose-200/80 px-1.5 py-0.5 rounded text-[9px] font-bold flex-shrink-0">
                        Out
                      </span>
                    ) : isLow ? (
                      <span className="bg-amber-50 text-amber-800 border border-amber-200/80 px-1.5 py-0.5 rounded text-[9px] font-bold flex-shrink-0">
                        Low ({prod.stockQuantity})
                      </span>
                    ) : (
                      <span className="bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-1.5 py-0.5 rounded text-[9px] font-bold flex-shrink-0">
                        {prod.stockQuantity} in stock
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono block">
                    {prod.sku} • {prod.category}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">Purity</span>
                  <span className="font-bold text-slate-900 font-mono text-[11px]">
                    {prod.purity}% ({prod.purityGrade?.split(' ')[0]})
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Net Wt</span>
                  <span className="font-bold text-slate-900 font-mono">
                    {prod.netWeight.toFixed(2)}g
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Est. Price</span>
                  <span className="font-bold text-slate-900 font-mono">
                    ₹{estPrice.toFixed(0)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  onClick={() => setSelectedProductForQR(prod)}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>QR</span>
                </button>
                <button
                  onClick={() => {
                    setProductToEdit(prod);
                    setIsProductModalOpen(true);
                  }}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-semibold"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => setProductToDelete(prod)}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 rounded-xl text-xs font-semibold"
                  title="Delete product"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Products Data Table (Visible on sm+ screens) */}
      <div className="hidden sm:block bg-white border border-slate-200/90 rounded-2xl shadow-card overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-xs">
            <Gem className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-700">No products match your search</p>
            <p className="text-slate-400 mt-0.5">Click &quot;Add Product&quot; to create a new jewellery item.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                  <th className="py-3 px-4">Product & Photo</th>
                  <th className="py-3 px-3">SKU</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Purity</th>
                  <th className="py-3 px-3 text-right">Gross / Net Wt</th>
                  <th className="py-3 px-3 text-right">Making</th>
                  <th className="py-3 px-3 text-right">Est. Price</th>
                  <th className="py-3 px-3 text-center">Stock</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((prod) => {
                  const isGold = prod.metalType === 'GOLD' || prod.sku?.startsWith('GLD');
                  const rate = getProductRate(prod.purity, isGold ? 'GOLD' : prod.metalType, prod.purityGrade);
                  let making = 0;
                  if (prod.makingChargeType === 'PER_GRAM') making = prod.netWeight * prod.makingChargeValue;
                  else if (prod.makingChargeType === 'FLAT') making = prod.makingChargeValue;
                  else making = prod.netWeight * rate * (prod.makingChargeValue / 100);

                  const estPrice = prod.netWeight * rate + making;
                  const isLow = prod.stockQuantity <= prod.minStockAlert && prod.stockQuantity > 0;
                  const isOut = prod.stockQuantity <= 0;

                  return (
                    <tr key={prod.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              prod.imageUrl ||
                              'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&auto=format&fit=crop&q=80'
                            }
                            alt={prod.name}
                            className="w-10 h-10 rounded-xl object-cover bg-slate-100 border border-slate-200/90 flex-shrink-0 shadow-2xs"
                          />
                          <div>
                            <span className="font-semibold text-slate-900 block leading-tight">
                              {prod.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              Cost: ₹{prod.purchaseRatePerGram || 72}/g
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-3 font-mono font-semibold text-slate-600 text-[11px]">
                        {prod.sku}
                      </td>

                      <td className="py-3.5 px-3 text-slate-600">{prod.category}</td>

                      <td className="py-3.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                            prod.purity >= 99
                              ? 'bg-amber-50 text-amber-800 border-amber-200/80'
                              : prod.purity >= 92
                              ? 'bg-blue-50 text-blue-700 border-blue-200/80'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {prod.purity}% ({prod.purityGrade?.split(' ')[0]})
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-right">
                        <span className="font-bold text-slate-900 font-mono block">
                          {(prod.netWeight || 0).toFixed(2)} g
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Gr: {(prod.grossWeight || 0).toFixed(2)}g
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-right text-slate-600 font-mono">
                        ₹{making.toFixed(0)}
                      </td>

                      <td className="py-3.5 px-3 text-right font-bold text-slate-900 font-mono">
                        ₹{estPrice.toFixed(0)}
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        {isOut ? (
                          <span className="bg-rose-50 text-rose-700 border border-rose-200/80 px-2 py-0.5 rounded-md text-[10px] font-bold">
                            Out of Stock
                          </span>
                        ) : isLow ? (
                          <span className="bg-amber-50 text-amber-800 border border-amber-200/80 px-2 py-0.5 rounded-md text-[10px] font-bold">
                            Low ({prod.stockQuantity})
                          </span>
                        ) : (
                          <span className="bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-2 py-0.5 rounded-md text-[10px] font-bold">
                            {prod.stockQuantity} in stock
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedProductForQR(prod)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Print Rat-tail QR Sticker"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              setProductToEdit(prod);
                              setIsProductModalOpen(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                            title="Edit Product"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setProductToDelete(prod)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Permanently Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
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
      </div>

      {/* Modals */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setProductToEdit(null);
        }}
        productToEdit={productToEdit}
        onSaveProduct={handleSaveProduct}
        onDeleteProduct={(prod) => {
          setIsProductModalOpen(false);
          setProductToEdit(null);
          setProductToDelete(prod);
        }}
      />

      <QRTagModal
        product={selectedProductForQR}
        isOpen={!!selectedProductForQR}
        onClose={() => setSelectedProductForQR(null)}
      />

      <CategoryManagementModal
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          loadData();
        }}
        onCategoriesUpdated={() => loadData()}
      />

      <DeleteProductModal
        isOpen={!!productToDelete}
        product={productToDelete}
        onClose={() => setProductToDelete(null)}
        onConfirmDelete={handleDeleteProduct}
      />
    </div>
  );
}
