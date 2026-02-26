import React from 'react';
import {
  Modal,
  View,
  TouchableOpacity,
  StyleSheet,
  Text,
  Platform,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { WebView } from 'react-native-webview';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface FileViewerProps {
  visible: boolean;
  url: string;
  title: string;
  mimeType?: string;
  onClose: () => void;
}

/**
 * In-app file viewer using WebView.
 * Supports videos (mp4, mov, etc.), PDFs, and other documents.
 */
export function FileViewer({ visible, url, title, mimeType = '', onClose }: FileViewerProps) {
  if (!visible) return null;

  const isVideo = mimeType.startsWith('video/') || /\.(mp4|mov|avi|webm|mpeg)$/i.test(url);

  // For videos, wrap in an HTML5 video player for better controls
  const videoHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #000; display: flex; align-items: center; justify-content: center; height: 100vh; }
        video { width: 100%; max-height: 100vh; }
      </style>
    </head>
    <body>
      <video controls autoplay playsinline>
        <source src="${url}" type="${mimeType || 'video/mp4'}">
        Seu navegador não suporta vídeo.
      </video>
    </body>
    </html>
  `;

  return (
    <Modal visible={true} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Icon name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {isVideo ? (
            <WebView
              source={{ html: videoHtml }}
              style={styles.webview}
              allowsInlineMediaPlayback={true}
              mediaPlaybackRequiresUserAction={false}
              javaScriptEnabled={true}
              startInLoadingState={true}
              renderLoading={() => (
                <View style={styles.loading}>
                  <ActivityIndicator size="large" color="#4f46e5" />
                  <Text style={styles.loadingText}>Carregando vídeo...</Text>
                </View>
              )}
            />
          ) : (
            <WebView
              source={{ uri: url }}
              style={styles.webview}
              startInLoadingState={true}
              renderLoading={() => (
                <View style={styles.loading}>
                  <ActivityIndicator size="large" color="#4f46e5" />
                  <Text style={styles.loadingText}>Carregando documento...</Text>
                </View>
              )}
              onError={(syntheticEvent) => {
                const { nativeEvent } = syntheticEvent;
                console.warn('WebView error:', nativeEvent);
              }}
            />
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginHorizontal: 8,
  },
  content: {
    flex: 1,
    backgroundColor: '#000',
  },
  webview: {
    flex: 1,
  },
  loading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
});
