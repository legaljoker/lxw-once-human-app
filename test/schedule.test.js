// Checks the app's timer math against the website's own formulas
// (copied from once-human.script.js) across many random instants.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ctx = { module: { exports: {} } };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../www/js/config.js'), 'utf8') + ';this.DEFAULT_CONFIG = DEFAULT_CONFIG;', ctx);
const { timerState, occurrences, nextServerOpen } = require('../www/js/schedule.js');
const timers = Object.fromEntries(ctx.DEFAULT_CONFIG.timers.map(t => [t.id, t]));

// ── Website reference implementations ──
const site = {
  'loot-reset':     now => Math.floor(now / 14400000) * 14400000 + 14400000,
  'tech-scan-loot': now => Math.floor(now / 21600000) * 21600000 + 21600000,
  'securement':     now => { const d = new Date(now); return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1); },
  'daily-deviation':now => { const d = new Date(now); return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1); },
  'miss-memory':    now => {
    const d = new Date(now);
    const c = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + (1 - d.getUTCDay() + 7) % 7, 4));
    if (c.getTime() <= now) c.setUTCDate(c.getUTCDate() + 7);
    return c.getTime();
  },
  'gravity-event':  now => { const d = new Date(now); const s = d.getUTCMinutes() * 60 + d.getUTCSeconds();
    if (s >= 1350) d.setUTCHours(d.getUTCHours() + 1); d.setUTCMinutes(22, 30, 0); return d.getTime(); },
  'aerial-hunt':    now => { const d = new Date(now); const s = d.getUTCMinutes() * 60 + d.getUTCSeconds();
    if (s >= 2250) d.setUTCHours(d.getUTCHours() + 1); d.setUTCMinutes(37, 30, 0); return d.getTime(); },
};
const activeWindow = { 'gravity-event': [1350, 3150], 'aerial-hunt': [2250, 3450] };

let checks = 0;
for (let i = 0; i < 20000; i++) {
  const now = Date.UTC(2026, 0, 1) + Math.floor(Math.random() * 3 * 365 * 86400) * 1000;
  for (const [id, ref] of Object.entries(site)) {
    assert.strictEqual(timerState(timers[id], now).next, ref(now), `${id} at ${new Date(now).toISOString()}`);
    checks++;
  }
  for (const [id, [a, b]] of Object.entries(activeWindow)) {
    const d = new Date(now); const s = d.getUTCMinutes() * 60 + d.getUTCSeconds();
    assert.strictEqual(!!timerState(timers[id], now).activeUntil, s >= a && s < b, `${id} active at ${d.toISOString()}`);
  }
}

// Exact boundary: at 04:00:00.000 the loot reset just happened → next is 08:00
assert.strictEqual(timerState(timers['loot-reset'], Date.UTC(2026, 9, 30, 4)).next, Date.UTC(2026, 9, 30, 8));
// Miss Memory lands on a Monday
assert.strictEqual(new Date(timerState(timers['miss-memory'], Date.UTC(2026, 9, 30)).next).getUTCDay(), 1);
// Occurrences: 72 hourly gravity events in 72 h
assert.strictEqual(occurrences(timers['gravity-event'], Date.UTC(2026, 9, 30), Date.UTC(2026, 9, 33)).length, 72);

// Servers: Saturday 15:00 UTC weekly; biweekly anchored on 2026-05-30
const sat = nextServerOpen({ type: 'weekly', weekday: 6, hour: 15, minute: 0 }, Date.UTC(2026, 9, 30, 12));
assert.strictEqual(sat, Date.UTC(2026, 9, 31, 15));
const bi = nextServerOpen({ type: 'biweekly', weekday: 6, hour: 15, minute: 0, reference: '2026-05-30' }, Date.UTC(2026, 9, 30, 12));
assert.strictEqual(((bi - Date.UTC(2026, 4, 30, 15)) / (7 * 86400000)) % 2, 0);
assert.strictEqual(nextServerOpen({ type: 'monthly', days: [1], hour: 15, minute: 0 }, Date.UTC(2026, 9, 30)), Date.UTC(2026, 10, 1, 15));

console.log(`schedule tests passed (${checks} random comparisons against the website's formulas)`);
