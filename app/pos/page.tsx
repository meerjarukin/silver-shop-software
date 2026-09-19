'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import confetti from 'canvas-confetti';
import {
  ShoppingCart,
  QrCode,
  Search,
  Plus,
  Minus,
  Trash2,
  Receipt,
  Phone,
  RotateCcw,
  CheckCircle2,
  UserPlus,
  Gem,
  PackagePlus,
  FileText,
  Percent,
  Wallet,
  ArrowRight,
  Sparkles,
  Scale,
  ShoppingBag,
  CreditCard,
  Calendar,
  AlertCircle,
  UserCheck,
  Lock,
  X,
} from 'lucide-react';
import BarcodeScannerModal from '@/components/BarcodeScannerModal';
import CustomerModal from '@/components/CustomerModal';
import ProductModal from '@/components/ProductModal';
import PDFInvoiceView from '@/components/PDFInvoiceView';
import { Product, SilverRates, CartItem, Customer, Invoice, OldSilverExchange, ShopConfig, InvoiceType, PaymentMode } from '@/lib/types';
import { initialShopConfig } from '@/lib/storage';
import { useRates } from '@/context/RatesContext';

const DEFAULT_CATEGORIES = ['All', 'Anklets', 'Rings', 'Chains', 'Utensils', 'Idols', 'Coins'];

function POSBillingContent() {
  const searchParams = useSearchParams();
  const phoneParam = searchParams.get('phone') || '';
  const skuParam = searchParams.get('sku') || '';

  const { rates } = useRates();
  const [products, setProducts] = useState<Product[]>([]);
  const [categoryNames, setCategoryNames] = useState<string[]>(DEFAULT_CATEGORIES);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [shopConfig, setShopConfig] = useState<ShopConfig>(initialShopConfig);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedMetal, setSelectedMetal] = useState<'ALL' | 'GOLD' | 'SILVER'>('ALL');

  // Mobile View Switcher: 'CATALOG' vs 'BILL'
  const [mobileTab, setMobileTab] = useState<'CATALOG' | 'BILL'>('CATALOG');

  // Bill Format Toggle (Defaults to Estimate / Quotation)
  const [invoiceType, setInvoiceType] = useState<InvoiceType>('ESTIMATE_QUOTATION');
  const [taxType, setTaxType] = useState<'INTRA_STATE' | 'INTER_STATE' | 'NONE'>('NONE');

  // Customer State
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [selectedCustomerObj, setSelectedCustomerObj] = useState<Customer | null>(null);
  const [matchedCustomers, setMatchedCustomers] = useState<Customer[]>([]);
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const customerDropdownRef = useRef<HTMLDivElement>(null);

  // Click outside to close customer suggestions dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        customerDropdownRef.current &&
        !customerDropdownRef.current.contains(event.target as Node)
      ) {
        setIsCustomerDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Advance Adjustment
  const [useAdvanceBalance, setUseAdvanceBalance] = useState(false);

  // Old Silver Scrap Exchange
  const [hasOldSilver, setHasOldSilver] = useState(false);
  const [oldSilver, setOldSilver] = useState<OldSilverExchange>({
    grossWeight: 0,
    purityPercentage: 70.0,
    meltRatePerGram: rates.scrapRateBuyback || 81.0,
    totalValue: 0,
  });

  useEffect(() => {
    if (rates.scrapRateBuyback) {
      setOldSilver((prev) => ({ ...prev, meltRatePerGram: rates.scrapRateBuyback }));
    }
  }, [rates.scrapRateBuyback]);

  // Billing adjustments
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('UPI');
  const [customPaidAmount, setCustomPaidAmount] = useState<number | null>(null);
  const [dueDate, setDueDate] = useState<string>('');
  const [billNotes, setBillNotes] = useState('');

  // Post Checkout
  const [completedInvoice, setCompletedInvoice] = useState<Invoice | null>(null);

  // Modals
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productInitialName, setProductInitialName] = useState("");

  useEffect(() => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setProducts(data);
          if (skuParam && data.length > 0) {
            const found = data.find((p: Product) => p.sku.toLowerCase() === skuParam.toLowerCase());
            if (found) addToCart(found);
          }
        }
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

    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.shopName) {
          setShopConfig(data);
        }
      })
      .catch(() => {});

    fetch('/api/customers')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCustomers(data);
          if (phoneParam && data.length > 0) {
            const found = data.find((c: Customer) => c.phone === phoneParam);
            if (found) {
              setCustomerPhone(found.phone);
              setCustomerName(found.name);
              setCustomerAddress(found.address || '');
              setSelectedCustomerObj(found);
            } else {
              setCustomerPhone(phoneParam);
            }
          }
        }
      })
    const handleCategoriesUpdated = (e: any) => {
      const data = e.detail;
      if (Array.isArray(data) && data.length > 0) {
        setCategoryNames(['All', ...data.map((c: any) => c.name)]);
      }
    };
    window.addEventListener('categoriesUpdated', handleCategoriesUpdated);

    return () => {
      window.removeEventListener('categoriesUpdated', handleCategoriesUpdated);
    };
  }, [phoneParam, skuParam]);

  const handlePhoneChange = (phoneInput: string) => {
    // Only allow numeric digits (0-9) up to 10 digits
    const digitsOnly = phoneInput.replace(/\D/g, '').slice(0, 10);
    setCustomerPhone(digitsOnly);

    if (digitsOnly.length >= 2) {
      const matches = customers.filter(
        (c) => c.phone.includes(digitsOnly) || c.name.toLowerCase().includes(digitsOnly.toLowerCase())
      );
      setMatchedCustomers(matches);
      setIsCustomerDropdownOpen(matches.length > 0);

      const exact = customers.find((c) => c.phone === digitsOnly);
      if (exact) {
        setCustomerName(exact.name);
        setCustomerAddress(exact.address || '');
        setSelectedCustomerObj(exact);
        setIsCustomerDropdownOpen(false);
      } else {
        setSelectedCustomerObj(null);
      }
    } else {
      setMatchedCustomers([]);
      setIsCustomerDropdownOpen(false);
      setSelectedCustomerObj(null);
    }
  };

  const handleNameChange = (nameInput: string) => {
    if (selectedCustomerObj) return; // Locked to existing customer
    setCustomerName(nameInput);

    if (nameInput.trim().length >= 2 && customerPhone.length < 10) {
      const matches = customers.filter((c) =>
        c.name.toLowerCase().includes(nameInput.toLowerCase()) || c.phone.includes(nameInput)
      );
      setMatchedCustomers(matches);
      setIsCustomerDropdownOpen(matches.length > 0);
    } else if (customerPhone.length < 2) {
      setMatchedCustomers([]);
      setIsCustomerDropdownOpen(false);
    }
  };

  const handlePhoneKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      e.key === 'Backspace' ||
      e.key === 'Delete' ||
      e.key === 'Tab' ||
      e.key === 'Escape' ||
      e.key === 'Enter' ||
      e.key === 'ArrowLeft' ||
      e.key === 'ArrowRight' ||
      e.ctrlKey ||
      e.metaKey
    ) {
      return;
    }
    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
    }
  };

  const selectCustomer = (c: Customer) => {
    setCustomerPhone(c.phone);
    setCustomerName(c.name);
    setCustomerAddress(c.address || '');
    setSelectedCustomerObj(c);
    setMatchedCustomers([]);
    setIsCustomerDropdownOpen(false);
  };

  const clearSelectedCustomer = () => {
    setCustomerPhone('');
    setCustomerName('');
    setCustomerAddress('');
    setSelectedCustomerObj(null);
    setMatchedCustomers([]);
    setIsCustomerDropdownOpen(false);
    setUseAdvanceBalance(false);
  };

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

  const getWastageAndMaking = (product: Product, quantity = 1) => {
    const isGold = product.metalType === 'GOLD' || product.sku?.startsWith('GLD');
    const applicableRate = getProductRate(product.purity, isGold ? 'GOLD' : product.metalType, product.purityGrade);
    const metalVal = product.netWeight * applicableRate * quantity;
    const wastage = metalVal * ((product.wastagePercentage || 0) / 100);

    let making = 0;
    if (product.makingChargeType === 'PER_GRAM') {
      making = product.netWeight * product.makingChargeValue * quantity;
    } else if (product.makingChargeType === 'FLAT') {
      making = product.makingChargeValue * quantity;
    } else {
      making = metalVal * (product.makingChargeValue / 100);
    }

    return { metalVal, wastage, making, total: metalVal + wastage + making };
  };

  const addToCart = (product: Product) => {
    const isGold = product.metalType === 'GOLD' || product.sku?.startsWith('GLD');
    const applicableRate = getProductRate(product.purity, isGold ? 'GOLD' : product.metalType, product.purityGrade);

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((item) => item.product.sku === product.sku);

      if (existingIndex > -1) {
        const updated = [...prevCart];
        const newQty = updated[existingIndex].quantity + 1;
        const { wastage, making, total } = getWastageAndMaking(product, newQty);

        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
          wastageAmount: wastage,
          makingCharge: making,
          totalPrice: total,
        };
        return updated;
      } else {
        const { wastage, making, total } = getWastageAndMaking(product, 1);
        return [
          ...prevCart,
          {
            product,
            quantity: 1,
            silverRateApplied: applicableRate,
            wastageAmount: wastage,
            makingCharge: making,
            stoneCharge: 0,
            totalPrice: total,
          },
        ];
      }
    });
  };

  const updateQuantity = (sku: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.sku === sku) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            const { wastage, making, total } = getWastageAndMaking(item.product, newQty);
            return {
              ...item,
              quantity: newQty,
              wastageAmount: wastage,
              makingCharge: making,
              totalPrice: total,
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (sku: string) => {
    setCart((prev) => prev.filter((item) => item.product.sku !== sku));
  };

  const handleSaveNewProduct = async (prodData: Partial<Product>) => {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const categoryCode = prodData.category ? prodData.category.substring(0, 3).toUpperCase() : 'ANK';
    const metalType = prodData.metalType || (prodData.sku?.startsWith('GLD') ? 'GOLD' : 'SILVER');
    const metalPrefix = (metalType as string) === 'GOLD' ? 'GLD' : (metalType as string) === 'PLATINUM' ? 'PLT' : 'SLV';
    const purityCode = metalType === 'GOLD' ? '916' : '925';
    const generatedSku = prodData.sku || `${metalPrefix}-${categoryCode}-${purityCode}-${randomSuffix}`;

    const grossWeight = Number(prodData.grossWeight || 0);
    const stoneWeight = Number(prodData.stoneWeight || 0);
    const netWeight = Number(prodData.netWeight || Math.max(0, grossWeight - stoneWeight));

    const newProduct: Product = {
      id: prodData.id || `prod-${Date.now()}`,
      sku: generatedSku,
      name: prodData.name || 'New Jewellery Item',
      category: prodData.category || 'Anklets',
      metalType,
      description: prodData.description || '',
      grossWeight,
      stoneWeight,
      netWeight,
      purity: Number(prodData.purity || 92.5),
      purityGrade: prodData.purityGrade || '925 Sterling',
      purchaseRatePerGram: Number(prodData.purchaseRatePerGram || 72),
      wastagePercentage: Number(prodData.wastagePercentage || 0),
      makingChargeType: prodData.makingChargeType || 'PER_GRAM',
      makingChargeValue: Number(prodData.makingChargeValue || 0),
      gstPercentage: Number(prodData.gstPercentage || 3),
      stockQuantity: Number(prodData.stockQuantity || 5),
      minStockAlert: Number(prodData.minStockAlert || 1),
      imageUrl: prodData.imageUrl || '',
      qrCodeUrl: prodData.qrCodeUrl || '',
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    // 1. Add to local catalog immediately
    setProducts((prev) => [newProduct, ...prev.filter((p) => p.sku !== newProduct.sku)]);

    // 2. Automatically add to active bill / cart!
    addToCart(newProduct);

    // 3. Reset search query and close modal
    setSearchQuery('');
    setIsProductModalOpen(false);
    setProductInitialName('');

    // 4. Persist to database via API
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct),
      });
      if (res.ok) {
        const savedDBProduct = await res.json();
        if (savedDBProduct && savedDBProduct.id) {
          setProducts((prev) =>
            prev.map((p) => (p.sku === newProduct.sku ? { ...p, ...savedDBProduct } : p))
          );
          setCart((prev) =>
            prev.map((item) =>
              item.product.sku === newProduct.sku
                ? { ...item, product: { ...item.product, ...savedDBProduct } }
                : item
            )
          );
        }
      }
    } catch (err) {
      console.error('Failed to persist new product:', err);
    }
  };


  const sanitizePositiveInput = (val: string): number => {
    // Strip any minus sign, exponent or non-numeric chars except dot
    const cleaned = val.replace(/[^0-9.]/g, '').replace(/^0+(?=\d)/, '');
    if (!cleaned) return 0;
    const num = parseFloat(cleaned);
    return isNaN(num) || num < 0 ? 0 : num;
  };

  const handleNumericKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === '-' || e.key === '+' || e.key === 'e' || e.key === 'E') {
      e.preventDefault();
    }
  };

  const handleOldSilverChange = (field: keyof OldSilverExchange, value: number) => {
    const updated = { ...oldSilver, [field]: value };
    const netGrams = updated.grossWeight * (updated.purityPercentage / 100);
    updated.totalValue = netGrams * updated.meltRatePerGram;
    setOldSilver(updated);
  };

  // Totals
  const subtotal = cart.reduce((acc, item) => acc + item.totalPrice, 0);
  const totalWastage = cart.reduce((acc, item) => acc + (item.wastageAmount || 0), 0);
  const totalMaking = cart.reduce((acc, item) => acc + item.makingCharge, 0);
  const totalNetGrams = cart.reduce((acc, item) => acc + item.product.netWeight * item.quantity, 0);
  const oldSilverDeduction = hasOldSilver ? oldSilver.totalValue : 0;
  const taxableAmount = Math.max(0, subtotal - discountAmount - oldSilverDeduction);

  let cgst = 0;
  let sgst = 0;
  let igst = 0;

  if (invoiceType === 'TAX_INVOICE') {
    if (taxType === 'INTER_STATE') {
      igst = taxableAmount * 0.03;
    } else {
      cgst = taxableAmount * 0.015;
      sgst = taxableAmount * 0.015;
    }
  }

  const totalPayable = taxableAmount + cgst + sgst + igst;
  const advanceAvailable = selectedCustomerObj?.advanceBalance || 0;
  const advanceDeduction = useAdvanceBalance ? Math.min(advanceAvailable, totalPayable) : 0;
  const basePayable = Math.max(0, totalPayable - advanceDeduction);

  // Credit Card Surcharge (2.25%)
  const isCreditCard = paymentMode === 'CREDIT_CARD' || paymentMode === 'CARD';
  const cardCharge = isCreditCard ? basePayable * 0.0225 : 0;
  const grandTotal = basePayable + cardCharge;

  // Partial Payment & Due Calculation
  const paidAmount =
    customPaidAmount !== null
      ? Math.max(0, Math.min(customPaidAmount, grandTotal))
      : grandTotal;
  const dueAmount = Math.max(0, grandTotal - paidAmount);
  const paymentStatus: 'PAID' | 'PARTIAL' | 'DUE' =
    dueAmount <= 0 ? 'PAID' : paidAmount > 0 ? 'PARTIAL' : 'DUE';

  const setPresetDueDate = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setDueDate(d.toISOString().split('T')[0]);
  };

  const costOfGoodsSold = cart.reduce((acc, item) => {
    const costPerGram = item.product.purchaseRatePerGram || 72.0;
    return acc + costPerGram * item.product.netWeight * item.quantity;
  }, 0);
  const profit = Math.max(0, taxableAmount - costOfGoodsSold);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    if (!customerPhone.trim() || !customerName.trim()) {
      alert('Please enter Customer Name and Mobile Number');
      return;
    }

    const invoicePayload = {
      invoiceType,
      taxType: invoiceType === 'TAX_INVOICE' ? taxType : 'NONE',
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerAddress: customerAddress.trim() || undefined,
      subtotal,
      wastageTotal: totalWastage,
      makingCharges: totalMaking,
      discount: discountAmount,
      oldSilver: hasOldSilver ? oldSilver : undefined,
      taxableAmount,
      cgst: invoiceType === 'TAX_INVOICE' ? cgst : 0,
      sgst: invoiceType === 'TAX_INVOICE' ? sgst : 0,
      igst: invoiceType === 'TAX_INVOICE' ? igst : 0,
      cardCharge,
      grandTotal,
      paymentMode: useAdvanceBalance && grandTotal === 0 ? 'ADVANCE_ADJUST' : paymentMode,
      paymentStatus,
      paidAmount,
      dueAmount,
      dueDate: dueAmount > 0 && dueDate ? dueDate : undefined,
      costOfGoodsSold,
      profit,
      notes: billNotes.trim() || undefined,
      items: cart.map((item) => ({
        productSku: item.product.sku,
        productName: item.product.name,
        quantity: item.quantity,
        grossWeight: item.product.grossWeight,
        netWeight: item.product.netWeight,
        purity: item.product.purity,
        silverRateApplied: item.silverRateApplied,
        wastageAmount: item.wastageAmount,
        makingCharge: item.makingCharge,
        totalPrice: item.totalPrice,
        hsnCode: '7113',
      })),
    };

    try {
      const res = await fetch('/api/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoicePayload),
      });
      const data = await res.json();
      setCompletedInvoice({
        ...data,
        invoiceType: data.invoiceType || invoiceType,
        taxType: data.taxType || (invoiceType === 'TAX_INVOICE' ? taxType : 'NONE'),
      });

      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch (ce) {}

      setProducts((prev) =>
        prev.map((p) => {
          const inCart = cart.find((c) => c.product.sku === p.sku);
          if (inCart) {
            return { ...p, stockQuantity: Math.max(0, p.stockQuantity - inCart.quantity) };
          }
          return p;
        })
      );
    } catch (err) {
      console.error('Checkout error:', err);
    }
  };

  if (completedInvoice) {
    return (
      <PDFInvoiceView
        invoice={completedInvoice}
        config={shopConfig}
        onBack={() => {
          setCompletedInvoice(null);
          setCart([]);
          setCustomerName('');
          setCustomerPhone('');
          setCustomerAddress('');
          setHasOldSilver(false);
          setDiscountAmount(0);
          setUseAdvanceBalance(false);
          setCustomPaidAmount(null);
          setDueDate('');
        }}
      />
    );
  }

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    const isGold = p.metalType === 'GOLD' || p.sku.startsWith('GLD');
    const matchesMetal =
      selectedMetal === 'ALL' ||
      (selectedMetal === 'GOLD' && isGold) ||
      (selectedMetal === 'SILVER' && !isGold);
    return matchesSearch && matchesCat && matchesMetal;
  });

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
      {/* Mobile Tab Switcher (Visible on < lg screens) */}
      <div className="flex lg:hidden items-center bg-slate-200/80 p-1 rounded-2xl mb-4 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setMobileTab('CATALOG')}
          className={`flex-1 py-2 rounded-xl text-center transition flex items-center justify-center gap-1.5 ${
            mobileTab === 'CATALOG'
              ? 'bg-white text-blue-700 shadow-xs'
              : 'text-slate-600'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Items Catalogue</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('BILL')}
          className={`flex-1 py-2 rounded-xl text-center transition flex items-center justify-center gap-1.5 ${
            mobileTab === 'BILL'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>Current Bill ({cart.length}) • ₹{grandTotal.toFixed(0)}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Fast Product Search & Grid (7 cols) */}
        <div className={`lg:col-span-7 space-y-4 ${mobileTab === 'BILL' ? 'hidden lg:block' : 'block'}`}>
          {/* Search & Category Filter */}
          <div className="bg-white border border-slate-200/90 p-3.5 sm:p-4 rounded-2xl shadow-card space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name or SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl pl-10 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition font-medium"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  setProductInitialName(searchQuery.trim());
                  setIsProductModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-semibold transition flex-shrink-0 shadow-xs active:scale-98"
                title="Add New Product to Inventory & Bill"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Product</span>
              </button>

              <button
                onClick={() => setIsScannerOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 rounded-xl text-xs font-semibold transition flex-shrink-0 shadow-2xs"
                title="Camera QR Scanner"
              >
                <QrCode className="w-4 h-4 text-blue-600" />
                <span className="hidden sm:inline">Scan QR</span>
              </button>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-0.5 text-xs no-scrollbar">
              {/* Main Metal Filter Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200/80 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedMetal('ALL')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    selectedMetal === 'ALL'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  All
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

              {/* Category Pills */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                {categoryNames.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-lg font-semibold transition whitespace-nowrap ${
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

          {/* Product Cards Grid / Empty State */}
          {filteredProducts.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-8 text-center space-y-4 shadow-card">
              <div className="w-14 h-14 bg-amber-50 border border-amber-200/70 text-amber-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
                <Gem className="w-7 h-7" />
              </div>
              <div className="max-w-md mx-auto">
                <h3 className="text-sm font-bold text-slate-800">
                  {searchQuery ? `"${searchQuery}" not found in catalogue` : 'No products found'}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  This product is not registered in your inventory yet. You can add it directly to your catalogue and active bill right now.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setProductInitialName(searchQuery.trim());
                  setIsProductModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-98"
              >
                <Plus className="w-4 h-4" />
                <span>+ Create {searchQuery ? `"${searchQuery}"` : 'New Product'} &amp; Add to Bill</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 max-h-[calc(100vh-230px)] overflow-y-auto pr-1">
              {filteredProducts.map((product) => {
              const { total } = getWastageAndMaking(product, 1);
              const isOutOfStock = product.stockQuantity <= 0;

              return (
                <button
                  key={product.id}
                  onClick={() => !isOutOfStock && addToCart(product)}
                  disabled={isOutOfStock}
                  className="p-2.5 sm:p-3 rounded-2xl bg-white hover:bg-slate-50/80 border border-slate-200/90 hover:border-blue-300 transition text-left flex flex-col justify-between group disabled:opacity-40 disabled:cursor-not-allowed shadow-card"
                >
                  <div className="w-full">
                    <div className="relative aspect-video w-full rounded-xl overflow-hidden mb-1.5 sm:mb-2 bg-slate-100">
                      <img
                        src={
                          product.imageUrl ||
                          'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&auto=format&fit=crop&q=80'
                        }
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition"
                      />
                      <span className={`absolute top-1 left-1 text-white text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs ${
                        product.metalType === 'GOLD' || product.sku.startsWith('GLD')
                          ? 'bg-amber-600'
                          : 'bg-slate-700'
                      }`}>
                        {product.metalType === 'GOLD' || product.sku.startsWith('GLD') ? 'GLD' : 'SLV'} • {product.purity}%
                      </span>
                    </div>

                    <span className="text-[9px] sm:text-[10px] text-slate-400 font-mono block">{product.sku}</span>
                    <h4 className="font-semibold text-slate-900 text-xs line-clamp-1 group-hover:text-blue-600">
                      {product.name}
                    </h4>
                  </div>

                  <div className="w-full mt-1.5 pt-1.5 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[10px] sm:text-[11px] text-slate-500 font-mono">{product.netWeight}g</span>
                    <span className="font-bold text-slate-900 font-mono text-xs">
                      ₹{total.toFixed(0)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
        </div>

        {/* RIGHT COLUMN: Active Cart / Bill Summary (5 cols) */}
        <div className={`lg:col-span-5 bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-card space-y-4 ${mobileTab === 'CATALOG' ? 'hidden lg:block' : 'block'}`}>
          {/* Bill Type Header */}
          <div className="space-y-3 pb-3 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <div className="p-1 rounded-md bg-blue-50 text-blue-600">
                  <Receipt className="w-4 h-4" />
                </div>
                <span>Current Bill</span>
              </h2>

              <span className="text-xs font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60">
                {totalNetGrams.toFixed(2)} g silver
              </span>
            </div>

            {/* 3-Way Bill Format Toggle with macOS Style Badges */}
            <div className="grid grid-cols-3 gap-1.5 bg-slate-100/80 p-1 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => {
                  setInvoiceType('TAX_INVOICE');
                  setTaxType('INTRA_STATE');
                }}
                className={`py-1 rounded-lg font-bold transition ${
                  invoiceType === 'TAX_INVOICE'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                GST (3%)
              </button>
              <button
                type="button"
                onClick={() => {
                  setInvoiceType('NON_GST_BILL');
                  setTaxType('NONE');
                }}
                className={`py-1 rounded-lg font-bold transition ${
                  invoiceType === 'NON_GST_BILL'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Non-GST
              </button>
              <button
                type="button"
                onClick={() => {
                  setInvoiceType('ESTIMATE_QUOTATION');
                  setTaxType('NONE');
                }}
                className={`py-1 rounded-lg font-bold transition ${
                  invoiceType === 'ESTIMATE_QUOTATION'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Estimate
              </button>
            </div>
          </div>

          {/* Customer Select Form with Autocomplete Suggestions */}
          <div className="space-y-2 relative" ref={customerDropdownRef}>
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-blue-600" />
                <span>Customer Contact *</span>
              </span>
              <div className="flex items-center gap-2">
                {(customerPhone || customerName || selectedCustomerObj) && (
                  <button
                    type="button"
                    onClick={clearSelectedCustomer}
                    className="text-[11px] text-slate-400 hover:text-slate-700 hover:underline flex items-center gap-0.5"
                    title="Clear customer details"
                  >
                    <X className="w-3 h-3" />
                    <span>Clear</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(true)}
                  className="text-blue-600 hover:text-blue-700 font-semibold text-xs flex items-center gap-1"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ New Customer</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Mobile Input */}
              <div className="relative">
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={10}
                  placeholder="Mobile (e.g. 9845012345)"
                  value={customerPhone}
                  onFocus={() => {
                    if (matchedCustomers.length > 0) setIsCustomerDropdownOpen(true);
                  }}
                  onKeyDown={handlePhoneKeyDown}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  className={`w-full bg-slate-50 border ${
                    selectedCustomerObj
                      ? 'border-emerald-300 bg-emerald-50/40 text-emerald-900'
                      : 'border-slate-200 focus:border-blue-500 text-slate-900'
                  } focus:ring-2 focus:ring-blue-100 rounded-xl px-3 py-1.5 text-xs focus:outline-none font-semibold font-mono transition`}
                />
                {selectedCustomerObj && (
                  <span className="absolute right-2.5 top-2 text-emerald-600" title="Existing registered customer">
                    <CheckCircle2 className="w-4 h-4" />
                  </span>
                )}
              </div>

              {/* Customer Name Input (Locked when matched to existing customer) */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Customer Name *"
                  value={customerName}
                  readOnly={!!selectedCustomerObj}
                  onChange={(e) => handleNameChange(e.target.value)}
                  onFocus={() => {
                    if (!selectedCustomerObj && matchedCustomers.length > 0) setIsCustomerDropdownOpen(true);
                  }}
                  className={`w-full ${
                    selectedCustomerObj
                      ? 'bg-slate-100/90 text-slate-800 cursor-not-allowed border-slate-200 font-bold'
                      : 'bg-slate-50 text-slate-900 border-slate-200 focus:border-blue-500 font-medium'
                  } border focus:ring-2 focus:ring-blue-100 rounded-xl px-3 py-1.5 text-xs focus:outline-none transition`}
                />
                {selectedCustomerObj && (
                  <span
                    className="absolute right-2.5 top-2 text-slate-400"
                    title="Name is locked to this registered mobile number to prevent duplicate profiles"
                  >
                    <Lock className="w-3.5 h-3.5 text-slate-500" />
                  </span>
                )}
              </div>
            </div>

            {/* Customer Status Alert Banner */}
            {selectedCustomerObj ? (
              <div className="flex items-center justify-between p-2 bg-emerald-50 border border-emerald-200/80 rounded-xl text-[11px] text-emerald-900 animate-fade-in">
                <div className="flex items-center gap-1.5 min-w-0">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span className="truncate">
                    <strong>{selectedCustomerObj.name}</strong> • {selectedCustomerObj.totalBills || 0} bills (₹{(selectedCustomerObj.totalSpend || 0).toLocaleString('en-IN')})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={clearSelectedCustomer}
                  className="text-[10px] text-emerald-700 hover:text-emerald-900 font-bold underline ml-2 flex-shrink-0"
                >
                  Change
                </button>
              </div>
            ) : customerPhone.length === 10 ? (
              <div className="flex items-center gap-1.5 p-2 bg-blue-50 border border-blue-200/80 rounded-xl text-[11px] text-blue-900 animate-fade-in">
                <Sparkles className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                <span>
                  <strong>New Customer Entry</strong>: Enter name above to create profile.
                </span>
              </div>
            ) : null}

            {/* Smart Suggestions Dropdown */}
            {isCustomerDropdownOpen && matchedCustomers.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-30 bg-white border border-slate-200 rounded-2xl shadow-xl mt-1.5 overflow-hidden max-h-56 overflow-y-auto">
                <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                  <span>Matching Registered Customers</span>
                  <span className="font-mono text-blue-600">{matchedCustomers.length} Found</span>
                </div>
                {matchedCustomers.map((c) => {
                  const initials = c.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase();

                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => selectCustomer(c)}
                      className="w-full px-3 py-2 text-left hover:bg-blue-50/80 border-b border-slate-100 last:border-0 flex items-center justify-between gap-2 transition group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] flex items-center justify-center flex-shrink-0 group-hover:bg-blue-600 group-hover:text-white transition">
                          {initials || 'C'}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-slate-900 group-hover:text-blue-700 truncate">
                            {c.name}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            +91 {c.phone} {c.address ? `• ${c.address}` : ''}
                          </div>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <span className="text-[10px] font-mono font-bold text-slate-700 block">
                          ₹{(c.totalSpend || 0).toLocaleString('en-IN')}
                        </span>
                        <span className="text-[9px] text-slate-400">
                          {c.totalBills || 0} bills
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Advance Balance Pill */}
            {selectedCustomerObj && selectedCustomerObj.advanceBalance > 0 && (
              <div className="flex items-center justify-between text-xs bg-emerald-50 p-2 rounded-xl border border-emerald-200">
                <span className="text-emerald-800 text-[11px]">
                  Advance: <strong>₹{selectedCustomerObj.advanceBalance}</strong>
                </span>
                <label className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useAdvanceBalance}
                    onChange={(e) => setUseAdvanceBalance(e.target.checked)}
                  />
                  <span>Use Advance</span>
                </label>
              </div>
            )}
          </div>

          {/* Cart Items List */}
          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
            {cart.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs space-y-2">
                <ShoppingCart className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                <span>Cart is empty. Click products or scan barcode to add.</span>
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      setProductInitialName('');
                      setIsProductModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition"
                  >
                    <Plus className="w-3 h-3" />
                    <span>+ Add New Product to Bill</span>
                  </button>
                </div>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.product.sku}
                  className="p-2.5 bg-slate-50/90 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs"
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <span className="font-semibold text-slate-900 block truncate">
                      {item.product.name}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {item.product.netWeight}g • ₹{item.silverRateApplied}/g • Making: ₹
                      {item.makingCharge.toFixed(0)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 bg-white border border-slate-200 px-1.5 py-0.5 rounded-lg shadow-2xs">
                    <button
                      onClick={() => updateQuantity(item.product.sku, -1)}
                      className="text-slate-400 hover:text-slate-900"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-bold text-slate-900 px-1 text-xs">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.sku, 1)}
                      className="text-slate-400 hover:text-slate-900"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="text-right pl-2 sm:pl-3">
                    <div className="font-bold text-slate-900 font-mono">
                      ₹{item.totalPrice.toFixed(0)}
                    </div>
                    <button
                      onClick={() => removeFromCart(item.product.sku)}
                      className="text-rose-500 hover:text-rose-700 text-[10px]"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Old Silver Scrap Buyback Accordion */}
          <div className="border-t border-slate-100 pt-2">
            <button
              type="button"
              onClick={() => setHasOldSilver(!hasOldSilver)}
              className="flex items-center justify-between w-full text-xs font-semibold text-amber-800 hover:text-amber-900 py-1"
            >
              <div className="flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                <span>Old Silver Scrap Buyback</span>
              </div>
              <span className="text-[10px] bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
                {hasOldSilver ? 'Hide' : '+ Add Scrap'}
              </span>
            </button>

            {hasOldSilver && (
              <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-200 mt-2 space-y-2 text-xs">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 block">Gross Wt (g)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="0.0"
                      value={oldSilver.grossWeight === 0 ? '' : oldSilver.grossWeight}
                      onKeyDown={handleNumericKeyDown}
                      onChange={(e) =>
                        handleOldSilverChange('grossWeight', sanitizePositiveInput(e.target.value))
                      }
                      className="w-full bg-white border border-slate-200 rounded-lg p-1 text-xs text-slate-900 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block">Purity (%)</label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      max="100"
                      placeholder="80"
                      value={oldSilver.purityPercentage === 0 ? '' : oldSilver.purityPercentage}
                      onKeyDown={handleNumericKeyDown}
                      onChange={(e) =>
                        handleOldSilverChange('purityPercentage', sanitizePositiveInput(e.target.value))
                      }
                      className="w-full bg-white border border-slate-200 rounded-lg p-1 text-xs text-slate-900 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block">Rate/g</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      placeholder="0.0"
                      value={oldSilver.meltRatePerGram === 0 ? '' : oldSilver.meltRatePerGram}
                      onKeyDown={handleNumericKeyDown}
                      onChange={(e) =>
                        handleOldSilverChange('meltRatePerGram', sanitizePositiveInput(e.target.value))
                      }
                      className="w-full bg-white border border-slate-200 rounded-lg p-1 text-xs text-slate-900 font-mono"
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center text-rose-600 font-semibold pt-1 text-xs">
                  <span>Deduction Value:</span>
                  <span>- ₹{oldSilver.totalValue.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Discount & Payment Method */}
          <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-100 pt-2">
            <div>
              <label className="text-[10px] text-slate-500 block mb-0.5">Discount (₹)</label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={discountAmount === 0 ? '' : discountAmount}
                onKeyDown={handleNumericKeyDown}
                onChange={(e) => setDiscountAmount(sanitizePositiveInput(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-mono font-medium"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-500 block mb-0.5">Payment Method</label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-semibold"
              >
                <option value="UPI">UPI (GPay / QR)</option>
                <option value="CASH">Cash in Drawer</option>
                <option value="CREDIT_CARD">Credit Card (+2.25% charge)</option>
                <option value="DEBIT_CARD">Debit Card (0% fee)</option>
                <option value="KHATA">Khata / Store Credit</option>
              </select>
            </div>
          </div>

          {/* Credit Card Surcharge Notification */}
          {cardCharge > 0 && (
            <div className="flex justify-between items-center text-blue-700 bg-blue-50/90 px-3 py-2 rounded-xl border border-blue-200/70 text-xs font-semibold animate-fade-in">
              <span className="flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                <span>Credit Card Surcharge (2.25%):</span>
              </span>
              <span className="font-mono font-bold">+ ₹{cardCharge.toFixed(2)}</span>
            </div>
          )}

          {/* Payment Settlement & Credit/Due Management */}
          <div className="bg-slate-50/90 border border-slate-200/90 p-3 rounded-xl space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                <Wallet className="w-3.5 h-3.5 text-slate-500" />
                Payment Settlement
              </span>
              {dueAmount > 0 ? (
                <button
                  type="button"
                  onClick={() => setCustomPaidAmount(null)}
                  className="text-[10px] font-semibold text-blue-600 hover:text-blue-800 underline"
                >
                  Set Full Pay (₹{grandTotal.toFixed(0)})
                </button>
              ) : (
                <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Full Payment
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-500 block mb-0.5">Amount Paid (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={
                    customPaidAmount !== null
                      ? customPaidAmount === 0
                        ? ''
                        : customPaidAmount
                      : grandTotal > 0
                      ? Number(grandTotal.toFixed(2))
                      : ''
                  }
                  onKeyDown={handleNumericKeyDown}
                  onChange={(e) => {
                    if (e.target.value === '') {
                      setCustomPaidAmount(0);
                    } else {
                      setCustomPaidAmount(sanitizePositiveInput(e.target.value));
                    }
                  }}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 block mb-0.5">Balance Due / Credit</label>
                <div
                  className={`px-2.5 py-1.5 rounded-lg font-mono font-bold text-xs border ${
                    dueAmount > 0
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  ₹{dueAmount.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Promised Repayment Date when there is outstanding balance */}
            {dueAmount > 0 && (
              <div className="pt-2 border-t border-slate-200/80 space-y-1.5 animate-fade-in">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-semibold text-amber-900 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-amber-600" />
                    Promised Repayment Date:
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setPresetDueDate(7)}
                      className="px-2 py-0.5 bg-amber-100/80 hover:bg-amber-200 text-amber-900 rounded font-semibold text-[9px] transition"
                    >
                      +7d
                    </button>
                    <button
                      type="button"
                      onClick={() => setPresetDueDate(15)}
                      className="px-2 py-0.5 bg-amber-100/80 hover:bg-amber-200 text-amber-900 rounded font-semibold text-[9px] transition"
                    >
                      +15d
                    </button>
                    <button
                      type="button"
                      onClick={() => setPresetDueDate(30)}
                      className="px-2 py-0.5 bg-amber-100/80 hover:bg-amber-200 text-amber-900 rounded font-semibold text-[9px] transition"
                    >
                      +30d
                    </button>
                  </div>
                </div>

                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-white border border-amber-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-200"
                />
              </div>
            )}
          </div>

          {/* Final Calculations & Checkout Trigger */}
          <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-semibold text-slate-900 font-mono">₹{subtotal.toFixed(2)}</span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold font-mono">
                <span>Discount:</span>
                <span>- ₹{discountAmount.toFixed(2)}</span>
              </div>
            )}

            {oldSilverDeduction > 0 && (
              <div className="flex justify-between text-rose-600 font-semibold font-mono">
                <span>Old Silver Credit:</span>
                <span>- ₹{oldSilverDeduction.toFixed(2)}</span>
              </div>
            )}

            {invoiceType === 'TAX_INVOICE' && (
              <div className="flex justify-between text-slate-500">
                <span>GST (3%):</span>
                <span className="font-mono">₹{(cgst + sgst + igst).toFixed(2)}</span>
              </div>
            )}

            {cardCharge > 0 && (
              <div className="flex justify-between text-blue-700 font-semibold font-mono">
                <span>Credit Card Charge (2.25%):</span>
                <span>+ ₹{cardCharge.toFixed(2)}</span>
              </div>
            )}

            {advanceDeduction > 0 && (
              <div className="flex justify-between text-emerald-600 font-bold font-mono">
                <span>Advance Adjusted:</span>
                <span>- ₹{advanceDeduction.toFixed(2)}</span>
              </div>
            )}

            {/* Checkout Button in Apple Blue */}
            <button
              onClick={handleCheckout}
              disabled={cart.length === 0}
              className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold rounded-xl text-xs shadow-sm shadow-blue-500/20 transition active:scale-98 flex items-center justify-between mt-3"
            >
              <div className="text-left">
                <span className="text-[10px] uppercase font-semibold text-blue-100 block">
                  Total Payable ({cart.length} items)
                </span>
                <span className="text-base sm:text-lg font-mono font-bold">₹{grandTotal.toFixed(2)}</span>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-semibold bg-white/20 px-3 py-1.5 rounded-lg">
                <span>
                  {invoiceType === 'ESTIMATE_QUOTATION' ? 'Print Quote' : 'Complete Bill'}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Floating Bottom Bar on Mobile when Cart has items & User is in Catalog tab */}
      {cart.length > 0 && mobileTab === 'CATALOG' && (
        <div className="lg:hidden fixed bottom-3 left-3 right-3 z-30 animate-fade-in">
          <button
            onClick={() => setMobileTab('BILL')}
            className="w-full py-3 px-4 bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-500/30 flex items-center justify-between text-xs"
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center font-mono text-xs">
                {cart.length}
              </div>
              <span>Items in Bill</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm">₹{grandTotal.toFixed(0)}</span>
              <span className="bg-white/20 px-2 py-1 rounded-lg text-[11px] font-semibold">
                Checkout →
              </span>
            </div>
          </button>
        </div>
      )}

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={(scannedSku) => {
          const product = products.find((p) => p.sku.toLowerCase() === scannedSku.toLowerCase());
          if (product) addToCart(product);
          else alert(`Product with SKU ${scannedSku} not found!`);
        }}
      />

      {/* Customer Modal */}
      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        initialPhone={customerPhone}
        onSaveCustomer={(newCust) => {
          const created = {
            ...newCust,
            id: `cust-${Date.now()}`,
            totalSpend: 0,
            totalBills: 0,
            advanceBalance: 0,
            outstandingBalance: 0,
            createdAt: new Date().toISOString(),
          } as Customer;
          setCustomers([created, ...customers]);
          selectCustomer(created);
        }}
      />

      {/* Product Modal */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setProductInitialName('');
        }}
        initialName={productInitialName}
        onSaveProduct={handleSaveNewProduct}
      />
    </div>
  );
}

export default function POSBillingPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading Billing Counter...</div>}>
      <POSBillingContent />
    </Suspense>
  );
}
