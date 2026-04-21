import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const session = await auth()
  const { pathname } = request.nextUrl

  // /admin 하위 경로 (login 제외) 보호
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    if (!session) {
      const loginUrl = new URL('/admin/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // 이미 로그인한 상태에서 /admin/login 접근 시 리다이렉트
  if (pathname === '/admin/login' && session) {
    return NextResponse.redirect(new URL('/admin/listings', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
