// ============================================================
//  LxW App — built-in defaults
//
//  Everything here can be overridden from the website without an app
//  update by editing  once-human/data/app-config.json  on lethalxwolf.live
//  (see README). If that file is missing or unreachable, these values are
//  used as-is.
//
//  Timer schedule format:
//    anchorUtc       — any one past occurrence of the event, ISO 8601 (UTC)
//    periodHours     — how often it repeats (1 = hourly, 24 = daily, 168 = weekly)
//    durationMin     — optional; how long the event stays active after it starts
//    localAnchorHour — instead of anchorUtc: repeats every periodHours on the
//                      phone's own clock, lined up with this local hour
// ============================================================

const SITE = 'https://lethalxwolf.live';
const ANIIMO = SITE + '/aniimo/';

const DEFAULT_CONFIG = {
  remoteConfigUrl: SITE + '/once-human/data/app-config.json',

  games: {
    // ─── Once Human ───────────────────────────────────────────
    oncehuman: {
      name: 'Once Human',
      hubUrl: SITE + '/once-human.html',
      disclaimer: 'Unofficial fan app · Once Human © Starry Studio / NetEase Games',
      announcement: '',
      tabs: [
        { view: 'timers',  icon: '⏱️', label: 'Timers' },
        { view: 'tools',   icon: '🛠️', label: 'Tools' },
        { view: 'servers', icon: '📅', label: 'Servers' },
        { view: 'season',  icon: '🎁', label: 'BP & Crates' },
      ],
      seasonTitle: 'Battle Pass & Loot Crates',
      season: {
        source: 'oncehuman',
        battlePassUrl: SITE + '/once-human/data/battlepass.json',
        lootCratesUrl: SITE + '/once-human/data/lootcrates.json',
        imageBase: SITE + '/',
      },

      timerGroups: [
        { id: 'resets', title: 'Resets & Daily Timers' },
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
        { id: 'map',        icon: '🗺️', label: 'Interactive Map', fullscreen: true,
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
    },

    // ─── Aniimo ───────────────────────────────────────────────
    aniimo: {
      name: 'Aniimo',
      hubUrl: ANIIMO,
      disclaimer: 'Unofficial fan app · Aniimo and related content are property of their respective owners',
      announcement: '',
      tabs: [
        { view: 'timers', icon: '⏱️', label: 'Timers' },
        { view: 'tools',  icon: '🛠️', label: 'Tools' },
        { view: 'season', icon: '🌟', label: 'Season' },
        { web: 'combo-codes', icon: '🔢', label: 'Combo Codes' },
      ],
      seasonTitle: 'Season & Banner',
      // Mirrors the hub page. `endUtc` is when the countdown hits zero; ended items hide themselves.
      season: {
        source: 'static',
        items: [
          { label: 'Current Season · Part 1', name: 'Departure with the Wind', endUtc: '2026-12-09T08:00:00Z' },
          { label: 'Current Banner',          name: 'Forest of Butterfly Dream', endUtc: '2026-10-30T01:00:00Z' },
        ],
      },

      timerGroups: [
        { id: 'resets', title: 'Resets & Cycles', subtitle: 'Resets 08:00 UTC, shown in your time' },
      ],

      timers: [
        { id: 'daily',   group: 'resets', icon: '☀️', label: 'Daily Reset',
          anchorUtc: '2026-01-01T08:00:00Z', periodHours: 24,
          resets: ['Daily tasks', 'Corner Shop', 'Mysterious Vendor'],
          linkUrl: ANIIMO + 'Check-in%20List.dc.html?tab=daily', linkLabel: 'Full list' },
        { id: 'weekly',  group: 'resets', icon: '📆', label: 'Weekly Reset',
          anchorUtc: '2026-01-05T08:00:00Z', periodHours: 168,      // Mondays 08:00 UTC
          resets: ['Holo-Battle Sim', 'Holo-Battle Interlink', 'Omega bosses', 'Aniipod Discounts', 'Friend gifts'],
          linkUrl: ANIIMO + 'Check-in%20List.dc.html?tab=weekly', linkLabel: 'Full list' },
        { id: 'weather', group: 'resets', icon: '🌦️', label: 'Weather Cycle', kind: 'change',
          localAnchorHour: 18, periodHours: 4 },
      ],

      tools: [
        { id: 'aniilog',     icon: '📖', label: 'AniiLog',
          desc: 'Database — every Aniimo: forms, evolution paths, spawns, traits and skills.',
          url: ANIIMO + 'AniiLog.dc.html' },
        { id: 'egg-heist',   icon: '🥚', label: 'Egg Heist Info Broker',
          desc: 'PvEvP intel — maps, egg routes, extraction points and squad intel.',
          url: ANIIMO + 'Egg%20Heist.dc.html' },
        { id: 'combo-codes', icon: '🔢', label: 'Combo Codes',
          desc: 'Community combo codes — grab ones that work, share yours.',
          url: ANIIMO + 'Combo%20Codes.dc.html' },
        { id: 'team-comps',  icon: '👥', label: 'Team Comps',
          desc: 'Recommended lineups for PvE, Egg Heist and PvP.',
          url: ANIIMO + 'Team%20Comps.dc.html' },
        { id: 'tier-list',   icon: '🏆', label: 'Tier List',
          desc: 'Current rankings by role and game mode.',
          url: ANIIMO + 'Tier%20List.dc.html' },
        { id: 'bosses',      icon: '👹', label: 'Bosses',
          desc: 'World bosses, Boss Rush and Territories with matchups.',
          url: ANIIMO + 'Bosses.dc.html' },
        { id: 'items',       icon: '🎒', label: 'Items',
          desc: 'Every item by category: Aniimo, Homeland, Egg Heist, Appearance and more.',
          url: ANIIMO + 'Items.dc.html' },
        { id: 'map',         icon: '🗺️', label: 'Interactive Map', fullscreen: true,
          desc: 'Spawns by weather and time, resources and puzzles.',
          url: ANIIMO + 'Interactive%20Map.dc.html' },
        { id: 'twining',     icon: '🧬', label: 'Twining & Evolution',
          desc: 'Explore abilities and evolution requirements.',
          url: ANIIMO + 'Twining%20%26%20Evolution.dc.html' },
        { id: 'homeland',    icon: '🏕️', label: 'Homeland & RV',
          desc: 'Crops, decorations and campsite builds.',
          url: ANIIMO + 'Homeland%20%26%20RV.dc.html' },
        { id: 'beginner',    icon: '🧭', label: 'Beginner Guide',
          desc: 'First hours in Idyll, step by step.',
          url: ANIIMO + 'Beginner%20Guide.dc.html' },
        { id: 'check-in',    icon: '✅', label: 'Check-in List',
          desc: 'Daily and weekly to-dos with what each reset refreshes.',
          url: ANIIMO + 'Check-in%20List.dc.html' },
        { id: 'patch-notes', icon: '📝', label: 'Patch Notes',
          desc: 'Every update, with what changed for your team.',
          url: ANIIMO + 'Patch%20Notes.dc.html' },
      ],
    },
  },

  // ─── Shared (both games) ────────────────────────────────────
  // Mirrors WOLF_PLATFORMS / JOKER_PLATFORMS on the main page
  creators: [
    { name: 'Wolf_Poe', role: 'Chaos Agent · Co-Host', avatar: SITE + '/images/DiscordAvatar2.0.webp', accent: '#34e0c4',
      platforms: [
        { name: 'Kick',    handle: 'wolf-poe',         url: 'https://kick.com/wolf-poe',              dot: '#53fc18' },
        { name: 'Twitch',  handle: 'wolf_poe',         url: 'https://twitch.tv/wolf_poe',             dot: '#9b5cf6' },
        { name: 'YouTube', handle: '@wolfpoeofficial', url: 'https://youtube.com/@wolfpoeofficial',   dot: '#ff5252' },
        { name: 'TikTok',  handle: '@wolfpoeofficial', url: 'https://tiktok.com/@wolfpoeofficial',    dot: '#34e0c4' },
      ] },
    { name: 'LethalJoker', role: 'Chaos Agent · Co-Host', avatar: SITE + '/images/lethalxjoker.webp', accent: '#9b5cf6',
      platforms: [
        { name: 'Kick',    handle: 'lethalxjoker',      url: 'https://kick.com/lethalxjoker',            dot: '#53fc18' },
        { name: 'Twitch',  handle: 'lethalxjoker',      url: 'https://twitch.tv/lethalxjoker',           dot: '#9b5cf6' },
        { name: 'YouTube', handle: '@LethalXWolf',      url: 'https://www.youtube.com/@LethalXWolf',     dot: '#ff5252' },
        { name: 'TikTok',  handle: '@lethaljoker',      url: 'https://tiktok.com/@lethaljoker',          dot: '#34e0c4' },
        { name: 'Rumble',  handle: 'LethalxWolfGaming', url: 'https://rumble.com/user/LethalxWolfGaming', dot: '#85c742' },
      ] },
  ],
  communityLinks: [
    { name: 'Discord', handle: 'Community server', url: 'https://discord.gg/aHC5Su85Cq', dot: '#5865f2' },
  ],

  // Same links as the Support Us button on the main page (support-widget.js)
  support: {
    title: 'Support LethalxWolf',
    paragraphs: [
      'LethalxWolf is a two-person fan project. Every page, interactive map and guide is researched, written and kept current by hand.',
      'However you can chip in (a monthly membership, a one-off tip, or just telling a friend), thank you. It all helps to keep this running for everyone ad free.',
    ],
    buttons: [
      { label: '⭐ Become a Monthly Supporter', url: 'https://buy.stripe.com/aFa28r1oxfpF5jGbt43F600', style: 'primary' },
      { label: '🤝 Support the Team',          url: 'https://donate.stripe.com/8x26oH2sB5P5dQccx83F602', style: 'secondary' },
      { label: '☕ Just a Tip ($1)',            url: 'https://buy.stripe.com/bJeeVdgjrcdtaE0bt43F601', style: 'tertiary' },
    ],
    footnote: 'Any amount helps, and none is expected. Thank you.',
  },

  ravensjest: { label: 'RavensJest Discord Bot', url: 'https://dashboard.lethalxwolf.live/welcome' },
  mainSiteUrl: SITE + '/',
};
