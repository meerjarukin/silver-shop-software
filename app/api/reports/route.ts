import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || 'daily'; // 'daily' or 'monthly'

  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    // Fetch invoices from DB
    const allInvoices = await prisma.invoice.findMany({
      include: { items: true },
      orderBy: { date: 'desc' },
    });

    const products = await prisma.product.findMany();

    return NextResponse.json(computeAnalytics(allInvoices, products));
  } catch (error) {
    return NextResponse.json(computeAnalytics([], []));
  }
}

function computeAnalytics(invoices: any[], products: any[]) {
  const now = new Date();
  const todayDateStr = now.toISOString().split('T')[0];

  // Daily metrics
  const todayInvoices = invoices.filter((inv) => {
    const invDate = new Date(inv.date || inv.createdAt).toISOString().split('T')[0];
    return invDate === todayDateStr;
  });

  const dailySummary = {
    date: todayDateStr,
    totalInvoices: todayInvoices.length,
    grossRevenue: todayInvoices.reduce((acc, inv) => acc + inv.grandTotal, 0),
    netSilverWeightSold: todayInvoices.reduce((acc, inv) => {
      const itemsWt = inv.items?.reduce((wAcc: number, item: any) => wAcc + (item.netWeight * (item.quantity || 1)), 0) || 0;
      return acc + itemsWt;
    }, 0),
    cashCollected: todayInvoices
      .filter((inv) => inv.paymentMode === 'CASH')
      .reduce((acc, inv) => acc + (inv.paidAmount !== undefined ? inv.paidAmount : inv.grandTotal), 0),
    upiCollected: todayInvoices
      .filter((inv) => inv.paymentMode === 'UPI')
      .reduce((acc, inv) => acc + (inv.paidAmount !== undefined ? inv.paidAmount : inv.grandTotal), 0),
    cardCollected: todayInvoices
      .filter((inv) => inv.paymentMode === 'CARD' || inv.paymentMode === 'CREDIT_CARD' || inv.paymentMode === 'DEBIT_CARD')
      .reduce((acc, inv) => acc + (inv.paidAmount !== undefined ? inv.paidAmount : inv.grandTotal), 0),
    oldSilverWeightReceived: todayInvoices.reduce(
      (acc, inv) => acc + (inv.oldSilverWeight || 0),
      0
    ),
    oldSilverValueCredited: todayInvoices.reduce(
      (acc, inv) => acc + (inv.oldSilverValue || 0),
      0
    ),
    totalGstCollected: todayInvoices.reduce(
      (acc, inv) => acc + (inv.cgst || 0) + (inv.sgst || 0),
      0
    ),
  };

  // Lifetime / Monthly Metrics
  const monthlyRevenue = invoices.reduce((acc, inv) => acc + inv.grandTotal, 0);
  const totalWeightSoldAllTime = invoices.reduce((acc, inv) => {
    const itemsWt = inv.items?.reduce((wAcc: number, item: any) => wAcc + (item.netWeight * (item.quantity || 1)), 0) || 0;
    return acc + itemsWt;
  }, 0);

  // Vault stock valuation
  const totalVaultWeightGrams = products.reduce(
    (acc, p) => acc + p.netWeight * p.stockQuantity,
    0
  );
  const totalVaultPieces = products.reduce((acc, p) => acc + p.stockQuantity, 0);
  const lowStockCount = products.filter((p) => p.stockQuantity <= p.minStockAlert).length;

  // Category breakdown
  const categoryMap: { [cat: string]: number } = {};
  products.forEach((p) => {
    categoryMap[p.category] = (categoryMap[p.category] || 0) + p.stockQuantity;
  });

  return {
    dailySummary,
    monthlyRevenue,
    totalWeightSoldAllTime,
    totalVaultWeightGrams,
    totalVaultPieces,
    lowStockCount,
    categoryMap,
    invoices,
  };
}
