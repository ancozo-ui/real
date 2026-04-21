import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { sendNewsletter } from '@/lib/email'
import { z } from 'zod'

const sendSchema = z.object({
  subject: z.string().min(1, '제목을 입력해주세요'),
  content: z.string().min(1, '내용을 입력해주세요'),
})

export async function POST(request: Request) {
  const session = await auth()
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const result = sendSchema.safeParse(body)

    if (!result.success) {
      return Response.json({ error: result.error.issues[0].message }, { status: 400 })
    }

    const { subject, content } = result.data

    const subscribers = await prisma.newsletterSubscriber.findMany({
      where: { active: true },
      select: { email: true, name: true },
    })

    if (subscribers.length === 0) {
      return Response.json({ error: '활성 구독자가 없습니다' }, { status: 400 })
    }

    await sendNewsletter(
      subject,
      content,
      subscribers.map((s) => ({ email: s.email, name: s.name ?? undefined }))
    )

    return Response.json({
      message: `${subscribers.length}명에게 뉴스레터가 발송되었습니다`,
      count: subscribers.length,
    })
  } catch {
    return Response.json({ error: '발송 중 오류가 발생했습니다' }, { status: 500 })
  }
}
