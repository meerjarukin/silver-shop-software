'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  MapPin,
  FileText,
  DollarSign,
  Printer,
  ChevronRight,
  Wallet,
  ArrowRight,
  Receipt,
  UserCheck,
  ArrowLeft,
  Calendar,
  AlertCircle,
  Clock,
  CheckCircle2,
  CreditCard,
  Filter,
  Trash2,
} from 'lucide-react';
import CustomerModal from '@/components/CustomerModal';
import CustomerPaymentModal from '@/components/CustomerPaymentModal';
import RescheduleDueDateModal from '@/components/RescheduleDueDateModal';
import DeleteCustomerModal from '@/components/DeleteCustomerModal';
import { Customer, Invoice, KhataTransaction } from '@/lib/types';

type PageTab = 'DIRECTORY' | 'DUES';
type DueFilter = 'DUE_TODAY' | 'OVERDUE' | 'UPCOMING' | 'ALL_OPEN' | 'SETTLED';

function CustomersCRMContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'dues' ? 'DUES' : 'DIRECTORY';

  const [activeTab, setActiveTab] = useState<PageTab>(initialTab);
  const [dueFilter, setDueFilter] = useState<DueFilter>('DUE_TODAY');

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Mobile View Switch: 'LIST' vs 'DETAIL'
  const [mobileCustomerView, setMobileCustomerView] = useState<'LIST' | 'DETAIL'>('LIST');

  // Modals
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentCustomer, setPaymentCustomer] = useState<Customer | null>(null);
  const [paymentInitialAmount, setPaymentInitialAmount] = useState<number | undefined>(undefined);
  const [paymentInvoiceRef, setPaymentInvoiceRef] = useState<string | undefined>(undefined);

  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [selectedInvoiceToReschedule, setSelectedInvoiceToReschedule] = useState<Invoice | null>(null);

  const [khataTransactions, setKhataTransactions] = useState<KhataTransaction[]>([]);

  const loadData = () => {
    fetch('/api/customers')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCustomers(data);
          setSelectedCustomer((prev) => {
            if (!prev) return data[0] || null;
            return data.find((c: Customer) => c.id === prev.id) || data[0] || null;
          });
        }
      })
      .catch(() => {});

    fetch('/api/billing')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setInvoices(data);
      })
      .catch(() => {});
  };

  const handleDeleteCustomer = async (cust: Customer) => {
    try {
      const res = await fetch(`/api/customers?id=${encodeURIComponent(cust.id)}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete customer');
      }
      setCustomers((prev) => {
        const nextList = prev.filter((c) => c.id !== cust.id);
        setSelectedCustomer((curr) => {
          if (curr?.id === cust.id) {
            return nextList[0] || null;
          }
          return curr;
        });
        return nextList;
      });
    } catch (err: any) {
      console.error('Delete customer error:', err);
      throw err;
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'dues') {
      setActiveTab('DUES');
    } else if (tab === 'directory') {
      setActiveTab('DIRECTORY');
    }
  }, [searchParams]);

  const handleSaveCustomer = async (custData: Partial<Customer>) => {
    const saved = {
      ...custData,
      id: custData.id || `cust-${Date.now()}`,
      totalSpend: custData.totalSpend || 0,
      totalBills: custData.totalBills || 0,
      advanceBalance: custData.advanceBalance || 0,
      outstandingBalance: custData.outstandingBalance || 0,
      createdAt: new Date().toISOString(),
    } as Customer;

    setCustomers((prev) => [saved, ...prev.filter((c) => c.id !== saved.id)]);
    setSelectedCustomer(saved);
    setMobileCustomerView('DETAIL');

    try {
      await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(custData),
      });
      loadData();
    } catch (e) {}
  };

  const handleRecordKhata = async (tx: KhataTransaction) => {
    setKhataTransactions([tx, ...khataTransactions]);

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

  // Due Date Helper Calculations
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTimestamp = today.getTime();

  // Combine invoices that have dueAmount > 0 or customers with outstandingBalance
  const dueItems = invoices
    .filter((inv) => (inv.dueAmount || 0) > 0 || inv.paymentStatus === 'PARTIAL' || inv.paymentStatus === 'DUE')
    .map((inv) => {
      let daysDiff: number | null = null;
      let statusType: 'TODAY' | 'OVERDUE' | 'UPCOMING' | 'NO_DATE' = 'NO_DATE';

      if (inv.dueDate) {
        const d = new Date(inv.dueDate);
        d.setHours(0, 0, 0, 0);
        const diffDays = Math.round((d.getTime() - todayTimestamp) / (1000 * 60 * 60 * 24));
        daysDiff = diffDays;
        if (diffDays === 0) statusType = 'TODAY';
        else if (diffDays < 0) statusType = 'OVERDUE';
        else statusType = 'UPCOMING';
      } else {
        // If no due date, check bill date
        const billDate = new Date(inv.date || inv.createdAt);
        billDate.setHours(0, 0, 0, 0);
        if (billDate.getTime() < todayTimestamp) {
          statusType = 'OVERDUE';
          daysDiff = Math.round((billDate.getTime() - todayTimestamp) / (1000 * 60 * 60 * 24));
        } else {
          statusType = 'TODAY';
          daysDiff = 0;
        }
      }

      const matchingCust = customers.find(
        (c) => c.phone === inv.customerPhone || (c.id && c.id === inv.customerId)
      );

      return {
        invoice: inv,
        customer: matchingCust || {
          id: inv.customerId || `cust-${Date.now()}`,
          name: inv.customerName,
          phone: inv.customerPhone,
          outstandingBalance: inv.dueAmount || 0,
          advanceBalance: 0,
          totalSpend: inv.grandTotal,
          totalBills: 1,
        },
        statusType,
        daysDiff,
      };
    });

  // Settled / Completed invoices
  const settledItems = invoices.filter(
    (inv) => (inv.dueAmount || 0) <= 0 && inv.paymentStatus === 'PAID'
  );

  // Dues Metrics
  const dueTodayList = dueItems.filter((i) => i.statusType === 'TODAY');
  const overdueList = dueItems.filter((i) => i.statusType === 'OVERDUE');
  const upcomingList = dueItems.filter((i) => i.statusType === 'UPCOMING');

  const totalDueTodayAmt = dueTodayList.reduce((acc, i) => acc + (i.invoice.dueAmount || 0), 0);
  const totalOverdueAmt = overdueList.reduce((acc, i) => acc + (i.invoice.dueAmount || 0), 0);
  const totalUpcomingAmt = upcomingList.reduce((acc, i) => acc + (i.invoice.dueAmount || 0), 0);
  const totalAllDueAmt = dueItems.reduce((acc, i) => acc + (i.invoice.dueAmount || 0), 0);

  // Filtered Dues based on selected category & search query
  const filteredDueItems = dueItems.filter((item) => {
    const matchesSearch =
      item.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.customer.phone.includes(searchQuery) ||
      item.invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (dueFilter === 'DUE_TODAY') return item.statusType === 'TODAY';
    if (dueFilter === 'OVERDUE') return item.statusType === 'OVERDUE';
    if (dueFilter === 'UPCOMING') return item.statusType === 'UPCOMING';
    if (dueFilter === 'ALL_OPEN') return true;
    return false;
  });

  const filteredSettledItems = settledItems.filter((inv) => {
    return (
      inv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.customerPhone.includes(searchQuery) ||
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
  );

  const customerInvoices = selectedCustomer
    ? invoices.filter(
        (inv) =>
          inv.customerId === selectedCustomer.id ||
          inv.customerPhone === selectedCustomer.phone
      )
    : [];

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-8 py-5 sm:py-8 space-y-5 sm:space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg border border-purple-200/60 flex-shrink-0">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span>Customer CRM & Credit Ledger</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Customer directory, purchase history, and promised repayment dues.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/pos"
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs shadow-blue-500/20 transition active:scale-98"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>New POS Bill</span>
          </Link>

          <button
            onClick={() => {
              setCustomerToEdit(null);
              setIsCustomerModalOpen(true);
            }}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-2xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* Main View Switcher: Directory vs Credit Due Tracker */}
      <div className="flex items-center bg-slate-200/75 p-1 rounded-2xl text-xs font-bold w-full sm:w-auto self-start">
        <button
          type="button"
          onClick={() => setActiveTab('DIRECTORY')}
          className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl transition flex items-center justify-center gap-2 ${
            activeTab === 'DIRECTORY'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4 text-purple-600" />
          <span>Customer Directory ({customers.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('DUES')}
          className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl transition flex items-center justify-center gap-2 ${
            activeTab === 'DUES'
              ? 'bg-white text-rose-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4 text-rose-600" />
          <span>Credit & Outstanding Dues</span>
          {(dueTodayList.length > 0 || overdueList.length > 0) && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
              {dueTodayList.length + overdueList.length} Due
            </span>
          )}
        </button>
      </div>

      {/* VIEW 1: CREDIT & OUTSTANDING DUES TRACKER */}
      {activeTab === 'DUES' && (
        <div className="space-y-5 animate-fade-in">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Due Today */}
            <div
              onClick={() => setDueFilter('DUE_TODAY')}
              className={`p-3.5 rounded-2xl border cursor-pointer transition ${
                dueFilter === 'DUE_TODAY'
                  ? 'bg-amber-500 text-white border-amber-600 shadow-sm shadow-amber-500/25'
                  : 'bg-amber-50/80 hover:bg-amber-100/60 border-amber-200/80 text-amber-950'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold">Payment Due Today</span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    dueFilter === 'DUE_TODAY' ? 'bg-white/20 text-white' : 'bg-amber-200/80 text-amber-900'
                  }`}
                >
                  {dueTodayList.length} cust
                </span>
              </div>
              <div className="text-base sm:text-xl font-bold font-mono mt-1">
                ₹{totalDueTodayAmt.toFixed(2)}
              </div>
              <span
                className={`text-[10px] block mt-0.5 ${
                  dueFilter === 'DUE_TODAY' ? 'text-amber-100' : 'text-amber-700'
                }`}
              >
                Promised date is today
              </span>
            </div>

            {/* Overdue */}
            <div
              onClick={() => setDueFilter('OVERDUE')}
              className={`p-3.5 rounded-2xl border cursor-pointer transition ${
                dueFilter === 'OVERDUE'
                  ? 'bg-rose-600 text-white border-rose-700 shadow-sm shadow-rose-500/25'
                  : 'bg-rose-50/80 hover:bg-rose-100/60 border-rose-200/80 text-rose-950'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold">Overdue Payments</span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    dueFilter === 'OVERDUE' ? 'bg-white/20 text-white' : 'bg-rose-200/80 text-rose-900'
                  }`}
                >
                  {overdueList.length} cust
                </span>
              </div>
              <div className="text-base sm:text-xl font-bold font-mono mt-1">
                ₹{totalOverdueAmt.toFixed(2)}
              </div>
              <span
                className={`text-[10px] block mt-0.5 ${
                  dueFilter === 'OVERDUE' ? 'text-rose-100' : 'text-rose-700'
                }`}
              >
                Past promised date (Kept visible)
              </span>
            </div>

            {/* Upcoming */}
            <div
              onClick={() => setDueFilter('UPCOMING')}
              className={`p-3.5 rounded-2xl border cursor-pointer transition ${
                dueFilter === 'UPCOMING'
                  ? 'bg-sky-600 text-white border-sky-700 shadow-sm shadow-sky-500/25'
                  : 'bg-sky-50/80 hover:bg-sky-100/60 border-sky-200/80 text-sky-950'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold">Upcoming Payments</span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    dueFilter === 'UPCOMING' ? 'bg-white/20 text-white' : 'bg-sky-200/80 text-sky-900'
                  }`}
                >
                  {upcomingList.length} cust
                </span>
              </div>
              <div className="text-base sm:text-xl font-bold font-mono mt-1">
                ₹{totalUpcomingAmt.toFixed(2)}
              </div>
              <span
                className={`text-[10px] block mt-0.5 ${
                  dueFilter === 'UPCOMING' ? 'text-sky-100' : 'text-sky-700'
                }`}
              >
                Future promised dates
              </span>
            </div>

            {/* Total Open Dues */}
            <div
              onClick={() => setDueFilter('ALL_OPEN')}
              className={`p-3.5 rounded-2xl border cursor-pointer transition ${
                dueFilter === 'ALL_OPEN'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-white hover:bg-slate-50 border-slate-200/90 text-slate-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold">Total Active Dues</span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    dueFilter === 'ALL_OPEN' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {dueItems.length} bills
                </span>
              </div>
              <div className="text-base sm:text-xl font-bold font-mono mt-1">
                ₹{totalAllDueAmt.toFixed(2)}
              </div>
              <span
                className={`text-[10px] block mt-0.5 ${
                  dueFilter === 'ALL_OPEN' ? 'text-slate-300' : 'text-slate-400'
                }`}
              >
                Total store credit balance
              </span>
            </div>
          </div>

          {/* Filter Bar & Search */}
          <div className="bg-white border border-slate-200/90 p-3.5 rounded-2xl shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs font-semibold no-scrollbar">
              <button
                type="button"
                onClick={() => setDueFilter('DUE_TODAY')}
                className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap flex items-center gap-1.5 ${
                  dueFilter === 'DUE_TODAY'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>📅 Due Today ({dueTodayList.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setDueFilter('OVERDUE')}
                className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap flex items-center gap-1.5 ${
                  dueFilter === 'OVERDUE'
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>⚠️ Overdue ({overdueList.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setDueFilter('UPCOMING')}
                className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap flex items-center gap-1.5 ${
                  dueFilter === 'UPCOMING'
                    ? 'bg-sky-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>⏳ Upcoming ({upcomingList.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setDueFilter('ALL_OPEN')}
                className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap flex items-center gap-1.5 ${
                  dueFilter === 'ALL_OPEN'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>All Active Dues ({dueItems.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setDueFilter('SETTLED')}
                className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap flex items-center gap-1.5 ${
                  dueFilter === 'SETTLED'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>✓ Fully Settled ({settledItems.length})</span>
              </button>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search customer, mobile, bill #..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 font-medium focus:outline-none"
              />
            </div>
          </div>

          {/* Dues Records Table / Cards */}
          {dueFilter === 'SETTLED' ? (
            /* Settled Invoices View */
            <div className="bg-white border border-slate-200/90 rounded-2xl shadow-card overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                  Settled / Completed Invoices ({filteredSettledItems.length})
                </h3>
              </div>

              {filteredSettledItems.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">No settled invoices found.</div>
              ) : (
                <div className="divide-y divide-slate-100 overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50/75 text-slate-500 font-semibold border-b border-slate-100">
                        <th className="p-3 pl-4">Customer</th>
                        <th className="p-3">Bill Number</th>
                        <th className="p-3 text-right">Total Amount</th>
                        <th className="p-3 text-right">Amount Paid</th>
                        <th className="p-3 text-center">Status</th>
                        <th className="p-3 text-center pr-4">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredSettledItems.map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-50/60 transition">
                          <td className="p-3 pl-4">
                            <span className="font-bold text-slate-900 block">{inv.customerName}</span>
                            <span className="text-[11px] text-slate-500 font-mono">+91 {inv.customerPhone}</span>
                          </td>
                          <td className="p-3">
                            <span className="font-mono font-bold text-blue-600">{inv.invoiceNumber}</span>
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-slate-900">
                            ₹{inv.grandTotal.toFixed(2)}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-emerald-700">
                            ₹{(inv.paidAmount || inv.grandTotal).toFixed(2)}
                          </td>
                          <td className="p-3 text-center">
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-full text-[10px]">
                              Paid In Full
                            </span>
                          </td>
                          <td className="p-3 text-center pr-4">
                            <Link
                              href={`/invoice/${encodeURIComponent(inv.invoiceNumber)}`}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg inline-flex transition"
                              title="View Invoice"
                            >
                              <Printer className="w-4 h-4" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            /* Active Dues Table */
            <div className="bg-white border border-slate-200/90 rounded-2xl shadow-card overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                    {dueFilter === 'DUE_TODAY'
                      ? `Credit Payments Due Today – ${today.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`
                      : dueFilter === 'OVERDUE'
                      ? 'Overdue Credit Payments (Follow Up Required)'
                      : dueFilter === 'UPCOMING'
                      ? 'Upcoming Promised Repayment Dates'
                      : 'All Active Customer Dues'}
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono">
                    {filteredDueItems.length} records
                  </span>
                </div>
              </div>

              {filteredDueItems.length === 0 ? (
                <div className="p-10 text-center text-xs text-slate-400">
                  <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                  <p className="font-semibold text-slate-700">No dues under this category!</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {dueFilter === 'DUE_TODAY'
                      ? 'No customer payments are scheduled for repayment today.'
                      : 'All payments under this filter are clean and accounted for.'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50/75 text-slate-500 font-semibold border-b border-slate-100">
                        <th className="p-3 pl-4">Customer</th>
                        <th className="p-3">Bill Number</th>
                        <th className="p-3 text-right">Bill Amount</th>
                        <th className="p-3 text-right">Paid</th>
                        <th className="p-3 text-right">Outstanding Due</th>
                        <th className="p-3 text-center">Promised Date</th>
                        <th className="p-3 text-center pr-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredDueItems.map(({ invoice: inv, customer, statusType, daysDiff }) => (
                        <tr
                          key={inv.id}
                          className={`transition ${
                            statusType === 'TODAY'
                              ? 'bg-amber-50/35 hover:bg-amber-50/70'
                              : statusType === 'OVERDUE'
                              ? 'bg-rose-50/30 hover:bg-rose-50/60'
                              : 'hover:bg-slate-50/60'
                          }`}
                        >
                          {/* Customer */}
                          <td className="p-3 pl-4">
                            <span className="font-bold text-slate-900 block">{customer.name}</span>
                            <span className="text-[11px] text-slate-500 font-mono block">
                              +91 {customer.phone}
                            </span>
                          </td>

                          {/* Bill Number */}
                          <td className="p-3">
                            <Link
                              href={`/invoice/${encodeURIComponent(inv.invoiceNumber)}`}
                              className="font-mono font-bold text-blue-600 hover:underline block"
                            >
                              {inv.invoiceNumber}
                            </Link>
                            <span className="text-[10px] text-slate-400 block">
                              {new Date(inv.date || inv.createdAt).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                              })}
                            </span>
                          </td>

                          {/* Bill Amount */}
                          <td className="p-3 text-right font-mono font-bold text-slate-900">
                            ₹{inv.grandTotal.toFixed(2)}
                          </td>

                          {/* Amount Paid */}
                          <td className="p-3 text-right font-mono font-semibold text-emerald-700">
                            ₹{(inv.paidAmount || 0).toFixed(2)}
                          </td>

                          {/* Outstanding Due */}
                          <td className="p-3 text-right font-mono font-bold text-rose-700 text-sm">
                            ₹{(inv.dueAmount || 0).toFixed(2)}
                          </td>

                          {/* Promised Date */}
                          <td className="p-3 text-center">
                            {inv.dueDate ? (
                              <div className="inline-flex flex-col items-center">
                                <span className="font-semibold text-slate-800 font-mono text-[11px]">
                                  {new Date(inv.dueDate).toLocaleDateString('en-IN', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                  })}
                                </span>
                                {statusType === 'TODAY' && (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500 text-white mt-0.5 shadow-2xs">
                                    Due Today
                                  </span>
                                )}
                                {statusType === 'OVERDUE' && (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-600 text-white mt-0.5 shadow-2xs">
                                    {Math.abs(daysDiff || 1)}d Overdue
                                  </span>
                                )}
                                {statusType === 'UPCOMING' && (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-sky-100 text-sky-800 mt-0.5">
                                    In {daysDiff}d
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[10px] italic">Not Set</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="p-3 text-center pr-4">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setPaymentCustomer(customer as Customer);
                                  setPaymentInitialAmount(inv.dueAmount || 0);
                                  setPaymentInvoiceRef(inv.invoiceNumber);
                                  setIsPaymentModalOpen(true);
                                }}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs transition active:scale-98 shadow-2xs"
                                title="Record Partial or Full Payment"
                              >
                                Settle Due
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedInvoiceToReschedule(inv);
                                  setIsRescheduleOpen(true);
                                }}
                                className="p-1 text-slate-500 hover:text-amber-800 hover:bg-amber-100 rounded-lg transition"
                                title="Reschedule Promised Repayment Date"
                              >
                                <Calendar className="w-3.5 h-3.5" />
                              </button>

                              <Link
                                href={`/invoice/${encodeURIComponent(inv.invoiceNumber)}`}
                                className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                title="View Bill"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: CUSTOMER DIRECTORY & KHATA CRM */}
      {activeTab === 'DIRECTORY' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fade-in">
          {/* Left Column: Customer Directory (Hidden on mobile when viewing detail) */}
          <div className={`lg:col-span-5 space-y-3 ${mobileCustomerView === 'DETAIL' ? 'hidden lg:block' : 'block'}`}>
            {/* Search Box */}
            <div className="relative">
              <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name or mobile..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none shadow-xs font-medium"
              />
            </div>

            {/* Customer Cards List */}
            <div className="space-y-2 max-h-[calc(100vh-230px)] overflow-y-auto pr-1">
              {filteredCustomers.map((cust) => {
                const isSelected = selectedCustomer?.id === cust.id;
                const hasDue = (cust.outstandingBalance || 0) > 0;
                const hasAdvance = (cust.advanceBalance || 0) > 0;

                return (
                  <div
                    key={cust.id}
                    onClick={() => {
                      setSelectedCustomer(cust);
                      setMobileCustomerView('DETAIL');
                    }}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/25'
                        : 'bg-white hover:bg-slate-50/80 border-slate-200/90 shadow-2xs'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`font-semibold text-xs truncate ${
                            isSelected ? 'text-white' : 'text-slate-900'
                          }`}
                        >
                          {cust.name}
                        </span>
                        {hasDue && (
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                              isSelected
                                ? 'bg-rose-500 text-white border-rose-400'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                          >
                            Due: ₹{Number(cust.outstandingBalance || 0).toFixed(2)}
                          </span>
                        )}
                        {hasAdvance && (
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                              isSelected
                                ? 'bg-emerald-500 text-white border-emerald-400'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            Adv: ₹{Number(cust.advanceBalance || 0).toFixed(2)}
                          </span>
                        )}
                      </div>

                      <div
                        className={`text-[11px] font-mono mt-0.5 ${
                          isSelected ? 'text-blue-100' : 'text-slate-500'
                        }`}
                      >
                        +91 {cust.phone}
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span
                        className={`text-[10px] block ${
                          isSelected ? 'text-blue-100' : 'text-slate-400'
                        }`}
                      >
                        Spend
                      </span>
                      <span
                        className={`text-xs font-bold font-mono ${
                          isSelected ? 'text-white' : 'text-slate-900'
                        }`}
                      >
                        ₹{Number(cust.totalSpend || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Customer Details & Purchase Ledger (Hidden on mobile when viewing list) */}
          <div className={`lg:col-span-7 ${mobileCustomerView === 'LIST' ? 'hidden lg:block' : 'block'}`}>
            {selectedCustomer ? (
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-card space-y-5 sm:space-y-6">
                {/* Mobile Back to List Button */}
                <button
                  onClick={() => setMobileCustomerView('LIST')}
                  className="lg:hidden flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 pb-2 border-b border-slate-100"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>← Back to Customer List</span>
                </button>

                {/* Profile Card */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4 border-b border-slate-100 pb-4 sm:pb-5">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base sm:text-lg font-bold text-slate-900">{selectedCustomer.name}</h2>
                      <span className="bg-blue-50 text-blue-700 border border-blue-200/60 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                        Customer
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 flex-wrap">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-mono font-medium">+91 {selectedCustomer.phone}</span>
                      {selectedCustomer.email && <span>• {selectedCustomer.email}</span>}
                    </p>

                    {selectedCustomer.address && (
                      <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{selectedCustomer.address}</span>
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5 sm:gap-2 pt-1 sm:pt-0">
                    <button
                      onClick={() => {
                        setPaymentCustomer(selectedCustomer);
                        setPaymentInitialAmount(selectedCustomer.outstandingBalance || 0);
                        setPaymentInvoiceRef(undefined);
                        setIsPaymentModalOpen(true);
                      }}
                      className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs shadow-xs shadow-emerald-500/20 transition active:scale-98 text-center"
                    >
                      <span className="hidden sm:inline">Record </span>Payment
                    </button>

                    <Link
                      href={`/pos?phone=${encodeURIComponent(selectedCustomer.phone)}`}
                      className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs shadow-xs shadow-blue-500/20 transition active:scale-98 text-center"
                    >
                      <span>New Bill</span>
                    </Link>

                    <button
                      onClick={() => {
                        setCustomerToEdit(selectedCustomer);
                        setIsCustomerModalOpen(true);
                      }}
                      className="px-2.5 sm:px-3 py-1.5 sm:py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition text-center"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => setCustomerToDelete(selectedCustomer)}
                      className="px-2.5 sm:px-3 py-1.5 sm:py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 rounded-xl text-xs font-semibold transition text-center flex items-center justify-center gap-1.5 active:scale-98"
                      title="Permanently Delete Customer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>

                {/* 4 Metrics Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                  <div className="p-2.5 sm:p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                    <span className="text-[10px] sm:text-[11px] text-slate-400 block font-medium">Total Purchases</span>
                    <span className="text-xs sm:text-sm font-bold text-slate-900 font-mono mt-0.5 block">
                      ₹{Number(selectedCustomer.totalSpend || 0).toFixed(2)}
                    </span>
                  </div>

                  <div className="p-2.5 sm:p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                    <span className="text-[10px] sm:text-[11px] text-slate-400 block font-medium">Total Bills</span>
                    <span className="text-xs sm:text-sm font-bold text-slate-900 font-mono mt-0.5 block">
                      {selectedCustomer.totalBills} Bills
                    </span>
                  </div>

                  <div className="p-2.5 sm:p-3 bg-emerald-50/70 rounded-xl border border-emerald-200/60">
                    <span className="text-[10px] sm:text-[11px] text-emerald-800 block font-medium">Advance</span>
                    <span className="text-xs sm:text-sm font-bold text-emerald-800 font-mono mt-0.5 block">
                      ₹{Number(selectedCustomer.advanceBalance || 0).toFixed(2)}
                    </span>
                  </div>

                  <div className="p-2.5 sm:p-3 bg-rose-50/70 rounded-xl border border-rose-200/60">
                    <span className="text-[10px] sm:text-[11px] text-rose-800 block font-medium">Due Balance</span>
                    <span className="text-xs sm:text-sm font-bold text-rose-700 font-mono mt-0.5 block">
                      ₹{Number(selectedCustomer.outstandingBalance || 0).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Purchase Bills History Table */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Purchase History ({customerInvoices.length})
                    </h3>

                    <Link
                      href={`/pos?phone=${encodeURIComponent(selectedCustomer.phone)}`}
                      className="text-xs text-blue-600 hover:underline font-semibold"
                    >
                      + Create Bill
                    </Link>
                  </div>

                  {customerInvoices.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-100">
                      No purchase bills found for this customer.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {customerInvoices.map((inv) => (
                        <div
                          key={inv.id}
                          className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 flex items-center justify-between text-xs"
                        >
                          <div className="min-w-0 pr-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-bold text-blue-600 block">
                                {inv.invoiceNumber}
                              </span>
                              {inv.paymentStatus === 'PAID' ? (
                                <span className="px-2 py-0.5 bg-emerald-100/80 text-emerald-800 text-[10px] font-bold rounded-full">
                                  Paid
                                </span>
                              ) : inv.paymentStatus === 'PARTIAL' ? (
                                <span className="px-2 py-0.5 bg-amber-100/90 text-amber-900 text-[10px] font-bold rounded-full">
                                  Partial Due (₹{Number(inv.dueAmount || 0).toFixed(2)})
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-bold rounded-full">
                                  Unpaid Credit
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] sm:text-[11px] text-slate-500 block mt-0.5">
                              {new Date(inv.date || inv.createdAt).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}{' '}
                              • {inv.items?.length || 1} item(s)
                            </span>
                            {inv.dueDate && (inv.dueAmount || 0) > 0 && (
                              <span className="text-[10px] text-amber-800 font-semibold block mt-0.5">
                                📅 Promised Repayment: {new Date(inv.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 flex-shrink-0">
                            <div className="text-right">
                              <span className="font-bold text-slate-900 font-mono block">
                                ₹{inv.grandTotal.toFixed(2)}
                              </span>
                              <span className="text-[10px] text-slate-500 font-semibold block">
                                {inv.paymentMode === 'CREDIT_CARD'
                                  ? 'Credit Card'
                                  : inv.paymentMode === 'DEBIT_CARD'
                                  ? 'Debit Card'
                                  : inv.paymentMode}
                              </span>
                            </div>

                            <Link
                              href={`/invoice/${encodeURIComponent(inv.invoiceNumber)}`}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="Print / View PDF Bill"
                            >
                              <Printer className="w-4 h-4" />
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white border border-slate-200/90 rounded-2xl p-12 text-center text-slate-400 shadow-card">
                <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="font-semibold text-slate-700">Select a Customer</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Click any customer on the left to view lifetime spend, credit ledger, and purchase invoices.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => {
          setIsCustomerModalOpen(false);
          setCustomerToEdit(null);
        }}
        customerToEdit={customerToEdit}
        onSaveCustomer={handleSaveCustomer}
      />

      <CustomerPaymentModal
        customer={paymentCustomer || selectedCustomer}
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

      <RescheduleDueDateModal
        isOpen={isRescheduleOpen}
        onClose={() => {
          setIsRescheduleOpen(false);
          setSelectedInvoiceToReschedule(null);
        }}
        invoice={selectedInvoiceToReschedule}
        onSaveDueDate={handleSaveDueDate}
      />

      <DeleteCustomerModal
        isOpen={!!customerToDelete}
        customer={customerToDelete}
        onClose={() => setCustomerToDelete(null)}
        onConfirmDelete={handleDeleteCustomer}
      />
    </div>
  );
}

export default function CustomersCRMPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading Customer CRM...</div>}>
      <CustomersCRMContent />
    </Suspense>
  );
}

