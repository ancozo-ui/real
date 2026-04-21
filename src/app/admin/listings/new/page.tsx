'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { extractOcrAction, saveListing } from './actions'
import { maskAddress } from '@/lib/address'
import { sqmToPyeong, pyeongToSqm } from '@/lib/area'
import type { OcrExtractedData } from '@/lib/types/listing'

interface ImageEntry {
  url: string
  cloudinaryId: string
  order: number
}

interface FormValues {
  addressFull: string
  facilityType: string
  totalAreaSqm: string
  totalAreaPyeong: string
  rentAreaSqm: string
  rentAreaPyeong: string
  monthlyRent: string
  deposit: string
  maintenanceFee: string
  ceilingHeight: string
  floorLoad: string
  hasDock: boolean
  hasOffice: boolean
  hasCCTV: boolean
  hasParking: boolean
  availableFrom: string
  description: string
}

interface OcrMeta {
  hasWatermark?: boolean
  hasBrokerContact?: boolean
  confidence?: number
  rawData?: OcrExtractedData
}

const defaultForm: FormValues = {
  addressFull: '',
  facilityType: 'WAREHOUSE',
  totalAreaSqm: '',
  totalAreaPyeong: '',
  rentAreaSqm: '',
  rentAreaPyeong: '',
  monthlyRent: '',
  deposit: '',
  maintenanceFee: '',
  ceilingHeight: '',
  floorLoad: '',
  hasDock: false,
  hasOffice: false,
  hasCCTV: false,
  hasParking: false,
  availableFrom: '',
  description: '',
}

const FACILITY_TYPE_LABELS: Record<string, string> = {
  WAREHOUSE: '창고',
  LOGISTICS: '물류센터',
  COLD_CHAIN: '냉장/냉동',
  FULFILLMENT: '풀필먼트',
  FACTORY: '공장',
}

export default function NewListingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [images, setImages] = useState<ImageEntry[]>([])
  const [textInput, setTextInput] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractError, setExtractError] = useState<string | null>(null)
  const [ocrMeta, setOcrMeta] = useState<OcrMeta | null>(null)
  const [form, setForm] = useState<FormValues>(defaultForm)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isSaving, startSaving] = useTransition()

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setIsUploading(true)

    const newImages: ImageEntry[] = []
    for (const file of Array.from(files)) {
      const fd = new globalThis.FormData()
      fd.append('file', file)
      try {
        const res = await fetch('/api/upload', { method: 'POST', body: fd })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || '업로드 실패')
        }
        const data = await res.json()
        let imageUrl = data.url
        if (file.type === 'application/pdf') {
          imageUrl = data.url.replace('/upload/', '/upload/f_jpg,pg_1/')
        }
        newImages.push({
          url: imageUrl,
          cloudinaryId: data.cloudinaryId,
          order: images.length + newImages.length,
        })
      } catch (err) {
        console.error('Upload failed:', err)
      }
    }

    setImages((prev) => [...prev, ...newImages])
    setIsUploading(false)
  }

  const removeImage = (index: number) => {
    setImages((prev) =>
      prev.filter((_, i) => i !== index).map((img, i) => ({ ...img, order: i }))
    )
  }

  const handleExtract = async () => {
    setIsExtracting(true)
    setExtractError(null)

    try {
      const fd = new globalThis.FormData()
      if (textInput.trim()) {
        fd.append('text', textInput)
      } else {
        images.forEach((img) => fd.append('imageUrls', img.url))
      }

      const result = await extractOcrAction(fd)

      setForm((prev) => ({
        ...prev,
        addressFull: result.addressFull || prev.addressFull,
        facilityType: result.facilityType || prev.facilityType,
        totalAreaSqm: result.totalAreaSqm?.toString() ?? prev.totalAreaSqm,
        totalAreaPyeong: result.totalAreaPyeong?.toString() ?? prev.totalAreaPyeong,
        rentAreaSqm: result.rentAreaSqm?.toString() ?? prev.rentAreaSqm,
        rentAreaPyeong: result.rentAreaPyeong?.toString() ?? prev.rentAreaPyeong,
        monthlyRent: result.monthlyRent?.toString() ?? prev.monthlyRent,
        deposit: result.deposit?.toString() ?? prev.deposit,
        maintenanceFee: result.maintenanceFee?.toString() ?? prev.maintenanceFee,
        ceilingHeight: result.ceilingHeight?.toString() ?? prev.ceilingHeight,
        floorLoad: result.floorLoad?.toString() ?? prev.floorLoad,
        hasDock: result.hasDock ?? prev.hasDock,
        hasOffice: result.hasOffice ?? prev.hasOffice,
        hasCCTV: result.hasCCTV ?? prev.hasCCTV,
        hasParking: result.hasParking ?? prev.hasParking,
        availableFrom: result.availableFrom ?? prev.availableFrom,
        description: result.description ?? prev.description,
      }))

      setOcrMeta({
        hasWatermark: result.hasWatermark,
        hasBrokerContact: result.hasBrokerContact,
        confidence: result.confidence,
        rawData: result,
      })
    } catch {
      setExtractError('자동 추출 실패, 직접 입력하세요')
    } finally {
      setIsExtracting(false)
      setStep(2)
    }
  }

  const handleTotalSqmChange = (val: string) => {
    const num = parseFloat(val)
    setForm((prev) => ({
      ...prev,
      totalAreaSqm: val,
      totalAreaPyeong: isNaN(num) ? prev.totalAreaPyeong : String(sqmToPyeong(num)),
    }))
  }

  const handleTotalPyeongChange = (val: string) => {
    const num = parseFloat(val)
    setForm((prev) => ({
      ...prev,
      totalAreaPyeong: val,
      totalAreaSqm: isNaN(num) ? prev.totalAreaSqm : String(pyeongToSqm(num)),
    }))
  }

  const handleRentSqmChange = (val: string) => {
    const num = parseFloat(val)
    setForm((prev) => ({
      ...prev,
      rentAreaSqm: val,
      rentAreaPyeong: isNaN(num) ? prev.rentAreaPyeong : String(sqmToPyeong(num)),
    }))
  }

  const handleRentPyeongChange = (val: string) => {
    const num = parseFloat(val)
    setForm((prev) => ({
      ...prev,
      rentAreaPyeong: val,
      rentAreaSqm: isNaN(num) ? prev.rentAreaSqm : String(pyeongToSqm(num)),
    }))
  }

  const handleDragStart = (index: number) => (e: React.DragEvent) => {
    e.dataTransfer.setData('dragIndex', String(index))
  }

  const handleDrop = (targetIndex: number) => (e: React.DragEvent) => {
    e.preventDefault()
    const sourceIndex = parseInt(e.dataTransfer.getData('dragIndex'))
    if (sourceIndex === targetIndex) return
    setImages((prev) => {
      const next = [...prev]
      const [moved] = next.splice(sourceIndex, 1)
      next.splice(targetIndex, 0, moved)
      return next.map((img, i) => ({ ...img, order: i }))
    })
    setDragOverIndex(null)
  }

  const handleSave = () => {
    setSaveError(null)
    const fd = new globalThis.FormData()

    Object.entries(form).forEach(([key, val]) => {
      fd.append(key, String(val))
    })
    fd.append('images', JSON.stringify(images))
    fd.append('hasWatermark', String(ocrMeta?.hasWatermark ?? false))
    if (ocrMeta?.rawData) {
      fd.append('ocrRawData', JSON.stringify(ocrMeta.rawData))
    }

    startSaving(async () => {
      try {
        await saveListing(fd)
      } catch (err: unknown) {
        if (err instanceof Error && err.message !== 'NEXT_REDIRECT') {
          setSaveError(err.message)
        }
      }
    })
  }

  const inputClass =
    'mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
  const labelClass = 'block text-sm font-medium text-gray-700'

  if (step === 1) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">새 매물 등록</h1>
          <div className="flex gap-2 text-sm">
            <span className="px-3 py-1 bg-blue-600 text-white rounded-full font-medium">1 자료 업로드</span>
            <span className="px-3 py-1 bg-gray-200 text-gray-500 rounded-full">2 정보 확인</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-4">
          <h2 className="text-base font-semibold text-gray-900 mb-4">이미지 / PDF 업로드</h2>

          <label
            htmlFor="file-input"
            className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
          >
            <svg className="w-10 h-10 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm text-gray-600">클릭하거나 파일을 드래그하여 업로드</p>
            <p className="text-xs text-gray-400 mt-1">JPEG, PNG, WEBP, PDF (최대 20MB)</p>
          </label>
          <input
            id="file-input"
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="hidden"
            onChange={(e) => handleFileUpload(e.target.files)}
          />

          {isUploading && (
            <div className="flex items-center gap-2 mt-3 text-sm text-blue-600">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              업로드 중...
            </div>
          )}

          {images.length > 0 && (
            <div className="grid grid-cols-5 gap-2 mt-4">
              {images.map((img, i) => (
                <div key={img.cloudinaryId} className="relative group">
                  <img
                    src={img.url}
                    alt={`업로드 이미지 ${i + 1}`}
                    className="w-full h-20 object-cover rounded border border-gray-200"
                  />
                  {i === 0 && (
                    <span className="absolute bottom-0 left-0 right-0 text-center text-xs bg-blue-600 text-white py-0.5 rounded-b">
                      썸네일
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-base font-semibold text-gray-900 mb-3">또는 텍스트 붙여넣기</h2>
          <textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="임대 정보 텍스트를 여기에 붙여넣으세요..."
            className="w-full h-36 border border-gray-300 rounded-lg p-3 text-sm resize-none focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex justify-between">
          <button
            type="button"
            onClick={() => { setOcrMeta(null); setStep(2) }}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            직접 입력
          </button>
          <button
            type="button"
            onClick={handleExtract}
            disabled={isExtracting || isUploading || (images.length === 0 && !textInput.trim())}
            className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExtracting ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                AI가 정보를 분석하고 있습니다...
              </>
            ) : (
              'OCR 자동 추출 →'
            )}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">새 매물 등록</h1>
        <div className="flex gap-2 text-sm">
          <button
            type="button"
            onClick={() => setStep(1)}
            className="px-3 py-1 bg-gray-200 text-gray-600 rounded-full hover:bg-gray-300"
          >
            1 자료 업로드
          </button>
          <span className="px-3 py-1 bg-blue-600 text-white rounded-full font-medium">2 정보 확인</span>
        </div>
      </div>

      {ocrMeta?.hasWatermark && (
        <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-lg p-3 mb-3 text-sm text-orange-800">
          <span>⚠️</span>
          <span>워터마크가 감지되었습니다. 이미지 확인 후 게시해주세요.</span>
        </div>
      )}
      {ocrMeta?.hasBrokerContact && (
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3 text-sm text-blue-800">
          <span>ℹ️</span>
          <span>중개사 연락처 정보가 감지되어 제외되었습니다.</span>
        </div>
      )}
      {ocrMeta?.confidence !== undefined && ocrMeta.confidence < 0.7 && (
        <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3 text-sm text-yellow-800">
          <span>⚠️</span>
          <span>OCR 신뢰도가 낮습니다 ({(ocrMeta.confidence * 100).toFixed(0)}%). 일부 정보를 수동으로 확인하세요.</span>
        </div>
      )}
      {extractError && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3 mb-3 text-sm text-red-800">
          <span>⚠️</span>
          <span>{extractError}</span>
        </div>
      )}
      {saveError && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3 mb-3 text-sm text-red-800">
          <span>❌</span>
          <span>저장 실패: {saveError}</span>
        </div>
      )}

      <div className="space-y-6">
        {/* 기본 정보 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">기본 정보</h2>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>주소 *</label>
              <input
                type="text"
                value={form.addressFull}
                onChange={(e) => setForm((p) => ({ ...p, addressFull: e.target.value }))}
                placeholder="예: 경기도 이천시 마장면 현암리 123-4번지"
                className={inputClass}
              />
              {form.addressFull && (
                <p className="mt-1 text-xs text-gray-500">
                  공개 표시: <span className="font-medium text-gray-700">{maskAddress(form.addressFull)}</span>
                </p>
              )}
            </div>

            <div>
              <label className={labelClass}>시설 유형</label>
              <select
                value={form.facilityType}
                onChange={(e) => setForm((p) => ({ ...p, facilityType: e.target.value }))}
                className={inputClass}
              >
                {Object.entries(FACILITY_TYPE_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 면적 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">면적</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>총면적 (㎡)</label>
              <input
                type="number"
                step="0.1"
                value={form.totalAreaSqm}
                onChange={(e) => handleTotalSqmChange(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>총면적 (평)</label>
              <input
                type="number"
                step="0.1"
                value={form.totalAreaPyeong}
                onChange={(e) => handleTotalPyeongChange(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>임대면적 (㎡)</label>
              <input
                type="number"
                step="0.1"
                value={form.rentAreaSqm}
                onChange={(e) => handleRentSqmChange(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>임대면적 (평)</label>
              <input
                type="number"
                step="0.1"
                value={form.rentAreaPyeong}
                onChange={(e) => handleRentPyeongChange(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* 임대 조건 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">임대 조건 (단위: 만원)</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>월임대료</label>
              <input
                type="number"
                value={form.monthlyRent}
                onChange={(e) => setForm((p) => ({ ...p, monthlyRent: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>보증금</label>
              <input
                type="number"
                value={form.deposit}
                onChange={(e) => setForm((p) => ({ ...p, deposit: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>관리비</label>
              <input
                type="number"
                value={form.maintenanceFee}
                onChange={(e) => setForm((p) => ({ ...p, maintenanceFee: e.target.value }))}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* 시설 상세 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">시설 상세</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className={labelClass}>천고 (m)</label>
              <input
                type="number"
                step="0.1"
                value={form.ceilingHeight}
                onChange={(e) => setForm((p) => ({ ...p, ceilingHeight: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>바닥하중 (t/㎡)</label>
              <input
                type="number"
                step="0.1"
                value={form.floorLoad}
                onChange={(e) => setForm((p) => ({ ...p, floorLoad: e.target.value }))}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'hasDock', label: '도크' },
              { key: 'hasOffice', label: '사무실' },
              { key: 'hasCCTV', label: 'CCTV' },
              { key: 'hasParking', label: '주차장' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form[key as keyof FormValues] as boolean}
                  onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600"
                />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 입주 및 설명 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">입주 및 설명</h2>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>입주가능일</label>
              <input
                type="date"
                value={form.availableFrom}
                onChange={(e) => setForm((p) => ({ ...p, availableFrom: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>설명</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                rows={4}
                className={`${inputClass} resize-none`}
                placeholder="특이사항, 추가 정보 등..."
              />
            </div>
          </div>
        </div>

        {/* 이미지 정렬 */}
        {images.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-2">이미지 순서</h2>
            <p className="text-xs text-gray-500 mb-4">드래그하여 순서를 변경하세요. 첫 번째 이미지가 썸네일입니다.</p>
            <div className="flex flex-wrap gap-3">
              {images.map((img, i) => (
                <div
                  key={img.cloudinaryId}
                  draggable
                  onDragStart={handleDragStart(i)}
                  onDragOver={(e) => { e.preventDefault(); setDragOverIndex(i) }}
                  onDrop={handleDrop(i)}
                  onDragLeave={() => setDragOverIndex(null)}
                  className={`relative cursor-grab active:cursor-grabbing rounded-lg overflow-hidden border-2 transition-colors ${
                    dragOverIndex === i ? 'border-blue-400' : 'border-gray-200'
                  }`}
                >
                  <img
                    src={img.url}
                    alt={`이미지 ${i + 1}`}
                    className="w-24 h-24 object-cover"
                    draggable={false}
                  />
                  {i === 0 && (
                    <span className="absolute bottom-0 left-0 right-0 text-center text-xs bg-blue-600 text-white py-0.5">
                      썸네일
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between mt-6">
        <button
          type="button"
          onClick={() => router.push('/admin/listings')}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          취소
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving || !form.addressFull.trim()}
          className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              저장 중...
            </>
          ) : (
            '매물 저장'
          )}
        </button>
      </div>
    </div>
  )
}
