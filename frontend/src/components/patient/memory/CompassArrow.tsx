import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Magnetometer } from 'expo-sensors';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

// Haversine formula to get bearing from one coordinate to another
function getBearing(startLat: number, startLng: number, destLat: number, destLng: number) {
  const toRad = (deg: number) => deg * Math.PI / 180;
  const toDeg = (rad: number) => rad * 180 / Math.PI;

  const startLatRad = toRad(startLat);
  const destLatRad = toRad(destLat);
  const dLng = toRad(destLng - startLng);

  const y = Math.sin(dLng) * Math.cos(destLatRad);
  const x = Math.cos(startLatRad) * Math.sin(destLatRad) -
            Math.sin(startLatRad) * Math.cos(destLatRad) * Math.cos(dLng);
  
  const brng = toDeg(Math.atan2(y, x));
  return (brng + 360) % 360;
}

export default function CompassArrow({ targetLat, targetLng }: { targetLat?: number, targetLng?: number }) {
  const [heading, setHeading] = useState(0);
  const [bearing, setBearing] = useState(0);

  useEffect(() => {
    if (!targetLat || !targetLng) return;

    let sub: any;
    let locSub: any;

    const start = async () => {
      // Get bearing to object
      const loc = await Location.getCurrentPositionAsync({});
      const b = getBearing(loc.coords.latitude, loc.coords.longitude, targetLat, targetLng);
      setBearing(b);

      // Start compass
      Magnetometer.setUpdateInterval(100);
      sub = Magnetometer.addListener(result => {
        let { x, y } = result;
        let angle = Math.atan2(y, x);
        angle = angle * (180 / Math.PI);
        angle = angle + 90; // Adjust for phone landscape/portrait drift
        angle = (angle + 360) % 360;
        setHeading(angle);
      });
    };
    start();

    return () => {
      if (sub) sub.remove();
    };
  }, [targetLat, targetLng]);

  if (!targetLat || !targetLng) return null;

  // Calculate arrow rotation: it should point to bearing relative to current heading
  const arrowRotation = bearing - heading;

  return (
    <View style={styles.container}>
      <Animated.View style={{ transform: [{ rotate: `${arrowRotation}deg` }] }}>
        <Ionicons name="arrow-up-circle" size={80} color="#3b82f6" />
      </Animated.View>
      <Text style={styles.text}>Turn to find it</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#eff6ff',
    borderRadius: 20,
    marginTop: 10,
    borderWidth: 2,
    borderColor: '#bfdbfe'
  },
  text: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '800',
    color: '#1e3a8a'
  }
});
