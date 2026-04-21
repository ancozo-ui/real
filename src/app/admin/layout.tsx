import { auth } from '@/auth'
import { signOut } from '@/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'

async function LogoutButton() {
  return (
    <form
      action={async () => {
        'use server'
        await signOut({ redirectTo: '/admin/login' })
      }}
    >
      <button
        type="submit"
        className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white rounded"
      >
        로그아웃
      </button>
    </form>
  )
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect('/admin/login')
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* 사이드바 */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col shrink-0">
        <div className="px-6 py-5 border-b border-gray-700">
          <Link href="/admin/listings" className="text-xl font-bold text-white">
            LOGIS 관리자
          </Link>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          <Link
            href="/admin/listings"
            className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white rounded"
          >
            매물 관리
          </Link>
          <Link
            href="/admin/inquiries"
            className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white rounded"
          >
            문의 관리
          </Link>
          <Link
            href="/admin/news"
            className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white rounded"
          >
            뉴스 관리
          </Link>
        </nav>
        <div className="px-3 py-4 border-t border-gray-700">
          <LogoutButton />
        </div>
      </aside>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
