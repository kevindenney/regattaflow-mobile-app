module.exports = function (api) {
  api.cache(true);

  const plugins = [
    [
      "module-resolver",
      {
        root: ["./"],
        alias: {
          "@": "./",
          "tailwind.config": "./tailwind.config.js",
        },
      },
    ],
    // Transform import.meta for compatibility with Metro bundler
    "babel-plugin-transform-import-meta",
  ];

  if (process.env.NODE_ENV === "production") {
    plugins.push(["transform-remove-console", { exclude: ["error", "warn"] }]);
  }

  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins,
  };
};
