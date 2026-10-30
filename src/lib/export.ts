import { Match, POSITION_LABELS } from '@/types/football';
import { toPng } from 'html-to-image';

/**
 * Format match lineup as a clean, ready-to-paste Zalo / Telegram message
 */
export function formatZaloTextMessage(match: Match): string {
  const lines: string[] = [];

  lines.push(`⚽ KẾT QUẢ CHIA ĐỘI: ${match.title.toUpperCase()}`);
  if (match.time || match.date) {
    lines.push(`⏰ Thời gian: ${match.time ? `${match.time}, ` : ''}${match.date}`);
  }
  if (match.venue) {
    lines.push(`📍 Địa điểm: ${match.venue}`);
  }
  lines.push('──────────────────────');

  match.teams.forEach((team) => {
    const icon = team.colorName.toLowerCase().includes('cam')
      ? '🟧'
      : team.colorName.toLowerCase().includes('xanh')
      ? '🟦'
      : team.colorName.toLowerCase().includes('đỏ')
      ? '🟥'
      : '🟨';

    lines.push(`\n${icon} ${team.name.toUpperCase()} (${team.players.length} cầu thủ • ${team.totalRating}đ):`);

    // Group by position
    const gks = team.players.filter((p) => p.position === 'GK');
    const defs = team.players.filter((p) => p.position === 'DEF');
    const mids = team.players.filter((p) => p.position === 'MID');
    const fwds = team.players.filter((p) => p.position === 'FWD');

    if (gks.length > 0) {
      lines.push(`  🧤 Thủ môn: ${gks.map((p) => `${p.name} (${p.rating}đ)`).join(', ')}`);
    }
    if (defs.length > 0) {
      lines.push(`  🛡️ Hậu vệ: ${defs.map((p) => `${p.name} (${p.rating}đ)`).join(', ')}`);
    }
    if (mids.length > 0) {
      lines.push(`  ⚡ Tiền vệ: ${mids.map((p) => `${p.name} (${p.rating}đ)`).join(', ')}`);
    }
    if (fwds.length > 0) {
      lines.push(`  🎯 Tiền đạo: ${fwds.map((p) => `${p.name} (${p.rating}đ)`).join(', ')}`);
    }
  });

  lines.push('\n──────────────────────');
  lines.push('🔥 Anh em chuẩn bị đúng màu áo và ra sân đúng giờ nhé!');

  return lines.join('\n');
}

/**
 * Export pitch DOM element to PNG image
 */
export async function downloadPitchAsPng(elementId: string, filename: string): Promise<boolean> {
  const node = document.getElementById(elementId);
  if (!node) {
    console.error(`Element #${elementId} not found`);
    return false;
  }

  try {
    const dataUrl = await toPng(node, {
      quality: 0.98,
      pixelRatio: 2, // crisp high resolution for mobile Retina displays
      cacheBust: true,
    });

    const link = document.createElement('a');
    link.download = `${filename || 'footdraw-doi-hinh'}.png`;
    link.href = dataUrl;
    link.click();
    return true;
  } catch (err) {
    console.error('Failed to export image:', err);
    return false;
  }
}

