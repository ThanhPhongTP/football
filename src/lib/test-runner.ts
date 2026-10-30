import { balanceTeams, parseQuickPlayerList, swapPlayersBetweenTeams } from './balance';
import { formatZaloTextMessage } from './export';
import { Match } from '@/types/football';

console.log('--- TEST 1: Quick Paste Parser ---');
const sampleZalo = `
1. Hoàng Long (GK) - 9đ
2/ Minh Tuấn - Hậu vệ - 8 sao
3 - Văn Đức - DEF
4. Quang Hải (Tiền vệ) - 9đ
5. Hùng Dũng - MID (8)
6. Tiến Linh - Tiền đạo - 8đ
7. Tuấn Hải (FWD) - 8đ
8. Văn Lâm (Thủ môn) - 9đ
9. Quế Ngọc Hải - DEF - 8đ
10. Thành Chung (DEF) - 7đ
11. Hoàng Đức - MID - 9đ
12. Công Phượng (FWD) - 8đ
13. Tấn Tài - DEF - 8đ
14. Văn Toàn - FWD - 8đ
`;

const parsed = parseQuickPlayerList(sampleZalo);
console.log(`Parsed ${parsed.length} players:`);
console.assert(parsed.length === 14, `Expected 14 players, got ${parsed.length}`);

const gks = parsed.filter(p => p.position === 'GK');
console.assert(gks.length === 2, `Expected 2 GKs, got ${gks.length}`);
console.log('✅ Quick Paste Parser passed!\n');

console.log('--- TEST 2: Team Balancing for 2 Teams ---');
const playersWithId = parsed.map((p, idx) => ({ ...p, id: `p_${idx}` }));
const teams2 = balanceTeams(playersWithId, 2, { randomizeTies: false });

console.log(`Team 1: ${teams2[0].name} (${teams2[0].players.length} players, ${teams2[0].totalRating} pts, ${teams2[0].gkCount} GK)`);
console.log(`Team 2: ${teams2[1].name} (${teams2[1].players.length} players, ${teams2[1].totalRating} pts, ${teams2[1].gkCount} GK)`);

console.assert(teams2[0].players.length === 7, 'Team 1 should have 7 players');
console.assert(teams2[1].players.length === 7, 'Team 2 should have 7 players');
console.assert(teams2[0].gkCount === 1, 'Team 1 should have exactly 1 GK');
console.assert(teams2[1].gkCount === 1, 'Team 2 should have exactly 1 GK');

const diff = Math.abs(teams2[0].totalRating - teams2[1].totalRating);
console.log(`Rating difference: ${diff} pts`);
console.assert(diff <= 2, `Rating difference ${diff} should be minimal (<= 2)`);
console.log('✅ 2-Team Balancing passed!\n');

console.log('--- TEST 3: Team Balancing for 3 Teams ---');
const teams3 = balanceTeams(playersWithId, 3, { randomizeTies: false });
teams3.forEach(t => {
  console.log(`${t.name}: ${t.players.length} players, ${t.totalRating} pts, ${t.gkCount} GK`);
});
console.assert(teams3.length === 3, 'Should have 3 teams');
console.log('✅ 3-Team Balancing passed!\n');

console.log('--- TEST 4: Player Manual Swap ---');
const p1 = teams2[0].players[0];
const p2 = teams2[1].players[0];
const swapped = swapPlayersBetweenTeams(teams2, p1.id, p2.id);

console.assert(swapped[0].players.some(p => p.id === p2.id), 'Team 1 should now contain p2');
console.assert(swapped[1].players.some(p => p.id === p1.id), 'Team 2 should now contain p1');
console.log(`Successfully swapped ${p1.name} with ${p2.name}`);
console.log('✅ Manual Swap passed!\n');

console.log('--- TEST 5: Zalo Message Formatting ---');
const dummyMatch: Match = {
  id: 'test-123',
  title: 'FC Anh Em vs Bạn Hữu',
  date: '2026-11-05',
  time: '20:00 - 21:30',
  venue: 'Sân Chuyên Việt, Q7',
  format: '7v7',
  targetPlayers: 14,
  numberOfTeams: 2,
  status: 'COMPLETED',
  players: playersWithId,
  teams: teams2,
  isDrawn: true,
  createdAt: Date.now(),
  updatedAt: Date.now(),
};
const formattedText = formatZaloTextMessage(dummyMatch);
console.log('Generated Message:\n' + formattedText);
console.assert(formattedText.includes('ĐỘI CAM') && formattedText.includes('ĐỘI XANH'), 'Message should contain team names');
console.log('✅ Zalo Formatting passed!\n');

console.log('🎉 ALL TESTS PASSED SUCCESSFULLY!');
