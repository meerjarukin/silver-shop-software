'use client';

import React, { useState } from 'react';
import { Printer, Download, Share2, ArrowLeft, Sparkles, Check, FileText, Receipt } from 'lucide-react';
import { Invoice, ShopConfig } from '@/lib/types';
import { generateInvoicePDF } from '@/lib/pdf';
import ThermalReceiptView from '@/components/ThermalReceiptView';

interface PDFInvoiceViewProps {
  invoice: Invoice;
  config: ShopConfig;
  onBack?: () => void;
}

export default function PDFInvoiceView({ invoice, config, onBack }: PDFInvoiceViewProps) {
  const [viewMode, setViewMode] = useState<'A4' | 'THERMAL'>('A4');

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

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    const doc = await generateInvoicePDF(invoice, config);
    doc.save(`${invoice.invoiceNumber}.pdf`);
  };

  const handleWhatsAppShare = async () => {
    const cleanPhone = invoice.customerPhone.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    // Check if device supports native file sharing (e.g. mobile phone / tablet)
    try {
      const doc = await generateInvoicePDF(invoice, config);
      const pdfBlob = doc.output('blob');
      const pdfFile = new File([pdfBlob], `${invoice.invoiceNumber}.pdf`, { type: 'application/pdf' });

      if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        await navigator.share({
          title: `${config.shopName} - Invoice ${invoice.invoiceNumber}`,
          text: `Tax Invoice ${invoice.invoiceNumber} for ${invoice.customerName} (Total: ₹${invoice.grandTotal.toFixed(2)})`,
          files: [pdfFile],
        });
        return;
      }
    } catch (err) {
      console.log('Falling back to direct WhatsApp Web URL dispatch');
    }

    // Standard Direct WhatsApp Protocol (Pre-filled chat to customer's number)
    const itemsList = invoice.items
      .map(
        (i) =>
          `• *${i.productName}*\n  Qty: ${i.quantity || 1} | NW: ${i.netWeight.toFixed(2)}g @ ₹${i.silverRateApplied}/g ➔ *₹${i.totalPrice.toFixed(0)}*`
      )
      .join('\n');

    const billTitle =
      invoice.invoiceType === 'ESTIMATE_QUOTATION'
        ? 'ESTIMATE / QUOTATION'
        : invoice.invoiceType === 'NON_GST_BILL'
        ? 'RETAIL CASH MEMO'
        : 'GST TAX INVOICE';

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://silver-shop-software.vercel.app';
    const digitalBillUrl = `${origin}/invoice/${encodeURIComponent(invoice.invoiceNumber)}`;

    const hasDue = (invoice.dueAmount || 0) > 0;
    const dueDateStr = invoice.dueDate
      ? new Date(invoice.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      : '';

    const message = `💎 *${config.shopName}* 💎\n${config.legalName ? `_Prop: ${config.legalName}_\n` : ''}${config.gstin ? `GSTIN: ${config.gstin}\n` : ''}━━━━━━━━━━━━━━━━━━━━\n📄 *${billTitle}*\n*Bill No:* ${invoice.invoiceNumber}\n*Date:* ${new Date(invoice.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}\n*Customer:* ${invoice.customerName} (${invoice.customerPhone})\n━━━━━━━━━━━━━━━━━━━━\n🛍️ *ITEMS PURCHASED:*\n${itemsList}\n━━━━━━━━━━━━━━━━━━━━\n💵 *Subtotal:* ₹${invoice.subtotal.toFixed(2)}${invoice.discount > 0 ? `\n🏷️ *Discount:* -₹${invoice.discount.toFixed(2)}` : ''}${invoice.oldSilver && invoice.oldSilver.totalValue > 0 ? `\n♻️ *Old Silver Exch (${invoice.oldSilver.grossWeight}g):* -₹${invoice.oldSilver.totalValue.toFixed(2)}` : ''}${invoice.cgst > 0 ? `\n🏛️ *GST (3%):* ₹${(invoice.cgst + invoice.sgst).toFixed(2)}` : ''}${invoice.cardCharge && invoice.cardCharge > 0 ? `\n💳 *Credit Card Surcharge (2.25%):* +₹${invoice.cardCharge.toFixed(2)}` : ''}\n\n💰 *GRAND TOTAL: ₹${invoice.grandTotal.toFixed(2)}*\n*Payment Mode:* ${formatPayMode(invoice.paymentMode)} (${invoice.paymentStatus})${hasDue ? `\n💵 *Amount Paid:* ₹${invoice.paidAmount.toFixed(2)}\n⚠️ *Balance Due / Khata:* ₹${(invoice.dueAmount || 0).toFixed(2)}${dueDateStr ? `\n📅 *Promised Repayment Date:* ${dueDateStr}` : ''}` : ''}\n━━━━━━━━━━━━━━━━━━━━\n🔗 *View & Download Digital Invoice:* \n👉 ${digitalBillUrl}\n\n📍 *Store:* ${config.address}\n📞 *Contact:* ${config.phone}\n\n✨ _Thank you for shopping with us! Visit again._ ✨`;

    const waUrl = `https://api.whatsapp.com/send?phone=${phoneWithCountry}&text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  };

  const getHeaderBadge = () => {
    if (invoice.invoiceType === 'ESTIMATE_QUOTATION') {
      return { text: 'ESTIMATE / QUOTATION', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
    }
    if (invoice.invoiceType === 'NON_GST_BILL') {
      return { text: 'RETAIL CASH MEMO', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
    }
    return { text: 'GST TAX INVOICE', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  };

  const badge = getHeaderBadge();

  if (viewMode === 'THERMAL') {
    return (
      <ThermalReceiptView
        invoice={invoice}
        config={config}
        initialWidth={config.printerWidth || '80mm'}
        onBack={() => setViewMode('A4')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 py-6 px-4">
      {/* Top Action Bar (Hidden during print) */}
      <div className="max-w-4xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-3 no-print bg-white border border-slate-200 p-4 rounded-2xl shadow-card">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to POS</span>
          </button>
        )}

        <div className="flex items-center gap-2 text-xs text-slate-600">
          <span className="font-bold text-slate-900 font-mono">{invoice.invoiceNumber}</span>
          <span>•</span>
          <span className="font-semibold text-slate-800">{badge.text}</span>
          <span>•</span>
          <span>Billed to {invoice.customerName}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Switch to Thermal Slip */}
          <button
            onClick={() => setViewMode('THERMAL')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold transition"
            title="Switch to 80mm/58mm Thermal Roll Slip"
          >
            <Receipt className="w-4 h-4 text-amber-700" />
            <span>Thermal Slip ({config.printerWidth || '80mm'})</span>
          </button>

          <button
            onClick={handleWhatsAppShare}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <Share2 className="w-4 h-4" />
            <span>WhatsApp</span>
          </button>

          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition"
          >
            <Download className="w-4 h-4" />
            <span>PDF</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs shadow-xs transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print A4 Bill</span>
          </button>
        </div>
      </div>

      {/* Printable A4 Tax Invoice Document */}
      <div className="max-w-4xl mx-auto bg-white text-slate-900 rounded-2xl shadow-card p-8 sm:p-12 border border-slate-200">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start justify-between border-b border-slate-200 pb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {config.shopName}
            </h1>
            {config.legalName && (
              <p className="text-xs font-semibold text-slate-700">Proprietor: {config.legalName}</p>
            )}
            <p className="text-xs font-medium text-slate-600 mt-0.5">{config.tagline}</p>
            <p className="text-xs text-slate-600 mt-0.5">{config.address}</p>
            <p className="text-xs text-slate-600">
              Phone: <span className="font-semibold text-slate-800">{config.phone}</span>
              {invoice.invoiceType === 'TAX_INVOICE' && (
                <> | GSTIN: <span className="font-semibold text-slate-800">{config.gstin || 'N/A'}</span></>
              )}
            </p>
          </div>

          <div className="sm:text-right">
            <div className={`inline-block font-bold text-xs px-3 py-0.5 rounded-full uppercase tracking-wider mb-2 border ${badge.bg}`}>
              {badge.text}
            </div>
            <div className="text-xs font-mono font-bold text-slate-800">
              Bill #{invoice.invoiceNumber}
            </div>
            <div className="text-xs text-slate-500 mt-0.5 font-medium">
              Date: {new Date(invoice.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </div>
            <div className="text-xs font-medium text-slate-600 mt-0.5">
              Payment: <span className="font-bold text-slate-800">{formatPayMode(invoice.paymentMode)}</span>
              {invoice.paymentStatus !== 'PAID' && (
                <span className="ml-1.5 px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full">
                  {invoice.paymentStatus}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Customer Info */}
        <div className="py-4 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-400 font-bold uppercase tracking-wider block mb-1">
              Customer Details:
            </span>
            <div className="font-bold text-slate-900 text-sm">{invoice.customerName}</div>
            <div className="text-slate-600 font-mono">Mobile: +91 {invoice.customerPhone}</div>
            {invoice.customerAddress && (
              <div className="text-slate-500 mt-0.5">{invoice.customerAddress}</div>
            )}
          </div>
          {invoice.invoiceType === 'TAX_INVOICE' && (
            <div className="sm:text-right">
              <span className="text-slate-400 font-bold uppercase tracking-wider block mb-1">
                HSN & Taxation:
              </span>
              <div className="text-slate-600">HSN Code: <span className="font-semibold text-slate-900">{config.hsnCode || '7113'}</span></div>
              <div className="text-slate-600">
                Regime: GST 3% (Precious Metals)
              </div>
            </div>
          )}
          {invoice.invoiceType === 'NON_GST_BILL' && (
            <div className="sm:text-right">
              <span className="text-slate-400 font-bold uppercase tracking-wider block mb-1">
                Billing Format:
              </span>
              <div className="text-slate-600 font-medium">Non-GST Retail Memo</div>
            </div>
          )}
        </div>

        {/* Items Table */}
        <div className="py-6 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b-2 border-slate-900 text-slate-900 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-2">#</th>
                <th className="py-3 px-2">Product Description</th>
                <th className="py-3 px-2 text-right">Gross Wt</th>
                <th className="py-3 px-2 text-right">Net Wt</th>
                <th className="py-3 px-2 text-right">Purity</th>
                <th className="py-3 px-2 text-right">Rate/g</th>
                <th className="py-3 px-2 text-right">Wastage</th>
                <th className="py-3 px-2 text-right">Making</th>
                <th className="py-3 px-2 text-right">Total (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoice.items.map((item, idx) => {
                return (
                  <tr key={idx} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-2 text-slate-400 font-medium">{idx + 1}</td>
                    <td className="py-3 px-2">
                      <div>
                        <span className="font-bold text-slate-900 block">{item.productName}</span>
                        <span className="font-mono text-[10px] text-slate-500">
                          SKU: {item.productSku}
                          {invoice.invoiceType === 'TAX_INVOICE' && (
                            <> | HSN: {item.hsnCode || '7113'}</>
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-right font-medium text-slate-700">
                      {(item.grossWeight || 0).toFixed(2)} g
                    </td>
                    <td className="py-3 px-2 text-right font-bold text-slate-900">
                      {(item.netWeight || 0).toFixed(2)} g
                    </td>
                    <td className="py-3 px-2 text-right text-slate-700">{item.purity}%</td>
                    <td className="py-3 px-2 text-right text-slate-700">
                      ₹{item.silverRateApplied.toFixed(1)}
                    </td>
                    <td className="py-3 px-2 text-right text-slate-700">
                      ₹{(item.wastageAmount || 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-2 text-right text-slate-700">
                      ₹{item.makingCharge.toFixed(2)}
                    </td>
                    <td className="py-3 px-2 text-right font-bold text-slate-950 font-mono">
                      ₹{item.totalPrice.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Calculation Summary */}
        <div className="border-t border-slate-200 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-1.5">
            <span className="font-bold text-slate-900 block mb-1">Payment Information</span>
            <div className="flex justify-between text-slate-600">
              <span>Payment Mode:</span>
              <span className="font-semibold text-slate-800">{invoice.paymentMode}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Status:</span>
              <span className={`font-semibold ${invoice.paymentStatus === 'PAID' ? 'text-emerald-700' : 'text-amber-700'}`}>
                {invoice.paymentStatus}
              </span>
            </div>
            {invoice.customerPhone && (
              <div className="flex justify-between text-slate-600">
                <span>Customer Contact:</span>
                <span className="font-mono text-slate-800">{invoice.customerPhone}</span>
              </div>
            )}
          </div>

          <div className="space-y-1.5 text-xs text-slate-700 font-medium">
            <div className="flex justify-between py-0.5">
              <span>Item Subtotal:</span>
              <span className="font-bold font-mono">₹{invoice.subtotal.toFixed(2)}</span>
            </div>

            {invoice.wastageTotal > 0 && (
              <div className="flex justify-between py-0.5 text-slate-600">
                <span>Total Wastage:</span>
                <span className="font-mono">₹{invoice.wastageTotal.toFixed(2)}</span>
              </div>
            )}

            {invoice.makingCharges > 0 && (
              <div className="flex justify-between py-0.5 text-slate-600">
                <span>Total Making Charges:</span>
                <span className="font-mono">₹{invoice.makingCharges.toFixed(2)}</span>
              </div>
            )}

            {invoice.discount > 0 && (
              <div className="flex justify-between py-0.5 text-emerald-700 font-bold">
                <span>Special Discount:</span>
                <span className="font-mono">- ₹{invoice.discount.toFixed(2)}</span>
              </div>
            )}

            {invoice.oldSilver && invoice.oldSilver.totalValue > 0 && (
              <div className="flex justify-between py-0.5 text-rose-600 font-bold">
                <span>Old Silver Credit ({invoice.oldSilver.grossWeight}g):</span>
                <span className="font-mono">- ₹{invoice.oldSilver.totalValue.toFixed(2)}</span>
              </div>
            )}

            {invoice.invoiceType === 'TAX_INVOICE' && (
              <>
                {invoice.taxType === 'INTER_STATE' ? (
                  <div className="flex justify-between py-0.5 text-slate-600">
                    <span>IGST (3%):</span>
                    <span className="font-mono">₹{invoice.igst.toFixed(2)}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between py-0.5 text-slate-600">
                      <span>CGST (1.5%):</span>
                      <span className="font-mono">₹{invoice.cgst.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-0.5 text-slate-600">
                      <span>SGST (1.5%):</span>
                      <span className="font-mono">₹{invoice.sgst.toFixed(2)}</span>
                    </div>
                  </>
                )}
              </>
            )}

            {invoice.cardCharge && invoice.cardCharge > 0 && (
              <div className="flex justify-between py-0.5 text-blue-700 font-semibold">
                <span>Credit Card Surcharge (2.25%):</span>
                <span className="font-mono">+ ₹{invoice.cardCharge.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between items-center bg-slate-900 text-white px-4 py-3 rounded-xl mt-3 shadow-sm">
              <span className="font-bold text-sm">Grand Total (INR):</span>
              <span className="font-bold text-lg font-mono text-emerald-400">
                ₹{invoice.grandTotal.toFixed(2)}
              </span>
            </div>

            {/* Payment Settlement & Due / Credit Info */}
            {(invoice.dueAmount || 0) > 0 && (
              <div className="mt-3 p-3.5 bg-rose-50/80 border border-rose-200/80 rounded-xl space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-700 font-medium">
                  <span>Amount Paid Now:</span>
                  <span className="font-mono font-bold text-emerald-700">₹{invoice.paidAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-rose-700 font-bold">
                  <span>Balance Outstanding Due:</span>
                  <span className="font-mono">₹{(invoice.dueAmount || 0).toFixed(2)}</span>
                </div>
                {invoice.dueDate && (
                  <div className="flex justify-between text-amber-900 font-medium text-[11px] pt-1.5 border-t border-rose-200/60">
                    <span>Promised Repayment Date:</span>
                    <span className="font-bold">
                      {new Date(invoice.dueDate).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-500 gap-4">
          <div className="max-w-md">
            <span className="font-bold text-slate-700 block">Terms & Conditions:</span>
            <span>
              {(config.terms || '1. Goods once sold will be exchanged within 3 days against original invoice. 2. Silver rates calculated on date of billing.')
                .replace(/\s*2\.\s*(?:Silver\s+)?purity\s+(?:certified|guaranteed)\s+as\s+per\s+hallmark\s+(?:standards|specifications)\.?\s*/gi, ' ')
                .replace(/3\.\s*Silver rates/gi, '2. Silver rates')
                .trim()}
            </span>
          </div>

          <div className="text-center sm:text-right">
            <p className="font-bold text-slate-800">For {config.shopName}</p>
            <div className="h-8"></div>
            <p className="text-slate-400 font-medium">Authorized Signatory</p>
          </div>
        </div>

        {/* Thank You Note */}
        <div className="mt-6 pt-3 text-center border-t border-dashed border-slate-200">
          <p className="font-bold text-slate-700 text-xs tracking-wider uppercase">
            Thank You! Visit Again
          </p>
        </div>
      </div>
    </div>
  );
}
