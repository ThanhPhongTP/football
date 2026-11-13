'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Lock, Unlock, KeyRound, X, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import confetti from 'canvas-confetti';

interface AdminAuthContextType {
  isAdmin: boolean;
  openPasswordModal: () => void;
  closePasswordModal: () => void;
  logoutAdmin: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

const ADMIN_PASSWORD = 'xsofts';

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  // Always default to false (Member) when opening the web
  const [isAdmin, setIsAdmin] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Check sessionStorage on mount (only for current active tab, clears on new tab/window)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const sessionAdmin = sessionStorage.getItem('footdraw_admin_session') === 'true';
      if (sessionAdmin) {
        setIsAdmin(true);
      }
    }
  }, []);

  const openPasswordModal = () => {
    setPasswordInput('');
    setErrorMessage('');
    setIsSuccess(false);
    setIsModalOpen(true);
  };

  const closePasswordModal = () => {
    setIsModalOpen(false);
    setPasswordInput('');
    setErrorMessage('');
  };

  const handleVerifyPassword = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (passwordInput.trim() === ADMIN_PASSWORD) {
      setIsSuccess(true);
      setErrorMessage('');

      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#10b981', '#3b82f6', '#f59e0b'],
        });
      } catch {
        // ignore
      }

      setTimeout(() => {
        setIsAdmin(true);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('footdraw_admin_session', 'true');
        }
        setIsModalOpen(false);
        setIsSuccess(false);
      }, 500);
    } else {
      setErrorMessage('Mật khẩu không chính xác! Vui lòng thử lại.');
    }
  };

  const logoutAdmin = () => {
    setIsAdmin(false);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('footdraw_admin_session');
    }
  };

  return (
    <AdminAuthContext.Provider
      value={{
        isAdmin,
        openPasswordModal,
        closePasswordModal,
        logoutAdmin,
      }}
    >
      {children}

      {/* Admin Password Verification Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2 text-white">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Xác thực Đội trưởng</h3>
                  <p className="text-[11px] text-zinc-400">Nhập mật khẩu để mở quyền Quản trị</p>
                </div>
              </div>

              <button
                type="button"
                onClick={closePasswordModal}
                className="text-zinc-500 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleVerifyPassword} className="space-y-4">
              <div>
                <label className="block text-xs text-zinc-300 font-semibold mb-1.5">
                  Mật khẩu Quản trị viên:
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordInput}
                    onChange={(e) => {
                      setPasswordInput(e.target.value);
                      if (errorMessage) setErrorMessage('');
                    }}
                    placeholder="Nhập mật khẩu..."
                    autoFocus
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {errorMessage && (
                  <p className="text-xs text-rose-400 mt-2 flex items-center gap-1.5 font-medium animate-in fade-in">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errorMessage}</span>
                  </p>
                )}

                {isSuccess && (
                  <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1.5 font-bold animate-in fade-in">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Mật khẩu chính xác! Đang mở quyền...</span>
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closePasswordModal}
                  className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white text-xs font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={!passwordInput.trim() || isSuccess}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-zinc-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  Xác nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}

