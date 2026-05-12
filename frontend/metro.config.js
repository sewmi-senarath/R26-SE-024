const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Add support for TensorFlow.js
config.resolver.extraNodeModules = {
  'react-native-fs': path.resolve(__dirname, 'src/shims/react-native-fs.js'),
};

module.exports = withNativeWind(config, { input: './global.css' });