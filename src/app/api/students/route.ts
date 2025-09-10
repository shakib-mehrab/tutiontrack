import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { registerUser } from '@/lib/auth-helpers';

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
    const { email, name } = body;

    if (!email || !name) {
      return NextResponse.json(
        { success: false, message: 'Email and name are required' },
        { status: 400 }
      );
    }

    // Generate a temporary password (in a real app, you'd want to send this via email)
    const tempPassword = Math.random().toString(36).slice(-8);

    const result = await registerUser({ 
      email, 
      name, 
      password: tempPassword, 
      role: 'student' 
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Student added successfully',
        tempPassword, // In production, this should be sent via email
        uid: result.uid
      });
    } else {
      return NextResponse.json({ success: false, message: result.message }, { status: 400 });
    }
  } catch (error) {
    console.error('Add student API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
