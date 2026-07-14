# STiming System 424 — Feature Overview

STiming System 424 is a desktop application (Electron + Vue 2) built for
running **whitewater rafting/kayak competitions**: registering events and
teams, timing races live (manually or via a physical serial timing device),
recording penalties, computing rankings/podiums, and producing official PDF
results — for five distinct race formats in a single event.

## Tech stack

- **Shell**: Electron 13 (desktop app, Node integration enabled in the renderer)
- **UI**: Vue 2 + Vue Router 2 + BootstrapVue
- **Database**: MongoDB (Atlas), accessed only from the Electron main process
- **Media**: Cloudinary (event posters, sponsor/team logos)
- **Hardware**: `serialport` — reads race times directly from a physical timing device over USB
- **Realtime**: `socket.io-client` — an optional remote "Judges Dashboard" broker for judges to submit penalties/times from another device
- **PDF export**: `vue-html2pdf` — every result screen can be printed to an official PDF
- **Icons**: Iconify

## How the app works, end to end

### 1. Unlock
The app opens to a lock screen (`Unlock.vue`). Entering the shared access key
(`VUE_APP_ACCESS_KEY`) sets a `localStorage` flag that the router checks
before allowing any other route. This is a kiosk-style gate for a
single-operator desktop app, not a multi-user security system — there are no
per-user roles or passwords.

### 2. Create an Event
`Create New Event` collects: level/classification, event name, river, full
address, start/end dates, an event poster (uploaded to Cloudinary), and —
critically — which **race categories** this event will run
(Sprint / Head-to-Head / Slalom / Down River Race / Rafting Cross), plus
which divisions, races (men/women), and "initial" categories (age/skill
tiers) are offered. All of this becomes one document in `eventsCollection`.

It also collects the **Comitte** — Technical Delegate, Chief Judge, and Race
Director names — each with an *optional* PNG signature upload (Cloudinary,
`sustainable-js/committee-signature`). Once uploaded, the signature image
prints directly on official result PDFs in place of a blank sign-here line.

Once created, `Event Settings` lets the organizer edit any of these fields
later — including Comitte names/signatures and re-uploading logos — without
needing to recreate the event.

### 3. Register Teams
Teams (name, BIB number, roster info) are created once in a master roster
(`Create Team`) and then **registered** into a specific event + division +
race + initial + format combination from the event's detail page. A team can
be registered into multiple formats/categories within the same event.

From the event detail page's "Registered Teams" table, a **View Details**
button opens a per-registration modal (team info, BIB, status, and — once
timing/results exist — the recorded times/penalties/rank for that specific
race). Separately, every team card (Home page and the "List All Teams" table
in `Create Team`) has its own **View Details** button leading to a global
**Team Details** page (`/team?name=...`) that lists every Event the team has
ever registered into, and — nested under each Event — every Race Category
registration with its Ranked/Score result once available.

A floating **Live Chat** widget is available on every page under an event
(all race screens, settings, results). It's a per-Race-Category group chat
(not 1:1) between the Timing System operator and whichever judges are
assigned to that category via Judges Settings — supports @mention of
assigned judges and plays a sound on incoming messages.

### 4. Configure the race (per event)
Two settings modals apply once per event, shared across every category:
- **Race Settings** — per-format rules: which Head-to-Head "Bouyan" penalty
  stations are active, Slalom's total gate count, DRR's total section count,
  and Rafting Cross's team-per-heat / qualifiers-per-heat / gate-penalty
  toggles.
- **Judges Settings** — assigns which registered user judges which
  station/gate/section for each format, used to build a "who's responsible
  for what" ledger and to power the realtime Judges Dashboard.

### 5. Run the race — five formats, one shared timing model

| Format | Structure | Pairing |
|---|---|---|
| **Sprint** | Individual time trial, whole roster races and is timed independently | n/a |
| **Slalom** | Individual time trial through numbered gates, with per-gate penalties | n/a |
| **Down River Race (DRR)** | Individual time trial through numbered river sections, with per-section penalties | n/a |
| **Head-to-Head (H2H)** | Single-elimination bracket, 2 teams per match, Final + Final B (3rd place) | **Heat-number driven**: whichever 2 teams get the same Heat number become that match's opponents, in every round — not pre-seeded. A team alone in a Heat number auto-advances as a BYE. |
| **Rafting Cross (RX)** | Heat-based knockout, 3–8 teams per heat (configurable), top-K per heat qualify | Snake-seeded into Round 1 heats; subsequent rounds are built from qualifiers |

For every format, race time can be captured **manually** (typed in) or **live
from a connected serial timing device** (start/finish beam triggers appear in
a live feed panel; the operator taps a team's BIB to assign the reading).
Penalties are entered per team/heat/gate and combined with race time into a
final ranked time.

**Heat numbering for H2H and Rafting Cross is shared across an entire
event**: if one category's Round 1 uses Heat 1–6, the next category's Round 1
continues from Heat 7 — numbers never repeat or reset within the same event,
across categories or rounds, so a printed running order is unambiguous for
the whole competition day.

A judge can also submit start/finish/penalty data remotely through the
Judges Dashboard broker (socket.io), which the active race screen applies to
the matching team in real time.

### 6. Results & Overall Score
Each format has its own **Result** page: official ranking table, podium
(for bracket formats), toggle between OFFICIAL/UNOFFICIAL stamp, and a
**Download Result (PDF)** button producing a print-ready, letterhead-style
document (event branding, address, river, signatures for Technical
Delegate/Chief Judge/Race Director).

Every format also contributes its score to a single **Overall Score**
aggregate per team, spanning all formats the team competed in — visible via
"View Overall" and printable through a shared Overall PDF/print modal.

**Rafting Cross** additionally has two report types other formats don't:
a **by-bracket PDF** (every round, every heat, every team's time/penalties/
position for one category) and an **all-categories overall PDF** (one
combined document with a podium + ranked table per RX category in the
event) — for a single "results book" covering every RX category at once.

### 7. Administration
`All Events` lists every event created. `Admin › User Management` manages
the judge/operator accounts used throughout the settings above.

## Known limitations

- The unlock mechanism and admin area are access gates, not real
  authentication — anyone with the shared key has full access to everything,
  including user management.
- A handful of result-retrieval and score-aggregation edge cases are
  currently being reviewed for correctness across formats (see project
  history for specifics) — Sprint, Slalom, and DRR result pages should be
  spot-checked against the database when in doubt about a displayed number.
- Head-to-Head and Down River Race result pages don't yet expose the
  "View Overall" button that Sprint, Slalom, and Rafting Cross have, even
  though their scores are recorded correctly in the background.

## Known issues to fix

Found during a code-review pass; not yet fixed unless noted otherwise.

- **`eventsCollection.participant` is dead/stale data.** `Details/index.vue`'s
  `persistParticipants()` sends an `events-update-participant` IPC message,
  but no `ipcMain.on` handler for that channel exists anywhere in the app —
  it's a silent no-op. The real, live-synced source of "who's registered" is
  `teamsRegisteredCollection` (`upsert-teams-registered` /
  `get-teams-registered`). Anything that still reads `event.participant`
  directly is reading stale/empty data and should be pointed at
  `teamsRegisteredCollection` instead.
- **`HeadToHead.vue` sends `insert-h2h-result` to nowhere.** There's no
  backend handler for that channel; the real H2H result save path is
  `h2h:round:save` / `h2h:rounds:saveMany`. The dead send doesn't break
  anything (fire-and-forget, no listener), but it's confusing leftover code
  worth removing.
- **`getOptionTeamTypes()`'s error-fallback list doesn't match its normal
  list.** In `ipcMainServices.js`, if the DB-backed team-type query throws,
  the fallback offers `{value:"country"}` instead of the real
  `wilayah`/`negara` values used everywhere else (including the
  Level→allowed-type scope map in `Details/index.vue`). If that fallback
  ever fires, the Team Type dropdown would offer a value nothing else in the
  app recognizes.
- **Duplicate teams aren't actually prevented.** `insertTeams.js` has
  duplicate-key error handling for a unique `nameTeam + bibTeam` index, but
  the index creation itself is commented out ("optional, create at DB
  init"). In practice, nothing stops the same team name from being created
  more than once in the master roster.
- **`EventSettings.vue` (and possibly `JudgesSettings.vue`) still leak IPC
  listeners on repeated use.** Their `loadOptions()` registers persistent
  `ipcRenderer.on(...)` listeners for the shared `option-level`/
  `option-categories-*` channels with no cleanup. This is the exact same bug
  already found and fixed in `CreateEvent.vue` (switched to `.once()`) — the
  fix just hasn't been applied to these two yet.
- **Team Details page (`/team`) only shows Ranked/Score, not full timing
  detail.** The per-category "Result" section is sourced from
  `temporaryOverallEventResults` (a cross-category rank/score rollup), not
  the raw per-run start/finish/penalty data — that lives in 5 differently-
  shaped collections (`temporarySprintResult`, `temporarySlalomResult`,
  `temporaryDrrResult`, `h2h_results`, `rx_results`), each with its own
  round/heat-based query logic. Deliberately deferred rather than risking 5
  bespoke, hard-to-verify integrations; worth revisiting if full per-run
  detail is needed on that page.
- **Signature images don't print on every result PDF yet.** Technical
  Delegate & Race Director signature *images* (the new Comitte upload
  feature) currently render on the Sprint, Rafting Cross (all 3 variants),
  and Overall-alltime PDF templates. Slalom, DRR, and Head-to-Head result
  PDFs only ever had a Chief Judge signature slot to begin with (pre-existing
  layout, not something this session broke) — so Technical Delegate/Race
  Director signatures have nowhere to render on those three yet.
