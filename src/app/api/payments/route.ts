import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { serializeTimestamps } from '@/lib/serialize';
import { getMonthHistory, getTuitionsByStudent, getTuitionsByTeacher } from '@/lib/tuition-helpers';

/** Every tuition of the user with its closed months (newest first), for the Payments screen. */
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
    const months = await Promise.all(tuitions.map((t) => getMonthHistory(t.id)));

    return NextResponse.json(
      serializeTimestamps({
        success: true,
        items: tuitions.map((tuition, i) => ({ tuition, months: months[i] })),
      })
    );
  } catch (error) {
    console.error('Payments API error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
