import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getClassLogs } from '@/lib/tuition-helpers';

// Helper function to convert Firestore Timestamps to serializable format
function serializeTimestamps(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  
  // Check if it's a Firestore Timestamp object
  if (typeof obj === 'object' && obj !== null) {
    const timestampObj = obj as Record<string, unknown>;
    if (timestampObj._seconds !== undefined || (timestampObj.seconds !== undefined && timestampObj.nanoseconds !== undefined)) {
      // This is a Firestore Timestamp
      const seconds = (timestampObj._seconds || timestampObj.seconds) as number;
      return new Date(seconds * 1000).toISOString();
    }
  }
  
  if (obj instanceof Date) {
    return obj.toISOString();
  }
  
  if (Array.isArray(obj)) {
    return obj.map(serializeTimestamps);
  }
  
  if (typeof obj === 'object') {
    const serialized: Record<string, unknown> = {};
    for (const key in obj) {
      serialized[key] = serializeTimestamps((obj as Record<string, unknown>)[key]);
    }
    return serialized;
  }
  
  return obj;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const logs = await getClassLogs(resolvedParams.id);

    // Serialize timestamps before sending response
    const serializedData = serializeTimestamps({ success: true, logs });

    return NextResponse.json(serializedData);
  } catch (error) {
    console.error('Get class logs API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
