import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { uploadImage } from '@/lib/cloudinary'

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: '파일이 없습니다' }, { status: 400 })
    }

    // 파일 타입 검증
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: '지원하지 않는 파일 형식입니다' }, { status: 400 })
    }

    // 파일 크기 제한 (20MB)
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: '파일 크기가 20MB를 초과합니다' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const result = await uploadImage(buffer)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: '업로드 실패' }, { status: 500 })
  }
}
