import { Player, Team, TEAM_PRESETS, Position } from '@/types/football';

/**
 * Intelligent Team Balancing Algorithm for Amateur Football
 * 
 * Criteria:
 * 1. Team sizes are balanced (difference in count <= 1).
 * 2. Goalkeepers (GK) are distributed as evenly as possible.
 * 3. Field positions (DEF, MID, FWD) are evenly spread across teams.
 * 4. Total rating difference between any two teams is minimized.
 * 5. Supports randomized re-rolling while preserving fairness.
 */
export function balanceTeams(
  activePlayers: Player[],
  numberOfTeams: 2 | 3 | 4 = 2,
  options: { randomizeTies?: boolean } = { randomizeTies: true }
): Team[] {
  // If no players, return empty teams
  if (activePlayers.length === 0) {
    return createEmptyTeams(numberOfTeams);
  }

  // Clone players to prevent mutating input
  let pool = [...activePlayers];

  // Optional shuffle among players with same position and rating to provide variety on re-roll
  if (options.randomizeTies) {
    pool = pool
      .map((p) => ({ p, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ p }) => p);
  }

  // Separate GKs from outfield players
  const gks = pool.filter((p) => p.position === 'GK').sort((a, b) => b.rating - a.rating);
  const outfield = pool.filter((p) => p.position !== 'GK');

  // Group outfield players by position
  const defs = outfield.filter((p) => p.position === 'DEF').sort((a, b) => b.rating - a.rating);
  const mids = outfield.filter((p) => p.position === 'MID').sort((a, b) => b.rating - a.rating);
  const fwds = outfield.filter((p) => p.position === 'FWD').sort((a, b) => b.rating - a.rating);

  // Initialize team player buckets
  const teamBuckets: Player[][] = Array.from({ length: numberOfTeams }, () => []);

  // Helper to get total rating of a bucket
  const getBucketRating = (bucket: Player[]) => bucket.reduce((acc, p) => acc + p.rating, 0);

  // Helper to find the team with the lowest current rating (and least players on tie)
  const getBestTeamIndex = (buckets: Player[][], position?: Position): number => {
    let minRating = Infinity;
    let minCount = Infinity;
    let bestIdx = 0;

    for (let i = 0; i < buckets.length; i++) {
      const rating = getBucketRating(buckets[i]);
      const count = buckets[i].length;

      // Primary: fewest players if size is too unbalanced
      const minOverallSize = Math.min(...buckets.map((b) => b.length));
      if (count > minOverallSize) {
        continue;
      }

      if (rating < minRating || (rating === minRating && count < minCount)) {
        minRating = rating;
        minCount = count;
        bestIdx = i;
      }
    }
    return bestIdx;
  };

  // 1. Distribute Goalkeepers first (snake / greedy by rating)
  for (const gk of gks) {
    // Find team with fewest GKs, then lowest rating
    let minGk = Infinity;
    let candidateTeams: number[] = [];
    for (let i = 0; i < numberOfTeams; i++) {
      const currentGkCount = teamBuckets[i].filter((p) => p.position === 'GK').length;
      if (currentGkCount < minGk) {
        minGk = currentGkCount;
        candidateTeams = [i];
      } else if (currentGkCount === minGk) {
        candidateTeams.push(i);
      }
    }

    // Among candidate teams with fewest GKs, pick lowest total rating
    let bestTeam = candidateTeams[0];
    let lowestRating = Infinity;
    for (const tIdx of candidateTeams) {
      const r = getBucketRating(teamBuckets[tIdx]);
      if (r < lowestRating) {
        lowestRating = r;
        bestTeam = tIdx;
      }
    }
    teamBuckets[bestTeam].push(gk);
  }

  // 2. Distribute outfield positions in layered passes (DEF -> MID -> FWD)
  // For each position, sort descending and snake-draft into team with lowest rating
  const positionGroups = [defs, mids, fwds];
  for (const group of positionGroups) {
    for (const player of group) {
      const targetTeam = getBestTeamIndex(teamBuckets, player.position);
      teamBuckets[targetTeam].push(player);
    }
  }

  // 3. Local Search Optimization (Swap refinement)
  // Look for 2 players of the same position in different teams whose swap decreases total rating variance
  let improved = true;
  let iterations = 0;
  const maxIterations = 50;

  const calculateVariance = (buckets: Player[][]) => {
    const ratings = buckets.map(getBucketRating);
    const mean = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    return ratings.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0);
  };

  while (improved && iterations < maxIterations) {
    improved = false;
    iterations++;
    let currentVariance = calculateVariance(teamBuckets);

    for (let t1 = 0; t1 < numberOfTeams; t1++) {
      for (let t2 = t1 + 1; t2 < numberOfTeams; t2++) {
        const team1 = teamBuckets[t1];
        const team2 = teamBuckets[t2];

        for (let p1Idx = 0; p1Idx < team1.length; p1Idx++) {
          for (let p2Idx = 0; p2Idx < team2.length; p2Idx++) {
            const p1 = team1[p1Idx];
            const p2 = team2[p2Idx];

            // Only swap players of matching position (or outfield to outfield if equalizing)
            const samePos = p1.position === p2.position;
            const bothOutfield = p1.position !== 'GK' && p2.position !== 'GK';

            if (!samePos && !bothOutfield) continue;

            // Tentative swap
            team1[p1Idx] = p2;
            team2[p2Idx] = p1;

            const newVariance = calculateVariance(teamBuckets);

            if (newVariance + 0.001 < currentVariance) {
              currentVariance = newVariance;
              improved = true;
              break;
            } else {
              // Revert
              team1[p1Idx] = p1;
              team2[p2Idx] = p2;
            }
          }
          if (improved) break;
        }
        if (improved) break;
      }
      if (improved) break;
    }
  }

  // 4. Construct final Team objects with comprehensive stats
  return teamBuckets.map((players, idx) => {
    const preset = TEAM_PRESETS[idx % TEAM_PRESETS.length];
    const totalRating = getBucketRating(players);
    const avgRating = players.length > 0 ? Number((totalRating / players.length).toFixed(1)) : 0;

    // Sort players inside team by standard formation: GK -> DEF -> MID -> FWD, then rating desc
    const positionOrder: Record<Position, number> = { GK: 1, DEF: 2, MID: 3, FWD: 4 };
    const sortedPlayers = [...players].sort((a, b) => {
      if (positionOrder[a.position] !== positionOrder[b.position]) {
        return positionOrder[a.position] - positionOrder[b.position];
      }
      return b.rating - a.rating;
    });

    return {
      id: idx + 1,
      name: preset.name,
      colorName: preset.colorName,
      bgGradient: preset.bgGradient,
      badgeBg: preset.badgeBg,
      textColor: preset.textColor,
      players: sortedPlayers,
      totalRating,
      avgRating,
      gkCount: players.filter((p) => p.position === 'GK').length,
      defCount: players.filter((p) => p.position === 'DEF').length,
      midCount: players.filter((p) => p.position === 'MID').length,
      fwdCount: players.filter((p) => p.position === 'FWD').length,
    };
  });
}

function createEmptyTeams(numberOfTeams: number): Team[] {
  return Array.from({ length: numberOfTeams }, (_, idx) => {
    const preset = TEAM_PRESETS[idx % TEAM_PRESETS.length];
    return {
      id: idx + 1,
      name: preset.name,
      colorName: preset.colorName,
      bgGradient: preset.bgGradient,
      badgeBg: preset.badgeBg,
      textColor: preset.textColor,
      players: [],
      totalRating: 0,
      avgRating: 0,
      gkCount: 0,
      defCount: 0,
      midCount: 0,
      fwdCount: 0,
    };
  });
}

/**
 * Manually swap two players between teams
 */
export function swapPlayersBetweenTeams(
  teams: Team[],
  player1Id: string,
  player2Id: string
): Team[] {
  let p1: Player | null = null;
  let t1Idx = -1;
  let p2: Player | null = null;
  let t2Idx = -1;

  teams.forEach((t, tIdx) => {
    t.players.forEach((p) => {
      if (p.id === player1Id) {
        p1 = p;
        t1Idx = tIdx;
      }
      if (p.id === player2Id) {
        p2 = p;
        t2Idx = tIdx;
      }
    });
  });

  if (!p1 || !p2 || t1Idx === -1 || t2Idx === -1 || t1Idx === t2Idx) {
    return teams;
  }

  const newTeams = teams.map((team, idx) => {
    let newPlayers = [...team.players];
    if (idx === t1Idx) {
      newPlayers = newPlayers.map((p) => (p.id === player1Id ? p2! : p));
    } else if (idx === t2Idx) {
      newPlayers = newPlayers.map((p) => (p.id === player2Id ? p1! : p));
    }

    const totalRating = newPlayers.reduce((sum, p) => sum + p.rating, 0);
    const avgRating = newPlayers.length > 0 ? Number((totalRating / newPlayers.length).toFixed(1)) : 0;

    return {
      ...team,
      players: newPlayers,
      totalRating,
      avgRating,
      gkCount: newPlayers.filter((p) => p.position === 'GK').length,
      defCount: newPlayers.filter((p) => p.position === 'DEF').length,
      midCount: newPlayers.filter((p) => p.position === 'MID').length,
      fwdCount: newPlayers.filter((p) => p.position === 'FWD').length,
    };
  });

  return newTeams;
}

/**
 * Parse quick text pasted from Zalo / Telegram messages
 * Example formats:
 * 1. Nguyễn Văn A
 * 2. Hoàng Long (GK)
 * 3. Minh Tuấn - Tiền đạo - 4 sao
 * 4. Đức Huy - DEF
 */
export function parseQuickPlayerList(rawText: string): Omit<Player, 'id'>[] {
  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const results: Omit<Player, 'id'>[] = [];

  for (const line of lines) {
    // Remove leading numbering like "1.", "1/", "1-", "1 - ", "[1]", "- "
    const cleaned = line
      .replace(/^(\[\d+\]|\d+\s*[\.\/\-–:\)]\s*|\d+\s+|-\s*|\*\s*)/i, '')
      .trim();
    if (!cleaned) continue;

    let position: Position = 'MID';
    let rating = 7; // default rating (scale 1-10)

    const lower = cleaned.toLowerCase();

    // Position detection
    if (lower.includes('gk') || lower.includes('thủ môn') || lower.includes('goal')) {
      position = 'GK';
    } else if (lower.includes('def') || lower.includes('hậu vệ') || lower.includes('thòng') || lower.includes('cánh')) {
      position = 'DEF';
    } else if (lower.includes('fwd') || lower.includes('tiền đạo') || lower.includes('cắm') || lower.includes('st')) {
      position = 'FWD';
    } else if (lower.includes('mid') || lower.includes('tiền vệ')) {
      position = 'MID';
    }

    // Rating detection (e.g. "8 điểm", "8đ", "4*", "4 sao", "(8)")
    const starMatch = cleaned.match(/(\d+)\s*(sao|\*)/i);
    const scoreMatch = cleaned.match(/(\d+(\.\d+)?)\s*(đ|điểm|pts)/i);
    const parenNumberMatch = cleaned.match(/\((\d+)\)/);

    if (starMatch) {
      // 1-5 star scale mapped to 1-10
      const stars = parseFloat(starMatch[1]);
      rating = Math.min(10, Math.max(1, Math.round(stars * 2)));
    } else if (scoreMatch) {
      rating = Math.min(10, Math.max(1, Math.round(parseFloat(scoreMatch[1]))));
    } else if (parenNumberMatch) {
      rating = Math.min(10, Math.max(1, parseInt(parenNumberMatch[1], 10)));
    }

    // Clean name from tags & metadata
    let name = cleaned
      .replace(/\s*\((gk|def|mid|fwd|thủ môn|hậu vệ|tiền vệ|tiền đạo|st|cánh|thòng).*?\)/gi, '')
      .replace(/\s*[-–|]\s*(gk|def|mid|fwd|thủ môn|hậu vệ|tiền vệ|tiền đạo|st|cánh|thòng)\b.*/gi, '')
      .replace(/\s*\(.*?\d+.*?\)/g, '')
      .replace(/\s*[-–|]\s*\d+\s*(sao|\*|đ|điểm|pts).*$/gi, '')
      .replace(/\s*\d+\s*(sao|\*|đ|điểm|pts).*$/gi, '')
      .trim();

    if (!name) {
      name = cleaned;
    }

    results.push({
      name,
      position,
      rating,
      status: 'IN',
      matchesPlayed: 0,
      goals: 0,
      assists: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      mvpCount: 0,
    });
  }

  return results;
}
