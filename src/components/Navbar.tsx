'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Trophy,
  Users,
  Calendar,
  Sparkles,
  BarChart3,
  Scale,
  Receipt,
  ClipboardList,
  Plus,
  History,
  Check,
  X,
  Menu,
  Lock,
  Unlock,
} from 'lucide-react';
import { useAdminAuth } from '@/context/AdminAuthContext';

export default function Navbar() {
  const pathname = usePathname();
  const { isAdmin, openPasswordModal, logoutAdmin } = useAdminAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/draw', label: 'Chia đội', icon: Sparkles },
    { href: '/polls', label: 'Điểm danh', icon: ClipboardList },
    { href: '/matches', label: 'Trận đấu', icon: Calendar },
    { href: '/players', label: 'Cầu thủ', icon: Users },
    { href: '/stats', label: 'Thống kê', icon: BarChart3 },
    { href: '/compare', label: 'So sánh', icon: Scale },
    { href: '/cost-splitter', label: 'Chia tiền sân', icon: Receipt },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-lg shadow-emerald-950/50 flex items-center justify-center group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center">
                <span className="text-xl">⚽</span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg text-white tracking-tight">FootDraw</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  VN
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 leading-none">Amateur Football Manager</p>
            </div>
          </Link>

          {/* Desktop Navigation Links (FootDraw 5 Pillars) */}
          <nav className="hidden md:flex items-center gap-1 bg-zinc-900/60 p-1 rounded-xl border border-zinc-800/80">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive =
                link.href === '/'
                  ? pathname === '/' || pathname.startsWith('/match')
                  : pathname.startsWith(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${isActive
                      ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                    }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2">
            {/* Admin / Member Role Switcher */}
            {isAdmin ? (
              <button
                onClick={logoutAdmin}
                title="Bấm để khóa quyền Admin và quay về chế độ Thành viên"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-400 text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>👑 Admin</span>
                <span className="text-[10px] text-amber-400/80 underline ml-0.5 hidden sm:inline">(Khóa)</span>
              </button>
            ) : (
              <button
                onClick={openPasswordModal}
                title="Bấm để nhập mật khẩu đổi sang quyền Quản trị viên"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold transition-all shadow-sm cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-zinc-400" />
                <span>Thành viên</span>
              </button>
            )}

            {/* Create Match Button */}
            <Link
              href="/"
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-md shadow-emerald-500/20 transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">Tạo trận</span>
            </Link>

            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Nav Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-zinc-800 bg-zinc-950 px-4 py-3 space-y-1 animate-in slide-in-from-top-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive =
                link.href === '/'
                  ? pathname === '/' || pathname.startsWith('/match')
                  : pathname.startsWith(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold ${isActive
                      ? 'bg-emerald-500 text-zinc-950'
                      : 'text-zinc-300 hover:bg-zinc-900'
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}

              <div className="pt-2 border-t border-zinc-800 space-y-2">
                {isAdmin ? (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      logoutAdmin();
                    }}
                    className="flex items-center justify-between w-full px-3 py-2 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-400 text-xs font-bold"
                  >
                    <span className="flex items-center gap-2">
                      <Unlock className="w-4 h-4" />
                      <span>👑 Đang là Quản trị viên</span>
                    </span>
                    <span className="text-[11px] underline">Khóa quyền</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      openPasswordModal();
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-semibold"
                  >
                    <Lock className="w-4 h-4 text-zinc-400" />
                    <span>Đổi sang quyền Admin (Nhập pass)</span>
                  </button>
                )}
              </div>
            </div>
        )}
      </header>
    </>
  );
}
