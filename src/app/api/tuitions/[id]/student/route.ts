import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { updateDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getUserByEmail } from '@/lib/auth-helpers';
import { Tuition } from '@/types';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'teacher') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const body = await request.json();
    const { studentEmail } = body;

    if (!studentEmail) {
      return NextResponse.json(
        { success: false, message: 'Student email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(studentEmail)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if tuition exists and user is the teacher
    const tuitionRef = doc(db, 'tuitions', resolvedParams.id);
    const tuitionDoc = await getDoc(tuitionRef);
    
    if (!tuitionDoc.exists()) {
      return NextResponse.json(
        { success: false, message: 'Tuition not found' },
        { status: 404 }
      );
    }

    const tuition = tuitionDoc.data() as Tuition;
    if (tuition.teacherId !== session.user.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - not your tuition' },
        { status: 403 }
      );
    }

    // Find student by email
    const student = await getUserByEmail(studentEmail);
    if (!student) {
      return NextResponse.json(
        { success: false, message: 'Student not found with this email' },
        { status: 404 }
      );
    }

    if (student.role !== 'student') {
      return NextResponse.json(
        { success: false, message: 'User is not a student' },
        { status: 400 }
      );
    }

    // Update tuition with student information
    await updateDoc(tuitionRef, {
      studentId: student.uid,
      studentName: student.name,
      studentEmail: student.email,
      updatedAt: new Date(),
    });

    // Update student's linkedTuitions
    const studentRef = doc(db, 'users', student.uid);
    const studentDoc = await getDoc(studentRef);
    
    if (studentDoc.exists()) {
      const studentData = studentDoc.data();
      const linkedTuitions = studentData.linkedTuitions || [];
      
      if (!linkedTuitions.includes(resolvedParams.id)) {
        linkedTuitions.push(resolvedParams.id);
        await updateDoc(studentRef, {
          linkedTuitions,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Student added successfully',
      student: {
        id: student.uid,
        name: student.name,
        email: student.email,
      },
    });
  } catch (error) {
    console.error('Add student API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
