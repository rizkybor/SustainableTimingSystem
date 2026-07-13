import { ipcRenderer } from "electron";

// Peta nama tim -> countryCode, dimuat sekali dari roster tim penuh
// (teams:get-all sudah mengembalikan dokumen tanpa projection, jadi
// countryCode otomatis ikut begitu tersimpan di teamsCollection).
// Lookup ini sengaja berbasis NAMA saja supaya tidak bergantung pada field
// countryCode yang diteruskan lewat pipeline normalize/build masing-masing
// halaman race/result (field itu banyak yang di-strip di tengah jalan).
export default {
  data() {
    return {
      _teamCountryMap: {},
    };
  },
  created() {
    this.loadTeamCountryMap();
  },
  methods: {
    loadTeamCountryMap() {
      if (typeof ipcRenderer === "undefined") return;
      ipcRenderer.send("teams:get-all");
      ipcRenderer.once("teams:get-all-reply", (_e, res) => {
        var list =
          res && Array.isArray(res.items)
            ? res.items
            : Array.isArray(res)
            ? res
            : [];
        var map = {};
        list.forEach(function (t) {
          var key = String((t && t.nameTeam) || "")
            .trim()
            .toUpperCase();
          if (key && t && t.countryCode) {
            map[key] = String(t.countryCode).toUpperCase();
          }
        });
        this._teamCountryMap = map;
      });
    },
    flagFor(name) {
      var key = String(name || "")
        .trim()
        .toUpperCase();
      return this._teamCountryMap[key] || "";
    },
  },
};
