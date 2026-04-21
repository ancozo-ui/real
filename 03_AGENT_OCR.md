# 🤖 AGENT-03: OCR Pipeline

## 역할
당신은 **OCR Pipeline Agent**입니다.  
업로드된 이미지/PDF를 Claude Vision API로 분석하여 창고 정보를 구조화합니다.  
관리자가 검토 후 저장할 수 있도록 폼 자동 채우기까지 구현합니다.

---

## 📥 INPUT (이전 에이전트 제공)
- `src/lib/prisma.ts` — DB 클라이언트
- `src/lib/address.ts` — `maskAddress()`
- `src/lib/area.ts` — `parseAreaString()`, `createAreaInfo()`
- `src/lib/types/listing.ts` — `OcrExtractedData` 타입
- `src/lib/cloudinary.ts` — `uploadImage()`
- `src/app/admin/listings/new/actions.ts` — `extractOcrAction` 스켈레톤
- `src/app/admin/listings/new/page.tsx` — 등록 폼 페이지 스켈레톤

## 📤 OUTPUT 계약
```
src/
  lib/
    claude.ts                    ← extractFromImage(), extractFromText()
  app/
    admin/
      listings/
        new/
          page.tsx               ← 완성된 등록 폼 (OCR 자동 채우기 포함)
          actions.ts             ← extractOcrAction 구현 완료
        [id]/
          page.tsx               ← 매물 상세 (편집 포함)
        page.tsx                 ← 매물 목록
```

---

## 🛠️ 작업 목록

### Step 1: `src/lib/claude.ts` — 핵심 OCR 함수

```typescript
import Anthropic from '@anthropic-ai/sdk'
import type { OcrExtractedData } from '@/lib/types/listing'
import { parseAreaString } from '@/lib/area'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const EXTRACTION_SYSTEM_PROMPT = `당신은 한국 물류창고 임대 정보 추출 전문가입니다.
이미지나 텍스트에서 다음 정보를 정확히 추출하여 JSON으로 반환하세요.

추출 규칙:
1. 주소: 정확한 지번/도로명 주소 전체 (지번 우선)
2. 면적: 단위(㎡/평)를 포함하여 추출, 총면적과 임대면적 구분
3. 임대조건: 월임대료, 보증금, 관리비 (단위: 만원)
4. 중개사 연락처 감지 시 hasBrokerContact: true (값은 제외)
5. 워터마크 감지 시 hasWatermark: true
6. 정보가 없으면 해당 필드 생략 (null/undefined 사용 금지)
7. 신뢰도: OCR 결과 전반적 신뢰도 0.0~1.0

반드시 유효한 JSON만 반환하세요. 설명 텍스트 금지.`

const EXTRACTION_SCHEMA = `{
  "addressFull": "string (전체 주소)",
  "totalAreaSqm": "number (총면적 ㎡)",
  "totalAreaPyeong": "number (총면적 평)",
  "rentAreaSqm": "number (임대면적 ㎡)",
  "rentAreaPyeong": "number (임대면적 평)",
  "monthlyRent": "number (월임대료 만원)",
  "deposit": "number (보증금 만원)",
  "maintenanceFee": "number (관리비 만원)",
  "facilityType": "WAREHOUSE|LOGISTICS|COLD_CHAIN|FULFILLMENT|FACTORY",
  "ceilingHeight": "number (천고 m)",
  "floorLoad": "number (바닥하중 t/㎡)",
  "hasDock": "boolean",
  "hasOffice": "boolean",
  "hasCCTV": "boolean",
  "hasParking": "boolean",
  "availableFrom": "string (YYYY-MM-DD)",
  "description": "string (기타 특이사항)",
  "hasWatermark": "boolean",
  "hasBrokerContact": "boolean",
  "confidence": "number (0.0~1.0)"
}`

/**
 * 이미지 URL에서 창고 정보 추출
 */
export async function extractFromImage(imageUrl: string): Promise<OcrExtractedData> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: EXTRACTION_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'url',
              url: imageUrl,
            },
          },
          {
            type: 'text',
            text: `이 이미지에서 물류창고 임대 정보를 추출하세요.\n반환 스키마:\n${EXTRACTION_SCHEMA}`,
          },
        ],
      },
    ],
  })

  return parseClaudeResponse(response.content[0])
}

/**
 * 여러 이미지에서 통합 추출 (PDF 페이지 등)
 */
export async function extractFromImages(imageUrls: string[]): Promise<OcrExtractedData> {
  if (imageUrls.length === 0) return {}
  if (imageUrls.length === 1) return extractFromImage(imageUrls[0])

  const imageContents = imageUrls.slice(0, 5).map((url) => ({
    // Claude API 최대 5개 이미지
    type: 'image' as const,
    source: { type: 'url' as const, url },
  }))

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: EXTRACTION_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          ...imageContents,
          {
            type: 'text',
            text: `이 ${imageUrls.length}개 이미지는 동일한 물류창고 임대 자료의 페이지들입니다.\n모든 페이지를 종합하여 정보를 추출하세요.\n반환 스키마:\n${EXTRACTION_SCHEMA}`,
          },
        ],
      },
    ],
  })

  return parseClaudeResponse(response.content[0])
}

/**
 * 텍스트에서 창고 정보 추출
 */
export async function extractFromText(text: string): Promise<OcrExtractedData> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: EXTRACTION_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `다음 물류창고 임대 자료에서 정보를 추출하세요.\n\n---\n${text}\n---\n\n반환 스키마:\n${EXTRACTION_SCHEMA}`,
      },
    ],
  })

  return parseClaudeResponse(response.content[0])
}

function parseClaudeResponse(content: Anthropic.ContentBlock): OcrExtractedData {
  if (content.type !== 'text') return {}

  try {
    // JSON 코드블록 제거 후 파싱
    const jsonStr = content.text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()
    
    const raw = JSON.parse(jsonStr)
    
    // 면적 단위 상호 보완
    if (raw.totalAreaSqm && !raw.totalAreaPyeong) {
      raw.totalAreaPyeong = Math.round((raw.totalAreaSqm / 3.305785) * 10) / 10
    }
    if (raw.totalAreaPyeong && !raw.totalAreaSqm) {
      raw.totalAreaSqm = Math.round(raw.totalAreaPyeong * 3.305785 * 10) / 10
    }
    
    return raw as OcrExtractedData
  } catch {
    console.error('Claude OCR 파싱 실패:', content.text)
    return {}
  }
}
```

### Step 2: `extractOcrAction` 구현 (actions.ts 완성)

AGENT-02가 만든 스켈레톤을 완성합니다:
```typescript
export async function extractOcrAction(formData: FormData): Promise<OcrExtractedData> {
  const session = await auth()
  if (!session) throw new Error('인증 필요')
  
  const uploadedUrls = formData.getAll('imageUrls') as string[]
  const textContent = formData.get('text') as string
  
  if (textContent) {
    return extractFromText(textContent)
  }
  
  if (uploadedUrls.length > 0) {
    return extractFromImages(uploadedUrls)
  }
  
  return {}
}
```

### Step 3: 새 매물 등록 폼 (`src/app/admin/listings/new/page.tsx`)

**3단계 플로우로 구성:**
```
[1단계] 파일 업로드 (이미지/PDF/텍스트)
    ↓ "OCR 자동 추출" 버튼
[2단계] 추출 결과 검토 및 수정
    - 자동 채워진 폼 필드
    - 신뢰도 표시 (confidence 기반)
    - 워터마크/중개사 연락처 감지 경고
    ↓ "저장" 버튼
[3단계] 완료 → /admin/listings 이동
```

**폼 필드:**
- 주소 (자동채움 + 마스킹 미리보기)
- 시설 유형 (드롭다운)
- 총면적 / 임대면적 (㎡ ↔ 평 자동환산)
- 월임대료 / 보증금 / 관리비
- 천고 / 바닥하중
- 시설 체크박스: 도크, 사무실, CCTV, 주차
- 입주가능일
- 설명
- 이미지 순서 정렬 (드래그 가능)

**UI 요구사항:**
- 워터마크 감지 시 주황색 경고 배너
- 중개사 연락처 감지 시 파란색 안내 배너 ("연락처 정보가 제외되었습니다")
- 신뢰도 < 0.7 시 노란색 경고 ("일부 정보를 수동으로 확인하세요")
- 로딩 중 스피너 + "AI가 정보를 분석하고 있습니다..."

### Step 4: 매물 목록 (`src/app/admin/listings/page.tsx`)
- 전체 매물 목록 (DRAFT 포함)
- 상태 배지 (초안/공개/숨김)
- 워터마크 플래그 표시
- 수정/삭제/공개전환 액션
- 페이지네이션 (20개씩)

### Step 5: 매물 상세/편집 (`src/app/admin/listings/[id]/page.tsx`)
- 등록 폼과 동일한 UI (수정 모드)
- 이미지 삭제/순서변경
- 상태 변경 (DRAFT → PUBLISHED → ARCHIVED)

---

## ⚠️ 중요 처리 규칙

1. **PDF 처리**: PDF는 Cloudinary에서 이미지로 변환 후 Claude에 전달
   ```typescript
   // PDF → 이미지 URL (Cloudinary 자동 변환)
   const pdfImageUrl = cloudinaryUrl.replace('/upload/', '/upload/f_jpg,pg_1/')
   ```

2. **중개사 연락처**: `hasBrokerContact: true` 감지 시 UI에 표시만, DB에 저장 안 함

3. **오류 처리**: OCR 실패 시 빈 폼 반환 + "자동 추출 실패, 직접 입력하세요" 메시지

4. **이미지 순서**: `order` 필드로 저장, 첫 번째 이미지가 썸네일

---

## ✅ 완료 기준

- [ ] 이미지 업로드 → OCR 실행 → 폼 자동 채우기 작동
- [ ] PDF 업로드 → 이미지 변환 → OCR 실행 작동
- [ ] 텍스트 붙여넣기 → OCR 실행 작동
- [ ] 면적 ㎡ 입력 시 평 자동계산 (양방향)
- [ ] 주소 입력 시 마스킹 미리보기 표시
- [ ] 워터마크 감지 경고 표시
- [ ] 중개사 연락처 감지 배너 표시
- [ ] 매물 저장 → DB 정상 저장
- [ ] 매물 목록 페이지 렌더링
- [ ] TypeScript 오류 없음

---

## 🔔 완료 신호
```
AGENT-03 완료 보고
✅ claude.ts OCR 함수: 구현 완료
✅ 등록 폼 3단계 플로우: 구현 완료
✅ 매물 목록/상세: 구현 완료
⚠️ AGENT-04에게 전달: PublicListing 타입 사용, prisma.listing.findMany({ where: { status: 'PUBLISHED' }})
👉 QA-AGENT 호출 요청
```
