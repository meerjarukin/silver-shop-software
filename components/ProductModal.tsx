'use client';

import React, { useState, useEffect } from 'react';
import { X, UploadCloud, Tag, CheckCircle2, DollarSign, Scale, Percent, Gem, Plus, Settings, Trash2 } from 'lucide-react';
import { Product, MakingChargeType, PurityGrade, MetalType, Category } from '@/lib/types';
import { generateProductQRCode } from '@/lib/qr';
import { useRates } from '@/context/RatesContext';
import CategoryManagementModal from './CategoryManagementModal';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
  initialName?: string;
  onSaveProduct: (productData: Partial<Product>) => void;
  onDeleteProduct?: (product: Product) => void;
}

const DEFAULT_CATEGORIES = [
  'Anklets',
  'Rings',
  'Chains',
  'Bangles & Bracelets',
  'Necklaces',
  'Earrings & Studs',
  'Utensils',
  'Pooja Articles',
  'Idols',
  'Coins & Bars',
  'Giftware',
];

export const generateSkuForProduct = (
  metal: MetalType,
  catName: string,
  grade: PurityGrade,
  cats: Category[]
): string => {
  const metalPrefix = (metal as string) === 'GOLD' ? 'GLD' : (metal as string) === 'PLATINUM' ? 'PLT' : 'SLV';
  const matched = cats.find((c) => c.name.toLowerCase() === (catName || '').toLowerCase());
  const catCode = matched?.code || (catName ? catName.substring(0, 3).toUpperCase() : 'ANK');

  let purityCode = '925';
  if (metal === 'GOLD') {
    if (grade.includes('750') || grade.includes('18K')) purityCode = '750';
    else if (grade.includes('999') || grade.includes('24K')) purityCode = '999';
    else purityCode = '916';
  } else {
    if (grade.startsWith('999')) purityCode = '999';
    else if (grade.startsWith('800')) purityCode = '800';
    else purityCode = '925';
  }

  const randomSuffix = Math.floor(100 + Math.random() * 900);
  return `${metalPrefix}-${catCode}-${purityCode}-${randomSuffix}`;
};

export default function ProductModal({
  isOpen,
  onClose,
  productToEdit,
  initialName = '',
  onSaveProduct,
  onDeleteProduct,
}: ProductModalProps) {
  const { rates } = useRates();

  const [categoriesList, setCategoriesList] = useState<string[]>(DEFAULT_CATEGORIES);
  const [categoriesData, setCategoriesData] = useState<Category[]>([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const [name, setName] = useState('');
  const [category, setCategory] = useState('Anklets');
  const [metalType, setMetalType] = useState<MetalType>('SILVER');
  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');
  const [grossWeight, setGrossWeight] = useState<string | number>('');
  const [stoneWeight, setStoneWeight] = useState<string | number>(0.0);
  const [purity, setPurity] = useState<number>(92.5);
  const [purityGrade, setPurityGrade] = useState<PurityGrade>('925 Sterling');
  const [purchaseRatePerGram, setPurchaseRatePerGram] = useState<number>(72.0);
  const [wastagePercentage, setWastagePercentage] = useState<number>(2.0);
  const [makingChargeType, setMakingChargeType] = useState<MakingChargeType>('PER_GRAM');
  const [makingChargeValue, setMakingChargeValue] = useState<string | number>('');
  const [gstPercentage, setGstPercentage] = useState<number>(3.0);
  const [stockQuantity, setStockQuantity] = useState<number>(5);
  const [minStockAlert, setMinStockAlert] = useState<number>(2);
  const [imageUrl, setImageUrl] = useState('');
  const [previewQr, setPreviewQr] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const loadCategories = () => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setCategoriesData(data);
          setCategoriesList(data.map((c: any) => c.name));
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const netWeight = Math.max(0, (Number(grossWeight) || 0) - (Number(stoneWeight) || 0));

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name);
      setCategory(productToEdit.category || 'Anklets');
      setMetalType(productToEdit.metalType || 'SILVER');
      setSku(productToEdit.sku);
      setDescription(productToEdit.description || '');
      setGrossWeight(productToEdit.grossWeight !== undefined && productToEdit.grossWeight !== null ? productToEdit.grossWeight : '');
      setStoneWeight(productToEdit.stoneWeight !== undefined && productToEdit.stoneWeight !== null ? productToEdit.stoneWeight : 0.0);
      setPurity(productToEdit.purity);
      setPurityGrade(productToEdit.purityGrade);
      setPurchaseRatePerGram(productToEdit.purchaseRatePerGram || (productToEdit.metalType === 'GOLD' ? (rates.goldRate916 || 7150) : 72.0));
      setWastagePercentage(productToEdit.wastagePercentage || 0.0);
      setMakingChargeType(productToEdit.makingChargeType);
      setMakingChargeValue(productToEdit.makingChargeValue !== undefined && productToEdit.makingChargeValue !== null ? productToEdit.makingChargeValue : '');
      setGstPercentage(productToEdit.gstPercentage || 3.0);
      setStockQuantity(productToEdit.stockQuantity);
      setMinStockAlert(productToEdit.minStockAlert);
      setImageUrl(productToEdit.imageUrl || '');
    } else {
      const initialMetal: MetalType = 'SILVER';
      setMetalType(initialMetal);
      const initialCat = 'Anklets';
      setCategory(initialCat);
      const initialGrade: PurityGrade = '925 Sterling';
      setPurityGrade(initialGrade);
      setPurity(92.5);
      setPurchaseRatePerGram(rates.sterlingRate925 || 72.0);
      setSku(generateSkuForProduct(initialMetal, initialCat, initialGrade, categoriesData));
      setName(initialName || '');
      setDescription('');
      setGrossWeight('');
      setStoneWeight(0.0);
      setWastagePercentage(2.0);
      setMakingChargeType('PER_GRAM');
      setMakingChargeValue('');
      setGstPercentage(3.0);
      setStockQuantity(5);
      setMinStockAlert(2);
      setImageUrl('');
    }
  }, [productToEdit, isOpen, initialName]);

  useEffect(() => {
    if (sku) {
      generateProductQRCode(sku).then(setPreviewQr);
    }
  }, [sku]);

  const handleMetalChange = (newMetal: MetalType) => {
    setMetalType(newMetal);
    if (!productToEdit) {
      if (newMetal === 'GOLD') {
        const newGrade: PurityGrade = '916 22K';
        setPurityGrade(newGrade);
        setPurity(91.6);
        setPurchaseRatePerGram(rates.goldRate916 || 7150.0);
        setSku(generateSkuForProduct('GOLD', category, newGrade, categoriesData));
      } else {
        const newGrade: PurityGrade = '925 Sterling';
        setPurityGrade(newGrade);
        setPurity(92.5);
        setPurchaseRatePerGram(rates.sterlingRate925 || 72.0);
        setSku(generateSkuForProduct('SILVER', category, newGrade, categoriesData));
      }
    }
  };

  const handleCategoryChange = (cat: string) => {
    if (cat === '__NEW__') {
      setIsCategoryModalOpen(true);
      return;
    }
    setCategory(cat);
    if (!productToEdit) {
      setSku(generateSkuForProduct(metalType, cat, purityGrade, categoriesData));
    }
  };

  const handlePurityGradeChange = (grade: PurityGrade) => {
    setPurityGrade(grade);
    if (metalType === 'GOLD') {
      if (grade === '999 Fine') {
        setPurity(99.9);
        setPurchaseRatePerGram(Math.round((rates.goldRate916 || 7150.0) * (99.9 / 91.6)));
      } else if (grade === '750 18K') {
        setPurity(75.0);
        setPurchaseRatePerGram(Math.round((rates.goldRate916 || 7150.0) * (75.0 / 91.6)));
      } else {
        setPurity(91.6);
        setPurchaseRatePerGram(rates.goldRate916 || 7150.0);
      }
    } else {
      if (grade === '999 Fine') {
        setPurity(99.9);
        setPurchaseRatePerGram(rates.fineRate999 || 82.0);
      } else if (grade === '800 Utensil') {
        setPurity(80.0);
        setPurchaseRatePerGram(rates.utensilRate800 || 63.0);
      } else {
        setPurity(92.5);
        setPurchaseRatePerGram(rates.sterlingRate925 || 72.0);
      }
    }
    if (!productToEdit) {
      setSku(generateSkuForProduct(metalType, category, grade, categoriesData));
    }
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file: base64 }),
        });
        const data = await res.json();
        if (data.url) setImageUrl(data.url);
        else setImageUrl(base64);
      } catch (err) {
        setImageUrl(base64);
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProduct({
      id: productToEdit ? productToEdit.id : undefined,
      sku: sku.trim().toUpperCase(),
      name: name.trim(),
      category,
      metalType,
      description: description.trim(),
      grossWeight: Number(grossWeight) || 0,
      stoneWeight: Number(stoneWeight) || 0,
      netWeight: Number(netWeight) || 0,
      purity: Number(purity),
      purityGrade,
      purchaseRatePerGram: Number(purchaseRatePerGram),
      wastagePercentage: Number(wastagePercentage),
      makingChargeType,
      makingChargeValue: Number(makingChargeValue) || 0,
      gstPercentage: Number(gstPercentage),
      stockQuantity: Number(stockQuantity),
      minStockAlert: Number(minStockAlert),
      imageUrl: imageUrl.trim() || undefined,
      qrCodeUrl: previewQr,
      isActive: true,
    });
    onClose();
  };

  if (!isOpen) return null;

  const sanitizeNum = (val: string): number => {
    const cleaned = val.replace(/[^0-9.]/g, '').replace(/^0+(?=\d)/, '');
    return cleaned === '' ? 0 : parseFloat(cleaned) || 0;
  };

  const handleNumericKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === '-' || e.key === '+' || e.key === 'e' || e.key === 'E') {
      e.preventDefault();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-3 sm:p-4 animate-fade-in">
      <div className="bg-white border border-slate-200/90 w-full max-w-2xl rounded-2xl p-5 sm:p-6 shadow-modal relative text-slate-900 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-5 pb-3 border-b border-slate-100">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 shadow-2xs">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {productToEdit ? 'Edit Jewellery Product' : 'Add New Jewellery Item'}
            </h2>
            <p className="text-xs text-slate-500">
              Create product with instant SKU, weight breakdowns, and making charges.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Main Category (Metal Selection: Gold vs Silver) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Main Category / Metal Type *
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100/90 rounded-xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => handleMetalChange('SILVER')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition ${
                  metalType === 'SILVER'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${metalType === 'SILVER' ? 'bg-slate-400 ring-2 ring-slate-200' : 'bg-slate-300'}`}></span>
                <span>Silver (SLV)</span>
              </button>
              <button
                type="button"
                onClick={() => handleMetalChange('GOLD')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition ${
                  metalType === 'GOLD'
                    ? 'bg-amber-500 text-white shadow-xs shadow-amber-500/30'
                    : 'text-amber-800 hover:text-amber-900'
                }`}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${metalType === 'GOLD' ? 'bg-amber-200 ring-2 ring-amber-300' : 'bg-amber-400'}`}></span>
                <span>Gold (GLD)</span>
              </button>
            </div>
          </div>

          {/* Row 1: Name & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Item / Product Name *
              </label>
              <input
                type="text"
                required
                placeholder={metalType === 'GOLD' ? 'e.g. Gold Necklace 916' : 'e.g. Bridal Payal 92.5'}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">Category</label>
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                  title="Add, edit or delete categories"
                >
                  <Plus className="w-3 h-3" />
                  <span>Manage / Add Category</span>
                </button>
              </div>
              <select
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-semibold focus:outline-none"
              >
                {categoriesList.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
                <option value="__NEW__" className="text-blue-600 font-bold bg-blue-50">
                  + Add New Category...
                </option>
              </select>
            </div>
          </div>

          {/* Row 2: SKU & Other Metal Type fallback */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">SKU / Code</label>
                <span className="text-[10px] font-mono text-slate-400">
                  Prefix: <strong className={metalType === 'GOLD' ? 'text-amber-600' : 'text-blue-600'}>{metalType === 'GOLD' ? 'GLD' : 'SLV'}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  required
                  value={sku}
                  onChange={(e) => setSku(e.target.value.toUpperCase())}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-slate-900 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    setSku(generateSkuForProduct(metalType, category, purityGrade, categoriesData));
                  }}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold whitespace-nowrap transition"
                >
                  Generate
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Metal Specification</label>
              <select
                value={metalType}
                onChange={(e) => handleMetalChange(e.target.value as MetalType)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-semibold focus:outline-none"
              >
                <option value="SILVER">Silver (Ag) — SLV</option>
                <option value="GOLD">Gold (Au) — GLD</option>
                <option value="PLATINUM">Platinum (Pt) — PLT</option>
                <option value="BULLION">Bullion / Coin</option>
              </select>
            </div>
          </div>

          {/* Row 3: Weight Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 bg-slate-50/80 p-3 sm:p-3.5 rounded-xl border border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Gross Wt (g)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={grossWeight}
                onKeyDown={handleNumericKeyDown}
                onChange={(e) => setGrossWeight(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-bold focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Stone / Beads (g)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={stoneWeight === 0 ? '' : stoneWeight}
                onKeyDown={handleNumericKeyDown}
                onChange={(e) => setStoneWeight(sanitizeNum(e.target.value))}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Net {metalType === 'GOLD' ? 'Gold' : 'Silver'} Wt
              </label>
              <div className="w-full bg-slate-200/70 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 font-mono">
                {netWeight.toFixed(2)} g
              </div>
            </div>
          </div>

          {/* Row 4: Purchase Cost, Wastage & GST */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Purchase Cost (₹/g)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                required
                placeholder="0.0"
                value={purchaseRatePerGram === 0 ? '' : purchaseRatePerGram}
                onKeyDown={handleNumericKeyDown}
                onChange={(e) => setPurchaseRatePerGram(sanitizeNum(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-mono font-semibold focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Wastage / VA (%)</label>
              <input
                type="number"
                step="0.5"
                min="0"
                placeholder="0.0"
                value={wastagePercentage === 0 ? '' : wastagePercentage}
                onKeyDown={handleNumericKeyDown}
                onChange={(e) => setWastagePercentage(sanitizeNum(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-mono font-semibold focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">GST Rate (%)</label>
              <input
                type="number"
                step="0.5"
                min="0"
                placeholder="3.0"
                value={gstPercentage === 0 ? '' : gstPercentage}
                onKeyDown={handleNumericKeyDown}
                onChange={(e) => setGstPercentage(sanitizeNum(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-mono font-semibold focus:outline-none"
              />
            </div>
          </div>

          {/* Row 5: Purity Grade & Making Charges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Purity Standard ({metalType === 'GOLD' ? 'Gold' : 'Silver'})
              </label>
              {metalType === 'GOLD' ? (
                <div className="grid grid-cols-3 gap-1.5">
                  {(['916 22K', '750 18K', '999 Fine'] as PurityGrade[]).map((grade) => (
                    <button
                      key={grade}
                      type="button"
                      onClick={() => handlePurityGradeChange(grade)}
                      className={`py-1.5 px-1 sm:px-2 rounded-xl text-[11px] sm:text-xs font-semibold transition border ${
                        purityGrade === grade
                          ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {grade === '916 22K' ? '916 (22K)' : grade === '750 18K' ? '750 (18K)' : '999 (24K)'}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-1.5">
                  {(['925 Sterling', '999 Fine', '800 Utensil'] as PurityGrade[]).map((grade) => (
                    <button
                      key={grade}
                      type="button"
                      onClick={() => handlePurityGradeChange(grade)}
                      className={`py-1.5 px-1 sm:px-2 rounded-xl text-[11px] sm:text-xs font-semibold transition border ${
                        purityGrade === grade
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {grade.split(' ')[0]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Making Charges</label>
              <div className="flex items-center gap-2">
                <select
                  value={makingChargeType}
                  onChange={(e) => setMakingChargeType(e.target.value as MakingChargeType)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-2 sm:px-2.5 py-1.5 text-xs text-slate-900 font-medium"
                >
                  <option value="PER_GRAM">₹ / g</option>
                  <option value="FLAT">Flat ₹</option>
                  <option value="PERCENT">% Metal</option>
                </select>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  placeholder="0.0"
                  value={makingChargeValue}
                  onKeyDown={handleNumericKeyDown}
                  onChange={(e) => setMakingChargeValue(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-bold font-mono"
                />
              </div>
            </div>
          </div>

          {/* Row 6: In-Stock & Photo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">In-Stock (Pcs) *</label>
                <input
                  type="number"
                  min="0"
                  required
                  placeholder="0"
                  value={stockQuantity === 0 ? '' : stockQuantity}
                  onKeyDown={handleNumericKeyDown}
                  onChange={(e) => setStockQuantity(sanitizeNum(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-bold font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Low Alert At</label>
                <input
                  type="number"
                  min="1"
                  placeholder="1"
                  value={minStockAlert === 0 ? '' : minStockAlert}
                  onKeyDown={handleNumericKeyDown}
                  onChange={(e) => setMinStockAlert(sanitizeNum(e.target.value) || 1)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Product Photo</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Image URL"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900"
                />
                <label className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs cursor-pointer border border-slate-200 text-slate-700 flex items-center gap-1 flex-shrink-0">
                  <UploadCloud className="w-4 h-4" />
                  <input type="file" accept="image/*" onChange={handleImageFileChange} className="hidden" />
                </label>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2.5 pt-3 border-t border-slate-100">
            <div>
              {productToEdit && onDeleteProduct && (
                <button
                  type="button"
                  onClick={() => onDeleteProduct(productToEdit)}
                  className="flex items-center gap-1.5 px-3 py-2 text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 rounded-xl text-xs font-semibold transition active:scale-98"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Product</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs shadow-xs shadow-blue-500/20 transition active:scale-98"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{productToEdit ? 'Save Changes' : 'Create Product'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Admin Category Management Modal */}
      <CategoryManagementModal
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          loadCategories();
        }}
        onCategoriesUpdated={(updated) => {
          setCategoriesData(updated);
          const names = updated.map((u) => u.name);
          setCategoriesList(names);
          if (names.length > 0 && !names.includes(category)) {
            setCategory(names[0]);
          }
        }}
      />
    </div>
  );
}
