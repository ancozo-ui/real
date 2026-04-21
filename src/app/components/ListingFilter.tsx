'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useState } from 'react'

const FACILITY_OPTIONS = [
  { value: 'WAREHOUSE', label: '창고' },
  { value: 'LOGISTICS', label: '물류센터' },
  { value: 'COLD_CHAIN', label: '냉장/냉동' },
  { value: 'FULFILLMENT', label: '풀필먼트' },
  { value: 'FACTORY', label: '공장' },
]

const SIDO_OPTIONS = [
  '서울특별시', '경기도', '인천광역시', '부산광역시', '대구광역시',
  '광주광역시', '대전광역시', '울산광역시', '세종특별자치시',
  '강원특별자치도', '충청북도', '충청남도', '전북특별자치도',
  '전라남도', '경상북도', '경상남도', '제주특별자치도',
]

export default function ListingFilter() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [minArea, setMinArea] = useState(searchParams.get('minArea') ?? '')
  const [maxArea, setMaxArea] = useState(searchParams.get('maxArea') ?? '')
  const [maxRent, setMaxRent] = useState(searchParams.get('maxRent') ?? '')

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      params.delete('page')
      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams]
  )

  const toggleFacility = (value: string) => {
    const current = searchParams.get('facilityType')
    setParam('facilityType', current === value ? null : value)
  }

  const toggleBool = (key: string) => {
    setParam(key, searchParams.get(key) === 'true' ? null : 'true')
  }

  const handleReset = () => {
    setMinArea('')
    setMaxArea('')
    setMaxRent('')
    router.push(pathname)
  }

  return (
    <aside className="space-y-6">
      {/* 정렬 */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-2">정렬</h3>
        <select
          value={searchParams.get('sort') ?? 'latest'}
          onChange={(e) => setParam('sort', e.target.value === 'latest' ? null : e.target.value)}
          className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="latest">최신순</option>
          <option value="rent_asc">임대료 낮은순</option>
          <option value="area_desc">면적 큰순</option>
        </select>
      </div>

      {/* 지역 */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-2">지역</h3>
        <select
          value={searchParams.get('sido') ?? ''}
          onChange={(e) => setParam('sido', e.target.value || null)}
          className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">전체 지역</option>
          {SIDO_OPTIONS.map((sido) => (
            <option key={sido} value={sido}>
              {sido}
            </option>
          ))}
        </select>
      </div>

      {/* 시설 유형 */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-2">시설 유형</h3>
        <div className="space-y-1.5">
          {FACILITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => toggleFacility(opt.value)}
              className={`w-full text-left text-sm px-3 py-1.5 rounded-lg transition-colors ${
                searchParams.get('facilityType') === opt.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 면적 범위 */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-2">면적 (㎡)</h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="최소"
            value={minArea}
            onChange={(e) => setMinArea(e.target.value)}
            onBlur={(e) => setParam('minArea', e.target.value || null)}
            className="w-full text-sm border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-gray-400 text-sm shrink-0">~</span>
          <input
            type="number"
            placeholder="최대"
            value={maxArea}
            onChange={(e) => setMaxArea(e.target.value)}
            onBlur={(e) => setParam('maxArea', e.target.value || null)}
            className="w-full text-sm border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* 임대료 */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-2">최대 임대료 (만원)</h3>
        <input
          type="number"
          placeholder="예: 500"
          value={maxRent}
          onChange={(e) => setMaxRent(e.target.value)}
          onBlur={(e) => setParam('maxRent', e.target.value || null)}
          className="w-full text-sm border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* 시설 조건 */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-2">시설 조건</h3>
        <div className="space-y-1.5">
          {[
            { key: 'hasDock', label: '도크' },
            { key: 'hasOffice', label: '사무실' },
            { key: 'hasCCTV', label: 'CCTV' },
            { key: 'hasParking', label: '주차장' },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={searchParams.get(key) === 'true'}
                onChange={() => toggleBool(key)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600"
              />
              <span className="text-sm text-gray-700">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* 초기화 */}
      <button
        onClick={handleReset}
        className="w-full text-sm text-gray-500 hover:text-gray-700 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
      >
        필터 초기화
      </button>
    </aside>
  )
}
