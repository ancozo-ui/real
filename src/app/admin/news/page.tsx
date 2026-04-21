import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function AdminNewsPage() {
  const posts = await prisma.newsPost.findMany({
    orderBy: { publishedAt: 'desc' },
    select: {
      id: true,
      title: true,
      slug: true,
      source: true,
      publishedAt: true,
      createdAt: true,
    },
  })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">뉴스 관리</h1>
        <div className="flex gap-3">
          <Link
            href="/admin/news/newsletter"
            className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            뉴스레터 발송
          </Link>
          <Link
            href="/admin/news/new"
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            뉴스 작성
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">제목</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">출처</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">게시일</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">작업</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {posts.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                  등록된 뉴스가 없습니다.
                </td>
              </tr>
            ) : (
              posts.map((post) => (
                <tr key={post.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-900 line-clamp-1">{post.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">/news/{post.slug}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${
                        post.source === 'RSS'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {post.source === 'RSS' ? 'RSS' : '자체 작성'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(post.publishedAt).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/news/${post.slug}`}
                      target="_blank"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      보기
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
