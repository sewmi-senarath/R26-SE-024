import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import {
  Canvas,
  Path,
  Skia,
  SkPath,
} from '@shopify/react-native-skia';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Question } from '@/src/types/assessment.types';

interface DrawnPath {
  path: SkPath;
  color: string;
  strokeWidth: number;
}

interface Props {
  question: Question;
  onAnswer: (passed: boolean) => void;
}

export function DrawingRenderer({ question, onAnswer }: Props) {
  const [paths, setPaths] = useState<DrawnPath[]>([]);
  const [currentPath, setCurrentPath] = useState<SkPath | null>(null);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [CaregiverMarked, setCaregiverMarked] = useState<boolean | null>(null);

  // ── Gesture: finger down → start a new path ──────────────────
  const pan = Gesture.Pan()
    .runOnJS(true)
    .onBegin((e) => {
      const path = Skia.Path.Make();
      path.moveTo(e.x, e.y);
      setCurrentPath(path);
      setHasDrawn(true);
    })
    .onUpdate((e) => {
      if (!currentPath) return;
      const updated = currentPath.copy();
      updated.lineTo(e.x, e.y);
      setCurrentPath(updated);
    })
    .onEnd(() => {
      if (!currentPath) return;
      setPaths(prev => [
        ...prev,
        {
          path: currentPath,
          color: '#1e293b',   // dark slate — clear on white canvas
          strokeWidth: 2.5,
        },
      ]);
      setCurrentPath(null);
    });

  // ── Clear all strokes ─────────────────────────────────────────
  const handleClear = () => {
    setPaths([]);
    setCurrentPath(null);
    setHasDrawn(false);
    setCaregiverMarked(null);
    onAnswer(false);
  };

  // ── Caregiver marks pass or fail ──────────────────────────────
  // Per MMSE rules, scoring requires human judgement:
  // ✓ Two convex five-sided figures
  // ✓ They intersect/overlap
  // ✓ Intersection forms a four-sided figure
  const handleMark = (passed: boolean) => {
    setCaregiverMarked(passed);
    onAnswer(passed);
  };

  return (
    <View className="px-6 gap-5">

      {/* Reference image — the two overlapping pentagons */}
      <View className="items-center">
        <Text className="text-xs text-gray-400 mb-2 uppercase tracking-wide">
          Hint - Copy this drawing
        </Text>
        <View className="border border-gray-200 rounded-2xl bg-white p-4">
          {/* 
            Use the pentagon SVG from your assets.
            This must match the exact MMSE pentagon diagram —
            two overlapping convex pentagons where the
            intersection creates a four-sided figure.
          */}
          <Image
            source={require('@/assets/images/cognitive/mmse_pentagons.png')}
            style={{ width: 180, height: 120 }}
            resizeMode="contain"
          />
        </View>
      </View>

      {/* Drawing canvas */}
      <View>
        <Text className="text-xs text-gray-400 mb-2 uppercase tracking-wide">
          Patient draws here
        </Text>
        <View
          className="border-2 border-dashed border-gray-300 rounded-2xl overflow-hidden bg-white"
          style={{ height: 260 }}
        >
          <GestureDetector gesture={pan}>
            <Canvas style={StyleSheet.absoluteFill}>

              {/* Render all completed strokes */}
              {paths.map((p, i) => (
                <Path
                  key={i}
                  path={p.path}
                  color={p.color}
                  style="stroke"
                  strokeWidth={p.strokeWidth}
                  strokeJoin="round"
                  strokeCap="round"
                />
              ))}

              {/* Render the stroke currently being drawn */}
              {currentPath && (
                <Path
                  path={currentPath}
                  color="#1e293b"
                  style="stroke"
                  strokeWidth={2.5}
                  strokeJoin="round"
                  strokeCap="round"
                />
              )}

            </Canvas>
          </GestureDetector>

          {/* Empty state hint */}
          {!hasDrawn && (
            <View className="absolute inset-0 items-center justify-center pointer-events-none">
              <Text className="text-gray-300 text-sm">Draw here</Text>
            </View>
          )}
        </View>
      </View>

      {/* Controls */}
      <View className="flex-row gap-3">
        <TouchableOpacity
          onPress={handleClear}
          className="flex-1 border border-gray-200 py-3 rounded-2xl items-center"
        >
          <Text className="text-gray-500 font-medium">Clear</Text>
        </TouchableOpacity>
      </View>

      {/* 
        Caregiver scoring section.
        
        MMSE scoring for this question requires human judgement.
        The Caregiver looks at what the patient drew and decides:
        
        PASS (1 point) — both shapes are convex pentagons (5 sides each)
                          AND they overlap
                          AND the overlap region is a 4-sided figure
        
        FAIL (0 points) — any of the above conditions are not met,
                           or the patient refused / was unable to draw
      */}
      {hasDrawn && (
        <View className="gap-3">
          <View className="h-px bg-gray-100" />
          <Text className="text-sm font-medium text-gray-700">
            Caregiver: does the drawing meet all three criteria?
          </Text>

          {/* Scoring criteria checklist — for Caregiver reference */}
          <View className="bg-gray-50 rounded-xl p-3 gap-1.5">
            <Text className="text-xs text-gray-500">✓ Both figures have five sides</Text>
            <Text className="text-xs text-gray-500">✓ Both figures are convex</Text>
            <Text className="text-xs text-gray-500">✓ Figures overlap each other</Text>
            <Text className="text-xs text-gray-500">✓ Overlap creates a four-sided shape</Text>
          </View>

          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => handleMark(false)}
              className={`flex-1 py-3 rounded-2xl items-center border ${
                CaregiverMarked === false
                  ? 'bg-red-500 border-red-500'
                  : 'bg-white border-gray-200'
              }`}
            >
              <Text className={`font-semibold ${
                CaregiverMarked === false ? 'text-white' : 'text-gray-500'
              }`}>
                Incorrect — 0 pts
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleMark(true)}
              className={`flex-1 py-3 rounded-2xl items-center border ${
                CaregiverMarked === true
                  ? 'bg-green-500 border-green-500'
                  : 'bg-white border-gray-200'
              }`}
            >
              <Text className={`font-semibold ${
                CaregiverMarked === true ? 'text-white' : 'text-gray-500'
              }`}>
                Correct — 1 pt
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

    </View>
  );
}