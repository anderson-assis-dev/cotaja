import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function SkeletonBlock({ width = '100%', height = 16, borderRadius = 8, style }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <Animated.View
      style={[
        { width: width as any, height, borderRadius, backgroundColor: '#e5e7eb', opacity },
        style,
      ]}
    />
  );
}

export function OrderCardSkeleton() {
  return (
    <View style={sk.card}>

      <SkeletonBlock width="75%" height={20} style={{ marginBottom: 10 }} />


      <View style={[sk.row, { marginBottom: 16, gap: 6 }]}>
        <SkeletonBlock width={28} height={28} borderRadius={14} />
        <SkeletonBlock width={140} height={26} borderRadius={12} />
        <SkeletonBlock width={80} height={26} borderRadius={12} />
      </View>


      <SkeletonBlock width="55%" height={14} style={{ marginBottom: 16 }} />


      <View style={[sk.row, { marginBottom: 16, gap: 4 }]}>
        <SkeletonBlock width={16} height={16} borderRadius={4} />
        <SkeletonBlock width="80%" height={14} />
      </View>


      <View style={sk.proposalBox}>
        <SkeletonBlock width="60%" height={16} style={{ marginBottom: 8 }} />
        <SkeletonBlock width="85%" height={14} />
      </View>


      <View style={[sk.row, { justifyContent: 'space-between' }]}>
        <SkeletonBlock width={100} height={14} />
        <SkeletonBlock width={110} height={14} />
      </View>
    </View>
  );
}

export function OrderListSkeleton() {
  return (
    <View>
      <OrderCardSkeleton />
      <OrderCardSkeleton />
      <OrderCardSkeleton />
    </View>
  );
}

export function SearchSkeleton() {
  return (
    <View style={sk.list}>
      <SkeletonBlock width="100%" height={48} borderRadius={12} />
      <SkeletonBlock width={120} height={18} style={{ marginTop: 20 }} />
      <View style={[sk.row, { marginTop: 12, flexWrap: 'wrap', gap: 12 }]}>
        {[1, 2, 3, 4, 5, 6].map(i => (
          <SkeletonBlock key={i} width={100} height={80} borderRadius={12} />
        ))}
      </View>
      <SkeletonBlock width={160} height={18} style={{ marginTop: 24 }} />
      {[1, 2].map(i => (
        <View key={i} style={[sk.card, { marginTop: 12 }]}>
          <View style={sk.row}>
            <SkeletonBlock width={48} height={48} borderRadius={24} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <SkeletonBlock width="60%" height={16} />
              <SkeletonBlock width="40%" height={12} style={{ marginTop: 6 }} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

export function HomeScreenSkeleton() {
  return (
    <View style={sk.homeContainer}>
      <View style={[sk.homeHeader, { backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }]}>
        <SkeletonBlock width="45%" height={14} style={{ marginBottom: 6 }} borderRadius={6} />
        <SkeletonBlock width="60%" height={26} style={{ marginBottom: 4 }} borderRadius={6} />
        <SkeletonBlock width="75%" height={14} style={{ marginBottom: 16 }} borderRadius={6} />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <SkeletonBlock width="85%" height={44} borderRadius={12} />
          <SkeletonBlock width={40} height={40} borderRadius={20} />
        </View>
      </View>

      <View style={sk.homeContent}>
        <View style={[sk.homeGrid, { marginBottom: 20 }]}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <View key={i} style={sk.clientCategoryItem}>
              <SkeletonBlock width={52} height={52} borderRadius={26} />
              <SkeletonBlock width="80%" height={12} style={{ marginTop: 8 }} borderRadius={4} />
            </View>
          ))}
        </View>

        <SkeletonBlock width="100%" height={140} borderRadius={20} style={{ marginBottom: 20 }} />

        <View style={[sk.row, { justifyContent: 'space-around', marginBottom: 20 }]}>
          <SkeletonBlock width={80} height={14} borderRadius={6} />
          <SkeletonBlock width={140} height={14} borderRadius={6} />
          <SkeletonBlock width={110} height={14} borderRadius={6} />
        </View>

        <SkeletonBlock width={140} height={18} style={{ marginBottom: 12 }} borderRadius={6} />
        <OrderCardSkeleton />
      </View>
    </View>
  );
}

export function ProviderHomeScreenSkeleton() {
  return (
    <View style={sk.homeContainer}>
      <View style={[sk.homeHeader, { backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }]}>
        <SkeletonBlock width="30%" height={14} style={{ marginBottom: 6 }} borderRadius={6} />
        <SkeletonBlock width="50%" height={26} style={{ marginBottom: 4 }} borderRadius={6} />
        <SkeletonBlock width="70%" height={14} style={{ marginBottom: 16 }} borderRadius={6} />
        <SkeletonBlock width="100%" height={44} borderRadius={12} />
      </View>

      <View style={sk.homeContent}>
        <SkeletonBlock width="100%" height={56} borderRadius={12} style={{ marginBottom: 16 }} />

        <SkeletonBlock width="100%" height={140} borderRadius={20} style={{ marginBottom: 8 }} />
        <View style={[sk.row, { justifyContent: 'center', gap: 8, marginBottom: 20 }]}>
          {[1, 2, 3].map(i => (
            <SkeletonBlock key={i} width={8} height={8} borderRadius={4} />
          ))}
        </View>

        <SkeletonBlock width={80} height={16} style={{ marginBottom: 12 }} borderRadius={6} />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {[1, 2, 3, 4, 5].map(i => (
            <View key={i} style={{ alignItems: 'center', gap: 6 }}>
              <SkeletonBlock width={48} height={48} borderRadius={24} />
              <SkeletonBlock width={44} height={11} borderRadius={4} />
            </View>
          ))}
        </View>

        <View style={[sk.row, { justifyContent: 'space-around', marginTop: 20, marginBottom: 20, backgroundColor: '#ffffff', borderRadius: 10, padding: 12 }]}>
          <SkeletonBlock width={70} height={14} borderRadius={6} />
          <SkeletonBlock width={80} height={14} borderRadius={6} />
          <SkeletonBlock width={60} height={14} borderRadius={6} />
        </View>

        <SkeletonBlock width={150} height={18} style={{ marginBottom: 12 }} borderRadius={6} />
        <OrderCardSkeleton />
        <OrderCardSkeleton />
      </View>
    </View>
  );
}

const sk = StyleSheet.create({
  homeContainer: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  homeHeaderBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: '#4f46e5',
  },
  homeHeader: {
    backgroundColor: 'transparent',
    paddingHorizontal: 24,
    paddingTop: 70,
    paddingBottom: 28,
  },
  homeContent: {
    backgroundColor: '#f3f4f6',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    flex: 1,
  },
  providerStatsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  providerStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  providerEarnings: {
    backgroundColor: '#eef2ff',
    borderRadius: 8,
    padding: 16,
  },
  homeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  clientCategoryItem: {
    width: '23%',
    alignItems: 'center',
    marginBottom: 16,
  },
  homeServiceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    width: '48%',
    borderLeftWidth: 4,
    borderLeftColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 2,
  },
  homeProposalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  list: {
    padding: 20,
  },
  proposalBox: {
    backgroundColor: '#f0f4ff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#e5e7eb',
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
