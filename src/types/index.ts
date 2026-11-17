import type { Timestamp } from 'firebase-admin/firestore';

export interface User {
  uid: string;
  email: string;
  role: 'teacher' | 'student';
  name: string;
  createdAt: Timestamp | Date;
  emailVerified: boolean;
  // OTP fields (the code itself is stored only as an HMAC in otpHash)
  otpHash?: string | null;
  otpCode?: string | null; // legacy plaintext code; always cleared now
  otpExpiry?: Timestamp | Date | null;
  otpAttempts?: number | null; // failed attempts for the current code
  otpLastSentAt?: Timestamp | Date;
  otpSendCount?: number; // codes sent in the current one-hour window
  otpSendWindowStart?: Timestamp | Date;
  // Legacy email verification fields (for migration)
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
  currentMonthYear: string; // Format: "YYYY-MM" — label of the current (open) month
  takenClasses: number;
  /** Id of the current open month. Missing on tuitions created before month history existed ("legacy"). */
  cycleId?: string;
  /** When the current open month started. Missing on legacy tuitions (use the 1st of currentMonthYear). */
  cycleStartedAt?: Timestamp | Date | string;
  /** Class days, 0 = Sunday … 6 = Saturday. Missing on legacy tuitions (only daysPerWeek is known). */
  weekdays?: number[];
  /** Monthly fee in BDT. null/missing = not set. */
  feeAmount?: number | null;
  /** Payment for the current open month. */
  currentPayment?: Payment | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/** Fee payment status for one month. */
export interface Payment {
  paid: boolean;
  amount: number | null;
  paidAt?: Timestamp | Date | string | null;
  /** Receipt number shown on the payment slip, set when marked paid. */
  slipNo?: string | null;
  markedBy?: string | null;
}

/** A closed month, saved when the teacher closes the month. Stored at tuitions/{id}/months/{cycleId}. */
export interface MonthRecord {
  id: string; // = the closed cycleId
  tuitionId: string;
  monthYear: string; // "YYYY-MM" label of the closed month
  plannedClasses: number;
  takenClasses: number;
  classDates: (Timestamp | Date | string)[];
  closedAt: Timestamp | Date | string;
  closedBy: string;
  closedByName: string;
  payment?: Payment | null;
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
  /** Month this log belongs to. Missing on logs from before month history ("legacy"). */
  cycleId?: string;
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

export interface Homework {
  id: string;
  tuitionId: string;
  teacherId: string;
  teacherName: string;
  studentId: string;
  studentName: string;
  subject: string;
  chapter: string;
  topic: string;
  dueDate: Timestamp | Date;
  notes?: string;
  status: 'assigned' | 'completed';
  feedback?: string;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  completedAt?: Timestamp | Date;
}

export interface HomeworkComment {
  id: string;
  homeworkId: string;
  userId: string;
  userName: string;
  userRole: 'teacher' | 'student';
  comment: string;
  createdAt: Timestamp | Date;
}
