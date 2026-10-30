// ============================================================
//  LxW App — shell: game switch, navigation, timers, season,
//  servers, tools, creators, support
// ============================================================

const CONFIG_CACHE_KEY = 'lxw_remote_config';
const SEASON_CACHE_KEY = 'lxw_season';
const GAME_KEY         = 'lxw_game';

const cap       = window.Capacitor;
const AppPlugin = Notifier.native ? (cap.Plugins.App || cap.registerPlugin('App')) : null;
const Browser   = Notifier.native ? (cap.Plugins.Browser || cap.registerPlugin('Browser')) : null;

let config = loadCachedConfig();
let gameId = loadGameId();
// Once Human's battle pass / crates come from the site's JSON; cached for offline starts
let ohSeason = loadCached(SEASON_CACHE_KEY) || { battlepass: null, crates: [] };
let ohSeasonErrored = false;
let currentView = 'timers';
let lastNativeView = 'timers';
let activeTab = 'timers';

const game = () => config.games[gameId];
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

// Remote values win over built-in defaults: top-level keys replace, and each
// game's keys replace that game's built-in keys one by one.
function loadCachedConfig() {
  const remote = loadCached(CONFIG_CACHE_KEY) || {};
  const games = {};
  for (const [id, g] of Object.entries(DEFAULT_CONFIG.games)) games[id] = { ...g, ...((remote.games || {})[id] || {}) };
  return { ...DEFAULT_CONFIG, ...remote, games };
}

function loadGameId() {
  let id = null;
  try { id = localStorage.getItem(GAME_KEY); } catch (_) {}
  return id && DEFAULT_CONFIG.games[id] ? id : 'oncehuman';
}

async function fetchJson(url) {
  // Cache-buster so the phone never shows a stale copy after a site update
  const res = await fetch(url + (url.includes('?') ? '&' : '?') + 't=' + Date.now(), {
    signal: AbortSignal.timeout(10000), cache: 'no-store',
  });
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return res.json();
}

// Every game's timers, tagged so alerts keep working whichever game is showing
function allTimers() {
  return Object.entries(config.games).flatMap(([id, g]) =>
    (g.timers || []).map(t => ({ ...t, key: `${id}:${t.id}`, game: id, gameName: g.name })));
}

function rescheduleAlerts() {
  Notifier.reschedule(allTimers(), allSeasonItems());
}

// ════════════════════════════════════════════════════════════
//  GAME SWITCH
// ════════════════════════════════════════════════════════════
function setGame(id, view) {
  if (!config.games[id]) return;
  gameId = id;
  try { localStorage.setItem(GAME_KEY, id); } catch (_) {}
  document.body.dataset.game = id;
  $$('.game-switch button').forEach(b => {
    const on = b.dataset.game === id;
    b.classList.toggle('active', on);
    b.setAttribute('aria-checked', on);
  });
  renderGame();
  const wanted = view || (currentView === 'web' ? lastNativeView : currentView);
  showView(gameHasView(wanted) ? wanted : 'timers');
}

function gameHasView(view) {
  if (view === 'servers') return !!(game().servers || []).length;
  return ['timers', 'tools', 'season', 'creators', 'support', 'settings'].includes(view);
}

const SHARED_VIEWS = ['creators', 'support', 'settings'];

// ════════════════════════════════════════════════════════════
//  NAVIGATION
// ════════════════════════════════════════════════════════════
function viewTitle(name) {
  if (name === 'season') return game().seasonTitle;
  return $(`#view-${name}`).dataset.title;
}

function showView(name, tabKey) {
  if (name !== 'web') { lastNativeView = name; closeWeb(); }
  currentView = name;
  $$('.view').forEach(v => { v.hidden = v.id !== `view-${name}`; });
  $('#webActions').hidden = name !== 'web';
  document.body.classList.toggle('show-gamebar', name !== 'web' && !SHARED_VIEWS.includes(name));
  if (name !== 'web') document.body.classList.remove('immersive');

  activeTab = tabKey || (name === 'web' ? activeTab : name);
  $$('.tab').forEach(t => t.classList.toggle('active', t.dataset.key === activeTab));
  $$('.drawer-item').forEach(d => d.classList.toggle('active',
    name === 'web' ? d.dataset.web === webKey : d.dataset.view === name));
  if (name !== 'web') $('#topTitle').textContent = viewTitle(name);
  $('#main').scrollTop = 0;
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

function renderTabs() {
  $('#tabbar').innerHTML = game().tabs.map(t => {
    const key = t.view || 'web:' + t.web;
    const attr = t.view ? `data-view="${t.view}"` : `data-web="${t.web}"`;
    return `<button class="tab" data-key="${key}" ${attr}><span class="tab-ico">${t.icon}</span><span>${escapeHtml(t.label)}</span></button>`;
  }).join('');
  $('#tabbar').style.gridTemplateColumns = `repeat(${game().tabs.length}, 1fr)`;
}

function renderDrawer() {
  const g = game();
  const names = { timers: 'Event Timers', season: g.seasonTitle, servers: 'Server Openings' };
  $('#drawerLiveTitle').textContent = `Live · ${g.name}`;
  $('#drawerLive').innerHTML = g.tabs.filter(t => t.view !== 'tools').map(t => {
    const attr = t.view ? `data-view="${t.view}"` : `data-web="${t.web}"`;
    const label = t.view ? names[t.view] : (g.tools.find(x => x.id === t.web) || t).label;
    return `<button class="drawer-item" ${attr}><span>${t.icon}</span> ${escapeHtml(label)}</button>`;
  }).join('');
  // Tools that already have their own tab (Combo Codes) are listed under Live instead
  $('#drawerTools').innerHTML = g.tools.filter(t => !g.tabs.some(tab => tab.web === t.id)).map(t => `
    <button class="drawer-item" data-web="${t.id}"><span>${t.icon}</span> ${escapeHtml(t.label)}</button>`).join('');
  $('#hubLabel').textContent = `${g.name} Website`;
  $('#drawerDisclaimer').textContent = g.disclaimer;
  document.body.style.setProperty('--disclaimer', JSON.stringify(g.disclaimer));
}

// ─── Embedded website pages ─────────────────────────────────
// Each page gets a fresh iframe so its back-history starts clean. `webDepth`
// counts navigations inside it so the Android back button can step back
// through pages before leaving.
let webDepth = 0;
let webGoingBack = false;
let webUrl = '';
let webKey = '';

function webTarget(key) {
  const g = game();
  if (key === 'hub') return { label: g.name, url: g.hubUrl };
  if (key === 'main') return { label: 'LethalXWolf', url: config.mainSiteUrl };
  if (key === 'ravensjest') return config.ravensjest;
  return g.tools.find(t => t.id === key);
}

function openWeb(target, key) {
  if (!target) return;
  webKey = key || '';
  webUrl = target.url;
  webDepth = 0;
  webGoingBack = false;
  $('#topTitle').textContent = target.label;
  // Maps get the whole screen: no tab bar
  document.body.classList.toggle('immersive', !!target.fullscreen);

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
  // Highlight the tab this page belongs to: its own tab (Combo Codes) or Tools
  const tabKey = game().tabs.some(t => t.web === key) ? 'web:' + key : game().tools.includes(target) ? 'tools' : null;
  showView('web', tabKey);
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
  if (currentView === 'web') { if (!webBack()) showView(lastNativeView); return; }
  if (currentView !== 'timers') return showView('timers');
  AppPlugin && AppPlugin.minimizeApp();
}

// ════════════════════════════════════════════════════════════
//  TIMERS
// ════════════════════════════════════════════════════════════
function renderTimers() {
  const g = game();
  const settings = Notifier.loadSettings();
  const ann = $('#announcement');
  ann.hidden = !g.announcement;
  ann.textContent = g.announcement || '';

  $('#timerGroups').innerHTML = g.timerGroups.map(grp => {
    const timers = g.timers.filter(t => t.group === grp.id);
    if (!timers.length) return '';
    return `
      <div class="group-head">
        <div>
          <h2 class="section-title">${escapeHtml(grp.title)}</h2>
          ${grp.subtitle ? `<div class="group-sub">${escapeHtml(grp.subtitle)}</div>` : ''}
        </div>
        ${grp.guideUrl ? `<button class="group-link" data-url="${escapeHtml(grp.guideUrl)}" data-label="${escapeHtml(grp.title)}">Guide →</button>` : ''}
      </div>
      ${timers.map(t => `
        <div class="card timer-card">
          <div class="timer-ico">${t.icon}</div>
          <div>
            <div class="timer-label">${escapeHtml(t.label)}</div>
            <div class="timer-value" id="tv-${t.id}">--:--:--</div>
          </div>
          <label class="alert-toggle">ALERT
            <input type="checkbox" class="switch" data-alert="${gameId}:${t.id}" ${settings.timers[`${gameId}:${t.id}`] ? 'checked' : ''} aria-label="Alert for ${escapeHtml(t.label)}" />
          </label>
          <div class="timer-next">
            <span id="tn-${t.id}">calculating…</span>
            ${t.linkUrl ? ` · <a href="#" data-url="${escapeHtml(t.linkUrl)}" data-label="${escapeHtml(t.label)}">${escapeHtml(t.linkLabel || 'Open')}</a>` : ''}
          </div>
          ${t.resets ? `<div class="timer-resets">${t.resets.map(r => `<span>${escapeHtml(r)}</span>`).join('')}</div>` : ''}
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
  rescheduleAlerts();
  refreshPermissionUi();
}

const NEXT_LABEL = { event: 'Next start', change: 'Next change' };

function tickTimers() {
  const now = Date.now();
  for (const t of game().timers) {
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
      $(`#tn-${t.id}`).textContent = `${NEXT_LABEL[t.kind] || 'Next reset'}: ${formatAbsolute(next)}`;
    }
  }
}

// ════════════════════════════════════════════════════════════
//  SEASON  (Once Human: same JSON the website uses · Aniimo: config)
// ════════════════════════════════════════════════════════════
function imageUrl(path, base) {
  if (!path) return '';
  return /^https?:/.test(path) ? path : base + path.replace(/^\//, '');
}

// → [{ title, empty, items: [{ label, name, end, image, what }] }]
function seasonSections(id) {
  const g = config.games[id];
  const now = Date.now();
  if (g.season.source === 'oncehuman') {
    const bp = ohSeason.battlepass;
    const crates = (ohSeason.crates || [])
      .filter(c => Date.parse(c.endDate) > now)
      .sort((a, b) => Date.parse(b.startDate) - Date.parse(a.startDate));
    const img = p => imageUrl(p, g.season.imageBase);
    return [
      { title: '🌟 Current Battle Pass', empty: 'No battle pass data yet.',
        items: bp ? [{ label: '🌟 Current Battle Pass', name: bp.name || 'Battle Pass', end: Date.parse(bp.endDate), image: img(bp.imageUrl), what: 'Battle Pass' }] : [] },
      { title: '🎁 Current Loot Crates', empty: 'No active loot crates right now.',
        items: crates.map(c => ({ label: '🎁 Current Loot Crate', name: c.name, end: Date.parse(c.endDate), image: img(c.imageUrl), what: 'Loot Crate' })) },
    ];
  }
  const items = (g.season.items || [])
    .map(it => ({ label: it.label, name: it.name, end: Date.parse(it.endUtc), image: it.imageUrl || '', what: it.label.replace(/^Current\s+/i, '').split('·')[0].trim() }))
    .filter(it => it.end > now);
  return [{ title: `🌟 ${g.seasonTitle}`, empty: 'Nothing running right now. Check back soon.', items }];
}

function allSeasonItems() {
  return Object.keys(config.games).flatMap(id =>
    seasonSections(id).flatMap(s => s.items.map(it => ({ game: id, what: it.what, name: it.name, end: it.end }))));
}

function renderSeason() {
  const errored = gameId === 'oncehuman' && ohSeasonErrored;
  let n = 0;
  $('#seasonBody').innerHTML = seasonSections(gameId).map(sec => `
    <h2 class="section-title">${escapeHtml(sec.title)}</h2>
    ${sec.items.length ? sec.items.map(it => `
      <div class="card season-card">
        ${it.image ? `<img class="season-img" src="${escapeHtml(it.image)}" alt="${escapeHtml(it.name)}" loading="lazy" onerror="this.remove()" />` : ''}
        <div class="season-body">
          <div class="season-label">${escapeHtml(it.label)}</div>
          <div class="season-name">${escapeHtml(it.name)}</div>
          <div class="timer-value" data-end="${it.end}" id="sv-${n++}">--d --h --m</div>
          <div class="season-ends">Ends ${formatAbsolute(it.end)}</div>
        </div>
      </div>`).join('')
      : `<div class="card loading">${errored ? 'Couldn’t load this. Check your connection.' : escapeHtml(sec.empty)}</div>`}`).join('');

  const g = game();
  $('#seasonAlertHint').textContent = gameId === 'oncehuman'
    ? 'Notify me 24 hours before the battle pass or a loot crate ends.'
    : `Notify me 24 hours before the ${g.name} season or banner ends.`;
  $('#seasonAlert').checked = !!Notifier.loadSettings().seasonEnding[gameId];
  tickSeason();
}

function tickSeason() {
  const now = Date.now();
  $$('#seasonBody [data-end]').forEach(el => { el.textContent = formatDHM(Number(el.dataset.end) - now); });
}

async function loadOhSeason() {
  const s = config.games.oncehuman.season;
  const [bp, lc] = await Promise.allSettled([fetchJson(s.battlePassUrl), fetchJson(s.lootCratesUrl)]);
  if (bp.status === 'fulfilled') ohSeason.battlepass = bp.value.battlepass || null;
  if (lc.status === 'fulfilled') ohSeason.crates = lc.value.crates || [];
  ohSeasonErrored = bp.status === 'rejected' && lc.status === 'rejected' && !ohSeason.battlepass && !ohSeason.crates.length;
  if (bp.status === 'fulfilled' || lc.status === 'fulfilled') saveCached(SEASON_CACHE_KEY, ohSeason);
  renderSeason();
  rescheduleAlerts();
}

// ════════════════════════════════════════════════════════════
//  SERVER OPENINGS (Once Human)
// ════════════════════════════════════════════════════════════
function renderServers() {
  const g = game();
  $('#serverNote').textContent = g.serverNote || '';
  const block = (s, kind, rec) => rec ? `
      <div class="sc-block">
        <div class="sc-label">${kind}${kind === 'Visional' && s.visionalAlt ? ' · NA EU SEA' : ''}</div>
        <div class="sc-value" id="sc-${kind}-${s.id}">--d --h --m</div>
        <div class="sc-date" id="scd-${kind}-${s.id}">--</div>
        ${kind === 'Visional' && s.visionalAlt ? `<div class="sc-alt">${escapeHtml(s.visionalAlt)}</div>` : ''}
      </div>` : `
      <div class="sc-block"><div class="sc-label">${kind}</div><div class="sc-na">Visional only</div></div>`;

  $('#serverGrid').innerHTML = (g.servers || []).map(s => `
    <div class="card server-card">
      <div class="server-name">${escapeHtml(s.name)}</div>
      <div class="server-cols">${block(s, 'Normal', s.normal)}${block(s, 'Visional', s.visional)}</div>
    </div>`).join('');
  tickServers();
}

function tickServers() {
  const now = Date.now();
  for (const s of game().servers || []) {
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
  $('#toolGrid').innerHTML = game().tools.map(t => `
    <button class="card tool-card" data-web="${t.id}">
      <span class="tool-ico">${t.icon}</span>
      <span class="tool-name">${escapeHtml(t.label)}</span>
      <span class="tool-desc">${escapeHtml(t.desc || '')}</span>
    </button>`).join('');
}

// ════════════════════════════════════════════════════════════
//  CREATORS & SUPPORT (shared by both games)
// ════════════════════════════════════════════════════════════
function linkRow(p) {
  return `
    <a class="platform-link" href="${escapeHtml(p.url)}" data-external>
      <span class="dot" style="background:${escapeHtml(p.dot)}"></span>
      <span class="platform-name">${escapeHtml(p.name)}</span>
      <span class="platform-handle">${escapeHtml(p.handle)}</span>
      <span class="platform-arrow">→</span>
    </a>`;
}

function renderCreators() {
  $('#creatorList').innerHTML = config.creators.map(c => `
    <div class="card creator-card" style="--creator:${escapeHtml(c.accent)}">
      <div class="creator-head">
        <img class="creator-avatar" src="${escapeHtml(c.avatar)}" alt="" onerror="this.style.visibility='hidden'" />
        <div>
          <div class="creator-name">${escapeHtml(c.name)}</div>
          <div class="creator-role">${escapeHtml(c.role)}</div>
        </div>
      </div>
      <div class="platforms">${c.platforms.map(linkRow).join('')}</div>
    </div>`).join('');
  $('#communityLinks').innerHTML = `<div class="platforms">${(config.communityLinks || []).map(linkRow).join('')}</div>`;
}

function renderSupport() {
  const s = config.support;
  $('#supportTitle').textContent = s.title;
  $('#supportText').innerHTML = s.paragraphs.map(p => `<p>${escapeHtml(p)}</p>`).join('');
  $('#supportButtons').innerHTML = s.buttons.map(b => `
    <a class="support-btn support-btn--${escapeHtml(b.style || 'secondary')}" href="${escapeHtml(b.url)}" data-external>${escapeHtml(b.label)}</a>`).join('');
  $('#supportFootnote').textContent = s.footnote || '';
}

// ════════════════════════════════════════════════════════════
//  SETTINGS
// ════════════════════════════════════════════════════════════
function renderSettings() {
  const s = Notifier.loadSettings();
  $$('#leadSeg button').forEach(b => b.classList.toggle('active', Number(b.dataset.lead) === s.leadMin));
  refreshPermissionUi();
}

async function refreshPermissionUi() {
  const s = Notifier.loadSettings();
  const anyOn = Object.values(s.seasonEnding).some(Boolean) || Object.values(s.timers).some(Boolean);
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
    rescheduleAlerts();
  }));
  $('#seasonAlert').addEventListener('change', async e => {
    if (e.target.checked && !(await Notifier.ensurePermission())) { e.target.checked = false; return; }
    const s = Notifier.loadSettings();
    s.seasonEnding[gameId] = e.target.checked;
    Notifier.saveSettings(s);
    rescheduleAlerts();
  });
  $('#exactFix').addEventListener('click', async () => {
    await Notifier.openExactAlarmSettings();
    refreshPermissionUi();
    rescheduleAlerts();
  });
  $('#permFix').addEventListener('click', async () => {
    if (await Notifier.ensurePermission()) { $('#permNotice').hidden = true; rescheduleAlerts(); }
  });
  $('#testAlert').addEventListener('click', async () => {
    const ok = await Notifier.sendTest();
    $('#testResult').textContent = ok
      ? 'Test alert on its way. It should appear in a few seconds.'
      : 'Notifications are blocked. Allow them for LxW in your phone’s settings.';
  });
}

// ════════════════════════════════════════════════════════════
//  REMOTE CONFIG — lets the website change timers/tools/links
// ════════════════════════════════════════════════════════════
async function loadRemoteConfig() {
  try {
    const remote = await fetchJson(DEFAULT_CONFIG.remoteConfigUrl);
    if (!remote || typeof remote !== 'object') return;
    saveCached(CONFIG_CACHE_KEY, remote);
    config = loadCachedConfig();
    renderAll();
    if (currentView !== 'web') showView(gameHasView(currentView) ? currentView : 'timers');
    rescheduleAlerts();
  } catch (err) {
    console.info('[config] using built-in/cached config:', err.message);
  }
}

function renderGame() {
  renderTabs();
  renderDrawer();
  renderTimers();
  renderTools();
  renderServers();
  renderSeason();
}

function renderAll() {
  renderGame();
  renderCreators();
  renderSupport();
  renderSettings();
}

// ════════════════════════════════════════════════════════════
//  INIT
// ════════════════════════════════════════════════════════════
function bindNav() {
  $('#menuBtn').addEventListener('click', () => (drawerOpen() ? closeDrawer() : openDrawer()));
  $('#scrim').addEventListener('click', closeDrawer);

  // One delegated handler for every navigation control
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-game], [data-view], [data-web], [data-url], [data-external]');
    if (!el || el === document.body || el.closest('#leadSeg')) return;
    e.preventDefault();
    if (el.hasAttribute('data-external')) openExternal(el.href);
    else if (el.closest('.game-switch')) { if (el.dataset.game !== gameId) setGame(el.dataset.game); else closeDrawer(); }
    else if (el.dataset.view) showView(el.dataset.view);
    else if (el.dataset.web) openWeb(webTarget(el.dataset.web), el.dataset.web);
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
      loadOhSeason();
      loadRemoteConfig();
      refreshPermissionUi();
      rescheduleAlerts();
    });
    AppPlugin.getInfo().then(i => { $('#appVersion').textContent = `Version ${i.version} (${i.build})`; }).catch(() => {});
  }
  Notifier.onTap(extra => setGame(extra.game || gameId, extra.view || 'timers'));
}

async function init() {
  bindNav();
  bindSettings();
  renderCreators();
  renderSupport();
  renderSettings();
  setGame(gameId, 'timers');

  setInterval(() => {
    if (currentView === 'timers') tickTimers();
    else if (currentView === 'season') tickSeason();
    else if (currentView === 'servers') tickServers();
  }, 1000);

  await Notifier.init().catch(err => console.warn('[alerts] init', err));
  loadOhSeason();
  loadRemoteConfig();
  rescheduleAlerts();
}

init();
