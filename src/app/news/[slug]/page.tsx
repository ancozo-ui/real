import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await prisma.newsPost.findUnique({ where: { slug } })
  if (!post) return {}

  return {
    title: `${post.title} | LOGIS 뉴스`,
    description: post.excerpt ?? post.content.slice(0, 150),
  }
}

export default async function NewsDetailPage({ params }: Props) {
  const { slug } = await params
  const post = await prisma.newsPost.findUnique({ where: { slug } })

  if (!post) notFound()

  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <Link href="/news" className="text-sm text-gray-500 hover:text-gray-700 mb-6 inline-block">
        ← 뉴스 목록
      </Link>

      <article>
        <div className="flex items-center gap-2 mb-3">
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
            {new Date(post.publishedAt).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </time>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-6">{post.title}</h1>

        {post.excerpt && (
          <p className="text-lg text-gray-600 mb-8 border-l-4 border-blue-500 pl-4">
            {post.excerpt}
          </p>
        )}

        <div className="prose prose-gray max-w-none">
          <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
            {post.content}
          </div>
        </div>

        {post.sourceUrl && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <a
              href={post.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline"
            >
              원문 출처 보기 →
            </a>
          </div>
        )}
      </article>
    </main>
  )
}
