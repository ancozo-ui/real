import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { z } from 'zod'

const newsSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요'),
  content: z.string().min(1, '내용을 입력해주세요'),
  excerpt: z.string().optional(),
})

function generateSlug(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^\w\s가-힣]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 100) +
    '-' +
    Date.now()
  )
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const result = newsSchema.safeParse(body)

    if (!result.success) {
      return Response.json({ error: result.error.issues[0].message }, { status: 400 })
    }

    const { title, content, excerpt } = result.data
    const slug = generateSlug(title)

    const post = await prisma.newsPost.create({
      data: {
        title,
        slug,
        content,
        excerpt,
        source: 'MANUAL',
        publishedAt: new Date(),
      },
    })

    return Response.json(post, { status: 201 })
  } catch {
    return Response.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
