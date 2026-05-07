import { Ionicons } from '@expo/vector-icons';

export type PatientTabRouteName =
  | 'activity-selector'
  | 'memory/index'
  | 'games/index'
  | 'profile/index';

export type PatientTabConfig = {
  name: PatientTabRouteName;
  title: string;
  activeIcon: keyof typeof Ionicons.glyphMap;
  inactiveIcon: keyof typeof Ionicons.glyphMap;
};

export const PATIENT_TABS: PatientTabConfig[] = [
  {
    name: 'activity-selector',
    title: 'Activities',
    activeIcon: 'grid',
    inactiveIcon: 'grid-outline',
  },
  {
    name: 'memory/index',
    title: 'Memory',
    activeIcon: 'images',
    inactiveIcon: 'images-outline',
  },
  {
    name: 'games/index',
    title: 'Games',
    activeIcon: 'game-controller',
    inactiveIcon: 'game-controller-outline',
  },
  {
    name: 'profile/index',
    title: 'Profile',
    activeIcon: 'person-circle',
    inactiveIcon: 'person-circle-outline',
  },
];
