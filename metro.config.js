const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Configure web-specific settings to fix import.meta issues
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Configure transformer for web compatibility
config.transformer = {
  ...config.transformer,
  hermesParser: false,
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: false,
    },
  }),
};

// Web-specific resolver configuration
config.resolver.alias = {
  ...config.resolver.alias,
  'react-native': 'react-native-web',
};

module.exports = config;