'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { BookOpen } from 'lucide-react';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      if (session.user.role === 'teacher') {
        router.replace('/dashboard/teacher');
      } else {
        router.replace('/dashboard/student');
      }
    } else if (status === 'unauthenticated') {
      router.replace('/auth/signin');
    }
  }, [session, status, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="bg-blue-600 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <BookOpen className="h-8 w-8 text-white" />
        </div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}
