/* eslint-env node */
/* eslint-disable @typescript-eslint/no-require-imports */
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Exclude android/ios build dirs inside node_modules to avoid ENOSPC errors
// when the inotify watcher limit is reached.
// IMPORTANT: Do NOT block node_modules/*/build/* — expo-router uses build/ as its output dir.
config.resolver.blockList = [
  ...(Array.isArray(config.resolver.blockList) ? config.resolver.blockList : []),
  /node_modules\/.*\/android\/build\/.*/,
  /node_modules\/.*\/ios\/build\/.*/,
];

// Do not watch node_modules at all
config.watchFolders = (config.watchFolders || [])
  .filter((folder) => !folder.includes('node_modules'));

module.exports = config;
