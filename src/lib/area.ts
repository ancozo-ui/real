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
