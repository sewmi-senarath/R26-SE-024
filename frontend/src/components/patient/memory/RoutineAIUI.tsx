import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { createAudioPlayer, RecordingPresets, setAudioModeAsync, useAudioRecorder } from 'expo-audio';
import {
  AI_URL, getCaregiverPin, getPatientId, getPatientName, Lang, setCaregiverPin, speak, startListening, stopSpeaking,
} from '../../../services/memoryAI';

// Sensor-free adaptive medicine reminders (backend: routine_ai.py). It learns from
// the patient's "Done / Later" taps and the caregiver's "Given" answers - no camera
// needed. The test buttons fire a reminder now so the whole flow can be tried.

const LANG_KEY = 'memory_lang';
const POLL_MS = 30000;

const T = {
  title: { si: 'AI බෙහෙත් මතක් කිරීම්', en: 'AI medicine reminders' },
  sub: { si: 'ඔයාගේ පුරුද්දට ඉගෙන ගන්නවා', en: 'Learns your own routine' },
  how: {
    si: 'ඔයා "කළා" ඔබන වෙලාවලින් ඔයාගේ බෙහෙත් වෙලාව ඉගෙන ගන්නවා. කළා නම් මතක් කරන්නේ නැහැ. නැත්නම් මතක් කරලා, ආයෙත් අහලා, ඊටත් පස්සේ caregiver ට කියනවා.',
    en: 'It learns your medicine time from when you tap "Done". If you already took it, it stays quiet. If not, it reminds you, asks again, then tells the caregiver.',
  },
  today: { si: 'අද', en: 'Today' },
  usual: { si: 'සාමාන්‍ය වෙලාව', en: 'Usual time' },
  learned: { si: 'ඉගෙන ගත්තා', en: 'learned' },
  learning: { si: 'ඉගෙන ගනිමින් (දවස් {n}/3)', en: 'learning ({n}/3 days)' },
  done: { si: '✓ අද කළා', en: '✓ Done today' },
  notYet: { si: 'තවම නැහැ', en: 'Not yet' },
  checking: { si: 'Caregiver බලනවා', en: 'Caregiver checking' },
  reminders: { si: 'අද මතක් කිරීම්: {n}', en: 'Reminders today: {n}' },
  trust: { si: '"කළා" ඔබන එක විශ්වාස කරන්න පුළුවන්: {p}%', en: 'Trust in your "Done" taps: {p}%' },
  trustLow: { si: 'තව ඉගෙන ගන්නකම් caregiver ත් බලනවා', en: 'Until it learns more, the caregiver also checks' },
  doneBtn: { si: 'කළා', en: 'Done' },
  laterBtn: { si: 'පස්සේ', en: 'Later' },
  caregiver: { si: 'Caregiver සඳහා', en: 'For the caregiver' },
  given: { si: 'දුන්නා', en: 'Given' },
  notGiven: { si: 'දුන්නේ නැහැ', en: 'Not given' },
  test: { si: 'Test: දැන්ම මතක් කරන්න', en: 'Test: remind me now' },
  testHelp: {
    si: 'Test button එක ආයෙත් ඔබන්න: 1 මතක් කිරීම → 2 ආයෙත් අහනවා → 3 caregiver ට කියනවා.',
    en: 'Press the test button again: 1 reminder → 2 follow-up → 3 caregiver alert.',
  },
  noPatient: { si: 'Patient කෙනෙක් තෝරලා නැහැ.', en: 'No patient selected.' },
  offline: { si: 'සේවාවට සම්බන්ධ වෙන්න බැහැ. ටිකකින් ආයෙත් උත්සාහ කරනවා.', en: 'Cannot reach the service. Trying again shortly.' },
  style: { si: 'හොඳම ක්‍රමය', en: 'Best style' },
  add: { si: 'මතක් කිරීමක් එකතු කරන්න', en: 'Add a reminder' },
  pick: { si: 'මොකක්ද මතක් කරන්න ඕනේ?', en: 'What should it remind about?' },
  time: { si: 'වෙලාව (පැය:විනාඩි)', en: 'Time (HH:MM)' },
  repeat: { si: 'පැය {n}න් {n}ට, {until} වෙනකම්', en: 'every {n} h until {until}' },
  customName: { si: 'නම (උදා: දොස්තර ළඟට යාම)', en: 'Name (e.g. doctor visit)' },
  save: { si: 'එකතු කරන්න', en: 'Add' },
  cancel: { si: 'එපා', en: 'Cancel' },
  remove: { si: 'මේ මතක් කිරීම අයින් කරන්නද?', en: 'Remove this reminder?' },
  yes: { si: 'ඔව්', en: 'Yes' },
  badTime: { si: 'වෙලාව 08:30 වගේ දාන්න', en: 'Enter the time like 08:30' },
  lock: { si: 'Caregiver', en: 'Caregiver' },
  pinTitle: { si: 'Caregiver PIN එක දාන්න', en: 'Enter the caregiver PIN' },
  pinHelp: { si: 'මතක් කිරීම් එකතු කරන්න / අයින් කරන්න, බෙහෙත් දුන්නද කියලා සටහන් කරන්න caregiver ට විතරයි.',
    en: 'Only the caregiver can add or remove reminders and confirm doses.' },
  pinWrong: { si: 'PIN එක වැරදියි', en: 'Wrong PIN' },
  pinNone: { si: 'තවම PIN එකක් නැහැ. Family screen එකේ PIN එකක් හදන්න.', en: 'No PIN yet. Set one on the Family screen.' },
  unlock: { si: 'විවෘත කරන්න', en: 'Unlock' },
  lockAgain: { si: 'Caregiver mode වහන්න', en: 'Close caregiver mode' },
  voiceTitle: { si: 'පවුලේ කෙනෙක්ගේ කටහඬ', en: "A family member's voice" },
  voiceHelp: { si: '"හැම මතක් කිරීමකටම" එකට එක පාරක් record කරන්න (උදා: "අම්මේ, මම දුව. මේ වෙලාවට කරන්න ඕන දේ අමතක කරන්න එපා."). ඊට පස්සේ AI එක මතක් කිරීම කියනවා. ඕන නම් එක එක දේට වෙනම record කරන්නත් පුළුවන්.',
    en: "Record once for 'Every reminder' (e.g. 'Amma, it's me. Don't forget what you need to do now.'). The AI then says which reminder it is. You can also record one for a single routine." },
  voiceWho: { si: 'කවුද කතා කරන්නේ? (උදා: දුව)', en: 'Who is speaking? (e.g. daughter)' },
  voiceAll: { si: 'හැම මතක් කිරීමකටම', en: 'For every reminder' },
  record: { si: 'Record', en: 'Record' },
  stopSave: { si: 'නවත්තලා save කරන්න', en: 'Stop and save' },
  play: { si: 'අහන්න', en: 'Play' },
  recorded: { si: '✓ {who} කටහඬ', en: "✓ {who}'s voice" },
  voiceSaved: { si: 'කටහඬ save කළා.', en: 'Voice saved.' },
  micDenied: { si: 'Microphone අවසරය දෙන්න.', en: 'Please allow the microphone.' },
};
// One icon per kind of routine (same keys as CATALOG cat in routine_ai.py).
const CAT_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  med: 'medkit', meal: 'restaurant', water: 'water', toilet: 'body', hygiene: 'sparkles', walk: 'walk',
  sleep: 'moon', prayer: 'flower', call: 'call', device: 'glasses', custom: 'alarm',
};
type CatalogItem = { key: string; cat: string; name: string; si: string; en: string; time: string; every?: number; until?: string };
const STYLE = {
  text: { si: 'ලියපු පණිවිඩය', en: 'text' },
  ai_voice: { si: 'AI කටහඬ', en: 'AI voice' },
  family_voice: { si: 'පවුලේ කටහඬ', en: 'family voice' },
};

type Task = { task: string; kind?: string; cat?: string; si: string; en: string; set_time: string; usual: string; learned: boolean; days_learned: number;
  done_today: boolean; reminders_today: number; waiting_check: boolean; best_style: string | null };
type Item = { kind: string; task: string; id?: string; mode?: string; si: string; en: string; text: string; audio_url?: string; who?: string; then_speak?: boolean };
type Voice = { who: string; url: string };

// Plays a family member's recorded reminder (uploads/voices on the AI service); resolves when it ends.
function playClip(url: string): Promise<void> {
  stopSpeaking();
  return new Promise((resolve) => {
    setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false }).catch(() => {}).finally(() => {
      const player = createAudioPlayer({ uri: `${AI_URL}${url}` });
      let done = false;
      const finish = () => { if (done) return; done = true; sub.remove(); player.remove(); resolve(); };
      const sub = (player as any).addListener('playbackStatusUpdate', (st: { didJustFinish?: boolean }) => {
        if (st.didJustFinish) finish();
      });
      player.play();
      setTimeout(finish, 20000);   // safety net: recordings are short
    });
  });
}

const t = (k: keyof typeof T, lang: Lang, vars: Record<string, string | number> = {}) =>
  Object.entries(vars).reduce((s, [a, b]) => s.replace(`{${a}}`, String(b)), T[k][lang]);

export default function RoutineAIUI() {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>('si');
  const [pid, setPid] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [trust, setTrust] = useState<{ p: number; ok: boolean } | null>(null);
  const [now, setNow] = useState<Item[]>([]);
  const [care, setCare] = useState<Item[]>([]);
  const [offline, setOffline] = useState(false);
  const [note, setNote] = useState('');
  const spoken = useRef(new Set<string>());
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [adding, setAdding] = useState<CatalogItem | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newTime, setNewTime] = useState('');
  const [newName, setNewName] = useState('');
  // Caregiver mode: add/remove reminders and confirm doses. The patient never sees these.
  const [caregiverMode, setCaregiverMode] = useState(!!getCaregiverPin());
  const [askPin, setAskPin] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinMsg, setPinMsg] = useState('');
  // Family voice: one short recording per routine (or one for all).
  const [voices, setVoices] = useState<Record<string, Voice>>({});
  const [who, setWho] = useState('');
  const [recFor, setRecFor] = useState<string | null>(null);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  const unlock = async () => {
    if (!pid) return;
    setPinMsg('');
    try {
      const st = await axios.get(`${AI_URL}/family/pin-status/${pid}`, { timeout: 10000 });
      if (!st.data.has_pin) { setPinMsg(t('pinNone', lang)); return; }
      const res = await post('/family/pin/verify', { patient_id: pid, pin: pinInput });
      if (!res.ok) { setPinMsg(t('pinWrong', lang)); return; }
      setCaregiverPin(pinInput);
      setCaregiverMode(true);
      setAskPin(false);
      setPinInput('');
    } catch {
      setOffline(true);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(LANG_KEY);
        if (saved === 'en' || saved === 'si') setLang(saved);
      } catch {}
      setPid(await getPatientId());
      setName(await getPatientName());
    })();
    return () => stopSpeaking();
  }, []);

  const switchLang = async (l: Lang) => {
    setLang(l);
    try { await AsyncStorage.setItem(LANG_KEY, l); } catch {}
  };

  const refresh = useCallback(async (testTask = '') => {
    if (!pid) return;
    try {
      const [ov, due] = await Promise.all([
        axios.get(`${AI_URL}/routine-ai/${pid}`, { params: { lang }, timeout: 10000 }),
        axios.get(`${AI_URL}/routine-ai/due/${pid}`, { params: { name, lang, test_task: testTask }, timeout: 10000 }),
      ]);
      setOffline(false);
      setTasks(ov.data.tasks);
      setTrust({ p: Math.round(ov.data.trust * 100), ok: ov.data.trust_ok });
      setVoices(ov.data.voices || {});
      setNow(due.data.patient);
      setCare(due.data.caregiver);
      // Say each new reminder once (a text-style reminder is shown, not spoken).
      for (const it of due.data.patient as Item[]) {
        if (it.id && !spoken.current.has(it.id) && it.mode !== 'text') {
          spoken.current.add(it.id);
          // The family member's voice first; after a general recording the AI says which routine it is.
          if (it.audio_url) playClip(it.audio_url).then(() => { if (it.then_speak) speak(it.text, lang); });
          else speak(it.text, lang);
        }
      }
      // After a test press, refresh the cards so "reminders today" etc. update.
      if (testTask) {
        const ov2 = await axios.get(`${AI_URL}/routine-ai/${pid}`, { params: { lang }, timeout: 10000 });
        setTasks(ov2.data.tasks);
      }
    } catch {
      setOffline(true);
    }
  }, [pid, name, lang]);

  useEffect(() => {
    axios.get(`${AI_URL}/routine-ai/catalog/list`, { params: { lang }, timeout: 10000 })
      .then((r) => setCatalog(r.data.items)).catch(() => {});
  }, [lang]);

  const addRoutine = async () => {
    if (!adding || !pid) return;
    const time = newTime.trim() || adding.time;
    if (!/^\d{1,2}:\d{2}$/.test(time)) { setNote(t('badTime', lang)); return; }
    const pin = getCaregiverPin();
    if (!pin) { setCaregiverMode(false); return; }
    const data: Record<string, string> = { patient_id: pid, key: adding.key, time, pin };
    if (adding.key === 'custom') {
      if (!newName.trim()) return;
      data[lang === 'en' ? 'name_en' : 'name_si'] = newName.trim();
    }
    try {
      const d = await post('/routine-ai/add', data);
      if (d.code === 'pin') { setCaregiverMode(false); setNote(d[lang]); return; }
      if (d.status === 'success') setTasks(d.tasks);
      setAdding(null); setShowAdd(false); setNewTime(''); setNewName('');
    } catch {
      setOffline(true);
    }
  };

  const removeRoutine = (k: Task) => {
    Alert.alert(lang === 'en' ? k.en : k.si, t('remove', lang), [
      { text: t('cancel', lang), style: 'cancel' },
      { text: t('yes', lang), style: 'destructive', onPress: async () => {
        try {
          const d = await post('/routine-ai/remove', { patient_id: pid!, task: k.task, pin: getCaregiverPin() || '' });
          if (d.code === 'pin') { setCaregiverMode(false); setNote(d[lang]); return; }
          if (d.status === 'success') setTasks(d.tasks);
        } catch { setOffline(true); }
      } },
    ]);
  };

  useFocusEffect(useCallback(() => {
    refresh();
    const timer = setInterval(() => refresh(), POLL_MS);
    return () => clearInterval(timer);
  }, [refresh]));

  const post = async (path: string, data: Record<string, string>) => {
    const f = new FormData();
    Object.entries(data).forEach(([k, v]) => f.append(k, v));
    const res = await axios.post(`${AI_URL}${path}`, f, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 10000 });
    return res.data;
  };

  const answer = async (it: Item, done: boolean) => {
    try {
      const d = await post(done ? '/routine-ai/done' : '/routine-ai/later', { patient_id: pid!, task: it.task, lang });
      setNote(d.text || '');
      speak(d.text, lang);
      setNow((xs) => xs.filter((x) => x.task !== it.task));
      refresh();
    } catch {
      setOffline(true);
    }
  };

  const toggleRecord = async (task: string) => {
    if (recFor && recFor !== task) return;
    if (!recFor) {
      try {
        await startListening(recorder);
        setRecFor(task);
      } catch {
        setNote(t('micDenied', lang));
      }
      return;
    }
    setRecFor(null);
    try {
      await recorder.stop();
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false });
      if (!recorder.uri || !pid) return;
      const f = new FormData();
      f.append('patient_id', pid);
      f.append('task', task);
      f.append('who', who.trim());
      f.append('pin', getCaregiverPin() || '');
      f.append('file', { uri: recorder.uri, name: 'voice.m4a', type: 'audio/m4a' } as any);
      const res = await axios.post(`${AI_URL}/routine-ai/voice`, f, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 30000 });
      if (res.data.code === 'pin') { setCaregiverMode(false); setNote(res.data[lang]); return; }
      if (res.data.status === 'success') { setVoices(res.data.voices || {}); setNote(t('voiceSaved', lang)); }
    } catch {
      setOffline(true);
    }
  };

  const caregiverAnswer = async (it: Item, given: boolean) => {
    try {
      const d = await post('/routine-ai/caregiver', { patient_id: pid!, task: it.task, given: given ? 'true' : 'false',
        pin: getCaregiverPin() || '' });
      if (d.code === 'pin') { setCaregiverMode(false); setNote(d[lang]); return; }
      setCare((xs) => xs.filter((x) => x.task !== it.task));
      refresh();
    } catch {
      setOffline(true);
    }
  };

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#0F2A24" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.title}>{t('title', lang)}</Text>
            <Text style={s.sub}>{t('sub', lang)}</Text>
          </View>
          <TouchableOpacity style={[s.lockBtn, caregiverMode && s.lockOn]}
            onPress={() => caregiverMode ? setCaregiverMode(false) : setAskPin((v) => !v)}>
            <Ionicons name={caregiverMode ? 'lock-open' : 'lock-closed'} size={18} color={caregiverMode ? '#fff' : '#0F2A24'} />
          </TouchableOpacity>
          <View style={s.langRow}>
            {(['si', 'en'] as Lang[]).map((l) => (
              <TouchableOpacity key={l} onPress={() => switchLang(l)} style={[s.langBtn, lang === l && s.langOn]}>
                <Text style={[s.langText, lang === l && { color: '#fff' }]}>{l === 'si' ? 'සිං' : 'EN'}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={s.explain}>
          <Ionicons name="sparkles" size={18} color="#0F9D8A" />
          <Text style={s.explainText}>{t('how', lang)}</Text>
        </View>

        {askPin && !caregiverMode && (
          <View style={s.addBox}>
            <Text style={s.addTitle}>{t('pinTitle', lang)}</Text>
            <Text style={s.cardSub}>{t('pinHelp', lang)}</Text>
            <TextInput style={s.input} value={pinInput} onChangeText={setPinInput} placeholder="••••"
              placeholderTextColor="#94A3B8" keyboardType="number-pad" secureTextEntry maxLength={6} />
            {!!pinMsg && <Text style={s.pinMsg}>{pinMsg}</Text>}
            <View style={s.dueBtns}>
              <TouchableOpacity style={[s.smallBtn, { backgroundColor: '#0F9D8A' }]} onPress={unlock}>
                <Text style={s.smallBtnText}>{t('unlock', lang)}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.smallBtn, { backgroundColor: '#94A3B8' }]} onPress={() => setAskPin(false)}>
                <Text style={s.smallBtnText}>{t('cancel', lang)}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        {offline && <Text style={s.offline}>{t('offline', lang)}</Text>}
        {!pid && <Text style={s.offline}>{t('noPatient', lang)}</Text>}

        {/* A reminder that is due right now */}
        {now.map((it) => (
          <View key={it.id || it.task} style={s.dueCard}>
            <View style={s.dueTop}>
              <Ionicons name={it.mode === 'text' ? 'chatbox-ellipses' : 'volume-high'} size={22} color="#fff" />
              <Text style={s.dueStyle}>{it.mode ? STYLE[it.mode as keyof typeof STYLE][lang] : ''}</Text>
            </View>
            <Text style={s.dueText}>{it.text}</Text>
            <View style={s.dueBtns}>
              <TouchableOpacity style={[s.bigBtn, { backgroundColor: '#16A34A' }]} onPress={() => answer(it, true)}>
                <Ionicons name="checkmark-circle" size={26} color="#fff" />
                <Text style={s.bigBtnText}>{t('doneBtn', lang)}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.bigBtn, { backgroundColor: '#F59E0B' }]} onPress={() => answer(it, false)}>
                <Ionicons name="time" size={26} color="#fff" />
                <Text style={s.bigBtnText}>{t('laterBtn', lang)}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
        {!!note && !now.length && <Text style={s.note}>{note}</Text>}

        <Text style={s.section}>{t('today', lang)}</Text>
        {!tasks ? <ActivityIndicator color="#0F9D8A" style={{ marginTop: 20 }} /> : tasks.map((k) => (
          <View key={k.task} style={[s.card, k.done_today && s.cardDone]}>
            <View style={s.icon}><Ionicons name={CAT_ICON[k.cat || 'custom'] || 'alarm'} size={26} color="#0F9D8A" /></View>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>{lang === 'en' ? k.en : k.si}</Text>
              <Text style={s.cardSub}>
                {t('usual', lang)}: {k.usual} · {k.learned ? t('learned', lang) : t('learning', lang, { n: k.days_learned })}
              </Text>
              <Text style={s.cardSub}>{t('reminders', lang, { n: k.reminders_today })}
                {k.best_style ? ` · ${t('style', lang)}: ${STYLE[k.best_style.split('|')[1] as keyof typeof STYLE][lang]}` : ''}</Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 6 }}>
              <View style={[s.state, k.done_today ? s.stateDone : s.statePending]}>
                <Text style={[s.stateText, { color: k.done_today ? '#15803D' : '#B45309' }]}>
                  {k.done_today ? t('done', lang) : k.waiting_check ? t('checking', lang) : t('notYet', lang)}
                </Text>
              </View>
              {caregiverMode && (
                <TouchableOpacity onPress={() => removeRoutine(k)} hitSlop={10}>
                  <Ionicons name="trash-outline" size={18} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}

        {/* Add a reminder: pick from the list, set the time (custom = any name) */}
        {!caregiverMode ? null : !showAdd ? (
          <TouchableOpacity style={s.addBtn} onPress={() => setShowAdd(true)}>
            <Ionicons name="add-circle" size={22} color="#0F9D8A" />
            <Text style={s.addText}>{t('add', lang)}</Text>
          </TouchableOpacity>
        ) : (
          <View style={s.addBox}>
            <Text style={s.addTitle}>{t('pick', lang)}</Text>
            <View style={s.chips}>
              {catalog.map((c) => (
                <TouchableOpacity key={c.key} onPress={() => { setAdding(c); setNewTime(c.time); }}
                  style={[s.chip, adding?.key === c.key && s.chipOn]}>
                  <Ionicons name={CAT_ICON[c.cat] || 'alarm'} size={15} color={adding?.key === c.key ? '#fff' : '#0F6B5E'} />
                  <Text style={[s.chipText, adding?.key === c.key && { color: '#fff' }]}>{c.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {adding && (
              <>
                {adding.key === 'custom' && (
                  <TextInput style={s.input} value={newName} onChangeText={setNewName}
                    placeholder={t('customName', lang)} placeholderTextColor="#94A3B8" />
                )}
                <Text style={s.inputLabel}>{t('time', lang)}</Text>
                <TextInput style={s.input} value={newTime} onChangeText={setNewTime} placeholder="08:30"
                  placeholderTextColor="#94A3B8" keyboardType="numbers-and-punctuation" maxLength={5} />
                {!!adding.every && (
                  <Text style={s.cardSub}>{t('repeat', lang, { n: adding.every, until: adding.until || '' })}</Text>
                )}
              </>
            )}
            <View style={s.dueBtns}>
              <TouchableOpacity style={[s.smallBtn, { backgroundColor: '#0F9D8A', opacity: adding ? 1 : 0.4 }]}
                disabled={!adding} onPress={addRoutine}>
                <Text style={s.smallBtnText}>{t('save', lang)}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.smallBtn, { backgroundColor: '#94A3B8' }]}
                onPress={() => { setShowAdd(false); setAdding(null); }}>
                <Text style={s.smallBtnText}>{t('cancel', lang)}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {trust && (
          <View style={s.trust}>
            <Ionicons name={trust.ok ? 'shield-checkmark' : 'shield-half'} size={20} color={trust.ok ? '#15803D' : '#B45309'} />
            <View style={{ flex: 1 }}>
              <Text style={s.trustText}>{t('trust', lang, { p: trust.p })}</Text>
              {!trust.ok && <Text style={s.cardSub}>{t('trustLow', lang)}</Text>}
            </View>
          </View>
        )}

        {/* Caregiver part (in the real app this belongs to the caregiver's phone) */}
        {caregiverMode && care.length > 0 && <Text style={s.section}>{t('caregiver', lang)}</Text>}
        {caregiverMode && care.map((it) => (
          <View key={`${it.kind}-${it.task}`} style={[s.careCard, it.kind === 'alert' && s.careAlert]}>
            <Ionicons name={it.kind === 'alert' ? 'warning' : 'help-circle'} size={22} color={it.kind === 'alert' ? '#B91C1C' : '#1D4ED8'} />
            <Text style={s.careText}>{it.text}</Text>
            <View style={s.dueBtns}>
              <TouchableOpacity style={[s.smallBtn, { backgroundColor: '#16A34A' }]} onPress={() => caregiverAnswer(it, true)}>
                <Text style={s.smallBtnText}>{t('given', lang)}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.smallBtn, { backgroundColor: '#DC2626' }]} onPress={() => caregiverAnswer(it, false)}>
                <Text style={s.smallBtnText}>{t('notGiven', lang)}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {caregiverMode && (
          <View>
            <Text style={s.section}>{t('voiceTitle', lang)}</Text>
            <Text style={s.testHelp}>{t('voiceHelp', lang)}</Text>
            <TextInput style={s.voiceInput} value={who} onChangeText={setWho} placeholder={t('voiceWho', lang)} />
            {[{ task: 'any', si: T.voiceAll.si, en: T.voiceAll.en }, ...(tasks || [])].map((k) => {
              const v = voices[k.task];
              const rec = recFor === k.task;
              return (
                <View key={`voice-${k.task}`} style={s.voiceRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.voiceName}>{lang === 'en' ? k.en : k.si}</Text>
                    {!!v && <Text style={s.voiceDone}>{t('recorded', lang, { who: v.who || '' })}</Text>}
                  </View>
                  {!!v && (
                    <TouchableOpacity style={[s.smallBtn, { backgroundColor: '#0F9D8A' }]} onPress={() => playClip(v.url)}>
                      <Text style={s.smallBtnText}>{t('play', lang)}</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={[s.smallBtn, { backgroundColor: rec ? '#DC2626' : '#1D4ED8', opacity: recFor && !rec ? 0.4 : 1 }]}
                    onPress={() => toggleRecord(k.task)}>
                    <Text style={s.smallBtnText}>{rec ? t('stopSave', lang) : t('record', lang)}</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        <Text style={s.section}>Test</Text>
        <Text style={s.testHelp}>{t('testHelp', lang)}</Text>
        {(tasks || []).map((k) => (
          <TouchableOpacity key={`test-${k.task}`} style={s.testBtn} onPress={() => refresh(k.task)}>
            <Ionicons name="flask" size={18} color="#0F9D8A" />
            <Text style={s.testText}>{t('test', lang)} · {lang === 'en' ? k.en : k.si}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7F5' },
  scroll: { padding: 20, paddingBottom: 48 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  backBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#E3EAE7' },
  title: { fontSize: 22, fontWeight: '900', color: '#0F2A24' },
  sub: { fontSize: 13, color: '#64748B', fontWeight: '600' },
  langRow: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E3EAE7', padding: 3 },
  langBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 9 },
  langOn: { backgroundColor: '#0F9D8A' },
  langText: { fontWeight: '800', color: '#0F2A24', fontSize: 13 },
  explain: { flexDirection: 'row', gap: 10, backgroundColor: '#E3F4F1', borderRadius: 18, padding: 14 },
  explainText: { flex: 1, fontSize: 14, color: '#0F3D36', lineHeight: 21 },
  offline: { marginTop: 12, backgroundColor: '#FEF3C7', color: '#92400E', borderRadius: 14, padding: 12, fontWeight: '700' },
  dueCard: { marginTop: 16, backgroundColor: '#0F9D8A', borderRadius: 24, padding: 18 },
  dueTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  dueStyle: { color: '#D1FAE5', fontWeight: '800', fontSize: 13 },
  dueText: { color: '#fff', fontSize: 19, fontWeight: '800', lineHeight: 28 },
  dueBtns: { flexDirection: 'row', gap: 10, marginTop: 14 },
  bigBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 18, paddingVertical: 16 },
  bigBtnText: { color: '#fff', fontWeight: '900', fontSize: 18 },
  note: { marginTop: 14, backgroundColor: '#DCFCE7', color: '#14532D', borderRadius: 14, padding: 12, fontWeight: '700', fontSize: 15 },
  section: { fontSize: 18, fontWeight: '900', color: '#0F2A24', marginTop: 22, marginBottom: 10 },
  voiceInput: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#E3EAE7', padding: 12, fontSize: 15,
    marginBottom: 10, color: '#0F2A24' },
  voiceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', borderRadius: 16, padding: 12,
    borderWidth: 1, borderColor: '#E3EAE7', marginBottom: 8 },
  voiceName: { fontSize: 15, fontWeight: '800', color: '#0F2A24' },
  voiceDone: { fontSize: 13, fontWeight: '700', color: '#0F9D8A', marginTop: 2 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 20, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: '#E3EAE7' },
  cardDone: { borderColor: '#BBF7D0', backgroundColor: '#F7FEF9' },
  icon: { width: 50, height: 50, borderRadius: 16, backgroundColor: '#E3F4F1', alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 16.5, fontWeight: '900', color: '#0F2A24' },
  cardSub: { fontSize: 12.5, color: '#64748B', marginTop: 2 },
  state: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 },
  stateDone: { backgroundColor: '#DCFCE7' },
  statePending: { backgroundColor: '#FEF3C7' },
  stateText: { fontSize: 12, fontWeight: '900' },
  trust: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderRadius: 16, padding: 12,
    borderWidth: 1, borderColor: '#E3EAE7' },
  trustText: { fontSize: 14, fontWeight: '800', color: '#0F2A24' },
  careCard: { backgroundColor: '#EFF6FF', borderRadius: 18, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#BFDBFE', gap: 8 },
  careAlert: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  careText: { fontSize: 15, fontWeight: '700', color: '#0F2A24', lineHeight: 22 },
  smallBtn: { flex: 1, borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
  smallBtnText: { color: '#fff', fontWeight: '900', fontSize: 15 },
  testHelp: { fontSize: 13, color: '#64748B', marginBottom: 8, lineHeight: 19 },
  lockBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E3EAE7',
    alignItems: 'center', justifyContent: 'center' },
  lockOn: { backgroundColor: '#0F9D8A', borderColor: '#0F9D8A' },
  pinMsg: { color: '#B91C1C', fontWeight: '800', marginTop: 8 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center', borderRadius: 16, padding: 14,
    borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#0F9D8A', marginBottom: 6 },
  addText: { fontSize: 15, fontWeight: '900', color: '#0F6B5E' },
  addBox: { backgroundColor: '#fff', borderRadius: 20, padding: 14, borderWidth: 1, borderColor: '#E3EAE7', marginBottom: 6 },
  addTitle: { fontSize: 15, fontWeight: '900', color: '#0F2A24', marginBottom: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 7,
    backgroundColor: '#E3F4F1' },
  chipOn: { backgroundColor: '#0F9D8A' },
  chipText: { fontSize: 13, fontWeight: '800', color: '#0F6B5E' },
  inputLabel: { fontSize: 13, fontWeight: '800', color: '#334155', marginTop: 12, marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16,
    color: '#0F2A24', marginTop: 8 },
  testBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 8,
    borderWidth: 1, borderStyle: 'dashed', borderColor: '#99D5CB' },
  testText: { fontSize: 14, fontWeight: '800', color: '#0F6B5E' },
});
