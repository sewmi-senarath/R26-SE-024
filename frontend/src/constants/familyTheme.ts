// Family portal design tokens — additive only, never changes colors.ts's
// existing values (Colors.background/border/etc. are used across the
// caregiver module and elsewhere; confirmed via repo-wide grep before this
// file was created). These tokens exist so the family module's "clean &
// minimal SaaS" visual pass has one shared source instead of the same
// shadow/radius/spacing recipes copy-pasted inline 15-20+ times.
import { Colors } from './colors';

export const FamilyColors = {
  // true neutral SaaS canvas — replaces Colors.background (#F0F4FF, blue-tinted)
  // *locally, in family screens only*; Colors.background itself is untouched.
  canvas: '#F7F8FA',
  canvasAlt: '#F3F4F6',

  // single accent decision: blue drives all shared chrome (headers, tab bar,
  // primary CTAs). Purple/orange are kept as feature-scoped identity colors
  // (Stories / Calendar respectively), not introduced anywhere else.
  accent: Colors.primary,
  accentSoft: Colors.primaryLight,
  accentStrong: Colors.primaryDark,
  storiesColor: Colors.purple,
  storiesColorSoft: Colors.purpleSoft,
  calendarColor: Colors.accent,
  calendarColorSoft: Colors.accentSoft,

  // dark-slate palette for SmartAlertCard + more.tsx's "Session Summary" panel
  slate900: '#0F172A',
  slate800: '#1E293B',
  slate700: '#334155',
  slate600: '#475569',
  slate500: '#64748B',
  slate400: '#94A3B8',
  slate300: '#CBD5E1',
  slate50: '#F8FAFC',
  slateBorder: '#1E3A5F',

  // formalized alpha-blend steps — replaces ad-hoc Color + '15'/'30'/'60'/'70'/'80'
  alpha: { faint: '1A', soft: '26', medium: '4D', strong: '80' },
};

export const FamilyShadow = {
  header: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 5,
  },
};

export const FamilyRadius = { sm: 12, md: 16, lg: 20, xl: 24, pill: 999 };
export const FamilySpacing = { screenPadding: 20, cardPadding: 18, sectionGap: 20, itemGap: 10 };
