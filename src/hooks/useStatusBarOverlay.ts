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

    const opacity = Math.min(Math.max(offsetY, 0) / threshold, 1);

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