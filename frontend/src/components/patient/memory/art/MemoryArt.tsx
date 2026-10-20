import React from 'react';
import Svg, { Circle, ClipPath, Defs, Ellipse, G, Path, Rect } from 'react-native-svg';

// Drawn pictures used instead of emoji on the memory screens (mood check-in,
// a correct answer, family relations). Same flat style as findThings/Illustrations.

const SKIN = '#F2C29B';
const SKIN_DARK = '#D9A27A';
const INK = '#3B2F2A';

// ─── Mood faces ─────────────────────────────────────────────────────────────
type MoodKey = 'happy' | 'ok' | 'tired' | 'sad' | string;
const MOOD_BG: Record<string, string> = { happy: '#FDE68A', ok: '#BBF7D0', tired: '#DDD6FE', sad: '#BFDBFE' };

export function MoodFace({ mood, size = 64 }: { mood: MoodKey; size?: number }) {
  const bg = MOOD_BG[mood] || '#E2E8F0';
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Circle cx="32" cy="32" r="30" fill={bg} />
      <Circle cx="32" cy="34" r="20" fill={SKIN} />
      {/* eyes */}
      {mood === 'tired' ? (
        <G stroke={INK} strokeWidth="2.6" strokeLinecap="round" fill="none">
          <Path d="M22 32 q4 3 8 0" /><Path d="M34 32 q4 3 8 0" />
        </G>
      ) : mood === 'happy' ? (
        <G stroke={INK} strokeWidth="2.6" strokeLinecap="round" fill="none">
          <Path d="M22 32 q4 -4 8 0" /><Path d="M34 32 q4 -4 8 0" />
        </G>
      ) : (
        <G fill={INK}>
          <Circle cx="26" cy="31" r="2.6" /><Circle cx="38" cy="31" r="2.6" />
        </G>
      )}
      {/* cheeks */}
      {(mood === 'happy' || mood === 'ok') && (
        <G fill="#F59E8B" opacity={0.7}><Circle cx="21" cy="38" r="3" /><Circle cx="43" cy="38" r="3" /></G>
      )}
      {/* mouth */}
      {mood === 'happy' && <Path d="M24 40 q8 9 16 0 z" fill="#B4413C" />}
      {mood === 'ok' && <Path d="M25 41 q7 5 14 0" stroke={INK} strokeWidth="2.6" fill="none" strokeLinecap="round" />}
      {mood === 'tired' && <Ellipse cx="32" cy="43" rx="3.5" ry="2.5" fill="#B4413C" />}
      {mood === 'sad' && <Path d="M25 45 q7 -6 14 0" stroke={INK} strokeWidth="2.6" fill="none" strokeLinecap="round" />}
      {/* extras */}
      {mood === 'tired' && <Path d="M46 14 h6 l-6 7 h6 M52 6 h4 l-4 5 h4" stroke="#7C3AED" strokeWidth="2" fill="none" strokeLinecap="round" />}
      {mood === 'sad' && <Path d="M41 35 q2 4 0 6 q-2 -2 0 -6 z" fill="#60A5FA" />}
      {mood === 'happy' && <Path d="M50 10 l2 4 4 2 -4 2 -2 4 -2 -4 -4 -2 4 -2z" fill="#F59E0B" />}
    </Svg>
  );
}

// ─── Correct answer ─────────────────────────────────────────────────────────
export function CelebrateArt({ size = 110 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      <Circle cx="60" cy="60" r="44" fill="#FEF3C7" />
      {/* confetti */}
      <G>
        <Rect x="16" y="22" width="8" height="4" rx="2" fill="#F472B6" transform="rotate(-25 20 24)" />
        <Rect x="96" y="20" width="8" height="4" rx="2" fill="#60A5FA" transform="rotate(30 100 22)" />
        <Rect x="12" y="84" width="8" height="4" rx="2" fill="#34D399" transform="rotate(20 16 86)" />
        <Rect x="100" y="88" width="8" height="4" rx="2" fill="#A78BFA" transform="rotate(-20 104 90)" />
        <Circle cx="30" cy="12" r="3" fill="#FBBF24" /><Circle cx="92" cy="104" r="3" fill="#F472B6" />
        <Circle cx="106" cy="54" r="2.5" fill="#34D399" /><Circle cx="10" cy="56" r="2.5" fill="#60A5FA" />
      </G>
      {/* big star with a smile */}
      <Path d="M60 18 l12.5 25.3 27.9 4.1 -20.2 19.7 4.8 27.8 -25 -13.1 -25 13.1 4.8 -27.8 -20.2 -19.7 27.9 -4.1z"
        fill="#FBBF24" stroke="#F59E0B" strokeWidth="3" strokeLinejoin="round" />
      <Circle cx="52" cy="58" r="3.2" fill={INK} /><Circle cx="68" cy="58" r="3.2" fill={INK} />
      <Path d="M52 67 q8 8 16 0" stroke={INK} strokeWidth="3" fill="none" strokeLinecap="round" />
      <G fill="#FB923C" opacity={0.6}><Circle cx="46" cy="65" r="3" /><Circle cx="74" cy="65" r="3" /></G>
    </Svg>
  );
}

// ─── Family relations ───────────────────────────────────────────────────────
type Look = {
  bg: string; shirt: string; hair: string;
  style: 'short' | 'long' | 'bun' | 'pigtails' | 'bald' | 'curly';
  child?: boolean; beard?: boolean; moustache?: boolean; glasses?: boolean; nurse?: boolean; doctor?: boolean;
};

const LOOKS: Record<string, Look> = {
  son:               { bg: '#DBEAFE', shirt: '#2563EB', hair: '#2B2118', style: 'short' },
  daughter:          { bg: '#FCE7F3', shirt: '#DB2777', hair: '#2B2118', style: 'long' },
  wife:              { bg: '#FFE4E6', shirt: '#E11D48', hair: '#1F1A17', style: 'bun' },
  husband:           { bg: '#E0F2FE', shirt: '#0369A1', hair: '#1F1A17', style: 'short', moustache: true },
  grandson:          { bg: '#DCFCE7', shirt: '#16A34A', hair: '#3F2A1D', style: 'short', child: true },
  granddaughter:     { bg: '#FEF9C3', shirt: '#CA8A04', hair: '#3F2A1D', style: 'pigtails', child: true },
  'elder brother':   { bg: '#E0E7FF', shirt: '#4338CA', hair: '#1F1A17', style: 'short', beard: true },
  'younger brother': { bg: '#CFFAFE', shirt: '#0891B2', hair: '#2B2118', style: 'curly' },
  'elder sister':    { bg: '#F3E8FF', shirt: '#9333EA', hair: '#1F1A17', style: 'bun' },
  'younger sister':  { bg: '#FFEDD5', shirt: '#EA580C', hair: '#2B2118', style: 'long' },
  mother:            { bg: '#FAE8FF', shirt: '#A21CAF', hair: '#CBD5E1', style: 'bun', glasses: true },
  father:            { bg: '#F1F5F9', shirt: '#475569', hair: '#CBD5E1', style: 'bald', glasses: true, moustache: true },
  nurse:             { bg: '#CCFBF1', shirt: '#14B8A6', hair: '#1F1A17', style: 'bun', nurse: true },
  doctor:            { bg: '#E0F2FE', shirt: '#F8FAFC', hair: '#1F1A17', style: 'short', doctor: true },
};

function Person({ look, x = 32, scale = 1 }: { look: Look; x?: number; scale?: number }) {
  const k = look.child ? 0.86 * scale : scale;
  const headY = look.child ? 30 : 27;
  return (
    <G transform={`translate(${x} 0) scale(${k}) translate(${-32} ${look.child ? 8 : 0})`}>
      {/* long hair behind the head */}
      {look.style === 'long' && <Path d="M18 28 q0 -16 14 -16 q14 0 14 16 v18 h-28z" fill={look.hair} />}
      {look.style === 'pigtails' && <G fill={look.hair}><Circle cx="16" cy="30" r="5" /><Circle cx="48" cy="30" r="5" /></G>}
      {/* body */}
      <Path d="M12 64 q0 -16 20 -16 q20 0 20 16z" fill={look.shirt} />
      {look.doctor && (
        <G>
          <Path d="M26 49 l6 9 l6 -9" fill="#93C5FD" />
          <Path d="M24 50 q-2 10 6 12" stroke="#334155" strokeWidth="2" fill="none" />
          <Circle cx="30" cy="62" r="2.4" fill="#334155" />
        </G>
      )}
      <Rect x="28" y="40" width="8" height="9" rx="3" fill={SKIN_DARK} />
      {/* head */}
      <Circle cx="32" cy={headY} r="12" fill={SKIN} />
      {/* hair on top */}
      {look.style === 'short' && <Path d={`M20 ${headY - 1} q0 -12 12 -12 q12 0 12 12 q-6 -6 -12 -5 q-6 -1 -12 5z`} fill={look.hair} />}
      {look.style === 'curly' && <Path d={`M20 ${headY} q-2 -12 8 -13 q4 -4 8 0 q10 1 8 13 q-4 -6 -12 -6 q-8 0 -12 6z`} fill={look.hair} />}
      {(look.style === 'long' || look.style === 'pigtails') && <Path d={`M20 ${headY - 1} q2 -11 12 -11 q10 0 12 11 q-8 -5 -24 0z`} fill={look.hair} />}
      {look.style === 'bun' && (
        <G fill={look.hair}>
          <Circle cx="32" cy={headY - 14} r="5" />
          <Path d={`M20 ${headY - 1} q2 -11 12 -11 q10 0 12 11 q-8 -5 -24 0z`} />
        </G>
      )}
      {look.style === 'bald' && <Path d={`M20 ${headY + 2} q-1 -5 2 -7 M44 ${headY + 2} q1 -5 -2 -7`} stroke={look.hair} strokeWidth="3" fill="none" strokeLinecap="round" />}
      {look.nurse && (
        <G>
          <Path d={`M22 ${headY - 9} h20 l-2 -6 h-16z`} fill="#fff" stroke="#14B8A6" strokeWidth="1.2" />
          <Path d={`M32 ${headY - 13} v4 M30 ${headY - 11} h4`} stroke="#EF4444" strokeWidth="1.6" />
        </G>
      )}
      {/* face */}
      <Circle cx="27.5" cy={headY + 1} r="1.6" fill={INK} />
      <Circle cx="36.5" cy={headY + 1} r="1.6" fill={INK} />
      <Path d={`M28 ${headY + 6} q4 3 8 0`} stroke={INK} strokeWidth="1.6" fill="none" strokeLinecap="round" />
      {look.glasses && (
        <G stroke="#334155" strokeWidth="1.3" fill="none">
          <Circle cx="27.5" cy={headY + 1} r="3.2" /><Circle cx="36.5" cy={headY + 1} r="3.2" /><Path d={`M30.7 ${headY + 1} h2.6`} />
        </G>
      )}
      {look.moustache && <Path d={`M27.5 ${headY + 5} q4.5 -2 9 0`} stroke={look.hair === '#CBD5E1' ? '#94A3B8' : look.hair} strokeWidth="2.2" fill="none" strokeLinecap="round" />}
      {look.beard && <Path d={`M21 ${headY + 2} q1 12 11 12 q10 0 11 -12 q-3 6 -11 6 q-8 0 -11 -6z`} fill={look.hair} />}
    </G>
  );
}

export function RelationAvatar({ relation, size = 44 }: { relation: string; size?: number }) {
  const look = LOOKS[relation] || LOOKS.son;
  const clip = `rel-${relation.replace(/\s+/g, '-')}`;   // keep the body inside the round background
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <ClipPath id={clip}><Circle cx="32" cy="32" r="31" /></ClipPath>
      </Defs>
      <Circle cx="32" cy="32" r="31" fill={relation === 'friend' ? '#FEF3C7' : look.bg} />
      <G clipPath={`url(#${clip})`}>
        {relation === 'friend' ? (
          <>
            <Person look={{ bg: '', shirt: '#F59E0B', hair: '#2B2118', style: 'short' }} x={22} scale={0.78} />
            <Person look={{ bg: '', shirt: '#10B981', hair: '#1F1A17', style: 'long' }} x={42} scale={0.78} />
          </>
        ) : (
          <Person look={look} />
        )}
      </G>
    </Svg>
  );
}
