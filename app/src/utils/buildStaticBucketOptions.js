// src/utils/buildStaticBucketOptions.js
//
// Bangun daftar kombinasi statis Divisi x Race x Initial dari config event
// (categoriesDivision/categoriesRace/categoriesInitial) — BUKAN dari tim
// yang benar2 terdaftar, sama seperti buildStaticSprintOptions()/
// buildStaticRxOptions()/buildSlalomOptions() dkk yang sudah ada duluan di
// tiap halaman Race Detail (SprintRace.vue/HeadToHead.vue/SlalomRace.vue/
// DownRiverRace.vue/RaftingCross.vue) — supaya switcher "Switch <Category>
// Category" di halaman Result (Sprint/H2H/Slalom/DRR/RX) berperilaku identik
// dgn switcher yang sama di halaman Race Detail-nya masing-masing, bukan
// versi lain yang berbeda logic.

const DEFAULT_DIVISIONS = [
  { id: "1", name: "R4" },
  { id: "2", name: "R6" },
];
const DEFAULT_RACES = [
  { id: "1", name: "MEN" },
  { id: "2", name: "WOMEN" },
];
const DEFAULT_INITIALS = [
  { id: "1", name: "YOUTH" },
  { id: "2", name: "JUNIOR" },
  { id: "3", name: "OPEN" },
];

export function buildStaticBucketOptions(eventInfo, eventId) {
  const ev = eventInfo && typeof eventInfo === "object" ? eventInfo : {};
  const eid = String(eventId || "");

  const divs =
    Array.isArray(ev.categoriesDivision) && ev.categoriesDivision.length
      ? ev.categoriesDivision.map((d) => ({
          id: String(d.value),
          name: String(d.name),
        }))
      : DEFAULT_DIVISIONS;
  const races =
    Array.isArray(ev.categoriesRace) && ev.categoriesRace.length
      ? ev.categoriesRace.map((r) => ({
          id: String(r.value),
          name: String(r.name),
        }))
      : DEFAULT_RACES;
  const inits =
    Array.isArray(ev.categoriesInitial) && ev.categoriesInitial.length
      ? ev.categoriesInitial.map((i) => ({
          id: String(i.value),
          name: String(i.name),
        }))
      : DEFAULT_INITIALS;

  const bucketOptions = [];
  const bucketMap = Object.create(null);

  divs.forEach((div) => {
    races.forEach((race) => {
      inits.forEach((init) => {
        const key = [eid, init.id, race.id, div.id].join("|");
        const text = `${div.name} ${race.name} – ${init.name}`;
        bucketOptions.push({ value: key, text });
        bucketMap[key] = {
          eventId: eid,
          initialId: init.id,
          raceId: race.id,
          divisionId: div.id,
          initialName: init.name,
          raceName: race.name,
          divisionName: div.name,
        };
      });
    });
  });

  return { initials: inits, bucketOptions, bucketMap };
}
