'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingCart,
  Gem,
  Boxes,
  Users,
  BarChart3,
  QrCode,
  Coins,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  Clock,
  Layers,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface AppSidebarProps {
  onOpenScanner?: () => void;
  onOpenRates?: () => void;
  onOpenAddCategory?: () => void;
}

export default function AppSidebar({
  onOpenScanner,
  onOpenRates,
  onOpenAddCategory,
}: AppSidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (pathname === '/login' || pathname.startsWith('/p/')) {
    return null;
  }

  const navItems = [
    { label: 'Overview', href: '/', icon: LayoutDashboard, iconColor: 'text-blue-600' },
    { label: 'POS & Billing', href: '/pos', icon: ShoppingCart, iconColor: 'text-indigo-600' },
    { label: 'Products', href: '/products', icon: Gem, iconColor: 'text-amber-600' },
    { label: 'Inventory', href: '/inventory', icon: Boxes, iconColor: 'text-teal-600' },
    { label: 'Customers', href: '/customers', icon: Users, iconColor: 'text-purple-600' },
    { label: 'Credit & Dues', href: '/customers?tab=dues', icon: Clock, iconColor: 'text-rose-600' },
    { label: 'Reports', href: '/reports', icon: BarChart3, iconColor: 'text-sky-600' },
  ];

  return (
    <aside
      className={`hidden md:flex flex-col bg-white border-r border-slate-200/90 transition-all duration-200 z-30 select-none ${
        isCollapsed ? 'w-[72px]' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-100">
        <Link href="/" className="flex items-center gap-3 overflow-hidden group">
          <div className="w-9 h-9 rounded-xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition overflow-hidden p-0.5">
            <img
              src="/logochanged.jpg"
              alt="Kushal Jewellerys"
              className="w-full h-full object-contain rounded-lg"
            />
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <h1 className="font-bold text-sm text-slate-900 truncate leading-tight tracking-tight">
                Kushal Jewellerys
              </h1>
              <p className="text-[11px] text-slate-500 truncate font-medium">Store POS & Vault</p>
            </div>
          )}
        </Link>

        {!isCollapsed && (
          <button
            onClick={() => setIsCollapsed(true)}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
            title="Collapse Sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Main Navigation */}
      <div className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
        {/* Primary Links */}
        <div className="space-y-1">
          {!isCollapsed && (
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1.5 block">
              Menu
            </span>
          )}

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-50/90 text-blue-700 border border-blue-200/60 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                } ${isCollapsed ? 'justify-center' : ''}`}
                title={isCollapsed ? item.label : undefined}
              >
                <div
                  className={`p-1 rounded-lg ${
                    isActive ? 'bg-blue-600 text-white shadow-xs' : 'bg-transparent text-slate-500'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                </div>
                {!isCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </div>

        {/* Tools / Utilities */}
        <div className="space-y-1 pt-3 border-t border-slate-100">
          {!isCollapsed && (
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1.5 block">
              Tools & Rates
            </span>
          )}

          {onOpenScanner && (
            <button
              onClick={onOpenScanner}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition text-left group ${
                isCollapsed ? 'justify-center' : ''
              }`}
              title="Camera QR / Barcode Scanner"
            >
              <div className="p-1 rounded-lg bg-slate-100 group-hover:bg-blue-50 text-slate-600 group-hover:text-blue-600 transition">
                <QrCode className="w-4 h-4 flex-shrink-0" />
              </div>
              {!isCollapsed && <span>Scan Barcode</span>}
            </button>
          )}

          {onOpenRates && (
            <button
              onClick={onOpenRates}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition text-left group ${
                isCollapsed ? 'justify-center' : ''
              }`}
              title="Update Silver Rates"
            >
              <div className="p-1 rounded-lg bg-amber-50 text-amber-600 group-hover:bg-amber-100 transition">
                <Coins className="w-4 h-4 flex-shrink-0" />
              </div>
              {!isCollapsed && <span>Metal Rates</span>}
            </button>
          )}

          {onOpenAddCategory && (
            <button
              onClick={onOpenAddCategory}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition text-left group ${
                isCollapsed ? 'justify-center' : ''
              }`}
              title="Add & Manage Categories"
            >
              <div className="p-1 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition">
                <Layers className="w-4 h-4 flex-shrink-0" />
              </div>
              {!isCollapsed && <span>Add Category</span>}
            </button>
          )}
        </div>
      </div>

      {/* Bottom Footer & User Profile */}
      <div className="p-3 border-t border-slate-100 space-y-2 bg-slate-50/70">
        <Link
          href="/settings"
          className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-white transition ${
            pathname === '/settings' ? 'bg-white text-blue-700 font-semibold shadow-xs border border-slate-200/80' : ''
          } ${isCollapsed ? 'justify-center' : ''}`}
          title="Store Settings"
        >
          <Settings className="w-4 h-4 text-slate-500 flex-shrink-0" />
          {!isCollapsed && <span>Store Settings</span>}
        </Link>

        {isCollapsed ? (
          <div className="flex flex-col items-center gap-2 pt-2 border-t border-slate-200/60">
            <button
              onClick={() => setIsCollapsed(false)}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-white"
              title="Expand Sidebar"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={logout}
              className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <div className="text-xs font-bold text-slate-900 truncate flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>{user?.name || 'Store Admin'}</span>
              </div>
              <div className="text-[10px] text-slate-500 truncate font-mono">
                {user?.email || '9333133334'}
              </div>
            </div>

            <button
              onClick={logout}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
