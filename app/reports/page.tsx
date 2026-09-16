'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  Calendar,
  Download,
  TrendingUp,
  Scale,
  DollarSign,
  Printer,
  FileSpreadsheet,
  PieChart,
  CheckCircle2,
  Receipt,
  Sparkles,
  Layers,
  Percent,
} from 'lucide-react';
import { Invoice } from '@/lib/types';

export default function ReportsPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [reportType, setReportType] = useState<'DAILY' | 'MONTHLY' | 'PROFIT' | 'HSN'>('DAILY');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetch('/api/billing')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setInvoices(data);
      })
      .catch(() => {});
  }, []);

  const filteredInvoices = invoices.filter((inv) => {
    const invDateStr = new Date(inv.date || inv.createdAt).toISOString().split('T')[0];
    if (reportType === 'DAILY') {
      return invDateStr === selectedDate;
    }
    return invDateStr.substring(0, 7) === selectedDate.substring(0, 7);
  });

  // Calculate Metrics
  const totalRevenue = filteredInvoices.reduce((acc, inv) => acc + inv.grandTotal, 0);
  const totalSilverWeightSold = filteredInvoices.reduce((acc, inv) => {
    const itemsWt =
      inv.items?.reduce((w, i) => w + i.netWeight * (i.quantity || 1), 0) || 0;
    return acc + itemsWt;
  }, 0);

  const totalMakingCharges = filteredInvoices.reduce(
    (acc, inv) => acc + (inv.makingCharges || 0),
    0
  );
  const totalWastageCharges = filteredInvoices.reduce(
    (acc, inv) => acc + (inv.wastageTotal || 0),
    0
  );
  const totalCGST = filteredInvoices.reduce((acc, inv) => acc + (inv.cgst || 0), 0);
  const totalSGST = filteredInvoices.reduce((acc, inv) => acc + (inv.sgst || 0), 0);
  const totalIGST = filteredInvoices.reduce((acc, inv) => acc + (inv.igst || 0), 0);
  const totalTaxable = filteredInvoices.reduce((acc, inv) => acc + (inv.taxableAmount || 0), 0);

  // Profit Metrics
  const totalCostOfGoodsSold = filteredInvoices.reduce((acc, inv) => {
    if (inv.costOfGoodsSold) return acc + inv.costOfGoodsSold;
    return acc + inv.taxableAmount * 0.55;
  }, 0);

  const totalProfit = Math.max(0, totalTaxable - totalCostOfGoodsSold);
  const profitMarginPercent = totalTaxable > 0 ? (totalProfit / totalTaxable) * 100 : 0;

  // HSN Breakdown
  const hsnMap: { [code: string]: { weight: number; taxable: number; count: number } } = {
    '7113': { weight: 0, taxable: 0, count: 0 },
    '7114': { weight: 0, taxable: 0, count: 0 },
  };

  filteredInvoices.forEach((inv) => {
    inv.items?.forEach((item) => {
      const code = item.hsnCode || '7113';
      if (!hsnMap[code]) hsnMap[code] = { weight: 0, taxable: 0, count: 0 };
      hsnMap[code].weight += item.netWeight * (item.quantity || 1);
      hsnMap[code].taxable += item.totalPrice;
      hsnMap[code].count += item.quantity || 1;
    });
  });

  const exportToCSV = () => {
    const formatPayMode = (mode: string) => {
      switch (mode) {
        case 'CREDIT_CARD': return 'Credit Card';
        case 'DEBIT_CARD': return 'Debit Card';
        case 'UPI': return 'UPI';
        case 'CASH': return 'Cash';
        case 'KHATA': return 'Khata / Credit';
        case 'ADVANCE_ADJUST': return 'Advance Adjustment';
        case 'CARD': return 'Credit Card';
        default: return mode;
      }
    };

    const headers = [
      'Invoice Number',
      'Invoice Type',
      'Date',
      'Customer Name',
      'Customer Phone',
      'Taxable Value (INR)',
      'CGST (INR)',
      'SGST (INR)',
      'IGST (INR)',
      'Card Surcharge (INR)',
      'Grand Total (INR)',
      'Payment Mode',
      'Payment Status',
      'Paid Amount (INR)',
      'Due Balance (INR)',
      'Promised Repayment Date',
    ];

    const rows = filteredInvoices.map((inv) => [
      inv.invoiceNumber,
      inv.invoiceType || 'TAX_INVOICE',
      new Date(inv.date || inv.createdAt).toLocaleDateString('en-IN'),
      `"${inv.customerName}"`,
      inv.customerPhone,
      inv.taxableAmount.toFixed(2),
      inv.cgst.toFixed(2),
      inv.sgst.toFixed(2),
      (inv.igst || 0).toFixed(2),
      (inv.cardCharge || 0).toFixed(2),
      inv.grandTotal.toFixed(2),
      formatPayMode(inv.paymentMode),
      inv.paymentStatus || 'PAID',
      (inv.paidAmount !== undefined ? inv.paidAmount : inv.grandTotal).toFixed(2),
      (inv.dueAmount || 0).toFixed(2),
      inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-IN') : 'N/A',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Silver_Jewelry_GST_Report_${reportType}_${selectedDate}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-8 py-5 sm:py-8 space-y-5 sm:space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <div className="p-1.5 bg-sky-50 text-sky-600 rounded-lg border border-sky-200/60 flex-shrink-0">
              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span>Reports & GST Intelligence</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Daily cashier sheet, monthly sales summary, HSN code report, and profit margins.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
          <button
            onClick={exportToCSV}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs shadow-emerald-500/20 transition active:scale-98"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">Export GSTR-1</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-2xs transition"
          >
            <Printer className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Sub-Tabs & Date Filter */}
      <div className="bg-white border border-slate-200/90 p-3.5 sm:p-4 rounded-2xl shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs no-scrollbar">
          <button
            onClick={() => setReportType('DAILY')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition whitespace-nowrap ${
              reportType === 'DAILY'
                ? 'bg-blue-600 text-white shadow-2xs shadow-blue-500/20'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60'
            }`}
          >
            Daily Sheet
          </button>

          <button
            onClick={() => setReportType('MONTHLY')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition whitespace-nowrap ${
              reportType === 'MONTHLY'
                ? 'bg-blue-600 text-white shadow-2xs shadow-blue-500/20'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60'
            }`}
          >
            Monthly Summary
          </button>

          <button
            onClick={() => setReportType('PROFIT')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition whitespace-nowrap ${
              reportType === 'PROFIT'
                ? 'bg-blue-600 text-white shadow-2xs shadow-blue-500/20'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60'
            }`}
          >
            Profit & Margin
          </button>

          <button
            onClick={() => setReportType('HSN')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition whitespace-nowrap ${
              reportType === 'HSN'
                ? 'bg-blue-600 text-white shadow-2xs shadow-blue-500/20'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60'
            }`}
          >
            HSN Summary (GST)
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium">Period:</span>
          <input
            type={reportType === 'DAILY' ? 'date' : 'month'}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full sm:w-auto bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl px-2.5 py-1 text-xs text-slate-800 font-mono font-medium focus:outline-none"
          />
        </div>
      </div>

      {/* 4 Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="bg-white border border-slate-200/90 p-3.5 sm:p-4 rounded-2xl shadow-card">
          <span className="text-[11px] sm:text-xs text-slate-500 block font-medium">Total Turnover</span>
          <div className="text-base sm:text-xl font-bold text-slate-900 font-mono mt-0.5 sm:mt-1 truncate">
            ₹{totalRevenue.toFixed(0)}
          </div>
          <span className="text-[10px] sm:text-[11px] text-blue-600 font-semibold mt-0.5 block truncate">
            {filteredInvoices.length} Bills Generated
          </span>
        </div>

        <div className="bg-white border border-slate-200/90 p-3.5 sm:p-4 rounded-2xl shadow-card">
          <span className="text-[11px] sm:text-xs text-slate-500 block font-medium">Silver Weight Sold</span>
          <div className="text-base sm:text-xl font-bold text-amber-700 font-mono mt-0.5 sm:mt-1 truncate">
            {totalSilverWeightSold.toFixed(1)} g
          </div>
          <span className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 block truncate">
            Net silver sold
          </span>
        </div>

        <div className="bg-white border border-slate-200/90 p-3.5 sm:p-4 rounded-2xl shadow-card">
          <span className="text-[11px] sm:text-xs text-slate-500 block font-medium">GST Collected (3%)</span>
          <div className="text-base sm:text-xl font-bold text-emerald-700 font-mono mt-0.5 sm:mt-1 truncate">
            ₹{(totalCGST + totalSGST + totalIGST).toFixed(0)}
          </div>
          <span className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 block truncate">
            Tax revenue
          </span>
        </div>

        <div className="bg-white border border-slate-200/90 p-3.5 sm:p-4 rounded-2xl shadow-card">
          <span className="text-[11px] sm:text-xs text-slate-500 block font-medium">
            {reportType === 'PROFIT' ? 'Net Profit' : 'Craftsmanship'}
          </span>
          <div className="text-base sm:text-xl font-bold text-purple-700 font-mono mt-0.5 sm:mt-1 truncate">
            {reportType === 'PROFIT'
              ? `₹${totalProfit.toFixed(0)} (${profitMarginPercent.toFixed(1)}%)`
              : `₹${(totalMakingCharges + totalWastageCharges).toFixed(0)}`}
          </div>
          <span className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 block truncate">
            {reportType === 'PROFIT' ? 'After purchase cost' : 'Making & wastage'}
          </span>
        </div>
      </div>

      {/* Profit Intelligence Breakdown */}
      {reportType === 'PROFIT' && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-card space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-purple-600" />
            <span>Profit & Margin Intelligence</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="p-3.5 sm:p-4 bg-slate-50/80 rounded-xl border border-slate-100">
              <span className="text-xs text-slate-500 block">Gross Taxable Turnover</span>
              <span className="text-base sm:text-lg font-bold text-slate-900 font-mono mt-1 block">
                ₹{totalTaxable.toFixed(2)}
              </span>
            </div>

            <div className="p-3.5 sm:p-4 bg-slate-50/80 rounded-xl border border-slate-100">
              <span className="text-xs text-slate-500 block">Cost of Goods Sold (Purchase Basis)</span>
              <span className="text-base sm:text-lg font-bold text-rose-600 font-mono mt-1 block">
                ₹{totalCostOfGoodsSold.toFixed(2)}
              </span>
            </div>

            <div className="p-3.5 sm:p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <span className="text-xs text-emerald-800 font-semibold block">Net Estimated Profit</span>
              <span className="text-base sm:text-lg font-bold text-emerald-900 font-mono mt-1 block">
                ₹{totalProfit.toFixed(2)} ({profitMarginPercent.toFixed(1)}%)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* HSN Summary (GST Table 12) */}
      {reportType === 'HSN' && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-card space-y-4">
          <h2 className="text-sm font-bold text-slate-900">
            GSTR-1 Table 12: HSN Summary of Outward Supplies
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[500px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                  <th className="py-3 px-3">HSN Code</th>
                  <th className="py-3 px-3">Description</th>
                  <th className="py-3 px-3 text-right">Total Qty</th>
                  <th className="py-3 px-3 text-right">Total Net Wt (g)</th>
                  <th className="py-3 px-3 text-right">Total Taxable (₹)</th>
                  <th className="py-3 px-3 text-right">GST Rate</th>
                  <th className="py-3 px-3 text-right">GST Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Object.entries(hsnMap).map(([code, val]) => (
                  <tr key={code} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">{code}</td>
                    <td className="py-3 px-3 text-slate-700">
                      {code === '7113' ? 'Articles of Jewellery (Silver)' : 'Articles of Silversmiths / Utensils'}
                    </td>
                    <td className="py-3 px-3 text-right font-bold font-mono text-slate-900">{val.count} PCS</td>
                    <td className="py-3 px-3 text-right font-mono text-slate-600">{val.weight.toFixed(2)} g</td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900 font-mono">₹{val.taxable.toFixed(2)}</td>
                    <td className="py-3 px-3 text-right font-semibold text-emerald-700">3.0 %</td>
                    <td className="py-3 px-3 text-right font-bold font-mono text-slate-900">
                      ₹{(val.taxable * 0.03).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invoices Ledger */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-card space-y-4">
        <h2 className="text-sm font-bold text-slate-900">
          Invoices Settlement Ledger ({filteredInvoices.length})
        </h2>

        {filteredInvoices.length === 0 ? (
          <div className="text-center py-10 text-xs text-slate-400">
            No bills found for the selected period.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[500px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                  <th className="py-3 px-3">Bill No.</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3 text-right">Taxable</th>
                  <th className="py-3 px-3 text-right">GST (3%)</th>
                  <th className="py-3 px-3 text-right">Grand Total</th>
                  <th className="py-3 px-3 text-center">Payment</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-3 font-mono font-bold text-blue-600">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3 px-3 text-slate-500">
                      {new Date(inv.date || inv.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                      })}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-800 block">{inv.customerName}</span>
                      <span className="text-[11px] text-slate-400 font-mono">{inv.customerPhone}</span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-600">
                      ₹{inv.taxableAmount.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-500">
                      ₹{(inv.cgst + inv.sgst + (inv.igst || 0)).toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900 font-mono">
                      ₹{inv.grandTotal.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[10px] font-bold">
                          {inv.paymentMode === 'CREDIT_CARD'
                            ? 'Credit Card'
                            : inv.paymentMode === 'DEBIT_CARD'
                            ? 'Debit Card'
                            : inv.paymentMode}
                        </span>
                        {inv.paymentStatus === 'PARTIAL' ? (
                          <span className="text-[9px] text-amber-800 font-bold bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                            Due ₹{(inv.dueAmount || 0).toFixed(0)}
                          </span>
                        ) : inv.paymentStatus === 'DUE' ? (
                          <span className="text-[9px] text-rose-800 font-bold bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                            Unpaid Credit
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Link
                        href={`/invoice/${encodeURIComponent(inv.invoiceNumber)}`}
                        className="text-xs font-semibold text-blue-600 hover:underline"
                      >
                        Print PDF
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
