const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

const defaultConfig = getDefaultConfig(__dirname);

// Placeholder minúsculo usado no lugar dos modelos .onnx que NÃO precisam ser
// empacotados pelo Metro (ver resolveRequest abaixo).
const STUB_ONNX = path.resolve(__dirname, 'assets/stub.onnx');
// Modelos que o app não usa (só usamos face_detector + liveness_1/2).
const UNUSED_ONNX = /(?:age|gender|face_embedding|face_landmarks)\.onnx$/;

const config = {
  resolver: {
    assetExts: [...defaultConfig.resolver.assetExts, 'PNG', 'JPG', 'JPEG', 'GIF', 'WEBP', 'SVG', 'onnx'],
    resolveRequest: (context, moduleName, platform) => {
      if (moduleName.endsWith('.onnx')) {
        // Android: os modelos são carregados dos assets nativos do APK
        // (copyFileAssets), então NÃO precisam ir no bundle do Metro — evita o
        // download por HTTP em debug (que falha em aparelhos reais).
        // Demais plataformas (iOS): só embutimos os 3 modelos do liveness; os
        // modelos não usados viram stub para enxugar o app.
        if (platform === 'android' || UNUSED_ONNX.test(moduleName)) {
          return context.resolveRequest(context, STUB_ONNX, platform);
        }
      }
      return context.resolveRequest(context, moduleName, platform);
    },
  },
};

module.exports = mergeConfig(defaultConfig, config);
