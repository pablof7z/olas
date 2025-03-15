// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const {
    wrapWithReanimatedMetroConfig,
  } = require('react-native-reanimated/metro-config');
const path = require('path');

// Find the project and workspace directories
const projectRoot = __dirname;
// This can be replaced with `find-yarn-workspace-root`
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch all files in the project directory
config.watchFolders = [workspaceRoot];

// 2. Let Metro know where to resolve packages
config.resolver.nodeModulesPaths = [
    path.resolve(projectRoot, 'node_modules'),
    path.resolve(workspaceRoot, 'node_modules'),
];

// For expo-dev-client
config.resolver.sourceExts = ['jsx', 'js', 'ts', 'tsx', 'json', 'wasm', 'svg'];

module.exports = wrapWithReanimatedMetroConfig(config); 