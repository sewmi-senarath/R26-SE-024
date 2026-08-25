export interface Patient {
  id: string;
  name: string;
  initials: string;
  condition: 'Moderate' | 'Mild' | 'Critical' | 'Stable';
  avatarColor: string;
  emoji: string;
  lastChecked: string;
}

export interface Task {
  id: string;
  title: string;
  patientName: string;
  time: string;
  icon: string;
  completed: boolean;
  assignee?: string;
}

export interface DashboardStats {
  patients: number;
  tasks: { completed: number; total: number };
  meds: number;
  alerts: number;
}

export interface CaregiverInsight {
  score: number;
  level: 'Low' | 'Moderate' | 'High';
  message: string;
}


export interface Routine {
  id: string;
  title: string;
  time: string;
  completed: boolean;
}

export interface PatientDetail extends Patient {
  age: number;
  stage: string;
  condition_notes: string;
  condition_description: string;
  routines: Routine[];
  /**
   * The linked registered patient's User account id, if this caregiver-side
   * patient has been connected to a real patient account. Cognitive data
   * (assessments, games, severity) is keyed on this id — NOT on `id`, which is
   * the caregiver-side Patient document id. Null when no account is linked.
   */
  registeredPatientId?: string | null;
}


export type TaskStatus = 'todo' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskFilter = 'all' | 'todo' | 'done';

export interface CaregiverTask {
  id: string;
  title: string;
  patientName: string;
  patientInitials: string;
  patientColor: string;
  time: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: string;
  category: 'bathing' | 'feeding' | 'exercise' | 'medication' | 'outdoor' | 'other';
}
export type StressLevel = 'Low' | 'Moderate' | 'High' | 'Critical';
export type MoodType = 'awful' | 'bad' | 'okay' | 'good' | 'great';

export interface WellbeingStats {
  avgSleep: number;
  activeHours: number;
  tasksCompleted: number;
  breaksTaken: number;
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  bgColor: string;
  urgent: boolean;
}

export interface WeeklyData {
  day: string;
  stress: number;
  tasks: number;
}

export interface MenuItem {
  id: string;
  label: string;
  icon: string;
  iconColor: string;
  iconBg: string;
  badge?: number;
  badgeColor?: string;
  route?: string;
}

export interface MenuSection {
  title: string;
  items: MenuItem[];
}

export interface CaregiverProfile {
  name: string;
  role: string;
  email: string;
  initials: string;
  avatarColor: string;
  isOnline: boolean;
  shiftsCompleted: number;
  patientsAssigned: number;
  hoursThisWeek: number;
}

export type MedicationStatus = 'taken' | 'pending' | 'missed';
export type MedicationTime = 'all' | 'morning' | 'afternoon' | 'evening';

export interface Medication {
  id: string;
  name: string;
  dose: string;
  form: string;
  patientName: string;
  patientInitials: string;
  patientColor: string;
  time: string;
  timeSlot: 'morning' | 'afternoon' | 'evening';
  status: MedicationStatus;
  streak: number;
}

// ── Notifications ─────────────────────────────────────────
export type NotificationSeverity = 'urgent' | 'warning' | 'info';

export interface AppNotification {
  id: string;
  patientName: string;
  message: string;
  time: string;
  severity: NotificationSeverity;
  acknowledged: boolean;
  hasAction?: boolean;
  actionLabel?: string;
}

// ── Reports ───────────────────────────────────────────────
export type ReportTimeframe = 'daily' | 'weekly' | 'monthly';
export type ReportType =
  | 'Comprehensive Care Summary'
  | 'Medication Adherence'
  | 'Task Completion'
  | 'Behavioral Incident Log';

// ── Wellbeing ─────────────────────────────────────────────
export interface WellbeingRecommendation {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  bgColor: string;
  actionLabel: string;
  duration: string;
}
export interface CaregiverProfile {
  name: string;
  role: string;
  email: string;
  initials: string;
  avatarColor: string;
  isOnline: boolean;
  shiftsCompleted: number;
  patientsAssigned: number;
  hoursThisWeek: number;
  profileImage?: string; 
}

// ── Daily Check-in ─────────────────────────────────────────────────────────
export interface DailyCheckIn {
  sleepHours:          number;
  physicalTiredness:   number;
  mood:                number;
  emotionalOverwhelm:  number;
  hoursCaregiving:     number;
  tasksAssigned:       number;
  tasksCompleted:      number;
  difficultSituations: number;
  breaksTaken:         number;
  mentallyExhausted:   number;
  difficultyManaging:  number;
  emotionallyDrained:  number;
}

export interface CheckInResult {
  stressLevel:  'Low' | 'Moderate' | 'High';
  stressScore:  number;
  confidence:   number;
  message:      string;
  tips:         string[];
  submittedAt:  string;
  burnout?:     BurnoutRisk;     // ← add
  weeklyData?:  WeeklyData[];    // ← add
  stats?: {                       // ← add
    avgSleep:       number;
    activeHours:    number;
    tasksCompleted: number;
    breaksTaken:    number;
  };
}

// ── Burnout Risk ───────────────────────────────────────────────────────────
export interface BurnoutFactor {
  factor:      string;
  severity:    'high' | 'moderate' | 'low';
  description: string;
  icon:        string;
}

export interface BurnoutRisk {
  riskScore:        number;
  riskLevel:        'Low' | 'Moderate' | 'High';
  trend:            'worsening' | 'stable' | 'improving';
  forecast:         string;
  factors:          BurnoutFactor[];
  daysAnalyzed:     number;
  avgStressScore?:  number;
  avgSleep?:        number;
  consecutiveHigh?: number;
}