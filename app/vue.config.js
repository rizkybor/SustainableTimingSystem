// vue.config.js
module.exports = {
  pluginOptions: {
    electronBuilder: {
      preload: "src/preload.js",
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
        directories: { buildResources: "assets/icons" },
        extraResources: [{ from: "assets/icons", to: "assets/icons" }],
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
        },
        linux: {
          icon: "src/assets/icons/icon.png",
          target: ["AppImage", "deb", "rpm"],
        },
      },
    },
  },
};
