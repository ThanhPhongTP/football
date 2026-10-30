import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FootDraw VN - Chia đội thông minh & Điểm danh bóng đá phủi',
  description: 'Nền tảng chia đội bóng đá phong trào tự động cân bằng, điểm danh realtime, sa bàn chiến thuật & xuất ảnh gửi Zalo.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className="dark h-full antialiased">
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-100 font-sans">{children}</body>
    </html>
  );
}
