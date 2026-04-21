import Link from 'next/link'
import Image from 'next/image'
import { optimizeCloudinaryUrl } from '@/lib/cloudinaryUrl'
import { FACILITY_BADGE_COLORS } from '@/app/components/ui/Badge'

export const FACILITY_LABELS: Record<string, string> = {
  WAREHOUSE: '창고',
  LOGISTICS: '물류센터',
  COLD_CHAIN: '냉장/냉동',
  FULFILLMENT: '풀필먼트',
  FACTORY: '공장',
}

export interface ListingCardData {
  id: string
  addressMasked: string
  facilityType: string
  totalAreaSqm: number | null
  totalAreaPyeong: number | null
  rentAreaSqm: number | null
  rentAreaPyeong: number | null
  monthlyRent: number | null
  hasDock: boolean
  hasOffice: boolean
  images: { url: string; order: number }[]
}

export default function ListingCard({ listing }: { listing: ListingCardData }) {
  const thumbnail = listing.images[0]?.url
    ? optimizeCloudinaryUrl(listing.images[0].url, 600)
    : undefined
  const facilityLabel = FACILITY_LABELS[listing.facilityType] ?? listing.facilityType
  const facilityColor = FACILITY_BADGE_COLORS[listing.facilityType] ?? 'bg-gray-100 text-gray-700'

  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="relative h-48 bg-gray-100">
        {thumbnail ? (
          <Image
            src={thumbnail}
            alt={listing.addressMasked}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        <span className={`absolute top-3 left-3 text-xs font-medium px-2 py-0.5 rounded-full ${facilityColor}`}>
          {facilityLabel}
        </span>
      </div>

      <div className="p-4">
        <p className="text-sm font-semibold text-gray-900 truncate">{listing.addressMasked}</p>

        <div className="mt-2 space-y-0.5 text-xs text-gray-500">
          {listing.totalAreaSqm != null && (
            <p>
              총면적 {listing.totalAreaSqm.toLocaleString()}㎡
              {listing.totalAreaPyeong != null && ` (${listing.totalAreaPyeong.toLocaleString()}평)`}
            </p>
          )}
          {listing.rentAreaSqm != null && (
            <p>
              임대면적 {listing.rentAreaSqm.toLocaleString()}㎡
              {listing.rentAreaPyeong != null && ` (${listing.rentAreaPyeong.toLocaleString()}평)`}
            </p>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between">
          <p className="text-base font-bold text-gray-900">
            {listing.monthlyRent != null
              ? `월 ${listing.monthlyRent.toLocaleString()}만원`
              : '가격 문의'}
          </p>
          <div className="flex gap-1">
            {listing.hasDock && (
              <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">도크</span>
            )}
            {listing.hasOffice && (
              <span className="text-xs bg-green-50 text-green-600 px-1.5 py-0.5 rounded">사무실</span>
            )}
          </div>
        </div>

        <div className="mt-3">
          <span className="block w-full text-center text-xs font-medium text-blue-600 border border-blue-200 rounded-lg py-1.5 group-hover:bg-blue-600 group-hover:text-white transition-colors">
            문의하기
          </span>
        </div>
      </div>
    </Link>
  )
}
