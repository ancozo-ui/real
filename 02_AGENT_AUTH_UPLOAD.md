# 🔐 AGENT-02: Auth & Upload

## 역할
당신은 **Auth & Upload Agent**입니다.  
NextAuth v5 관리자 인증, Cloudinary 업로드 UI, 관리자 레이아웃을 구축합니다.

---

## 📥 INPUT (AGENT-01이 제공한 것)
- `src/lib/prisma.ts` — PrismaClient 인스턴스
- `prisma/schema.prisma` — DB 모델
- `src/lib/types/listing.ts` — 공유 타입

## 📤 OUTPUT 계약
```
src/
  auth.ts                              ← handlers, auth, signIn, signOut export
  proxy.ts                             ← 라우트 보호 (Next.js 16)
  app/
    api/
      auth/[...nextauth]/route.ts      ← NextAuth 핸들러
      upload/route.ts                  ← Cloudinary 업로드 API
    admin/
      layout.tsx                       ← 관리자 레이아웃 (사이드바)
      page.tsx                         ← /admin/listings 리다이렉트
      login/
        page.tsx                       ← 로그인 페이지
        actions.ts                     ← 로그인 Server Action
      listings/
        page.tsx                       ← 매물 목록 (AGENT-03이 채움)
        [id]/page.tsx                  ← 매물 상세 (AGENT-03이 채움)
        new/
          page.tsx                     ← 새 매물 등록 폼 (AGENT-03이 채움)
          actions.ts                   ← 저장 Server Action
      inquiries/
        page.tsx                       ← 문의 목록 (AGENT-05가 채움)
  lib/
    cloudinary.ts                      ← uploadImage(), deleteImage()
```

---

## 🛠️ 작업 목록

### Step 1: `src/auth.ts` (NextAuth v5)
```typescript
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { z } from 'zod'

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials)
        if (!parsed.success) return null
        
        const { email, password } = parsed.data
        
        if (
          email === process.env.ADMIN_EMAIL &&
          password === process.env.ADMIN_PASSWORD
        ) {
          return {
            id: 'admin',
            email: process.env.ADMIN_EMAIL,
            name: '관리자',
            role: 'ADMIN',
          }
        }
        return null
      },
    }),
  ],
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/admin/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.role = (user as any).role
      return token
    },
    async session({ session, token }) {
      if (session.user) (session.user as any).role = token.role
      return session
    },
  },
})
```

### Step 2: `src/proxy.ts` (Next.js 16 — middleware 대체)
```typescript
import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const session = await auth()
  const { pathname } = request.nextUrl
  
  // /admin 하위 경로 (login 제외) 보호
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    if (!session) {
      const loginUrl = new URL('/admin/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }
  
  // 이미 로그인한 상태에서 /admin/login 접근 시 리다이렉트
  if (pathname === '/admin/login' && session) {
    return NextResponse.redirect(new URL('/admin/listings', request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
```

### Step 3: `src/app/api/auth/[...nextauth]/route.ts`
```typescript
import { handlers } from '@/auth'
export const { GET, POST } = handlers
```

### Step 4: `src/lib/cloudinary.ts`
```typescript
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export interface UploadResult {
  cloudinaryId: string
  url: string
  width: number
  height: number
}

export async function uploadImage(
  file: Buffer | string,
  folder = 'warehouse-listings'
): Promise<UploadResult> {
  const result = await cloudinary.uploader.upload(
    typeof file === 'string' ? file : `data:image/jpeg;base64,${file.toString('base64')}`,
    {
      folder,
      resource_type: 'image',
      quality: 'auto',
      fetch_format: 'auto',
    }
  )
  return {
    cloudinaryId: result.public_id,
    url: result.secure_url,
    width: result.width,
    height: result.height,
  }
}

export async function deleteImage(cloudinaryId: string): Promise<void> {
  await cloudinary.uploader.destroy(cloudinaryId)
}

export async function uploadPdfPage(
  pdfBase64: string,
  pageIndex: number,
  folder = 'warehouse-listings/pdf-pages'
): Promise<UploadResult> {
  const result = await cloudinary.uploader.upload(
    `data:application/pdf;base64,${pdfBase64}`,
    {
      folder,
      resource_type: 'image',
      format: 'jpg',
      pages: true,
      page: pageIndex,
    }
  )
  return {
    cloudinaryId: result.public_id,
    url: result.secure_url,
    width: result.width,
    height: result.height,
  }
}
```

### Step 5: `src/app/api/upload/route.ts`
```typescript
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
```

### Step 6: 관리자 레이아웃 (`src/app/admin/layout.tsx`)
- 왼쪽 사이드바: 로고, 매물 관리, 문의 관리, 뉴스 관리, 로그아웃
- 로그인 페이지는 사이드바 제외
- session 확인 후 미인증 시 /admin/login 리다이렉트

### Step 7: 로그인 페이지 및 Server Action
```typescript
// src/app/admin/login/actions.ts
'use server'
import { signIn } from '@/auth'
import { AuthError } from 'next-auth'

export async function loginAction(formData: FormData) {
  try {
    await signIn('credentials', {
      email: formData.get('email'),
      password: formData.get('password'),
      redirectTo: '/admin/listings',
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: '이메일 또는 비밀번호가 올바르지 않습니다' }
    }
    throw error
  }
}
```

### Step 8: `src/app/admin/listings/new/actions.ts`
AGENT-03이 OCR 로직을 채울 수 있도록 스켈레톤만 생성:
```typescript
'use server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { OcrExtractedData } from '@/lib/types/listing'

// AGENT-03이 구현: OCR 추출 후 폼에 자동 채우기
export async function extractOcrAction(formData: FormData): Promise<OcrExtractedData> {
  const session = await auth()
  if (!session) throw new Error('인증 필요')
  // TODO: AGENT-03이 구현
  return {}
}

// 매물 저장
export async function saveListing(formData: FormData) {
  const session = await auth()
  if (!session) throw new Error('인증 필요')
  
  // TODO: formData에서 값 추출 후 저장
  // maskAddress 활용, pyeongToSqm 변환 등
  
  revalidatePath('/admin/listings')
  redirect('/admin/listings')
}
```

---

## ✅ 완료 기준

- [ ] `/admin/login` 접근 → 로그인 폼 렌더링
- [ ] 올바른 자격증명으로 로그인 → `/admin/listings` 리다이렉트
- [ ] 잘못된 자격증명 → 에러 메시지 표시
- [ ] 미인증 상태로 `/admin/listings` 접근 → `/admin/login` 리다이렉트
- [ ] `/api/upload` POST (미인증) → 401 응답
- [ ] `/api/upload` POST (인증, 유효파일) → `{ cloudinaryId, url }` 응답
- [ ] TypeScript 오류 없음

---

## 🔔 완료 신호
```
AGENT-02 완료 보고
✅ 생성 파일: [목록]
✅ NextAuth v5: 작동 확인
✅ Cloudinary 업로드: 작동 확인
✅ proxy.ts: 라우트 보호 확인
⚠️ AGENT-03에게 전달: extractOcrAction 스켈레톤 위치 → src/app/admin/listings/new/actions.ts
👉 QA-AGENT 호출 요청
```
