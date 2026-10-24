/**
 * Coach layouts (port of seatmap.js). MUST match backend com.irctc.util.SeatLayout,
 * which validates seat numbers and computes berth types on the server.
 */
export const CLASS_NAMES = {
  SL: 'Sleeper (SL)',
  '3A': 'AC 3 Tier (3A)',
  '2A': 'AC 2 Tier (2A)',
  '1A': 'AC First (1A)',
};

export function coachCode(classCode) {
  return { '1A': 'H1', '2A': 'A1', '3A': 'B1' }[classCode] || 'S1';
}

/**
 * Returns a list of "bays". Each bay is { kind, label?, main: [[seat,...],[seat,...]], side: [seat,...] }
 * where seat = { no, type }. The SeatMap component just renders this structure.
 */
export function buildLayout(classCode) {
  const s = (no, type) => ({ no, type });
  if (classCode === '1A') {
    const structure = ['CABIN', 'CABIN', 'COUPE', 'CABIN', 'CABIN', 'COUPE'];
    let n = 1;
    return structure.map((kind) => {
      if (kind === 'CABIN') {
        const bay = { kind, label: 'CABIN', main: [[s(n, 'LB'), s(n + 1, 'UB')], [s(n + 2, 'LB'), s(n + 3, 'UB')]], side: [] };
        n += 4;
        return bay;
      }
      const bay = { kind, label: 'COUPE', main: [[s(n, 'LB'), s(n + 1, 'UB')]], side: [] };
      n += 2;
      return bay;
    });
  }
  const perBay = classCode === '2A' ? 6 : 8;
  return Array.from({ length: 9 }, (_, i) => {
    const st = i * perBay + 1;
    if (perBay === 6) {
      return { kind: 'BERTH', main: [[s(st, 'LB'), s(st + 1, 'UB')], [s(st + 2, 'LB'), s(st + 3, 'UB')]],
        side: [s(st + 5, 'SU'), s(st + 4, 'SL')] };
    }
    return { kind: 'BERTH',
      main: [[s(st, 'LB'), s(st + 1, 'MB'), s(st + 2, 'UB')], [s(st + 3, 'LB'), s(st + 4, 'MB'), s(st + 5, 'UB')]],
      side: [s(st + 7, 'SU'), s(st + 6, 'SL')] };
  });
}
