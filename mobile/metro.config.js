const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

const { resolver } = config;

config.resolver = {
  ...resolver,
  assetExts: [...resolver.assetExts, 'glb', 'gltf', 'fbx', 'png', 'jpg', 'obj'],
  sourceExts: [
    ...resolver.sourceExts,
    'js',
    'jsx',
    'json',
    'ts',
    'tsx',
    'cjs',
    'mjs',
  ],
};

module.exports = config;
