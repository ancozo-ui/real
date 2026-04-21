'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_LINKS = [
  { href: '/listings', label: '매물 목록' },
  { href: '/news', label: '뉴스' },
]

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link
            href="/"
            className="text-xl font-bold text-blue-700 tracking-tight shrink-0"
            onClick={() => setMobileOpen(false)}
          >
            LOGIS
          </Link>

          {/* 데스크톱 내비 */}
          <nav className="hidden sm:flex items-center gap-6">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`text-sm transition-colors ${
                  pathname.startsWith(href)
                    ? 'text-blue-700 font-medium'
                    : 'text-gray-600 hover:text-blue-700'
                }`}
              >
                {label}
              </Link>
            ))}
            <Link
              href="/listings"
              className="text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded-md transition-colors"
            >
              매물 찾기
            </Link>
          </nav>

          {/* 모바일 햄버거 */}
          <button
            className="sm:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label={mobileOpen ? '메뉴 닫기' : '메뉴 열기'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* 모바일 메뉴 */}
      {mobileOpen && (
        <div className="sm:hidden border-t border-gray-100 bg-white">
          <nav className="flex flex-col px-4 py-3 gap-1">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={`text-sm px-3 py-2.5 rounded-lg transition-colors ${
                  pathname.startsWith(href)
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {label}
              </Link>
            ))}
            <Link
              href="/listings"
              onClick={() => setMobileOpen(false)}
              className="mt-2 text-sm font-medium text-center text-white bg-blue-700 hover:bg-blue-800 px-4 py-2.5 rounded-md transition-colors"
            >
              매물 찾기
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
