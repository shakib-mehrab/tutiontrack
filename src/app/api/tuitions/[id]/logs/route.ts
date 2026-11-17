import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getTuitionForUser } from '@/lib/access';
import { serializeTimestamps } from '@/lib/serialize';
import { getClassLogs } from '@/lib/tuition-helpers';

/**
 * Activity log for a tuition. Defaults to the current month;
 * pass ?cycle=<month record id> to get a closed month's log.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const cycle = request.nextUrl.searchParams.get('cycle') ?? undefined;
    const logs = await getClassLogs(access.tuition, cycle);

    return NextResponse.json(serializeTimestamps({ success: true, logs }));
  } catch (error) {
    console.error('Get class logs API error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
