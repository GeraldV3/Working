const { getDefaultConfig } = require('@expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.alias = {
    '@': './app',
    '@components': './components',
    '@constants': './constants',
    '@assets': './assets',
    '@lib': './lib' // ✅ Add this
};


module.exports = config;
