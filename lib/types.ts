export type PurityGrade = '999 Fine' | '925 Sterling' | '800 Utensil' | '916 22K' | '750 18K' | 'Custom';
export type MakingChargeType = 'PER_GRAM' | 'FLAT' | 'PERCENT';
export type PaymentMode = 'CASH' | 'UPI' | 'CARD' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'SPLIT' | 'KHATA' | 'ADVANCE_ADJUST';
export type InvoiceType = 'TAX_INVOICE' | 'NON_GST_BILL' | 'ESTIMATE_QUOTATION';
export type MetalType = 'SILVER' | 'GOLD' | 'DIAMOND' | 'UTENSIL' | 'PLATINUM' | 'BULLION';

export interface Category {
  id: string;
  name: string;
  code?: string | null;
  description?: string | null;
  isDefault?: boolean;
  sortOrder?: number;
  productCount?: number;
  createdAt?: string | Date;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  metalType: MetalType;
  description?: string | null;
  grossWeight: number; // in grams
  stoneWeight: number; // in grams
  netWeight: number;   // in grams
  purity: number;      // e.g. 92.5, 99.9, 80.0
  purityGrade: PurityGrade;
  purchaseRatePerGram: number; // Purchase / Cost price per gram
  sellingPriceFixed?: number;  // Optional fixed price for coins/packaged items
  wastagePercentage: number;   // e.g. 2%, 5% wastage / VA
  makingChargeType: MakingChargeType;
  makingChargeValue: number;
  gstPercentage: number;       // default 3%
  imageUrl?: string | null;
  stockQuantity: number;
  minStockAlert: number;
  qrCodeUrl?: string | null;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt?: string | Date;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  gstin?: string | null;
  pan?: string | null;
  totalSpend: number;
  totalBills: number;
  advanceBalance: number;     // Customer advance money deposited
  outstandingBalance: number; // Credit / Udhar balance due
  promisedDueDate?: string | null; // Promised repayment date
  createdAt: string | Date;
}

export interface KhataTransaction {
  id: string;
  customerId: string;
  date: string | Date;
  type: 'BILL_DEBIT' | 'PAYMENT_CREDIT' | 'ADVANCE_DEPOSIT';
  amount: number;
  paymentMode: string;
  referenceInvoice?: string;
  notes?: string;
}

export interface PurchaseStockIn {
  id: string;
  vendorName: string;
  date: string | Date;
  productSku: string;
  productName: string;
  quantity: number;
  weightGrams: number;
  purity: number;
  purchaseRatePerGram: number;
  totalCost: number;
  invoiceRef?: string;
  notes?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  silverRateApplied: number; // Rate per gram on sale
  wastageAmount: number;     // Wastage / VA charges
  makingCharge: number;      // Total making charge for this row
  stoneCharge: number;
  totalPrice: number;        // (metal + wastage + making) * qty
}

export interface OldSilverExchange {
  grossWeight: number;
  purityPercentage: number;
  meltRatePerGram: number;
  totalValue: number;
  description?: string;
}

export interface InvoiceItemSummary {
  id?: string;
  productId?: string;
  productName: string;
  productSku: string;
  quantity: number;
  grossWeight: number;
  netWeight: number;
  purity: number;
  silverRateApplied: number;
  wastageAmount?: number;
  makingCharge: number;
  stoneCharges?: number;
  totalPrice: number;
  hsnCode?: string;
  qrCodeUrl?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceType: InvoiceType;  // 'TAX_INVOICE' | 'NON_GST_BILL' | 'ESTIMATE_QUOTATION'
  taxType: 'INTRA_STATE' | 'INTER_STATE' | 'NONE'; // CGST+SGST vs IGST vs 0%
  customerId?: string | null;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  customerGstin?: string;
  date: string | Date;
  subtotal: number;
  wastageTotal: number;
  makingCharges: number;
  discount: number;
  oldSilver?: OldSilverExchange;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  cardCharge?: number; // 2.25% credit card surcharge
  grandTotal: number;
  paymentMode: PaymentMode;
  paymentStatus: 'PAID' | 'PARTIAL' | 'DUE';
  paidAmount: number;
  dueAmount?: number; // Outstanding balance due
  dueDate?: string | Date | null; // Promised repayment date
  costOfGoodsSold?: number;  // Total estimated product cost for profit reporting
  profit?: number;            // Net profit earned on this bill
  notes?: string | null;
  items: InvoiceItemSummary[];
  createdAt: string | Date;
}

export interface SilverRates {
  fineRate999: number;       // ₹/g
  sterlingRate925: number;   // ₹/g
  utensilRate800: number;    // ₹/g
  goldRate916?: number;      // ₹/g 22K gold rate
  scrapRateBuyback: number;  // ₹/g
  displayShowcase?: '925' | '999' | '800' | '916' | 'ALL' | string; // Which rate is highlighted in header
  lastUpdated: string | Date;
}

export interface ShopConfig {
  shopName: string;
  legalName?: string;
  tagline: string;
  gstin: string;
  hsnCode: string;
  phone: string;
  email: string;
  address: string;
  city?: string;
  state?: string;
  pincode?: string;
  logoUrl?: string;
  terms: string;
  printerWidth?: '80mm' | '58mm';
}
