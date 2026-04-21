import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import Header from '@/app/components/layout/Header'
import Footer from '@/app/components/layout/Footer'
import ListingCard from '@/app/components/ListingCard'
import { FACILITY_LABELS } from '@/app/components/ListingCard'

const FACILITY_SHORTCUTS = [
  { value: 'WAREHOUSE', emoji: '🏭' },
  { value: 'LOGISTICS', emoji: '📦' },
  { value: 'COLD_CHAIN', emoji: '❄️' },
  { value: 'FULFILLMENT', emoji: '🚚' },
  { value: 'FACTORY', emoji: '🏗️' },
]

export default async function HomePage() {
  const [listings, news] = await Promise.all([
    prisma.listing.findMany({
      where: { status: 'PUBLISHED' },
      select: {
        id: true,
        addressMasked: true,
        facilityType: true,
        totalAreaSqm: true,
        totalAreaPyeong: true,
        rentAreaSqm: true,
        rentAreaPyeong: true,
        monthlyRent: true,
        deposit: true,
        hasDock: true,
        hasOffice: true,
        status: true,
        images: {
          select: { url: true, order: true },
          orderBy: { order: 'asc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 6,
    }),
    prisma.newsPost.findMany({
      select: { id: true, title: true, excerpt: true, publishedAt: true, slug: true },
      orderBy: { publishedAt: 'desc' },
      take: 3,
    }),
  ])

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      {/* 히어로 */}
      <section className="bg-gray-900 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
            신뢰할 수 있는<br />물류창고 임대 정보
          </h1>
          <p className="mt-4 text-lg text-gray-300">
            전국 물류창고·공장·냉동창고 임대 매물을 한곳에서
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/listings"
              className="inline-block px-8 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold text-sm transition-colors"
            >
              전체 매물 보기
            </Link>
            <Link
              href="/listings?facilityType=WAREHOUSE"
              className="inline-block px-8 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-semibold text-sm transition-colors"
            >
              창고 찾기
            </Link>
          </div>
        </div>
      </section>

      {/* 시설 유형 빠른 접근 */}
      <section className="bg-gray-50 border-b border-gray-200 py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-hide">
            <span className="text-sm text-gray-500 whitespace-nowrap shrink-0">유형별 검색:</span>
            {FACILITY_SHORTCUTS.map(({ value, emoji }) => (
              <Link
                key={value}
                href={`/listings?facilityType=${value}`}
                className="flex items-center gap-1.5 text-sm text-gray-700 bg-white border border-gray-200 rounded-full px-4 py-1.5 hover:border-blue-400 hover:text-blue-600 whitespace-nowrap shrink-0 transition-colors"
              >
                <span>{emoji}</span>
                <span>{FACILITY_LABELS[value]}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 최신 매물 */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">최신 매물</h2>
          <Link href="/listings" className="text-sm text-blue-600 hover:underline">
            전체 보기 →
          </Link>
        </div>
        {listings.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg">등록된 매물이 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </section>

      {/* 뉴스 미리보기 */}
      {news.length > 0 && (
        <section className="bg-gray-50 border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">물류 뉴스</h2>
              <Link href="/news" className="text-sm text-blue-600 hover:underline">
                전체 보기 →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {news.map((post) => (
                <Link
                  key={post.id}
                  href={`/news/${post.slug}`}
                  className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow"
                >
                  <p className="text-xs text-gray-400 mb-2">
                    {new Date(post.publishedAt).toLocaleDateString('ko-KR')}
                  </p>
                  <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug">
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p className="mt-2 text-xs text-gray-500 line-clamp-2">{post.excerpt}</p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  )
}
