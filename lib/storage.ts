import { Product, SilverRates, Customer, Invoice, ShopConfig, PurchaseStockIn, KhataTransaction } from './types';

export function parseShowcaseRates(displayShowcase?: string): string[] {
  if (!displayShowcase) return ['925'];
  if (displayShowcase === 'ALL') return ['925', '999'];
  const parts = displayShowcase.split(',').map((s) => s.trim()).filter(Boolean);
  return parts.length > 0 ? parts : ['925'];
}

export const initialRates: SilverRates = {
  fineRate999: 96.0,
  sterlingRate925: 89.0,
  utensilRate800: 77.0,
  goldRate916: 7150.0,
  scrapRateBuyback: 81.0,
  displayShowcase: '925',
  lastUpdated: new Date().toISOString(),
};

export const initialShopConfig: ShopConfig = {
  shopName: 'KUSHAL JEWELLERYS',
  legalName: 'DASS GHNANABAVARI',
  tagline: 'Pure Silver Ornaments, Pooja Articles & Fine Silverware',
  gstin: '37AVEPG9436B1ZP',
  hsnCode: '7113',
  phone: '+91 98765 43210',
  email: 'sales@kushaljewellerys.com',
  address: '#3-550, Ground Floor, Bazar Street, Revenue Ward No 3, Srikalahasti, Tirupati Dist., Andhra Pradesh - 517644',
  city: 'Srikalahasti',
  state: 'Andhra Pradesh',
  pincode: '517644',
  terms: '1. Goods once sold can be exchanged within 3 days against original invoice. 2. Silver rates calculated on date of billing.',
  printerWidth: '80mm',
};

export const initialProducts: Product[] = [];

export const initialCustomers: Customer[] = [];

export const initialInvoices: Invoice[] = [];

export const initialPurchases: PurchaseStockIn[] = [];

