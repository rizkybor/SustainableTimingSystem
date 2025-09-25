// vue.config.js (di folder yang sama dengan package.json)
module.exports = {
  pluginOptions: {
    electronBuilder: {
      // opsi yang sudah kamu punya
      nodeIntegration: true,
      externals: [
        "serialport",
        "mongodb",
        "@aws-sdk/credential-providers",
        "@smithy/shared-ini-file-loader",
        "@smithy/node-config-provider",
        "@smithy/property-provider",
        "@smithy/credential-provider-imds",
      ],

      // >>> pindahan dari "build" di package.json
      builderOptions: {
        appId: "com.kpu.sustainabletimingsystem",
        productName: "Sustainable-Timing-System",

        // lokasi ikon di ROOT project (bukan di src)
        directories: { buildResources: "assets/icons" },

        // pastikan folder icons ikut ke resources saat runtime packaged
        extraResources: [{ from: "assets/icons", to: "assets/icons" }],

        mac: {
          icon: "assets/icons/icon.icns",
          category: "public.app-category.utilities",
        },
        win: {
          icon: "assets/icons/icon.ico",
        },
        linux: {
          icon: "assets/icons/icon.png",
          target: ["AppImage", "deb", "rpm"],
        },

        // (opsional) kalau punya native module lain
        // asarUnpack: ["**/node_modules/@serialport/**"]
      },
    },
  },
};
