import Link from 'next/link'

export default function NavBar() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-gray-900 tracking-tight">
          LOGIS
        </Link>
        <nav className="flex items-center gap-6">
          <Link href="/listings" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
            매물 목록
          </Link>
          <Link href="/news" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
            뉴스
          </Link>
          <Link
            href="/listings"
            className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
          >
            매물 찾기
          </Link>
        </nav>
      </div>
    </header>
  )
}
