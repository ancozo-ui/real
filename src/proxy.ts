import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export const config = {
  protectedRoutes: ['/admin'],
  publicRoutes: ['/admin/login'],
}

export async function requireAuth() {
  const session = await auth()
  if (!session) redirect('/admin/login')
  return session
}

export async function redirectIfAuthenticated(destination = '/admin/listings') {
  const session = await auth()
  if (session) redirect(destination)
}
