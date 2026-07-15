# Wirtschaftln — App UI Kit

A high-fidelity, interactive recreation of the **Wirtschaftln** Stammtisch app: a private club app for a group of Münchner who meet every two weeks at a different Munich Wirtshaus.

Open `index.html` — it renders a phone frame with five working tabs.

## Gate & onboarding
Only logged-in Stammtisch members see anything. `Root.jsx` is the auth gate:
- **`LoginScreen.jsx`** — crest splash + login form, or "Mitglied werden" to apply.
- **`RegisterFlow.jsx`** — 5-step Aufnahme-Antrag (Persönliches → Foto & Spitzname → Bierkultur → Bürge & Begründung → Kodex), ending in the **Servus!**-reveal animation (photo + name pop in, confetti). The application is "pending"; a demo button enters the app.
- `auth.js` holds login + profile state in `localStorage`.

## Tabs (logged in)
| Tab | File | What it shows |
|---|---|---|
| **Hoam** | `HomeScreen.jsx` | Next Stammtisch hero (venue or "organisiert von …", date, RSVP, your vote), season stats with streak, the Hoibe counter, mini Hoibe-Spezln board, and **Wirtschaftler melden**. |
| **Termin** | `TerminScreen.jsx` | The full Termin lifecycle (see below) + availability voting + member responses. |
| **Karte** | `WirtshausScreen.jsx` | Stylized Munich map with tavern pins (reserved venue shows gold, closed-out visits get activated here), collection stats, WirtshausCards. |
| **Spezln** | `RanglisteScreen.jsx` | Gamified podium + leaderboard, switchable by Hoibe / Abende / Wirtshäuser and season. |
| **Kasse** | `KasseScreen.jsx` | Vereinskasse balance (live), open-penalty warning, transaction list. **Ausgabe** books a club expenditure (category + amount, drops the Saldo); **Melden** reports a member. Tap a Forderung to mark **beglichen / offen / aufgehoben**. |

## Termin lifecycle (`TerminScreen.jsx` + `terminStore.js` + `terminSheets.jsx`)
On meeting day a new Termin is agreed and **one member is assigned as planner**. The state machine:
1. **planung** — planner set, no venue → card reads "organisiert von {Name}"; the planner sees **Wirtshaus festlegen** (a Google-Places-style address search, `AddWirtshausSheet`).
2. **reserviert** — venue chosen → "Reserviert" tag, **Zum Kalender** (downloads a real `.ics` with address & time), voting open. (A demo link jumps to the meeting day.)
3. **heute** — "Anmeldung geschlossen" banner; **Besuch abschließen** (`CloseVisitSheet`: per-member Hoiben + Kaiserschmarrn 🥞, your Sterne + comment). Optional late **Absage** triggers the `PenaltyDialog` — a Strafrunde = Hoibe price (Augustiner Stüberl, 3,80 €) × people present, with a mock e-mail.
4. **abgeschlossen** — summary; venue archived & activated on the Karte. **Neuer Termin** restarts the loop.

**Wirtschaftler melden** (`MeldenSheet`, from Hoam & Kasse): pick the member, the Vorwurf, and the Forderung (€). A PayPal link + e-mail go out (mocked) and a Kasse entry appears with status **offen**, manageable via `ForderungDialog`.

`AppShell.jsx` provides the frame, app bar and tab bar, and lifts the shared store (termin, taverns, kasse, sheets, toasts). `PhoneFrame.jsx` is the device bezel. `data.js` holds mock data; `icons.jsx` the inline Lucide-style icons.

## How it's wired
- Components come from the compiled design-system bundle: `window.WirtschaftlnDesignSystem_7e7aff` (loaded via `../../_ds_bundle.js`).
- Each screen file is a plain IIFE that reads that namespace + `window.WN_DATA` + `window.WNIcon` and assigns its component to `window`. They don't share Babel scope, hence the window handoff.

## Notes / placeholders
- Member photos use **pravatar.cc**, tavern photos use **Unsplash** — swap for real member & venue photography.
- The map is a **stylized illustration** (SVG streets + Isar + pins), not a live map tile. Wire to a real map provider for production.
