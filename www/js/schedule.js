// ============================================================
//  Pure time math — no DOM, no plugins. All schedules are UTC.
// ============================================================

const HOUR_MS = 3600 * 1000;
const DAY_MS  = 24 * HOUR_MS;

// State of a repeating timer at `now`:
//   next        — ms timestamp of the next start (strictly after now)
//   activeUntil — ms timestamp the current run ends, or null when not active
function timerState(timer, now = Date.now()) {
  const anchor = Date.parse(timer.anchorUtc);
  const period = timer.periodHours * HOUR_MS;
  const k      = Math.floor((now - anchor) / period);
  const prev   = anchor + k * period;
  const next   = prev + period;
  const dur    = (timer.durationMin || 0) * 60000;
  return { next, activeUntil: dur && now < prev + dur ? prev + dur : null };
}

// Every start time of `timer` in (from, to]
function occurrences(timer, from, to) {
  const out    = [];
  const period = timer.periodHours * HOUR_MS;
  for (let t = timerState(timer, from).next; t <= to; t += period) out.push(t);
  return out;
}

// ─── Server openings (ported from once-human.script.js) ─────
function nextWeeklyOpen(weekday, hour, minute, now) {
  let daysUntil = (weekday - now.getUTCDay() + 7) % 7;
  const todayTarget = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), hour, minute);
  if (daysUntil === 0 && now.getTime() >= todayTarget) daysUntil = 7;
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysUntil, hour, minute);
}

function nextBiweeklyOpen(weekday, hour, minute, referenceIso, now) {
  const ms7 = 7 * DAY_MS;
  const ref = Date.parse(`${referenceIso}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00Z`);
  let candidate = nextWeeklyOpen(weekday, hour, minute, now);
  if (Math.round((candidate - ref) / ms7) % 2 !== 0) candidate += ms7;
  return candidate;
}

function nextMonthlyOpen(days, hour, minute, now) {
  const candidates = [];
  for (let offset = 0; offset <= 2; offset++) {
    for (const d of days) {
      const c = Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offset, d, hour, minute);
      if (c > now.getTime()) candidates.push(c);
    }
  }
  return candidates.sort((a, b) => a - b)[0] || null;
}

function nextServerOpen(rec, nowMs = Date.now()) {
  if (!rec) return null;
  const now = new Date(nowMs);
  if (rec.type === 'weekly')   return nextWeeklyOpen(rec.weekday, rec.hour, rec.minute, now);
  if (rec.type === 'biweekly') return nextBiweeklyOpen(rec.weekday, rec.hour, rec.minute, rec.reference, now);
  if (rec.type === 'monthly')  return nextMonthlyOpen(rec.days, rec.hour, rec.minute, now);
  return null;
}

// ─── Formatting ─────────────────────────────────────────────
function pad(n) { return String(Math.floor(n)).padStart(2, '0'); }

function formatHMS(ms) {
  if (ms <= 0) return '00:00:00';
  const s = Math.floor(ms / 1000);
  return `${pad(s / 3600)}:${pad((s % 3600) / 60)}:${pad(s % 60)}`;
}

function formatDHM(ms) {
  if (ms <= 0) return '0d 0h 0m';
  const totalMin = Math.floor(ms / 60000);
  return `${Math.floor(totalMin / 1440)}d ${Math.floor((totalMin % 1440) / 60)}h ${totalMin % 60}m`;
}

// Long waits read better as days; short ones as a ticking clock
function formatCountdown(ms) {
  return ms >= DAY_MS ? formatDHM(ms) : formatHMS(ms);
}

function formatAbsolute(ms) {
  return new Date(ms).toLocaleString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

function formatTime(ms) {
  return new Date(ms).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

if (typeof module !== 'undefined') {
  module.exports = { timerState, occurrences, nextServerOpen, formatHMS, formatDHM, formatCountdown };
}
