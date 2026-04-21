import NextAuth, { type DefaultSession } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { z } from 'zod'

declare module 'next-auth' {
  interface User {
    role?: string
  }
  interface Session {
    user: { role?: string } & DefaultSession['user']
  }
}

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials)
        if (!parsed.success) return null

        const { email, password } = parsed.data

        if (
          email === process.env.ADMIN_EMAIL &&
          password === process.env.ADMIN_PASSWORD
        ) {
          return {
            id: 'admin',
            email: process.env.ADMIN_EMAIL,
            name: '관리자',
            role: 'ADMIN',
          }
        }
        return null
      },
    }),
  ],
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/admin/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.role = user.role
      return token
    },
    async session({ session, token }) {
      if (session.user) session.user.role = token.role as string | undefined
      return session
    },
  },
})
