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
