import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string;
      organizationId: string;
      organization: string;
    } & DefaultSession['user'];
  }

  interface User {
    role: string;
    organizationId: string;
    organization: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: string;
    organizationId: string;
    organization: string;
  }
}