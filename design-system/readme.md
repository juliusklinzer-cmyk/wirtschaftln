# Wirtschaftln — Design System

> **Wirtschaftln München · seit 2019**
> *„Oiwei anders. Oiwei dahoam.“* — Treu im Brauch, offen für Neis.

A design system for **Wirtschaftln**, a private *Stammtisch* app used by a closed circle of Münchner. The club meets every two weeks at a **different** Munich Wirtshaus (never the same twice). Members propose & vote on dates, document who attended and how many Hoibe were drunk, rate the taverns, keep a map of everywhere they've been, run a **Vereinskasse** for misbehaviour (no-shows, lateness), and hand out tongue-in-cheek honorary **Ämter** (offices) at the year-end feast. The whole thing is deliberately **gamified** — streaks, leaderboards, podiums, collectible taverns, achievement seals.

The brand fuses **modern Apple-clean UI** with **altbayrische** (old-Bavarian) ceremony: a blackletter wordmark, a heraldic crest (Münchner Kindl monk, gold lion rampant, Bavarian rhombus, crown), Munich blue and Augustiner gold.

## Sources provided
- Brand crest & wordmark art (AI-generated): `assets/logo-crest-full.png`, `assets/logo-shield.png`, `assets/logo-label-blue.png`.
- Münchner Kindl city coat of arms reference: `assets/muenchner-kindl-wappen.png`.
- Munich imagery: `assets/munich-skyline.webp`, `assets/munich-alps-panorama.jpg`.
- A gamification reference screenshot (dark leaderboard/streak app) — used for interaction inspiration only; not part of the brand.
- Brand directives: primary `#006AB3`, Augustiner gold `#D0AD66`, white; "modern Apple fonts mixed with old-Bavarian accents"; "gamified"; "person cards with photo and modern buttons".

No codebase or Figma was provided — this is a greenfield product, so the app screens are designed from the written brief + brand assets rather than recreated from an existing UI.

---

## CONTENT FUNDAMENTALS — voice & copy

**Language:** German, with **light Bavarian dialect** seasoning. Standard German for functional UI ("Eintragen", "Reservierung", "Bewegungen"), Bairisch for flavour and ceremony ("Oiwei dahoam", "Heut' am Tisch", "Hoibe heut'", "Spätzünder"). Never overdo the dialect — it's seasoning, not the meal.

**Address:** Informal **du**, never Sie — it's a circle of friends. "Hast du Zeit?", "Deine Saison", "Deine Antwort".

**Tone:** Warm, clubby, dry-witted, a little ceremonial. The Vereinskasse and Ämter are played with a wink ("Zugesagt & nicht erschienen → 10 €", office "Spätzünder 🐌"). Pride in tradition without taking itself too seriously.

**Casing:** Sentence case for UI and German nouns capitalised per grammar (Hoibe, Abende, Wirtshäuser). **Eyebrows/labels** are UPPERCASE with wide tracking ("NÄCHSTER STAMMTISCH", "KASSENSTAND"). The **wordmark** "Wirtschaftln" is always Fraktur.

**Numbers & units:** German formatting — comma decimals, € after the amount with a space ("184,50 €"). Stats are bold tabular numerals. Core countable units: **Hoibe** (beers), **Abende** (evenings attended), **Wirtshäuser** (taverns visited).

**Emoji:** Used sparingly and purposefully as warm accents — 🍺 for Hoibe, 📍 for the next venue, 🐌/💰/✒️ as Amt icons, ⚠️ for open penalties. Not decorative spam. Functional iconography is the Lucide-style stroke set, not emoji.

**Examples**
- Hero: "Nächster Stammtisch · Wirtshaus am Hart · Donnerstag, 11. Juli, 19:00"
- Vote prompt: "Hast du Zeit?" → Zusagen / Vielleicht / Absagen
- Kasse warning: "2 offene Strafen · 15 € — Bitte bis zum nächsten Stammtisch begleichen"
- Motto / chrome: "München · seit 2019"

---

## VISUAL FOUNDATIONS

**Colour.** Münchner Blau `#006AB3` is the load-bearing brand colour (primary buttons, active states, stats, links). A deeper **Navy** `#0C2B5A → #07193A` anchors ceremonial/dark surfaces (hero card, podium, Kassenstand). **Augustiner Gold** `#D0AD66` is the ceremonial accent — crests, office seals, the Hoibe counter, achievement chrome, hairline rules — never a large flat field. **Pergament** `#F6F0E2` brings altbayrisch warmth to soft surfaces (member-card headers, proposal cards). Neutrals are a cool slate ramp. Semantics: loden green (zugesagt), amber (unsicher), red (Strafe). Imagery skews **warm and bright** (sunlit Munich, beer-hall wood) on light screens; the dark hero/podium tints Munich photography navy.

**Type.** UI/body is **Manrope** — a clean geometric-humanist sans standing in for "modern Apple" (SF Pro). The **altbayrisch accent** is **Pirata One**, a legible blackletter, reserved strictly for the wordmark, Amt titles, and chronicle/ceremony headers — never body text. **Libre Caslon (italic)** carries the motto/quotes. Display numerals are extrabold, tight-tracked, tabular. *(All three are Google Font substitutes — see Caveats.)*

**Spacing & layout.** 8-pt grid (4-pt half-step). Mobile-first app frame ~390px. Generous 16–20px screen gutters, 12–16px stack rhythm, cards padded 14–22px. Bottom tab bar is fixed; content scrolls between fixed app bar and tab bar.

**Backgrounds.** Mostly clean — app background is a near-white cool `#F2F5F8`; cards are white or parchment. Ceremony uses the **navy gradient**. The signature pattern is the **Bayrische Raute** (blue-white diamond, `.wn-raute`) used as a thin trim band on hero chrome — never a busy full background. The app's launch backdrop is tinted Munich-alps photography.

**Corner radii.** Soft and Apple-modern: 10–14px for buttons/inputs, 20px for cards, 28px for large sheets, full pills for badges/segmented controls/avatars. Nothing sharp.

**Borders.** 1px cool hairlines (`--ink-100`) divide content. Ceremonial elements get a **1.5px gold hairline frame**. Inputs use a 1.5px border that warms from slate to Münchner Blau on focus.

**Shadows.** Low, soft, cool-navy-tinted (`rgba(12,43,90,…)`). `xs`→`lg` for elevation; a dedicated **warm gold shadow** sits under gold elements (Hoibe counter, gold buttons). No harsh black drop shadows.

**Animation.** Restrained and physical. Apple-style standard ease `cubic-bezier(0.32,0.72,0,1)` for transitions (220ms). A **gentle spring** `cubic-bezier(0.34,1.56,0.64,1)` powers the gamified pops — the Hoibe counter number bounces on change, toggle knobs overshoot slightly. No infinite/looping decoration.

**States.** Hover = subtle darken (or a 2px lift + larger shadow on interactive cards). **Press = scale-down** (buttons 0.97, icon buttons 0.92) — tactile, no colour flip. Focus = 3px Münchner-Blau ring. Disabled = flat `--ink-100` fill, `--ink-300` text.

**Cards.** White or parchment, 20px radius, 1px hairline, soft `sm` shadow. PersonCards put a parchment header (photo + name + Amt) over a white stat strip. WirtshausCards are photo-topped with a status badge. The "next venue" and ceremonial cards wear the gold frame.

**Transparency & blur.** Used lightly — translucent white chips on the dark hero, a navy scrim over backdrop photography. No heavy glassmorphism.

---

## ICONOGRAPHY

- **Functional icons:** a **Lucide-style** 24px stroke set (2px, round caps/joins), shipped inline in `ui_kits/app/icons.jsx` (home, calendar, map, trophy, wallet, beer, pin, star, check, flame, bell, clock, users, chevron…). *Substitution:* these reproduce Lucide geometry by hand rather than pulling the npm package — swap for the real [Lucide](https://lucide.dev) set in production (same visual language).
- **Emoji** are used as small warm accents only (🍺 📍 💰 🐌 ✒️ ⚠️ ★), chiefly for Amt seals and Hoibe. Not for primary navigation or functional affordances.
- **Heraldry / brand marks** are raster PNGs in `assets/` (crest, shield, blue label, Münchner Kindl). Use the shield in the app bar, the full crest for splash/ceremony. Do not redraw the crest as SVG.
- No icon webfont. No unicode-as-icon beyond the curated emoji accents.

---

## INDEX — what's in this system

**Foundations / entry**
- `styles.css` — global entry point (import this); `@import`s everything below.
- `tokens/` — `colors.css`, `typography.css`, `spacing.css`, `effects.css`, `patterns.css` (the `.wn-raute` / `.wn-parchment` / `.wn-eyebrow` helpers), `fonts.css` (Google Font substitutes).

**Assets** (`assets/`) — `logo-crest-full.png`, `logo-shield.png`, `logo-label-blue.png`, `muenchner-kindl-wappen.png`, `munich-skyline.webp`, `munich-alps-panorama.jpg`.

**Components** (`window.WirtschaftlnDesignSystem_7e7aff`)
- *core/* — `Button`, `IconButton`, `Badge`, `Avatar`, `Card`, `Stat`, `SegmentedTabs`, `SectionHeader`
- *forms/* — `Input`, `Switch`
- *domain/* — `PersonCard`, `WirtshausCard` (+ `StarRating`), `BeerCounter`, `AmtBadge`, `VotePill`, `RankRow`, `KasseEntry`
- *brand/* — `CrestMark`
Each ships a `.d.ts`, a `.prompt.md`, and a directory `@dsCard` showcase.

**Guidelines** (`guidelines/`) — foundation specimen cards (Colors, Type, Spacing, Brand) shown in the Design System tab.

**UI kit** (`ui_kits/app/`) — the interactive Stammtisch app, five screens. See its `README.md`.

**`SKILL.md`** — Agent-Skill front-matter so this system can be used standalone in Claude Code.

---

## CAVEATS
- **Fonts are substitutes.** No brand font files were supplied. Manrope (UI), Pirata One (Fraktur accent), Libre Caslon (quotes) approximate the intent and load from Google Fonts — replace with licensed brand fonts when chosen.
- **Icons are a Lucide-style hand substitute**, not the real package.
- **Demo media is placeholder** — pravatar member photos, Unsplash tavern photos, and a stylized (non-live) map.
- The crest art is AI-generated reference; commission a finalised vector logo before production.
