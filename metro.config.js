const { getDefaultConfig } = require('expo/metro-config');
const { FileStore } = require('metro-cache');
const { withNativeWind } = require('nativewind/metro');
const path = require('node:path');
const { wrapWithReanimatedMetroConfig } = require('react-native-reanimated/metro-config');

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);

// Use Metro cache
config.cacheStores = [
    new FileStore({ root: path.join(projectRoot, 'node_modules', '.cache', 'metro') }),
];

module.exports = wrapWithReanimatedMetroConfig(
    withNativeWind(config, { input: './global.css', inlineRem: 16 })
);
