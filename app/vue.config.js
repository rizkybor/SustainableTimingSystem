// vue.config.js
const isLan = process.env.NODE_ENV

const DEV_HOST = isLan ? '27.3.82.50' : 'localhost';
const DEV_PORT = isLan ? 8181 : 8080;

// vue.config.js
module.exports = {
   devServer: {
    host: process.env.DEV_SERVER_HOST || 'localhost',
    port: process.env.DEV_SERVER_PORT || 8080,
    allowedHosts: ['localhost', '127.0.0.1', '172.20.10.7', '27.3.82.50']
  },
  pluginOptions: {
    electronBuilder: {
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
