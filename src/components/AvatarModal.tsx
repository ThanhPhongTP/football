'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, Image as ImageIcon, Check, Trash2, Camera, Sparkles } from 'lucide-react';
import { Player, POSITION_LABELS } from '@/types/football';

interface AvatarModalProps {
  isOpen: boolean;
  player: Player | null;
  onClose: () => void;
  onSaveAvatar: (playerId: string, avatarUrl: string | undefined) => void;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1570498839593-e565b3d4f6fc?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
];

function compressImage(file: File, maxWidth = 240, maxHeight = 240): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject('Canvas context error');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function AvatarModal({ isOpen, player, onClose, onSaveAvatar }: AvatarModalProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'presets' | 'url'>('upload');
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(player?.avatar);
  const [customUrl, setCustomUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (player) {
      setAvatarPreview(player.avatar);
      setCustomUrl('');
    }
  }, [player, isOpen]);

  if (!isOpen || !player) return null;

  const posMeta = POSITION_LABELS[player.position];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn tệp hình ảnh (JPEG, PNG, WebP...)');
      return;
    }

    setIsProcessing(true);
    try {
      const compressed = await compressImage(file);
      setAvatarPreview(compressed);
    } catch {
      alert('Không thể xử lý ảnh này. Vui lòng thử ảnh khác.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyUrl = () => {
    if (!customUrl.trim()) return;
    setAvatarPreview(customUrl.trim());
  };

  const handleSave = () => {
    onSaveAvatar(player.id, avatarPreview);
    onClose();
  };

  const handleRemove = () => {
    setAvatarPreview(undefined);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Cập nhật ảnh đại diện</h3>
              <p className="text-[11px] text-zinc-400">Dành cho thành viên tự chọn ảnh của mình</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Avatar Preview Box */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
            <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-zinc-900 border-2 border-emerald-500/40 shrink-0 shadow-lg flex items-center justify-center">
              {avatarPreview ? (
                <img src={avatarPreview} alt={player.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center font-black text-xl text-emerald-400">
                  {player.name
                    .split(' ')
                    .map((w) => w[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase()}
                </div>
              )}
            </div>

            <div className="space-y-1 min-w-0">
              <h4 className="font-extrabold text-white text-base truncate">{player.name}</h4>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${posMeta.badgeClass}`}>
                  {posMeta.label}
                </span>
                <span className="text-zinc-500 text-[11px] font-mono">#{player.position}</span>
              </div>
              {avatarPreview && (
                <button
                  type="button"
                  onClick={handleRemove}
                  className="inline-flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300 pt-1 underline cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Xóa ảnh (dùng chữ cái)</span>
                </button>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 p-1 bg-zinc-950 rounded-xl border border-zinc-800">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`flex-1 py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'upload'
                  ? 'bg-emerald-500 text-zinc-950 shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Tải ảnh lên</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('presets')}
              className={`flex-1 py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'presets'
                  ? 'bg-emerald-500 text-zinc-950 shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ảnh mẫu</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('url')}
              className={`flex-1 py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'url'
                  ? 'bg-emerald-500 text-zinc-950 shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Link ảnh</span>
            </button>
          </div>

          {/* Tab 1: Upload */}
          {activeTab === 'upload' && (
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-zinc-700 hover:border-emerald-500/60 rounded-2xl p-6 text-center bg-zinc-950/60 transition-colors cursor-pointer space-y-2 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 text-emerald-400 group-hover:scale-110 transition-transform mx-auto flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-white text-xs">Bấm để chọn ảnh từ máy hoặc chụp ảnh</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">Hỗ trợ JPG, PNG, WebP (Tự động nén gọn nhẹ)</p>
                </div>
              </div>
              {isProcessing && (
                <p className="text-center text-emerald-400 font-semibold animate-pulse">
                  Đang xử lý và nén ảnh...
                </p>
              )}
            </div>
          )}

          {/* Tab 2: Presets */}
          {activeTab === 'presets' && (
            <div className="space-y-2">
              <label className="text-zinc-400 block font-medium">Bấm chọn ảnh phong cách bóng đá:</label>
              <div className="grid grid-cols-4 gap-2.5">
                {PRESET_AVATARS.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAvatarPreview(url)}
                    className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all cursor-pointer ${
                      avatarPreview === url
                        ? 'border-emerald-400 ring-2 ring-emerald-400/50 scale-105'
                        : 'border-zinc-800 hover:border-zinc-600'
                    }`}
                  >
                    <img src={url} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                    {avatarPreview === url && (
                      <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                        <Check className="w-5 h-5 text-emerald-300 stroke-[3]" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tab 3: URL */}
          {activeTab === 'url' && (
            <div className="space-y-2.5">
              <label className="text-zinc-400 block font-medium">Dán link ảnh đại diện (URL trực tiếp):</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="https://.../anh-cua-ban.jpg"
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={handleApplyUrl}
                  className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs"
                >
                  Xem
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-zinc-800 bg-zinc-950/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>Lưu ảnh đại diện</span>
          </button>
        </div>
      </div>
    </div>
  );
}
