import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import ImageGallery from '@/app/components/ImageGallery'
import { FACILITY_LABELS } from '@/app/components/ListingCard'
import InquiryForm from './InquiryForm'

const LISTING_SELECT = {
  id: true,
  addressMasked: true,       // addressFull 절대 select 금지
  facilityType: true,
  totalAreaSqm: true,
  totalAreaPyeong: true,
  rentAreaSqm: true,
  rentAreaPyeong: true,
  monthlyRent: true,
  deposit: true,
  maintenanceFee: true,
  ceilingHeight: true,
  floorLoad: true,
  hasDock: true,
  hasOffice: true,
  hasCCTV: true,
  hasParking: true,
  availableFrom: true,
  description: true,
  createdAt: true,
  images: {
    select: { url: true, order: true },
    orderBy: { order: 'asc' as const },
  },
} as const

async function getListing(id: string) {
  return prisma.listing.findFirst({
    where: { id, status: 'PUBLISHED' },
    select: LISTING_SELECT,
  })
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const listing = await getListing(id)
  if (!listing) return { title: '매물 없음 | LOGIS' }

  const facilityLabel = FACILITY_LABELS[listing.facilityType] ?? listing.facilityType
  const areaText = listing.totalAreaSqm ? `${listing.totalAreaSqm.toLocaleString()}㎡` : ''
  const rentText = listing.monthlyRent ? `월 ${listing.monthlyRent.toLocaleString()}만원` : '가격 문의'
  const descParts = [facilityLabel, areaText, rentText].filter(Boolean)

  return {
    title: `${listing.addressMasked} | 물류창고 임대 — LOGIS`,
    description: descParts.join(' · '),
    openGraph: {
      title: `${listing.addressMasked} 물류창고 임대`,
      description: descParts.join(' · '),
      images: listing.images[0] ? [{ url: listing.images[0].url }] : [],
    },
  }
}

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const listing = await getListing(id)

  if (!listing) notFound()

  const facilityLabel = FACILITY_LABELS[listing.facilityType] ?? listing.facilityType

  const detailRows: { label: string; value: string | null }[] = [
    {
      label: '총면적',
      value: listing.totalAreaSqm != null
        ? `${listing.totalAreaSqm.toLocaleString()}㎡${listing.totalAreaPyeong != null ? ` (${listing.totalAreaPyeong.toLocaleString()}평)` : ''}`
        : null,
    },
    {
      label: '임대면적',
      value: listing.rentAreaSqm != null
        ? `${listing.rentAreaSqm.toLocaleString()}㎡${listing.rentAreaPyeong != null ? ` (${listing.rentAreaPyeong.toLocaleString()}평)` : ''}`
        : null,
    },
    {
      label: '월임대료',
      value: listing.monthlyRent != null ? `${listing.monthlyRent.toLocaleString()}만원` : null,
    },
    {
      label: '보증금',
      value: listing.deposit != null ? `${listing.deposit.toLocaleString()}만원` : null,
    },
    {
      label: '관리비',
      value: listing.maintenanceFee != null ? `${listing.maintenanceFee.toLocaleString()}만원` : null,
    },
    {
      label: '천고',
      value: listing.ceilingHeight != null ? `${listing.ceilingHeight}m` : null,
    },
    {
      label: '바닥하중',
      value: listing.floorLoad != null ? `${listing.floorLoad}t/㎡` : null,
    },
    {
      label: '입주가능일',
      value: listing.availableFrom
        ? new Date(listing.availableFrom).toLocaleDateString('ko-KR')
        : '즉시 가능',
    },
  ]

  const features = [
    { label: '도크', enabled: listing.hasDock },
    { label: '사무실', enabled: listing.hasOffice },
    { label: 'CCTV', enabled: listing.hasCCTV },
    { label: '주차장', enabled: listing.hasParking },
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 브레드크럼 */}
      <nav className="text-sm text-gray-500 mb-6 flex items-center gap-1">
        <Link href="/" className="hover:text-gray-700">홈</Link>
        <span>/</span>
        <Link href="/listings" className="hover:text-gray-700">매물 목록</Link>
        <span>/</span>
        <span className="text-gray-900">{listing.addressMasked}</span>
      </nav>

      {/* 헤더 */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="inline-block text-xs font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full mb-2">
              {facilityLabel}
            </span>
            <h1 className="text-2xl font-bold text-gray-900">{listing.addressMasked}</h1>
            <p className="text-sm text-gray-500 mt-1">
              등록일 {new Date(listing.createdAt).toLocaleDateString('ko-KR')}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-bold text-blue-600">
              {listing.monthlyRent != null
                ? `월 ${listing.monthlyRent.toLocaleString()}만원`
                : '가격 문의'}
            </p>
            {listing.deposit != null && (
              <p className="text-sm text-gray-500">보증금 {listing.deposit.toLocaleString()}만원</p>
            )}
          </div>
        </div>
      </div>

      {/* 이미지 갤러리 */}
      {listing.images.length > 0 && (
        <div className="mb-8">
          <ImageGallery images={listing.images} alt={listing.addressMasked} />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 상세 정보 테이블 */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">매물 상세 정보</h2>
            </div>
            <dl className="divide-y divide-gray-100">
              {detailRows
                .filter((row) => row.value !== null)
                .map((row) => (
                  <div key={row.label} className="px-5 py-3 flex justify-between text-sm">
                    <dt className="text-gray-500 w-24 shrink-0">{row.label}</dt>
                    <dd className="text-gray-900 font-medium text-right">{row.value}</dd>
                  </div>
                ))}
            </dl>
          </div>

          {/* 시설 특징 */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">시설 특징</h2>
            <div className="grid grid-cols-4 gap-3">
              {features.map(({ label, enabled }) => (
                <div
                  key={label}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg text-xs font-medium ${
                    enabled
                      ? 'bg-blue-50 text-blue-700'
                      : 'bg-gray-50 text-gray-400'
                  }`}
                >
                  <span className="text-lg">{enabled ? '✓' : '–'}</span>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 상세 설명 */}
          {listing.description && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-2">상세 설명</h2>
              <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                {listing.description}
              </p>
            </div>
          )}
        </div>

        {/* 문의 사이드바 */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 p-5 sticky top-24">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">임대 문의</h2>
            <p className="text-xs text-gray-500 mb-4">
              이 매물에 관심이 있으신가요?<br />
              문의 폼을 통해 담당자에게 연락하세요.
            </p>
            <a
              href={`#inquiry`}
              className="block w-full text-center text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg py-2.5 transition-colors"
            >
              문의하기
            </a>
          </div>
        </div>
      </div>

      {/* 문의 폼 */}
      <div id="inquiry" className="mt-10 scroll-mt-24">
        <h2 className="text-xl font-bold text-gray-900 mb-6">임대 문의</h2>
        <InquiryForm listingId={listing.id} />
      </div>
    </div>
  )
}
