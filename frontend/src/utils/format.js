// Replaces JSTL <fmt:formatDate> and <fmt:formatNumber>.
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** "2026-10-04" -> local Date (avoids the UTC off-by-one-day bug of new Date("2026-10-04")). */
export function parseLocalDate(iso) {
  if (!iso) return null;
  const [y, m, d] = String(iso).slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function toIsoDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayIso() {
  return toIsoDate(new Date());
}

const pad = (n) => String(n).padStart(2, '0');

/** dd-MMM-yyyy, e.g. 04-Oct-2026. Accepts "2026-10-04" or "2026-10-04T10:20:00". */
export function fmtDate(value) {
  if (!value) return '-';
  const d = String(value).length > 10 ? new Date(value) : parseLocalDate(value);
  return `${pad(d.getDate())}-${MONTHS[d.getMonth()]}-${d.getFullYear()}`;
}

/** dd MMM yyyy */
export function fmtDateSpaced(value) {
  if (!value) return '-';
  const d = String(value).length > 10 ? new Date(value) : parseLocalDate(value);
  return `${pad(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** EEE, dd MMM yyyy */
export function fmtDateLong(value) {
  const d = parseLocalDate(value);
  if (!d) return '-';
  return `${DAYS[d.getDay()]}, ${pad(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** dd-MMM */
export function fmtDateShort(value) {
  const d = parseLocalDate(value);
  return d ? `${pad(d.getDate())}-${MONTHS[d.getMonth()]}` : '-';
}

/** "10:30:00" -> "10:30" */
export function fmtTime(t) {
  return t ? String(t).slice(0, 5) : '--:--';
}

const inrFmt = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });
export const inr = (n) => inrFmt.format(Number(n || 0));
export const inrPlain = (n, digits = 2) =>
  Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: digits, maximumFractionDigits: digits });
