import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getTuitionForUser } from '@/lib/access';
import { serializeTimestamps } from '@/lib/serialize';
import { firstIssue, paymentSchema } from '@/lib/schemas';
import { setPayment } from '@/lib/tuition-helpers';

/** Marks a month's fee paid/unpaid. Body: { month: 'current' | <month id>, paid, amount? }. Owning teacher only. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'teacher') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const parsed = paymentSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: firstIssue(parsed.error) }, { status: 400 });
    }

    const { id } = await params;
    const access = await getTuitionForUser(id, session.user.id, { teacherOnly: true });
    if (!access.ok) {
      return NextResponse.json({ success: false, message: access.message }, { status: access.status });
    }

    const { month, paid, amount } = parsed.data;
    const result = await setPayment(access.tuition, month, paid, amount ?? null, session.user.id);
    return NextResponse.json(serializeTimestamps(result), { status: result.success ? 200 : 404 });
  } catch (error) {
    console.error('Payment API error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
