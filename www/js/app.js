// ============================================================
//  LxW App — shell: navigation, timers, season, servers, tools
// ============================================================

const CONFIG_CACHE_KEY = 'lxw_remote_config';
const SEASON_CACHE_KEY = 'lxw_season';

const cap       = window.Capacitor;
const AppPlugin = Notifier.native ? (cap.Plugins.App || cap.registerPlugin('App')) : null;
const Browser   = Notifier.native ? (cap.Plugins.Browser || cap.registerPlugin('Browser')) : null;

let config = loadCachedConfig();
let season = loadCached(SEASON_CACHE_KEY) || { battlepass: null, crates: [] };
let currentView = 'timers';
let lastNativeView = 'timers';

const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function loadCached(key) {
  try { return JSON.parse(localStorage.getItem(key)); } catch (_) { return null; }
}
function saveCached(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {}
}

// Remote values win over built-in defaults, key by key
function loadCachedConfig() {
  return { ...DEFAULT_CONFIG, ...(loadCached(CONFIG_CACHE_KEY) || {}) };
}

async function fetchJson(url) {
  // Cache-buster so the phone never shows a stale copy after a site update
  const res = await fetch(url + (url.includes('?') ? '&' : '?') + 't=' + Date.now(), {
    signal: AbortSignal.timeout(10000), cache: 'no-store',
  });
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return res.json();
}

function imageUrl(path) {
  if (!path) return '';
  return /^https?:/.test(path) ? path : config.imageBase + path.replace(/^\//, '');
}

// ════════════════════════════════════════════════════════════
//  NAVIGATION
// ════════════════════════════════════════════════════════════
function showView(name) {
  if (name !== 'web') { lastNativeView = name; closeWeb(); }
  currentView = name;
  $$('.view').forEach(v => { v.hidden = v.id !== `view-${name}`; });
  $('#webActions').hidden = name !== 'web';
  // The web view belongs to the Tools tab
  const tab = name === 'web' || name === 'settings' ? (name === 'web' ? 'tools' : null) : name;
  $$('.tab').forEach(t => t.classList.toggle('active', t.dataset.view === tab));
  $$('.drawer-item').forEach(d => d.classList.toggle('active', d.dataset.view === name));
  if (name !== 'web') $('#topTitle').textContent = $(`#view-${name}`).dataset.title;
  closeDrawer();
}

function openDrawer() {
  $('#drawer').classList.add('open');
  $('#drawer').setAttribute('aria-hidden', 'false');
  $('#menuBtn').setAttribute('aria-expanded', 'true');
  $('#scrim').hidden = false;
}
function closeDrawer() {
  $('#drawer').classList.remove('open');
  $('#drawer').setAttribute('aria-hidden', 'true');
  $('#menuBtn').setAttribute('aria-expanded', 'false');
  $('#scrim').hidden = true;
}
const drawerOpen = () => $('#drawer').classList.contains('open');

// ─── Embedded website pages ─────────────────────────────────
// Each tool gets a fresh iframe so its back-history starts clean. `webDepth`
// counts navigations inside it so the Android back button can step back
// through pages before leaving the tool.
let webDepth = 0;
let webGoingBack = false;
let webUrl = '';

function webTarget(key) {
  if (key === 'hub') return { label: 'Once Human Data', url: 'https://lethalxwolf.live/once-human.html' };
  return config.tools.find(t => t.id === key);
}

function openWeb(target) {
  if (!target) return;
  webUrl = target.url;
  webDepth = 0;
  webGoingBack = false;
  $('#topTitle').textContent = target.label;

  const wrap = $('#webFrameWrap');
  wrap.innerHTML = '';
  $('#webOffline').hidden = navigator.onLine !== false;
  $('#webLoading').hidden = false;

  const frame = document.createElement('iframe');
  frame.title = target.label;
  frame.allow = 'clipboard-write; fullscreen';
  frame.addEventListener('load', () => {
    $('#webLoading').hidden = true;
    if (webGoingBack) { webGoingBack = false; webDepth = Math.max(1, webDepth - 1); }
    else webDepth++;
  });
  frame.src = target.url;
  wrap.appendChild(frame);
  // Video-heavy pages fire `load` late; reveal the page while it's still filling in
  setTimeout(() => { $('#webLoading').hidden = true; }, 3500);
  showView('web');
}

function closeWeb() {
  $('#webFrameWrap').innerHTML = '';
  webDepth = 0;
}

function webBack() {
  if (webDepth > 1) { webGoingBack = true; history.back(); return true; }
  return false;
}

async function openExternal(url) {
  if (Browser) await Browser.open({ url });
  else window.open(url, '_blank', 'noopener');
}

function handleBack() {
  if (drawerOpen()) return closeDrawer();
  if (currentView === 'web') { if (!webBack()) showView(lastNativeView === 'web' ? 'tools' : lastNativeView); return; }
  if (currentView !== 'timers') return showView('timers');
  AppPlugin && AppPlugin.minimizeApp();
}

// ════════════════════════════════════════════════════════════
//  TIMERS
// ════════════════════════════════════════════════════════════
function renderTimers() {
  const settings = Notifier.loadSettings();
  const ann = $('#announcement');
  ann.hidden = !config.announcement;
  ann.textContent = config.announcement || '';

  $('#timerGroups').innerHTML = config.timerGroups.map(g => {
    const timers = config.timers.filter(t => t.group === g.id);
    if (!timers.length) return '';
    return `
      <div class="group-head">
        <div>
          <h2 class="section-title">${escapeHtml(g.title)}</h2>
          ${g.subtitle ? `<div class="group-sub">${escapeHtml(g.subtitle)}</div>` : ''}
        </div>
        ${g.guideUrl ? `<button class="group-link" data-url="${escapeHtml(g.guideUrl)}" data-label="${escapeHtml(g.title)}">Guide →</button>` : ''}
      </div>
      ${timers.map(t => `
        <div class="card timer-card">
          <div class="timer-ico">${t.icon}</div>
          <div>
            <div class="timer-label">${escapeHtml(t.label)}</div>
            <div class="timer-value" id="tv-${t.id}">--:--:--</div>
          </div>
          <label class="alert-toggle">ALERT
            <input type="checkbox" class="switch" data-alert="${t.id}" ${settings.timers[t.id] ? 'checked' : ''} aria-label="Alert for ${escapeHtml(t.label)}" />
          </label>
          <div class="timer-next">
            <span id="tn-${t.id}">calculating…</span>
            ${t.linkUrl ? ` · <a href="#" data-url="${escapeHtml(t.linkUrl)}" data-label="${escapeHtml(t.label)}">${escapeHtml(t.linkLabel || 'Open')}</a>` : ''}
          </div>
        </div>`).join('')}`;
  }).join('');

  $$('[data-alert]').forEach(box => box.addEventListener('change', () => onAlertToggle(box)));
  tickTimers();
}

async function onAlertToggle(box) {
  if (box.checked && !(await Notifier.ensurePermission())) {
    box.checked = false;
    $('#permNotice').hidden = false;
    return;
  }
  const s = Notifier.loadSettings();
  s.timers[box.dataset.alert] = box.checked;
  Notifier.saveSettings(s);
  Notifier.reschedule(config.timers, season);
}

function tickTimers() {
  const now = Date.now();
  for (const t of config.timers) {
    const el = $(`#tv-${t.id}`);
    if (!el) continue;
    const { next, activeUntil } = timerState(t, now);
    if (activeUntil) {
      el.textContent = 'ACTIVE ' + formatHMS(activeUntil - now).replace(/^00:/, '');
      el.className = 'timer-value active';
      $(`#tn-${t.id}`).textContent = `Ends ${formatTime(activeUntil)} · next ${formatTime(next)}`;
    } else {
      const rem = next - now;
      el.textContent = formatCountdown(rem);
      el.className = 'timer-value' + (rem < HOUR_MS && t.periodHours > 1 ? ' urgent' : '');
      $(`#tn-${t.id}`).textContent = `${t.kind === 'event' ? 'Next start' : 'Next reset'}: ${formatAbsolute(next)}`;
    }
  }
}

// ════════════════════════════════════════════════════════════
//  BATTLE PASS & LOOT CRATES  (same JSON the website uses)
// ════════════════════════════════════════════════════════════
function seasonCard(item, label, timerId) {
  return `
    <div class="card season-card">
      <img class="season-img" src="${escapeHtml(imageUrl(item.imageUrl))}" alt="${escapeHtml(item.name)}" loading="lazy" onerror="this.style.visibility='hidden'" />
      <div class="season-body">
        <div class="season-label">${label}</div>
        <div class="season-name">${escapeHtml(item.name)}</div>
        <div class="timer-value" id="${timerId}">--d --h --m</div>
        <div class="season-ends">Ends ${formatAbsolute(Date.parse(item.endDate))}</div>
      </div>
    </div>`;
}

function activeCrates() {
  const now = Date.now();
  return (season.crates || [])
    .filter(c => Date.parse(c.endDate) > now)
    .sort((a, b) => Date.parse(b.startDate) - Date.parse(a.startDate));
}

function renderSeason(errored) {
  const bp = season.battlepass;
  $('#battlePass').innerHTML = bp
    ? seasonCard(bp, '🌟 Current Battle Pass', 'tv-bp')
    : `<div class="card loading">${errored ? 'Couldn’t load the battle pass. Check your connection.' : 'No battle pass data yet.'}</div>`;

  const crates = activeCrates();
  $('#lootCrates').innerHTML = crates.length
    ? crates.map((c, i) => seasonCard(c, '🎁 Current Loot Crate', `tv-crate-${i}`)).join('')
    : `<div class="card loading">${errored ? 'Couldn’t load loot crates. Check your connection.' : 'No active loot crates right now.'}</div>`;
  tickSeason();
}

function tickSeason() {
  const now = Date.now();
  const set = (id, end) => { const el = $(`#${id}`); if (el) el.textContent = formatDHM(Date.parse(end) - now); };
  if (season.battlepass) set('tv-bp', season.battlepass.endDate);
  activeCrates().forEach((c, i) => set(`tv-crate-${i}`, c.endDate));
}

async function loadSeason() {
  const [bp, lc] = await Promise.allSettled([fetchJson(config.battlePassUrl), fetchJson(config.lootCratesUrl)]);
  if (bp.status === 'fulfilled') season.battlepass = bp.value.battlepass || null;
  if (lc.status === 'fulfilled') season.crates = lc.value.crates || [];
  const errored = bp.status === 'rejected' && lc.status === 'rejected';
  if (!errored) saveCached(SEASON_CACHE_KEY, season);
  renderSeason(errored && !season.battlepass && !season.crates.length);
  Notifier.reschedule(config.timers, season);
}

// ════════════════════════════════════════════════════════════
//  SERVER OPENINGS
// ════════════════════════════════════════════════════════════
function renderServers() {
  $('#serverNote').textContent = config.serverNote;
  const block = (s, kind, rec) => rec ? `
      <div class="sc-block">
        <div class="sc-label">${kind}${kind === 'Visional' && s.visionalAlt ? ' · NA EU SEA' : ''}</div>
        <div class="sc-value" id="sc-${kind}-${s.id}">--d --h --m</div>
        <div class="sc-date" id="scd-${kind}-${s.id}">--</div>
        ${kind === 'Visional' && s.visionalAlt ? `<div class="sc-alt">${escapeHtml(s.visionalAlt)}</div>` : ''}
      </div>` : `
      <div class="sc-block"><div class="sc-label">${kind}</div><div class="sc-na">Visional only</div></div>`;

  $('#serverGrid').innerHTML = config.servers.map(s => `
    <div class="card server-card">
      <div class="server-name">${escapeHtml(s.name)}</div>
      <div class="server-cols">${block(s, 'Normal', s.normal)}${block(s, 'Visional', s.visional)}</div>
    </div>`).join('');
  tickServers();
}

function tickServers() {
  const now = Date.now();
  for (const s of config.servers) {
    for (const [kind, rec] of [['Normal', s.normal], ['Visional', s.visional]]) {
      const next = nextServerOpen(rec, now);
      const el = $(`#sc-${kind}-${s.id}`);
      if (!el || !next) continue;
      el.textContent = formatDHM(next - now);
      el.classList.toggle('urgent', next - now < HOUR_MS);
      $(`#scd-${kind}-${s.id}`).textContent = formatAbsolute(next);
    }
  }
}

// ════════════════════════════════════════════════════════════
//  TOOLS
// ════════════════════════════════════════════════════════════
function renderTools() {
  $('#toolGrid').innerHTML = config.tools.map(t => `
    <button class="card tool-card" data-web="${t.id}">
      <span class="tool-ico">${t.icon}</span>
      <span class="tool-name">${escapeHtml(t.label)}</span>
      <span class="tool-desc">${escapeHtml(t.desc || '')}</span>
    </button>`).join('');
  $('#drawerTools').innerHTML = config.tools.map(t => `
    <button class="drawer-item" data-web="${t.id}"><span>${t.icon}</span> ${escapeHtml(t.label)}</button>`).join('');
}

// ════════════════════════════════════════════════════════════
//  SETTINGS
// ════════════════════════════════════════════════════════════
function renderSettings() {
  const s = Notifier.loadSettings();
  $$('#leadSeg button').forEach(b => b.classList.toggle('active', Number(b.dataset.lead) === s.leadMin));
  $('#seasonAlert').checked = !!s.seasonEnding;
  refreshPermissionUi();
}

async function refreshPermissionUi() {
  const s = Notifier.loadSettings();
  const anyOn = s.seasonEnding || Object.values(s.timers).some(Boolean);
  if (Notifier.native) {
    $('#permNotice').hidden = !anyOn || await Notifier.hasPermission();
    $('#exactCard').hidden = !anyOn || await Notifier.exactAlarmsAllowed();
  }
}

function bindSettings() {
  $$('#leadSeg button').forEach(b => b.addEventListener('click', () => {
    const s = Notifier.loadSettings();
    s.leadMin = Number(b.dataset.lead);
    Notifier.saveSettings(s);
    renderSettings();
    Notifier.reschedule(config.timers, season);
  }));
  $('#seasonAlert').addEventListener('change', async e => {
    if (e.target.checked && !(await Notifier.ensurePermission())) { e.target.checked = false; return; }
    const s = Notifier.loadSettings();
    s.seasonEnding = e.target.checked;
    Notifier.saveSettings(s);
    Notifier.reschedule(config.timers, season);
  });
  $('#exactFix').addEventListener('click', async () => {
    await Notifier.openExactAlarmSettings();
    refreshPermissionUi();
    Notifier.reschedule(config.timers, season);
  });
  $('#permFix').addEventListener('click', async () => {
    if (await Notifier.ensurePermission()) { $('#permNotice').hidden = true; Notifier.reschedule(config.timers, season); }
  });
  $('#testAlert').addEventListener('click', async () => {
    const ok = await Notifier.sendTest();
    $('#testResult').textContent = ok
      ? 'Test alert on its way. It should appear in a few seconds.'
      : 'Notifications are blocked. Allow them for LxW in your phone’s settings.';
  });
}

// ════════════════════════════════════════════════════════════
//  REMOTE CONFIG — lets the website change timers/tools/servers
// ════════════════════════════════════════════════════════════
async function loadRemoteConfig() {
  try {
    const remote = await fetchJson(DEFAULT_CONFIG.remoteConfigUrl);
    if (!remote || typeof remote !== 'object') return;
    saveCached(CONFIG_CACHE_KEY, remote);
    config = loadCachedConfig();
    renderAll();
    Notifier.reschedule(config.timers, season);
  } catch (err) {
    console.info('[config] using built-in/cached config:', err.message);
  }
}

function renderAll() {
  renderTimers();
  renderTools();
  renderServers();
  renderSeason(false);
  renderSettings();
}

// ════════════════════════════════════════════════════════════
//  INIT
// ════════════════════════════════════════════════════════════
function bindNav() {
  $('#menuBtn').addEventListener('click', () => (drawerOpen() ? closeDrawer() : openDrawer()));
  $('#scrim').addEventListener('click', closeDrawer);

  // One delegated handler for every [data-view] / [data-web] / [data-url] control
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-view], [data-web], [data-url]');
    if (!el || el.closest('#leadSeg')) return;
    e.preventDefault();
    if (el.dataset.view) showView(el.dataset.view);
    else if (el.dataset.web) openWeb(webTarget(el.dataset.web));
    else openWeb({ url: el.dataset.url, label: el.dataset.label || 'LxW' });
  });

  $('#webReload').addEventListener('click', () => { const f = $('#webFrameWrap iframe'); if (f) { $('#webLoading').hidden = false; f.src = f.src; } });
  $('#webExternal').addEventListener('click', () => openExternal(webUrl));
  $('#webRetry').addEventListener('click', () => {
    const f = $('#webFrameWrap iframe');
    $('#webOffline').hidden = navigator.onLine !== false;
    if (f) { $('#webLoading').hidden = false; f.src = webUrl; }
  });

  if (AppPlugin) {
    AppPlugin.addListener('backButton', handleBack);
    AppPlugin.addListener('resume', () => {
      loadSeason();
      loadRemoteConfig();
      refreshPermissionUi();
      Notifier.reschedule(config.timers, season);
    });
    AppPlugin.getInfo().then(i => { $('#appVersion').textContent = `Version ${i.version} (${i.build})`; }).catch(() => {});
  }
  Notifier.onTap(extra => showView(extra.view || 'timers'));
}

async function init() {
  bindNav();
  bindSettings();
  renderAll();
  showView('timers');

  setInterval(() => {
    if (currentView === 'timers') tickTimers();
    else if (currentView === 'season') tickSeason();
    else if (currentView === 'servers') tickServers();
  }, 1000);

  await Notifier.init().catch(err => console.warn('[alerts] init', err));
  loadSeason();
  loadRemoteConfig();
  Notifier.reschedule(config.timers, season);
}

init();
