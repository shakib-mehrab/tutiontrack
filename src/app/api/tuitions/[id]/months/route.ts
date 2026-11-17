import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getTuitionForUser } from '@/lib/access';
import { serializeTimestamps } from '@/lib/serialize';
import { closeMonth, getMonthHistory } from '@/lib/tuition-helpers';

type Ctx = { params: Promise<{ id: string }> };

/** Closed months for a tuition (teacher or student), newest first. */
export async function GET(_request: NextRequest, { params }: Ctx) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const access = await getTuitionForUser(id, session.user.id);
    if (!access.ok) {
      return NextResponse.json({ success: false, message: access.message }, { status: access.status });
    }

    const months = await getMonthHistory(id);
    return NextResponse.json(serializeTimestamps({ success: true, months }));
  } catch (error) {
    console.error('Get month history API error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

/** Closes the current month (owning teacher only). */
export async function POST(_request: NextRequest, { params }: Ctx) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'teacher') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const access = await getTuitionForUser(id, session.user.id, { teacherOnly: true });
    if (!access.ok) {
      return NextResponse.json({ success: false, message: access.message }, { status: access.status });
    }

    const result = await closeMonth(access.tuition, session.user.id, session.user.name ?? 'Teacher');
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (error) {
    console.error('Close month API error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
