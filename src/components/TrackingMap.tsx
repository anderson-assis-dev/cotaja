import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View, StyleSheet, ActivityIndicator, Text, TouchableOpacity, Platform, StatusBar,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Navigation, MapPin } from 'lucide-react-native';

interface TrackingMapProps {
  mapToken: string;
  providerLat: number;
  providerLng: number;
  destLat: number;
  destLng: number;
  routePolyline: { latitude: number; longitude: number }[];
  distance?: number;
  duration?: number;
  providerName?: string;
  clientName?: string;
  providerAvatar?: string;
  clientAvatar?: string;
  address?: string;
  isProvider?: boolean;
  onClose: () => void;
}

export default function TrackingMap({
  mapToken,
  providerLat,
  providerLng,
  destLat,
  destLng,
  routePolyline,
  distance,
  duration,
  providerName,
  clientName,
  providerAvatar,
  clientAvatar,
  address,
  isProvider,
  onClose,
}: TrackingMapProps) {
  const insets = useSafeAreaInsets();
  const webViewRef = useRef<WebView>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const initialProviderLat = useRef(providerLat);
  const initialProviderLng = useRef(providerLng);
  const initialPolyline = useRef(
    JSON.stringify(routePolyline.map(p => ({ lat: p.latitude, lng: p.longitude })))
  );

  useEffect(() => {
    StatusBar.setBarStyle('dark-content', true);
    return () => StatusBar.setBarStyle('dark-content', true);
  }, []);

  useEffect(() => {
    if (isMapReady && webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        updateProviderLocation(${providerLat}, ${providerLng});
        true;
      `);
    }
  }, [providerLat, providerLng, isMapReady]);

  useEffect(() => {
    if (isMapReady && webViewRef.current && routePolyline.length > 0) {
      const newPoly = JSON.stringify(
        routePolyline.map(p => ({ lat: p.latitude, lng: p.longitude }))
      );
      webViewRef.current.injectJavaScript(`
        updateRoute(${newPoly});
        true;
      `);
    }
  }, [routePolyline, isMapReady]);

  const formattedDuration = useMemo(() => {
    if (duration == null) return null;
    const mins = Math.round(duration / 60);
    if (mins < 60) return `${mins} min`;
    return `${Math.floor(mins / 60)}h ${mins % 60}min`;
  }, [duration]);

  const formattedDistance = useMemo(() => {
    if (distance == null) return null;
    return `${(distance / 1000).toFixed(1)} km`;
  }, [distance]);

  const safeProviderName = (providerName || 'Prestador').replace(/"/g, '\\"');
  const safeClientName = (clientName || 'Cliente').replace(/"/g, '\\"');
  const safeAddress = (address || '').replace(/"/g, '\\"');
  const providerInitial = (providerName || 'P').charAt(0).toUpperCase();
  const clientInitial = (clientName || 'C').charAt(0).toUpperCase();

  const html = useMemo(() => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; }
    #map { width: 100%; height: 100%; }
    .avatar-marker {
      width: 44px; height: 44px; border-radius: 22px;
      border: 3px solid #fff;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      overflow: hidden; background: #4f46e5;
      display: flex; align-items: center; justify-content: center;
    }
    .avatar-marker.client {
      background: #ef4444;
    }
    .avatar-marker img {
      width: 100%; height: 100%; object-fit: cover;
    }
    .avatar-marker .initial {
      color: #fff; font-size: 18px; font-weight: 700;
      line-height: 38px; text-align: center; width: 100%;
    }

  </style>
  <script src="https://cdn.apple-mapkit.com/mk/5.x.x/mapkit.js"
    crossorigin async
    data-callback="initMap"
    data-token="${mapToken}">
  </script>
  <script>
    var map, providerAnnotation, clientAnnotation, routeOverlay;
    var _followProvider = true;
    var _providerEl = null;
    var _clientEl = null;

    function createAvatarEl(initial, isClient) {
      var el = document.createElement("div");
      el.className = "avatar-marker" + (isClient ? " client" : "");
      el.innerHTML = '<div class="initial">' + initial + '</div>';
      return el;
    }

    function setAvatarImage(el, url) {
      if (!url) return;
      var img = document.createElement("img");
      img.src = url;
      img.onerror = function() {};
      img.onload = function() {
        el.innerHTML = "";
        el.appendChild(img);
      };
    }

    function postMsg(msg) {
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(msg);
      } else if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.reactNative) {
        window.webkit.messageHandlers.reactNative.postMessage(msg);
      }
    }

    function initMap() {
      var providerCoord, clientCoord;
      try {
        mapkit.init({
          authorizationCallback: function(done) {
            done("${mapToken}");
          }
        });

        providerCoord = new mapkit.Coordinate(${initialProviderLat.current}, ${initialProviderLng.current});
        clientCoord = new mapkit.Coordinate(${destLat}, ${destLng});

        map = new mapkit.Map("map", {
          showsCompass: mapkit.FeatureVisibility.Adaptive,
          showsScale: mapkit.FeatureVisibility.Adaptive,
          showsUserLocation: false,
          colorScheme: mapkit.Map.ColorSchemes.Light,
          center: providerCoord,
        });

        map.setCenterAnimated(providerCoord, false);
        try { map.cameraZoomRange = new mapkit.CameraZoomRange(200, 50000); } catch(e) {}
        map.setCameraDistanceAnimated(3000, true);

        map.addEventListener("region-change-start", function(e) {
          if (e.isUserInitiated) _followProvider = false;
        });
      } catch(e) {
        postMsg("ERROR_INIT:" + e.message);
      }

      try {
        var providerEl = createAvatarEl("${providerInitial}", false);
        _providerEl = providerEl;
        providerAnnotation = new mapkit.Annotation(providerCoord, function() {
          return providerEl;
        }, { calloutEnabled: false });

        var clientEl = createAvatarEl("${clientInitial}", true);
        _clientEl = clientEl;
        clientAnnotation = new mapkit.Annotation(clientCoord, function() {
          return clientEl;
        }, { calloutEnabled: false });

        map.addAnnotations([providerAnnotation, clientAnnotation]);
      } catch(e) {
        postMsg("ERROR_ANNOTATIONS:" + e.message);
        try {
          providerAnnotation = new mapkit.MarkerAnnotation(providerCoord, {
            color: "#4f46e5", title: "${safeProviderName}", glyphText: "${providerInitial}",
          });
          clientAnnotation = new mapkit.MarkerAnnotation(clientCoord, {
            color: "#ef4444", title: "${safeClientName}", glyphText: "${clientInitial}",
          });
          map.addAnnotations([providerAnnotation, clientAnnotation]);
        } catch(e2) {
          postMsg("ERROR_FALLBACK:" + e2.message);
        }
      }

      try {
        var polyline = ${initialPolyline.current};
        if (polyline.length > 1) {
          drawRoute(polyline);
        }
        setTimeout(function() {
          fitMapToRoute();
        }, 1500);
      } catch(e) {}

      postMsg("MAP_READY");
    }

    function drawRoute(points) {
      if (routeOverlay) {
        map.removeOverlay(routeOverlay);
      }
      var coords = points.map(function(p) {
        return new mapkit.Coordinate(p.lat, p.lng);
      });
      var style = new mapkit.Style({
        lineWidth: 5,
        strokeColor: "#4f46e5",
        strokeOpacity: 0.85,
        lineCap: "round",
        lineJoin: "round",
      });
      routeOverlay = new mapkit.PolylineOverlay(coords, { style: style });
      map.addOverlay(routeOverlay);
    }

    function updateProviderLocation(lat, lng) {
      var coord = new mapkit.Coordinate(lat, lng);
      providerAnnotation.coordinate = coord;
      if (_followProvider) {
        map.setCenterAnimated(coord, true);
      }
    }

    function updateRoute(points) {
      drawRoute(points);
    }

    function fitMapToRoute() {
      if (!providerAnnotation || !clientAnnotation) return;
      var padding = new mapkit.Padding(80, 40, ${insets.bottom + 80}, 40);
      map.showItems([providerAnnotation, clientAnnotation], { padding: padding, animate: true });
    }


  </script>
</head>
<body>
  <div id="map"></div>
</body>
</html>
  `, []);

  const onMessage = useCallback((event: any) => {
    const msg = event.nativeEvent.data;
    if (msg.startsWith('ERROR_')) {
      console.warn('[TrackingMap WebView]', msg);
    }
    if (msg === 'MAP_READY') {
      setIsMapReady(true);
      if (webViewRef.current) {
        const safeProvider = (providerAvatar || '').replace(/[\r\n]/g, '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        const safeClient = (clientAvatar || '').replace(/[\r\n]/g, '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        webViewRef.current.injectJavaScript(`
          if (_providerEl && "${safeProvider}") setAvatarImage(_providerEl, "${safeProvider}");
          if (_clientEl && "${safeClient}") setAvatarImage(_clientEl, "${safeClient}");
          true;
        `);
      }
    }
  }, [providerAvatar, clientAvatar]);

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html }}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
        onMessage={onMessage}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color="#4f46e5" />
            <Text style={styles.loadingText}>Carregando mapa...</Text>
          </View>
        )}
      />
      <View style={[styles.headerOverlay, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backButton} onPress={onClose} activeOpacity={0.8}>
          <ArrowLeft size={22} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Navigation size={16} color="#4f46e5" />
          <Text style={styles.headerTitle} numberOfLines={1}>
            {isProvider ? 'Trajeto até o cliente' : `${providerName || 'Prestador'} a caminho`}
          </Text>
        </View>
      </View>
      {(formattedDuration || formattedDistance) && (
        <View style={[styles.etaOverlay, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.etaCard}>
            <View style={styles.etaItem}>
              <Navigation size={18} color="#4f46e5" />
              <Text style={styles.etaTime}>{formattedDuration ?? '—'}</Text>
            </View>
            <View style={styles.etaDivider} />
            <View style={styles.etaItem}>
              <MapPin size={16} color="#6b7280" />
              <Text style={styles.etaDist}>{formattedDistance ?? '—'}</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  webview: {
    flex: 1,
  },
  loading: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#6b7280',
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  etaOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  etaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 28,
    gap: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  etaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  etaTime: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  etaDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#e5e7eb',
  },
  etaDist: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
});
