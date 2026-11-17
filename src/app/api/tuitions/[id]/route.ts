import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { FieldValue } from 'firebase-admin/firestore';
import { authOptions } from '@/lib/auth';
import { getAdminDb } from '@/lib/firebase-admin';
import { getTuitionForUser } from '@/lib/access';
import { serializeTimestamps } from '@/lib/serialize';
import { firstIssue, updateTuitionSchema } from '@/lib/schemas';
import { getClassLogs, getClassDates, deleteTuition } from '@/lib/tuition-helpers';

type Ctx = { params: Promise<{ id: string }> };

const unauthorized = () => NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

/** Tuition with the current month's activity log and class dates. */
export async function GET(_request: NextRequest, { params }: Ctx) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return unauthorized();

    const { id } = await params;
    const access = await getTuitionForUser(id, session.user.id);
    if (!access.ok) {
      return NextResponse.json({ success: false, message: access.message }, { status: access.status });
    }

    const [logs, classDates] = await Promise.all([getClassLogs(access.tuition), getClassDates(access.tuition)]);

    return NextResponse.json(serializeTimestamps({ success: true, tuition: access.tuition, logs, classDates }));
  } catch (error) {
    console.error('Get tuition API error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Ctx) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'teacher') return unauthorized();

    const { id } = await params;
    const access = await getTuitionForUser(id, session.user.id, { teacherOnly: true });
    if (!access.ok) {
      return NextResponse.json({ success: false, message: access.message }, { status: access.status });
    }

    const result = await deleteTuition(id);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (error) {
    console.error('Delete tuition API error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

/** Edits a tuition: subject, student name, schedule, planned classes, fee. */
export async function PATCH(request: NextRequest, { params }: Ctx) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'teacher') return unauthorized();

    const { id } = await params;
    const parsed = updateTuitionSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: firstIssue(parsed.error) }, { status: 400 });
    }

    const access = await getTuitionForUser(id, session.user.id, { teacherOnly: true });
    if (!access.ok) {
      return NextResponse.json({ success: false, message: access.message }, { status: access.status });
    }

    const changes: Record<string, unknown> = { ...parsed.data, updatedAt: FieldValue.serverTimestamp() };
    if (parsed.data.weekdays) changes.daysPerWeek = parsed.data.weekdays.length;
    // A new fee applies to the open month too, unless that month is already paid.
    if (parsed.data.feeAmount !== undefined && !access.tuition.currentPayment?.paid) {
      changes.currentPayment = { ...(access.tuition.currentPayment ?? { paid: false }), amount: parsed.data.feeAmount };
    }

    await getAdminDb().collection('tuitions').doc(id).update(changes);

    return NextResponse.json({ success: true, message: 'Tuition updated' });
  } catch (error) {
    console.error('Update tuition API error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
