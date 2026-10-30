'use client';

import React, { useState, useEffect } from 'react';
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
  Plus,
  Cloud,
  History,
  Check,
  X,
  Menu,
} from 'lucide-react';
import { getClientFirebaseConfig } from '@/lib/firebase';

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [firebaseConfigText, setFirebaseConfigText] = useState('');
  const [isCloudConfigured, setIsCloudConfigured] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const cfg = getClientFirebaseConfig();
    if (cfg && cfg.apiKey) {
      setIsCloudConfigured(true);
      setFirebaseConfigText(JSON.stringify(cfg, null, 2));
    }
  }, [showConfigModal]);

  const navLinks = [
    { href: '/', label: 'Chia đội', icon: Sparkles },
    { href: '/matches', label: 'Trận đấu', icon: Calendar },
    { href: '/players', label: 'Cầu thủ', icon: Users },
    { href: '/stats', label: 'Thống kê', icon: BarChart3 },
    { href: '/compare', label: 'So sánh', icon: Scale },
    { href: '/cost-splitter', label: 'Chia tiền sân', icon: Receipt },
  ];

  const handleSaveFirebaseConfig = () => {
    try {
      const parsed = JSON.parse(firebaseConfigText);
      if (!parsed.apiKey || !parsed.projectId) {
        alert('Cấu hình thiếu apiKey hoặc projectId. Vui lòng kiểm tra lại object Firebase config.');
        return;
      }
      localStorage.setItem('footdraw_firebase_config', JSON.stringify(parsed));
      setIsCloudConfigured(true);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setShowConfigModal(false);
        window.location.reload();
      }, 1200);
    } catch {
      alert('Định dạng JSON không hợp lệ! Vui lòng copy toàn bộ object { apiKey: "...", projectId: "..." }');
    }
  };

  const handleClearFirebaseConfig = () => {
    if (confirm('Bạn có chắc muốn xóa cấu hình Cloud Firebase đã lưu?')) {
      localStorage.removeItem('footdraw_firebase_config');
      setIsCloudConfigured(false);
      setFirebaseConfigText('');
      window.location.reload();
    }
  };

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
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
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
            {/* Cloud Realtime Status */}
            <button
              onClick={() => setShowConfigModal(true)}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                isCloudConfigured
                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-700/50 hover:bg-emerald-900/50'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
              }`}
              title="Cấu hình Firebase Realtime"
            >
              <Cloud className={`w-3.5 h-3.5 ${isCloudConfigured ? 'text-emerald-400' : 'text-zinc-500'}`} />
              <span>{isCloudConfigured ? 'Cloud: Bật' : 'Cloud DB'}</span>
            </button>

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
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold ${
                    isActive
                      ? 'bg-emerald-500 text-zinc-950'
                      : 'text-zinc-300 hover:bg-zinc-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}

            <div className="pt-2 border-t border-zinc-900 flex items-center justify-between">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowConfigModal(true);
                }}
                className="flex items-center gap-2 text-xs text-zinc-400 py-1"
              >
                <Cloud className="w-3.5 h-3.5 text-emerald-400" />
                <span>Cấu hình Cloud Firebase</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Cloud Firebase Config Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Cloud className="w-5 h-5 text-emerald-400" />
                <h3 className="font-semibold text-white">Kết nối Realtime Cloud (Firebase)</h3>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs text-zinc-300">
              <p className="text-zinc-400 leading-relaxed">
                Để các thành viên trong đội bóng dùng điện thoại cá nhân cùng vào điểm danh online qua Internet, hãy dán cấu hình Firebase Web SDK miễn phí vào đây:
              </p>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Dán Firebase Config JSON:
                </label>
                <textarea
                  value={firebaseConfigText}
                  onChange={(e) => setFirebaseConfigText(e.target.value)}
                  placeholder={`{\n  "apiKey": "AIzaSy...",\n  "projectId": "my-football-app",\n  "authDomain": "my-football-app.firebaseapp.com"\n}`}
                  rows={6}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 font-mono text-xs text-emerald-300 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {saveSuccess && (
                <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-600/50 text-emerald-300 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Đã lưu thành công! Đang tải lại cấu hình...</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                {isCloudConfigured ? (
                  <button
                    type="button"
                    onClick={handleClearFirebaseConfig}
                    className="text-xs text-rose-400 hover:text-rose-300 underline"
                  >
                    Xóa cấu hình Cloud
                  </button>
                ) : <span />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowConfigModal(false)}
                    className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
                  >
                    Đóng
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveFirebaseConfig}
                    className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-md transition-colors"
                  >
                    Lưu & Kích hoạt
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
