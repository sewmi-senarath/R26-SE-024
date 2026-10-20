import React, { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Platform, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import * as Speech from "expo-speech";
import * as Haptics from "expo-haptics";
import axios from "axios";
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import { AI_URL, getPatientId, speak as speakSinhala } from "../../src/services/memoryAI";

// Find a lost thing.
//  * Indoors (or with no trustworthy GPS) the CAMERA finds it: every ~1.2 s a frame
//    goes to the AI service; when the thing is in view, its distance is estimated
//    from its known real size and how big it looks, and the direction from where
//    it sits in the frame ("1.2 m, ahead / to the left").
//  * GPS distance and the map are used only when GPS is good (outdoors / another
//    building): indoor GPS is 10-30 m off, so it is never shown as a distance there.

const WALK_MPS = 1.4;
const GPS_OK_M = 20;          // GPS accuracy (m) good enough to show a GPS distance
const SCAN_MS = 1200;
const FOUND_M = 0.6;          // close enough to say "here it is"

// Rough largest real dimension of each thing (metres) - for the camera distance.
const REAL_SIZE_M: Record<string, number> = {
  glasses: 0.14, keys: 0.08, wallet: 0.11, "pill bottle": 0.1, "cell phone": 0.15, remote: 0.18, watch: 0.06,
  cup: 0.1, bottle: 0.25, plate: 0.25, bowl: 0.15, spoon: 0.16, kettle: 0.22, toothbrush: 0.19, book: 0.22,
  handbag: 0.3, backpack: 0.4, umbrella: 0.6, slippers: 0.26, flask: 0.28, hat: 0.3, laptop: 0.33, scissors: 0.18,
};
// Field of view of a typical phone back camera in a portrait photo (width, height).
const TAN_HALF_W = Math.tan((50 / 2) * Math.PI / 180);
const TAN_HALF_H = Math.tan((66 / 2) * Math.PI / 180);

function haversineMetres(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3;
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dp = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

type Dir = 'left' | 'ahead' | 'right';
type Sighting = { metres: number; dir: Dir; at: number };

const T = {
  en: {
    live: 'Find with camera', map: 'Map', ar: 'Camera',
    turn: (o: string) => `Turn slowly around. I'll tell you when I see your ${o}.`,
    seen: (o: string, m: string, d: Dir) => `Your ${o} is ${m} ${d === 'ahead' ? 'ahead' : d === 'left' ? 'to your left' : 'to your right'}.`,
    here: (o: string) => `Here it is! Your ${o} is right in front of you.`,
    lost: (o: string) => `I can't see your ${o} now. Turn slowly.`,
    lastSeen: (r: string) => `Last seen in the ${r}`,
    indoor: 'Indoors GPS is not exact, so the camera finds it',
    gps: (o: string, d: number, eta: string) => `Your ${o} is about ${d} metres away, ${eta} walking.`,
    distance: 'Distance', direction: 'Direction', walk: 'Walk', speakBtn: 'Say directions',
    ahead: 'Ahead', left: 'Left', right: 'Right', none: '--', permission: 'Camera permission is needed to find it',
    grant: 'Allow camera', found: 'Found it!',
  },
  si: {
    live: 'කැමරාවෙන් හොයමු', map: 'සිතියම', ar: 'කැමරාව',
    turn: (o: string) => `හෙමින් වටේට හැරෙන්න. ඔයාගේ ${o} පේන ගමන් මම කියන්නම්.`,
    seen: (o: string, m: string, d: Dir) => `ඔයාගේ ${o} ${d === 'ahead' ? 'ඉස්සරහින්' : d === 'left' ? 'වම් පැත්තේ' : 'දකුණු පැත්තේ'} ${m} දුරින් තියෙනවා.`,
    here: (o: string) => `මෙන්න! ඔයාගේ ${o} ඔයා ඉස්සරහමයි.`,
    lost: (o: string) => `දැන් ${o} පේන්නේ නැහැ. හෙමින් හැරෙන්න.`,
    lastSeen: (r: string) => `අන්තිමට දැක්කේ ${r}ේ`,
    indoor: 'ගෙයක් ඇතුළේ GPS නිවැරදි නැහැ - කැමරාවෙන් හොයනවා',
    gps: (o: string, d: number, eta: string) => `ඔයාගේ ${o} මීටර් ${d}ක් විතර දුරින්. ඇවිදගෙන ${eta}.`,
    distance: 'දුර', direction: 'දිශාව', walk: 'ඇවිදින්න', speakBtn: 'මඟ කියන්න',
    ahead: 'ඉස්සරහට', left: 'වමට', right: 'දකුණට', none: '--', permission: 'හොයන්න කැමරා අවසරය ඕනේ',
    grant: 'අවසර දෙන්න', found: 'හම්බුණා!',
  },
};

const metresText = (m: number, lang: 'en' | 'si') => {
  const v = m < 2 ? m.toFixed(1) : String(Math.round(m * 2) / 2);
  return lang === 'si' ? `මීටර් ${v}` : `${v} m`;
};

export default function ARNavigateScreen() {
  const params = useLocalSearchParams<Record<string, string>>();
  const router = useRouter();
  const objectName = String(params.objectName || "Object");
  const objLabel = String(params.objLabel || "").toLowerCase();
  const roomName = String(params.roomLabel || params.room || "");
  const targetLat = params.objLat ? parseFloat(String(params.objLat)) : NaN;
  const targetLng = params.objLng ? parseFloat(String(params.objLng)) : NaN;
  const hasTarget = !isNaN(targetLat) && !isNaN(targetLng);

  const [permission, requestPermission] = useCameraPermissions();
  const [lang, setLang] = useState<'en' | 'si'>('si');
  const langRef = useRef<'en' | 'si'>('si');
  useEffect(() => { langRef.current = lang; }, [lang]);
  const [viewMode, setViewMode] = useState<'ar' | 'map'>('ar');
  const [userLoc, setUserLoc] = useState<{ latitude: number; longitude: number; accuracy: number | null } | null>(null);
  const [heading, setHeading] = useState(0);
  const [sight, setSight] = useState<Sighting | null>(null);
  const [found, setFound] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const pidRef = useRef<string | null>(null);
  const busy = useRef(false);
  const lastSaid = useRef({ text: '', at: 0 });
  const foundAnim = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  const t = T[lang];
  const gpsDistance = hasTarget && userLoc ? haversineMetres(userLoc.latitude, userLoc.longitude, targetLat, targetLng) : null;
  // GPS counts only when it is accurate and the thing is far (another room is too close for GPS).
  const gpsGood = gpsDistance !== null && (userLoc?.accuracy ?? 999) <= GPS_OK_M && gpsDistance > GPS_OK_M;

  const say = useCallback((text: string, force = false) => {
    const now = Date.now();
    if (!force && (text === lastSaid.current.text || now - lastSaid.current.at < 4000)) return;
    lastSaid.current = { text, at: now };
    if (langRef.current === 'si') speakSinhala(text, 'si');   // no Sinhala system voice on iOS
    else Speech.speak(text, { rate: 0.9, language: 'en-US' });
  }, []);

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0, duration: 700, useNativeDriver: true }),
    ])).start();
    getPatientId().then((p) => { pidRef.current = p; });
    if (!permission?.granted) requestPermission();
    say(T.si.turn(objectName), true);
    return () => { Speech.stop(); };
  }, []);

  // GPS + compass (only used for the map / far away)
  useEffect(() => {
    let active = true;
    let locSub: Location.LocationSubscription | null = null;
    let headSub: Location.LocationSubscription | null = null;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted" || !active) return;
      locSub = await Location.watchPositionAsync({ accuracy: Location.Accuracy.High, distanceInterval: 1 },
        (l) => active && setUserLoc({ latitude: l.coords.latitude, longitude: l.coords.longitude, accuracy: l.coords.accuracy }));
      headSub = await Location.watchHeadingAsync((h) => active && setHeading(h.trueHeading >= 0 ? h.trueHeading : h.magHeading));
    })();
    return () => { active = false; locSub?.remove(); headSub?.remove(); };
  }, []);

  // Camera search: is the thing in view, how far, which way?
  const matches = useCallback((d: any) => {
    const lbl = String(d.label || '').toLowerCase();
    const lblSi = String(d.label_si || '');
    const name = objectName.toLowerCase().replace(/[?.,!]/g, '').trim();
    return (objLabel && lbl === objLabel) || lblSi === objectName || lblSi.includes(objectName) ||
      lbl === name || (name.length > 2 && (lbl.includes(name) || name.includes(lbl)));
  }, [objectName, objLabel]);

  useEffect(() => {
    if (viewMode !== 'ar' || !permission?.granted || found) return;
    const timer = setInterval(async () => {
      if (busy.current || !cameraRef.current || !pidRef.current) return;
      busy.current = true;
      try {
        const snap: { uri?: string } = await cameraRef.current.takePictureAsync({ quality: 0.4, skipProcessing: true, shutterSound: false });
        if (!snap?.uri) return;
        const form = new FormData();
        form.append('patient_id', pidRef.current);
        form.append('file', { uri: snap.uri, name: 'scan.jpg', type: 'image/jpeg' } as any);
        const res = await axios.post(`${AI_URL}/detect-live`, form, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 8000 });
        const hit = (res.data.detections || []).filter(matches).sort((a: any, b: any) => b.confidence - a.confidence)[0];
        if (!hit) {
          setSight((s) => (s && Date.now() - s.at > 4000 ? null : s));
          return;
        }
        const [x1, y1, x2, y2] = hit.box;
        const size = REAL_SIZE_M[hit.label] ?? 0.15;
        const byW = size / Math.max(0.02, (x2 - x1) * 2 * TAN_HALF_W);
        const byH = size / Math.max(0.02, (y2 - y1) * 2 * TAN_HALF_H);
        const metres = Math.min(8, Math.max(0.2, Math.min(byW, byH)));
        const cx = (x1 + x2) / 2;
        const dir: Dir = cx < 0.36 ? 'left' : cx > 0.64 ? 'right' : 'ahead';
        setSight({ metres, dir, at: Date.now() });
        Haptics.impactAsync(metres < 1 ? Haptics.ImpactFeedbackStyle.Heavy : metres < 2.5 ? Haptics.ImpactFeedbackStyle.Medium
          : Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        if (metres <= FOUND_M && dir === 'ahead') {
          setFound(true);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          Animated.spring(foundAnim, { toValue: 1, useNativeDriver: true }).start();
          say(T[langRef.current].here(objectName), true);
        } else {
          say(T[langRef.current].seen(objectName, metresText(metres, langRef.current), dir));
        }
      } catch {
        // a missed frame is fine - the next one tries again
      } finally {
        busy.current = false;
      }
    }, SCAN_MS);
    return () => clearInterval(timer);
  }, [viewMode, permission?.granted, found, matches, objectName, say]);

  if (!permission?.granted) {
    return (
      <View style={s.center}>
        <Ionicons name="camera-outline" size={64} color="#f59e0b" />
        <Text style={s.permText}>{t.permission}</Text>
        <TouchableOpacity style={s.permBtn} onPress={requestPermission}>
          <Text style={s.permBtnText}>{t.grant}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Arrow: towards the thing in the camera, else towards the GPS point (only when GPS is good).
  const bearing = gpsGood && userLoc ? (() => {
    const dLon = ((targetLng - userLoc.longitude) * Math.PI) / 180;
    const la1 = (userLoc.latitude * Math.PI) / 180;
    const la2 = (targetLat * Math.PI) / 180;
    const y = Math.sin(dLon) * Math.cos(la2);
    const x = Math.cos(la1) * Math.sin(la2) - Math.sin(la1) * Math.cos(la2) * Math.cos(dLon);
    return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
  })() : null;
  const arrowDeg = sight ? (sight.dir === 'left' ? -60 : sight.dir === 'right' ? 60 : 0)
    : bearing !== null ? (bearing - heading + 360) % 360 : null;
  const distLabel = sight ? metresText(sight.metres, lang)
    : gpsGood && gpsDistance !== null ? (lang === 'si' ? `මීටර් ${Math.round(gpsDistance)}` : `${Math.round(gpsDistance)} m`) : t.none;
  const eta = gpsGood && gpsDistance ? Math.ceil(gpsDistance / WALK_MPS / 60) : null;
  const pulseOp = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] });

  const speakNow = () => {
    if (found) say(t.here(objectName), true);
    else if (sight) say(t.seen(objectName, metresText(sight.metres, lang), sight.dir), true);
    else if (gpsGood && gpsDistance) say(t.gps(objectName, Math.round(gpsDistance), lang === 'si' ? `විනාඩි ${eta}` : `${eta} min`), true);
    else say(t.turn(objectName), true);
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      {viewMode === 'ar' || !(hasTarget && userLoc) ? (
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />
      ) : (
        <MapView provider={PROVIDER_DEFAULT} style={StyleSheet.absoluteFill} showsUserLocation showsCompass
          initialRegion={{ latitude: userLoc.latitude, longitude: userLoc.longitude, latitudeDelta: 0.002, longitudeDelta: 0.002 }}>
          <Marker coordinate={{ latitude: targetLat, longitude: targetLng }} title={objectName} />
          <Polyline coordinates={[{ latitude: userLoc.latitude, longitude: userLoc.longitude }, { latitude: targetLat, longitude: targetLng }]}
            strokeColor="#3b82f6" strokeWidth={4} lineDashPattern={[1, 5]} />
        </MapView>
      )}
      {found && <View style={[StyleSheet.absoluteFill, s.foundBorder]} pointerEvents="none" />}

      <View style={s.topGrad} pointerEvents="none" />
      <View style={s.bottomGrad} pointerEvents="none" />

      <SafeAreaView style={s.safeTop}>
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => { Speech.stop(); router.back(); }}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <View style={s.liveChip}>
              <View style={[s.liveDot, sight && { backgroundColor: '#facc15' }]} />
              <Text style={s.liveText}>{t.live}</Text>
            </View>
            <Text style={s.headerObj} numberOfLines={1}>{objectName}</Text>
            {!!roomName && <Text style={s.room}>{t.lastSeen(roomName)}</Text>}
          </View>
          <TouchableOpacity style={s.pill} onPress={() => setLang((l) => (l === 'en' ? 'si' : 'en'))}>
            <Text style={s.pillText}>{lang === 'en' ? 'සිංහල' : 'English'}</Text>
          </TouchableOpacity>
          {hasTarget && gpsGood && (
            <TouchableOpacity style={s.pill} onPress={() => setViewMode((v) => (v === 'ar' ? 'map' : 'ar'))}>
              <Text style={s.pillText}>{viewMode === 'ar' ? t.map : t.ar}</Text>
            </TouchableOpacity>
          )}
        </View>
        {!gpsGood && !sight && !found && <Text style={s.indoor}>{t.indoor}</Text>}
      </SafeAreaView>

      {!found && arrowDeg !== null && (
        <View style={s.arrowWrap} pointerEvents="none">
          <Animated.View style={{ opacity: pulseOp, transform: [{ rotate: `${arrowDeg}deg` }] }}>
            <Ionicons name="arrow-up" size={120} color="#facc15" />
          </Animated.View>
        </View>
      )}

      {found && (
        <Animated.View style={[s.foundBanner, { transform: [{ scale: foundAnim }] }]} pointerEvents="none">
          <Ionicons name="checkmark-circle" size={64} color="#4ade80" />
          <Text style={s.foundTitle}>{t.found}</Text>
          <Text style={s.foundSub}>{t.here(objectName)}</Text>
        </Animated.View>
      )}

      <View style={s.panel}>
        <View style={s.metricRow}>
          <View style={s.metricCard}>
            <Ionicons name="navigate" size={20} color="#f59e0b" />
            <Text style={s.metVal}>{distLabel}</Text>
            <Text style={s.metLbl}>{t.distance}</Text>
          </View>
          <View style={s.metricCard}>
            <Ionicons name="compass" size={20} color="#60a5fa" />
            <Text style={s.metVal}>{sight ? t[sight.dir] : t.none}</Text>
            <Text style={s.metLbl}>{t.direction}</Text>
          </View>
          {eta !== null && !sight && (
            <View style={s.metricCard}>
              <Ionicons name="walk" size={20} color="#34d399" />
              <Text style={s.metVal}>{lang === 'si' ? `විනාඩි ${eta}` : `${eta} min`}</Text>
              <Text style={s.metLbl}>{t.walk}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity style={s.speakBtn} onPress={speakNow}>
          <Ionicons name="volume-high" size={22} color="#000" />
          <Text style={s.speakTxt}>{t.speakBtn}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  center: { flex: 1, backgroundColor: "#0f172a", justifyContent: "center", alignItems: "center", padding: 32, gap: 16 },
  permText: { color: "#f1f5f9", fontSize: 18, fontWeight: "700", textAlign: "center" },
  permBtn: { backgroundColor: "#f59e0b", paddingHorizontal: 28, paddingVertical: 14, borderRadius: 20 },
  permBtnText: { color: "#000", fontWeight: "900", fontSize: 16 },
  topGrad: { position: "absolute", top: 0, left: 0, right: 0, height: 170, backgroundColor: "rgba(0,0,0,0.55)" },
  bottomGrad: { position: "absolute", bottom: 0, left: 0, right: 0, height: 240, backgroundColor: "rgba(0,0,0,0.72)" },
  safeTop: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 20 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.15)", justifyContent: "center",
    alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.25)" },
  liveChip: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(255,255,255,0.15)", alignSelf: "flex-start",
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginBottom: 4 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#4ade80" },
  liveText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  headerObj: { color: "#fff", fontSize: 22, fontWeight: "900" },
  room: { color: "#fde68a", fontSize: 13, fontWeight: "700", marginTop: 2 },
  pill: { backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16 },
  pillText: { color: "#fff", fontWeight: "800", fontSize: 13 },
  indoor: { color: "#e2e8f0", fontSize: 13, fontWeight: "700", textAlign: "center", marginHorizontal: 20,
    backgroundColor: "rgba(15,23,42,0.6)", borderRadius: 12, paddingVertical: 6 },
  arrowWrap: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, justifyContent: "center", alignItems: "center", zIndex: 10 },
  foundBorder: { borderWidth: 8, borderColor: "#4ade80", zIndex: 10 },
  foundBanner: { position: "absolute", top: "28%", alignSelf: "center", zIndex: 30, backgroundColor: "rgba(0,0,0,0.88)", borderRadius: 28,
    paddingHorizontal: 32, paddingVertical: 24, alignItems: "center", borderWidth: 2, borderColor: "#4ade80", marginHorizontal: 24 },
  foundTitle: { color: "#4ade80", fontSize: 28, fontWeight: "900", marginTop: 8 },
  foundSub: { color: "#d1fae5", fontSize: 16, fontWeight: "600", marginTop: 4, textAlign: "center" },
  panel: { position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 20, paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 40 : 24, paddingTop: 16, gap: 14 },
  metricRow: { flexDirection: "row", gap: 10 },
  metricCard: { flex: 1, backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 18, paddingVertical: 14, alignItems: "center", gap: 4,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.15)" },
  metVal: { color: "#fff", fontSize: 19, fontWeight: "900" },
  metLbl: { color: "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: "600" },
  speakBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: "#f59e0b",
    borderRadius: 18, paddingVertical: 16 },
  speakTxt: { color: "#000", fontSize: 17, fontWeight: "900" },
});
