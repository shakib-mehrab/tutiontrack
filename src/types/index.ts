import { Timestamp } from 'firebase/firestore';

export interface User {
  uid: string;
  email: string;
  role: 'teacher' | 'student';
  name: string;
  createdAt: Timestamp | Date;
  emailVerified: boolean;
  verificationToken?: string;
  verificationTokenExpiry?: Timestamp | Date;
  linkedTuitions?: string[]; // Array of tuition IDs
}

export interface Tuition {
  id: string;
  teacherId: string;
  teacherName: string;
  studentId: string | null;
  studentName: string | null;
  studentEmail: string | null;
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
  date: Timestamp; // When the log entry was created
  actionType: 'increment' | 'decrement' | 'manual';
  addedBy: string; // User ID who made the change
  addedByName: string;
  description?: string;
  classDate?: Timestamp; // The actual date when the class happened (for increment actions)
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
