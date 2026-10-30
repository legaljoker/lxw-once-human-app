// ============================================================
//  Native alerts — Android scheduled notifications via
//  @capacitor/local-notifications. Fires even when the app is closed.
//
//  Android has no "every 4 hours at a UTC time" alarm, so instead we
//  schedule the next run of one-shot notifications for each enabled
//  timer, and top them back up whenever the app is opened or resumed
//  (and the plugin restores them after a phone reboot).
// ============================================================

const SETTINGS_KEY  = 'lxw_alert_settings';
const CHANNEL_ID    = 'lxw-timers';
const SEASON_ID_BASE = 90000;
const MAX_PER_TIMER  = 120;   // Android caps an app at ~500 pending alarms

const Notifier = (() => {
  const cap     = window.Capacitor;
  const native  = !!(cap && cap.isNativePlatform && cap.isNativePlatform());
  const plugin  = native ? (cap.Plugins.LocalNotifications || cap.registerPlugin('LocalNotifications')) : null;

  function loadSettings() {
    let s = {};
    try { s = JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}; } catch (_) {}
    return { timers: {}, seasonEnding: false, leadMin: 5, ...s };
  }

  function saveSettings(s) {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch (_) {}
  }

  async function ensurePermission() {
    if (!native) {
      if (!('Notification' in window)) return false;
      return (await Notification.requestPermission()) === 'granted';
    }
    let { display } = await plugin.checkPermissions();
    if (display !== 'granted') ({ display } = await plugin.requestPermissions());
    return display === 'granted';
  }

  async function hasPermission() {
    if (!native) return 'Notification' in window && Notification.permission === 'granted';
    return (await plugin.checkPermissions()).display === 'granted';
  }

  async function exactAlarmsAllowed() {
    if (!native) return true;
    try { return (await plugin.checkExactNotificationSetting()).exact_alarm === 'granted'; }
    catch (_) { return true; }   // Android < 12 has no such setting
  }

  async function openExactAlarmSettings() {
    if (native) await plugin.changeExactNotificationSetting();
  }

  async function init() {
    if (!native) return;
    await plugin.createChannel({
      id: CHANNEL_ID, name: 'Event timers', description: 'Once Human reset and event alerts',
      importance: 4, visibility: 1, vibration: true,
    });
  }

  function horizonHours(timer) {
    if (timer.periodHours <= 1) return 72;
    if (timer.periodHours <= 6) return 24 * 7;
    return 24 * 28;
  }

  function timerNotifications(timers, settings, now) {
    const lead = settings.leadMin * 60000;
    const out  = [];
    timers.forEach((t, idx) => {
      if (!settings.timers[t.id]) return;
      const starts = occurrences(t, now + lead, now + horizonHours(t) * HOUR_MS).slice(0, MAX_PER_TIMER);
      const verb   = t.kind === 'event' ? 'starts' : 'resets';
      starts.forEach((start, n) => {
        out.push({
          id: (idx + 1) * 1000 + n,
          title: `${t.icon} ${t.label}`,
          body: settings.leadMin
            ? `${verb === 'starts' ? 'Starts' : 'Resets'} in ${settings.leadMin} min (${formatTime(start)})`
            : `${verb === 'starts' ? 'Starting' : 'Resetting'} now`,
          at: start - lead,
          extra: { view: 'timers' },
        });
      });
    });
    return out;
  }

  // "Ending soon" — 24 h before the battle pass / each loot crate ends
  function seasonNotifications(season, settings, now) {
    if (!settings.seasonEnding) return [];
    const items = [];
    if (season.battlepass) items.push({ name: season.battlepass.name || 'Battle Pass', end: season.battlepass.endDate, what: 'Battle Pass' });
    (season.crates || []).forEach(c => items.push({ name: c.name, end: c.endDate, what: 'Loot Crate' }));
    return items
      .map((it, i) => ({
        id: SEASON_ID_BASE + i,
        title: `⏳ ${it.what} ending soon`,
        body: `${it.name} ends ${formatAbsolute(Date.parse(it.end))}`,
        at: Date.parse(it.end) - DAY_MS,
        extra: { view: 'season' },
      }))
      .filter(n => n.at > now);
  }

  let pending = null;
  // Debounced: toggles fire in quick succession, only the last one matters
  function reschedule(timers, season) {
    clearTimeout(pending);
    pending = setTimeout(() => doReschedule(timers, season).catch(err => console.warn('[alerts]', err)), 400);
  }

  async function doReschedule(timers, season) {
    if (!native) return;
    const settings = loadSettings();
    const now      = Date.now();
    const list     = [...timerNotifications(timers, settings, now), ...seasonNotifications(season, settings, now)];

    const { notifications: old } = await plugin.getPending();
    if (old.length) await plugin.cancel({ notifications: old.map(n => ({ id: n.id })) });
    if (!list.length) return;

    const exact = await exactAlarmsAllowed();
    await plugin.schedule({
      notifications: list.map(n => ({
        id: n.id, title: n.title, body: n.body, extra: n.extra,
        channelId: CHANNEL_ID, smallIcon: 'ic_stat_lxw', iconColor: '#34e0c4',
        schedule: { at: new Date(n.at), allowWhileIdle: true },
        // Don't let a background reschedule pop the system settings screen —
        // the Settings view has an explicit button for that instead.
        isExactNotification: exact,
      })),
    });
  }

  async function sendTest() {
    if (!(await ensurePermission())) return false;
    if (!native) { new Notification('LxW test alert', { body: 'Alerts are working.' }); return true; }
    await plugin.schedule({
      notifications: [{
        id: 99999, title: '✅ LxW test alert', body: 'Alerts are working. You’re all set!',
        channelId: CHANNEL_ID, smallIcon: 'ic_stat_lxw', iconColor: '#34e0c4',
        schedule: { at: new Date(Date.now() + 3000), allowWhileIdle: true },
        isExactNotification: false,
      }],
    });
    return true;
  }

  function onTap(handler) {
    if (native) plugin.addListener('localNotificationActionPerformed', a => handler(a.notification.extra || {}));
  }

  return {
    native, init, loadSettings, saveSettings, ensurePermission, hasPermission,
    exactAlarmsAllowed, openExactAlarmSettings, reschedule, sendTest, onTap,
  };
})();
