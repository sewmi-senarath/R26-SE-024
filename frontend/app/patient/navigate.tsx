import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Location from 'expo-location';
import * as Speech from 'expo-speech';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Colors } from '../../../src/constants/colors';

export default function ObjectNavigateScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  
  const mapRef = useRef<MapView>(null);
  
  const [userLoc, setUserLoc] = useState<Location.LocationObjectCoords | null>(null);
  const [heading, setHeading] = useState<number>(0);
  const [distance, setDistance] = useState<number | null>(null);

  const objLat = params.objLat ? parseFloat(params.objLat as string) : null;
  const objLng = params.objLng ? parseFloat(params.objLng as string) : null;
  const objectName = params.objectName as string || 'භාණ්ඩය';
  const hasGPS = objLat !== null && objLng !== null && !isNaN(objLat) && !isNaN(objLng);

  useEffect(() => {
    let locSub: Location.LocationSubscription;
    let headSub: Location.LocationSubscription;

    const startTracking = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setUserLoc(loc.coords);

      if (hasGPS) {
        const d = haversineMetres(loc.coords.latitude, loc.coords.longitude, objLat, objLng);
        setDistance(Math.round(d));
      }

      locSub = await Location.watchPositionAsync({ accuracy: Location.Accuracy.High, distanceInterval: 1 }, (loc) => {
        setUserLoc(loc.coords);
        if (hasGPS) {
          const d = haversineMetres(loc.coords.latitude, loc.coords.longitude, objLat, objLng);
          setDistance(Math.round(d));
          
          // Animate Camera to give 3D effect (high pitch)
          mapRef.current?.animateCamera({
             center: loc.coords,
             pitch: 65, // 3D effect
             heading: heading,
             zoom: 19
          }, { duration: 1000 });
        }
      });

      headSub = await Location.watchHeadingAsync((h) => {
        const newHeading = h.trueHeading >= 0 ? h.trueHeading : h.magHeading;
        setHeading(newHeading);
        if (userLoc) {
            mapRef.current?.animateCamera({ heading: newHeading, pitch: 65 }, { duration: 500 });
        }
      });
    };

    startTracking();
    return () => {
      locSub?.remove();
      headSub?.remove();
      Speech.stop();
    };
  }, [hasGPS, objLat, objLng]);

  const haversineMetres = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3;
    const p1 = lat1 * Math.PI/180;
    const p2 = lat2 * Math.PI/180;
    const dp = (lat2-lat1) * Math.PI/180;
    const dl = (lon2-lon1) * Math.PI/180;
    const a = Math.sin(dp/2) * Math.sin(dp/2) +
              Math.cos(p1) * Math.cos(p2) *
              Math.sin(dl/2) * Math.sin(dl/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const speakDirections = () => {
    if (!distance) return;
    if (distance < 3) {
      Speech.speak(`Obe ${objectName} den langama thiyenawa! Wata-pita balanna.`, { language: 'en-US', rate: 0.85 });
    } else {
      Speech.speak(`Obe ${objectName} meter ${distance} k durin thiyenne. Sithiyame eethalaya dige yanna.`, { language: 'en-US', rate: 0.85 });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>3D සිතියම - {objectName}</Text>
      </View>

      <View style={styles.mapContainer}>
        {hasGPS ? (
          <MapView
            ref={mapRef}
            style={styles.map}
            showsUserLocation={false} // We use a custom avatar marker
            showsCompass={false}
            pitchEnabled={true}
            initialRegion={{
              latitude: userLoc?.latitude || objLat,
              longitude: userLoc?.longitude || objLng,
              latitudeDelta: 0.001,
              longitudeDelta: 0.001,
            }}
          >
            {userLoc && (
              <>
                {/* 3D Person Avatar Marker */}
                <Marker 
                  coordinate={userLoc}
                  rotation={heading}
                  flat={true} // makes it lay flat on the map for 3D effect
                  anchor={{ x: 0.5, y: 0.5 }}
                >
                  <View style={styles.personAvatar}>
                    <Ionicons name="walk" size={32} color="#fff" />
                  </View>
                </Marker>
                
                {/* Path from user to object */}
                <Polyline 
                  coordinates={[userLoc, { latitude: objLat, longitude: objLng }]}
                  strokeColor="#3b82f6"
                  strokeWidth={5}
                  lineDashPattern={[10, 10]}
                />
              </>
            )}

            {/* Target Object Marker */}
            <Marker coordinate={{ latitude: objLat, longitude: objLng }}>
              <View style={styles.objectMarker}>
                <Ionicons name="star" size={24} color="#fff" />
              </View>
            </Marker>
          </MapView>
        ) : (
          <View style={styles.noGpsContainer}>
            <Ionicons name="location-outline" size={60} color="#f87171" />
            <Text style={styles.noGpsText}>මෙම භාණ්ඩයට GPS පිහිටීමක් සේව් වී නැත. කරුණාකර එය මුලින් ස්කෑන් කරන්න.</Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.distanceText}>
          {distance ? `මීටර් ${distance} ක් දුරින්` : 'ස්ථානය සොයමින්...'}
        </Text>
        <TouchableOpacity style={styles.audioBtn} onPress={speakDirections}>
          <Ionicons name="volume-medium" size={24} color="#fff" />
          <Text style={styles.audioBtnText}>උපදෙස් අසන්න</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#1e293b' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#334155', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  mapContainer: { flex: 1, backgroundColor: '#cbd5e1' },
  map: { ...StyleSheet.absoluteFillObject },
  personAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3b82f6',
    borderWidth: 3,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    elevation: 8,
  },
  objectMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#10b981',
    borderWidth: 2,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noGpsContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: '#0f172a' },
  noGpsText: { color: '#f87171', fontSize: 18, textAlign: 'center', marginTop: 16, fontWeight: '600' },
  footer: { padding: 24, backgroundColor: '#1e293b', alignItems: 'center' },
  distanceText: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  audioBtn: { flexDirection: 'row', backgroundColor: '#3b82f6', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 30, alignItems: 'center' },
  audioBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginLeft: 8 }
});
