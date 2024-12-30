module.exports = function (api) {
  api.cache(true);

  return {
    presets: [
      ['babel-preset-expo',
        { jsxImportSource: 'nativewind' }],
      'nativewind/babel'
    ],

    plugins: [
      'react-native-worklets-core/plugin',
      'babel-plugin-transform-vite-meta-env',
      '@babel/plugin-syntax-import-attributes'
    ],
  };
};
