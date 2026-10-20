import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Svg, { Defs, Ellipse, G, Path, RadialGradient, Stop, Text as SvgText } from 'react-native-svg';
import { AI_URL, getCaregiverPin, getPatientId, Lang, setCaregiverPin } from '../../../services/memoryAI';

// Caregiver view of every patient's memory progress, built on the memory-game report
// (memory_quiz.py /memory-report). The brain picture is an illustration of the game's
// memory-skill scores, not a brain scan - the screen says so.

const LANG_KEY = 'memory_lang';
const T = {
  title: { si: 'මතක ප්‍රගතිය', en: 'Memory progress' },
  sub: { si: 'Caregiver සඳහා', en: 'For the caregiver' },
  pinTitle: { si: 'Caregiver PIN එක දාන්න', en: 'Enter the caregiver PIN' },
  pinHelp: { si: 'මෙතන හැම patient කෙනෙක්ගෙම තොරතුරු තියෙනවා. Caregiver ට විතරයි.', en: "This shows every patient's data. Caregiver only." },
  pinWrong: { si: 'PIN එක වැරදියි', en: 'Wrong PIN' },
  pinNone: { si: 'තවම PIN එකක් නැහැ. Family screen එකේ PIN එකක් හදන්න.', en: 'No PIN yet. Set one on the Family screen.' },
  unlock: { si: 'විවෘත කරන්න', en: 'Unlock' },
  patients: { si: 'Patients', en: 'Patients' },
  games: { si: 'සෙල්ලම් {n}', en: '{n} games' },
  noGames: { si: 'තවම සෙල්ලම් නැහැ', en: 'No games yet' },
  simulated: { si: 'Demo (simulated)', en: 'Demo (simulated)' },
  now: { si: 'මේ සතියේ මතක ලකුණු', en: 'Memory score this week' },
  estimate: { si: 'සති 4කින් ඇස්තමේන්තුව', en: 'Estimate in 4 weeks' },
  estimateNote: { si: 'මේ ප්‍රවණතාවය එහෙමම ගියොත් විතරයි', en: 'only if the current trend continues' },
  improving: { si: 'දියුණු වෙනවා', en: 'Improving' },
  stable: { si: 'ස්ථාවරයි', en: 'Stable' },
  declining: { si: 'අඩු වෙනවා', en: 'Declining' },
  noTrend: { si: 'ප්‍රවණතාවයට තව දත්ත ඕනේ', en: 'Needs more days for a trend' },
  perWeek: { si: 'සතියකට {n}', en: '{n} per week' },
  brain: { si: 'මතක කුසලතා සිතියම', en: 'Memory skills map' },
  brainNote: { si: 'මතක සෙල්ලමේ ලකුණු පෙන්නන රූපයක් - මොළයේ scan එකක් නෙමෙයි.', en: "A picture of the memory game's scores - not a brain scan." },
  daily: { si: 'දවසින් දවස (දවස් 30)', en: 'Day by day (30 days)' },
  tapBar: { si: 'දවසක් ඔබලා ලකුණ බලන්න', en: 'Tap a day to see its score' },
  noScore: { si: 'සෙල්ලම් නැහැ', en: 'no game' },
  skills: { si: 'කුසලතා (මේ සතිය / කලින්)', en: 'Skills (this week / before)' },
  streak: { si: 'දිගටම දවස් {n}', en: '{n}-day streak' },
  unaided: { si: 'උදව් නැතුව {n}%', en: '{n}% without help' },
  people: { si: 'හමුවුණ අය', en: 'People met' },
  items: { si: 'හොයපු දේවල්', en: 'Things searched for' },
  disclaimer: { si: 'මේක නිරීක්ෂණයට විතරයි. රෝග විනිශ්චයක් නෙමෙයි - තීරණ දොස්තර ගන්නවා.',
    en: 'For monitoring only. Not a diagnosis - clinical decisions stay with the doctor.' },
  offline: { si: 'සේවාවට සම්බන්ධ වෙන්න බැහැ. ටිකකින් ආයෙත් උත්සාහ කරන්න.', en: 'Cannot reach the service. Please try again shortly.' },
  back: { si: 'Patients ලැයිස්තුවට', en: 'Back to patients' },
};
const t = (k: keyof typeof T, lang: Lang, vars: Record<string, string | number> = {}) =>
  Object.entries(vars).reduce((s, [a, b]) => s.replace(`{${a}}`, String(b)), T[k][lang]);

const DOMAIN_SI: Record<string, string> = {
  people: 'පුද්ගලයෝ', places: 'දේවල් තිබ්බ තැන්', objects: 'දේවල්', time: 'සිදුවීම් වෙලාව',
  orientation: 'දවස / දිනය', delayed: 'පස්සේ මතක් කිරීම', conversation: 'කතාබහ',
};
// Brain region <- memory-game skills (a teaching picture of which skills lean on which area).
const REGIONS = [
  { key: 'frontal', domains: ['orientation', 'time'], si: 'වෙලාව / දවස', en: 'Time & day',
    d: 'M35 115 C25 70 60 30 115 22 L130 100 C100 112 65 118 35 115 Z', lx: 78, ly: 78 },
  { key: 'parietal', domains: ['places'], si: 'තැන්', en: 'Places',
    d: 'M115 22 C165 12 215 25 240 55 L185 100 L130 100 Z', lx: 178, ly: 58 },
  { key: 'occipital', domains: ['objects'], si: 'දේවල්', en: 'Objects',
    d: 'M240 55 C268 75 275 110 255 135 L205 125 L185 100 Z', lx: 236, ly: 100 },
  { key: 'temporal', domains: ['people', 'conversation'], si: 'අය / කතා', en: 'People & talk',
    d: 'M35 115 C65 118 100 112 130 100 L185 100 L205 125 C170 150 110 158 70 145 C50 138 38 128 35 115 Z', lx: 96, ly: 138 },
];
// One sequential hue (teal) for score: light = low, dark = high. Grey = no games yet.
const RAMP = ['#D5F3EE', '#A6E4D9', '#6FCFBF', '#34B3A0', '#0F9D8A', '#0B7768'];
const NO_DATA = '#E2E8F0';
const scoreColor = (v: number | null | undefined) =>
  v == null ? NO_DATA : RAMP[Math.min(RAMP.length - 1, Math.floor((Math.max(0, Math.min(100, v)) / 100) * RAMP.length))];
const inkOn = (v: number | null | undefined) => (v != null && v >= 67 ? '#FFFFFF' : '#0F2A24');   // white only on the two darkest steps

type PatientRow = { patient_id: string; name: string; simulated: boolean; sessions: number; last_score: number | null; last_played: string | null };
type Report = {
  name: string; simulated: boolean;
  summary: { latest_score: number | null; avg_7: number | null; slope_per_week: number | null; trend: string | null;
    streak: number; unaided_pct: number | null; level: string };
  daily: { date: string; score: number | null }[];
  domains: { key: string; label: string; now: number | null; before: number | null }[];
  people: { name: string; relation: string; minutes: number; visits: number }[];
  top_items: { label: string; label_si: string; count: number }[];
};

function avg(xs: (number | null | undefined)[]) {
  const v = xs.filter((x): x is number => x != null);
  return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null;
}

function Brain({ domains, lang }: { domains: Report['domains']; lang: Lang }) {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  const val = (keys: string[]) => avg(domains.filter((d) => keys.includes(d.key)).map((d) => d.now ?? d.before));
  const recall = val(['delayed']);
  return (
    <Animated.View style={{ transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.03] }) },
      { perspective: 800 }, { rotateY: pulse.interpolate({ inputRange: [0, 1], outputRange: ['-6deg', '6deg'] }) }] }}>
      <Svg width="100%" height={230} viewBox="0 0 300 200">
        <Defs>
          <RadialGradient id="shine" cx="38%" cy="28%" r="70%">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.55" />
            <Stop offset="0.6" stopColor="#FFFFFF" stopOpacity="0.05" />
            <Stop offset="1" stopColor="#000000" stopOpacity="0.18" />
          </RadialGradient>
        </Defs>
        <Ellipse cx="150" cy="190" rx="110" ry="8" fill="#0F2A24" opacity={0.10} />
        <Path d="M205 135 C235 135 262 140 258 160 C250 178 215 178 200 165 C192 155 195 142 205 135 Z" fill="#CBD5E1" stroke="#fff" strokeWidth={2} />
        <Path d="M172 150 L190 186 L176 188 L162 154 Z" fill="#CBD5E1" stroke="#fff" strokeWidth={2} />
        {REGIONS.map((r) => {
          const v = val(r.domains);
          return (
            <G key={r.key}>
              <Path d={r.d} fill={scoreColor(v)} stroke="#fff" strokeWidth={2} />
              <SvgText x={r.lx} y={r.ly - 6} fontSize={10} fontWeight="700" fill={inkOn(v)} textAnchor="middle">{lang === 'en' ? r.en : r.si}</SvgText>
              <SvgText x={r.lx} y={r.ly + 9} fontSize={14} fontWeight="900" fill={inkOn(v)} textAnchor="middle">{v == null ? '–' : `${v}`}</SvgText>
            </G>
          );
        })}
        <Ellipse cx="150" cy="116" rx="24" ry="10" fill={scoreColor(recall)} stroke="#fff" strokeWidth={2} />
        <SvgText x="150" y="120" fontSize={9} fontWeight="800" fill={inkOn(recall)} textAnchor="middle">
          {lang === 'en' ? `Recall ${recall ?? '–'}` : `මතකය ${recall ?? '–'}`}
        </SvgText>
        <Path d="M35 115 C25 70 60 30 115 22 C165 12 215 25 240 55 C268 75 275 110 255 135 L205 125 C170 150 110 158 70 145 C50 138 38 128 35 115 Z"
          fill="url(#shine)" />
      </Svg>
    </Animated.View>
  );
}

export default function MemoryProgressUI() {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>('si');
  const [pid, setPid] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(!!getCaregiverPin());
  const [pinInput, setPinInput] = useState('');
  const [pinMsg, setPinMsg] = useState('');
  const [rows, setRows] = useState<PatientRow[] | null>(null);
  const [sel, setSel] = useState<PatientRow | null>(null);
  const [rep, setRep] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [offline, setOffline] = useState(false);
  const [tapped, setTapped] = useState<{ date: string; score: number | null } | null>(null);

  useEffect(() => {
    (async () => {
      try { const l = await AsyncStorage.getItem(LANG_KEY); if (l === 'en' || l === 'si') setLang(l); } catch {}
      setPid(await getPatientId());
    })();
  }, []);
  const changeLang = async (l: Lang) => { setLang(l); try { await AsyncStorage.setItem(LANG_KEY, l); } catch {} };

  const unlock = async () => {
    if (!pid) return;
    setPinMsg('');
    try {
      const st = await axios.get(`${AI_URL}/family/pin-status/${pid}`, { timeout: 10000 });
      if (!st.data.has_pin) { setPinMsg(t('pinNone', lang)); return; }
      const f = new FormData();
      f.append('patient_id', pid); f.append('pin', pinInput);
      const res = await axios.post(`${AI_URL}/family/pin/verify`, f, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 10000 });
      if (!res.data.ok) { setPinMsg(t('pinWrong', lang)); return; }
      setCaregiverPin(pinInput); setUnlocked(true); setPinInput('');
    } catch { setOffline(true); }
  };

  const loadList = useCallback(async () => {
    try {
      const r = await axios.get(`${AI_URL}/memory-report-patients`, { timeout: 15000 });
      setRows((r.data.patients as PatientRow[]).filter((p) => !p.patient_id.endsWith('-TEST') && !p.patient_id.startsWith('EVAL')));
      setOffline(false);
    } catch { setOffline(true); }
  }, []);
  useEffect(() => { if (unlocked) loadList(); }, [unlocked, loadList]);

  const open = async (p: PatientRow) => {
    setSel(p); setRep(null); setTapped(null); setLoading(true);
    try {
      const r = await axios.get(`${AI_URL}/memory-report/${p.patient_id}`, { params: { days: 30 }, timeout: 20000 });
      setRep(r.data); setOffline(false);
    } catch { setOffline(true); } finally { setLoading(false); }
  };

  const s7 = rep?.summary;
  const nowScore = s7 ? (s7.avg_7 ?? s7.latest_score) : null;
  const est = nowScore != null && s7?.slope_per_week != null
    ? Math.round(Math.max(0, Math.min(100, nowScore + s7.slope_per_week * 4))) : null;
  const trendKey = s7?.trend === 'improving' ? 'improving' : s7?.trend === 'declining' ? 'declining' : s7?.trend === 'stable' ? 'stable' : 'noTrend';
  const trendIcon = trendKey === 'improving' ? 'trending-up' : trendKey === 'declining' ? 'trending-down' : 'remove';
  const maxBar = 100;

  return (
    <SafeAreaView style={st.container} edges={['top']}>
      <ScrollView contentContainerStyle={st.scroll}>
        <View style={st.header}>
          <TouchableOpacity style={st.backBtn} onPress={() => (sel ? (setSel(null), setRep(null)) : router.back())}>
            <Ionicons name="arrow-back" size={22} color="#0F2A24" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={st.title}>{t('title', lang)}</Text>
            <Text style={st.sub}>{sel ? sel.name : t('sub', lang)}</Text>
          </View>
          <View style={st.langRow}>
            {(['si', 'en'] as Lang[]).map((l) => (
              <TouchableOpacity key={l} style={[st.langBtn, lang === l && st.langOn]} onPress={() => changeLang(l)}>
                <Text style={[st.langText, lang === l && { color: '#fff' }]}>{l === 'si' ? 'සිං' : 'EN'}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {offline && (
          <View style={st.offline}><Ionicons name="cloud-offline" size={18} color="#991B1B" /><Text style={st.offlineText}>{t('offline', lang)}</Text></View>
        )}

        {!unlocked ? (
          <View style={st.card}>
            <Text style={st.cardTitle}>{t('pinTitle', lang)}</Text>
            <Text style={st.muted}>{t('pinHelp', lang)}</Text>
            <TextInput style={st.input} value={pinInput} onChangeText={setPinInput} keyboardType="number-pad" secureTextEntry maxLength={8} />
            {!!pinMsg && <Text style={st.err}>{pinMsg}</Text>}
            <TouchableOpacity style={st.primary} onPress={unlock}><Text style={st.primaryText}>{t('unlock', lang)}</Text></TouchableOpacity>
          </View>
        ) : !sel ? (
          <>
            <Text style={st.section}>{t('patients', lang)}</Text>
            {!rows ? <ActivityIndicator color="#0F9D8A" style={{ marginTop: 30 }} /> : rows.map((p) => (
              <TouchableOpacity key={p.patient_id} style={st.row} onPress={() => open(p)}>
                <View style={[st.dot, { backgroundColor: scoreColor(p.last_score) }]}>
                  <Text style={[st.dotText, { color: inkOn(p.last_score) }]}>{p.last_score == null ? '–' : Math.round(p.last_score)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={st.rowName}>{p.name}</Text>
                  <Text style={st.muted}>
                    {p.sessions ? t('games', lang, { n: p.sessions }) : t('noGames', lang)}{p.last_played ? ` · ${p.last_played}` : ''}
                  </Text>
                </View>
                {p.simulated && <Text style={st.badge}>{t('simulated', lang)}</Text>}
                <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
              </TouchableOpacity>
            ))}
          </>
        ) : loading || !rep ? (
          <ActivityIndicator color="#0F9D8A" style={{ marginTop: 40 }} />
        ) : (
          <>
            {rep.simulated && <Text style={[st.badge, { alignSelf: 'flex-start', marginBottom: 10 }]}>{t('simulated', lang)}</Text>}
            <View style={st.heroRow}>
              <View style={[st.card, st.hero]}>
                <Text style={st.muted}>{t('now', lang)}</Text>
                <Text style={st.big}>{nowScore == null ? '–' : Math.round(nowScore)}<Text style={st.of}>/100</Text></Text>
                <View style={st.trendRow}>
                  <Ionicons name={trendIcon} size={18} color="#0F2A24" />
                  <Text style={st.trendText}>{t(trendKey as keyof typeof T, lang)}</Text>
                </View>
                {s7?.slope_per_week != null && <Text style={st.muted}>{t('perWeek', lang, { n: `${s7.slope_per_week > 0 ? '+' : ''}${s7.slope_per_week}` })}</Text>}
              </View>
              <View style={[st.card, st.hero]}>
                <Text style={st.muted}>{t('estimate', lang)}</Text>
                <Text style={st.big}>{est == null ? '–' : est}<Text style={st.of}>/100</Text></Text>
                <Text style={st.muted}>{t('estimateNote', lang)}</Text>
              </View>
            </View>
            <View style={st.chips}>
              {!!s7?.streak && <Text style={st.chip}>{t('streak', lang, { n: s7.streak })}</Text>}
              {s7?.unaided_pct != null && <Text style={st.chip}>{t('unaided', lang, { n: Math.round(s7.unaided_pct) })}</Text>}
            </View>

            <Text style={st.section}>{t('brain', lang)}</Text>
            <View style={st.card}>
              <Brain domains={rep.domains} lang={lang} />
              <View style={st.legend}>
                <Text style={st.legendText}>0</Text>
                {RAMP.map((c) => <View key={c} style={[st.legendBox, { backgroundColor: c }]} />)}
                <Text style={st.legendText}>100</Text>
                <View style={[st.legendBox, { backgroundColor: NO_DATA, marginLeft: 10 }]} />
                <Text style={st.legendText}>{t('noScore', lang)}</Text>
              </View>
              <Text style={st.note}>{t('brainNote', lang)}</Text>
            </View>

            <Text style={st.section}>{t('daily', lang)}</Text>
            <View style={st.card}>
              <Text style={st.tip}>
                {tapped ? `${tapped.date}: ${tapped.score == null ? t('noScore', lang) : Math.round(tapped.score)}` : t('tapBar', lang)}
              </Text>
              <View style={st.chart}>
                {rep.daily.map((d) => (
                  <TouchableOpacity key={d.date} style={st.barHit} onPress={() => setTapped(d)} activeOpacity={0.7}>
                    <View style={[st.bar, d.score == null
                      ? { height: 3, backgroundColor: NO_DATA }
                      : { height: Math.max(4, (d.score / maxBar) * 120), backgroundColor: tapped?.date === d.date ? '#0B7768' : '#34B3A0' }]} />
                  </TouchableOpacity>
                ))}
              </View>
              <View style={st.axis}>
                <Text style={st.axisText}>{rep.daily[0]?.date.slice(5)}</Text>
                <Text style={st.axisText}>{rep.daily[rep.daily.length - 1]?.date.slice(5)}</Text>
              </View>
            </View>

            <Text style={st.section}>{t('skills', lang)}</Text>
            <View style={st.card}>
              {rep.domains.map((d) => (
                <View key={d.key} style={st.skill}>
                  <Text style={st.skillName}>{lang === 'en' ? d.label : DOMAIN_SI[d.key] || d.label}</Text>
                  <View style={st.track}><View style={[st.fill, { width: `${Math.max(2, d.now ?? d.before ?? 0)}%` }]} /></View>
                  <Text style={st.skillVal}>{d.now == null ? '–' : Math.round(d.now)} / {d.before == null ? '–' : Math.round(d.before)}</Text>
                </View>
              ))}
            </View>

            {rep.people.length > 0 && (
              <>
                <Text style={st.section}>{t('people', lang)}</Text>
                <View style={st.card}>
                  {rep.people.slice(0, 5).map((p, i) => (
                    <Text key={`${p.name}-${i}`} style={st.listLine}>{p.name || p.relation} · {p.relation} · {p.visits}x</Text>
                  ))}
                </View>
              </>
            )}
            {rep.top_items.length > 0 && (
              <>
                <Text style={st.section}>{t('items', lang)}</Text>
                <View style={st.card}>
                  {rep.top_items.map((it) => (
                    <Text key={it.label} style={st.listLine}>{lang === 'en' ? it.label : it.label_si} · {it.count}x</Text>
                  ))}
                </View>
              </>
            )}
            <Text style={st.disclaimer}>{t('disclaimer', lang)}</Text>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7F5' },
  scroll: { padding: 20, paddingBottom: 48 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  backBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E3EAE7' },
  title: { fontSize: 22, fontWeight: '900', color: '#0F2A24' },
  sub: { fontSize: 13, color: '#64748B', fontWeight: '600' },
  langRow: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E3EAE7', padding: 3 },
  langBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 9 },
  langOn: { backgroundColor: '#0F9D8A' },
  langText: { fontWeight: '800', color: '#0F2A24', fontSize: 12 },
  offline: { flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: '#FEE2E2', borderRadius: 14, padding: 12, marginBottom: 12 },
  offlineText: { color: '#991B1B', fontWeight: '700', flex: 1 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#E3EAE7', marginBottom: 6 },
  cardTitle: { fontSize: 16, fontWeight: '900', color: '#0F2A24', marginBottom: 6 },
  muted: { fontSize: 13, color: '#64748B', fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#E3EAE7', borderRadius: 14, padding: 12, fontSize: 18, marginTop: 12, letterSpacing: 6, color: '#0F2A24' },
  err: { color: '#B91C1C', fontWeight: '700', marginTop: 8 },
  primary: { backgroundColor: '#0F9D8A', borderRadius: 14, padding: 14, alignItems: 'center', marginTop: 12 },
  primaryText: { color: '#fff', fontWeight: '900', fontSize: 15 },
  section: { fontSize: 18, fontWeight: '900', color: '#0F2A24', marginTop: 20, marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 18, padding: 14, borderWidth: 1, borderColor: '#E3EAE7', marginBottom: 8 },
  dot: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  dotText: { fontWeight: '900', fontSize: 15 },
  rowName: { fontSize: 16, fontWeight: '800', color: '#0F2A24' },
  badge: { fontSize: 11, fontWeight: '800', color: '#92400E', backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, overflow: 'hidden' },
  heroRow: { flexDirection: 'row', gap: 10 },
  hero: { flex: 1 },
  big: { fontSize: 38, fontWeight: '900', color: '#0F2A24', marginVertical: 4 },
  of: { fontSize: 15, color: '#64748B', fontWeight: '700' },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  trendText: { fontSize: 14, fontWeight: '800', color: '#0F2A24' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  chip: { fontSize: 12, fontWeight: '800', color: '#0F2A24', backgroundColor: '#E6F4F1', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, overflow: 'hidden' },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 3, justifyContent: 'center', marginTop: 4 },
  legendBox: { width: 18, height: 10, borderRadius: 3 },
  legendText: { fontSize: 11, color: '#64748B', fontWeight: '700', marginHorizontal: 3 },
  note: { fontSize: 12, color: '#64748B', textAlign: 'center', marginTop: 8 },
  tip: { fontSize: 13, color: '#0F2A24', fontWeight: '700', marginBottom: 8 },
  chart: { flexDirection: 'row', alignItems: 'flex-end', height: 124, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  barHit: { flex: 1, height: '100%', justifyContent: 'flex-end', paddingHorizontal: 1 },
  bar: { width: '100%', borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  axis: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  axisText: { fontSize: 11, color: '#94A3B8', fontWeight: '700' },
  skill: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  skillName: { width: 120, fontSize: 13, fontWeight: '700', color: '#0F2A24' },
  track: { flex: 1, height: 10, backgroundColor: '#EEF2F1', borderRadius: 5, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: '#0F9D8A', borderRadius: 5 },
  skillVal: { width: 62, textAlign: 'right', fontSize: 12, fontWeight: '800', color: '#0F2A24' },
  listLine: { fontSize: 14, color: '#0F2A24', fontWeight: '600', marginBottom: 6 },
  disclaimer: { fontSize: 12, color: '#64748B', textAlign: 'center', marginTop: 18 },
});
