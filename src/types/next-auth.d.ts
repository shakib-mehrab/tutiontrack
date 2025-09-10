import { DefaultSession, DefaultUser } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: 'teacher' | 'student';
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    role: 'teacher' | 'student';
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: 'teacher' | 'student';
  }
}
