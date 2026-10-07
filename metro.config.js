const { getDefaultConfig } = require('@expo/metro-config');

// Custom Metro configuration for bundle optimization
module.exports = (async () => {
  const {
    resolver: { sourceExts, assetExts },
  } = await getDefaultConfig(__dirname);

  return {
    transformer: {
      babelTransformerPath: require.resolve('@react-native/metro-babel-transformer'),
      assetPlugins: ['expo-asset-tools'],
    },
    
    resolver: {
      assetExts: [...assetExts, 'db', 'mp3', 'ttf', 'obj', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'],
      sourceExts: [...sourceExts, 'jsx', 'js', 'ts', 'tsx', 'json'],
      
      // Enable module resolution aliases
      alias: {
        '@': './client',
        '@shared': './shared',
      },
    },

    serializer: {
      getModulesRunBeforeMainModule: () => [
        require.resolve('react-native/Libraries/Core/InitializeCore'),
      ],
    },

    // Minification configuration
    minifierConfig: {
      keep_fnames: true,
      mangle: {
        keep_fnames: true,
      },
      output: {
        comments: false,
        ascii_only: true,
      },
    },

    // Bundle splitting configuration
    server: {
      enhanceMiddleware: (middleware) => {
        return (req, res, next) => {
          // Add custom headers for caching
          res.setHeader('Cache-Control', 'public, max-age=31536000');
          return middleware(req, res, next);
        };
      },
    },

    // Development vs production configuration
    isFlowEnabled: __DEV__,
    isTurboModuleEnabled: true,
    
    // Enable source maps in development
    enableBabelRuntime: !__DEV__,
    
    // Bundle optimization
    optimizePackageImports: [
      'react-native',
      '@expo/vector-icons',
      '@react-navigation',
      'react-native-reanimated',
    ],
  };
})();
