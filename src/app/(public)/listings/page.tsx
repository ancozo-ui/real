import { Suspense } from 'react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { FacilityType } from '@prisma/client'
import ListingCard from '@/app/components/ListingCard'
import ListingFilter from '@/app/components/ListingFilter'

export const metadata: Metadata = {
  title: '매물 목록',
  description: '전국 물류창고·공장·냉동창고·풀필먼트 센터 임대 매물 목록. 지역·면적·임대료 필터로 원하는 매물을 찾으세요.',
}

const PAGE_SIZE = 20

interface SearchParams {
  sido?: string
  facilityType?: string
  minArea?: string
  maxArea?: string
  maxRent?: string
  hasDock?: string
  hasOffice?: string
  hasCCTV?: string
  hasParking?: string
  sort?: string
  page?: string
}

function buildOrderBy(sort: string | undefined) {
  if (sort === 'rent_asc') return { monthlyRent: 'asc' as const }
  if (sort === 'area_desc') return { totalAreaSqm: 'desc' as const }
  return { createdAt: 'desc' as const }
}

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? '1'))
  const skip = (page - 1) * PAGE_SIZE

  const where = {
    status: 'PUBLISHED' as const,
    ...(params.sido && { addressMasked: { startsWith: params.sido } }),
    ...(params.facilityType && { facilityType: params.facilityType as FacilityType }),
    ...(params.minArea && { totalAreaSqm: { gte: parseFloat(params.minArea) } }),
    ...(params.maxArea && {
      totalAreaSqm: {
        ...(params.minArea ? { gte: parseFloat(params.minArea) } : {}),
        lte: parseFloat(params.maxArea),
      },
    }),
    ...(params.maxRent && { monthlyRent: { lte: parseInt(params.maxRent) } }),
    ...(params.hasDock === 'true' && { hasDock: true }),
    ...(params.hasOffice === 'true' && { hasOffice: true }),
    ...(params.hasCCTV === 'true' && { hasCCTV: true }),
    ...(params.hasParking === 'true' && { hasParking: true }),
  }

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where,
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
      orderBy: buildOrderBy(params.sort),
      skip,
      take: PAGE_SIZE,
    }),
    prisma.listing.count({ where }),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  const buildPageUrl = (p: number) => {
    const sp = new URLSearchParams()
    if (params.sido) sp.set('sido', params.sido)
    if (params.facilityType) sp.set('facilityType', params.facilityType)
    if (params.minArea) sp.set('minArea', params.minArea)
    if (params.maxArea) sp.set('maxArea', params.maxArea)
    if (params.maxRent) sp.set('maxRent', params.maxRent)
    if (params.hasDock) sp.set('hasDock', params.hasDock)
    if (params.hasOffice) sp.set('hasOffice', params.hasOffice)
    if (params.hasCCTV) sp.set('hasCCTV', params.hasCCTV)
    if (params.hasParking) sp.set('hasParking', params.hasParking)
    if (params.sort) sp.set('sort', params.sort)
    if (p > 1) sp.set('page', String(p))
    const qs = sp.toString()
    return `/listings${qs ? `?${qs}` : ''}`
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">매물 목록</h1>
        <p className="text-sm text-gray-500 mt-1">총 {total.toLocaleString()}개 매물</p>
      </div>

      <div className="flex gap-8">
        {/* 필터 사이드바 */}
        <div className="hidden lg:block w-56 shrink-0">
          <Suspense fallback={<div className="h-96 bg-gray-100 rounded-xl animate-pulse" />}>
            <ListingFilter />
          </Suspense>
        </div>

        {/* 매물 그리드 */}
        <div className="flex-1 min-w-0">
          {listings.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>조건에 맞는 매물이 없습니다.</p>
              <Link href="/listings" className="mt-2 inline-block text-sm text-blue-600 hover:underline">
                전체 매물 보기
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {listings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>

              {/* 페이지네이션 */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-10">
                  {page > 1 && (
                    <Link
                      href={buildPageUrl(page - 1)}
                      className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
                    >
                      이전
                    </Link>
                  )}
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                    .reduce<(number | 'ellipsis')[]>((acc, p, idx, arr) => {
                      if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('ellipsis')
                      acc.push(p)
                      return acc
                    }, [])
                    .map((item, idx) =>
                      item === 'ellipsis' ? (
                        <span key={`e-${idx}`} className="px-2 text-gray-400">…</span>
                      ) : (
                        <Link
                          key={item}
                          href={buildPageUrl(item)}
                          className={`px-3 py-1.5 text-sm rounded-lg border ${
                            item === page
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {item}
                        </Link>
                      )
                    )}
                  {page < totalPages && (
                    <Link
                      href={buildPageUrl(page + 1)}
                      className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
                    >
                      다음
                    </Link>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
