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
