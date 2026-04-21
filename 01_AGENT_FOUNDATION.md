# 🏗️ AGENT-01: Foundation

## 역할
당신은 **Foundation Agent**입니다.  
모든 에이전트의 기반이 되는 프로젝트 구조, DB 스키마, 공통 라이브러리를 구축합니다.  
이 단계가 잘못되면 전체 시스템이 흔들리므로 **정확성이 최우선**입니다.

---

## 📥 INPUT
- GitHub 레포: `https://github.com/ancozo-ui/real.git`
- Supabase Project ID: `tyezkwvhfxdokidcbhct` / Region: `ap-northeast-1` (도쿄)
- 위 Orchestrator 스펙 문서 전체

## 📤 OUTPUT 계약 (다음 에이전트들이 기대하는 것)
완료 시 반드시 아래 파일들이 존재하고 작동해야 합니다:

```
prisma/
  schema.prisma          ← 전 에이전트가 import
  migrations/            ← Supabase에 적용 완료
prisma.config.ts         ← Prisma 7 설정
src/
  lib/
    prisma.ts            ← PrismaClient (adapter-pg)
    address.ts           ← maskAddress(full: string): string
    area.ts              ← pyeongToSqm(p), sqmToPyeong(s), AreaInfo type
    types/
      listing.ts         ← 공유 TypeScript 타입 정의
.env.example             ← 전체 환경변수 템플릿
package.json             ← 모든 의존성 포함
tailwind.config.ts       ← Tailwind v4 기본 설정
```

---

## 🛠️ 작업 목록

### Step 1: Next.js 16 프로젝트 초기화
```bash
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --no-git
```

**주의사항:**
- Tailwind CSS v4 설정 확인 (`tailwind.config.ts` 방식)
- `middleware.ts` 생성 금지 → `proxy.ts` 사용 (AGENT-02가 생성)
- `app/` → `src/app/` 구조

### Step 2: 의존성 설치
```bash
npm install \
  prisma@7 \
  @prisma/client@7 \
  @prisma/adapter-pg \
  pg \
  next-auth@beta \
  @auth/prisma-adapter \
  cloudinary \
  @anthropic-ai/sdk \
  resend \
  rss-parser \
  @types/pg \
  @types/rss-parser

npm install -D prisma@7
```

### Step 3: Prisma 7 설정

**`prisma.config.ts`** (루트):
```typescript
import path from 'path'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  earlyAccess: true,
  schema: path.join('prisma', 'schema.prisma'),
})
```

**`prisma/schema.prisma`:**
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

model Listing {
  id              String         @id @default(cuid())
  
  // 주소 (전체 저장, 공개는 마스킹)
  addressFull     String         // 전체 주소 (관리자만)
  addressMasked   String         // 읍면동까지만 (공개)
  
  // 면적
  totalAreaSqm    Float?         // 총면적 (㎡)
  totalAreaPyeong Float?         // 총면적 (평)
  rentAreaSqm     Float?         // 임대면적 (㎡)
  rentAreaPyeong  Float?         // 임대면적 (평)
  
  // 임대조건
  monthlyRent     Int?           // 월임대료 (만원)
  deposit         Int?           // 보증금 (만원)
  maintenanceFee  Int?           // 관리비 (만원)
  availableFrom   DateTime?      // 입주가능일
  
  // 시설 정보
  facilityType    FacilityType   @default(WAREHOUSE)
  ceilingHeight   Float?         // 천고 (m)
  floorLoad       Float?         // 바닥하중 (t/㎡)
  hasDock         Boolean        @default(false)   // 도크 유무
  hasOffice       Boolean        @default(false)   // 사무실 포함
  hasCCTV         Boolean        @default(false)
  hasParking      Boolean        @default(false)
  
  // 상태
  status          ListingStatus  @default(DRAFT)
  hasWatermark    Boolean        @default(false)   // 워터마크 감지 플래그
  
  // OCR 원본 데이터 (JSON)
  ocrRawData      Json?
  
  // 메타
  description     String?
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
  
  images          ListingImage[]
  inquiries       Inquiry[]
}

model ListingImage {
  id           String   @id @default(cuid())
  listingId    String
  listing      Listing  @relation(fields: [listingId], references: [id], onDelete: Cascade)
  cloudinaryId String
  url          String
  order        Int      @default(0)
  createdAt    DateTime @default(now())
}

model Inquiry {
  id          String    @id @default(cuid())
  listingId   String?
  listing     Listing?  @relation(fields: [listingId], references: [id], onDelete: SetNull)
  
  companyName String
  contactName String
  phone       String
  email       String
  message     String?
  
  createdAt   DateTime  @default(now())
}

model NewsPost {
  id          String       @id @default(cuid())
  title       String
  slug        String       @unique
  content     String
  excerpt     String?
  source      NewsSource   @default(MANUAL)
  sourceUrl   String?
  publishedAt DateTime     @default(now())
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
}

model NewsletterSubscriber {
  id          String   @id @default(cuid())
  email       String   @unique
  name        String?
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())
}

enum FacilityType {
  WAREHOUSE    // 창고
  LOGISTICS    // 물류센터
  COLD_CHAIN   // 냉장/냉동
  FULFILLMENT  // 풀필먼트
  FACTORY      // 공장
}

enum ListingStatus {
  DRAFT        // 임시저장
  PUBLISHED    // 공개
  ARCHIVED     // 숨김
}

enum NewsSource {
  MANUAL       // 직접 작성
  RSS          // RSS 자동 수집
}
```

### Step 4: `src/lib/prisma.ts`
```typescript
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const { Pool } = pg

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
```

### Step 5: `src/lib/address.ts`
```typescript
/**
 * 주소를 읍면동 수준으로 마스킹합니다.
 * "경기도 이천시 마장면 현암리 123-4번지" → "경기도 이천시 마장면"
 * "서울특별시 강남구 역삼동 100" → "서울특별시 강남구 역삼동"
 */
export function maskAddress(fullAddress: string): string {
  if (!fullAddress) return ''
  
  // 읍면동 패턴: 읍|면|동|가|로 다음에 숫자나 공백
  const pattern = /^(.*?(?:읍|면|동|가)(?=\s|$|\d))/
  const match = fullAddress.match(pattern)
  
  if (match) {
    return match[1].trim()
  }
  
  // 패턴 불일치시 시군구 수준으로 폴백
  const sigunguPattern = /^(.*?(?:시|군|구)(?=\s|$))/
  const sigunguMatch = fullAddress.match(sigunguPattern)
  return sigunguMatch ? sigunguMatch[1].trim() : fullAddress
}

/**
 * 주소에서 시도 추출
 */
export function extractSido(fullAddress: string): string {
  const match = fullAddress.match(/^([가-힣]+(?:특별시|광역시|특별자치시|도|특별자치도))/)
  return match ? match[1] : ''
}

/**
 * 주소에서 시군구 추출
 */
export function extractSigungu(fullAddress: string): string {
  const match = fullAddress.match(/(?:특별시|광역시|특별자치시|도|특별자치도)\s+([가-힣]+(?:시|군|구))/)
  return match ? match[1] : ''
}
```

### Step 6: `src/lib/area.ts`
```typescript
const PYEONG_TO_SQM = 3.305785

export interface AreaInfo {
  sqm: number
  pyeong: number
  displaySqm: string     // "330.6㎡"
  displayPyeong: string  // "100평"
}

export function sqmToPyeong(sqm: number): number {
  return Math.round((sqm / PYEONG_TO_SQM) * 10) / 10
}

export function pyeongToSqm(pyeong: number): number {
  return Math.round(pyeong * PYEONG_TO_SQM * 10) / 10
}

export function createAreaInfo(sqm: number): AreaInfo {
  const pyeong = sqmToPyeong(sqm)
  return {
    sqm,
    pyeong,
    displaySqm: `${sqm.toLocaleString()}㎡`,
    displayPyeong: `${pyeong.toLocaleString()}평`,
  }
}

export function createAreaInfoFromPyeong(pyeong: number): AreaInfo {
  return createAreaInfo(pyeongToSqm(pyeong))
}

/**
 * 문자열에서 면적 파싱 (OCR 결과 처리용)
 * "1,234㎡", "100평", "100 pyeong" 등 다양한 형식 지원
 */
export function parseAreaString(str: string): { value: number; unit: 'sqm' | 'pyeong' } | null {
  const cleaned = str.replace(/,/g, '').trim()
  
  // ㎡ / m2 / 제곱미터
  const sqmMatch = cleaned.match(/(\d+\.?\d*)\s*(?:㎡|m2|제곱미터)/i)
  if (sqmMatch) return { value: parseFloat(sqmMatch[1]), unit: 'sqm' }
  
  // 평
  const pyeongMatch = cleaned.match(/(\d+\.?\d*)\s*(?:평|pyeong)/i)
  if (pyeongMatch) return { value: parseFloat(pyeongMatch[1]), unit: 'pyeong' }
  
  return null
}
```

### Step 7: `src/lib/types/listing.ts`
```typescript
import { Listing, ListingImage, FacilityType, ListingStatus } from '@prisma/client'

// 공개용 매물 (마스킹된 주소)
export type PublicListing = Omit<Listing, 'addressFull' | 'ocrRawData'> & {
  images: ListingImage[]
}

// 관리자용 매물 (전체 정보)
export type AdminListing = Listing & {
  images: ListingImage[]
  _count: { inquiries: number }
}

// OCR 추출 결과 타입
export interface OcrExtractedData {
  addressFull?: string
  totalAreaSqm?: number
  totalAreaPyeong?: number
  rentAreaSqm?: number
  rentAreaPyeong?: number
  monthlyRent?: number
  deposit?: number
  maintenanceFee?: number
  facilityType?: FacilityType
  ceilingHeight?: number
  floorLoad?: number
  hasDock?: boolean
  hasOffice?: boolean
  hasCCTV?: boolean
  hasParking?: boolean
  availableFrom?: string
  description?: string
  hasWatermark?: boolean
  hasBrokerContact?: boolean  // 중개사 연락처 감지 여부
  confidence?: number         // OCR 신뢰도 0-1
}

// 필터 타입 (공개 페이지용)
export interface ListingFilters {
  sido?: string
  sigungu?: string
  facilityType?: FacilityType
  minAreaSqm?: number
  maxAreaSqm?: number
  minRent?: number
  maxRent?: number
  hasDock?: boolean
  hasOffice?: boolean
}

export { FacilityType, ListingStatus }
```

### Step 8: `.env.example` 및 `.env` 생성
`.env.example` (Git 커밋용 — 비밀번호 없음):
```env
# Database (Supabase PostgreSQL)
DATABASE_URL="postgresql://postgres.tyezkwvhfxdokidcbhct:[PASSWORD]@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.tyezkwvhfxdokidcbhct:[PASSWORD]@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres"

# NextAuth
NEXTAUTH_SECRET="랜덤_문자열_32자_이상_openssl_rand_base64_32"
NEXTAUTH_URL="http://localhost:3000"

# 관리자 계정
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="강력한_비밀번호"

# Cloudinary
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""

# Claude API (OCR)
ANTHROPIC_API_KEY=""

# Resend (이메일)
RESEND_API_KEY=""
RESEND_FROM_EMAIL="noreply@yourdomain.com"
ADMIN_NOTIFICATION_EMAIL="admin@yourdomain.com"

# RSS 피드 (쉼표 구분)
RSS_FEEDS="https://example.com/rss,https://example2.com/rss"

# Vercel Cron 보안
CRON_SECRET="랜덤_문자열"
```

`.env` (실제 실행용 — Git 제외, [PASSWORD] 자리에 실제 비밀번호 입력):
```env
DATABASE_URL="postgresql://postgres.tyezkwvhfxdokidcbhct:[PASSWORD]@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.tyezkwvhfxdokidcbhct:[PASSWORD]@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres"
NEXTAUTH_SECRET=""
NEXTAUTH_URL="http://localhost:3000"
ADMIN_EMAIL=""
ADMIN_PASSWORD=""
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""
ANTHROPIC_API_KEY=""
RESEND_API_KEY=""
RESEND_FROM_EMAIL=""
ADMIN_NOTIFICATION_EMAIL=""
RSS_FEEDS=""
CRON_SECRET=""
```

⚠️ `.env` 파일의 `[PASSWORD]` 부분은 Supabase 대시보드에서 직접 입력 필요.  
비밀번호를 잊었거나 변경하려면: Supabase → Project Settings → Database → Reset database password

---

## ✅ 완료 기준 (QA-AGENT가 검증할 항목)

- [ ] `npm install` 오류 없음
- [ ] `npx prisma migrate dev --name init` 성공
- [ ] `npx prisma generate` 성공
- [ ] TypeScript 컴파일 오류 없음 (`npx tsc --noEmit`)
- [ ] `maskAddress("서울특별시 강남구 역삼동 100")` → `"서울특별시 강남구 역삼동"` 반환
- [ ] `pyeongToSqm(100)` → `330.6` 반환
- [ ] `sqmToPyeong(330.6)` → `100.0` 반환
- [ ] `src/lib/types/listing.ts` TypeScript 오류 없음

---

## 🔔 완료 신호
작업 완료 시 Orchestrator에게 다음 형식으로 보고:
```
AGENT-01 완료 보고
✅ 생성 파일: [목록]
✅ Supabase 마이그레이션: 적용 완료
✅ TypeScript: 오류 없음
⚠️ 특이사항: [있으면 기록]
👉 QA-AGENT 호출 요청
```
