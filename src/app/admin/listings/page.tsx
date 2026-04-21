import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ListingStatus, FacilityType } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'

const PAGE_SIZE = 20

const STATUS_LABELS: Record<ListingStatus, string> = {
  DRAFT: '초안',
  PUBLISHED: '공개',
  ARCHIVED: '숨김',
}

const STATUS_COLORS: Record<ListingStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  PUBLISHED: 'bg-green-100 text-green-700',
  ARCHIVED: 'bg-red-100 text-red-700',
}

const FACILITY_LABELS: Record<FacilityType, string> = {
  WAREHOUSE: '창고',
  LOGISTICS: '물류센터',
  COLD_CHAIN: '냉장/냉동',
  FULFILLMENT: '풀필먼트',
  FACTORY: '공장',
}

async function deleteListingAction(id: string) {
  'use server'
  const session = await auth()
  if (!session) throw new Error('인증 필요')
  await prisma.listing.delete({ where: { id } })
  revalidatePath('/admin/listings')
}

async function toggleStatusAction(id: string, currentStatus: ListingStatus) {
  'use server'
  const session = await auth()
  if (!session) throw new Error('인증 필요')
  const nextStatus: ListingStatus =
    currentStatus === 'DRAFT' ? 'PUBLISHED'
    : currentStatus === 'PUBLISHED' ? 'ARCHIVED'
    : 'DRAFT'
  await prisma.listing.update({ where: { id }, data: { status: nextStatus } })
  revalidatePath('/admin/listings')
}

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page: pageStr } = await searchParams
  const page = Math.max(1, parseInt(pageStr ?? '1'))
  const skip = (page - 1) * PAGE_SIZE

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      include: {
        images: { orderBy: { order: 'asc' }, take: 1 },
        _count: { select: { inquiries: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: PAGE_SIZE,
    }),
    prisma.listing.count(),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">매물 관리</h1>
          <p className="text-sm text-gray-500 mt-1">총 {total}개</p>
        </div>
        <Link
          href="/admin/listings/new"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          새 매물 등록
        </Link>
      </div>

      {listings.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg">등록된 매물이 없습니다.</p>
          <Link href="/admin/listings/new" className="mt-4 inline-block text-blue-600 hover:underline text-sm">
            첫 매물 등록하기 →
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                  이미지
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  주소
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  유형
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  면적
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  월임대료
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  문의
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  액션
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {listings.map((listing) => (
                <tr key={listing.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {listing.images[0] ? (
                      <img
                        src={listing.images[0].url}
                        alt=""
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                      {listing.addressMasked}
                    </div>
                    <div className="text-xs text-gray-500 max-w-xs truncate">{listing.addressFull}</div>
                    {listing.hasWatermark && (
                      <span className="inline-flex items-center gap-1 text-xs text-orange-600 mt-0.5">
                        <span>⚠️</span> 워터마크
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {FACILITY_LABELS[listing.facilityType]}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {listing.totalAreaSqm
                      ? `${listing.totalAreaSqm.toLocaleString()}㎡`
                      : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {listing.monthlyRent
                      ? `${listing.monthlyRent.toLocaleString()}만원`
                      : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${STATUS_COLORS[listing.status]}`}>
                      {STATUS_LABELS[listing.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {listing._count.inquiries}건
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/listings/${listing.id}`}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        수정
                      </Link>
                      <form action={toggleStatusAction.bind(null, listing.id, listing.status)}>
                        <button
                          type="submit"
                          className="text-xs text-gray-600 hover:text-gray-800 font-medium"
                        >
                          {listing.status === 'DRAFT' ? '공개' : listing.status === 'PUBLISHED' ? '숨김' : '초안으로'}
                        </button>
                      </form>
                      <form action={deleteListingAction.bind(null, listing.id)}>
                        <button
                          type="submit"
                          className="text-xs text-red-600 hover:text-red-800 font-medium"
                          onClick={(e) => {
                            if (!confirm('정말 삭제하시겠습니까?')) e.preventDefault()
                          }}
                        >
                          삭제
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {page > 1 && (
            <Link
              href={`/admin/listings?page=${page - 1}`}
              className="px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              이전
            </Link>
          )}
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => Math.abs(p - page) <= 2)
            .map((p) => (
              <Link
                key={p}
                href={`/admin/listings?page=${p}`}
                className={`px-3 py-1.5 text-sm rounded-lg border ${
                  p === page
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
                }`}
              >
                {p}
              </Link>
            ))}
          {page < totalPages && (
            <Link
              href={`/admin/listings?page=${page + 1}`}
              className="px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              다음
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
