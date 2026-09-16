'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sparkles,
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  Users,
  BarChart3,
  TrendingUp,
  PlusCircle,
  QrCode,
  Store,
  Search,
  LogOut,
  User,
  ShieldCheck,
} from 'lucide-react';
import { SilverRates } from '@/lib/types';
import RateTickerModal from './RateTickerModal';
import GlobalSearchModal from './GlobalSearchModal';
import { useAuth } from '@/context/AuthContext';

interface NavbarProps {
  rates?: SilverRates;
  onUpdateRates?: (rates: SilverRates) => void;
  onOpenAddProduct?: () => void;
  onOpenScanner?: () => void;
}

export default function Navbar({
  rates = {
    fineRate999: 96.0,
    sterlingRate925: 89.0,
    utensilRate800: 77.0,
    scrapRateBuyback: 81.0,
    lastUpdated: new Date().toISOString(),
  },
  onUpdateRates = () => {},
  onOpenAddProduct,
  onOpenScanner,
}: NavbarProps) {
  const pathname = usePathname();
  const { user, logout, isAuthenticated } = useAuth();
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Keyboard shortcut Ctrl+K or / to open global search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navLinks = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/pos', label: 'POS Billing', icon: ShoppingCart, highlight: true },
    { href: '/inventory', label: 'Inventory & Stock', icon: Boxes },
    { href: '/customers', label: 'Customers', icon: Users },
    { href: '/reports', label: 'Sales Reports', icon: BarChart3 },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#080d19]/95 backdrop-blur-xl">
        {/* Top Live Ticker Ribbon */}
        <div className="bg-gradient-to-r from-slate-950 via-[#0b1329] to-slate-950 border-b border-slate-800/60 px-4 py-1.5 text-xs">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
              <span className="flex items-center gap-1.5 font-bold text-slate-300 flex-shrink-0">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-slate-400 text-[11px] uppercase tracking-wider">Live Rates (₹/g):</span>
              </span>

              {/* 999 Fine */}
              <div className="flex items-center gap-1 bg-sky-500/10 text-sky-300 px-2.5 py-0.5 rounded-full border border-sky-500/20 font-medium whitespace-nowrap">
                <span className="text-sky-400 font-bold">999 Fine:</span>
                <span>₹{rates.fineRate999.toFixed(1)}/g</span>
              </div>

              {/* 925 Sterling */}
              <div className="flex items-center gap-1 bg-amber-500/10 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-500/20 font-medium whitespace-nowrap">
                <span className="text-amber-400 font-bold">925 Sterling:</span>
                <span>₹{rates.sterlingRate925.toFixed(1)}/g</span>
              </div>

              {/* 800 Utensil */}
              <div className="flex items-center gap-1 bg-emerald-500/10 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/20 font-medium hidden sm:flex whitespace-nowrap">
                <span className="text-emerald-400 font-bold">800 Silver:</span>
                <span>₹{rates.utensilRate800.toFixed(1)}/g</span>
              </div>

              {/* Old Silver Buyback */}
              <div className="flex items-center gap-1 bg-rose-500/10 text-rose-300 px-2.5 py-0.5 rounded-full border border-rose-500/20 font-medium hidden md:flex whitespace-nowrap">
                <span className="text-rose-400 font-bold">Old Scrap Buyback:</span>
                <span>₹{rates.scrapRateBuyback.toFixed(1)}/g</span>
              </div>
            </div>

            <button
              onClick={() => setIsRateModalOpen(true)}
              className="flex items-center gap-1 text-sky-400 hover:text-sky-300 font-semibold px-2.5 py-0.5 rounded-lg hover:bg-sky-950/60 transition whitespace-nowrap text-[11px]"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Update Today's Rates</span>
            </button>
          </div>
        </div>

        {/* Main Nav Bar */}
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-2xl bg-white border border-slate-700/60 flex items-center justify-center shadow-lg group-hover:scale-105 transition overflow-hidden p-1">
              <img
                src="/logochanged.jpg"
                alt="Kushal Jewellerys"
                className="w-full h-full object-contain rounded-xl"
              />
            </div>
            <div>
              <div className="font-black text-base sm:text-lg tracking-tight text-white flex items-center gap-1.5">
                <span>KUSHAL</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-amber-300 font-serif">
                  JEWELLERYS
                </span>
              </div>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-medium">
                Billing & Inventory
              </p>
            </div>
          </Link>

          {/* Global Search Pill */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="hidden md:flex items-center gap-2.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/70 text-slate-400 hover:text-white px-3.5 py-1.5 rounded-xl text-xs transition max-w-xs flex-1 shadow-inner"
          >
            <Search className="w-3.5 h-3.5 text-sky-400" />
            <span className="flex-1 text-left truncate">Search customers, SKU, bills...</span>
            <kbd className="bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded text-[10px] font-mono border border-slate-700">
              Ctrl+K
            </kbd>
          </button>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-900/80 p-1 rounded-2xl border border-slate-800">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25'
                      : link.highlight
                      ? 'text-sky-400 hover:text-white hover:bg-slate-800'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Action Buttons & Admin Profile */}
          <div className="flex items-center gap-2">
            {/* Mobile Search Button */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="md:hidden p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
              title="Search Customers & Inventory"
            >
              <Search className="w-4 h-4 text-sky-400" />
            </button>

            {onOpenScanner && (
              <button
                onClick={onOpenScanner}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white border border-slate-700 rounded-xl text-xs font-semibold shadow-sm transition"
                title="Scan Barcode / QR Code with Camera"
              >
                <QrCode className="w-4 h-4 text-sky-400" />
                <span className="hidden sm:inline">Scan QR</span>
              </button>
            )}

            {onOpenAddProduct && (
              <button
                onClick={onOpenAddProduct}
                className="flex items-center gap-1.5 px-3 py-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-xl text-xs shadow-md shadow-sky-600/20 transition active:scale-95"
              >
                <PlusCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Add Product</span>
              </button>
            )}

            {/* Admin Profile & Logout */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                <div className="hidden xl:flex flex-col text-right">
                  <span className="text-xs font-bold text-white leading-tight">
                    {user?.name || 'Store Admin'}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono">
                    {user?.email || '9333133334'} ({user?.role || 'ADMIN'})
                  </span>
                </div>

                <button
                  onClick={logout}
                  className="p-2 bg-slate-900 hover:bg-rose-950/70 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-700/50 rounded-xl transition"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl"
              >
                Staff Login
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Nav Bar */}
        <div className="lg:hidden flex items-center justify-around border-t border-slate-800/80 bg-slate-950/90 py-2 px-1 text-xs">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl font-medium transition ${
                  isActive ? 'text-sky-400 font-bold bg-sky-500/10' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-[10px]">{link.label.split(' ')[0]}</span>
              </Link>
            );
          })}
        </div>
      </header>

      {/* Rate Ticker Modal */}
      <RateTickerModal
        isOpen={isRateModalOpen}
        onClose={() => setIsRateModalOpen(false)}
        rates={rates}
        onSaveRates={(updated) => {
          onUpdateRates(updated);
        }}
      />

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </>
  );
}
