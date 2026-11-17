import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { serializeTimestamps } from '@/lib/serialize';
import { createTuitionSchema, firstIssue } from '@/lib/schemas';
import {
  createTuition,
  getCurrentClassDatesFor,
  getTuitionsByTeacher,
  getTuitionsByStudent,
  monthKey,
} from '@/lib/tuition-helpers';
import { getUserByEmail } from '@/lib/auth-helpers';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'teacher') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const parsed = createTuitionSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: firstIssue(parsed.error) }, { status: 400 });
    }
    const { studentEmail, studentName, subject, startTime, endTime, weekdays, plannedClassesPerMonth, feeAmount } =
      parsed.data;

    let student = null;
    if (studentEmail) {
      student = await getUserByEmail(studentEmail);
      if (!student) {
        return NextResponse.json(
          { success: false, message: 'No account with that email. Leave it empty and add the student name instead.' },
          { status: 404 }
        );
      }
      if (student.role !== 'student') {
        return NextResponse.json({ success: false, message: 'That account is not a student account' }, { status: 400 });
      }
    }

    if (!student && !studentName) {
      return NextResponse.json({ success: false, message: 'Add the student’s name or email' }, { status: 400 });
    }

    const result = await createTuition({
      teacherId: session.user.id,
      teacherName: session.user.name ?? 'Teacher',
      studentId: student?.uid || null,
      studentName: student?.name || studentName || null,
      studentEmail: student?.email || null,
      subject,
      startTime,
      endTime,
      weekdays,
      daysPerWeek: weekdays.length,
      plannedClassesPerMonth,
      feeAmount: feeAmount ?? null,
      currentMonthYear: monthKey(),
      takenClasses: 0,
    });

    return NextResponse.json(result, { status: result.success ? 201 : 400 });
  } catch (error) {
    console.error('Create tuition API error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

/** The user's tuitions, each with this month's class dates (for "today" and "missed"). */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const tuitions =
      session.user.role === 'teacher'
        ? await getTuitionsByTeacher(session.user.id)
        : await getTuitionsByStudent(session.user.id);
    const classDates = await getCurrentClassDatesFor(tuitions);

    return NextResponse.json(serializeTimestamps({ success: true, tuitions, classDates }));
  } catch (error) {
    console.error('Get tuitions API error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
