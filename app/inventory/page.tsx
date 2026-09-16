'use client';

import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Plus,
  Search,
  Filter,
  PackagePlus,
  Truck,
  AlertTriangle,
  QrCode,
  Scale,
  Coins,
  History,
  Layers,
} from 'lucide-react';
import ProductModal from '@/components/ProductModal';
import QRTagModal from '@/components/QRTagModal';
import StockAdjustmentModal from '@/components/StockAdjustmentModal';
import PurchaseStockInModal from '@/components/PurchaseStockInModal';
import DeleteProductModal from '@/components/DeleteProductModal';
import { Product, SilverRates, PurchaseStockIn } from '@/lib/types';
import { useRates } from '@/context/RatesContext';

const DEFAULT_CATEGORIES = ['All', 'Anklets', 'Rings', 'Chains', 'Utensils', 'Idols', 'Coins'];

export default function InventoryPage() {
  const { rates } = useRates();
  const [products, setProducts] = useState<Product[]>([]);
  const [categoryNames, setCategoryNames] = useState<string[]>(DEFAULT_CATEGORIES);
  const [purchases, setPurchases] = useState<PurchaseStockIn[]>([]);
  const [activeTab, setActiveTab] = useState<'STOCK' | 'INWARD_LOGS'>('STOCK');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'LOW' | 'OUT'>('ALL');

  // Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [selectedProductForQR, setSelectedProductForQR] = useState<Product | null>(null);
  const [selectedProductForStock, setSelectedProductForStock] = useState<Product | null>(null);

  useEffect(() => {
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
          setCategoryNames(['All', ...data.map((c: any) => c.name)]);
        }
      })
      .catch(() => {});
  }, []);

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesStock =
      stockFilter === 'ALL' ||
      (stockFilter === 'LOW' && p.stockQuantity <= p.minStockAlert && p.stockQuantity > 0) ||
      (stockFilter === 'OUT' && p.stockQuantity <= 0);

    return matchesSearch && matchesCat && matchesStock;
  });

  const totalGrams = products.reduce((acc, p) => acc + p.netWeight * p.stockQuantity, 0);
  const totalCostValue = products.reduce(
    (acc, p) => acc + (p.purchaseRatePerGram || 72) * p.netWeight * p.stockQuantity,
    0
  );

  const handleUpdateStock = async (productId: string, newQty: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, stockQuantity: newQty } : p))
    );
    const prod = products.find((p) => p.id === productId);
    if (prod) {
      try {
        await fetch(`/api/products/${encodeURIComponent(prod.sku)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stockQuantity: newQty }),
        });
      } catch (e) {}
    }
  };

  const handleSavePurchase = (purchase: PurchaseStockIn) => {
    setPurchases([purchase, ...purchases]);
    setProducts((prev) =>
      prev.map((p) => {
        if (p.sku === purchase.productSku) {
          return {
            ...p,
            stockQuantity: p.stockQuantity + purchase.quantity,
            purchaseRatePerGram: purchase.purchaseRatePerGram,
          };
        }
        return p;
      })
    );
  };

  const handleSaveProduct = async (prodData: Partial<Product>) => {
    const saved = {
      ...prodData,
      id: prodData.id || `prod-${Date.now()}`,
      createdAt: new Date().toISOString(),
    } as Product;

    setProducts((prev) => [saved, ...prev.filter((p) => p.id !== saved.id)]);

    try {
      await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prodData),
      });
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
            <div className="p-1.5 bg-teal-50 text-teal-600 rounded-lg border border-teal-200/60 flex-shrink-0">
              <Boxes className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span>Inventory Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Vault stock levels, silversmith purchase entries, and inventory audits.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
          <button
            onClick={() => setIsPurchaseModalOpen(true)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs shadow-emerald-500/20 transition active:scale-98"
          >
            <PackagePlus className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">Stock In (Purchase)</span>
          </button>

          <button
            onClick={() => {
              setProductToEdit(null);
              setIsProductModalOpen(true);
            }}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs shadow-blue-500/20 transition active:scale-98"
          >
            <Plus className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">Add Product</span>
          </button>
        </div>
      </div>

      {/* 3 Metric Summary Cards: 1 column on mobile, 3 columns on tablet/desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-slate-200/90 p-4 rounded-2xl shadow-card flex sm:flex-col justify-between items-center sm:items-start">
          <div>
            <span className="text-xs text-slate-500 font-medium block">Total Products</span>
            <div className="text-lg sm:text-xl font-bold text-slate-900 font-mono mt-0.5 sm:mt-1">
              {products.length} <span className="text-xs font-normal text-slate-500">Designs</span>
            </div>
          </div>
          <span className="text-[11px] text-blue-600 font-semibold bg-blue-50 sm:bg-transparent px-2 sm:px-0 py-0.5 sm:py-0 rounded">
            Live catalog
          </span>
        </div>

        <div className="bg-white border border-slate-200/90 p-4 rounded-2xl shadow-card flex sm:flex-col justify-between items-center sm:items-start">
          <div>
            <span className="text-xs text-slate-500 font-medium block">Total Vault Weight</span>
            <div className="text-lg sm:text-xl font-bold text-amber-700 font-mono mt-0.5 sm:mt-1">
              {(totalGrams / 1000).toFixed(2)} kg{' '}
              <span className="text-xs font-normal text-slate-500">({totalGrams.toFixed(0)}g)</span>
            </div>
          </div>
          <span className="text-[11px] text-amber-700 font-semibold bg-amber-50 sm:bg-transparent px-2 sm:px-0 py-0.5 sm:py-0 rounded">
            Pure Vault Silver
          </span>
        </div>

        <div className="bg-white border border-slate-200/90 p-4 rounded-2xl shadow-card flex sm:flex-col justify-between items-center sm:items-start">
          <div>
            <span className="text-xs text-slate-500 font-medium block">Stock Cost Valuation</span>
            <div className="text-lg sm:text-xl font-bold text-slate-900 font-mono mt-0.5 sm:mt-1">
              ₹{(totalCostValue / 100000).toFixed(2)} Lakhs
            </div>
          </div>
          <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 sm:bg-transparent px-2 sm:px-0 py-0.5 sm:py-0 rounded">
            Purchase basis
          </span>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2 text-xs overflow-x-auto">
        <button
          onClick={() => setActiveTab('STOCK')}
          className={`px-3.5 py-2 rounded-xl font-semibold transition whitespace-nowrap ${
            activeTab === 'STOCK'
              ? 'bg-blue-600 text-white shadow-xs shadow-blue-500/20'
              : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
          }`}
        >
          Live Stock Levels ({products.length})
        </button>

        <button
          onClick={() => setActiveTab('INWARD_LOGS')}
          className={`px-3.5 py-2 rounded-xl font-semibold transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'INWARD_LOGS'
              ? 'bg-blue-600 text-white shadow-xs shadow-blue-500/20'
              : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
          }`}
        >
          <Truck className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Inward Purchase Logs ({purchases.length})</span>
        </button>
      </div>

      {activeTab === 'STOCK' ? (
        <>
          {/* Search & Filters */}
          <div className="bg-white border border-slate-200/90 p-3.5 sm:p-4 rounded-2xl shadow-card space-y-3">
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name or SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl pl-10 pr-3 py-2 text-xs text-slate-900 focus:outline-none font-medium"
                />
              </div>

              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-semibold focus:outline-none w-full sm:w-auto"
              >
                <option value="ALL">All Stock Levels</option>
                <option value="LOW">Low Stock Alert</option>
                <option value="OUT">Out of Stock</option>
              </select>
            </div>

            {/* Category horizontal scrolling pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
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

          {/* Mobile Card List (Visible on < sm screens) */}
          <div className="block sm:hidden space-y-2.5">
            {filteredProducts.map((p) => {
              const isLow = p.stockQuantity <= p.minStockAlert && p.stockQuantity > 0;
              const isOut = p.stockQuantity <= 0;

              return (
                <div
                  key={p.id}
                  className="bg-white border border-slate-200/90 p-3.5 rounded-2xl shadow-card space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-semibold text-xs text-slate-900 block leading-tight">
                        {p.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {p.sku} • {p.purity}% ({p.category})
                      </span>
                    </div>

                    <div>
                      {isOut ? (
                        <span className="bg-rose-50 text-rose-700 border border-rose-200/80 px-2 py-0.5 rounded text-[10px] font-bold">
                          Out of Stock
                        </span>
                      ) : isLow ? (
                        <span className="bg-amber-50 text-amber-800 border border-amber-200/80 px-2 py-0.5 rounded text-[10px] font-bold">
                          Low Stock
                        </span>
                      ) : (
                        <span className="bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-2 py-0.5 rounded text-[10px] font-bold">
                          Available
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Net Weight</span>
                      <span className="font-bold text-slate-900 font-mono">
                        {p.netWeight.toFixed(2)}g
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Cost/g</span>
                      <span className="font-semibold text-slate-600 font-mono">
                        ₹{p.purchaseRatePerGram || 72}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">In Stock</span>
                      <span className="font-bold text-slate-900 font-mono">
                        {p.stockQuantity} pcs
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => setSelectedProductForStock(p)}
                      className="w-full py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 rounded-xl text-xs font-semibold text-center transition"
                    >
                      Adjust Stock (+/-)
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop / Tablet Table View (Hidden on mobile) */}
          <div className="hidden sm:block bg-white border border-slate-200/90 rounded-2xl shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                    <th className="py-3 px-4">Product Name</th>
                    <th className="py-3 px-3">SKU</th>
                    <th className="py-3 px-3">Purity</th>
                    <th className="py-3 px-3 text-right">Net Wt</th>
                    <th className="py-3 px-3 text-right">Cost Rate</th>
                    <th className="py-3 px-3 text-center">Stock Count</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Stock Adjustment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map((p) => {
                    const isLow = p.stockQuantity <= p.minStockAlert && p.stockQuantity > 0;
                    const isOut = p.stockQuantity <= 0;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4 font-semibold text-slate-900">{p.name}</td>
                        <td className="py-3 px-3 font-mono text-slate-500 text-[11px]">{p.sku}</td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                              p.purity >= 99
                                ? 'bg-amber-50 text-amber-800 border-amber-200/80'
                                : 'bg-blue-50 text-blue-700 border-blue-200/80'
                            }`}
                          >
                            {p.purity}%
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-slate-900 font-mono">
                          {p.netWeight.toFixed(2)} g
                        </td>
                        <td className="py-3 px-3 text-right text-slate-600 font-mono">
                          ₹{p.purchaseRatePerGram || 72}/g
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-slate-900 font-mono">
                          {p.stockQuantity} pcs
                        </td>
                        <td className="py-3 px-3 text-center">
                          {isOut ? (
                            <span className="bg-rose-50 text-rose-700 border border-rose-200/80 px-2 py-0.5 rounded-md text-[10px] font-bold">
                              Out of Stock
                            </span>
                          ) : isLow ? (
                            <span className="bg-amber-50 text-amber-800 border border-amber-200/80 px-2 py-0.5 rounded-md text-[10px] font-bold">
                              Low Stock
                            </span>
                          ) : (
                            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-2 py-0.5 rounded-md text-[10px] font-bold">
                              Available
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setSelectedProductForStock(p)}
                            className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 rounded-lg text-xs font-semibold transition"
                          >
                            Adjust (+/-)
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Inward Purchase Logs */
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-card p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Silversmith Purchase Log</h2>
            <button
              onClick={() => setIsPurchaseModalOpen(true)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              + New Entry
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[500px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Vendor</th>
                  <th className="py-3 px-3">Item & SKU</th>
                  <th className="py-3 px-3 text-right">Qty</th>
                  <th className="py-3 px-3 text-right">Weight</th>
                  <th className="py-3 px-3 text-right">Cost/g</th>
                  <th className="py-3 px-3 text-right">Total Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {purchases.map((pur) => (
                  <tr key={pur.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-3 text-slate-500">
                      {new Date(pur.date).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                      })}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-900">{pur.vendorName}</td>
                    <td className="py-3 px-3">
                      <span className="text-slate-800 block">{pur.productName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{pur.productSku}</span>
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-emerald-700 font-mono">
                      +{pur.quantity}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-600">
                      {pur.weightGrams.toFixed(2)}g
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-500">
                      ₹{pur.purchaseRatePerGram}/g
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900 font-mono">
                      ₹{pur.totalCost.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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

      <PurchaseStockInModal
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
        products={products}
        onSavePurchase={handleSavePurchase}
      />

      <QRTagModal
        product={selectedProductForQR}
        isOpen={!!selectedProductForQR}
        onClose={() => setSelectedProductForQR(null)}
      />

      <StockAdjustmentModal
        product={selectedProductForStock}
        isOpen={!!selectedProductForStock}
        onClose={() => setSelectedProductForStock(null)}
        onUpdateStock={handleUpdateStock}
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
