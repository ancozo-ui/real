import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
  }

  const { id } = await params

  try {
    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        images: { orderBy: { order: 'asc' } },
        _count: { select: { inquiries: true } },
      },
    })

    if (!listing) {
      return NextResponse.json({ error: '매물을 찾을 수 없습니다' }, { status: 404 })
    }

    return NextResponse.json({ listing })
  } catch {
    return NextResponse.json({ error: '조회 실패' }, { status: 500 })
  }
}
