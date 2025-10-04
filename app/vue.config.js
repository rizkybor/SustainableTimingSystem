// vue.config.js
module.exports = {
  pluginOptions: {
    electronBuilder: {
      extraResources: [{ from: "public/defaults", to: "defaults" }],
      preload: "src/preload.js",
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
      builderOptions: {
        appId: "com.kpu.sustainabletimingsystem",
        productName: "STiming System 424",
        directories: { buildResources: "assets/icons" },
        extraResources: [{ from: "assets/icons", to: "assets/icons" }],

        mac: {
          icon: "src/assets/icons/icon.png",
          category: "public.app-category.utilities",
        },
        win: {
          icon: "src/assets/icons/icon.ico",
        },
        linux: {
          icon: "src/assets/icons/icon.png",
          target: ["AppImage", "deb", "rpm"],
        },
      },
    },
  },
};
