import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    parentId?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    parentId?: string;
  }
}
