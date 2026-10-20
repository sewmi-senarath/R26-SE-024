// ─────────────────────────────────────────────────────────────────────────
//  Family Action Card — close-the-loop stages 3 & 4 on screen. Every
//  completed session gets one of these (not just alert-worthy ones); only
//  confusing_upsetting gets the urgent dark treatment, matching
//  SmartAlertCard's existing visual language.
// ─────────────────────────────────────────────────────────────────────────
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Image, Linking, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../../constants/colors';
import { FamilyColors, FamilyShadow } from '../../../constants/familyTheme';
import { ActionType, DecisionCode } from '../../../types/family.types';
import { logSessionAction, MemorySessionReport } from '../../../services/family/emotionService';
import { Card } from '../ui/Card';

interface FamilyActionCardProps {
  report: MemorySessionReport;
  patientName: string;
  patientPhone?: string | null; // never populated today — no phone field exists anywhere in the system yet
  onChanged?: () => void; // parent re-fetches after an action is logged
}

const ACTION_META: Record<ActionType, { label: string; description: string; icon: keyof typeof Ionicons.glyphMap }> = {
  send_similar_story: {
    label: 'Send a similar story',
    description: 'Opens Stories so you can create another one in this same category.',
    icon: 'film-outline',
  },
  share_with_family: {
    label: 'Share with family',
    description: 'Logs this update as shared, so other family members know this session happened.',
    icon: 'share-social-outline',
  },
  call_or_visit: {
    label: 'Call or visit',
    description: 'A quick check-in may help — recall was weaker than usual this time.',
    icon: 'call-outline',
  },
  show_photo_together: {
    label: 'Show the photo together',
    description: 'Looking at the photo together next visit may help the memory come back.',
    icon: 'image-outline',
  },
  pause_topic: {
    label: 'Pause this topic',
    description: "This category won't be suggested for new stories again.",
    icon: 'pause-circle-outline',
  },
  try_gentler_story: {
    label: 'Try a gentler story',
    description: 'Opens Stories — consider a calmer memory next time.',
    icon: 'leaf-outline',
  },
  call_now: {
    label: 'Call Now',
    description: 'This story seemed to confuse or upset her — a call now may help.',
    icon: 'call',
  },
  dismiss: {
    label: 'Dismiss',
    description: 'No action needed — just acknowledges this card.',
    icon: 'close-circle-outline',
  },
};

const DECISION_META: Record<DecisionCode, { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }> = {
  strong_happy: { icon: 'sunny', color: Colors.success, bg: Colors.successSoft },
  comforting_fading: { icon: 'partly-sunny-outline', color: Colors.primary, bg: Colors.primaryLight },
  clear_painful: { icon: 'rainy-outline', color: Colors.warning, bg: Colors.warningSoft },
  confusing_upsetting: { icon: 'alert-circle', color: Colors.danger, bg: Colors.dangerSoft },
  not_enough_data: { icon: 'help-circle-outline', color: Colors.textMuted, bg: Colors.borderLight },
};

const categoryLabel = (key: string) =>
  key ? key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ') : 'Other';

const confidenceReason = (framesUsed: number, framesTotal: number | null, hasQuiz: boolean) => {
  const readingsPart = `${framesUsed} mood reading${framesUsed === 1 ? '' : 's'}${framesTotal ? ` of ${framesTotal}` : ''}`;
  return hasQuiz ? `Based on ${readingsPart} and a completed quiz.` : `Based on ${readingsPart}, no quiz completed yet.`;
};

const RESULT_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  better: { label: 'This helped', color: Colors.success, bg: Colors.successSoft },
  same: { label: 'No change', color: Colors.textMuted, bg: Colors.borderLight },
  worse: { label: 'Needs attention', color: Colors.danger, bg: Colors.dangerSoft },
};

export const FamilyActionCard: React.FC<FamilyActionCardProps> = ({ report, patientName, patientPhone, onChanged }) => {
  const [busyAction, setBusyAction] = useState<ActionType | null>(null);
  const [quizExpanded, setQuizExpanded] = useState(false);
  const decision = report.decision;

  if (!decision) return null; // sessions that pre-date this feature — no card to show

  const isUrgent = decision.code === 'confusing_upsetting';
  const takenTypes = new Set(report.actions.map((a) => a.type));

  const runAction = async (type: ActionType) => {
    if (busyAction || takenTypes.has(type)) return;
    setBusyAction(type);

    if (type === 'call_now' || type === 'call_or_visit') {
      if (patientPhone) {
        Linking.openURL(`tel:${patientPhone}`).catch(() => {});
      } else if (type === 'call_now') {
        Alert.alert('No phone number', `There is no phone number saved for ${patientName} yet.`);
      }
    }

    const ok = await logSessionAction(report.outcomeId, type);
    setBusyAction(null);
    if (ok) {
      if (type === 'send_similar_story' || type === 'try_gentler_story') {
        router.push('/family/stories');
      }
      onChanged?.();
    }
  };

  const theme = isUrgent
    ? { bg: FamilyColors.slate900, border: FamilyColors.slateBorder, titleColor: FamilyColors.slate50, textColor: FamilyColors.slate300, metaColor: FamilyColors.slate500 }
    : { bg: Colors.white, border: Colors.borderLight, titleColor: Colors.textPrimary, textColor: Colors.textSecondary, metaColor: Colors.textMuted };

  const resultBadge = report.followUp.status === 'evaluated' && report.followUp.outcome
    ? RESULT_BADGE[report.followUp.outcome]
    : null;

  const meta = DECISION_META[decision.code];
  const iconBg = isUrgent ? FamilyColors.slate800 : meta.bg;
  const iconColor = isUrgent ? Colors.danger : meta.color;

  return (
    <View
      style={{
        backgroundColor: theme.bg,
        borderRadius: 20,
        padding: 18,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: theme.border,
        ...(isUrgent ? { ...FamilyShadow.elevated, shadowColor: Colors.primary } : FamilyShadow.card),
      }}
    >
      {/* Title row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <View style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: iconBg, justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name={meta.icon} size={18} color={iconColor} />
        </View>
        <Text style={{ fontSize: 16, fontWeight: '700', color: isUrgent ? Colors.danger : theme.titleColor, flex: 1 }}>
          {decision.title}
        </Text>
        {resultBadge && (
          <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, backgroundColor: resultBadge.bg }}>
            <Text style={{ fontSize: 10, fontWeight: '700', color: resultBadge.color }}>{resultBadge.label}</Text>
          </View>
        )}
      </View>

      {/* Story row — photo + title + category */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        {report.photoUrl ? (
          <Image source={{ uri: report.photoUrl }} style={{ width: 44, height: 44, borderRadius: 12 }} />
        ) : (
          <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: isUrgent ? FamilyColors.slate800 : Colors.purpleSoft, justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name="image-outline" size={18} color={isUrgent ? FamilyColors.slate400 : Colors.purple} />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textColor }} numberOfLines={1}>
            "{report.storyTitle}"
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
            <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8, backgroundColor: isUrgent ? FamilyColors.slate800 : FamilyColors.canvasAlt }}>
              <Text style={{ fontSize: 10, fontWeight: '600', color: theme.metaColor }}>{categoryLabel(report.category)}</Text>
            </View>
            <Text style={{ fontSize: 11, color: theme.metaColor }}>{report.triggeredAt}</Text>
          </View>
        </View>
      </View>

      {/* Stat chips — mood / recall / confidence, at a glance */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
        <View style={{ flex: 1, backgroundColor: isUrgent ? FamilyColors.slate800 : FamilyColors.canvasAlt, borderRadius: 12, padding: 10, alignItems: 'center' }}>
          <Ionicons name={report.moodShiftPercent >= 0 ? 'trending-up' : 'trending-down'} size={14} color={report.moodShiftPercent >= 0 ? Colors.success : Colors.danger} />
          <Text style={{ fontSize: 13, fontWeight: '700', color: isUrgent ? FamilyColors.slate50 : Colors.textPrimary, marginTop: 3 }}>
            {report.moodShiftPercent > 0 ? '+' : ''}{report.moodShiftPercent}%
          </Text>
          <Text style={{ fontSize: 9, color: theme.metaColor, fontWeight: '600', marginTop: 1 }}>MOOD</Text>
        </View>

        <TouchableOpacity
          disabled={!report.quizQuestions || report.quizQuestions.length === 0}
          onPress={() => setQuizExpanded((v) => !v)}
          activeOpacity={0.7}
          style={{ flex: 1, backgroundColor: isUrgent ? FamilyColors.slate800 : FamilyColors.canvasAlt, borderRadius: 12, padding: 10, alignItems: 'center' }}
        >
          {report.quizQuestions && report.quizQuestions.length > 0 ? (
            <View style={{ flexDirection: 'row', gap: 3 }}>
              {report.quizQuestions.map((q, i) => (
                <Ionicons
                  key={i}
                  name={q.isCorrect ? 'checkmark-circle' : 'close-circle'}
                  size={14}
                  color={q.isCorrect ? Colors.success : Colors.danger}
                />
              ))}
            </View>
          ) : (
            <Ionicons name="help-circle-outline" size={14} color={theme.metaColor} />
          )}
          <Text style={{ fontSize: 13, fontWeight: '700', color: isUrgent ? FamilyColors.slate50 : Colors.textPrimary, marginTop: 3 }}>
            {report.quizScore !== null ? `${report.quizScore}/${report.quizTotal}` : '—'}
          </Text>
          <Text style={{ fontSize: 9, color: theme.metaColor, fontWeight: '600', marginTop: 1 }}>
            REMEMBERED{report.quizQuestions && report.quizQuestions.length > 0 ? (quizExpanded ? ' ▲' : ' ▼') : ''}
          </Text>
        </TouchableOpacity>

        <View style={{ flex: 1, backgroundColor: isUrgent ? FamilyColors.slate800 : FamilyColors.canvasAlt, borderRadius: 12, padding: 10, alignItems: 'center' }}>
          <Ionicons name="shield-checkmark-outline" size={14} color={iconColor} />
          <Text style={{ fontSize: 13, fontWeight: '700', color: isUrgent ? FamilyColors.slate50 : Colors.textPrimary, marginTop: 3 }}>
            {decision.confidence.toUpperCase()}
          </Text>
          <Text style={{ fontSize: 9, color: theme.metaColor, fontWeight: '600', marginTop: 1 }}>CONFIDENCE</Text>
        </View>
      </View>

      {/* Per-question quiz detail — only when expanded */}
      {quizExpanded && report.quizQuestions && report.quizQuestions.length > 0 && (
        <View style={{ backgroundColor: isUrgent ? FamilyColors.slate800 : FamilyColors.canvasAlt, borderRadius: 12, padding: 12, marginBottom: 14, gap: 8 }}>
          {report.quizQuestions.map((q, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
              <Ionicons
                name={q.isCorrect ? 'checkmark-circle' : 'close-circle'}
                size={15}
                color={q.isCorrect ? Colors.success : Colors.danger}
                style={{ marginTop: 1 }}
              />
              <Text style={{ fontSize: 12, color: theme.textColor, lineHeight: 17, flex: 1 }}>{q.questionText}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Decision text */}
      <Text style={{ fontSize: 13, color: theme.textColor, lineHeight: 19, marginBottom: 6 }}>{decision.text}</Text>

      {/* Why this confidence level */}
      <Text style={{ fontSize: 10, color: theme.metaColor, marginBottom: 10 }}>
        {confidenceReason(decision.quality.framesUsed, decision.quality.framesTotal, report.quizScore !== null)}
      </Text>

      {/* Talk-about tip */}
      {decision.code !== 'not_enough_data' && (
        <View style={{ backgroundColor: isUrgent ? FamilyColors.slate800 : FamilyColors.canvasAlt, borderRadius: 12, padding: 12, marginBottom: 14 }}>
          <Text style={{ fontSize: 10, fontWeight: '700', color: isUrgent ? FamilyColors.slate400 : Colors.textMuted, marginBottom: 4, letterSpacing: 0.4 }}>
            FOR YOUR NEXT VISIT
          </Text>
          <Text style={{ fontSize: 12, color: theme.textColor, lineHeight: 18 }}>{decision.talkAboutTip}</Text>
        </View>
      )}

      {/* Action buttons — one per row, with a line explaining what tapping
          it actually does, not just a bare label */}
      <View style={{ gap: 8 }}>
        {decision.suggestedActions.map((type) => {
          const meta = ACTION_META[type];
          const done = takenTypes.has(type);
          const takenAction = report.actions.find((a) => a.type === type);
          const isPrimary = isUrgent && type === 'call_now';
          const fg = done ? Colors.success : isPrimary ? '#fff' : (isUrgent ? FamilyColors.slate300 : Colors.textPrimary);

          return (
            <TouchableOpacity
              key={type}
              onPress={() => runAction(type)}
              disabled={done || busyAction !== null}
              activeOpacity={0.85}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 10,
                paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14,
                backgroundColor: done
                  ? (isUrgent ? FamilyColors.slate800 : FamilyColors.canvasAlt)
                  : isPrimary ? Colors.success : (isUrgent ? FamilyColors.slate800 : Colors.white),
                borderWidth: done || isPrimary ? 0 : 1,
                borderColor: isUrgent ? FamilyColors.slate700 : Colors.border,
                opacity: busyAction && busyAction !== type ? 0.5 : 1,
              }}
            >
              <Ionicons name={done ? 'checkmark-circle' : meta.icon} size={20} color={fg} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: fg }}>
                  {done && takenAction ? `${meta.label} ✓` : meta.label}
                </Text>
                {!done && (
                  <Text style={{ fontSize: 11, color: isPrimary ? 'rgba(255,255,255,0.85)' : theme.metaColor, marginTop: 2, lineHeight: 15 }}>
                    {meta.description}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};
