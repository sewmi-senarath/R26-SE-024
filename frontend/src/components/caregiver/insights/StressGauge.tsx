import React, { useEffect, useRef } from 'react';
import { Animated, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { Colors } from '../../../constants/colors';


const stressConfig: Record<string, {
  color: string; bg: string; angle: number; message: string;
}> = {
  'Not Stressed': {
    color:   Colors.success,
    bg:      Colors.successSoft,
    angle:   -90,
    message: 'You are coping well today. Keep taking care of yourself!',
  },
  'Stressed': {
    color:   Colors.danger,
    bg:      Colors.dangerSoft,
    angle:   60,
    message: 'Elevated stress detected. Please take a break and seek support.',
  },
 
  'Unknown': {
    color:   Colors.warning,
    bg:      Colors.warningSoft,
    angle:   0,
    message: 'Complete a check-in to see your stress level.',
  },
};


const getConfig = (level: string) =>
  stressConfig[level] ?? stressConfig['Unknown'];

interface StressGaugeProps {
  level: string;   
  score: number;
}

export const StressGauge: React.FC<StressGaugeProps> = ({ level, score }) => {
  const rotateAnim = useRef(new Animated.Value(-90)).current;
  const cfg        = getConfig(level);

  useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue:         cfg.angle,
      duration:        1200,
      useNativeDriver: true,
    }).start();
  }, [level]);

  const size = 220;
  const cx   = size / 2;
  const cy   = size / 2 + 20;
  const r    = 80;

  const describeArc = (startAngle: number, endAngle: number) => {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const x1 = cx + r * Math.cos(toRad(startAngle));
    const y1 = cy + r * Math.sin(toRad(startAngle));
    const x2 = cx + r * Math.cos(toRad(endAngle));
    const y2 = cy + r * Math.sin(toRad(endAngle));
    return `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`;
  };

  return (
    <View style={{
      marginHorizontal: 20, marginBottom: 16,
      backgroundColor:  Colors.white,
      borderRadius:     24, padding: 20,
      alignItems:       'center',
      shadowColor:      cfg.color,
      shadowOffset:     { width: 0, height: 6 },
      shadowOpacity:    0.12, shadowRadius: 16,
      elevation:        4,
      borderWidth:      1, borderColor: Colors.borderLight,
    }}>
      <Text style={{
        fontSize: 11, fontWeight: '700',
        color: Colors.textMuted,
        textTransform: 'uppercase', letterSpacing: 1.5,
        marginBottom: 8,
      }}>
        Current Stress Level
      </Text>

      {/* SVG Gauge */}
      <View style={{ width: size, height: size / 2 + 30, alignItems: 'center' }}>
        <Svg width={size} height={size / 2 + 40}>
          
          <Path
            d={describeArc(-180, -10)}
            stroke={Colors.successSoft}
            strokeWidth={14} fill="none" strokeLinecap="round"
          />
         
          <Path
            d={describeArc(-5, 0)}
            stroke={Colors.dangerSoft}
            strokeWidth={14} fill="none" strokeLinecap="round"
          />

          {/* Active arc — fills based on score */}
          <Path
            d={describeArc(-180, -180 + (score / 100) * 180)}
            stroke={cfg.color}
            strokeWidth={14} fill="none" strokeLinecap="round"
          />

          {/* Center dot */}
          <Circle cx={cx} cy={cy} r={6} fill={cfg.color} />
        </Svg>

        {/* Animated needle */}
        <Animated.View style={{
          position:        'absolute',
          bottom:          28,
          left:            cx - 2,
          width:           4,
          height:          68,
          borderRadius:    4,
          backgroundColor: Colors.textPrimary,
          transformOrigin: 'bottom',
          transform: [{
            rotate: rotateAnim.interpolate({
              inputRange:  [-90, 90],
              outputRange: ['-90deg', '90deg'],
            }),
          }],
        }} />
      </View>

      {/* Level label */}
      <View style={{
        paddingHorizontal: 20, paddingVertical: 6,
        borderRadius:      20,
        backgroundColor:   cfg.bg,
        marginTop:         -10,
        marginBottom:      8,
      }}>
        <Text style={{ fontSize: 22, fontWeight: '900', color: cfg.color }}>
          {level === 'Unknown' ? 'No Data Yet' : level}
        </Text>
      </View>

      <Text style={{
        fontSize: 13, color: Colors.textSecondary,
        textAlign: 'center', lineHeight: 19,
      }}>
        {cfg.message}
      </Text>
    </View>
  );
};