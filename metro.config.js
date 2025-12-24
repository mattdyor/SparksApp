const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.unstable_enablePackageExports = false;

// Fix for "JSC-safe format" error when using tunnel in Codespaces
config.server = {
    ...config.server,
    rewriteRequestUrl: (url) => {
        if (url.startsWith('/?')) {
            return url.replace('/?', '/index.bundle?');
        }
        return url;
    },
};

module.exports = config;