import React, { useState, useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  StatusBar,
  Platform,
  Text,
} from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Config from 'react-native-config';
import { getAttachmentUrl } from '../utils/attachmentHelpers';

interface ImageViewerProps {
  visible: boolean;
  images: string[];
  initialIndex?: number;
  onClose: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export function ImageViewer({ visible, images, initialIndex = 0, onClose }: ImageViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const scrollViewRef = useRef<ScrollView>(null);
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);

  // Sync currentIndex and scroll position when viewer opens or initialIndex changes
  useEffect(() => {
    if (visible) {
      setCurrentIndex(initialIndex);
      scale.value = 1;
      savedScale.value = 1;
      // Scroll to the correct image after a brief delay for layout
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ x: initialIndex * SCREEN_WIDTH, animated: false });
      }, 50);
    }
  }, [visible, initialIndex]);

  // Don't render anything when not visible - prevents GestureDetector from capturing touches
  if (!visible) {
    return null;
  }

  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = savedScale.value * event.scale;
    })
    .onEnd(() => {
      if (scale.value < 1) {
        scale.value = withSpring(1);
        savedScale.value = 1;
      } else if (scale.value > 3) {
        scale.value = withSpring(3);
        savedScale.value = 3;
      } else {
        savedScale.value = scale.value;
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    setCurrentIndex(index);
  };

  const handleClose = () => {
    scale.value = withTiming(1);
    savedScale.value = 1;
    onClose();
  };

  const getImageUrl = (imagePath: string) => {
    // Base64 data URIs and http URLs are already complete
    if (imagePath.startsWith('data:') || imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    // Use shared helper for path-based URLs
    return getAttachmentUrl({ path: imagePath });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Icon name="close" size={28} color="#ffffff" />
          </TouchableOpacity>
          <View style={styles.counterContainer}>
            <View style={styles.counter}>
              <Icon name="image" size={20} color="#ffffff" style={styles.counterIcon} />
              <View style={styles.counterTextContainer}>
                <Text style={styles.counterText}>
                  {currentIndex + 1} / {images.length}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Image Gallery */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {images.map((image, index) => (
            <View key={index} style={styles.imageContainer}>
              <GestureDetector gesture={pinchGesture}>
                <Animated.View style={[styles.imageWrapper, animatedStyle]}>
                  <Image
                    source={{ uri: getImageUrl(image) }}
                    style={styles.image}
                    resizeMode="contain"
                  />
                </Animated.View>
              </GestureDetector>
            </View>
          ))}
        </ScrollView>

        {/* Pagination Dots */}
        {images.length > 1 && (
          <View style={styles.pagination}>
            {images.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.paginationDot,
                  currentIndex === index && styles.paginationDotActive,
                ]}
              />
            ))}
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  counter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  counterIcon: {
    marginRight: 6,
  },
  counterTextContainer: {
    minWidth: 50,
  },
  counterText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageWrapper: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.8,
  },
  pagination: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: '#ffffff',
    width: 24,
  },
});
