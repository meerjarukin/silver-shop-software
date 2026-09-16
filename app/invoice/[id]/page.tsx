'use client';

import React, { useState, useEffect } from 'react';
import { notFound, useRouter } from 'next/navigation';
import PDFInvoiceView from '@/components/PDFInvoiceView';
import { Invoice } from '@/lib/types';
import { initialShopConfig } from '@/lib/storage';

interface PageProps {
  params: {
    id: string;
  };
}

export default function InvoiceViewerPage({ params }: PageProps) {
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [config, setConfig] = useState(initialShopConfig);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.shopName) setConfig(data);
      })
      .catch(() => {});

    fetch(`/api/billing?inv=${encodeURIComponent(params.id)}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setInvoice(data[0]);
        } else {
          setInvoice(null);
        }
      })
      .catch(() => {
        setInvoice(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full mb-2"></div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-xl font-bold mb-2">Invoice Not Found</h1>
        <p className="text-xs text-slate-400 mb-4">
          Could not find invoice #{params.id}.
        </p>
        <button
          onClick={() => router.push('/')}
          className="px-4 py-2 bg-sky-600 rounded-xl text-xs font-semibold"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <PDFInvoiceView
      invoice={invoice}
      config={config}
      onBack={() => router.push('/pos')}
    />
  );
}
