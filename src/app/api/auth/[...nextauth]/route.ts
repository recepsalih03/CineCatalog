import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { validateAdminCredentials, hashWithSHA256 } from '@/lib/auth';

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const isValid = await validateAdminCredentials({
          username: credentials.username,
          password: credentials.password
        });

        if (isValid) {
          const secureUserId = hashWithSHA256(`admin-${Date.now()}`);
          return {
            id: secureUserId,
            name: 'Admin',
            email: 'admin@moviecatalog.com',
          };
        }

        return null;
      }
    })
  ],
  pages: {
    signIn: '/admin/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = 'admin';
        token.secureHash = hashWithSHA256(`${user.id}-${token.iat}`);
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.role = token.role as string;
        session.user.secureHash = token.secureHash as string;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };