import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const subscribeSchema = z.object({
  email: z.string().email('유효한 이메일을 입력해주세요'),
  name: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const result = subscribeSchema.safeParse(body)

    if (!result.success) {
      return Response.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      )
    }

    const { email, name } = result.data

    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email },
    })

    if (existing) {
      if (existing.active) {
        return Response.json({ message: '이미 구독 중입니다' }, { status: 200 })
      }
      // 재구독 처리
      await prisma.newsletterSubscriber.update({
        where: { email },
        data: { active: true, name },
      })
      return Response.json({ message: '구독이 재활성화되었습니다' })
    }

    await prisma.newsletterSubscriber.create({
      data: { email, name, active: true },
    })

    return Response.json({ message: '구독 신청이 완료되었습니다' }, { status: 201 })
  } catch {
    return Response.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
