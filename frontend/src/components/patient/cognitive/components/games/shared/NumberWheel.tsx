import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  Text,
  View,
} from 'react-native';

const ITEM_WIDTH = 76;
const WHEEL_HEIGHT = 104;
const HIGHLIGHT_HEIGHT = 80;

interface Props {
  min: number;
  max: number;
  /** Called with the value under the centre marker as the patient spins. */
  onChange: (value: number) => void;
  disabled?: boolean;
  /** Border/tint state for the centre marker after an answer is submitted. */
  state?: 'neutral' | 'correct' | 'incorrect';
}

const STATE_COLORS = {
  neutral: { border: '#c7d2fe', bg: 'rgba(99,102,241,0.06)', text: '#111827' },
  correct: { border: '#4ade80', bg: 'rgba(34,197,94,0.10)', text: '#15803d' },
  incorrect: { border: '#f87171', bg: 'rgba(239,68,68,0.10)', text: '#b91c1c' },
};

/**
 * A horizontal "spin" selector the patient flicks left/right to land on a
 * number. It deliberately starts in the middle of the range (not on the answer)
 * so the task stays recall rather than recognition. Horizontal scrolling avoids
 * clashing with the vertically scrolling page it sits inside.
 */
export function NumberWheel({ min, max, onChange, disabled = false, state = 'neutral' }: Props) {
  const values = useMemo(() => {
    const out: number[] = [];
    for (let v = min; v <= max; v += 1) out.push(v);
    return out;
  }, [min, max]);

  const startIndex = Math.floor(values.length / 2);
  const [index, setIndex] = useState(startIndex);
  const [containerW, setContainerW] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const colors = STATE_COLORS[state];
  const sidePad = containerW > 0 ? Math.max(0, (containerW - ITEM_WIDTH) / 2) : 0;

  // Report the starting value once so the parent has something to submit even
  // if the patient never spins.
  useEffect(() => {
    onChange(values[startIndex]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Once we know our width, position the reel on the starting value.
  useEffect(() => {
    if (containerW > 0) {
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ x: startIndex * ITEM_WIDTH, animated: false });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerW]);

  const syncFromOffset = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const next = Math.max(0, Math.min(values.length - 1, Math.round(x / ITEM_WIDTH)));
    if (next !== index) {
      setIndex(next);
      onChange(values[next]);
    }
  };

  const onLayout = (e: LayoutChangeEvent) => setContainerW(e.nativeEvent.layout.width);

  return (
    <View onLayout={onLayout} style={{ height: WHEEL_HEIGHT, justifyContent: 'center' }}>
      {/* Centre marker */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          alignSelf: 'center',
          top: (WHEEL_HEIGHT - HIGHLIGHT_HEIGHT) / 2,
          width: ITEM_WIDTH,
          height: HIGHLIGHT_HEIGHT,
          borderWidth: 2,
          borderColor: colors.border,
          borderRadius: 18,
          backgroundColor: colors.bg,
        }}
      />
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={ITEM_WIDTH}
        decelerationRate="fast"
        scrollEnabled={!disabled}
        onScroll={syncFromOffset}
        onMomentumScrollEnd={syncFromOffset}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingHorizontal: sidePad }}
      >
        {values.map((v, i) => {
          const active = i === index;
          return (
            <View key={v} style={{ width: ITEM_WIDTH, height: HIGHLIGHT_HEIGHT, alignItems: 'center', justifyContent: 'center' }}>
              <Text
                style={{
                  fontSize: active ? 32 : 20,
                  fontWeight: active ? '800' : '500',
                  color: active ? colors.text : '#9ca3af',
                }}
              >
                {v}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
