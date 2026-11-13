'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import { useClubStore } from '@/lib/club-store';
import { useAdminAuth } from '@/context/AdminAuthContext';
import {
  Receipt,
  CreditCard,
  QrCode,
  Copy,
  Check,
  Calculator,
  Users,
  Coins,
  ArrowRight,
  Calendar,
  Lock,
  KeyRound,
} from 'lucide-react';

export default function CostSplitterPage() {
  const { isAdmin, openPasswordModal } = useAdminAuth();
  const { matches } = useClubStore();
  const [selectedMatchId, setSelectedMatchId] = useState<string>('');

  const [pitchFee, setPitchFee] = useState<number>(700000);
  const [waterFee, setWaterFee] = useState<number>(140000);
  const [otherFee, setOtherFee] = useState<number>(0);
  const [playerCount, setPlayerCount] = useState<number>(14);

  const [bankName, setBankName] = useState('MB Bank');
  const [bankAccount, setBankAccount] = useState('0987654321');
  const [accountHolder, setAccountHolder] = useState('NGUYEN VAN A');
  const [copied, setCopied] = useState(false);

  const handleSelectMatch = (mId: string) => {
    setSelectedMatchId(mId);
    const m = matches.find((item) => item.id === mId);
    if (m) {
      const activeCount = m.players.filter((p) => p.status === 'IN').length || m.targetPlayers || 14;
      setPlayerCount(activeCount);
      if (m.cost) {
        if (m.cost.pitchFee) setPitchFee(m.cost.pitchFee);
        if (m.cost.waterFee) setWaterFee(m.cost.waterFee);
        if (m.cost.otherFee) setOtherFee(m.cost.otherFee);
        if (m.cost.bankName) setBankName(m.cost.bankName);
        if (m.cost.bankAccount) setBankAccount(m.cost.bankAccount);
        if (m.cost.accountHolder) setAccountHolder(m.cost.accountHolder);
      }
    }
  };

  // Calculations
  const totalCost = pitchFee + waterFee + otherFee;
  const costPerPerson =
    playerCount > 0 ? Math.ceil(totalCost / playerCount / 1000) * 1000 : 0; // round up to nearest 1,000 VND

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const vietQrUrl = `https://img.vietqr.io/image/${bankName.replace(/\s+/g, '')}-${bankAccount}-compact2.png?amount=${costPerPerson}&addInfo=Tien%20san%20bong%20da&accountName=${encodeURIComponent(
    accountHolder
  )}`;

  const handleCopyZaloMessage = () => {
    const text = `💵 THÔNG BÁO TIỀN SÂN BÓNG ĐÁ
──────────────────────
• Tiền sân: ${formatVND(pitchFee)}
• Tiền nước & đá: ${formatVND(waterFee)}
${otherFee > 0 ? `• Chi phí khác: ${formatVND(otherFee)}\n` : ''}• Tổng chi phí: ${formatVND(totalCost)} / ${playerCount} người

👉 MỖI ANH EM: ${formatVND(costPerPerson)}
──────────────────────
🏦 Ngân hàng: ${bankName}
💳 Số tài khoản: ${bankAccount}
👤 Chủ TK: ${accountHolder}
💬 Nội dung CK: [Tên của bạn] tien san`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col selection:bg-emerald-500 selection:text-zinc-950">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-8 w-full flex-1 space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <Receipt className="w-4 h-4" />
            <span>FootDraw Match Cost Splitter</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Chia Tiền Sân & Quỹ Trận Đấu</h1>
          <p className="text-xs text-zinc-400">
            Tự động chia đều tiền sân + nước nôi, sinh mã VietQR chuyển khoản nhanh & copy tin nhắn Zalo
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Input Form (7 Cols) */}
          <div className="md:col-span-7 bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-bold text-white text-base">Khoản thu chi trận đấu</h3>
                </div>
                {!isAdmin && (
                  <button
                    type="button"
                    onClick={openPasswordModal}
                    className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <Lock className="w-3 h-3" />
                    <span>Sửa chi phí</span>
                  </button>
                )}
              </div>

              {!isAdmin && (
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 text-xs text-zinc-400">
                  💡 Bạn đang xem bảng tính tiền sân. Quét mã VietQR bên cạnh để thanh toán nhanh cho Đội trưởng.
                </div>
              )}

              {/* Match auto-fill selector */}
              {matches.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5 uppercase tracking-wide">
                    Liên kết với trận đấu (Tự động điền quân số)
                  </label>
                  <select
                    disabled={!isAdmin}
                    value={selectedMatchId}
                    onChange={(e) => handleSelectMatch(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 disabled:opacity-70"
                  >
                    <option value="">-- Nhập thủ công (Không gắn trận) --</option>
                    {matches.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title} ({m.date} - {m.players.filter((p) => p.status === 'IN').length || m.targetPlayers} người)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Pitch Fee */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5 uppercase tracking-wide">
                  1. Tiền thuê sân bóng (VND)
                </label>
                <input
                  type="number"
                  disabled={!isAdmin}
                  step={10000}
                  value={pitchFee}
                  onChange={(e) => setPitchFee(Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white font-mono font-bold focus:outline-none focus:border-emerald-500 disabled:opacity-70"
                />
              </div>

              {/* Water & Ice Fee */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5 uppercase tracking-wide">
                  2. Tiền nước uống, đá giải khát (VND)
                </label>
                <input
                  type="number"
                  disabled={!isAdmin}
                  step={5000}
                  value={waterFee}
                  onChange={(e) => setWaterFee(Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white font-mono font-bold focus:outline-none focus:border-emerald-500 disabled:opacity-70"
                />
              </div>

              {/* Other Fees */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5 uppercase tracking-wide">
                  3. Chi phí khác (Bóng, áo bib, trọng tài)
                </label>
                <input
                  type="number"
                  disabled={!isAdmin}
                  step={10000}
                  value={otherFee}
                  onChange={(e) => setOtherFee(Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white font-mono font-bold focus:outline-none focus:border-emerald-500 disabled:opacity-70"
                />
              </div>

              {/* Players count */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5 uppercase tracking-wide">
                  4. Số người tham gia chia tiền
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    disabled={!isAdmin}
                    min={1}
                    max={60}
                    value={playerCount}
                    onChange={(e) => setPlayerCount(Number(e.target.value))}
                    className="w-28 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-sm text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-xs text-zinc-400">cầu thủ chia đều</span>
                </div>
              </div>

              {/* Bank Info Section */}
              <div className="pt-4 border-t border-zinc-800 space-y-3">
                <span className="block text-xs font-bold text-zinc-200 uppercase tracking-wide">
                  Thông tin nhận chuyển khoản (Thủ quỹ / Đội trưởng)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">Ngân hàng</label>
                    <input
                      type="text"
                      disabled={!isAdmin}
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="VD: MB Bank, Vietcombank..."
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 disabled:opacity-70"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">Số tài khoản</label>
                    <input
                      type="text"
                      disabled={!isAdmin}
                      value={bankAccount}
                      onChange={(e) => setBankAccount(e.target.value)}
                      placeholder="VD: 0987654321"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500 disabled:opacity-70"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">Chủ tài khoản</label>
                  <input
                    type="text"
                    disabled={!isAdmin}
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value)}
                    placeholder="VD: NGUYEN VAN A"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white uppercase focus:outline-none focus:border-emerald-500 disabled:opacity-70"
                  />
                </div>
              </div>
            </div>

            {/* Results & VietQR Card (5 Cols) */}
            <div className="md:col-span-5 space-y-4">
              <div className="bg-gradient-to-br from-emerald-950/40 via-zinc-900 to-zinc-900 border-2 border-emerald-500/40 rounded-3xl p-6 shadow-2xl space-y-5 text-center">
                <div>
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                    Số tiền mỗi người cần nộp
                  </span>
                  <div className="text-3xl sm:text-4xl font-black text-emerald-400 font-mono mt-1">
                    {formatVND(costPerPerson)}
                  </div>
                  <span className="text-xs text-zinc-400 mt-1 block">
                    Tổng chi phí: <strong className="text-white">{formatVND(totalCost)}</strong> ({playerCount} người)
                  </span>
                </div>

                {/* VietQR Code Display */}
                {bankAccount && bankName && (
                  <div className="bg-white p-3 rounded-2xl inline-block mx-auto shadow-xl">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={vietQrUrl}
                      alt="VietQR Chuyển khoản nhanh"
                      className="w-48 h-48 object-contain rounded-xl"
                    />
                    <p className="text-[10px] text-zinc-600 font-bold mt-1">Quét mã chuyển khoản tức thì</p>
                  </div>
                )}

                {/* Copy Zalo Message Action */}
                <button
                  onClick={handleCopyZaloMessage}
                  className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs shadow-lg transition-all active:scale-95 ${copied
                      ? 'bg-emerald-500 text-zinc-950'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700'
                    }`}
                >
                  {copied ? <Check className="w-4 h-4 stroke-[2.5]" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Đã sao chép tin nhắn Zalo!' : 'Copy Tin Nhắn Zalo Thu Tiền'}</span>
                </button>
              </div>
            </div>
          </div>
      </main>
    </div>
  );
}

