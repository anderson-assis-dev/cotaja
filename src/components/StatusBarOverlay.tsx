import React, { useEffect } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface StatusBarOverlayProps {
  show: boolean;
  opacity?: number;
  backgroundColor?: string;
  forceLight?: boolean;
}

export const StatusBarOverlay: React.FC<StatusBarOverlayProps> = ({
  show,
  opacity = 0,
  backgroundColor = '#4f46e5',
  forceLight = false
}) => {
  const insets = useSafeAreaInsets();

  console.log('StatusBarOverlay render - show:', show, 'opacity:', opacity);

  useEffect(() => {
    // Change status bar style based on overlay visibility and opacity
    if (forceLight) {
      StatusBar.setBarStyle('light-content', true);
    } else if (show && opacity > 0.5) {
      StatusBar.setBarStyle('light-content', true);
    } else if (!show || opacity <= 0.5) {
      StatusBar.setBarStyle('dark-content', true);
    }
  }, [show, opacity, forceLight]);

  if (!show) return null;

  return (
    <View
      style={[
        styles.statusBarOverlay,
        {
          height: insets.top,
          backgroundColor,
          opacity,
        },
      ]}
    />
  );
};

const styles = StyleSheet.create({
  statusBarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
  },
});