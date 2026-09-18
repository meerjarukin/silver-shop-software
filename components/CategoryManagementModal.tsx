'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Edit2,
  Trash2,
  Tag,
  CheckCircle2,
  AlertCircle,
  Search,
  Layers,
  ArrowRight,
  Sparkles,
  Boxes,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronUp,
  ChevronDown,
  GripVertical,
  RotateCcw,
  Loader2,
} from 'lucide-react';
import { Category } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';

interface CategoryManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoriesUpdated?: (categories: Category[]) => void;
}

export default function CategoryManagementModal({
  isOpen,
  onClose,
  onCategoriesUpdated,
}: CategoryManagementModalProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN' || user?.email === 'admin@gmail.com' || user?.email === '9333133334';

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Form State for Add / Edit
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [oldName, setOldName] = useState<string>('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');

  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete confirmation
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/categories');
      const data = await res.json();
      if (Array.isArray(data)) {
        setCategories(data);
        if (onCategoriesUpdated) onCategoriesUpdated(data);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('categoriesUpdated', { detail: data }));
        }
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      resetForm();
      setCategoryToDelete(null);
      setDeleteError(null);
      setSortField('custom');
      setSortDirection('asc');
    }
  }, [isOpen]);

  const resetForm = () => {
    setIsEditing(false);
    setEditId(null);
    setOldName('');
    setName('');
    setCode('');
    setDescription('');
    setFormError(null);
  };

  const handleStartEdit = (cat: Category) => {
    setIsEditing(true);
    setEditId(cat.id);
    setOldName(cat.name);
    setName(cat.name);
    setCode(cat.code || cat.name.slice(0, 3).toUpperCase());
    setDescription(cat.description || '');
    setFormError(null);
    setFormSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Category name is required');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      if (isEditing && editId) {
        // Update Category
        const res = await fetch('/api/categories', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editId,
            oldName,
            name: name.trim(),
            code: code.trim().toUpperCase(),
            description: description.trim() || undefined,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to update category');
        }

        setFormSuccess(`Category "${name}" updated successfully!`);
        resetForm();
        fetchCategories();
      } else {
        // Add Category
        const res = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            code: (code.trim() || name.trim().slice(0, 3)).toUpperCase(),
            description: description.trim() || undefined,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to create category');
        }

        setFormSuccess(`Category "${name}" added successfully!`);
        resetForm();
        fetchCategories();
      }
    } catch (err: any) {
      setFormError(err.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setFormSuccess(null), 3500);
    }
  };

  const handleDelete = async (cat: Category, force: boolean = false) => {
    setDeleteError(null);
    try {
      const res = await fetch(`/api/categories?id=${encodeURIComponent(cat.id)}&name=${encodeURIComponent(cat.name)}&force=${force}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.productCount > 0 && !force) {
          setCategoryToDelete(cat);
          setDeleteError(data.error);
          return;
        }
        throw new Error(data.error || 'Failed to delete category');
      }

      setCategoryToDelete(null);
      setFormSuccess(`Category "${cat.name}" removed.`);
      fetchCategories();
    } catch (err: any) {
      setDeleteError(err.message || 'Error deleting category');
    }
  };

  type SortField = 'custom' | 'name' | 'code' | 'productCount';
  type SortDirection = 'asc' | 'desc';

  const [sortField, setSortField] = useState<SortField>('custom');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [orderSavedToast, setOrderSavedToast] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const handleSortColumn = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortField('custom');
        setSortDirection('asc');
      }
    } else {
      setSortField(field);
      setSortDirection(field === 'productCount' ? 'desc' : 'asc');
    }
  };

  const saveOrderToBackend = async (newOrderedList: Category[]) => {
    setIsSavingOrder(true);
    try {
      const orderedIds = newOrderedList.map((c) => c.id);
      const res = await fetch('/api/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds }),
      });
      if (res.ok) {
        setOrderSavedToast(true);
        setTimeout(() => setOrderSavedToast(false), 2200);
        if (onCategoriesUpdated) onCategoriesUpdated(newOrderedList);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('categoriesUpdated', { detail: newOrderedList }));
        }
      }
    } catch (err) {
      console.error('Failed to save category order:', err);
    } finally {
      setIsSavingOrder(false);
    }
  };

  const handleMove = (catId: string, direction: 'up' | 'down') => {
    const currentIndex = categories.findIndex((c) => c.id === catId);
    if (currentIndex === -1) return;
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    if (sortField !== 'custom') {
      setSortField('custom');
    }

    const updated = [...categories];
    const [moved] = updated.splice(currentIndex, 1);
    updated.splice(targetIndex, 0, moved);

    setCategories(updated);
    saveOrderToBackend(updated);
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedId(id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverId !== id) {
      setDragOverId(id);
    }
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData('text/plain') || draggedId;
    setDraggedId(null);
    setDragOverId(null);

    if (!sourceId || sourceId === targetId) return;

    if (sortField !== 'custom') {
      setSortField('custom');
    }

    const sourceIndex = categories.findIndex((c) => c.id === sourceId);
    const targetIndex = categories.findIndex((c) => c.id === targetId);
    if (sourceIndex === -1 || targetIndex === -1) return;

    const updated = [...categories];
    const [moved] = updated.splice(sourceIndex, 1);
    updated.splice(targetIndex, 0, moved);

    setCategories(updated);
    saveOrderToBackend(updated);
  };

  if (!isOpen) return null;

  const filteredCategories = categories.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.code && c.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const displayedCategories = [...filteredCategories].sort((a, b) => {
    if (sortField === 'custom') return 0;
    if (sortField === 'name') {
      const cmp = a.name.localeCompare(b.name);
      return sortDirection === 'asc' ? cmp : -cmp;
    }
    if (sortField === 'code') {
      const codeA = a.code || a.name.slice(0, 3);
      const codeB = b.code || b.name.slice(0, 3);
      const cmp = codeA.localeCompare(codeB);
      return sortDirection === 'asc' ? cmp : -cmp;
    }
    if (sortField === 'productCount') {
      const countA = a.productCount || 0;
      const countB = b.productCount || 0;
      return sortDirection === 'asc' ? countA - countB : countB - countA;
    }
    return 0;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-3 sm:p-4 animate-fade-in">
      <div className="bg-white border border-slate-200 w-full max-w-3xl rounded-2xl shadow-modal overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs shadow-blue-600/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                  Product Category Management
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                  Admin Control
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Add, edit, and configure jewellery categories and automatic SKU prefixes.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Two Columns on desktop (Form on Left / Top, List on Right / Bottom) */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Form Alert Banners */}
          {formSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{formSuccess}</span>
            </div>
          )}

          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Delete Confirmation Warning */}
          {categoryToDelete && (
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl space-y-2 text-xs">
              <div className="flex items-center gap-2 text-amber-900 font-bold">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>Delete Category &quot;{categoryToDelete.name}&quot;?</span>
              </div>
              <p className="text-amber-800">
                {deleteError ||
                  `This category has ${categoryToDelete.productCount || 0} product(s) linked to it. Deleting it will reassign those products to 'Other'.`}
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setCategoryToDelete(null);
                    setDeleteError(null);
                  }}
                  className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(categoryToDelete, true)}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg shadow-2xs"
                >
                  Force Delete & Reassign
                </button>
              </div>
            </div>
          )}

          {/* Add / Edit Form Card */}
          <div className="bg-slate-50/80 border border-slate-200/90 rounded-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200/60">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                {isEditing ? <Edit2 className="w-3.5 h-3.5 text-blue-600" /> : <Plus className="w-3.5 h-3.5 text-emerald-600" />}
                <span>{isEditing ? `Edit Category: ${oldName}` : 'Add New Category'}</span>
              </h3>

              {isEditing && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs text-slate-500 hover:text-slate-800 font-medium hover:underline"
                >
                  Cancel Editing
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Silver Coins, Nose Pins, Bridal Sets"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (!isEditing && !code) {
                        setCode(e.target.value.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase());
                      }
                    }}
                    className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none transition shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    SKU Code Prefix (3-4 Chars)
                  </label>
                  <input
                    type="text"
                    maxLength={5}
                    placeholder="e.g. ANK, RNG"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-2 text-xs font-mono font-bold text-blue-700 focus:outline-none transition shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Description / Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Daily wear payal, temple collection, hollow chains..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none transition shadow-2xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                {isEditing && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 font-semibold rounded-xl hover:bg-slate-100"
                  >
                    Reset
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold rounded-xl text-xs shadow-xs transition active:scale-98"
                >
                  {isEditing ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>{isEditing ? 'Save Changes' : 'Create Category'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Existing Categories List Table */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center flex-wrap gap-2">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                    <span>Store Categories ({categories.length})</span>
                    {isSavingOrder && (
                      <span className="flex items-center gap-1 text-[11px] font-normal text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                        <Loader2 className="w-3 h-3 animate-spin" /> saving order...
                      </span>
                    )}
                    {orderSavedToast && (
                      <span className="flex items-center gap-1 text-[11px] font-normal text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 animate-fade-in">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> order saved!
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {sortField === 'custom'
                      ? 'Drag ⠿ or use ↑↓ to arrange priority for POS filters & catalogue.'
                      : `Sorted by ${sortField === 'name' ? 'Category Name' : sortField === 'code' ? 'SKU Prefix' : 'Products'} (${sortDirection.toUpperCase()}).`}
                  </p>
                </div>

                {sortField !== 'custom' && (
                  <button
                    type="button"
                    onClick={() => {
                      setSortField('custom');
                      setSortDirection('asc');
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-200 transition active:scale-95 shadow-2xs"
                    title="Reset back to custom priority display"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset to POS Order</span>
                  </button>
                )}
              </div>

              <div className="relative w-full sm:w-56">
                <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none"
                />
              </div>
            </div>

            <div className="border border-slate-200/90 rounded-2xl overflow-hidden bg-white shadow-card">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200/80 text-[11px] select-none">
                    <tr>
                      <th className="py-2.5 px-3 w-16 text-center text-slate-400 font-mono text-[10px]">
                        Order
                      </th>
                      <th className="py-2.5 px-4">
                        <button
                          type="button"
                          onClick={() => handleSortColumn('name')}
                          className={`flex items-center gap-1.5 font-semibold transition group ${
                            sortField === 'name' ? 'text-blue-700 font-bold' : 'hover:text-slate-900'
                          }`}
                          title="Click to sort alphabetically"
                        >
                          <span>Category Name</span>
                          {sortField === 'name' ? (
                            sortDirection === 'asc' ? (
                              <ArrowUp className="w-3.5 h-3.5 text-blue-600" />
                            ) : (
                              <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-slate-400 group-hover:text-slate-600" />
                          )}
                        </button>
                      </th>
                      <th className="py-2.5 px-3">
                        <button
                          type="button"
                          onClick={() => handleSortColumn('code')}
                          className={`flex items-center gap-1.5 font-semibold transition group ${
                            sortField === 'code' ? 'text-blue-700 font-bold' : 'hover:text-slate-900'
                          }`}
                          title="Click to sort by SKU prefix"
                        >
                          <span>SKU Prefix</span>
                          {sortField === 'code' ? (
                            sortDirection === 'asc' ? (
                              <ArrowUp className="w-3.5 h-3.5 text-blue-600" />
                            ) : (
                              <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-slate-400 group-hover:text-slate-600" />
                          )}
                        </button>
                      </th>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleSortColumn('productCount')}
                          className={`inline-flex items-center gap-1.5 font-semibold transition group mx-auto ${
                            sortField === 'productCount' ? 'text-blue-700 font-bold' : 'hover:text-slate-900'
                          }`}
                          title="Click to sort by number of products"
                        >
                          <span>Products</span>
                          {sortField === 'productCount' ? (
                            sortDirection === 'asc' ? (
                              <ArrowUp className="w-3.5 h-3.5 text-blue-600" />
                            ) : (
                              <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-slate-400 group-hover:text-slate-600" />
                          )}
                        </button>
                      </th>
                      <th className="py-2.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayedCategories.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-xs text-slate-400">
                          {isLoading ? 'Loading categories...' : 'No categories match your search.'}
                        </td>
                      </tr>
                    ) : (
                      displayedCategories.map((cat) => {
                        const originalIndex = categories.findIndex((c) => c.id === cat.id);
                        const isFirst = originalIndex === 0;
                        const isLast = originalIndex === categories.length - 1;
                        const isDraggingThis = draggedId === cat.id;
                        const isOverThis = dragOverId === cat.id;
                        const canReorder = !searchQuery.trim();

                        return (
                          <tr
                            key={cat.id}
                            draggable={canReorder}
                            onDragStart={(e) => handleDragStart(e, cat.id)}
                            onDragOver={(e) => handleDragOver(e, cat.id)}
                            onDrop={(e) => handleDrop(e, cat.id)}
                            onDragEnd={() => {
                              setDraggedId(null);
                              setDragOverId(null);
                            }}
                            className={`transition group ${
                              isDraggingThis
                                ? 'opacity-40 bg-blue-50/50 border-2 border-dashed border-blue-400'
                                : isOverThis
                                ? 'border-t-2 border-t-blue-600 bg-blue-50/30'
                                : 'hover:bg-slate-50/70'
                            }`}
                          >
                            {/* Order / Reorder Handle Column */}
                            <td className="py-2.5 px-2 text-center align-middle">
                              <div className="flex items-center justify-center gap-1">
                                <div
                                  className={`p-1 text-slate-300 group-hover:text-slate-500 rounded transition ${
                                    canReorder ? 'cursor-grab active:cursor-grabbing hover:bg-slate-100' : 'cursor-not-allowed opacity-40'
                                  }`}
                                  title={canReorder ? 'Drag to change POS store priority' : 'Clear search to reorder'}
                                >
                                  <GripVertical className="w-4 h-4" />
                                </div>
                                <div className="flex flex-col gap-0.5">
                                  <button
                                    type="button"
                                    onClick={() => handleMove(cat.id, 'up')}
                                    disabled={isFirst || !canReorder}
                                    title="Move Up"
                                    className="text-slate-300 hover:text-blue-600 disabled:opacity-20 disabled:hover:text-slate-300 p-0.5 rounded transition"
                                  >
                                    <ChevronUp className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleMove(cat.id, 'down')}
                                    disabled={isLast || !canReorder}
                                    title="Move Down"
                                    className="text-slate-300 hover:text-blue-600 disabled:opacity-20 disabled:hover:text-slate-300 p-0.5 rounded transition"
                                  >
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </td>

                            {/* Category Name */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                  #{originalIndex + 1}
                                </span>
                                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                                  <span>{cat.name}</span>
                                </div>
                              </div>
                            </td>

                            {/* SKU Prefix */}
                            <td className="py-3 px-3 font-mono font-bold text-blue-700">
                              <span className="bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
                                {cat.code || cat.name.slice(0, 3).toUpperCase()}
                              </span>
                            </td>

                            {/* Description */}
                            <td className="py-3 px-3 text-slate-500 max-w-xs truncate text-[11px]">
                              {cat.description || '—'}
                            </td>

                            {/* Products */}
                            <td className="py-3 px-3 text-center">
                              <span
                                className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                                  (cat.productCount || 0) > 0
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                    : 'bg-slate-100 text-slate-500'
                                }`}
                              >
                                {cat.productCount || 0} pcs
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleStartEdit(cat)}
                                  className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                  title="Edit category"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDelete(cat, false)}
                                  className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                  title="Delete category"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Logged in as Admin ({user?.email || '9333133334'})</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl shadow-2xs transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
