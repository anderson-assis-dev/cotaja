// Módulos de terceiros sem tipos próprios.
declare module 'react-native-push-notification';

// Assets de modelo ONNX importados via require().
declare module '*.onnx' {
  const value: number;
  export default value;
}
