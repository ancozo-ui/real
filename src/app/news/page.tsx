import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '뉴스 | LOGIS',
  description: '물류창고 임대 관련 최신 뉴스와 정보를 확인하세요.',
}

export default async function NewsPage() {
  const posts = await prisma.newsPost.findMany({
    orderBy: { publishedAt: 'desc' },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      source: true,
      sourceUrl: true,
      publishedAt: true,
    },
  })

  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">뉴스</h1>

      {posts.length === 0 ? (
        <p className="text-gray-500 text-center py-16">등록된 뉴스가 없습니다.</p>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <article
              key={post.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    post.source === 'RSS'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {post.source === 'RSS' ? 'RSS' : '자체 작성'}
                </span>
                <time className="text-sm text-gray-400">
                  {new Date(post.publishedAt).toLocaleDateString('ko-KR')}
                </time>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                <Link href={`/news/${post.slug}`} className="hover:text-blue-600">
                  {post.title}
                </Link>
              </h2>
              {post.excerpt && (
                <p className="text-gray-600 text-sm line-clamp-2">{post.excerpt}</p>
              )}
              <div className="mt-4 flex items-center gap-4">
                <Link
                  href={`/news/${post.slug}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  자세히 보기 →
                </Link>
                {post.sourceUrl && (
                  <a
                    href={post.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-gray-400 hover:text-gray-600"
                  >
                    원문 보기
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  )
}
