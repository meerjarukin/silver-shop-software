'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  X,
  Users,
  Boxes,
  Receipt,
  Phone,
  ArrowRight,
  Printer,
  QrCode,
  ShoppingCart,
  ChevronRight,
  Scale,
  Gem,
} from 'lucide-react';
import { Product, Customer, Invoice, SilverRates } from '@/lib/types';
import { initialRates } from '@/lib/storage';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCustomerForPOS?: (customer: Customer) => void;
  onSelectProductForQR?: (product: Product) => void;
}

export default function GlobalSearchModal({
  isOpen,
  onClose,
  onSelectCustomerForPOS,
  onSelectProductForQR,
}: GlobalSearchModalProps) {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'CUSTOMERS' | 'PRODUCTS' | 'INVOICES'>('ALL');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [rates, setRates] = useState<SilverRates>(initialRates);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);

      fetch('/api/customers')
        .then((res) => res.json())
        .then((data) => Array.isArray(data) && setCustomers(data))
        .catch(() => {});

      fetch('/api/products')
        .then((res) => res.json())
        .then((data) => Array.isArray(data) && setProducts(data))
        .catch(() => {});

      fetch('/api/billing')
        .then((res) => res.json())
        .then((data) => Array.isArray(data) && setInvoices(data))
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();

  const filteredCustomers = customers.filter(
    (c) => c.name.toLowerCase().includes(q) || c.phone.includes(q)
  );

  const filteredProducts = products.filter(
    (p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
  );

  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.invoiceNumber.toLowerCase().includes(q) ||
      inv.customerName.toLowerCase().includes(q) ||
      inv.customerPhone.includes(q)
  );

  const totalMatches =
    filteredCustomers.length + filteredProducts.length + filteredInvoices.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 bg-slate-900/40 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white border border-slate-200/90 w-full max-w-2xl rounded-2xl shadow-modal overflow-hidden text-slate-900 flex flex-col max-h-[80vh]">
        {/* Search Header */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <Search className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search customers, products, SKU barcodes, invoice numbers..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none font-medium"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-2 py-1 bg-slate-100 rounded-lg"
          >
            ESC
          </button>
        </div>

        {/* Filter Pills */}
        <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center gap-2 text-xs">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-3 py-1 rounded-lg font-semibold transition ${
              activeTab === 'ALL'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Results ({totalMatches})
          </button>
          <button
            onClick={() => setActiveTab('CUSTOMERS')}
            className={`px-3 py-1 rounded-lg font-semibold transition ${
              activeTab === 'CUSTOMERS'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            Customers ({filteredCustomers.length})
          </button>
          <button
            onClick={() => setActiveTab('PRODUCTS')}
            className={`px-3 py-1 rounded-lg font-semibold transition ${
              activeTab === 'PRODUCTS'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            Products ({filteredProducts.length})
          </button>
          <button
            onClick={() => setActiveTab('INVOICES')}
            className={`px-3 py-1 rounded-lg font-semibold transition ${
              activeTab === 'INVOICES'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            Bills ({filteredInvoices.length})
          </button>
        </div>

        {/* Results Body */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {/* Customers Section */}
          {(activeTab === 'ALL' || activeTab === 'CUSTOMERS') &&
            filteredCustomers.length > 0 && (
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-purple-600" />
                  <span>Customers CRM</span>
                </div>
                <div className="space-y-1">
                  {filteredCustomers.slice(0, 4).map((c) => (
                    <div
                      key={c.id}
                      className="p-2.5 hover:bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between transition"
                    >
                      <div>
                        <span className="font-semibold text-xs text-slate-900 block">
                          {c.name}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          +91 {c.phone} {c.address ? `• ${c.address}` : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {c.outstandingBalance > 0 && (
                          <span className="text-[10px] bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded font-bold border border-rose-200">
                            Due: ₹{c.outstandingBalance}
                          </span>
                        )}
                        <button
                          onClick={() => {
                            onClose();
                            router.push(`/pos?phone=${encodeURIComponent(c.phone)}`);
                          }}
                          className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold"
                        >
                          Bill
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Products Section */}
          {(activeTab === 'ALL' || activeTab === 'PRODUCTS') &&
            filteredProducts.length > 0 && (
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Gem className="w-3.5 h-3.5 text-amber-600" />
                  <span>Products Catalog</span>
                </div>
                <div className="space-y-1">
                  {filteredProducts.slice(0, 4).map((p) => (
                    <div
                      key={p.id}
                      className="p-2.5 hover:bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between transition"
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={
                            p.imageUrl ||
                            'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&auto=format&fit=crop&q=80'
                          }
                          alt={p.name}
                          className="w-8 h-8 rounded-lg object-cover border border-slate-200"
                        />
                        <div>
                          <span className="font-semibold text-xs text-slate-900 block">
                            {p.name}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {p.sku} • {p.netWeight}g • {p.purity}% ({p.stockQuantity} in stock)
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          onClose();
                          router.push(`/pos?sku=${encodeURIComponent(p.sku)}`);
                        }}
                        className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold"
                      >
                        + Add to Bill
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Invoices Section */}
          {(activeTab === 'ALL' || activeTab === 'INVOICES') &&
            filteredInvoices.length > 0 && (
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-blue-600" />
                  <span>Invoices & Bills</span>
                </div>
                <div className="space-y-1">
                  {filteredInvoices.slice(0, 4).map((inv) => (
                    <div
                      key={inv.id}
                      className="p-2.5 hover:bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between transition"
                    >
                      <div>
                        <span className="font-mono font-bold text-xs text-blue-600 block">
                          {inv.invoiceNumber}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {inv.customerName} (+91 {inv.customerPhone}) • ₹{inv.grandTotal.toFixed(2)}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          onClose();
                          router.push(`/invoice/${encodeURIComponent(inv.invoiceNumber)}`);
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                      >
                        View PDF
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {totalMatches === 0 && (
            <div className="text-center py-12 text-slate-400 text-xs">
              No results found for &quot;{query}&quot;.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
