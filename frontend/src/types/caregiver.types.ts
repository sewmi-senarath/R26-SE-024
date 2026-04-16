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