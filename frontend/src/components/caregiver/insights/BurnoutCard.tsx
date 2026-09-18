import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../../constants/colors';
import { BurnoutRisk } from '../../../types/caregiver.types';

interface Props {
  burnout: BurnoutRisk;
}

export const BurnoutCard: React.FC<Props> = ({ burnout }) => {
  const [expanded, setExpanded] = useState(false);

  const config = {
    Low:      { color: Colors.success, bg: Colors.successSoft, emoji: '🟢', label: 'Low Risk' },
    Moderate: { color: Colors.warning, bg: Colors.warningSoft, emoji: '🟡', label: 'Moderate Risk' },
    High:     { color: Colors.danger,  bg: Colors.dangerSoft,  emoji: '🔴', label: 'High Risk' },
  }[burnout.riskLevel] || { color: Colors.warning, bg: Colors.warningSoft, emoji: '🟡', label: 'Moderate Risk' };

  const severityColor = (s: string) => ({
    high:     Colors.danger,
    moderate: Colors.warning,
    low:      Colors.success,
  }[s] || Colors.textMuted);

  return (
    <View style={{
      marginHorizontal: 20, marginBottom: 16,
      backgroundColor: Colors.white,
      borderRadius: 20, overflow: 'hidden',
      borderWidth: 1, borderColor: Colors.borderLight,
      shadowColor: config.color,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.1, shadowRadius: 8, elevation: 2,
    }}>

      {/* ── Card Header ── */}
      <TouchableOpacity
        onPress={() => setExpanded(!expanded)}
        style={{
          backgroundColor: config.bg,
          padding: 16,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        }}
      >
        {/* Icon */}
        <View style={{
          width: 44, height: 44, borderRadius: 22,
          backgroundColor: config.color + '20',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Ionicons name="analytics-outline" size={22} color={config.color} />
        </View>

        {/* Title */}
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 11, color: config.color, fontWeight: '700' }}>
            7-DAY BURNOUT FORECAST
          </Text>
          <Text style={{ fontSize: 18, fontWeight: '900', color: config.color }}>
            {config.label}
          </Text>
          <Text style={{ fontSize: 11, color: Colors.textSecondary, marginTop: 2 }}>
            Based on {burnout.daysAnalyzed} day{burnout.daysAnalyzed !== 1 ? 's' : ''} of data
          </Text>
        </View>

        {/* Score circle */}
        <View style={{
          width: 52, height: 52, borderRadius: 26,
          borderWidth: 3, borderColor: config.color,
          alignItems: 'center', justifyContent: 'center',
          backgroundColor: Colors.white,
        }}>
          <Text style={{ fontSize: 16, fontWeight: '900', color: config.color }}>
            {burnout.riskScore}
          </Text>
          <Text style={{ fontSize: 8, color: Colors.textMuted }}>/ 100</Text>
        </View>

        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16} color={Colors.textMuted}
        />
      </TouchableOpacity>

      {/* ── Progress bar ── */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
        <View style={{
          height: 8, backgroundColor: Colors.borderLight,
          borderRadius: 4, overflow: 'hidden',
        }}>
          <View style={{
            height: 8,
            width: `${Math.min(burnout.riskScore, 100)}%` as any,
            backgroundColor: config.color,
            borderRadius: 4,
          }} />
        </View>
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginTop: 4,
        }}>
          <Text style={{ fontSize: 10, color: Colors.success }}>Low</Text>
          <Text style={{ fontSize: 10, color: Colors.warning }}>Moderate</Text>
          <Text style={{ fontSize: 10, color: Colors.danger }}>High</Text>
        </View>
      </View>

      {/* ── Expanded: Risk factors ── */}
      {expanded && burnout.factors && burnout.factors.length > 0 && (
        <View style={{
          paddingHorizontal: 16, paddingBottom: 16,
          borderTopWidth: 1, borderTopColor: Colors.borderLight,
          paddingTop: 12,
        }}>
          <Text style={{
            fontSize: 11, fontWeight: '700', color: Colors.textMuted,
            textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10,
          }}>
            Risk Factors Detected
          </Text>

          {burnout.factors.map((factor, i) => (
            <View key={i} style={{
              flexDirection: 'row', alignItems: 'flex-start', gap: 10,
              marginBottom: 10,
              backgroundColor: Colors.background,
              borderRadius: 10, padding: 10,
              borderLeftWidth: 3,
              borderLeftColor: severityColor(factor.severity),
            }}>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 12, fontWeight: '700',
                  color: severityColor(factor.severity),
                }}>
                  {factor.factor}
                </Text>
                <Text style={{
                  fontSize: 11, color: Colors.textSecondary, marginTop: 2,
                }}>
                  {factor.description}
                </Text>
              </View>
              <View style={{
                backgroundColor: severityColor(factor.severity) + '20',
                paddingHorizontal: 8, paddingVertical: 2,
                borderRadius: 6,
              }}>
                <Text style={{
                  fontSize: 9, fontWeight: '700',
                  color: severityColor(factor.severity),
                  textTransform: 'uppercase',
                }}>
                  {factor.severity}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* ── Expanded: No factors ── */}
      {expanded && (!burnout.factors || burnout.factors.length === 0) && (
        <View style={{
          padding: 16, alignItems: 'center',
          borderTopWidth: 1, borderTopColor: Colors.borderLight,
        }}>
          <Text style={{ fontSize: 24, marginBottom: 6 }}>✅</Text>
          <Text style={{ fontSize: 13, color: Colors.success, fontWeight: '700' }}>
            No risk factors detected
          </Text>
          <Text style={{
            fontSize: 12, color: Colors.textSecondary,
            textAlign: 'center', marginTop: 4,
          }}>
            Keep maintaining your current healthy habits!
          </Text>
        </View>
      )}

      {/* ── Not enough data ── */}
      {burnout.daysAnalyzed < 3 && (
        <View style={{
          paddingHorizontal: 16, paddingBottom: 12,
          borderTopWidth: 1, borderTopColor: Colors.borderLight,
          paddingTop: 10,
          flexDirection: 'row', alignItems: 'center', gap: 8,
        }}>
          <Ionicons name="information-circle-outline" size={16} color={Colors.primary} />
          <Text style={{ fontSize: 12, color: Colors.textSecondary, flex: 1 }}>
            Complete {3 - burnout.daysAnalyzed} more check-in(s) to unlock full forecast
          </Text>
        </View>
      )}
    </View>
  );
};