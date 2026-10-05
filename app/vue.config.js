// vue.config.js
// .env (tidak di-commit) dibaca saat build: MONGO_URI ditanam ke main process
// lewat DefinePlugin, jadi installer tetap terhubung tanpa kredensial di git.
require("dotenv").config();
const webpack = require("webpack");

module.exports = {
  pluginOptions: {
    electronBuilder: {
      preload: "src/preload.js",
      // Hanya main process (bukan renderer) — rahasia tidak masuk bundle UI.
      chainWebpackMainProcess: (config) => {
        config.plugin("define-build-secrets").use(webpack.DefinePlugin, [
          { __BUILD_MONGO_URI__: JSON.stringify(process.env.MONGO_URI || "") },
        ]);
      },
      nodeIntegration: true,
      // default plugin cuma nge-watch src/background.js utk restart Electron
      // di mode dev — file yang di-require dari situ (services/controllers)
      // tidak ikut ke-watch, jadi perubahan di sana butuh restart manual.
      // Ditambah eksplisit di sini supaya restart Electron OTOMATIS tiap
      // handler IPC / controller backend berubah.
      mainProcessWatch: ["src/services/**/*.js", "src/controllers/**/*.js"],
      externals: [
        "serialport",
        "mongodb",
        "@aws-sdk/credential-providers",
        "@smithy/shared-ini-file-loader",
        "@smithy/node-config-provider",
        "@smithy/property-provider",
        "@smithy/credential-provider-imds",
      ],
      builderOptions: {
        appId: "com.kpu.sustainabletimingsystem",
        productName: "STiming System 424",
        directories: { buildResources: "src/assets/icons" },
        extraResources: [
          { from: "src/assets/icons", to: "assets/icons" },
          {
            from: "BAGAN HEAD TO HEAD CLEAR.pdf",
            to: "docs/BAGAN HEAD TO HEAD CLEAR.pdf",
          },
        ],
        asarUnpack: ["**/*.node"],
        files: [
          "**/*",
          "!node_modules/@serialport/bindings-cpp/build/**",
        ],

        mac: {
          icon: "src/assets/icons/icon.png",
          category: "public.app-category.utilities",
        },
        win: {
          icon: "src/assets/icons/icon.ico",
        },
        nsis: {
          oneClick: false,
          perMachine: true,
          include: "nsis/installer.nsh",
          // Tampilan wizard installer (BMP 24-bit, ukuran wajib persis) —
          // dibuat ulang lewat: python3 scripts/generate-installer-images.py
          installerSidebar: "nsis/assets/installerSidebar.bmp",
          uninstallerSidebar: "nsis/assets/uninstallerSidebar.bmp",
          installerHeader: "nsis/assets/installerHeader.bmp",
          installerIcon: "src/assets/icons/icon.ico",
          uninstallerIcon: "src/assets/icons/icon.ico",
        },
        linux: {
          icon: "src/assets/icons/icon.png",
          target: ["AppImage", "deb", "rpm"],
        },
      },
    },
  },
};
