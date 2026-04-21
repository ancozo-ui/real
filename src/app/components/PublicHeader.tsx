import Link from 'next/link'

export default function PublicHeader() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-xl font-bold text-blue-700 tracking-tight">
            LOGIS
          </Link>
          <nav className="flex items-center gap-8">
            <Link href="/listings" className="text-sm text-gray-600 hover:text-blue-700 transition-colors">
              매물 목록
            </Link>
            <Link href="/news" className="text-sm text-gray-600 hover:text-blue-700 transition-colors">
              뉴스
            </Link>
            <Link
              href="/listings"
              className="text-sm bg-blue-700 text-white px-4 py-2 rounded-md hover:bg-blue-800 transition-colors"
            >
              매물 찾기
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}
