import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    // Legacy token-based verification is no longer supported
    if (token) {
      return NextResponse.json(
        { success: false, message: 'Token-based verification is deprecated. Please use OTP verification instead.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Please use OTP verification instead.' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Verification API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
