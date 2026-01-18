import { useState, useCallback } from 'react';

interface UseStatusBarOverlayProps {
  threshold?: number;
}

export const useStatusBarOverlay = ({ threshold = 50 }: UseStatusBarOverlayProps = {}) => {
  const [state, setState] = useState({
    showStatusBarOverlay: false,
    statusBarOpacity: 0
  });

  const handleScroll = useCallback((event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;

    // Calculate opacity based on scroll position (0 to 1 over threshold distance)
    const opacity = Math.min(Math.max(offsetY, 0) / threshold, 1);

    console.log('Setting opacity to:', opacity);

    setState({
      showStatusBarOverlay: offsetY > 0,
      statusBarOpacity: opacity
    });
  }, [threshold]);

  return {
    showStatusBarOverlay: state.showStatusBarOverlay,
    statusBarOpacity: state.statusBarOpacity,
    handleScroll,
  };
};