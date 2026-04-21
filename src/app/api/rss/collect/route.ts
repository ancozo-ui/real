import Parser from 'rss-parser'
import { prisma } from '@/lib/prisma'

const parser = new Parser()

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const feedUrls = (process.env.RSS_FEEDS ?? '').split(',').filter(Boolean)
  let collected = 0

  for (const feedUrl of feedUrls) {
    try {
      const feed = await parser.parseURL(feedUrl.trim())

      for (const item of feed.items.slice(0, 10)) {
        if (!item.title || !item.link) continue

        const slug = await resolveUniqueSlug(item.title, item.link)

        await prisma.newsPost.upsert({
          where: { sourceUrl: item.link },
          update: {},
          create: {
            title: item.title,
            slug,
            content: item.content ?? item.contentSnippet ?? '',
            excerpt: item.contentSnippet?.slice(0, 200),
            source: 'RSS',
            sourceUrl: item.link,
            publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
          },
        })
        collected++
      }
    } catch (e) {
      console.error(`RSS 수집 실패: ${feedUrl}`, e)
    }
  }

  return Response.json({ collected })
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s가-힣]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 100)
}

async function resolveUniqueSlug(title: string, sourceUrl: string): Promise<string> {
  const base = generateSlug(title)

  const existing = await prisma.newsPost.findUnique({ where: { sourceUrl } })
  if (existing) return existing.slug

  const conflict = await prisma.newsPost.findUnique({ where: { slug: base } })
  if (!conflict) return base

  // 슬러그 충돌 시 URL 해시 suffix 추가
  const hash = Buffer.from(sourceUrl).toString('base64').slice(0, 6).replace(/[^a-z0-9]/gi, '')
  return `${base.slice(0, 93)}-${hash}`
}
