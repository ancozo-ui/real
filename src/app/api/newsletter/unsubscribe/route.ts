import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const unsubscribeSchema = z.object({
  email: z.string().email('유효한 이메일을 입력해주세요'),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const result = unsubscribeSchema.safeParse(body)

    if (!result.success) {
      return Response.json({ error: result.error.issues[0].message }, { status: 400 })
    }

    const { email } = result.data

    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email },
    })

    if (!existing || !existing.active) {
      return Response.json({ message: '구독 정보를 찾을 수 없습니다' }, { status: 404 })
    }

    await prisma.newsletterSubscriber.update({
      where: { email },
      data: { active: false },
    })

    return Response.json({ message: '구독이 해제되었습니다' })
  } catch {
    return Response.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
