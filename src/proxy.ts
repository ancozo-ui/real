import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Next.js 16 proxy 함수 — middleware.ts 대신 src/proxy.ts가 사용됨
export async function proxy(request: NextRequest) {
  const session = await auth()
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    if (!session) {
      const loginUrl = new URL('/admin/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  if (pathname === '/admin/login' && session) {
    return NextResponse.redirect(new URL('/admin/listings', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}

// 서버 컴포넌트용 유틸리티
export async function requireAuth() {
  const session = await auth()
  if (!session) redirect('/admin/login')
  return session
}

export async function redirectIfAuthenticated(destination = '/admin/listings') {
  const session = await auth()
  if (session) redirect(destination)
}
