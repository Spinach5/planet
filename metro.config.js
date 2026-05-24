const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config')
const { getMetroConfig } = require('@tarojs/rn-supporter')

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const path = require('path')
const config = {
  resolver: {
    blockList: [
      // taro-ui styles don't apply to React Native
      /node_modules\/taro-ui\/lib\/style\/.*/,
    ],
    extraNodeModules: {
      // Mock Expo peer dependencies not needed for this project
      'expo-image-picker': path.resolve(__dirname, 'mocks/expo-image-picker'),
      'expo-camera': path.resolve(__dirname, 'mocks/expo-camera'),
      'expo-file-system': path.resolve(__dirname, 'mocks/expo-file-system'),
      'expo-barcode-scanner': path.resolve(__dirname, 'mocks/expo-barcode-scanner'),
      'expo-av': path.resolve(__dirname, 'mocks/expo-av'),
      'expo-brightness': path.resolve(__dirname, 'mocks/expo-brightness'),
      'expo-keep-awake': path.resolve(__dirname, 'mocks/expo-keep-awake'),
      'expo-location': path.resolve(__dirname, 'mocks/expo-location'),
      'expo-sensors': path.resolve(__dirname, 'mocks/expo-sensors'),
      '@bam.tech/react-native-image-resizer': path.resolve(__dirname, 'mocks/@bam.tech/react-native-image-resizer'),
      '@react-native-camera-roll/camera-roll': path.resolve(__dirname, 'mocks/@react-native-camera-roll/camera-roll'),
      '@react-native-community/geolocation': path.resolve(__dirname, 'mocks/@react-native-community/geolocation'),
      'expo': path.resolve(__dirname, 'mocks/expo'),
    },
  },
}

module.exports = (async function () {
  return mergeConfig(getDefaultConfig(__dirname), await getMetroConfig(), config)
})()
