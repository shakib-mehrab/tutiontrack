import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getTuitionForUser } from '@/lib/access';
import { updateClassCount, closeMonth } from '@/lib/tuition-helpers';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'teacher') {
      return NextResponse.json(
        { success: false, message: 'Access denied. Only teachers can modify class counts.' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Only the teacher who owns this tuition may change it.
    const access = await getTuitionForUser(id, session.user.id, { teacherOnly: true });
    if (!access.ok) {
      return NextResponse.json({ success: false, message: access.message }, { status: access.status });
    }

    const body = await request.json();
    const { action, classDate } = body;
    const note = typeof body.note === 'string' ? body.note.trim().slice(0, 200) : undefined;

    if (!['increment', 'decrement', 'reset'].includes(action)) {
      return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
    }

    let date: Date | undefined;
    if (classDate) {
      date = new Date(classDate);
      if (Number.isNaN(date.getTime())) {
        return NextResponse.json({ success: false, message: 'Invalid class date' }, { status: 400 });
      }
    }

    // 'reset' is kept for the current UI; it now closes the month instead of deleting history.
    const result =
      action === 'reset'
        ? await closeMonth(access.tuition, session.user.id, session.user.name ?? 'Teacher')
        : await updateClassCount(id, action, session.user.id, session.user.name ?? 'Teacher', date, note);

    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (error) {
    console.error('Update class count API error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
