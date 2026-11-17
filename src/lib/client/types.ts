// Shapes of API responses as the browser receives them (timestamps are ISO strings).
import type { Payment } from '@/types';

export type ISO = string;

export interface TuitionDTO {
  id: string;
  teacherId: string;
  teacherName: string;
  studentId: string | null;
  studentName: string | null;
  studentEmail: string | null;
  subject: string;
  startTime: string;
  endTime: string;
  daysPerWeek: number;
  weekdays?: number[];
  plannedClassesPerMonth: number;
  currentMonthYear: string;
  takenClasses: number;
  cycleId?: string;
  cycleStartedAt?: ISO;
  feeAmount?: number | null;
  currentPayment?: PaymentDTO | null;
  createdAt: ISO;
  updatedAt: ISO;
}

export type PaymentDTO = Omit<Payment, 'paidAt'> & { paidAt?: ISO | null };

export interface ClassLogDTO {
  id: string;
  tuitionId: string;
  actionType: 'increment' | 'decrement' | 'manual';
  addedBy: string;
  addedByName: string;
  classDate?: ISO;
  createdAt: ISO;
  cycleId?: string;
}

export interface MonthRecordDTO {
  id: string;
  tuitionId: string;
  monthYear: string;
  plannedClasses: number;
  takenClasses: number;
  classDates: ISO[];
  closedAt: ISO;
  closedBy: string;
  closedByName: string;
  payment?: PaymentDTO | null;
}

export interface HomeworkDTO {
  id: string;
  tuitionId: string;
  teacherId: string;
  teacherName: string;
  studentId: string;
  studentName: string;
  subject: string;
  chapter: string;
  topic: string;
  dueDate: ISO;
  notes?: string;
  status: 'assigned' | 'completed';
  feedback?: string;
  createdAt: ISO;
  updatedAt: ISO;
  completedAt?: ISO;
}

export interface CommentDTO {
  id: string;
  homeworkId: string;
  userId: string;
  userName: string;
  userRole: 'teacher' | 'student';
  comment: string;
  createdAt: ISO;
}

export interface TuitionsResponse {
  success: boolean;
  tuitions: TuitionDTO[];
  classDates: Record<string, ISO[]>;
}

export interface TuitionDetailResponse {
  success: boolean;
  tuition: TuitionDTO;
  logs: ClassLogDTO[];
  classDates: ClassLogDTO[];
}

export interface PaymentsResponse {
  success: boolean;
  items: { tuition: TuitionDTO; months: MonthRecordDTO[] }[];
}
