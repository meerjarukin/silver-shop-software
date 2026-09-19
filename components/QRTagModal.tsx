'use client';

import React, { useState, useEffect } from 'react';
import { X, Printer, ExternalLink, Copy, Check, QrCode, Plus, Minus, Layers, FileText, Sparkles } from 'lucide-react';
import { Product } from '@/lib/types';
import { generateProductQRCode, getPublicVerificationUrl } from '@/lib/qr';

interface QRTagModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function QRTagModal({ product, isOpen, onClose }: QRTagModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [tagCopies, setTagCopies] = useState<number>(1);
  const [printLayout, setPrintLayout] = useState<'A4_GRID' | 'THERMAL_ROLL'>('A4_GRID');

  useEffect(() => {
    if (product) {
      generateProductQRCode(product.sku).then(setQrDataUrl);
      // Default copies to product stock quantity if available, or 1
      setTagCopies(Math.max(1, Math.min(product.stockQuantity || 1, 10)));
    }
  }, [product, isOpen]);

  if (!isOpen || !product) return null;

  const publicUrl = getPublicVerificationUrl(product.sku);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    if (!product || !qrDataUrl) return;

    // Create an isolated hidden iframe specifically for printing the stickers
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    document.body.appendChild(printFrame);

    const doc = printFrame.contentWindow?.document;
    if (!doc) return;

    const copiesCount = Math.max(1, tagCopies);

    // Generate tags based on requested copies
    const tagsHtml = Array.from({ length: copiesCount })
      .map(
        (_, idx) => `
        <div class="tag-card">
          <div class="tag-details">
            <div class="brand-title">KUSHAL JEWELLERYS</div>
            <div class="prod-name">${product.name}</div>
            <div class="specs">
              <div>SKU: <strong>${product.sku}</strong></div>
              <div>NW: <strong>${(product.netWeight || 0).toFixed(2)}g</strong> | GW: <strong>${(product.grossWeight || 0).toFixed(2)}g</strong></div>
              <div>Purity: <strong>${product.purity}% (${product.purityGrade || '925'})</strong></div>
            </div>
          </div>
          <div class="qr-side">
            <img class="qr-img" src="${qrDataUrl}" alt="QR" />
            <span class="qr-caption">SCAN TO VERIFY</span>
          </div>
        </div>
      `
      )
      .join('');

    const isA4 = printLayout === 'A4_GRID';

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Stickers (${copiesCount}x) - ${product.sku}</title>
          <style>
            @page {
              size: ${isA4 ? 'A4 portrait' : 'auto'};
              margin: ${isA4 ? '8mm 6mm' : '3mm'};
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            body {
              background: #ffffff;
              color: #000000;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
              padding: ${isA4 ? '0' : '4px'};
            }
            .grid-container {
              ${
                isA4
                  ? `
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 4mm 4mm;
                width: 100%;
              `
                  : `
                display: flex;
                flex-direction: column;
                gap: 6px;
                width: 72mm;
              `
              }
            }
            .tag-card {
              box-sizing: border-box;
              ${
                isA4
                  ? `
                width: 100%;
                height: 34mm;
                border: 1px dashed #666666;
                border-radius: 4px;
                padding: 4px 8px;
              `
                  : `
                width: 72mm;
                height: 28mm;
                border: 1px dashed #333333;
                border-radius: 4px;
                padding: 4px 6px;
              `
              }
              display: flex;
              align-items: center;
              justify-content: space-between;
              page-break-inside: avoid;
              background: #ffffff;
            }
            .tag-details {
              flex: 1;
              min-width: 0;
              padding-right: 6px;
            }
            .brand-title {
              font-size: 8px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #000000;
              margin-bottom: 2px;
            }
            .prod-name {
              font-size: 10px;
              font-weight: 700;
              line-height: 1.15;
              margin-bottom: 2.5px;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .specs {
              font-size: 8px;
              line-height: 1.35;
              font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
              color: #111111;
            }
            .specs strong {
              color: #000000;
              font-weight: 800;
            }
            .qr-side {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              flex-shrink: 0;
            }
            .qr-img {
              width: ${isA4 ? '62px' : '56px'};
              height: ${isA4 ? '62px' : '56px'};
              object-fit: contain;
            }
            .qr-caption {
              font-size: 6px;
              font-weight: 700;
              font-family: ui-monospace, monospace;
              text-align: center;
              margin-top: 1px;
            }
          </style>
        </head>
        <body>
          <div class="grid-container">
            ${tagsHtml}
          </div>
        </body>
      </html>
    `);
    doc.close();

    // Trigger printing from the isolated iframe
    setTimeout(() => {
      printFrame.contentWindow?.focus();
      printFrame.contentWindow?.print();
      setTimeout(() => {
        if (document.body.contains(printFrame)) {
          document.body.removeChild(printFrame);
        }
      }, 2000);
    }, 250);
  };

  const pagesEstimated = Math.ceil(tagCopies / (printLayout === 'A4_GRID' ? 14 : 10));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-3 sm:p-4 animate-fade-in">
      <div className="bg-white border border-slate-200 w-full max-w-lg rounded-2xl shadow-modal overflow-hidden text-slate-900 relative max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 shadow-2xs">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                Jewellery Barcode & Sticker Tags
              </h2>
              <p className="text-xs text-slate-500">
                Choose quantity to print on A4 sticker sheets or thermal roll.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Tag Single Preview Card */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between gap-3 shadow-2xs">
            <div className="min-w-0 flex-1">
              <span className="text-[10px] text-blue-600 font-mono uppercase block font-bold tracking-wider">
                KUSHAL JEWELLERYS
              </span>
              <div className="font-bold text-xs text-slate-900 truncate mt-0.5">{product.name}</div>
              <div className="text-[11px] text-slate-600 font-mono mt-1 space-y-0.5">
                <div>SKU: <strong className="text-slate-900">{product.sku}</strong></div>
                <div>NW: <strong>{(product.netWeight || 0).toFixed(2)}g</strong> | GW: <strong>{(product.grossWeight || 0).toFixed(2)}g</strong></div>
                <div>Purity: <strong>{product.purity}% ({product.purityGrade || '925'})</strong></div>
              </div>
            </div>

            <div className="flex flex-col items-center bg-white p-2 rounded-xl border border-slate-200 shadow-2xs flex-shrink-0">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="Product QR" className="w-16 h-16 object-contain" />
              ) : (
                <div className="w-16 h-16 bg-slate-100 animate-pulse rounded"></div>
              )}
              <span className="text-[7px] text-slate-400 font-mono mt-0.5 font-bold">SCAN TO VERIFY</span>
            </div>
          </div>

          {/* Paper / Layout Format Toggle */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">Print Paper Format</label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setPrintLayout('A4_GRID')}
                className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition ${
                  printLayout === 'A4_GRID'
                    ? 'bg-blue-50/80 border-blue-500 text-blue-900 shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <FileText className={`w-4 h-4 mt-0.5 flex-shrink-0 ${printLayout === 'A4_GRID' ? 'text-blue-600' : 'text-slate-400'}`} />
                <div>
                  <span className="font-bold block text-xs">A4 Sticker Sheet</span>
                  <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">
                    2-Column Grid (Multiple stickers per A4 page)
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPrintLayout('THERMAL_ROLL')}
                className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition ${
                  printLayout === 'THERMAL_ROLL'
                    ? 'bg-blue-50/80 border-blue-500 text-blue-900 shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Layers className={`w-4 h-4 mt-0.5 flex-shrink-0 ${printLayout === 'THERMAL_ROLL' ? 'text-blue-600' : 'text-slate-400'}`} />
                <div>
                  <span className="font-bold block text-xs">Thermal Roll Tag</span>
                  <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">
                    Single tag continuous barcode roll (TSC/Zebra)
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Quantity / Copies Controls */}
          <div className="bg-slate-50/80 border border-slate-200/90 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-slate-800 block">
                  Select Sticker Quantity (Copies)
                </label>
                <span className="text-[10px] text-slate-500">
                  Current stock: <strong>{product.stockQuantity} pcs</strong> available
                </span>
              </div>

              {/* Number Stepper */}
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl p-1 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setTagCopies((prev) => Math.max(1, prev - 1))}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-600 font-bold transition active:scale-95"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={tagCopies}
                  onChange={(e) => setTagCopies(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                  className="w-12 text-center font-mono font-bold text-xs text-slate-900 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setTagCopies((prev) => Math.min(100, prev + 1))}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-600 font-bold transition active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Quick Preset Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[10px] text-slate-400 font-semibold mr-1">Presets:</span>
              {[1, 2, 5, 10].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setTagCopies(num)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono transition border ${
                    tagCopies === num
                      ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {num} {num === 1 ? 'Tag' : 'Tags'}
                </button>
              ))}
              {product.stockQuantity > 0 && (
                <button
                  type="button"
                  onClick={() => setTagCopies(product.stockQuantity)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition border ${
                    tagCopies === product.stockQuantity
                      ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  All Stock ({product.stockQuantity} pcs)
                </button>
              )}
            </div>

            {/* Layout Summary Banner */}
            <div className="p-2.5 bg-blue-50/70 border border-blue-200/60 rounded-xl text-[11px] text-blue-900 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
              <span>
                {printLayout === 'A4_GRID' ? (
                  <>
                    Printing <strong>{tagCopies} sticker{tagCopies > 1 ? 's' : ''}</strong> arranged in <strong>2 columns</strong> across <strong>{pagesEstimated} A4 page{pagesEstimated > 1 ? 's' : ''}</strong>.
                  </>
                ) : (
                  <>
                    Printing <strong>{tagCopies} individual tag{tagCopies > 1 ? 's' : ''}</strong> on continuous thermal barcode roll.
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Public Verification Link */}
          <div className="space-y-1 text-xs">
            <label className="text-slate-600 font-semibold block text-[11px]">
              Public QR Verification URL:
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                readOnly
                value={publicUrl}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-[11px] text-slate-600 font-mono"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs transition whitespace-nowrap"
              >
                {copied ? 'Copied' : 'Copy'}
              </button>
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl flex-shrink-0"
                title="Open Verification Page"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-xs transition active:scale-98"
          >
            <Printer className="w-4 h-4" />
            <span>Print {tagCopies} Sticker{tagCopies > 1 ? 's' : ''} on {printLayout === 'A4_GRID' ? 'A4' : 'Roll'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
