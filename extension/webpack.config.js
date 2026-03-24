const path = require("path");
const fs = require("fs");
const webpack = require("webpack");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = (env = {}) => {
  const isFirefox = env.target === "firefox";
  const version = fs.readFileSync(path.join(__dirname, "..", "VERSION"), "utf-8").trim();

  return {
    entry: {
      "content/kleinanzeigen": "./src/content/kleinanzeigen.ts",
      "content/wg-gesucht": "./src/content/wg-gesucht.ts",
      "content/immowelt": "./src/content/immowelt.ts",
      "content/immoscout": "./src/content/immoscout.ts",
      "background/service-worker": "./src/background/service-worker.ts",
      "popup/popup": "./src/popup/popup.ts",
      "sidebar/sidebar": "./src/sidebar/sidebar.ts",
    },
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "[name].js",
      clean: true,
    },
    resolve: {
      extensions: [".ts", ".js"],
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: "ts-loader",
          exclude: /node_modules/,
        },
      ],
    },
    plugins: [
      new webpack.DefinePlugin({
        __VERSION__: JSON.stringify(version),
      }),
      new CopyWebpackPlugin({
        patterns: [
          {
            from: isFirefox ? "manifest.firefox.json" : "manifest.json",
            to: "manifest.json",
          },
          { from: "src/popup/popup.html", to: "popup/popup.html" },
          { from: "src/popup/popup.css", to: "popup/popup.css" },
          { from: "src/sidebar/sidebar.html", to: "sidebar/sidebar.html" },
          { from: "icons", to: "icons" },
        ],
      }),
    ],
    devtool: "cheap-module-source-map",
  };
};
