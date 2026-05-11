const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

const config = {
  resolver: {
    assetExts: [...defaultConfig.resolver.assetExts, 'PNG', 'JPG', 'JPEG', 'GIF', 'WEBP', 'SVG'],
  },
};

module.exports = mergeConfig(defaultConfig, config);
