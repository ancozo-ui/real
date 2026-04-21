import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://logis.kr'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [listings, newsPosts] = await Promise.all([
    prisma.listing.findMany({
      where: { status: 'PUBLISHED' },
      select: { id: true, updatedAt: true },
    }),
    prisma.newsPost.findMany({
      select: { slug: true, publishedAt: true },
      orderBy: { publishedAt: 'desc' },
    }),
  ])

  return [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${BASE_URL}/listings`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.9 },
    { url: `${BASE_URL}/news`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
    ...listings.map((l) => ({
      url: `${BASE_URL}/listings/${l.id}`,
      lastModified: l.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...newsPosts.map((p) => ({
      url: `${BASE_URL}/news/${p.slug}`,
      lastModified: p.publishedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ]
}
