---
name: wirtschaftln-design
description: Use this skill to generate well-branded interfaces and assets for Wirtschaftln — a gamified Munich Stammtisch club app (blue/gold Bavarian heraldry, Apple-clean UI with altbayrische Fraktur accents) — for production or throwaway prototypes/mocks. Contains colors, type, fonts, brand assets, reusable components and an app UI kit.
user-invocable: true
---

Read the `readme.md` file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## Quick map
- `styles.css` — link this one file; it `@import`s all tokens, the `.wn-raute`/`.wn-parchment`/`.wn-eyebrow` helpers, and the (substitute) webfonts.
- `tokens/` — colors, typography, spacing, effects, patterns. Key tokens: `--muc-blau` (#006AB3), `--gold` (#D0AD66), `--navy`, `--pergament`; `--font-ui` (Manrope), `--font-fraktur` (Pirata One, accent only).
- `assets/` — crest, shield, blue label, Münchner Kindl, Munich photography.
- `components/` — React primitives. After the design system is compiled, mount via `const { Button, PersonCard, … } = window.WirtschaftlnDesignSystem_7e7aff` and load `_ds_bundle.js`. See each component's `.prompt.md`.
- `ui_kits/app/` — full interactive Stammtisch app (Heute, Termin, Karte, Rangliste, Kasse). Best reference for composition and tone.

## Brand in one breath
Munich blue + Augustiner gold + parchment. Apple-clean layouts; blackletter wordmark and Amt titles for ceremony; gamified (streaks, podiums, collectible taverns, Hoibe counts). German, informal *du*, dry-witted, light Bavarian dialect. Soft radii, low cool shadows, gold for ceremony only, spring-pop on gamified interactions.
