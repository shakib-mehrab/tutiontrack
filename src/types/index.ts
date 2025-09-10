import { Timestamp } from 'firebase/firestore';

export interface User {
  uid: string;
  email: string;
  role: 'teacher' | 'student';
  name: string;
  createdAt: Timestamp;
  emailVerified: boolean;
  linkedTuitions?: string[]; // Array of tuition IDs
}

export interface Tuition {
  id: string;
  teacherId: string;
  teacherName: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  subject: string;
  startTime: string; // Format: "HH:mm"
  endTime: string; // Format: "HH:mm"
  daysPerWeek: number;
  plannedClassesPerMonth: number;
  currentMonthYear: string; // Format: "YYYY-MM"
  takenClasses: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ClassLog {
  id: string;
  tuitionId: string;
  date: Timestamp;
  actionType: 'increment' | 'decrement' | 'manual';
  addedBy: string; // User ID who made the change
  addedByName: string;
  description?: string;
  createdAt: Timestamp;
}

export interface DashboardStats {
  totalStudents: number;
  totalTuitions: number;
  totalClassesToday: number;
  monthlyProgress: number;
}

export interface TuitionProgress {
  tuitionId: string;
  progress: number;
  classesCompleted: number;
  totalPlanned: number;
}
