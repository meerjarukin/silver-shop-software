import React from 'react';
import { notFound } from 'next/navigation';
import {
  ShieldCheck,
  Scale,
  CheckCircle2,
  AlertTriangle,
  Store,
  Phone,
  MessageCircle,
  Award,
  Tag,
  Info,
  Check,
  MapPin,
  Gem,
} from 'lucide-react';
import { initialShopConfig } from '@/lib/storage';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

interface PageProps {
  params: {
    sku: string;
  };
}

async function getProductBySku(sku: string) {
  const decodedSku = decodeURIComponent(sku).trim();

  try {
    const product = await prisma.product.findUnique({
      where: { sku: decodedSku },
    });
    if (product) return product;
  } catch (err) {}

  return null;
}

async function getShopConfig() {
  try {
    const config = await prisma.shopConfig.findUnique({
      where: { id: 'default' },
    });
    if (config) return config;
  } catch (err) {}
  return initialShopConfig;
}

export async function generateMetadata({ params }: PageProps) {
  const product = await getProductBySku(params.sku);
  if (!product) return { title: 'Product Verification' };
  return {
    title: `${product.name} | Purity & Stock Verification`,
    description: `Verify hallmark authenticity and store stock for SKU ${product.sku}`,
  };
}

export default async function PublicProductVerificationPage({ params }: PageProps) {
  const [product, shopConfig] = await Promise.all([
    getProductBySku(params.sku),
    getShopConfig(),
  ]);

  if (!product) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] text-slate-900 flex flex-col items-center justify-center p-6 text-center">
        <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl border border-rose-200 mb-4 shadow-sm">
          <AlertTriangle className="w-10 h-10" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">Product Not Found</h1>
        <p className="text-xs text-slate-500 max-w-sm mb-6">
          The scanned QR code with SKU <span className="font-mono font-bold text-slate-800">{params.sku}</span> could not be verified in the store catalog.
        </p>
        <Link
          href="/"
          className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs"
        >
          Return to Store Home
        </Link>
      </div>
    );
  }

  const isAvailable = product.stockQuantity > 0;

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 pb-16 selection:bg-slate-900 selection:text-white">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white px-4 py-2.5 text-center text-xs font-semibold flex items-center justify-center gap-2 shadow-xs">
        <ShieldCheck className="w-4 h-4 text-emerald-400" />
        <span>Official Store Authenticity & Live Stock Certificate</span>
      </div>

      <div className="max-w-md mx-auto px-4 pt-6 space-y-4">
        {/* Store Header */}
        <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-card flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center flex-shrink-0">
              <Gem className="w-5 h-5 text-slate-200" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-900">{shopConfig.shopName}</h2>
              <p className="text-[11px] text-slate-500 font-medium">{shopConfig.tagline}</p>
            </div>
          </div>
          <span className="text-[10px] bg-slate-100 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-full font-mono font-bold">
            {product.sku}
          </span>
        </div>

        {/* Product Photo & Stock Badge */}
        <div className="relative rounded-2xl overflow-hidden bg-white border border-slate-200/80 shadow-card">
          <img
            src={
              product.imageUrl ||
              'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&auto=format&fit=crop&q=80'
            }
            alt={product.name}
            className="w-full aspect-[4/3] object-cover"
          />

          <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
            <div className="bg-white/95 backdrop-blur-xs px-3 py-1 rounded-full text-xs font-bold border border-slate-200 shadow-xs text-slate-900">
              {product.purity}% ({product.purityGrade?.split(' ')[0]})
            </div>

            <div>
              {isAvailable ? (
                <div className="bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold border border-emerald-200 shadow-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{product.stockQuantity} In Store</span>
                </div>
              ) : (
                <div className="bg-rose-50 text-rose-700 px-3 py-1 rounded-full text-xs font-bold border border-rose-200 shadow-xs">
                  Out of Stock
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Product Specs Card */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-card space-y-4">
          <div>
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">
              {product.category}
            </span>
            <h1 className="text-lg font-bold text-slate-900 mt-0.5">{product.name}</h1>
            {product.description && (
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                {product.description}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-[11px] text-slate-400 block font-medium">Net Silver Weight</span>
              <span className="text-sm font-bold text-slate-900 font-mono mt-0.5 block">
                {(product.netWeight || 0).toFixed(2)} g
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-[11px] text-slate-400 block font-medium">Gross Weight</span>
              <span className="text-sm font-bold text-slate-700 font-mono mt-0.5 block">
                {(product.grossWeight || 0).toFixed(2)} g
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-[11px] text-slate-400 block font-medium">Hallmark Purity</span>
              <span className="text-xs font-bold text-slate-800 mt-0.5 block">
                {product.purityGrade}
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-[11px] text-slate-400 block font-medium">Live Store Stock</span>
              <span className="text-xs font-bold text-emerald-700 mt-0.5 block">
                {product.stockQuantity} units available
              </span>
            </div>
          </div>

          <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-xl text-xs text-blue-900 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-blue-950">
              <Info className="w-4 h-4 text-blue-600" />
              <span>Exchange / Defect Verification</span>
            </div>
            <p className="text-[11px] text-blue-800 leading-relaxed">
              If bringing this piece for exchange or service, the store counter can scan this QR to verify authenticity and replace from current stock.
            </p>
          </div>
        </div>

        {/* Silver Care */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-card text-xs space-y-2">
          <h3 className="font-bold text-slate-800">Silver Care & Maintenance</h3>
          <ul className="space-y-1.5 text-slate-500 text-[11px]">
            <li className="flex items-start gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>Keep away from perfumes, sprays, and harsh chemicals.</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>Store in an airtight pouch with an anti-tarnish moisture strip.</span>
            </li>
          </ul>
        </div>

        {/* Store Contact */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 text-center space-y-3 shadow-card">
          <div className="text-xs text-slate-600 flex items-center justify-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span>{shopConfig.address}</span>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <a
              href={`tel:${(shopConfig.phone || '').replace(/\s+/g, '')}`}
              className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition"
            >
              <Phone className="w-3.5 h-3.5 text-slate-600" />
              <span>Call Store</span>
            </a>
            <a
              href={`https://api.whatsapp.com/send?phone=91${(shopConfig.phone || '9876543210').replace(/\D/g, '')}&text=Hi, inquiring about ${encodeURIComponent(product.name)} (${encodeURIComponent(product.sku)})`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-xs"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
