import React from 'react';
import { View, Text } from 'react-native';
import { Colors } from '../../../constants/colors';
import { WeeklyData } from '../../../types/caregiver.types';

interface WeeklyChartProps {
  data: WeeklyData[];
}

export const WeeklyChart: React.FC<WeeklyChartProps> = ({ data }) => {
  const maxStress = Math.max(...data.map((d) => d.stress), 1);

  return (
    <View
      style={{
        marginHorizontal: 20,
        marginBottom: 20,
        backgroundColor: Colors.white,
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: Colors.borderLight,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 2,
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
        }}
      >
        <View>
          <Text
            style={{
              fontSize: 15, fontWeight: '800',
              color: Colors.textPrimary,
            }}
          >
            Weekly Stress Trend
          </Text>
          <Text style={{ fontSize: 12, color: Colors.textMuted, marginTop: 2 }}>
            Past 7 days overview
          </Text>
        </View>
        <View
          style={{
            paddingHorizontal: 10, paddingVertical: 4,
            borderRadius: 10,
            backgroundColor: Colors.primaryLight,
          }}
        >
          <Text style={{ fontSize: 11, fontWeight: '700', color: Colors.primary }}>
            This Week
          </Text>
        </View>
      </View>

      {/* Bars */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          height: 100,
          marginBottom: 8,
        }}
      >
        {data.map((item, index) => {
          const heightPercent = (item.stress / maxStress) * 100;
          const isToday = index === data.length - 1;
          const barColor =
            item.stress >= 75
              ? Colors.danger
              : item.stress >= 50
              ? Colors.warning
              : Colors.success;

          return (
            <View
              key={item.day}
              style={{ alignItems: 'center', flex: 1 }}
            >
              {/* Bar */}
              <View
                style={{
                  width: 28,
                  height: Math.max((heightPercent / 100) * 90, 8),
                  borderRadius: 10,
                  backgroundColor: isToday ? Colors.primary : barColor + '60',
                  borderWidth: isToday ? 2 : 0,
                  borderColor: isToday ? Colors.primaryDark : 'transparent',
                  overflow: 'hidden',
                }}
              >
                {/* Gradient effect */}
                <View
                  style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0,
                    height: '40%',
                    backgroundColor: '#ffffff30',
                    borderRadius: 10,
                  }}
                />
              </View>

              {/* Day label */}
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: isToday ? '800' : '500',
                  color: isToday ? Colors.primary : Colors.textMuted,
                  marginTop: 6,
                }}
              >
                {item.day}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Legend */}
      <View
        style={{
          flexDirection: 'row',
          gap: 12,
          paddingTop: 12,
          borderTopWidth: 1,
          borderTopColor: Colors.borderLight,
        }}
      >
        {[
          { color: Colors.success, label: 'Low' },
          { color: Colors.warning, label: 'Moderate' },
          { color: Colors.danger,  label: 'High' },
          { color: Colors.primary, label: 'Today' },
        ].map((item) => (
          <View
            key={item.label}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
          >
            <View
              style={{
                width: 8, height: 8, borderRadius: 4,
                backgroundColor: item.color,
              }}
            />
            <Text style={{ fontSize: 10, color: Colors.textMuted, fontWeight: '500' }}>
              {item.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};