import Anthropic from '@anthropic-ai/sdk'
import type { OcrExtractedData } from '@/lib/types/listing'

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

export async function extractFromImages(imageUrls: string[]): Promise<OcrExtractedData> {
  if (imageUrls.length === 0) return {}
  if (imageUrls.length === 1) return extractFromImage(imageUrls[0])

  const imageContents = imageUrls.slice(0, 5).map((url) => ({
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
    const jsonStr = content.text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()

    const raw = JSON.parse(jsonStr)

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
