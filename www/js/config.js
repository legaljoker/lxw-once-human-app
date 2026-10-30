// ============================================================
//  LxW App — built-in defaults
//
//  Everything here can be overridden from the website without an app
//  update by editing  once-human/data/app-config.json  on lethalxwolf.live
//  (see README). If that file is missing or unreachable, these values are
//  used as-is.
//
//  Timer schedule format (all times UTC):
//    anchorUtc    — any one past occurrence of the event, ISO 8601
//    periodHours  — how often it repeats (1 = hourly, 24 = daily, 168 = weekly)
//    durationMin  — optional; how long the event stays active after it starts
// ============================================================

const SITE = 'https://lethalxwolf.live';

const DEFAULT_CONFIG = {
  remoteConfigUrl: SITE + '/once-human/data/app-config.json',
  battlePassUrl:   SITE + '/once-human/data/battlepass.json',
  lootCratesUrl:   SITE + '/once-human/data/lootcrates.json',
  imageBase:       SITE + '/',

  timerGroups: [
    { id: 'resets',  title: 'Resets & Daily Timers' },
    {
      id: 'gravity-abyss',
      title: 'Gravity Abyss',
      subtitle: 'Visional Wheel · Season 4 · Visional Worlds only',
      guideUrl: SITE + '/once-human/GravityAbyss.html',
    },
  ],

  timers: [
    { id: 'loot-reset',     group: 'resets', icon: '📦', label: 'Loot Reset',
      anchorUtc: '2026-01-01T00:00:00Z', periodHours: 4 },
    { id: 'tech-scan-loot', group: 'resets', icon: '🔎', label: 'Tech Scan Loot',
      anchorUtc: '2026-01-01T00:00:00Z', periodHours: 6 },
    { id: 'securement',     group: 'resets', icon: '⚙️', label: 'Securement Units',
      anchorUtc: '2026-01-01T00:00:00Z', periodHours: 24 },
    { id: 'daily-deviation', group: 'resets', icon: '🦋', label: 'Daily Deviation Spawns',
      anchorUtc: '2026-01-01T00:00:00Z', periodHours: 24,
      linkUrl: SITE + '/once-human/map-portal.html', linkLabel: 'View today’s spawns' },
    { id: 'miss-memory',    group: 'resets', icon: '🕐', label: 'Miss Memory',
      anchorUtc: '2026-01-05T04:00:00Z', periodHours: 168 },   // Mondays 04:00 UTC

    { id: 'gravity-event',  group: 'gravity-abyss', icon: '🌀', label: 'Gravity Event', kind: 'event',
      anchorUtc: '2026-01-01T00:22:30Z', periodHours: 1, durationMin: 30 },
    { id: 'aerial-hunt',    group: 'gravity-abyss', icon: '🔮', label: 'Aerial Hunt', kind: 'event',
      anchorUtc: '2026-01-01T00:37:30Z', periodHours: 1, durationMin: 20 },
  ],

  tools: [
    { id: 'builds',     icon: '🛠️', label: 'Builds',
      desc: 'Optimized gear, weapon calibrations, and cradle setups.',
      url: SITE + '/once-human/builds.html' },
    { id: 'deviations', icon: '🦋', label: 'Deviation Library',
      desc: 'Every Deviation companion — skills, variations & SCP techniques.',
      url: SITE + '/once-human/deviation-library.html' },
    { id: 'map',        icon: '🗺️', label: 'Interactive Map',
      desc: 'Deviations, Mods & Loot locations.',
      url: SITE + '/once-human/map-portal.html' },
    { id: 'fusion',     icon: '🧪', label: 'Fusion Pod',
      desc: 'Combine Deviations to refine stats and unlock superior versions.',
      url: SITE + '/once-human/fusion-pod.html' },
    { id: 'tech',       icon: '🔬', label: 'Tech Invention',
      desc: 'Explore Tech and unlock Tech-driven growth.',
      url: SITE + '/once-human/tech-invention.html' },
    { id: 'gravity',    icon: '🌀', label: 'Gravity Abyss Guide',
      desc: 'Visional Wheel S4 — mechanics, rewards and tips.',
      url: SITE + '/once-human/GravityAbyss.html' },
  ],

  // Mirrors SERVER_SCHEDULE in once-human.script.js. Times are UTC.
  //   weekly   — weekday (0=Sun … 6=Sat), hour, minute
  //   biweekly — weekday, hour, minute, reference (a YYYY-MM-DD it opened on)
  //   monthly  — days (array of month days), hour, minute
  servers: [
    { id: 'dscp', name: 'Deviation: Survive, Capture, Preserve',
      normal:   { type: 'monthly',  days: [1], hour: 15, minute: 0 },
      visional: { type: 'biweekly', weekday: 6, hour: 15, minute: 0, reference: '2026-05-30' },
      visionalAlt: '1st & 15th — SA · JP · KR · HK' },
    { id: 'endless-dream', name: 'Endless Dream',
      normal:   { type: 'monthly', days: [1], hour: 15, minute: 0 },
      visional: { type: 'weekly',  weekday: 6, hour: 15, minute: 0 },
      visionalAlt: '1st & 15th — SA · JP · KR · HK' },
    { id: 'manibus', name: 'Manibus',
      normal:   { type: 'monthly', days: [1], hour: 15, minute: 0 },
      visional: { type: 'weekly',  weekday: 6, hour: 15, minute: 0 },
      visionalAlt: '1st & 15th — SA · JP · KR · HK' },
    { id: 'way-of-winter', name: 'The Way of Winter',
      normal:   { type: 'monthly', days: [1], hour: 15, minute: 0 },
      visional: { type: 'weekly',  weekday: 6, hour: 15, minute: 0 },
      visionalAlt: '1st & 15th — SA · JP · KR · HK' },
    { id: 'prismverse', name: "Prismverse's Clash",
      normal:   null,
      visional: { type: 'weekly',  weekday: 6, hour: 15, minute: 0 } },
    { id: 'evolution-call', name: "Evolution's Call",
      normal:   null,
      visional: { type: 'monthly', days: [1], hour: 15, minute: 0 },
      visionalAlt: 'Not available — SA · JP · KR · HK' },
  ],

  serverNote: 'Countdowns show time until the next server opens (NA · EU · SEA schedule). ' +
              'Visional schedules vary by region. Times are approximate and shown in your local time zone.',

  // Optional message shown at the top of the Timers tab (set from app-config.json)
  announcement: '',
};
