import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createTuition, getTuitionsByTeacher, getTuitionsByStudent } from '@/lib/tuition-helpers';
import { getUserByEmail } from '@/lib/auth-helpers';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'teacher') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { studentEmail, studentName, subject, startTime, endTime, daysPerWeek, plannedClassesPerMonth } = body;

    if (!subject || !startTime || !endTime || !daysPerWeek || !plannedClassesPerMonth) {
      return NextResponse.json(
        { success: false, message: 'Subject, start time, end time, days per week, and planned classes per month are required' },
        { status: 400 }
      );
    }

    let student = null;
    if (studentEmail) {
      // Find student by email if provided
      student = await getUserByEmail(studentEmail);
      if (!student) {
        return NextResponse.json(
          { success: false, message: 'Student not found' },
          { status: 404 }
        );
      }

      if (student.role !== 'student') {
        return NextResponse.json(
          { success: false, message: 'User is not a student' },
          { status: 400 }
        );
      }
    }

    const currentDate = new Date();
    const currentMonthYear = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

    const result = await createTuition({
      teacherId: session.user.id,
      teacherName: session.user.name!,
      studentId: student?.uid || null,
      studentName: student?.name || studentName || null,
      studentEmail: student?.email || null,
      subject,
      startTime,
      endTime,
      daysPerWeek,
      plannedClassesPerMonth,
      currentMonthYear,
      takenClasses: 0,
    });

    return NextResponse.json(result, {
      status: result.success ? 201 : 400,
    });
  } catch (error) {
    console.error('Create tuition API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    let tuitions;
    if (session.user.role === 'teacher') {
      tuitions = await getTuitionsByTeacher(session.user.id);
    } else {
      tuitions = await getTuitionsByStudent(session.user.id);
    }

    return NextResponse.json({ success: true, tuitions });
  } catch (error) {
    console.error('Get tuitions API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
