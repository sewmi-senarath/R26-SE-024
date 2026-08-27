/**
 * Object Navigation Screen - Expo Go Compatible
 *
 * - Real-time GPS polling (every 3s) with live distance counter
 * - Animated compass needle points toward the object
 * - Voice distance milestones (50m / 20m / 10m / 5m / arrived)
 * - "Open in Maps" → opens native Apple Maps / Google Maps with object pin
 * - No react-native-maps dependency required
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Animated, Linking, Platform,
  Easing
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import * as Speech from 'expo-speech';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

// ── Haversine distance (metres) ──────────────────────────────────────────────
function distanceMetres(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Bearing from user to object (degrees) ───────────────────────────────────
function bearingDeg(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLng = rad(lng2 - lng1);
  const y = Math.sin(dLng) * Math.cos(rad(lat2));
  const x =
    Math.cos(rad(lat1)) * Math.sin(rad(lat2)) -
    Math.sin(rad(lat1)) * Math.cos(rad(lat2)) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function formatDist(m: number): string {
  if (m < 2) return '< 1 m';
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(1)} km`;
}

const THRESHOLDS = [50, 20, 10, 5, 2];

export default function NavigateScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    objectName: string;
    objLat: string;
    objLng: string;
    roomLabel: string;
    locationDetail: string;
    timeLabel: string;
  }>();

  const objLat = parseFloat(params.objLat || '0');
  const objLng = parseFloat(params.objLng || '0');
  const hasGPS = !isNaN(objLat) && !isNaN(objLng) && objLat !== 0;

  const [userPos, setUserPos]     = useState<{ lat: number; lng: number } | null>(null);
  const [distance, setDistance]   = useState<number | null>(null);
  const [bearing, setBearing]     = useState<number>(0);
  const [arrived, setArrived]     = useState(false);
  const [tracking, setTracking]   = useState(false);
  const [gpsError, setGpsError]   = useState('');

  const watchRef          = useRef<Location.LocationSubscription | null>(null);
  const trackingRef       = useRef(false);
  const spokenThresholds  = useRef<Set<number>>(new Set());
  const lastSpoken        = useRef<number>(Infinity);

  // Animated needle rotation
  const needleAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim  = useRef(new Animated.Value(1)).current;

  // Colour based on distance
  const distColour =
    distance === null ? '#64748b' :
    arrived           ? '#22c55e' :
    distance <= 10    ? '#22c55e' :
    distance <= 30    ? '#f59e0b' :
    '#ef4444';

  // Pulse animation when close
  useEffect(() => {
    if (distance !== null && distance <= 10 && !arrived) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [distance, arrived]);

  const rotateTo = useCallback((deg: number) => {
    Animated.timing(needleAnim, {
      toValue: deg,
      duration: 500,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [needleAnim]);

  const speakMilestone = useCallback((metres: number) => {
    if (Math.abs(lastSpoken.current - metres) < 1) return;
    for (const t of THRESHOLDS) {
      if (metres <= t && !spokenThresholds.current.has(t)) {
        spokenThresholds.current.add(t);
        Speech.stop();
        const msg =
          metres <= 2
            ? `You have arrived! Your ${params.objectName} should be right here. Look around carefully.`
            : `You are ${formatDist(metres)} away from your ${params.objectName}. Keep going towards ${params.roomLabel}.`;
        Speech.speak(msg, { language: 'en-US', rate: 0.88 });
        lastSpoken.current = metres;
        if (metres <= 2) setArrived(true);
        return;
      }
    }
    lastSpoken.current = metres;
  }, [params.objectName, params.roomLabel]);

  const startTracking = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setGpsError('Location permission denied. Enable it in Settings to navigate.');
      return;
    }
    setTracking(true);
    trackingRef.current = true;

    // Initial fix
    try {
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude: lat, longitude: lng } = pos.coords;
      setUserPos({ lat, lng });

      if (hasGPS) {
        const d = distanceMetres(lat, lng, objLat, objLng);
        const b = bearingDeg(lat, lng, objLat, objLng);
        setDistance(d);
        setBearing(b);
        rotateTo(b);
        Speech.speak(
          `Navigation started. Your ${params.objectName} is ${formatDist(d)} away in the ${params.roomLabel}.`,
          { language: 'en-US', rate: 0.88 }
        );
      }
    } catch {}

    // Watch position every 3 seconds
    watchRef.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, timeInterval: 3000, distanceInterval: 1 },
      (loc) => {
        if (!trackingRef.current) return;
        const { latitude, longitude } = loc.coords;
        setUserPos({ lat: latitude, lng: longitude });
        if (hasGPS) {
          const d = distanceMetres(latitude, longitude, objLat, objLng);
          const b = bearingDeg(latitude, longitude, objLat, objLng);
          setDistance(d);
          setBearing(b);
          rotateTo(b);
          speakMilestone(d);
        }
      }
    );
  }, [hasGPS, objLat, objLng, params.objectName, params.roomLabel, rotateTo, speakMilestone]);

  useEffect(() => {
    startTracking();
    return () => {
      trackingRef.current = false;
      watchRef.current?.remove();
      Speech.stop();
    };
  }, []);

  const stopNav = () => {
    trackingRef.current = false;
    watchRef.current?.remove();
    Speech.stop();
    router.back();
  };

  // Open native Maps app with object pin
  const openInMaps = () => {
    if (!hasGPS) return;
    const label = encodeURIComponent(params.objectName || 'Object');
    const url = Platform.OS === 'ios'
      ? `maps://?ll=${objLat},${objLng}&q=${label}`
      : `geo:${objLat},${objLng}?q=${objLat},${objLng}(${label})`;
    Linking.openURL(url).catch(() => {
      // Fallback to Google Maps web if native not available
      Linking.openURL(
        `https://www.google.com/maps/search/?api=1&query=${objLat},${objLng}`
      );
    });
  };

  const spinDeg = needleAnim.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Header ────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={stopNav}>
          <Ionicons name="arrow-back" size={20} color="#f1f5f9" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Finding: <Text style={{ color: '#f59e0b', textTransform: 'capitalize' }}>{params.objectName}</Text>
          </Text>
          <Text style={styles.headerSub} numberOfLines={1}>
            {params.roomLabel}{params.locationDetail ? ` · ${params.locationDetail}` : ''}
            {params.timeLabel ? `  ·  ${params.timeLabel}` : ''}
          </Text>
        </View>
        {/* Open in native Maps app */}
        {hasGPS && (
          <TouchableOpacity style={styles.mapsBtn} onPress={openInMaps}>
            <Ionicons name="map" size={16} color="#3b82f6" />
            <Text style={styles.mapsBtnText}>Maps</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Distance Banner ───────────────────────────────────────── */}
      <Animated.View style={[styles.distanceBanner, { borderColor: distColour, transform: [{ scale: pulseAnim }] }]}>
        {arrived ? (
          <View style={styles.distRow}>
            <Ionicons name="checkmark-circle" size={40} color="#22c55e" />
            <View>
              <Text style={[styles.distValue, { color: '#22c55e' }]}>Arrived!</Text>
              <Text style={styles.distSub}>Look around carefully</Text>
            </View>
          </View>
        ) : (
          <View style={styles.distRow}>
            <Ionicons name="navigate" size={28} color={distColour} />
            <View>
              <Text style={[styles.distValue, { color: distColour }]}>
                {distance !== null ? formatDist(distance) : '--'}
              </Text>
              <Text style={styles.distSub}>to {params.objectName}</Text>
            </View>
          </View>
        )}
      </Animated.View>

      {/* ── Compass ───────────────────────────────────────────────── */}
      <View style={styles.compassContainer}>
        {/* Compass rose background */}
        <View style={styles.compassRose}>
          {['N', 'E', 'S', 'W'].map((dir, i) => (
            <Text key={dir} style={[styles.compassLabel, {
              top: i === 0 ? 8 : i === 2 ? undefined : '43%',
              bottom: i === 2 ? 8 : undefined,
              left: i === 3 ? 8 : i === 1 ? undefined : '43%',
              right: i === 1 ? 8 : undefined,
            }]}>{dir}</Text>
          ))}

          {/* Animated needle */}
          <Animated.View style={[styles.needle, { transform: [{ rotate: spinDeg }] }]}>
            {/* Arrow pointing to object */}
            <View style={styles.needleUp} />
            <View style={styles.needleDot} />
            <View style={styles.needleDown} />
          </Animated.View>

          {/* Centre dot */}
          <View style={styles.centreDot} />
        </View>

        <Text style={styles.compassHint}>
          {!tracking
            ? 'Getting GPS…'
            : !hasGPS
            ? 'No GPS saved for this object'
            : arrived
            ? '✅ You have arrived!'
            : `Needle points to your ${params.objectName}`}
        </Text>
      </View>

      {/* ── Milestone Progress ───────────────────────────────────── */}
      {hasGPS && distance !== null && (
        <View style={styles.milestones}>
          {THRESHOLDS.slice().reverse().map(t => {
            const reached = distance <= t;
            return (
              <View key={t} style={styles.milestone}>
                <View style={[styles.milestoneDot, reached && { backgroundColor: '#22c55e' }]} />
                <Text style={[styles.milestoneText, reached && styles.milestoneReached]}>{t}m</Text>
              </View>
            );
          })}
          <View style={styles.milestone}>
            <View style={[styles.milestoneDot, arrived && { backgroundColor: '#22c55e' }]} />
            <Text style={[styles.milestoneText, arrived && styles.milestoneReached]}>🎯</Text>
          </View>
        </View>
      )}

      {/* ── No GPS saved warning ─────────────────────────────────── */}
      {!hasGPS && (
        <View style={styles.noGpsBox}>
          <Ionicons name="location-outline" size={32} color="#f59e0b" />
          <Text style={styles.noGpsText}>
            No GPS coordinates saved for this object yet.{'\n'}
            Scan it with the camera and it will save the location.
          </Text>
        </View>
      )}

      {/* ── Bottom Controls ──────────────────────────────────────── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.stopBtn} onPress={stopNav}>
          <Ionicons name="stop-circle" size={18} color="#ef4444" />
          <Text style={styles.stopBtnText}>Stop</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.speakBtn}
          onPress={() => {
            Speech.stop();
            if (distance !== null) {
              Speech.speak(
                `Your ${params.objectName} is ${formatDist(distance)} away in the ${params.roomLabel}.`,
                { language: 'en-US', rate: 0.88 }
              );
            } else {
              Speech.speak('Getting your location, please wait.', { language: 'en-US', rate: 0.88 });
            }
          }}
        >
          <Ionicons name="volume-high" size={18} color="#3b82f6" />
          <Text style={styles.speakBtnText}>Speak Distance</Text>
        </TouchableOpacity>

        {hasGPS && (
          <TouchableOpacity style={styles.mapsFullBtn} onPress={openInMaps}>
            <Ionicons name="navigate" size={18} color="#a855f7" />
            <Text style={styles.mapsFullBtnText}>Open Maps</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Loading overlay */}
      {!tracking && !gpsError && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Getting your location...</Text>
        </View>
      )}

      {/* GPS error overlay */}
      {!!gpsError && (
        <View style={styles.errorOverlay}>
          <Ionicons name="location-outline" size={40} color="#f87171" />
          <Text style={styles.errorText}>{gpsError}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={startTracking}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 14, paddingBottom: 10,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { color: '#f1f5f9', fontSize: 16, fontWeight: '900' },
  headerSub: { color: '#64748b', fontSize: 11, marginTop: 2 },
  mapsBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#1e293b', paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 12, borderWidth: 1, borderColor: '#3b82f6',
  },
  mapsBtnText: { color: '#3b82f6', fontWeight: '700', fontSize: 12 },

  distanceBanner: {
    marginHorizontal: 16, marginBottom: 16,
    backgroundColor: '#1e293b', borderRadius: 24, padding: 20,
    borderWidth: 2, alignItems: 'center',
  },
  distRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  distValue: { fontSize: 42, fontWeight: '900', fontVariant: ['tabular-nums'] },
  distSub: { color: '#64748b', fontSize: 14, fontWeight: '600', marginTop: 2 },

  // Compass
  compassContainer: { alignItems: 'center', marginBottom: 20 },
  compassRose: {
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: '#1e293b', borderWidth: 2, borderColor: '#334155',
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  compassLabel: {
    position: 'absolute', color: '#475569',
    fontSize: 14, fontWeight: '900',
  },
  needle: { position: 'absolute', alignItems: 'center', justifyContent: 'center', width: 8, height: 160 },
  needleUp: { width: 0, height: 0, borderLeftWidth: 4, borderRightWidth: 4, borderBottomWidth: 70, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: '#ef4444' },
  needleDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#1e293b', borderWidth: 2, borderColor: '#94a3b8', marginVertical: 2 },
  needleDown: { width: 0, height: 0, borderLeftWidth: 4, borderRightWidth: 4, borderTopWidth: 70, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: '#3b82f6' },
  centreDot: { position: 'absolute', width: 10, height: 10, borderRadius: 5, backgroundColor: '#f1f5f9' },
  compassHint: { color: '#475569', fontSize: 12, fontWeight: '600', marginTop: 12, textAlign: 'center' },

  // Milestones
  milestones: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 12, marginHorizontal: 20, marginBottom: 16,
    backgroundColor: '#1e293b', borderRadius: 16, padding: 14,
  },
  milestone: { alignItems: 'center', gap: 4 },
  milestoneDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#334155' },
  milestoneText: { color: '#475569', fontSize: 10, fontWeight: '700' },
  milestoneReached: { color: '#22c55e' },

  noGpsBox: {
    alignItems: 'center', padding: 30, marginHorizontal: 16,
    backgroundColor: '#1c1917', borderRadius: 20, gap: 12,
    borderWidth: 1, borderColor: '#78350f',
  },
  noGpsText: { color: '#fcd34d', fontSize: 13, fontWeight: '600', textAlign: 'center', lineHeight: 20 },

  bottomBar: { flexDirection: 'row', gap: 10, padding: 16, marginTop: 'auto' },
  stopBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, backgroundColor: '#1e293b', borderRadius: 16, paddingVertical: 14,
    borderWidth: 1, borderColor: '#ef4444',
  },
  stopBtnText: { color: '#ef4444', fontWeight: '900', fontSize: 13 },
  speakBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, backgroundColor: '#1e293b', borderRadius: 16, paddingVertical: 14,
    borderWidth: 1, borderColor: '#3b82f6',
  },
  speakBtnText: { color: '#3b82f6', fontWeight: '900', fontSize: 13 },
  mapsFullBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, backgroundColor: '#1e293b', borderRadius: 16, paddingVertical: 14,
    borderWidth: 1, borderColor: '#a855f7',
  },
  mapsFullBtnText: { color: '#a855f7', fontWeight: '900', fontSize: 13 },

  loadingOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(15,23,42,0.88)', alignItems: 'center', justifyContent: 'center', gap: 14,
  },
  loadingText: { color: '#94a3b8', fontSize: 14, fontWeight: '600' },

  errorOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(15,23,42,0.92)', alignItems: 'center', justifyContent: 'center',
    gap: 16, padding: 40,
  },
  errorText: { color: '#f87171', fontSize: 14, fontWeight: '600', textAlign: 'center', lineHeight: 22 },
  retryBtn: { backgroundColor: '#7f1d1d', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14 },
  retryText: { color: '#fca5a5', fontWeight: '900' },
});
