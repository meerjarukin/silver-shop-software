'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShoppingCart,
  Plus,
  QrCode,
  Search,
  ArrowUpRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Boxes,
  Users,
  ChevronRight,
  Receipt,
  Gem,
  PackageCheck,
  Scale,
  DollarSign,
  ArrowRight,
  Coins,
  Clock,
  AlertCircle,
  Calendar,
  Wallet,
  Phone,
} from 'lucide-react';
import { Product, SilverRates, Invoice, Customer, KhataTransaction } from '@/lib/types';
import { parseShowcaseRates } from '@/lib/storage';
import { useAuth } from '@/context/AuthContext';
import { useRates } from '@/context/RatesContext';
import CustomerPaymentModal from '@/components/CustomerPaymentModal';
import RescheduleDueDateModal from '@/components/RescheduleDueDateModal';

export default function DashboardOverviewPage() {
  const { user } = useAuth();
  const { rates, openRateModal } = useRates();
  const [products, setProducts] = useState<Product[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [salesTab, setSalesTab] = useState<'TODAY' | 'WEEK' | 'MONTH'>('TODAY');

  // Modals for Dues Management
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentCustomer, setPaymentCustomer] = useState<Customer | null>(null);
  const [paymentInitialAmount, setPaymentInitialAmount] = useState<number | undefined>(undefined);
  const [paymentInvoiceRef, setPaymentInvoiceRef] = useState<string | undefined>(undefined);

  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [selectedInvoiceToReschedule, setSelectedInvoiceToReschedule] = useState<Invoice | null>(null);

  const loadData = () => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setProducts(data);
      })
      .catch(() => {});

    fetch('/api/billing')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setInvoices(data);
      })
      .catch(() => {});

    fetch('/api/customers')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setCustomers(data);
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRecordKhata = async (tx: KhataTransaction) => {
    try {
      await fetch('/api/customers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: tx.customerId,
          type: tx.type,
          amount: tx.amount,
          paymentMode: tx.paymentMode,
          referenceInvoice: tx.referenceInvoice,
          notes: tx.notes,
        }),
      });
      loadData();
    } catch (err) {
      console.error('Error recording payment:', err);
    }
  };

  const handleSaveDueDate = async (invoiceNumber: string, newDueDate: string) => {
    try {
      await fetch('/api/billing', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceNumber,
          newDueDate,
        }),
      });
      loadData();
    } catch (err) {
      console.error('Error updating due date:', err);
    }
  };

  // Today's Sales Calculation
  const todayStr = new Date().toISOString().split('T')[0];
  const todayInvoices = invoices.filter((inv) => {
    const d = new Date(inv.date || inv.createdAt).toISOString().split('T')[0];
    return d === todayStr;
  });

  const todayRevenue = todayInvoices.reduce((acc, inv) => acc + inv.grandTotal, 0);
  const todayBillsCount = todayInvoices.length;
  const todayItemsCount = todayInvoices.reduce(
    (acc, inv) => acc + (inv.items?.reduce((iAcc, item) => iAcc + (item.quantity || 1), 0) || 0),
    0
  );

  // Total Inventory Calculations
  const totalStockPieces = products.reduce((acc, p) => acc + p.stockQuantity, 0);
  const totalStockGrams = products.reduce((acc, p) => acc + p.netWeight * p.stockQuantity, 0);
  const totalStockValue = totalStockGrams * rates.sterlingRate925;

  // Alerts: Low Stock & Customer Dues
  const lowStockItems = products.filter((p) => p.stockQuantity <= p.minStockAlert);
  const customersWithDue = customers.filter((c) => (c.outstandingBalance || 0) > 0);
  const totalOutstandingDue = customersWithDue.reduce((acc, c) => acc + (c.outstandingBalance || 0), 0);

  // Payment Breakdown Today
  const upiCollected = todayInvoices
    .filter((i) => i.paymentMode === 'UPI')
    .reduce((acc, i) => acc + (i.paidAmount !== undefined ? i.paidAmount : i.grandTotal), 0);
  const cashInDrawer = todayInvoices
    .filter((i) => i.paymentMode === 'CASH')
    .reduce((acc, i) => acc + (i.paidAmount !== undefined ? i.paidAmount : i.grandTotal), 0);
  const cardCollected = todayInvoices
    .filter((i) => i.paymentMode === 'CARD' || i.paymentMode === 'CREDIT_CARD' || i.paymentMode === 'DEBIT_CARD')
    .reduce((acc, i) => acc + (i.paidAmount !== undefined ? i.paidAmount : i.grandTotal), 0);
  const creditDueToday = todayInvoices.reduce((acc, i) => acc + (i.dueAmount || 0), 0);

  // Due Date Calculations
  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const oneDayMs = 24 * 60 * 60 * 1000;

  const invoicesWithDue = invoices.filter((inv) => (inv.dueAmount || 0) > 0);

  const duesTodayList = invoicesWithDue.filter((inv) => {
    if (!inv.dueDate) return false;
    const d = new Date(inv.dueDate);
    const dueTime = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    return dueTime === todayMidnight;
  });

  const overdueList = invoicesWithDue.filter((inv) => {
    if (!inv.dueDate) return false;
    const d = new Date(inv.dueDate);
    const dueTime = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    return dueTime < todayMidnight;
  });

  const totalDueTodayAmt = duesTodayList.reduce((acc, inv) => acc + (inv.dueAmount || 0), 0);
  const totalOverdueAmt = overdueList.reduce((acc, inv) => acc + (inv.dueAmount || 0), 0);

  const formattedTodayDate = new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'long',
  }).format(now);

  const getCustomerForInvoice = (inv: Invoice): Customer => {
    if (inv.customerId) {
      const match = customers.find((c) => c.id === inv.customerId);
      if (match) return match;
    }
    const matchByPhone = customers.find((c) => c.phone && inv.customerPhone && c.phone.replace(/\D/g, '') === inv.customerPhone.replace(/\D/g, ''));
    if (matchByPhone) return matchByPhone;

    const matchByName = customers.find((c) => c.name.toLowerCase() === (inv.customerName || '').toLowerCase());
    if (matchByName) return matchByName;

    return {
      id: inv.customerId || `cust-${Date.now()}`,
      name: inv.customerName || 'Walk-in Customer',
      phone: inv.customerPhone || 'N/A',
      address: '',
      totalBills: 1,
      totalSpend: inv.grandTotal,
      advanceBalance: 0,
      outstandingBalance: inv.dueAmount || 0,
      createdAt: inv.date || new Date().toISOString(),
    };
  };

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-8 py-5 sm:py-8 space-y-6 sm:space-y-8">
      {/* 1. Header with greeting and primary actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200/90 shadow-2xs p-1 flex items-center justify-center overflow-hidden flex-shrink-0">
            <img
              src="/logochanged.jpg"
              alt="Kushal Jewellerys Logo"
              className="w-full h-full object-contain rounded-xl"
            />
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-slate-900 tracking-tight">
              Good morning, {user?.name?.split(' ')[0] || 'Store Owner'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-normal">
              Here&apos;s what&apos;s happening in your silver shop today.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
          <Link
            href="/pos"
            className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs shadow-blue-500/20 transition active:scale-98"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Create Bill</span>
          </Link>

          <Link
            href="/products"
            className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-2xs transition"
          >
            <Plus className="w-3.5 h-3.5 text-slate-500" />
            <span>Add Product</span>
          </Link>
        </div>
      </div>

      {/* 1.5. Morning Credit & Outstanding Dues Alert Card (Payment Due Today Highlight) */}
      {(duesTodayList.length > 0 || overdueList.length > 0) && (
        <div className="bg-gradient-to-br from-amber-500/10 via-white to-rose-500/10 border-2 border-amber-300/80 rounded-2xl p-4 sm:p-6 shadow-card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-200/60">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500 text-white shadow-sm shadow-amber-500/30 animate-pulse">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                    Credit Payments Due Today – {formattedTodayDate}
                  </h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                    Morning Review
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  The following customers have promised repayments scheduled for today or past due.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <Link
                href="/customers?tab=dues"
                className="flex items-center gap-1 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-xs transition"
              >
                <span>View Full Due Ledger</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Dues Today & Overdue Quick Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-amber-100/50 text-slate-700 font-semibold border-b border-amber-200">
                  <th className="py-2 px-3 rounded-l-lg">Customer</th>
                  <th className="py-2 px-3">Bill No.</th>
                  <th className="py-2 px-3 text-right">Bill Total</th>
                  <th className="py-2 px-3 text-right">Paid</th>
                  <th className="py-2 px-3 text-right">Outstanding</th>
                  <th className="py-2 px-3 text-center">Status</th>
                  <th className="py-2 px-3 text-right rounded-r-lg">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100/70">
                {[...duesTodayList, ...overdueList].map((inv) => {
                  const cust = getCustomerForInvoice(inv);
                  const isDueToday = duesTodayList.some((d) => d.id === inv.id);

                  return (
                    <tr key={inv.id} className="hover:bg-amber-50/60 transition group">
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{inv.customerName}</div>
                        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{inv.customerPhone || 'N/A'}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3 font-mono font-medium text-blue-700">
                        <Link href={`/invoice/${inv.invoiceNumber}`} className="hover:underline">
                          {inv.invoiceNumber}
                        </Link>
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-slate-700">
                        ₹{(inv.grandTotal || 0).toFixed(2)}
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-emerald-700 font-medium">
                        ₹{(inv.paidAmount !== undefined ? inv.paidAmount : (inv.grandTotal - (inv.dueAmount || 0))).toFixed(2)}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-rose-600 text-sm">
                        ₹{(inv.dueAmount || 0).toFixed(2)}
                      </td>

                      <td className="py-3 px-3 text-center">
                        {isDueToday ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Due Today
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                            <AlertCircle className="w-3 h-3 text-rose-600" />
                            Overdue
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setPaymentCustomer(cust);
                              setPaymentInitialAmount(Number((inv.dueAmount || 0).toFixed(2)));
                              setPaymentInvoiceRef(inv.invoiceNumber);
                              setIsPaymentModalOpen(true);
                            }}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-[11px] shadow-2xs transition active:scale-95"
                            title="Record payment received"
                          >
                            Settle Due
                          </button>

                          <button
                            onClick={() => {
                              setSelectedInvoiceToReschedule(inv);
                              setIsRescheduleOpen(true);
                            }}
                            className="p-1 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
                            title="Reschedule promised date"
                          >
                            <Calendar className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 pt-2 border-t border-amber-200/60 font-medium">
            <div className="flex items-center gap-4">
              <span>
                <strong>{duesTodayList.length}</strong> payment(s) due today: <strong className="text-amber-700">₹{totalDueTodayAmt.toFixed(2)}</strong>
              </span>
              {overdueList.length > 0 && (
                <span>
                  <strong>{overdueList.length}</strong> overdue: <strong className="text-rose-700">₹{totalOverdueAmt.toFixed(2)}</strong>
                </span>
              )}
            </div>
            <Link
              href="/customers?tab=dues"
              className="text-blue-700 font-bold hover:underline flex items-center gap-1 mt-2 sm:mt-0"
            >
              <span>Manage all customer credit accounts</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* 2. Today's Overview: 4-Column Metric Grid with Responsive Mobile Sizing */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Metric 1: Today's Sales */}
        <div className="bg-white border border-slate-200/90 p-3.5 sm:p-5 rounded-2xl shadow-card relative overflow-hidden group hover:border-emerald-200 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-slate-500">Today&apos;s Sales</span>
            <span className="text-[9px] sm:text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 sm:px-2 py-0.5 rounded-full border border-emerald-200/60">
              +12%
            </span>
          </div>
          <div className="mt-1.5 sm:mt-2 text-lg sm:text-2xl font-bold text-slate-900 tracking-tight font-mono">
            ₹{todayRevenue.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <span className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 sm:mt-1 block truncate">
            {todayBillsCount} bill(s) today
          </span>
        </div>

        {/* Metric 2: Bills Generated */}
        <div className="bg-white border border-slate-200/90 p-3.5 sm:p-5 rounded-2xl shadow-card hover:border-indigo-200 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-slate-500">Bills Created</span>
            <div className="p-1 rounded-md bg-indigo-50 text-indigo-600">
              <Receipt className="w-3 h-3" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2 text-lg sm:text-2xl font-bold text-slate-900 tracking-tight font-mono">
            {todayBillsCount}
          </div>
          <span className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 sm:mt-1 block truncate">
            Checkouts completed
          </span>
        </div>

        {/* Metric 3: Items Sold */}
        <div className="bg-white border border-slate-200/90 p-3.5 sm:p-5 rounded-2xl shadow-card hover:border-blue-200 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-slate-500">Items Sold</span>
            <div className="p-1 rounded-md bg-blue-50 text-blue-600">
              <Gem className="w-3 h-3" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2 text-lg sm:text-2xl font-bold text-slate-900 tracking-tight font-mono">
            {todayItemsCount} <span className="text-xs font-normal text-slate-400">pcs</span>
          </div>
          <span className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 sm:mt-1 block truncate">
            Silver pieces sold
          </span>
        </div>

        {/* Metric 4: Stock Valuation */}
        <div className="bg-white border border-slate-200/90 p-3.5 sm:p-5 rounded-2xl shadow-card hover:border-amber-200 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-slate-500">Total Stock Value</span>
            <div className="p-1 rounded-md bg-amber-50 text-amber-600">
              <Coins className="w-3 h-3" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2 text-lg sm:text-2xl font-bold text-slate-900 tracking-tight font-mono">
            ₹{(totalStockValue / 100000).toFixed(2)}L
          </div>
          <span className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 sm:mt-1 block truncate">
            {(totalStockGrams / 1000).toFixed(2)} kg in vault
          </span>
        </div>
      </div>

      {/* 2.5. Today's Store Metal Rates Card (Interactive showcase with 1-click rate customizer) */}
      <div className="bg-gradient-to-br from-white via-amber-50/25 to-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-card space-y-3.5 hover:border-amber-200 transition">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/60 shadow-2xs">
              <Coins className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 leading-tight">Today&apos;s Store Metal Rates</h2>
                <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Active Rates
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Custom rates applied to instant billing, POS quotes, and vault valuation.
              </p>
            </div>
          </div>

          <button
            onClick={openRateModal}
            className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition active:scale-98 self-start sm:self-auto"
            title="Choose and update metal rates"
          >
            <Coins className="w-3.5 h-3.5 text-amber-300" />
            <span>Choose / Update Rates</span>
          </button>
        </div>

        {/* 5 Metal Rate Pills / Cards */}
        {(() => {
          const showcaseRates = parseShowcaseRates(rates.displayShowcase);
          return (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
              {/* 925 Sterling */}
              <div
                onClick={openRateModal}
                className={`cursor-pointer p-3 rounded-xl border transition relative overflow-hidden group ${
                  showcaseRates.includes('925')
                    ? 'bg-amber-50/90 border-amber-300/80 ring-2 ring-amber-500/20 shadow-2xs'
                    : 'bg-white border-slate-200/90 hover:border-amber-200 hover:bg-amber-50/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-900">925 Sterling</span>
                  {showcaseRates.includes('925') && (
                    <span className="text-[9px] font-bold text-amber-700 bg-amber-100/90 px-1.5 py-0.5 rounded font-mono">
                      Header
                    </span>
                  )}
                </div>
                <div className="mt-1 text-base sm:text-lg font-bold text-slate-900 font-mono tracking-tight">
                  ₹{rates.sterlingRate925}<span className="text-xs text-slate-400 font-normal">/g</span>
                </div>
                <span className="text-[10px] text-slate-500 mt-0.5 block truncate">Jewellery & Ornaments</span>
              </div>

              {/* 999 Fine Silver */}
              <div
                onClick={openRateModal}
                className={`cursor-pointer p-3 rounded-xl border transition relative overflow-hidden group ${
                  showcaseRates.includes('999')
                    ? 'bg-sky-50/90 border-sky-300/80 ring-2 ring-sky-500/20 shadow-2xs'
                    : 'bg-white border-slate-200/90 hover:border-sky-200 hover:bg-sky-50/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-sky-900">999 Fine Silver</span>
                  {showcaseRates.includes('999') && (
                    <span className="text-[9px] font-bold text-sky-700 bg-sky-100/90 px-1.5 py-0.5 rounded font-mono">
                      Header
                    </span>
                  )}
                </div>
                <div className="mt-1 text-base sm:text-lg font-bold text-slate-900 font-mono tracking-tight">
                  ₹{rates.fineRate999}<span className="text-xs text-slate-400 font-normal">/g</span>
                </div>
                <span className="text-[10px] text-slate-500 mt-0.5 block truncate">Coins & Fine Bullion</span>
              </div>

              {/* 800 Silver / Utensil */}
              <div
                onClick={openRateModal}
                className={`cursor-pointer p-3 rounded-xl border transition relative overflow-hidden group ${
                  showcaseRates.includes('800')
                    ? 'bg-emerald-50/90 border-emerald-300/80 ring-2 ring-emerald-500/20 shadow-2xs'
                    : 'bg-white border-slate-200/90 hover:border-emerald-200 hover:bg-emerald-50/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-900">800 Silver</span>
                  {showcaseRates.includes('800') && (
                    <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100/90 px-1.5 py-0.5 rounded font-mono">
                      Header
                    </span>
                  )}
                </div>
                <div className="mt-1 text-base sm:text-lg font-bold text-slate-900 font-mono tracking-tight">
                  ₹{rates.utensilRate800}<span className="text-xs text-slate-400 font-normal">/g</span>
                </div>
                <span className="text-[10px] text-slate-500 mt-0.5 block truncate">Pooja & Utensils</span>
              </div>

              {/* Old Silver Buyback */}
              <div
                onClick={openRateModal}
                className={`cursor-pointer p-3 rounded-xl border transition relative overflow-hidden group ${
                  showcaseRates.includes('SCRAP')
                    ? 'bg-rose-50/90 border-rose-300/80 ring-2 ring-rose-500/20 shadow-2xs'
                    : 'bg-white border-slate-200/90 hover:border-rose-200 hover:bg-rose-50/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-rose-900">Scrap Buyback</span>
                  {showcaseRates.includes('SCRAP') ? (
                    <span className="text-[9px] font-bold text-rose-700 bg-rose-100/90 px-1.5 py-0.5 rounded font-mono">
                      Header
                    </span>
                  ) : (
                    <span className="text-[9px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                      Old Silver
                    </span>
                  )}
                </div>
                <div className="mt-1 text-base sm:text-lg font-bold text-slate-900 font-mono tracking-tight">
                  ₹{rates.scrapRateBuyback}<span className="text-xs text-slate-400 font-normal">/g</span>
                </div>
                <span className="text-[10px] text-slate-500 mt-0.5 block truncate">Customer Exchange</span>
              </div>

              {/* 916 22K Gold */}
              <div
                onClick={openRateModal}
                className={`cursor-pointer col-span-2 sm:col-span-1 p-3 rounded-xl border transition relative overflow-hidden group ${
                  showcaseRates.includes('916')
                    ? 'bg-amber-500/10 border-amber-400 ring-2 ring-amber-500/20 shadow-2xs'
                    : 'bg-white border-slate-200/90 hover:border-amber-200 hover:bg-amber-50/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-950">22K Gold (916)</span>
                  {showcaseRates.includes('916') && (
                    <span className="text-[9px] font-bold text-amber-800 bg-amber-200/80 px-1.5 py-0.5 rounded font-mono">
                      Header
                    </span>
                  )}
                </div>
                <div className="mt-1 text-base sm:text-lg font-bold text-slate-900 font-mono tracking-tight">
                  ₹{rates.goldRate916 || 7150}<span className="text-xs text-slate-400 font-normal">/g</span>
                </div>
                <span className="text-[10px] text-slate-500 mt-0.5 block truncate">Hallmark Gold Rate</span>
              </div>
            </div>
          );
        })()}
      </div>

      {/* 3. Actionable Alerts Section */}
      {(lowStockItems.length > 0 || customersWithDue.length > 0) && (
        <div className="bg-amber-50/80 border border-amber-200/90 p-3.5 sm:p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-start sm:items-center gap-2.5 sm:gap-3">
            <div className="p-2 bg-amber-100/90 text-amber-800 rounded-xl flex-shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="text-xs text-amber-950 font-medium">
              {lowStockItems.length > 0 ? (
                <span>
                  <strong>{lowStockItems.length} products</strong> are running low on stock in the store vault.
                </span>
              ) : (
                <span>
                  <strong>₹{totalOutstandingDue.toFixed(0)}</strong> pending in customer Khata credit ledger.
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto">
            {lowStockItems.length > 0 && (
              <Link
                href="/inventory"
                className="w-full sm:w-auto text-center px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg text-xs transition shadow-2xs"
              >
                Review Inventory
              </Link>
            )}
            {customersWithDue.length > 0 && (
              <Link
                href="/customers"
                className="w-full sm:w-auto text-center px-3 py-1.5 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 font-semibold rounded-lg text-xs transition shadow-2xs"
              >
                View Khata (Dues)
              </Link>
            )}
          </div>
        </div>
      )}

      {/* 4. Two-Column Split: Sales Overview + Inventory Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        {/* Left (7 cols): Sales Overview & Payment Splits */}
        <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-card space-y-4 sm:space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Sales Overview</h2>
              <p className="text-xs text-slate-500">Revenue reconciliation</p>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
              <button
                onClick={() => setSalesTab('TODAY')}
                className={`px-2.5 sm:px-3 py-1 rounded-lg font-semibold transition text-xs ${
                  salesTab === 'TODAY' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-500'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setSalesTab('WEEK')}
                className={`px-2.5 sm:px-3 py-1 rounded-lg font-semibold transition text-xs ${
                  salesTab === 'WEEK' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-500'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setSalesTab('MONTH')}
                className={`px-2.5 sm:px-3 py-1 rounded-lg font-semibold transition text-xs ${
                  salesTab === 'MONTH' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-500'
                }`}
              >
                Month
              </button>
            </div>
          </div>

          {/* Revenue Highlight Card */}
          <div className="p-3.5 sm:p-4 bg-slate-50/80 rounded-xl border border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-[11px] sm:text-xs text-slate-500 block">Total Revenue ({salesTab.toLowerCase()})</span>
              <div className="text-lg sm:text-xl font-bold text-slate-900 font-mono mt-0.5">
                ₹{todayRevenue.toFixed(2)}
              </div>
            </div>
            <Link
              href="/reports"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>Full Report</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Payment Split Rows */}
          <div className="space-y-2.5 pt-1 sm:pt-2">
            <span className="text-xs font-semibold text-slate-700 block">Today's Payment Settlements</span>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
              <div className="p-3 bg-white border border-slate-200/90 rounded-xl flex items-center justify-between shadow-2xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">UPI / Digital</span>
                  <span className="text-xs sm:text-sm font-bold text-slate-900 font-mono">
                    ₹{upiCollected.toFixed(0)}
                  </span>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-blue-100 flex-shrink-0"></span>
              </div>

              <div className="p-3 bg-white border border-slate-200/90 rounded-xl flex items-center justify-between shadow-2xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Cash in Drawer</span>
                  <span className="text-xs sm:text-sm font-bold text-slate-900 font-mono">
                    ₹{cashInDrawer.toFixed(0)}
                  </span>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100 flex-shrink-0"></span>
              </div>

              <div className="p-3 bg-white border border-slate-200/90 rounded-xl flex items-center justify-between shadow-2xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Cards (CC/Debit)</span>
                  <span className="text-xs sm:text-sm font-bold text-slate-900 font-mono">
                    ₹{cardCollected.toFixed(0)}
                  </span>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 ring-4 ring-purple-100 flex-shrink-0"></span>
              </div>

              <div className="p-3 bg-white border border-slate-200/90 rounded-xl flex items-center justify-between shadow-2xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Credit Due Today</span>
                  <span className={`text-xs sm:text-sm font-bold font-mono ${creditDueToday > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                    ₹{creditDueToday.toFixed(0)}
                  </span>
                </div>
                <span className={`w-2.5 h-2.5 rounded-full ring-4 flex-shrink-0 ${creditDueToday > 0 ? 'bg-rose-500 ring-rose-100' : 'bg-slate-300 ring-slate-100'}`}></span>
              </div>
            </div>
          </div>
        </div>

        {/* Right (5 cols): Inventory Snapshot */}
        <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-card flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Inventory Snapshot</h2>
                <p className="text-xs text-slate-500">Vault weight & stock count</p>
              </div>
              <Link
                href="/inventory"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                View Inventory →
              </Link>
            </div>

            <div className="space-y-2.5 sm:space-y-3 text-xs">
              <div className="flex items-center justify-between py-1.5 sm:py-2 border-b border-slate-100">
                <span className="text-slate-500">Jewellery Designs</span>
                <span className="font-bold text-slate-900 font-mono">{products.length} Items</span>
              </div>

              <div className="flex items-center justify-between py-1.5 sm:py-2 border-b border-slate-100">
                <span className="text-slate-500">Vault Silver Wt</span>
                <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-mono border border-amber-200/60">
                  {(totalStockGrams / 1000).toFixed(2)} kg
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 sm:py-2 border-b border-slate-100">
                <span className="text-slate-500">Valuation</span>
                <span className="font-bold text-slate-900 font-mono">
                  ₹{(totalStockValue / 100000).toFixed(2)} Lakhs
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 sm:py-2">
                <span className="text-slate-500">Stock Status</span>
                <span className={`font-bold font-mono px-2 py-0.5 rounded border ${lowStockItems.length > 0 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                  {lowStockItems.length > 0 ? `${lowStockItems.length} items low` : 'Healthy'}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <Link
              href="/inventory"
              className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <Boxes className="w-3.5 h-3.5 text-teal-600" />
              <span>Manage Stock & Inward Logs</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 5. Recent Activity: Clean Data Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Recent Transactions</h2>
            <p className="text-xs text-slate-500">Latest retail bills generated at the counter</p>
          </div>

          <Link
            href="/reports"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>View all</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {invoices.length === 0 ? (
          <div className="text-center py-10 text-xs text-slate-400">
            No bills created yet today.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[500px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-slate-500 font-semibold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Bill No.</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Items</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  <th className="py-2.5 px-3 text-center">Payment</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.slice(0, 5).map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3 font-mono font-bold text-blue-600">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-800 block">{inv.customerName}</span>
                      <span className="text-[11px] text-slate-400 font-mono">{inv.customerPhone}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-500">
                      {inv.items?.length || 1} item(s)
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900 font-mono">
                      ₹{inv.grandTotal.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-[10px] font-semibold border border-slate-200/60">
                        {inv.paymentMode}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Link
                        href={`/invoice/${encodeURIComponent(inv.invoiceNumber)}`}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        View Bill
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Settlement Modal */}
      {paymentCustomer && (
        <CustomerPaymentModal
          customer={paymentCustomer}
          isOpen={isPaymentModalOpen}
          initialAmount={paymentInitialAmount}
          invoiceRef={paymentInvoiceRef}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setPaymentCustomer(null);
            setPaymentInitialAmount(undefined);
            setPaymentInvoiceRef(undefined);
          }}
          onRecordTransaction={handleRecordKhata}
        />
      )}

      {/* Reschedule Promised Due Date Modal */}
      {selectedInvoiceToReschedule && (
        <RescheduleDueDateModal
          invoice={selectedInvoiceToReschedule}
          isOpen={isRescheduleOpen}
          onClose={() => {
            setIsRescheduleOpen(false);
            setSelectedInvoiceToReschedule(null);
          }}
          onSaveDueDate={handleSaveDueDate}
        />
      )}
    </div>
  );
}
