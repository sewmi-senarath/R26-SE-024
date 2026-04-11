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