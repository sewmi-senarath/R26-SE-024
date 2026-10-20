// ─────────────────────────────────────────────────────────────────────────
//  Full-screen story player — opens when a patient taps "Listen" on a
//  memory card. Takes over the whole screen so scrolling the list behind
//  it can never interrupt or distract from the story, shows reading
//  progress, and lets the patient pause/resume instead of only stop.
//  Flows straight into the same recall quiz once the story finishes,
//  still full-screen, so nothing jumps back to the list mid-session.
//  Shared by both MemoryVaultUI.tsx and MemoryScreen.tsx so they can't
//  drift out of sync with each other.
// ─────────────────────────────────────────────────────────────────────────
import React, { useEffect, useState } from 'react';
import { Image, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getStoredRole } from '../../../api/authApi';
import { pauseSpeaking, resumeSpeaking, speakStory, stopSpeaking } from '../../../services/family/ttsService';
import { submitEmotionReaction as submitEmotionReactionFamily } from '../../../services/family/emotionService';
import { submitEmotionReaction as submitEmotionReactionPatient } from '../../../services/patient/emotionService';
import EmotionTracker from '../../family/EmotionTracker';
import StoryQuizCard from './StoryQuizCard';

export interface StoryPlayerMemory {
  _id: string;
  photoUrl: string;
  familyNote: string;
  generatedStory: string;
}

type ReactionEmoji = 'happy' | 'calm' | 'sad';

const REACTION_BUTTONS: { key: ReactionEmoji; emoji: string; label: string }[] = [
  { key: 'happy', emoji: '😊', label: 'Happy' },
  { key: 'calm', emoji: '😌', label: 'Calm' },
  { key: 'sad', emoji: '😢', label: 'Sad' },
];

// same per-call role dispatch StoryQuizCard.tsx uses — this screen can run
// under either a real patient login or a family member's own test login
async function submitReaction(outcomeId: string, reaction: ReactionEmoji) {
  const role = await getStoredRole();
  return role === 'patient'
    ? submitEmotionReactionPatient(outcomeId, reaction)
    : submitEmotionReactionFamily(outcomeId, reaction);
}

interface StoryPlayerModalProps {
  memory: StoryPlayerMemory | null;
  patientId: string | null;
  onClose: () => void;
  onPlayStart?: (memory: StoryPlayerMemory) => void; // e.g. MemoryScreen's "mark as played" call
}

export default function StoryPlayerModal({ memory, patientId, onClose, onPlayStart }: StoryPlayerModalProps) {
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [storyDone, setStoryDone] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [outcomeId, setOutcomeId] = useState<string | null>(null);
  const [quizSessionId, setQuizSessionId] = useState<string | null>(null);
  const [reactionDone, setReactionDone] = useState(false);

  useEffect(() => {
    if (!memory) return;
    setIsPaused(false);
    setProgress({ current: 0, total: 0 });
    setStoryDone(false);
    setOutcomeId(null);
    setQuizSessionId(null);
    setReactionDone(false);
    setSessionActive(true);
    onPlayStart?.(memory);

    speakStory(
      memory.generatedStory,
      () => {
        setSessionActive(false);
        setStoryDone(true);
      },
      (current, total) => setProgress({ current, total })
    );

    return () => {
      stopSpeaking();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memory?._id]);

  const handleClose = () => {
    stopSpeaking();
    setSessionActive(false);
    onClose();
  };

  const togglePause = () => {
    if (isPaused) {
      resumeSpeaking();
      setIsPaused(false);
    } else {
      pauseSpeaking();
      setIsPaused(true);
    }
  };

  const handleReactionPick = (emoji: ReactionEmoji) => {
    if (!outcomeId) return;
    setReactionDone(true);
    submitReaction(outcomeId, emoji).catch(() => {});
  };

  return (
    <Modal visible={!!memory} animationType="slide" presentationStyle="fullScreen" onRequestClose={handleClose}>
      {memory && (
        <SafeAreaView style={styles.container}>
          <View style={styles.topBar}>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn} activeOpacity={0.8} hitSlop={12}>
              <Ionicons name="close" size={26} color="#1C1917" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <Image source={{ uri: memory.photoUrl }} style={styles.image} />
            <Text style={styles.note}>{memory.familyNote}</Text>

            {!storyDone && (
              <>
                {progress.total > 0 && (
                  <View style={styles.progressWrap}>
                    <View style={styles.progressTrack}>
                      <View style={[styles.progressFill, { width: `${(progress.current / progress.total) * 100}%` }]} />
                    </View>
                    <Text style={styles.progressLabel}>Reading {progress.current} of {progress.total}</Text>
                  </View>
                )}
                <View style={styles.storyTextBox}>
                  <Text style={styles.storyText}>{memory.generatedStory}</Text>
                </View>
              </>
            )}

            {storyDone && !outcomeId && (
              <View style={styles.thankYouBox}>
                <Ionicons name="heart" size={26} color="#EC4899" />
                <Text style={styles.thankYouText}>Thank you for sharing that with me</Text>
              </View>
            )}

            {storyDone && outcomeId && !reactionDone && (
              <View style={styles.reactionBox}>
                <Text style={styles.reactionPrompt}>How did that story make you feel?</Text>
                <View style={styles.reactionRow}>
                  {REACTION_BUTTONS.map((opt) => (
                    <TouchableOpacity
                      key={opt.key}
                      style={styles.reactionBtn}
                      onPress={() => handleReactionPick(opt.key)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.reactionEmoji}>{opt.emoji}</Text>
                      <Text style={styles.reactionLabel}>{opt.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity onPress={() => setReactionDone(true)} style={styles.reactionSkip}>
                  <Text style={styles.reactionSkipText}>Skip</Text>
                </TouchableOpacity>
              </View>
            )}

            {reactionDone && quizSessionId && (
              <StoryQuizCard
                memoryId={memory._id}
                sessionId={quizSessionId}
                storyText={memory.generatedStory}
                onDismiss={handleClose}
              />
            )}
          </ScrollView>

          {!storyDone && (
            <View style={styles.controls}>
              <TouchableOpacity style={styles.controlBtn} onPress={togglePause} activeOpacity={0.85}>
                <Ionicons name={isPaused ? 'play-circle' : 'pause-circle'} size={32} color="#fff" />
                <Text style={styles.controlBtnText}>{isPaused ? 'Resume' : 'Pause'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.controlBtn, styles.stopBtn]} onPress={handleClose} activeOpacity={0.85}>
                <Ionicons name="stop-circle" size={32} color="#fff" />
                <Text style={styles.controlBtnText}>Stop</Text>
              </TouchableOpacity>
            </View>
          )}

          {patientId && (
            <EmotionTracker
              patientId={patientId}
              memoryId={memory._id}
              isActive={sessionActive}
              onSessionEnd={(outcome) => {
                setOutcomeId(outcome._id);
                setQuizSessionId(outcome.sessionId);
              }}
            />
          )}
        </SafeAreaView>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAF9' },

  topBar: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4, alignItems: 'flex-end' },
  closeBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#F1F5F9',
    justifyContent: 'center', alignItems: 'center',
  },

  content: { paddingHorizontal: 20, paddingBottom: 24 },
  image: { width: '100%', aspectRatio: 16 / 10, borderRadius: 24, marginBottom: 16 },
  note: { fontSize: 20, fontWeight: '700', color: '#1C1917', lineHeight: 27, marginBottom: 18 },

  progressWrap: { marginBottom: 14 },
  progressTrack: { height: 8, borderRadius: 4, backgroundColor: '#E9D5FF', overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 4, backgroundColor: '#7C3AED' },
  progressLabel: { fontSize: 13, fontWeight: '700', color: '#7C3AED', marginTop: 6 },

  storyTextBox: {
    backgroundColor: '#FAF5FF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  storyText: { fontSize: 21, fontWeight: '600', color: '#3B0764', lineHeight: 31 },

  thankYouBox: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#FDF2F8', borderRadius: 20, paddingVertical: 22,
    borderWidth: 1, borderColor: '#FBCFE8',
  },
  thankYouText: { color: '#9D174D', fontSize: 17, fontWeight: '700' },

  reactionBox: {
    backgroundColor: '#FAF5FF', borderRadius: 20, padding: 20,
    borderWidth: 1, borderColor: '#E9D5FF', alignItems: 'center',
  },
  reactionPrompt: { fontSize: 17, fontWeight: '700', color: '#1C1917', marginBottom: 16, textAlign: 'center' },
  reactionRow: { flexDirection: 'row', gap: 12, width: '100%' },
  reactionBtn: {
    flex: 1, backgroundColor: '#fff', borderRadius: 16, paddingVertical: 16,
    borderWidth: 1.5, borderColor: '#E9D5FF', alignItems: 'center', gap: 4,
  },
  reactionEmoji: { fontSize: 32 },
  reactionLabel: { fontSize: 13, fontWeight: '700', color: '#3B0764' },
  reactionSkip: { marginTop: 14, paddingVertical: 6 },
  reactionSkipText: { fontSize: 14, fontWeight: '700', color: '#78716C' },

  controls: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16 },
  controlBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#7C3AED', borderRadius: 20, paddingVertical: 18,
  },
  stopBtn: { backgroundColor: '#DC2626' },
  controlBtnText: { color: '#fff', fontSize: 18, fontWeight: '900' },
});
