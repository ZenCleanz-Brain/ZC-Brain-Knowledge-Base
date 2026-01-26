import { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export type UserRole = 'admin' | 'editor' | 'viewer';

export interface User {
  id: string;
  username: string;
  role: UserRole;
}

// Parse users from environment variable
// SIMPLE FORMAT: username:password:role,username2:password2:role2
// Example: admin:admin:admin,editor:pass123:editor
function getUsers(): Map<string, { password: string; role: UserRole }> {
  const usersEnv = process.env.USERS || '';
  const users = new Map<string, { password: string; role: UserRole }>();

  if (!usersEnv) return users;

  usersEnv.split(',').forEach((userStr) => {
    const parts = userStr.trim().split(':');
    if (parts.length === 3) {
      const [username, password, role] = parts;
      users.set(username, { password, role: role as UserRole });
    }
  });

  return users;
}

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const users = getUsers();
        const user = users.get(credentials.username);

        if (!user) {
          console.log('User not found:', credentials.username);
          return null;
        }

        // Simple plain text password comparison
        if (credentials.password !== user.password) {
          console.log('Password mismatch for user:', credentials.username);
          return null;
        }

        console.log('Login successful:', credentials.username, 'role:', user.role);

        return {
          id: credentials.username,
          name: credentials.username,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.sub;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
};

// Helper to check if user has permission
export function hasPermission(role: UserRole, requiredRole: UserRole): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    viewer: 1,
    editor: 2,
    admin: 3,
  };
  return roleHierarchy[role] >= roleHierarchy[requiredRole];
}
