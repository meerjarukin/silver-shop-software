'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Search,
  Plus,
  Coins,
  Menu,
  X,
  User,
  LogOut,
  Gem,
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  Users,
  BarChart3,
  Settings,
  QrCode,
} from 'lucide-react';
import { SilverRates } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { parseShowcaseRates } from '@/lib/storage';

interface AppHeaderProps {
  rates?: SilverRates;
  onOpenRates?: () => void;
  onOpenSearch?: () => void;
  onOpenAddProduct?: () => void;
}

const PAGE_TITLES: { [key: string]: { title: string; subtitle?: string } } = {
  '/': { title: 'Overview', subtitle: 'Store performance & key metrics' },
  '/pos': { title: 'POS & Billing', subtitle: 'Fast retail billing counter' },
  '/products': { title: 'Products', subtitle: 'Jewellery catalogue & specs' },
  '/inventory': { title: 'Inventory', subtitle: 'Stock control & purchase logs' },
  '/customers': { title: 'Customers', subtitle: 'CRM & Khata credit ledger' },
  '/reports': { title: 'Reports & Analytics', subtitle: 'Sales, GST filing & profit' },
  '/settings': { title: 'Store Settings', subtitle: 'Shop configuration & print setup' },
};

export default function AppHeader({
  rates = {
    fineRate999: 96.0,
    sterlingRate925: 89.0,
    utensilRate800: 77.0,
    scrapRateBuyback: 81.0,
    lastUpdated: new Date().toISOString(),
  },
  onOpenRates,
  onOpenSearch,
  onOpenAddProduct,
}: AppHeaderProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (pathname === '/login' || pathname.startsWith('/p/')) {
    return null;
  }

  const showcaseKeys = parseShowcaseRates(rates.displayShowcase);

  const currentInfo = PAGE_TITLES[pathname] || {
    title: pathname.replace('/', '').toUpperCase(),
    subtitle: 'Silver Jewelry Store',
  };

  const navLinks = [
    { label: 'Overview', href: '/', icon: LayoutDashboard },
    { label: 'POS & Billing', href: '/pos', icon: ShoppingCart },
    { label: 'Products', href: '/products', icon: Gem },
    { label: 'Inventory', href: '/inventory', icon: Boxes },
    { label: 'Customers', href: '/customers', icon: Users },
    { label: 'Reports', href: '/reports', icon: BarChart3 },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <>
      <header className="h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/90 sticky top-0 z-20 px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Mobile Menu & Page Title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 -ml-1 rounded-xl text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition flex-shrink-0"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="md:hidden w-7 h-7 rounded-lg bg-white border border-slate-200/90 shadow-2xs flex items-center justify-center overflow-hidden p-0.5 flex-shrink-0">
            <img src="/logochanged.jpg" alt="Kushal Jewellerys" className="w-full h-full object-contain rounded-lg" />
          </div>

          <div className="min-w-0">
            <h1 className="text-sm sm:text-lg font-bold text-slate-900 leading-tight truncate">
              {currentInfo.title}
            </h1>
            {currentInfo.subtitle && (
              <p className="text-[11px] text-slate-500 hidden lg:block truncate">
                {currentInfo.subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Center: Global Search Bar (Desktop only) */}
        <div className="flex-1 max-w-md mx-auto hidden md:block">
          <button
            onClick={onOpenSearch}
            className="w-full flex items-center justify-between px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl text-xs text-slate-400 transition hover:border-slate-300 group"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition" />
              <span className="text-slate-500 truncate">Search products, customers, bills...</span>
            </div>
            <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 bg-white border border-slate-200 rounded shadow-2xs font-mono">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right: Metal Rates Pill + Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
          {/* Search Icon on mobile */}
          <button
            onClick={onOpenSearch}
            className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition"
            title="Search"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Metal Rate Compact Pill with Warm Amber & Emerald Glow */}
          <button
            onClick={onOpenRates}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-amber-50/90 hover:bg-amber-100/90 border border-amber-200/90 rounded-xl text-[11px] sm:text-xs text-slate-800 transition group shadow-2xs hover:shadow-xs active:scale-98"
            title="Click to change store metal rates & showcase"
          >
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0"></span>
            
            <div className="flex items-center gap-1 sm:gap-1.5 font-medium whitespace-nowrap overflow-x-auto no-scrollbar">
              {showcaseKeys.map((key, idx) => (
                <React.Fragment key={key}>
                  {key === '925' && (
                    <div className="flex items-center gap-1">
                      <span className="text-amber-800 font-mono text-[10px] sm:text-[11px] font-bold">925:</span>
                      <span className="font-bold text-slate-900 font-mono">₹{rates.sterlingRate925}</span>
                    </div>
                  )}
                  {key === '999' && (
                    <div className="flex items-center gap-1">
                      <span className="text-sky-800 font-mono text-[10px] sm:text-[11px] font-bold">999:</span>
                      <span className="font-bold text-slate-900 font-mono">₹{rates.fineRate999}</span>
                    </div>
                  )}
                  {key === '800' && (
                    <div className="flex items-center gap-1">
                      <span className="text-emerald-800 font-mono text-[10px] sm:text-[11px] font-bold">800:</span>
                      <span className="font-bold text-slate-900 font-mono">₹{rates.utensilRate800}</span>
                    </div>
                  )}
                  {key === '916' && (
                    <div className="flex items-center gap-1">
                      <span className="text-amber-700 font-mono text-[10px] sm:text-[11px] font-bold">22K Gold:</span>
                      <span className="font-bold text-slate-900 font-mono">₹{rates.goldRate916 || 7150}</span>
                    </div>
                  )}
                  {key === 'SCRAP' && (
                    <div className="flex items-center gap-1">
                      <span className="text-rose-800 font-mono text-[10px] sm:text-[11px] font-bold">Scrap:</span>
                      <span className="font-bold text-slate-900 font-mono">₹{rates.scrapRateBuyback}</span>
                    </div>
                  )}
                  {idx < showcaseKeys.length - 1 && <span className="text-amber-300 mx-0.5">|</span>}
                </React.Fragment>
              ))}
            </div>
          </button>

          {/* Quick Action: New Bill Button in Apple Blue */}
          <Link
            href="/pos"
            className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs shadow-blue-500/20 transition active:scale-95 flex-shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Bill</span>
          </Link>
        </div>
      </header>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex">
          <div className="w-72 bg-white h-full p-4 flex flex-col justify-between shadow-2xl animate-fade-in">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-center overflow-hidden p-0.5">
                    <img
                      src="/logochanged.jpg"
                      alt="Kushal Jewellerys"
                      className="w-full h-full object-contain rounded-lg"
                    />
                  </div>
                  <div>
                    <span className="font-bold text-sm text-slate-900 block leading-tight">Kushal Jewellerys</span>
                    <span className="text-[10px] text-slate-500 font-medium">Store POS & Vault</span>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-1">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200/60'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-500'}`} />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-2">
              <div className="px-3 py-1">
                <div className="text-xs font-bold text-slate-900 truncate">{user?.name || 'Store Admin'}</div>
                <div className="text-[10px] text-slate-500 font-mono truncate">{user?.email || '9333133334'}</div>
              </div>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}
    </>
  );
}
