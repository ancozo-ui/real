import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { sendInquiryNotification } from '@/lib/email'

// IP당 시간당 5건 rate limiting (in-memory, 단일 인스턴스용)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 5
const RATE_WINDOW_MS = 60 * 60 * 1000

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS })
    return true
  }
  if (entry.count >= RATE_LIMIT) return false
  entry.count++
  return true
}

const inquirySchema = z.object({
  companyName: z.string().min(1, '회사명을 입력해주세요').max(100),
  contactName: z.string().min(1, '담당자명을 입력해주세요').max(50),
  phone: z
    .string()
    .min(1, '연락처를 입력해주세요')
    .regex(/^[0-9\-+\s()]{7,20}$/, '올바른 연락처 형식을 입력해주세요'),
  email: z.string().email('올바른 이메일 주소를 입력해주세요'),
  message: z.string().max(2000).optional(),
  listingId: z.string().optional(),
  // honeypot: 봇이 채우는 hidden 필드 — 값이 있으면 스팸 처리
  _hp: z.string().max(0, '스팸으로 감지되었습니다').optional(),
})

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'

  if (!checkRateLimit(ip)) {
    return Response.json(
      { error: '잠시 후 다시 시도해주세요 (시간당 최대 5건)' },
      { status: 429 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: '잘못된 요청입니다' }, { status: 400 })
  }

  const result = inquirySchema.safeParse(body)
  if (!result.success) {
    const message = result.error.issues[0]?.message ?? '입력값을 확인해주세요'
    return Response.json({ error: message }, { status: 400 })
  }

  const { companyName, contactName, phone, email, message, listingId } =
    result.data

  // listingId가 있을 경우 매물 존재 + 공개 여부 확인
  let listingAddress: string | undefined
  if (listingId) {
    const listing = await prisma.listing.findFirst({
      where: { id: listingId, status: 'PUBLISHED' },
      select: { addressMasked: true },
    })
    if (!listing) {
      return Response.json({ error: '존재하지 않는 매물입니다' }, { status: 404 })
    }
    listingAddress = listing.addressMasked
  }

  // DB 저장
  await prisma.inquiry.create({
    data: {
      companyName,
      contactName,
      phone,
      email,
      message,
      ...(listingId ? { listingId } : {}),
    },
  })

  // 관리자 이메일 발송 (실패해도 응답은 성공)
  try {
    await sendInquiryNotification({
      companyName,
      contactName,
      phone,
      email,
      message,
      listingId,
      listingAddress,
    })
  } catch (err) {
    console.error('이메일 발송 실패:', err)
  }

  return Response.json({ success: true }, { status: 201 })
}
