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

Once created, `Event Settings` lets the organizer edit any of these fields
later, including adding/removing race categories and re-uploading logos —
without needing to recreate the event.

### 3. Register Teams
Teams (name, BIB number, roster info) are created once in a master roster
(`Create Team`) and then **registered** into a specific event + division +
race + initial + format combination from the event's detail page. A team can
be registered into multiple formats/categories within the same event.

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
