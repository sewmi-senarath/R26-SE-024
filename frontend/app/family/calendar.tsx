import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Colors } from '../../src/constants/colors';
import { FamilyColors, FamilyRadius, FamilyShadow } from '../../src/constants/familyTheme';
import { ScreenHeader } from '../../src/components/family/ui/ScreenHeader';
import { Card } from '../../src/components/family/ui/Card';
import {
  BestTimeResponse,
  createEvent,
  deleteEvent,
  EventInput,
  getBestTime,
  getEvents,
  getEventSettings,
  updateEvent,
  updateEventSettings,
} from '../../src/services/family/calendarService';
import { pickPhoto } from '../../src/services/family/storyService';
import { EventType, FamilyEvent } from '../../src/types/family.types';

const EVENT_TYPE_OPTIONS: { key: EventType; label: string }[] = [
  { key: 'birthday', label: 'Birthday' },
  { key: 'anniversary', label: 'Anniversary' },
  { key: 'festival', label: 'Festival' },
  { key: 'religious', label: 'Religious' },
  { key: 'other', label: 'Other' },
];

const eventTypeLabel = (key: string) =>
  EVENT_TYPE_OPTIONS.find((t) => t.key === key)?.label || key;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

// representative hour for each best-time bucket (see backend
// eventController.js's BUCKETS) — used only to default a NEW event's time
// picker to the patient's historically best-responding window
const BUCKET_DEFAULT_HOUR: Record<string, number> = {
  morning: 9,
  afternoon: 14,
  evening: 18,
  night: 22,
};

const pad2 = (n: number) => String(n).padStart(2, '0');
const toDateString = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const toTimeString = (d: Date) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

// "15:00" -> "3:00 PM" — eventTime is stored 24-hour for real time-based
// due checks; this is purely for display
const formatTimeDisplay = (hhmm: string) => {
  const match = TIME_RE.exec(hhmm);
  if (!match) return hhmm;
  const hour = Number(match[1]);
  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${match[2]} ${period}`;
};

const emptyForm = {
  title: '',
  eventType: 'birthday' as EventType,
  personName: '',
  relation: '',
  eventDate: '',
  eventTime: '',
  note: '',
  photoUrl: '',
  sensitive: false,
  useAiCardText: false,
};

export default function FamilyCalendarScreen() {
  const nav = useRouter();

  const [events, setEvents] = useState<FamilyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [form, setForm] = useState(emptyForm);
  const [photo, setPhoto] = useState<any>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  // title auto-fills from Person + Event Type until the family member types
  // their own title, or an existing event (which already has a real title)
  // is opened for editing — never silently overwrites either of those
  const titleAutoFill = useRef(true);

  const [allowVideoReactions, setAllowVideoReactions] = useState(false);
  const [bestTime, setBestTime] = useState<BestTimeResponse | null>(null);

  const loadEvents = useCallback(() => {
    getEvents().then((items) => {
      setEvents(items);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    loadEvents();
    getEventSettings().then((s) => setAllowVideoReactions(s.allowVideoReactions));
    getBestTime().then(setBestTime);
  }, [loadEvents]);

  // keeps the list current without a manual pull-to-refresh: picks up a
  // patient's reaction or a newly-missed event whenever this screen is
  // reopened, plus a 60s poll while it stays open — same cadence the
  // patient side already uses, this is the "real-time-ish" ceiling without
  // push notifications (which need a dev build, out of reach here)
  useFocusEffect(
    useCallback(() => {
      loadEvents();
      const interval = setInterval(loadEvents, 60000);
      return () => clearInterval(interval);
    }, [loadEvents])
  );

  const toggleVideoSetting = async () => {
    const next = !allowVideoReactions;
    setAllowVideoReactions(next); // optimistic — matches up-front, no spinner needed for a single boolean
    const ok = await updateEventSettings({ allowVideoReactions: next });
    if (!ok) setAllowVideoReactions(!next); // revert on failure
  };

  const openAddModal = () => {
    setEditingId(null);
    titleAutoFill.current = true;
    // default the time to this patient's historically best-responding
    // window (from the real getBestTime data already fetched for the
    // banner above) — just a starting point, still fully editable
    const defaultHour = bestTime?.recommendation ? BUCKET_DEFAULT_HOUR[bestTime.recommendation.bucket] : undefined;
    setForm({
      ...emptyForm,
      eventTime: defaultHour !== undefined ? `${pad2(defaultHour)}:00` : '',
    });
    setPhoto(null);
    setShowModal(true);
  };

  const openEditModal = (event: FamilyEvent) => {
    setEditingId(event.id);
    titleAutoFill.current = false; // this event already has a real, human-written title
    setForm({
      title: event.title,
      eventType: event.eventType,
      personName: event.personName,
      relation: event.relation,
      eventDate: event.eventDate ? event.eventDate.slice(0, 10) : '',
      eventTime: event.eventTime,
      note: event.note,
      photoUrl: event.photoUrl,
      sensitive: event.sensitive,
      useAiCardText: false,
    });
    setPhoto(event.photoUrl ? { uri: event.photoUrl } : null);
    setShowModal(true);
  };

  // regenerates the title from Person + Event Type while auto-fill is still
  // active — called after either field changes
  const applyTitleAutoFill = (personName: string, eventType: EventType) => {
    if (!titleAutoFill.current) return;
    setForm((f) => ({
      ...f,
      title: personName.trim() ? `${personName.trim()}'s ${eventTypeLabel(eventType)}` : '',
    }));
  };

  const handlePickPhoto = async () => {
    const asset = await pickPhoto();
    if (asset) setPhoto(asset);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      Alert.alert('Missing', 'Please give this event a title');
      return;
    }
    if (!DATE_RE.test(form.eventDate)) {
      Alert.alert('Invalid date', 'Please enter the date as YYYY-MM-DD');
      return;
    }
    if (!TIME_RE.test(form.eventTime)) {
      Alert.alert('Invalid time', 'Please enter the time as 24-hour HH:mm, e.g. 15:00 for 3:00 PM');
      return;
    }
    if (form.note.length > 200) {
      Alert.alert('Too long', 'Note must be 200 characters or fewer');
      return;
    }

    setSaving(true);
    try {
      const input: EventInput = {
        title: form.title.trim(),
        eventType: form.eventType,
        personName: form.personName.trim(),
        relation: form.relation.trim(),
        eventDate: form.eventDate,
        eventTime: form.eventTime.trim(),
        note: form.note.trim(),
        // Phase 1 photo upload for events reuses the same picker as Stories;
        // the photo itself is only persisted once a photo URL exists (edit
        // flow) — uploading a brand-new photo as part of this form is out of
        // scope for Phase 1, matching the spec's "optional photo" wording.
        photoUrl: photo?.uri && photo.uri.startsWith('http') ? photo.uri : form.photoUrl,
        sensitive: form.sensitive,
        useAiCardText: form.useAiCardText,
      };

      const result = editingId
        ? await updateEvent(editingId, input)
        : await createEvent(input);

      if (result.success) {
        setShowModal(false);
        loadEvents();
      } else {
        Alert.alert('Error', result.message || 'Could not save this event');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (event: FamilyEvent) => {
    Alert.alert(
      'Delete this event?',
      'This removes it and any reactions permanently.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(event.id);
            const ok = await deleteEvent(event.id);
            if (ok) {
              setEvents((prev) => prev.filter((e) => e.id !== event.id));
            } else {
              Alert.alert('Error', 'Could not delete this event. Try again.');
            }
            setDeletingId(null);
          },
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: FamilyColors.canvas }}>
      <StatusBar barStyle="dark-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

        <ScreenHeader
          title="Family Calendar"
          subtitle="Schedule a moment to share with them"
          onBack={() => (router.canGoBack() ? router.back() : router.replace('/family'))}
        />

        {/* Add button */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={openAddModal}
          style={{ marginHorizontal: 20, marginTop: 20, marginBottom: 20, backgroundColor: Colors.accent, borderRadius: FamilyRadius.md, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, ...FamilyShadow.elevated, shadowColor: Colors.accent }}
        >
          <Ionicons name="calendar" size={22} color="#fff" />
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#fff' }}>Add Event</Text>
        </TouchableOpacity>

        {/* Best-time insight — real data only, honest "not enough data" fallback */}
        {bestTime && (
          <View style={{ marginHorizontal: 20, marginBottom: 20, backgroundColor: Colors.accent + FamilyColors.alpha.faint, borderRadius: FamilyRadius.lg, padding: 18, borderWidth: 1, borderColor: Colors.accent + FamilyColors.alpha.soft }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
              <View style={{ width: 42, height: 42, borderRadius: FamilyRadius.sm, backgroundColor: Colors.accentSoft, justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
                <Ionicons name="time" size={22} color={Colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.accent, marginBottom: 4 }}>Best Time to Share a Moment</Text>
                {bestTime.recommendation ? (
                  <Text style={{ fontSize: 12, color: Colors.textSecondary, lineHeight: 18 }}>
                    They tend to respond most in {bestTime.recommendation.label} ({bestTime.recommendation.responseRate}% response rate over {bestTime.recommendation.total} moments).
                  </Text>
                ) : (
                  <Text style={{ fontSize: 12, color: Colors.textSecondary, lineHeight: 18 }}>
                    Still gathering data — a few more reactions across different times of day will unlock a suggestion.
                  </Text>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Event list */}
        <View style={{ marginHorizontal: 20 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.textMuted, marginBottom: 10, letterSpacing: 0.5 }}>UPCOMING & PAST EVENTS</Text>

          {loading ? (
            <View style={{ paddingVertical: 24, alignItems: 'center' }}>
              <ActivityIndicator color={Colors.accent} />
            </View>
          ) : events.length === 0 ? (
            <Card radius="md" style={{ alignItems: 'center' }} padding={20}>
              <Ionicons name="calendar-outline" size={26} color={Colors.textMuted} />
              <Text style={{ fontSize: 12, color: Colors.textMuted, marginTop: 8, textAlign: 'center' }}>
                No events yet — add one above.
              </Text>
            </Card>
          ) : (
            events.map((event) => (
              <TouchableOpacity
                key={event.id}
                activeOpacity={0.85}
                onPress={() => nav.push(`/family/event/${event.id}`)}
                style={{ backgroundColor: Colors.white, borderRadius: FamilyRadius.md, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.borderLight, ...FamilyShadow.card }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                  {event.photoUrl ? (
                    <Image source={{ uri: event.photoUrl }} style={{ width: 56, height: 56, borderRadius: FamilyRadius.sm }} />
                  ) : (
                    <View style={{ width: 56, height: 56, borderRadius: FamilyRadius.sm, backgroundColor: Colors.accentSoft, justifyContent: 'center', alignItems: 'center' }}>
                      <Ionicons name="calendar" size={26} color={Colors.accent} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <View style={{ paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6, backgroundColor: Colors.accentSoft }}>
                        <Text style={{ fontSize: 9, fontWeight: '700', color: Colors.accent }}>{eventTypeLabel(event.eventType)}</Text>
                      </View>
                      {event.sensitive && (
                        <View style={{ paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6, backgroundColor: Colors.borderLight }}>
                          <Text style={{ fontSize: 9, fontWeight: '700', color: Colors.textMuted }}>CALM</Text>
                        </View>
                      )}
                      {event.cardTextSource === 'ai' && (
                        <View style={{ paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6, backgroundColor: Colors.purpleSoft }}>
                          <Text style={{ fontSize: 9, fontWeight: '700', color: Colors.purple }}>AI-SUGGESTED</Text>
                        </View>
                      )}
                      {event.status === 'missed' && (
                        <View style={{ paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6, backgroundColor: Colors.dangerSoft }}>
                          <Text style={{ fontSize: 9, fontWeight: '700', color: Colors.danger }}>MISSED</Text>
                        </View>
                      )}
                      {event.status === 'completed' && (
                        <Ionicons name="checkmark-circle" size={13} color={Colors.success} />
                      )}
                    </View>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginTop: 3 }}>{event.title}</Text>
                    <Text style={{ fontSize: 11, color: Colors.textMuted, marginTop: 2 }}>
                      {formatDate(event.eventDate)}{event.eventTime ? ` · ${formatTimeDisplay(event.eventTime)}` : ''}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => openEditModal(event)} style={{ padding: 6 }}>
                    <Ionicons name="create-outline" size={18} color={Colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(event)} disabled={deletingId === event.id} style={{ padding: 6 }}>
                    {deletingId === event.id ? (
                      <ActivityIndicator size="small" color={Colors.danger} />
                    ) : (
                      <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                    )}
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

      </ScrollView>

      {/* ─── MODAL — Add/Edit Event ─── */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: FamilyColors.canvas }}>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: Colors.textPrimary }}>
                {editingId ? 'Edit Event' : 'Add Event'}
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close-circle" size={28} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Photo picker (optional) */}
            <TouchableOpacity onPress={handlePickPhoto} style={{ marginBottom: 16 }}>
              {photo ? (
                <Image source={{ uri: photo.uri }} style={{ width: '100%', height: 160, borderRadius: FamilyRadius.md, borderWidth: 2, borderColor: Colors.accent }} resizeMode="cover" />
              ) : (
                <View style={{ backgroundColor: Colors.white, borderRadius: FamilyRadius.md, borderWidth: 2, borderStyle: 'dashed', borderColor: Colors.accent + FamilyColors.alpha.strong, height: 140, justifyContent: 'center', alignItems: 'center' }}>
                  <Ionicons name="image-outline" size={36} color={Colors.accent + FamilyColors.alpha.strong} />
                  <Text style={{ color: Colors.accent, fontWeight: '700', fontSize: 13, marginTop: 8 }}>Tap to add a photo (optional)</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Title — auto-fills from Person + Event Type below, until
                you type your own */}
            <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6 }}>Title</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: Colors.borderLight, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: Colors.textPrimary, backgroundColor: Colors.white, marginBottom: 14 }}
              placeholder="e.g. Dilani's birthday"
              value={form.title}
              onChangeText={(v) => {
                titleAutoFill.current = false;
                setForm((f) => ({ ...f, title: v }));
              }}
            />

            {/* Event type */}
            <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6 }}>Event Type</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
              {EVENT_TYPE_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  onPress={() => {
                    setForm((f) => ({ ...f, eventType: opt.key }));
                    applyTitleAutoFill(form.personName, opt.key);
                  }}
                  style={{
                    paddingHorizontal: 14, paddingVertical: 8, borderRadius: FamilyRadius.pill,
                    backgroundColor: form.eventType === opt.key ? Colors.accent : Colors.white,
                    borderWidth: 1, borderColor: form.eventType === opt.key ? Colors.accent : Colors.border,
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '700', color: form.eventType === opt.key ? '#fff' : Colors.textMuted }}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Person name + relation */}
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6 }}>Person</Text>
                <TextInput
                  style={{ borderWidth: 1, borderColor: Colors.borderLight, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: Colors.textPrimary, backgroundColor: Colors.white }}
                  placeholder="e.g. Dilani"
                  value={form.personName}
                  onChangeText={(v) => {
                    setForm((f) => ({ ...f, personName: v }));
                    applyTitleAutoFill(v, form.eventType);
                  }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6 }}>Relation</Text>
                <TextInput
                  style={{ borderWidth: 1, borderColor: Colors.borderLight, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: Colors.textPrimary, backgroundColor: Colors.white }}
                  placeholder="e.g. daughter"
                  value={form.relation}
                  onChangeText={(v) => setForm((f) => ({ ...f, relation: v }))}
                />
              </View>
            </View>

            {/* Date + time — native pickers, auto-fill the field in the
                correct format once chosen, no manual typing */}
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6 }}>Date</Text>
                <TouchableOpacity
                  onPress={() => setShowDatePicker(true)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: Colors.borderLight, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: Colors.white }}
                >
                  <Ionicons name="calendar-outline" size={16} color={Colors.accent} />
                  <Text style={{ fontSize: 13, color: form.eventDate ? Colors.textPrimary : Colors.textMuted }}>
                    {form.eventDate ? formatDate(form.eventDate) : 'Select date'}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6 }}>Time</Text>
                <TouchableOpacity
                  onPress={() => setShowTimePicker(true)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: Colors.borderLight, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: Colors.white }}
                >
                  <Ionicons name="time-outline" size={16} color={Colors.accent} />
                  <Text style={{ fontSize: 13, color: form.eventTime ? Colors.textPrimary : Colors.textMuted }}>
                    {form.eventTime ? formatTimeDisplay(form.eventTime) : 'Select time'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={DATE_RE.test(form.eventDate) ? new Date(`${form.eventDate}T00:00:00`) : new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                onChange={(_event: DateTimePickerEvent, selectedDate?: Date) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (selectedDate) setForm((f) => ({ ...f, eventDate: toDateString(selectedDate) }));
                }}
              />
            )}
            {showTimePicker && (
              <DateTimePicker
                value={(() => {
                  const m = TIME_RE.exec(form.eventTime);
                  const d = new Date();
                  if (m) d.setHours(Number(m[1]), Number(m[2]), 0, 0);
                  return d;
                })()}
                mode="time"
                is24Hour
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(_event: DateTimePickerEvent, selectedDate?: Date) => {
                  setShowTimePicker(Platform.OS === 'ios');
                  if (selectedDate) setForm((f) => ({ ...f, eventTime: toTimeString(selectedDate) }));
                }}
              />
            )}
            {Platform.OS === 'ios' && (showDatePicker || showTimePicker) && (
              <TouchableOpacity
                onPress={() => { setShowDatePicker(false); setShowTimePicker(false); }}
                style={{ alignSelf: 'flex-end', marginBottom: 14, marginTop: -6 }}
              >
                <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.accent }}>Done</Text>
              </TouchableOpacity>
            )}

            {/* Note */}
            <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6 }}>Short Note (optional, 200 chars)</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: Colors.borderLight, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: Colors.textPrimary, backgroundColor: Colors.white, minHeight: 70, marginBottom: 14 }}
              placeholder="Anything you'd like the card to mention"
              value={form.note}
              onChangeText={(v) => setForm((f) => ({ ...f, note: v.slice(0, 200) }))}
              multiline
              textAlignVertical="top"
            />

            {/* Sensitive switch (simple tap toggle, no extra dependency) */}
            <TouchableOpacity
              onPress={() => setForm((f) => ({ ...f, sensitive: !f.sensitive }))}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.white, borderRadius: FamilyRadius.sm, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: Colors.borderLight }}
            >
              <Ionicons name={form.sensitive ? 'checkbox' : 'square-outline'} size={22} color={form.sensitive ? Colors.accent : Colors.textMuted} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.textPrimary }}>Sensitive date</Text>
                <Text style={{ fontSize: 11, color: Colors.textMuted, marginTop: 2 }}>Shows a calm card and never asks for a wish</Text>
              </View>
            </TouchableOpacity>

            {/* AI card text — opt-in, default off; silently falls back to the
                plain template on any failure, so the "AI-suggested" pill only
                ever appears when it genuinely happened */}
            <TouchableOpacity
              onPress={() => setForm((f) => ({ ...f, useAiCardText: !f.useAiCardText }))}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.white, borderRadius: FamilyRadius.sm, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: Colors.borderLight }}
            >
              <Ionicons name={form.useAiCardText ? 'checkbox' : 'square-outline'} size={22} color={form.useAiCardText ? Colors.purple : Colors.textMuted} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.textPrimary }}>Let AI polish the wording</Text>
                <Text style={{ fontSize: 11, color: Colors.textMuted, marginTop: 2 }}>Best-effort only — falls back to the plain sentence if it's unavailable</Text>
              </View>
            </TouchableOpacity>

            {/* Video wishes — a patient-level setting, not per-event, so
                toggling it here calls the settings endpoint immediately
                rather than being bundled into this event's save */}
            <TouchableOpacity
              onPress={toggleVideoSetting}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.white, borderRadius: FamilyRadius.sm, padding: 14, marginBottom: 24, borderWidth: 1, borderColor: Colors.borderLight }}
            >
              <Ionicons name={allowVideoReactions ? 'checkbox' : 'square-outline'} size={22} color={allowVideoReactions ? Colors.success : Colors.textMuted} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.textPrimary }}>Allow video wishes</Text>
                <Text style={{ fontSize: 11, color: Colors.textMuted, marginTop: 2 }}>Applies to this patient's account, not just this event</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSave}
              disabled={saving}
              style={{ backgroundColor: saving ? Colors.accent + FamilyColors.alpha.medium : Colors.accent, borderRadius: FamilyRadius.md, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}
            >
              {saving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
              )}
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
                {editingId ? 'Save Changes' : 'Add Event'}
              </Text>
            </TouchableOpacity>

          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
