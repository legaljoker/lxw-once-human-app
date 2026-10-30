# LxW — Android app

Hybrid (Capacitor 8) companion app for **lethalxwolf.live**, covering **Once Human** and **Aniimo**.
Unofficial fan app — Once Human and related content are property of Starry Studio / NetEase Games;
Aniimo and related content are property of their respective owners.

## What's in the app

A **Once Human / Aniimo** switch sits under the top bar (and in the ☰ menu). Each game has its own bottom tabs:

| Once Human | Aniimo |
|---|---|
| **Timers**: Loot Reset, Tech Scan Loot, Securement Units, Daily Deviation Spawns, Miss Memory, Gravity Abyss (Gravity Event, Aerial Hunt) | **Timers**: Daily Reset, Weekly Reset (with what each resets), Weather Cycle |
| **Tools**: Builds, Deviation Library, Interactive Map, Fusion Pod, Tech Invention, Gravity Abyss guide | **Tools**: AniiLog, Egg Heist Info Broker, Combo Codes, Team Comps, Tier List, Bosses, Items, Interactive Map, Twining & Evolution, Homeland & RV, Beginner Guide, Check-in List, Patch Notes |
| **Servers**: Normal / Visional opening countdowns | **Season**: current season and banner |
| **BP & Crates**: battle pass and every active loot crate (from the site's JSON) | **Combo Codes**: the community combo-code board |

The **☰ menu** has everything above plus, under **More**: **Creators** (Wolf_Poe and LethalJoker with all their
socials, plus the Discord), **RavensJest Discord Bot**, **Support Us** (the same Stripe links as the website's
Support Us button), each game's full website, and **Alert Settings & About**.

Website pages open inside the app. Links to other sites (socials, Stripe, Discord login) open in the phone's browser
or app. Interactive maps hide the bottom tabs to give the map the whole screen.

## Keeping the app up to date from the website

You don't need to ship an app update for any of these:

- **Website pages** (all tools, guides, maps, Combo Codes, RavensJest): they load live, so edit the site as usual.
- **Once Human battle pass / loot crates**: update them in the admin panel as usual. The app reads the same JSON.
- **Everything else** (timers, server schedule, tool lists, Aniimo season/banner, creators' links, support links,
  announcement banners): see [`website-addition/README.md`](website-addition/README.md). Upload
  `website-addition/app-config.json` to `once-human/data/app-config.json`, then edit it there.
  - Leave out any key you don't want to override (the app then uses its built-in value).
  - Each list replaces the whole built-in list, so keep every entry in it.
  - Timer fields: `anchorUtc` = any one past start time (UTC), `periodHours` = how often it repeats,
    `durationMin` = how long it's "ACTIVE" (optional), `kind` = `"event"` (says *starts*) or `"change"` (says *changes*),
    `localAnchorHour` = repeat on the phone's own clock instead of UTC (used by Aniimo's weather cycle, matching the site).

The app re-checks the website every time it's opened or brought back to the foreground.

## Alerts

Alerts are real Android scheduled notifications, so they fire with the app closed and survive a phone restart.
Users choose **At start / 5 / 10 / 15 min before** under ☰ → Alert Settings, where there is also a **test alert** button.
On Android 12+, if "Alarms & reminders" is off for the app, alerts can arrive a few minutes late. The settings
screen shows a button to turn it on.

The app schedules the next 3 days of hourly events and 1–4 weeks of the rest, and tops the queue up each time
it's opened, so users who don't open it for 3+ days will stop getting the hourly Gravity Event / Aerial Hunt
alerts until they do.

## Building

Requirements: Node 22+, JDK 21, Android SDK (platform 36). Easiest is Android Studio.

```bash
npm install
npm test                 # checks timer math against the website's formulas
npx cap sync android     # copy www/ into the Android project
cd android && ./gradlew assembleDebug
```

The APK lands in `android/app/build/outputs/apk/debug/app-debug.apk`.

The app ID is `live.lethalxwolf.app`. (Test builds before v1.1.0 used `live.lethalxwolf.oncehuman`, so uninstall
that one; both can't share alerts or settings.)
Or open the `android/` folder in Android Studio and use **Build → Build APK(s)**.

**GitHub:** push this folder to a GitHub repo and `.github/workflows/build-apk.yml` builds the APK on every
push to `main`. Download it from the run's **Artifacts**.

### For the Google Play Store later

1. Create an upload keystore (Android Studio → **Build → Generate Signed App Bundle**) and keep it safe.
   Never commit it.
2. Bump `versionCode` / `versionName` in `android/app/build.gradle` for every release.
3. Build an **.aab** (App Bundle). Play doesn't accept debug APKs.
4. Play's policy declarations: the app uses `SCHEDULE_EXACT_ALARM` for timed alerts, and it's an unofficial
   fan app, so keep the disclaimer and avoid official game artwork in the store listing.
5. **Support Us** sends people to Stripe in the browser. Read Google Play's Payments policy before
   submitting: tips and memberships paid outside Google Play billing can get an app rejected, depending on what
   supporters receive. If review flags it, the simplest fix is to link to the website's Support page instead of
   directly to Stripe.

## Project layout

```
www/                 the app UI (plain HTML/CSS/JS)
  js/config.js       built-in games, timers, tools, servers, creators, support links (defaults)
  js/schedule.js     timer / server-opening math
  js/notify.js       Android notifications
  js/app.js          navigation, views, website loading
android/             native Android project (generated by Capacitor, icons customised)
website-addition/    app-config.json + map fixes to add to the site (see its README)
tools/make_icons.py  regenerates launcher / splash / notification icons from the logo
test/                timer tests
```
