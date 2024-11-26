module.exports = function (api) {
  api.cache(true);
  const plugins = [];

  return {
    presets: [
      ['babel-preset-expo',
        { jsxImportSource: ['nativewind', "@welldone-software/why-did-you-render"] }],
      'nativewind/babel'
    ],

    plugins,
  };
};
