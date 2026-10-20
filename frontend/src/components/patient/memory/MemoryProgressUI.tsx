import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator, Animated, Easing, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import Svg, { ClipPath, Defs, Ellipse, G, Path, RadialGradient, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { AI_URL, getCaregiverPin, getPatientId, Lang, setCaregiverPin } from '../../../services/memoryAI';

// Caregiver view of every registered patient's memory progress (memory_quiz.py
// /memory-report*, which reads the team's patients / MMSE / games read-only).
// The brain picture is an illustration of the game's memory-skill scores, not a
// brain scan - the screen says so.

const LANG_KEY = 'memory_lang';
const REFRESH_MS = 30000;
const T = {
  title: { si: 'මතක ප්‍රගතිය', en: 'Memory progress' },
  sub: { si: 'Caregiver සඳහා', en: 'For the caregiver' },
  pinTitle: { si: 'Caregiver PIN එක දාන්න', en: 'Enter the caregiver PIN' },
  pinHelp: { si: 'මෙතන හැම patient කෙනෙක්ගෙම තොරතුරු තියෙනවා. Caregiver ට විතරයි.', en: "This shows every patient's data. Caregiver only." },
  pinWrong: { si: 'PIN එක වැරදියි', en: 'Wrong PIN' },
  pinNone: { si: 'තවම PIN එකක් නැහැ. Family screen එකේ PIN එකක් හදන්න.', en: 'No PIN yet. Set one on the Family screen.' },
  unlock: { si: 'විවෘත කරන්න', en: 'Unlock' },
  patients: { si: 'ලියාපදිංචි patients ({n})', en: 'Registered patients ({n})' },
  updated: { si: 'යාවත්කාලීන කළේ {t} · තත්පර 30න් 30ට', en: 'Updated {t} · every 30 s' },
  games: { si: 'මතක සෙල්ලම් {n}', en: '{n} memory games' },
  noGames: { si: 'මතක සෙල්ලම් නැහැ', en: 'No memory games' },
  mmse: { si: 'MMSE {n}/30', en: 'MMSE {n}/30' },
  simulated: { si: 'Demo (simulated)', en: 'Demo (simulated)' },
  escalate: { si: 'දොස්තර බලන්න ඕනේ', en: 'Escalate' },
  monitor: { si: 'නිරීක්ෂණය', en: 'Monitor' },
  allReport: { si: 'හැම patient ගේම අවදානම් වාර්තාව', en: 'All-patients risk report' },
  allHelp: { si: 'අවදානම වැඩිම අය උඩින්. PDF එකක් විදිහට share කරන්න පුළුවන්.', en: 'Highest risk first. Can be shared as a PDF.' },
  pdf: { si: 'PDF එක හදන්න', en: 'Export PDF' },
  risk: { si: 'සති 4කින් ලකුණු 5ක් අඩුවීමේ අවදානම', en: 'Risk of a 5-point drop in 4 weeks' },
  riskHigh: { si: 'වැඩියි', en: 'High' },
  riskMedium: { si: 'මධ්‍යම', en: 'Medium' },
  riskLow: { si: 'අඩුයි', en: 'Low' },
  notEnough: { si: 'අනාවැකියට දත්ත මදි (දවස් {have}/{need})', en: 'Not enough data to forecast ({have}/{need} days)' },
  now: { si: 'මේ සතියේ මතක ලකුණු', en: 'Memory score this week' },
  fc4: { si: 'සති 4කින්', en: 'In 4 weeks' },
  fc8: { si: 'සති 8කින්', en: 'In 8 weeks' },
  range: { si: 'බොහෝවිට {a}–{b}', en: 'likely {a}–{b}' },
  improving: { si: 'දියුණු වෙනවා', en: 'Improving' },
  stable: { si: 'ස්ථාවරයි', en: 'Stable' },
  declining: { si: 'අඩු වෙනවා', en: 'Declining' },
  noTrend: { si: 'ප්‍රවණතාවයට තව දත්ත ඕනේ', en: 'Needs more days for a trend' },
  perWeek: { si: 'සතියකට {n}', en: '{n} per week' },
  brain: { si: 'මතක කුසලතා සිතියම', en: 'Memory skills map' },
  brainNow: { si: 'දැන්', en: 'Now' },
  brain4: { si: 'සති 4කින්', en: 'In 4 weeks' },
  brain4Off: { si: 'සති 4 පෙන්නන්න දත්ත මදි', en: 'Not enough data for 4 weeks' },
  brainTap: { si: 'කොටසක් ඔබලා විස්තර බලන්න. දිලිසෙන කොටස් = දුර්වලයි (50ට අඩු).', en: 'Tap an area for details. Glowing areas are weak (below 50).' },
  brainNote: { si: 'මතක සෙල්ලමේ ලකුණු පෙන්නන රූපයක් - මොළයේ scan එකක් නෙමෙයි.', en: "A picture of the memory game's scores - not a brain scan." },
  if4: { si: 'දැන් තියෙන සමස්ත ප්‍රවණතාවය දිගටම ගියොත්', en: 'if the overall trend continues' },
  thisWeek: { si: 'මේ සතිය', en: 'This week' },
  before: { si: 'කලින්', en: 'Before' },
  weak: { si: 'දුර්වලයි - ක්‍රීඩාව මේ ගැන වැඩිපුර අහනවා', en: 'Weak - the game asks about this more often' },
  daily: { si: 'දවසින් දවස (දවස් 30)', en: 'Day by day (30 days)' },
  tapBar: { si: 'දවසක් ඔබලා ලකුණ බලන්න', en: 'Tap a day to see its score' },
  noScore: { si: 'සෙල්ලම් නැහැ', en: 'no game' },
  skills: { si: 'කුසලතා (මේ සතිය / කලින්)', en: 'Skills (this week / before)' },
  team: { si: 'MMSE සහ අනෙක් පරීක්ෂණ', en: 'MMSE and other tests' },
  demoHistory: { si: 'Demo දත්ත', en: 'Demo history' },
  demoBanner: { si: 'Forecast එක පෙන්වීමට පහුගිය සති 4ට simulated demo දත්ත දාලා තියෙනවා - සැබෑ ක්‍රීඩා ප්‍රතිඵල නෙමෙයි.',
    en: 'Simulated demo history (past 4 weeks) is included to show the forecast - not real game results.' },
  why: { si: 'ඇයි මේ කොටස?', en: 'Why this area?' },
  mmseHist: { si: 'MMSE ඉතිහාසය', en: 'MMSE history' },
  cogGames: { si: 'Cognitive games දවස් {n} · අන්තිම නිරවද්‍යතාව {a}%', en: 'Cognitive games: {n} days · latest accuracy {a}%' },
  severity: { si: 'Severity screening: {s} ({d})', en: 'Severity screening: {s} ({d})' },
  noTeam: { si: 'අනිත් කොටස් වල දත්ත තවම නැහැ.', en: 'No data from the other components yet.' },
  insights: { si: 'සාරාංශය', en: 'Summary' },
  streak: { si: 'දිගටම දවස් {n}', en: '{n}-day streak' },
  unaided: { si: 'උදව් නැතුව {n}%', en: '{n}% without help' },
  people: { si: 'හමුවුණ අය', en: 'People met' },
  items: { si: 'හොයපු දේවල්', en: 'Things searched for' },
  disclaimer: { si: 'මේක නිරීක්ෂණයට විතරයි. රෝග විනිශ්චයක් නෙමෙයි - තීරණ දොස්තර ගන්නවා.',
    en: 'For monitoring only. Not a diagnosis - clinical decisions stay with the doctor.' },
  offline: { si: 'සේවාවට සම්බන්ධ වෙන්න බැහැ. ටිකකින් ආයෙත් උත්සාහ කරන්න.', en: 'Cannot reach the service. Please try again shortly.' },
};
type Key = keyof typeof T;
const t = (k: Key, lang: Lang, vars: Record<string, string | number> = {}) =>
  Object.entries(vars).reduce((s, [a, b]) => s.replace(`{${a}}`, String(b)), T[k][lang]);

const DOMAIN_SI: Record<string, string> = {
  people: 'පුද්ගලයෝ', places: 'දේවල් තිබ්බ තැන්', objects: 'දේවල්', time: 'සිදුවීම් වෙලාව',
  orientation: 'දවස / දිනය', delayed: 'පස්සේ මතක් කිරීම', conversation: 'කතාබහ',
};
// Brain region <- memory-game skills (a teaching picture of which skills lean on which area).
// top / bottom = the region's vertical extent in the 300x200 picture, for the fill animation.
const REGIONS = [
  { key: 'frontal', domains: ['orientation', 'time'], si: 'වෙලාව / දවස', en: 'Time & day', top: 22, bottom: 118,
    about: { si: 'අද දවස, දිනය, දේවල් වුණු වෙලාව මතක තියාගැනීම.', en: 'Knowing the day and date, and when things happened.' },
    why: { si: 'ඉදිරිපස කොටස (frontal lobe) දේවල් වුණු පිළිවෙළ සහ වෙලාව මතක තියාගන්න උදව් වෙනවා.',
      en: 'The frontal lobe helps keep track of time and the order in which things happened.' },
    d: 'M35 115 C25 70 60 30 115 22 L130 100 C100 112 65 118 35 115 Z', lx: 78, ly: 78 },
  { key: 'parietal', domains: ['places'], si: 'තැන්', en: 'Places', top: 12, bottom: 100,
    about: { si: 'දේවල් තිබ්බ තැන් සහ කාමර මතක තියාගැනීම.', en: 'Remembering where things were put and which room.' },
    why: { si: 'උඩ කොටස (parietal lobe) තැන් සහ දිශා තේරුම් ගන්නවා. Alzheimer\'s වලදී මේක කලින්ම බලපාන කොටසක්.',
      en: "The parietal lobe handles places and directions - one of the areas Alzheimer's affects early." },
    d: 'M115 22 C165 12 215 25 240 55 L185 100 L130 100 Z', lx: 178, ly: 58 },
  { key: 'occipital', domains: ['objects'], si: 'දේවල්', en: 'Objects', top: 55, bottom: 135,
    about: { si: 'දැකපු දේවල් හඳුනාගැනීම සහ ඒවා මොකටද කියලා දැනගැනීම.', en: 'Recognising things that were seen and what they are for.' },
    why: { si: 'පිටුපස කොටස (occipital lobe) ඇහෙන් දකින දේ හඳුනාගන්නවා.',
      en: 'The occipital lobe, at the back, recognises what the eyes see.' },
    d: 'M240 55 C268 75 275 110 255 135 L205 125 L185 100 Z', lx: 236, ly: 100 },
  { key: 'temporal', domains: ['people', 'conversation'], si: 'අය / කතා', en: 'People & talk', top: 100, bottom: 158,
    about: { si: 'බලන්න ආපු අය සහ එයාලා කතා කරපු දේ මතක තියාගැනීම.', en: 'Remembering visitors and what they talked about.' },
    why: { si: 'පැති කොටස (temporal lobe) මුහුණු, නම් සහ භාෂාව මතක තියාගන්නවා.',
      en: 'The temporal lobe, at the side, holds faces, names and language.' },
    d: 'M35 115 C65 118 100 112 130 100 L185 100 L205 125 C170 150 110 158 70 145 C50 138 38 128 35 115 Z', lx: 96, ly: 138 },
  { key: 'hippo', domains: ['delayed'], si: 'මතකය', en: 'Recall', top: 106, bottom: 126,
    about: { si: 'ටික වෙලාවකට පස්සේ (පැය ගාණකට පස්සේ) මතක් කරගැනීම.', en: 'Remembering after a delay of hours.' },
    why: { si: 'Hippocampus එක අලුත් මතක හදනවා. Alzheimer\'s වලදී මුලින්ම බලපාන්නේ මේකට - ඒ නිසා "පස්සේ මතක් කිරීම" තමයි වැදගත්ම ලකුණ.',
      en: "The hippocampus makes new memories. Alzheimer's affects it first, so delayed recall is the most telling score." },
    d: 'M126 116 A24 10 0 1 0 174 116 A24 10 0 1 0 126 116 Z', lx: 150, ly: 117 },
];
const WEAK = 50;
// One sequential hue (teal) for score: light = low, dark = high. Grey = no games yet.
const RAMP = ['#D5F3EE', '#A6E4D9', '#6FCFBF', '#34B3A0', '#0F9D8A', '#0B7768'];
const NO_DATA = '#E2E8F0';
const scoreColor = (v: number | null | undefined) =>
  v == null ? NO_DATA : RAMP[Math.min(RAMP.length - 1, Math.floor((Math.max(0, Math.min(100, v)) / 100) * RAMP.length))];
const inkOn = (v: number | null | undefined) => (v != null && v >= 67 ? '#FFFFFF' : '#0F2A24');   // white only on the two darkest steps

type Forecast = {
  status: 'ok' | 'not_enough_data'; now?: number; w4?: number; w8?: number; ci4?: [number, number]; ci8?: [number, number];
  slope_week?: number; own_slope_week?: number; pool_weight?: number; risk?: number; risk_level?: 'high' | 'medium' | 'low';
  have_days?: number; need_days?: number;
  model_metrics?: { mae_4w?: { baseline_avg7_plus_slope: number; partial_pooling: number } };
};
type PatientRow = {
  patient_id: string; name: string; simulated: boolean; registered: boolean; age?: number; condition?: string; stage?: string;
  sessions: number; last_score: number | null; last_played: string | null; mmse_last: number | null; mmse_date: string | null;
  game_days: number; severity: string | null; demo_history?: boolean;
};
type RiskRow = PatientRow & {
  avg_7: number | null; trend: string | null; forecast: Forecast; risk: number | null; risk_level: string | null;
  weakest: { key: string; label: string; now: number } | null;
};
type Domain = { key: string; label: string; now: number | null; before: number | null };
type Report = {
  name: string; simulated: boolean;
  summary: { latest_score: number | null; avg_7: number | null; slope_per_week: number | null; trend: string | null;
    streak: number; unaided_pct: number | null; level: string; demo_history?: boolean };
  daily: { date: string; score: number | null }[];
  domains: Domain[];
  people: { name: string; relation: string; minutes: number; visits: number }[];
  top_items: { label: string; label_si: string; count: number }[];
  forecast: Forecast;
  mmse: { date: string; total: number; severity?: string }[];
  cognitive_games: { date: string; accuracy: number }[];
  severity: { triage: string; date: string } | null;
  insights: { tone: string; text: string; text_si?: string }[];
};

function avg(xs: (number | null | undefined)[]) {
  const v = xs.filter((x): x is number => x != null);
  return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null;
}
const clamp = (v: number) => Math.max(0, Math.min(100, v));
const hhmmss = (d: Date) => d.toTimeString().slice(0, 8);

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedPath = Animated.createAnimatedComponent(Path);

/** Each area fills up to its score like a glass of water; weak areas glow; tap = details. */
function Brain({ values, lang, selected, onSelect }: {
  values: Record<string, number | null>; lang: Lang; selected: string | null; onSelect: (k: string) => void;
}) {
  const fills = useRef(Object.fromEntries(REGIONS.map((r) => [r.key, new Animated.Value(0)]))).current;
  const glow = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.stagger(140, REGIONS.map((r) => Animated.timing(fills[r.key], {
      toValue: (values[r.key] ?? 0) / 100, duration: 1100, easing: Easing.out(Easing.cubic), useNativeDriver: false,
    }))).start();
  }, [values, fills]);
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(glow, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
      Animated.timing(glow, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [glow]);
  return (
    <Svg width="100%" height={240} viewBox="0 0 300 200">
      <Defs>
        <RadialGradient id="shine" cx="38%" cy="28%" r="70%">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.5" />
          <Stop offset="0.6" stopColor="#FFFFFF" stopOpacity="0.05" />
          <Stop offset="1" stopColor="#000000" stopOpacity="0.15" />
        </RadialGradient>
        {REGIONS.map((r) => <ClipPath key={r.key} id={`clip-${r.key}`}><Path d={r.d} /></ClipPath>)}
      </Defs>
      <Ellipse cx="150" cy="190" rx="110" ry="8" fill="#0F2A24" opacity={0.1} />
      <Path d="M205 135 C235 135 262 140 258 160 C250 178 215 178 200 165 C192 155 195 142 205 135 Z" fill="#CBD5E1" stroke="#fff" strokeWidth={2} />
      <Path d="M172 150 L190 186 L176 188 L162 154 Z" fill="#CBD5E1" stroke="#fff" strokeWidth={2} />
      {REGIONS.map((r) => {
        const v = values[r.key];
        const h = r.bottom - r.top;
        const level = fills[r.key];
        return (
          <G key={r.key} onPress={() => onSelect(r.key)}>
            <Path d={r.d} fill={NO_DATA} stroke="#fff" strokeWidth={2} />
            {v != null && (
              <G clipPath={`url(#clip-${r.key})`}>
                <AnimatedRect x={0} width={300} fill={scoreColor(v)}
                  y={level.interpolate({ inputRange: [0, 1], outputRange: [r.bottom, r.top] })}
                  height={level.interpolate({ inputRange: [0, 1], outputRange: [0, h] })} />
              </G>
            )}
            {v != null && v < WEAK && (
              <AnimatedPath d={r.d} fill="none" stroke="#F59E0B" strokeWidth={4}
                strokeOpacity={glow.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.95] })} />
            )}
            {selected === r.key && <Path d={r.d} fill="none" stroke="#0F2A24" strokeWidth={3} />}
            {r.key !== 'hippo' && (
              <SvgText x={r.lx} y={r.ly - 6} fontSize={10} fontWeight="700" fill={inkOn(v)} textAnchor="middle">{lang === 'en' ? r.en : r.si}</SvgText>
            )}
            <SvgText x={r.lx} y={r.key === 'hippo' ? r.ly + 3 : r.ly + 9} fontSize={r.key === 'hippo' ? 9 : 14} fontWeight="900"
              fill={inkOn(v)} textAnchor="middle">
              {r.key === 'hippo' ? `${lang === 'en' ? r.en : r.si} ${v ?? '–'}` : v == null ? '–' : `${v}`}
            </SvgText>
          </G>
        );
      })}
      <Path d="M35 115 C25 70 60 30 115 22 C165 12 215 25 240 55 C268 75 275 110 255 135 L205 125 C170 150 110 158 70 145 C50 138 38 128 35 115 Z"
        fill="url(#shine)" pointerEvents="none" />
    </Svg>
  );
}

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));

function riskHtml(rows: RiskRow[], generated: string, lang: Lang) {
  const lvl = (r: RiskRow) => (r.risk_level ? t(r.risk_level === 'high' ? 'riskHigh' : r.risk_level === 'medium' ? 'riskMedium' : 'riskLow', lang) : '');
  const body = rows.map((r, i) => {
    const f = r.forecast;
    const fc = f.status === 'ok' ? `${f.w4} (${f.ci4?.[0]}–${f.ci4?.[1]})` : t('notEnough', lang, { have: f.have_days ?? 0, need: f.need_days ?? 5 });
    return `<tr class="${r.risk_level || ''}"><td>${i + 1}</td><td><b>${esc(r.name)}</b>${r.simulated ? ' <i>(simulated)</i>' : ''}<br/>
      <small>${esc([r.age, r.condition, r.stage].filter(Boolean).join(' · '))}</small></td>
      <td>${r.avg_7 ?? '–'}</td><td>${esc(r.trend ?? '–')}</td><td>${esc(fc)}</td>
      <td>${r.risk != null ? `${Math.round(r.risk * 100)}% ${esc(lvl(r))}` : '–'}</td>
      <td>${r.mmse_last != null ? `${r.mmse_last}/30<br/><small>${esc(r.mmse_date)}</small>` : '–'}</td>
      <td>${esc(r.severity ?? '–')}</td><td>${r.weakest ? `${esc(r.weakest.label)} ${Math.round(r.weakest.now)}%` : '–'}</td></tr>`;
  }).join('');
  return `<html><head><meta charset="utf-8"/><style>
    body{font-family:-apple-system,Roboto,'Noto Sans Sinhala',sans-serif;color:#0F2A24;padding:24px}
    h1{font-size:22px;margin:0} .sub{color:#64748B;margin:4px 0 16px}
    table{width:100%;border-collapse:collapse;font-size:11px} th{background:#0F9D8A;color:#fff;text-align:left;padding:6px}
    td{border-bottom:1px solid #E2E8F0;padding:6px;vertical-align:top} tr.high td{background:#FEF3C7} tr.medium td{background:#F0FDFA}
    small{color:#64748B} .note{color:#64748B;font-size:11px;margin-top:16px}
  </style></head><body>
    <h1>MemoCare · ${esc(t('allReport', lang))}</h1>
    <div class="sub">${esc(new Date(generated).toLocaleString())} · ${rows.length} patients</div>
    <table><tr><th>#</th><th>Patient</th><th>Memory (7 d)</th><th>Trend</th><th>Forecast 4 wk</th><th>Risk</th><th>MMSE</th><th>Severity</th><th>Weakest skill</th></tr>${body}</table>
    <p class="note">${esc(t('disclaimer', lang))}${rows.some((r) => r.demo_history) ? '<br/>* Some histories include simulated demonstration data.' : ''}<br/>Forecast: partial pooling (empirical-Bayes random slope) + gradient boosting, trained on a simulated cohort; shown only with at least 5 game days in the last month. MMSE, cognitive games and severity are read from the other components.</p>
  </body></html>`;
}

export default function MemoryProgressUI() {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>('si');
  const [pid, setPid] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(!!getCaregiverPin());
  const [pinInput, setPinInput] = useState('');
  const [pinMsg, setPinMsg] = useState('');
  const [rows, setRows] = useState<PatientRow[] | null>(null);
  const [updated, setUpdated] = useState<Date | null>(null);
  const [view, setView] = useState<'list' | 'all' | 'one'>('list');
  const [sel, setSel] = useState<PatientRow | null>(null);
  const [rep, setRep] = useState<Report | null>(null);
  const [risk, setRisk] = useState<{ patients: RiskRow[]; generated: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [offline, setOffline] = useState(false);
  const [tapped, setTapped] = useState<{ date: string; score: number | null } | null>(null);
  const [brainMode, setBrainMode] = useState<'now' | 'w4'>('now');
  const [region, setRegion] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try { const l = await AsyncStorage.getItem(LANG_KEY); if (l === 'en' || l === 'si') setLang(l); } catch {}
      setPid(await getPatientId());
    })();
  }, []);
  const changeLang = async (l: Lang) => { setLang(l); try { await AsyncStorage.setItem(LANG_KEY, l); } catch {} };
  const auth = useCallback(() => ({ patient_id: pid || '', pin: getCaregiverPin() || '' }), [pid]);

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
      const r = await axios.get(`${AI_URL}/memory-report-patients`, { params: auth(), timeout: 20000 });
      setRows((r.data.patients as PatientRow[]).filter((p) => !p.patient_id.endsWith('-TEST') && !p.patient_id.startsWith('EVAL')));
      setUpdated(new Date()); setOffline(false);
    } catch { setOffline(true); }
  }, [auth]);

  const loadOne = useCallback(async (p: PatientRow) => {
    try {
      const r = await axios.get(`${AI_URL}/memory-report/${p.patient_id}`, { params: { days: 30 }, timeout: 20000 });
      setRep(r.data); setUpdated(new Date()); setOffline(false);
    } catch { setOffline(true); }
  }, []);

  const loadRisk = useCallback(async () => {
    try {
      const r = await axios.get(`${AI_URL}/memory-report-all`, { params: auth(), timeout: 45000 });
      if (r.data.status === 'success') { setRisk(r.data); setUpdated(new Date()); setOffline(false); }
    } catch { setOffline(true); }
  }, [auth]);

  const reload = useCallback(async () => {
    if (view === 'one' && sel) await loadOne(sel);
    else if (view === 'all') await loadRisk();
    else await loadList();
  }, [view, sel, loadOne, loadRisk, loadList]);

  // Live: refresh the open view every 30 s (new games, MMSE or visits appear on their own).
  useEffect(() => {
    if (!unlocked || !pid) return;
    reload();
    const id = setInterval(reload, REFRESH_MS);
    return () => clearInterval(id);
  }, [unlocked, pid, reload]);

  const onPull = async () => { setRefreshing(true); await reload(); setRefreshing(false); };

  const open = async (p: PatientRow) => {
    setSel(p); setRep(null); setTapped(null); setRegion(null); setBrainMode('now'); setView('one'); setLoading(true);
    await loadOne(p); setLoading(false);
  };
  const openAll = async () => { setView('all'); setRisk(null); setLoading(true); await loadRisk(); setLoading(false); };
  const goBack = () => {
    if (view !== 'list') { setView('list'); setSel(null); setRep(null); } else router.back();
  };

  const exportPdf = async () => {
    if (!risk) return;
    try {
      const { uri } = await Print.printToFileAsync({ html: riskHtml(risk.patients, risk.generated, lang) });
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: t('allReport', lang) });
    } catch { setOffline(true); }
  };

  const s7 = rep?.summary;
  const fc = rep?.forecast;
  const nowScore = s7 ? (s7.avg_7 ?? s7.latest_score) : null;
  const trendKey = s7?.trend === 'improving' ? 'improving' : s7?.trend === 'declining' ? 'declining' : s7?.trend === 'stable' ? 'stable' : 'noTrend';
  const trendIcon = trendKey === 'improving' ? 'trending-up' : trendKey === 'declining' ? 'trending-down' : 'remove';
  const canW4 = fc?.status === 'ok' && fc.slope_week != null;

  // Region values: this week's skill scores, or projected 4 weeks on the forecast's pooled trend.
  const regionValues = useMemo(() => {
    const doms = rep?.domains || [];
    const base = (keys: string[]) => avg(doms.filter((d) => keys.includes(d.key)).map((d) => d.now ?? d.before));
    return Object.fromEntries(REGIONS.map((r) => {
      const v = base(r.domains);
      return [r.key, v == null ? null : brainMode === 'w4' && canW4 ? Math.round(clamp(v + (fc!.slope_week as number) * 4)) : v];
    })) as Record<string, number | null>;
  }, [rep, brainMode, canW4, fc]);
  const regionInfo = REGIONS.find((r) => r.key === region);

  const riskChip = (level?: string | null, p?: number | null) => level ? (
    <Text style={[st.riskChip, level === 'high' ? st.riskHigh : level === 'medium' ? st.riskMed : st.riskLow]}>
      {t(level === 'high' ? 'riskHigh' : level === 'medium' ? 'riskMedium' : 'riskLow', lang)}{p != null ? ` ${Math.round(p * 100)}%` : ''}
    </Text>
  ) : null;
  const sevChip = (s?: string | null) => s ? (
    <Text style={[st.chip, s === 'escalate' && st.chipWarn]}>{t(s === 'escalate' ? 'escalate' : 'monitor', lang)}</Text>
  ) : null;

  return (
    <SafeAreaView style={st.container} edges={['top']}>
      <ScrollView contentContainerStyle={st.scroll}
        refreshControl={unlocked ? <RefreshControl refreshing={refreshing} onRefresh={onPull} tintColor="#0F9D8A" /> : undefined}>
        <View style={st.header}>
          <TouchableOpacity style={st.backBtn} onPress={goBack}>
            <Ionicons name="arrow-back" size={22} color="#0F2A24" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={st.title}>{t('title', lang)}</Text>
            <Text style={st.sub}>{view === 'one' && sel ? sel.name : view === 'all' ? t('allReport', lang) : t('sub', lang)}</Text>
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
        {unlocked && updated && (
          <View style={st.liveRow}><View style={st.liveDot} /><Text style={st.liveText}>{t('updated', lang, { t: hhmmss(updated) })}</Text></View>
        )}

        {!unlocked ? (
          <View style={st.card}>
            <Text style={st.cardTitle}>{t('pinTitle', lang)}</Text>
            <Text style={st.muted}>{t('pinHelp', lang)}</Text>
            <TextInput style={st.input} value={pinInput} onChangeText={setPinInput} keyboardType="number-pad" secureTextEntry maxLength={8} />
            {!!pinMsg && <Text style={st.err}>{pinMsg}</Text>}
            <TouchableOpacity style={st.primary} onPress={unlock}><Text style={st.primaryText}>{t('unlock', lang)}</Text></TouchableOpacity>
          </View>
        ) : view === 'list' ? (
          <>
            <TouchableOpacity style={st.allBtn} onPress={openAll} activeOpacity={0.85}>
              <Ionicons name="podium" size={24} color="#fff" />
              <View style={{ flex: 1 }}>
                <Text style={st.allTitle}>{t('allReport', lang)}</Text>
                <Text style={st.allHelp}>{t('allHelp', lang)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#fff" />
            </TouchableOpacity>
            <Text style={st.section}>{t('patients', lang, { n: rows?.filter((r) => r.registered).length ?? 0 })}</Text>
            {!rows ? <ActivityIndicator color="#0F9D8A" style={{ marginTop: 30 }} /> : rows.map((p) => (
              <TouchableOpacity key={p.patient_id} style={st.row} onPress={() => open(p)}>
                <View style={[st.dot, { backgroundColor: scoreColor(p.last_score) }]}>
                  <Text style={[st.dotText, { color: inkOn(p.last_score) }]}>{p.last_score == null ? '–' : Math.round(p.last_score)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={st.rowName}>{p.name}</Text>
                  {!!(p.age || p.condition) && <Text style={st.muted}>{[p.age, p.condition, p.stage].filter(Boolean).join(' · ')}</Text>}
                  <View style={st.chips}>
                    <Text style={st.chip}>{p.sessions ? t('games', lang, { n: p.sessions }) : t('noGames', lang)}</Text>
                    {p.mmse_last != null && <Text style={st.chip}>{t('mmse', lang, { n: p.mmse_last })}</Text>}
                    {sevChip(p.severity)}
                    {p.simulated && <Text style={st.badge}>{t('simulated', lang)}</Text>}
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
              </TouchableOpacity>
            ))}
          </>
        ) : view === 'all' ? (
          loading || !risk ? <ActivityIndicator color="#0F9D8A" style={{ marginTop: 40 }} /> : (
            <>
              <TouchableOpacity style={st.primary} onPress={exportPdf}>
                <Text style={st.primaryText}><Ionicons name="document-text" size={16} /> {t('pdf', lang)}</Text>
              </TouchableOpacity>
              <Text style={st.section}>{t('risk', lang)}</Text>
              {risk.patients.map((r, i) => (
                <TouchableOpacity key={r.patient_id} style={st.row} onPress={() => open(r)}>
                  <Text style={st.rank}>{i + 1}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={st.rowName}>{r.name}</Text>
                    <View style={st.chips}>
                      {riskChip(r.risk_level, r.risk)}
                      {r.forecast.status !== 'ok' && (
                        <Text style={st.chipMuted}>{t('notEnough', lang, { have: r.forecast.have_days ?? 0, need: r.forecast.need_days ?? 5 })}</Text>
                      )}
                      {r.forecast.status === 'ok' && <Text style={st.chip}>{t('fc4', lang)}: {r.forecast.w4}</Text>}
                      {r.mmse_last != null && <Text style={st.chip}>{t('mmse', lang, { n: r.mmse_last })}</Text>}
                      {sevChip(r.severity)}
                      {r.simulated && <Text style={st.badge}>{t('simulated', lang)}</Text>}
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
                </TouchableOpacity>
              ))}
              <Text style={st.disclaimer}>{t('disclaimer', lang)}</Text>
            </>
          )
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
                  <Text style={st.trendText}>{t(trendKey as Key, lang)}</Text>
                </View>
                {s7?.slope_per_week != null && <Text style={st.muted}>{t('perWeek', lang, { n: `${s7.slope_per_week > 0 ? '+' : ''}${s7.slope_per_week}` })}</Text>}
              </View>
              <View style={[st.card, st.hero]}>
                {fc?.status === 'ok' ? (
                  <>
                    <Text style={st.muted}>{t('fc4', lang)}</Text>
                    <Text style={st.big}>{Math.round(fc.w4 as number)}<Text style={st.of}>/100</Text></Text>
                    <Text style={st.muted}>{t('range', lang, { a: fc.ci4?.[0] ?? '', b: fc.ci4?.[1] ?? '' })}</Text>
                    <Text style={[st.muted, { marginTop: 4 }]}>{t('fc8', lang)}: {fc.w8} ({fc.ci8?.[0]}–{fc.ci8?.[1]})</Text>
                  </>
                ) : (
                  <>
                    <Text style={st.muted}>{t('fc4', lang)}</Text>
                    <Text style={st.big}>–</Text>
                    <Text style={st.muted}>{t('notEnough', lang, { have: fc?.have_days ?? 0, need: fc?.need_days ?? 5 })}</Text>
                  </>
                )}
              </View>
            </View>
            {fc?.status === 'ok' && (
              <View style={st.card}>
                <View style={st.riskRow}>
                  <Text style={[st.cardTitle, { flex: 1, marginBottom: 0 }]}>{t('risk', lang)}</Text>
                  {riskChip(fc.risk_level, fc.risk)}
                </View>
              </View>
            )}
            <View style={st.chips}>
              {!!s7?.streak && <Text style={st.chip}>{t('streak', lang, { n: s7.streak })}</Text>}
              {s7?.unaided_pct != null && <Text style={st.chip}>{t('unaided', lang, { n: Math.round(s7.unaided_pct) })}</Text>}
            </View>

            <Text style={st.section}>{t('brain', lang)}</Text>
            <View style={st.card}>
              <View style={st.toggle}>
                {(['now', 'w4'] as const).map((m) => (
                  <TouchableOpacity key={m} disabled={m === 'w4' && !canW4} onPress={() => setBrainMode(m)}
                    style={[st.toggleBtn, brainMode === m && st.toggleOn, m === 'w4' && !canW4 && { opacity: 0.4 }]}>
                    <Text style={[st.toggleText, brainMode === m && { color: '#fff' }]}>{t(m === 'now' ? 'brainNow' : 'brain4', lang)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {!canW4 && <Text style={[st.note, { marginTop: 0 }]}>{t('brain4Off', lang)}</Text>}
              {brainMode === 'w4' && <Text style={[st.note, { marginTop: 0 }]}>{t('if4', lang)}</Text>}
              <Brain values={regionValues} lang={lang} selected={region} onSelect={(k) => setRegion(region === k ? null : k)} />
              <View style={st.legend}>
                <Text style={st.legendText}>0</Text>
                {RAMP.map((c) => <View key={c} style={[st.legendBox, { backgroundColor: c }]} />)}
                <Text style={st.legendText}>100</Text>
                <View style={[st.legendBox, { backgroundColor: NO_DATA, marginLeft: 10 }]} />
                <Text style={st.legendText}>{t('noScore', lang)}</Text>
              </View>
              {regionInfo ? (
                <View style={st.regionCard}>
                  <Text style={st.cardTitle}>{lang === 'en' ? regionInfo.en : regionInfo.si} · {regionValues[regionInfo.key] ?? '–'}</Text>
                  <Text style={st.muted}>{regionInfo.about[lang]}</Text>
                  <Text style={st.whyTitle}>{t('why', lang)}</Text>
                  <Text style={st.muted}>{regionInfo.why[lang]}</Text>
                  {rep.domains.filter((d) => regionInfo.domains.includes(d.key)).map((d) => (
                    <Text key={d.key} style={st.listLine}>
                      {lang === 'en' ? d.label : DOMAIN_SI[d.key] || d.label}: {t('thisWeek', lang)} {d.now == null ? '–' : Math.round(d.now)} · {t('before', lang)} {d.before == null ? '–' : Math.round(d.before)}
                    </Text>
                  ))}
                  {(regionValues[regionInfo.key] ?? 100) < WEAK && <Text style={st.weakText}>{t('weak', lang)}</Text>}
                </View>
              ) : <Text style={st.note}>{t('brainTap', lang)}</Text>}
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
                      : { height: Math.max(4, (d.score / 100) * 120), backgroundColor: tapped?.date === d.date ? '#0B7768' : '#34B3A0' }]} />
                  </TouchableOpacity>
                ))}
              </View>
              <View style={st.axis}>
                <Text style={st.axisText}>{rep.daily[0]?.date.slice(5)}</Text>
                <Text style={st.axisText}>{rep.daily[rep.daily.length - 1]?.date.slice(5)}</Text>
              </View>
            </View>

            {rep.domains.length > 0 && (
              <>
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
              </>
            )}

            <Text style={st.section}>{t('team', lang)}</Text>
            <View style={st.card}>
              {!rep.mmse.length && !rep.cognitive_games?.length && !rep.severity && <Text style={st.muted}>{t('noTeam', lang)}</Text>}
              {rep.mmse.length > 0 && (
                <>
                  <Text style={st.cardTitle}>{t('mmseHist', lang)}</Text>
                  <View style={st.mmseRow}>
                    {rep.mmse.slice(-8).map((m, i) => (
                      <View key={`${m.date}-${i}`} style={st.mmseCol}>
                        <View style={[st.mmseBar, { height: Math.max(4, (m.total / 30) * 70) }]} />
                        <Text style={st.axisText}>{m.total}</Text>
                        <Text style={st.axisText}>{m.date.slice(5)}</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}
              {!!rep.cognitive_games?.length && (
                <Text style={st.listLine}>{t('cogGames', lang, { n: rep.cognitive_games.length, a: rep.cognitive_games[rep.cognitive_games.length - 1].accuracy })}</Text>
              )}
              {rep.severity && (
                <Text style={[st.listLine, rep.severity.triage === 'escalate' && { color: '#B45309' }]}>
                  {t('severity', lang, { s: t(rep.severity.triage === 'escalate' ? 'escalate' : 'monitor', lang), d: rep.severity.date })}
                </Text>
              )}
            </View>

            {rep.insights?.length > 0 && (
              <>
                <Text style={st.section}>{t('insights', lang)}</Text>
                <View style={st.card}>
                  {rep.insights.map((x, i) => (
                    <Text key={i} style={[st.listLine, x.tone === 'warn' && { color: '#B45309' }, x.tone === 'muted' && { color: '#64748B' }]}>• {lang === 'si' && x.text_si ? x.text_si : x.text}</Text>
                  ))}
                </View>
              </>
            )}
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
  scroll: { padding: 16, paddingBottom: 48 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  backBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E3EAE7' },
  title: { fontSize: 22, fontWeight: '900', color: '#0F2A24' },
  sub: { fontSize: 13, color: '#64748B', fontWeight: '600' },
  langRow: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E3EAE7', padding: 3 },
  langBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 9 },
  langOn: { backgroundColor: '#0F9D8A' },
  langText: { fontWeight: '800', color: '#0F2A24', fontSize: 12 },
  offline: { flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: '#FEE2E2', borderRadius: 14, padding: 12, marginBottom: 12 },
  offlineText: { color: '#991B1B', fontWeight: '700', flex: 1 },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22C55E' },
  liveText: { fontSize: 12, color: '#64748B', fontWeight: '700' },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#E3EAE7', marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: '900', color: '#0F2A24', marginBottom: 6 },
  muted: { fontSize: 13, color: '#64748B', fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#E3EAE7', borderRadius: 14, padding: 12, fontSize: 18, marginTop: 12, letterSpacing: 6, color: '#0F2A24' },
  err: { color: '#B91C1C', fontWeight: '700', marginTop: 8 },
  primary: { backgroundColor: '#0F9D8A', borderRadius: 14, padding: 14, alignItems: 'center', marginTop: 4 },
  primaryText: { color: '#fff', fontWeight: '900', fontSize: 15 },
  allBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#0B7768', borderRadius: 20, padding: 16 },
  allTitle: { color: '#fff', fontWeight: '900', fontSize: 16 },
  allHelp: { color: '#CCFBF1', fontWeight: '600', fontSize: 12, marginTop: 2 },
  section: { fontSize: 18, fontWeight: '900', color: '#0F2A24', marginTop: 18, marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 18, padding: 14, borderWidth: 1, borderColor: '#E3EAE7', marginBottom: 8 },
  rank: { width: 28, fontSize: 18, fontWeight: '900', color: '#0B7768', textAlign: 'center' },
  dot: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  dotText: { fontWeight: '900', fontSize: 15 },
  rowName: { fontSize: 16, fontWeight: '800', color: '#0F2A24' },
  badge: { fontSize: 11, fontWeight: '800', color: '#92400E', backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, overflow: 'hidden' },
  heroRow: { flexDirection: 'row', gap: 10 },
  hero: { flex: 1 },
  big: { fontSize: 36, fontWeight: '900', color: '#0F2A24', marginVertical: 4 },
  of: { fontSize: 15, color: '#64748B', fontWeight: '700' },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  trendText: { fontSize: 14, fontWeight: '800', color: '#0F2A24' },
  riskRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  riskChip: { fontSize: 12, fontWeight: '900', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, overflow: 'hidden' },
  riskHigh: { color: '#92400E', backgroundColor: '#FDE68A' },
  riskMed: { color: '#0F2A24', backgroundColor: '#CCFBF1' },
  riskLow: { color: '#14532D', backgroundColor: '#DCFCE7' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  chip: { fontSize: 12, fontWeight: '800', color: '#0F2A24', backgroundColor: '#E6F4F1', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 10, overflow: 'hidden' },
  chipWarn: { color: '#92400E', backgroundColor: '#FEF3C7' },
  chipMuted: { fontSize: 12, fontWeight: '700', color: '#64748B', backgroundColor: '#F1F5F9', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 10, overflow: 'hidden' },
  toggle: { flexDirection: 'row', alignSelf: 'center', backgroundColor: '#EEF2F1', borderRadius: 12, padding: 3, marginBottom: 6 },
  toggleBtn: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 9 },
  toggleOn: { backgroundColor: '#0F9D8A' },
  toggleText: { fontWeight: '800', color: '#0F2A24', fontSize: 13 },
  demoBanner: { flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: '#FEF3C7', borderRadius: 14, padding: 12, marginBottom: 10 },
  demoText: { flex: 1, color: '#92400E', fontWeight: '700', fontSize: 13 },
  whyTitle: { fontSize: 13, fontWeight: '900', color: '#0B7768', marginTop: 8 },
  regionCard: { backgroundColor: '#F0FDFA', borderRadius: 14, padding: 12, marginTop: 10 },
  weakText: { color: '#B45309', fontWeight: '800', marginTop: 4 },
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
  mmseRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, marginBottom: 10 },
  mmseCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: 104 },
  mmseBar: { width: 16, backgroundColor: '#34B3A0', borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  skill: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  skillName: { width: 120, fontSize: 13, fontWeight: '700', color: '#0F2A24' },
  track: { flex: 1, height: 10, backgroundColor: '#EEF2F1', borderRadius: 5, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: '#0F9D8A', borderRadius: 5 },
  skillVal: { width: 62, textAlign: 'right', fontSize: 12, fontWeight: '800', color: '#0F2A24' },
  listLine: { fontSize: 14, color: '#0F2A24', fontWeight: '600', marginBottom: 6 },
  disclaimer: { fontSize: 12, color: '#64748B', textAlign: 'center', marginTop: 18 },
});
