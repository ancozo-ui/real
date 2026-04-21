import { prisma } from '@/lib/prisma'

export default async function InquiriesPage() {
  const inquiries = await prisma.inquiry.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      listing: { select: { id: true, addressMasked: true } },
    },
  })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">문의 관리</h1>
        <span className="text-sm text-gray-500">총 {inquiries.length}건</span>
      </div>

      {inquiries.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p>접수된 문의가 없습니다.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">접수일</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">회사명</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">담당자</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">연락처</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">이메일</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">관심 매물</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">문의 내용</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {inquiries.map((inq) => (
                <tr key={inq.id} className="hover:bg-gray-50">
                  <td className="px-5 py-4 text-gray-500 whitespace-nowrap">
                    {new Date(inq.createdAt).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-5 py-4 font-medium text-gray-900">{inq.companyName}</td>
                  <td className="px-5 py-4 text-gray-700">{inq.contactName}</td>
                  <td className="px-5 py-4">
                    <a
                      href={`tel:${inq.phone}`}
                      className="text-blue-600 hover:underline"
                    >
                      {inq.phone}
                    </a>
                  </td>
                  <td className="px-5 py-4">
                    <a
                      href={`mailto:${inq.email}`}
                      className="text-blue-600 hover:underline"
                    >
                      {inq.email}
                    </a>
                  </td>
                  <td className="px-5 py-4 text-gray-600">
                    {inq.listing ? (
                      <a
                        href={`/listings/${inq.listing.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {inq.listing.addressMasked}
                      </a>
                    ) : (
                      <span className="text-gray-400">일반 문의</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-gray-600 max-w-xs">
                    {inq.message ? (
                      <p className="truncate" title={inq.message}>{inq.message}</p>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
