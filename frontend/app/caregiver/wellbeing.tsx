import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView, StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../../src/constants/colors';
import {
  getRecommendationPriorities,
  submitFeedback,
} from '../../src/services/caregiver/recommendationService';
import { CheckInResult, DailyCheckIn } from '../../src/types/caregiver.types';
import {
  generateRecommendations,
  getSummaryMessage,
  SmartRecommendation,
} from '../../src/utils/recommendationEngine';

// ── Priority badge config ──────────────────────────────────────────────────
const PRIORITY_CONFIG = {
  High: { label: 'High Priority', color: '#EF4444', bg: '#FEF2F2' },
  Medium: { label: 'Medium Priority', color: '#F97316', bg: '#FFF7ED' },
  Low: { label: 'Low Priority', color: '#22C55E', bg: '#F0FDF4' },
};

// ── Recommendation Card ────────────────────────────────────────────────────
const RecCard: React.FC<{
  rec: SmartRecommendation;
  index: number;
  stressLevel: string;
  stressScore: number;
  onFeedback: (id: string, feedback: 'helpful' | 'not_helpful') => void;
  feedbackGiven: Record<string, string>;
}> = ({ rec, index, stressLevel, stressScore, onFeedback, feedbackGiven }) => {
  const [expanded, setExpanded] = useState(index === 0);
  const [loading, setLoading] = useState(false);
  const pConfig = PRIORITY_CONFIG[rec.priority];
  const given = feedbackGiven[rec.id];

  const handleFeedback = async (fb: 'helpful' | 'not_helpful') => {
    if (given) return;
    setLoading(true);
    await onFeedback(rec.id, fb);
    setLoading(false);
  };

  return (
    <View style={{
      backgroundColor: Colors.white,
      borderRadius: 20, marginBottom: 12,
      overflow: 'hidden',
      borderWidth: 1, borderColor: Colors.borderLight,
      borderLeftWidth: 4, borderLeftColor: rec.color,
      shadowColor: rec.color,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08, shadowRadius: 8, elevation: 2,
    }}>

      {/* ── Card Header ── */}
      <TouchableOpacity
        onPress={() => setExpanded(!expanded)}
        style={{ padding: 14 }}
        activeOpacity={0.8}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          {/* Icon */}
          <View style={{
            width: 44, height: 44, borderRadius: 14,
            backgroundColor: rec.bg,
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Ionicons name={rec.icon as any} size={22} color={rec.color} />
          </View>

          {/* Title */}
          <View style={{ flex: 1 }}>
            <Text style={{
              fontSize: 13, fontWeight: '800',
              color: Colors.textPrimary, marginBottom: 4,
            }}>
              {rec.title}
            </Text>
            <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
              <View style={{
                backgroundColor: pConfig.bg,
                paddingHorizontal: 7, paddingVertical: 2,
                borderRadius: 6,
              }}>
                <Text style={{
                  fontSize: 9, fontWeight: '700',
                  color: pConfig.color, textTransform: 'uppercase',
                }}>
                  {pConfig.label}
                </Text>
              </View>
              <View style={{
                backgroundColor: rec.bg,
                paddingHorizontal: 7, paddingVertical: 2,
                borderRadius: 6,
              }}>
                <Text style={{
                  fontSize: 9, fontWeight: '600', color: rec.color,
                }}>
                  {rec.category}
                </Text>
              </View>
            </View>
          </View>

          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={16} color={Colors.textMuted}
          />
        </View>
      </TouchableOpacity>

      {/* ── Expanded Content ── */}
      {expanded && (
        <View style={{
          borderTopWidth: 1, borderTopColor: Colors.borderLight,
          padding: 14, gap: 12,
        }}>

          {/* Primary Cause */}
          <View style={{
            backgroundColor: rec.bg + '80',
            borderRadius: 12, padding: 12,
          }}>
            <Text style={{
              fontSize: 10, fontWeight: '700',
              color: rec.color, textTransform: 'uppercase',
              letterSpacing: 0.5, marginBottom: 2,
            }}>
              Primary Cause
            </Text>
            <Text style={{
              fontSize: 14, fontWeight: '800', color: rec.color,
            }}>
              {rec.primaryCause}
            </Text>
          </View>

          {/* Reason */}
          <View>
            <View style={{
              flexDirection: 'row', gap: 6,
              alignItems: 'center', marginBottom: 6,
            }}>
              <Ionicons
                name="information-circle-outline"
                size={14} color={Colors.primary}
              />
              <Text style={{
                fontSize: 10, fontWeight: '700',
                color: Colors.primary, textTransform: 'uppercase',
              }}>
                Why This Was Recommended
              </Text>
            </View>
            <Text style={{
              fontSize: 12, color: Colors.textSecondary,
              lineHeight: 18,
            }}>
              {rec.reason}
            </Text>
          </View>

          {/* Recommendations list */}
          <View>
            <View style={{
              flexDirection: 'row', gap: 6,
              alignItems: 'center', marginBottom: 8,
            }}>
              <Ionicons
                name="checkmark-circle-outline"
                size={14} color={Colors.success}
              />
              <Text style={{
                fontSize: 10, fontWeight: '700',
                color: Colors.success, textTransform: 'uppercase',
              }}>
                What To Do Now
              </Text>
            </View>
            {rec.recommendations.map((r, i) => (
              <View key={i} style={{
                flexDirection: 'row', gap: 8,
                marginBottom: 6, alignItems: 'flex-start',
              }}>
                <View style={{
                  width: 20, height: 20, borderRadius: 10,
                  backgroundColor: rec.color + '20',
                  alignItems: 'center', justifyContent: 'center',
                  marginTop: 1, flexShrink: 0,
                }}>
                  <Text style={{
                    fontSize: 9, fontWeight: '800', color: rec.color,
                  }}>
                    {i + 1}
                  </Text>
                </View>
                <Text style={{
                  flex: 1, fontSize: 12,
                  color: Colors.textPrimary,
                  lineHeight: 18, fontWeight: '500',
                }}>
                  {r}
                </Text>
              </View>
            ))}
          </View>

          {/* Expected benefit */}
          <View style={{
            backgroundColor: Colors.successSoft,
            borderRadius: 10, padding: 10,
            flexDirection: 'row', gap: 8, alignItems: 'flex-start',
          }}>
            <Ionicons name="trending-up-outline" size={14} color={Colors.success} />
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: 10, fontWeight: '700',
                color: Colors.success,
                textTransform: 'uppercase', marginBottom: 2,
              }}>
                Expected Benefit
              </Text>
              <Text style={{
                fontSize: 12, color: Colors.success, lineHeight: 17,
              }}>
                {rec.expectedBenefit}
              </Text>
            </View>
          </View>

          {/* Feedback */}
          <View style={{
            borderTopWidth: 1, borderTopColor: Colors.borderLight,
            paddingTop: 12,
          }}>
            <Text style={{
              fontSize: 12, color: Colors.textSecondary,
              marginBottom: 8, textAlign: 'center',
            }}>
              Was this recommendation helpful?
            </Text>

            {given ? (
              <View style={{
                backgroundColor: given === 'helpful'
                  ? Colors.successSoft : Colors.dangerSoft,
                borderRadius: 10, padding: 10,
                alignItems: 'center',
              }}>
                <Text style={{
                  fontSize: 12, fontWeight: '700',
                  color: given === 'helpful' ? Colors.success : Colors.danger,
                }}>
                  {given === 'helpful'
                    ? '✅ Marked as Helpful — we will prioritise this for you'
                    : '❌ Marked as Not Helpful — we will suggest alternatives next time'}
                </Text>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  onPress={() => handleFeedback('helpful')}
                  disabled={loading}
                  style={{
                    flex: 1, backgroundColor: Colors.successSoft,
                    borderRadius: 10, paddingVertical: 10,
                    alignItems: 'center', flexDirection: 'row',
                    justifyContent: 'center', gap: 6,
                    borderWidth: 1, borderColor: Colors.success + '40',
                  }}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color={Colors.success} />
                  ) : (
                    <>
                      <Ionicons name="thumbs-up-outline" size={16} color={Colors.success} />
                      <Text style={{
                        fontSize: 12, fontWeight: '700', color: Colors.success,
                      }}>
                        Helpful
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleFeedback('not_helpful')}
                  disabled={loading}
                  style={{
                    flex: 1, backgroundColor: Colors.dangerSoft,
                    borderRadius: 10, paddingVertical: 10,
                    alignItems: 'center', flexDirection: 'row',
                    justifyContent: 'center', gap: 6,
                    borderWidth: 1, borderColor: Colors.danger + '40',
                  }}
                >
                  <Ionicons name="thumbs-down-outline" size={16} color={Colors.danger} />
                  <Text style={{
                    fontSize: 12, fontWeight: '700', color: Colors.danger,
                  }}>
                    Not Helpful
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

// ── MAIN SCREEN ────────────────────────────────────────────────────────────
export default function WellbeingScreen() {
  const params = useLocalSearchParams();
  const stressLevel = (params.stressLevel as string) || 'Moderate';
  const stressScore = params.stressScore ? Number(params.stressScore) : 6;
  const formData = params.formData
    ? JSON.parse(params.formData as string) as DailyCheckIn
    : null;

  const defaultForm: DailyCheckIn = {
    sleepHours: 6, physicalTiredness: 3, mood: 3,
    emotionalOverwhelm: 3, hoursCaregiving: 8,
    tasksAssigned: 10, tasksCompleted: 8,
    difficultSituations: 2, breaksTaken: 1,
    mentallyExhausted: 3, difficultyManaging: 3,
    emotionallyDrained: 3,
  };

  const form = formData || defaultForm;
  const result = {
    stressLevel: stressLevel as 'Low' | 'Moderate' | 'High',
    stressScore,
    confidence: 0.85,
    message: '',
    tips: [],
    submittedAt: new Date().toISOString(),
  } as CheckInResult;

  const [recs, setRecs] = useState<SmartRecommendation[]>([]);
  const [feedbackGiven, setFeedback] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const stressConfig = {
    High: { color: '#EF4444', bg: '#FEF2F2', emoji: '😟' },
    Moderate: { color: '#F97316', bg: '#FFF7ED', emoji: '😐' },
    Low: { color: '#22C55E', bg: '#F0FDF4', emoji: '😊' },
  }[stressLevel] || { color: '#F97316', bg: '#FFF7ED', emoji: '😐' };

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    setLoading(true);
    // ← ADD THIS DEBUG LINE
    console.log('Form data received:', JSON.stringify(form));
    console.log('Sleep hours:', form.sleepHours);
    console.log('Tasks assigned:', form.tasksAssigned);
    console.log('Tasks completed:', form.tasksCompleted);
    try {
      // Load adaptive priorities from backend
      const { boosted, suppressed } = await getRecommendationPriorities();
      const generated = generateRecommendations(form, result, suppressed, boosted);
      setRecs(generated);
    } catch {
      setRecs(generateRecommendations(form, result));
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (
    id: string,
    feedback: 'helpful' | 'not_helpful',
  ) => {
    const rec = recs.find(r => r.id === id);
    if (!rec) return;

    setFeedback(prev => ({ ...prev, [id]: feedback }));

    await submitFeedback(rec, feedback, stressLevel, stressScore);

    // If not helpful — remove and reload alternatives
    if (feedback === 'not_helpful') {
      setTimeout(async () => {
        const { boosted, suppressed } = await getRecommendationPriorities();
        const fresh = generateRecommendations(form, result, suppressed, boosted);
        setRecs(fresh);
      }, 1500);
    }
  };

  const summaryMessage = getSummaryMessage(form, result);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Header */}
      <View style={{
        backgroundColor: Colors.background,
        paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16,
        borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 36, height: 36, borderRadius: 18,
              backgroundColor: Colors.borderLight,
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Ionicons name="chevron-back" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View>
            <Text style={{
              fontSize: 22, fontWeight: '800', color: Colors.textPrimary,
            }}>
              Smart Care Coach
            </Text>
            <Text style={{ fontSize: 12, color: Colors.textMuted }}>
              Personalised for your check-in today
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
      >
        {/* Stress banner */}
        <View style={{
          backgroundColor: stressConfig.bg, borderRadius: 20,
          padding: 16, marginBottom: 16,
          borderWidth: 1.5, borderColor: stressConfig.color + '30',
          flexDirection: 'row', alignItems: 'center', gap: 14,
        }}>
          <Text style={{ fontSize: 36 }}>{stressConfig.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={{
              fontSize: 11, color: stressConfig.color, fontWeight: '700',
            }}>
              TODAY'S STRESS LEVEL
            </Text>
            <Text style={{
              fontSize: 22, fontWeight: '900', color: stressConfig.color,
            }}>
              {stressLevel}
            </Text>
            <Text style={{ fontSize: 11, color: Colors.textSecondary }}>
              Score: {stressScore}/10
            </Text>
          </View>
          {/* Quick stats */}
          <View style={{ alignItems: 'flex-end', gap: 3 }}>
            <Text style={{ fontSize: 10, color: Colors.textMuted }}>
              Tasks: {form.tasksCompleted}/{form.tasksAssigned}
            </Text>
            <Text style={{ fontSize: 10, color: Colors.textMuted }}>
              Sleep: {form.sleepHours}h
            </Text>
            <Text style={{ fontSize: 10, color: Colors.textMuted }}>
              Breaks: {form.breaksTaken}
            </Text>
          </View>
        </View>

        {/* Personalised analysis */}
        <View style={{
          backgroundColor: Colors.white, borderRadius: 16,
          padding: 14, marginBottom: 20,
          borderWidth: 1, borderColor: Colors.borderLight,
        }}>
          <View style={{
            flexDirection: 'row', gap: 8,
            alignItems: 'center', marginBottom: 6,
          }}>
            <Ionicons name="analytics-outline" size={16} color={Colors.primary} />
            <Text style={{
              fontSize: 11, fontWeight: '700',
              color: Colors.primary, textTransform: 'uppercase',
            }}>
              Personalised Analysis
            </Text>
          </View>
          <Text style={{
            fontSize: 13, color: Colors.textSecondary, lineHeight: 20,
          }}>
            {summaryMessage}
          </Text>
        </View>

        {/* Recommendations header */}
        <View style={{
          flexDirection: 'row', alignItems: 'center',
          justifyContent: 'space-between', marginBottom: 14,
        }}>
          <Text style={{
            fontSize: 16, fontWeight: '800', color: Colors.textPrimary,
          }}>
            Your Action Plan
          </Text>
          {recs.length > 0 && (
            <View style={{
              backgroundColor: Colors.primaryLight,
              paddingHorizontal: 10, paddingVertical: 4,
              borderRadius: 12,
            }}>
              <Text style={{
                fontSize: 11, fontWeight: '700', color: Colors.primary,
              }}>
                {recs.length} actions
              </Text>
            </View>
          )}
        </View>

        {/* Loading */}
        {loading ? (
          <View style={{ alignItems: 'center', padding: 40 }}>
            <ActivityIndicator color={Colors.primary} size="large" />
            <Text style={{
              fontSize: 13, color: Colors.textMuted, marginTop: 12,
            }}>
              Personalising recommendations...
            </Text>
          </View>
        ) : recs.length === 0 ? (
          <View style={{
            backgroundColor: Colors.successSoft,
            borderRadius: 20, padding: 24, alignItems: 'center',
          }}>
            <Text style={{ fontSize: 40, marginBottom: 8 }}>🎉</Text>
            <Text style={{
              fontSize: 16, fontWeight: '800', color: Colors.success,
            }}>
              All done!
            </Text>
            <Text style={{
              fontSize: 13, color: Colors.textSecondary,
              textAlign: 'center', marginTop: 4,
            }}>
              You have completed all your recommended actions for today!
            </Text>
          </View>
        ) : (
          recs.map((rec, i) => (
            <RecCard
              key={rec.id}
              rec={rec}
              index={i}
              stressLevel={stressLevel}
              stressScore={stressScore}
              onFeedback={handleFeedback}
              feedbackGiven={feedbackGiven}
            />
          ))
        )}

        {/* Adaptive learning note */}
        {recs.length > 0 && (
          <View style={{
            backgroundColor: Colors.primaryLight,
            borderRadius: 14, padding: 12,
            flexDirection: 'row', gap: 10,
            alignItems: 'flex-start', marginTop: 4,
          }}>
            <Ionicons
              name="bulb-outline" size={16} color={Colors.primary}
            />
            <Text style={{
              flex: 1, fontSize: 11,
              color: Colors.primary, lineHeight: 16,
            }}>
              Your feedback helps personalise future recommendations.
              Helpful ratings increase priority, Not Helpful ratings
              suggest alternatives next time.
            </Text>
          </View>
        )}

        {/* Back button */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            backgroundColor: Colors.primaryLight,
            borderRadius: 14, paddingVertical: 14,
            alignItems: 'center', marginTop: 16,
            borderWidth: 1, borderColor: Colors.primary + '40',
          }}
        >
          <Text style={{
            fontSize: 14, fontWeight: '700', color: Colors.primary,
          }}>
            Back to Insights
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}