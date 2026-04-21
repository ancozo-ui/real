'use client'

import { useState, useTransition, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { maskAddress } from '@/lib/address'
import { sqmToPyeong, pyeongToSqm } from '@/lib/area'
import { updateListing, deleteListing, updateListingStatus } from './actions'
import type { ListingStatus, FacilityType } from '@prisma/client'

interface ImageEntry {
  id?: string
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
  hasWatermark: boolean
}

const FACILITY_TYPE_LABELS: Record<string, string> = {
  WAREHOUSE: '창고',
  LOGISTICS: '물류센터',
  COLD_CHAIN: '냉장/냉동',
  FULFILLMENT: '풀필먼트',
  FACTORY: '공장',
}

const STATUS_LABELS: Record<ListingStatus, string> = {
  DRAFT: '초안',
  PUBLISHED: '공개',
  ARCHIVED: '숨김',
}

const STATUS_NEXT: Record<ListingStatus, ListingStatus> = {
  DRAFT: 'PUBLISHED',
  PUBLISHED: 'ARCHIVED',
  ARCHIVED: 'DRAFT',
}

export default function ListingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<ListingStatus>('DRAFT')
  const [images, setImages] = useState<ImageEntry[]>([])
  const [form, setForm] = useState<FormValues>({
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
    hasWatermark: false,
  })
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isSaving, startSaving] = useTransition()
  const [isDeleting, startDeleting] = useTransition()
  const [isStatusChanging, startStatusChanging] = useTransition()

  useEffect(() => {
    fetch(`/api/admin/listings/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setError(data.error); return }
        const listing = data.listing
        setStatus(listing.status)
        setImages(
          listing.images.map((img: { id: string; url: string; cloudinaryId: string; order: number }) => ({
            id: img.id,
            url: img.url,
            cloudinaryId: img.cloudinaryId,
            order: img.order,
          }))
        )
        const availableFrom = listing.availableFrom
          ? new Date(listing.availableFrom).toISOString().split('T')[0]
          : ''
        setForm({
          addressFull: listing.addressFull ?? '',
          facilityType: listing.facilityType ?? 'WAREHOUSE',
          totalAreaSqm: listing.totalAreaSqm?.toString() ?? '',
          totalAreaPyeong: listing.totalAreaPyeong?.toString() ?? '',
          rentAreaSqm: listing.rentAreaSqm?.toString() ?? '',
          rentAreaPyeong: listing.rentAreaPyeong?.toString() ?? '',
          monthlyRent: listing.monthlyRent?.toString() ?? '',
          deposit: listing.deposit?.toString() ?? '',
          maintenanceFee: listing.maintenanceFee?.toString() ?? '',
          ceilingHeight: listing.ceilingHeight?.toString() ?? '',
          floorLoad: listing.floorLoad?.toString() ?? '',
          hasDock: listing.hasDock ?? false,
          hasOffice: listing.hasOffice ?? false,
          hasCCTV: listing.hasCCTV ?? false,
          hasParking: listing.hasParking ?? false,
          availableFrom,
          description: listing.description ?? '',
          hasWatermark: listing.hasWatermark ?? false,
        })
      })
      .catch(() => setError('매물 정보를 불러오지 못했습니다.'))
      .finally(() => setIsLoading(false))
  }, [id])

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setIsUploading(true)
    const newImages: ImageEntry[] = []
    for (const file of Array.from(files)) {
      const fd = new globalThis.FormData()
      fd.append('file', file)
      try {
        const res = await fetch('/api/upload', { method: 'POST', body: fd })
        if (!res.ok) throw new Error('업로드 실패')
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

  const handleSave = () => {
    setSaveError(null)
    const fd = new globalThis.FormData()
    Object.entries(form).forEach(([key, val]) => fd.append(key, String(val)))
    fd.append('images', JSON.stringify(images))

    startSaving(async () => {
      try {
        await updateListing(id, fd)
      } catch (err: unknown) {
        if (err instanceof Error && err.message !== 'NEXT_REDIRECT') {
          setSaveError(err.message)
        }
      }
    })
  }

  const handleDelete = () => {
    if (!confirm('정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return
    startDeleting(async () => {
      try {
        await deleteListing(id)
      } catch (err: unknown) {
        if (err instanceof Error && err.message !== 'NEXT_REDIRECT') {
          setSaveError(err.message)
        }
      }
    })
  }

  const handleStatusChange = () => {
    startStatusChanging(async () => {
      await updateListingStatus(id, STATUS_NEXT[status])
      setStatus(STATUS_NEXT[status])
    })
  }

  const inputClass =
    'mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
  const labelClass = 'block text-sm font-medium text-gray-700'

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <svg className="animate-spin h-8 w-8 text-blue-600" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">{error}</div>
        <button onClick={() => router.push('/admin/listings')} className="mt-4 text-sm text-blue-600 hover:underline">
          ← 목록으로 돌아가기
        </button>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/admin/listings')}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-gray-900">매물 수정</h1>
          <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
            status === 'PUBLISHED' ? 'bg-green-100 text-green-700'
            : status === 'ARCHIVED' ? 'bg-red-100 text-red-700'
            : 'bg-gray-100 text-gray-700'
          }`}>
            {STATUS_LABELS[status]}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleStatusChange}
            disabled={isStatusChanging}
            className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            {status === 'DRAFT' ? '공개하기' : status === 'PUBLISHED' ? '숨기기' : '초안으로'}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-3 py-1.5 text-xs font-medium text-red-700 bg-white border border-red-300 rounded-lg hover:bg-red-50 disabled:opacity-50"
          >
            삭제
          </button>
        </div>
      </div>

      {saveError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-800">
          ❌ {saveError}
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
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="hasWatermark"
                checked={form.hasWatermark}
                onChange={(e) => setForm((p) => ({ ...p, hasWatermark: e.target.checked }))}
                className="w-4 h-4 rounded border-gray-300 text-orange-500"
              />
              <label htmlFor="hasWatermark" className="text-sm text-gray-700">워터마크 포함</label>
            </div>
          </div>
        </div>

        {/* 면적 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">면적</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>총면적 (㎡)</label>
              <input type="number" step="0.1" value={form.totalAreaSqm} onChange={(e) => handleTotalSqmChange(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>총면적 (평)</label>
              <input type="number" step="0.1" value={form.totalAreaPyeong} onChange={(e) => handleTotalPyeongChange(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>임대면적 (㎡)</label>
              <input type="number" step="0.1" value={form.rentAreaSqm} onChange={(e) => handleRentSqmChange(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>임대면적 (평)</label>
              <input type="number" step="0.1" value={form.rentAreaPyeong} onChange={(e) => handleRentPyeongChange(e.target.value)} className={inputClass} />
            </div>
          </div>
        </div>

        {/* 임대 조건 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">임대 조건 (단위: 만원)</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>월임대료</label>
              <input type="number" value={form.monthlyRent} onChange={(e) => setForm((p) => ({ ...p, monthlyRent: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>보증금</label>
              <input type="number" value={form.deposit} onChange={(e) => setForm((p) => ({ ...p, deposit: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>관리비</label>
              <input type="number" value={form.maintenanceFee} onChange={(e) => setForm((p) => ({ ...p, maintenanceFee: e.target.value }))} className={inputClass} />
            </div>
          </div>
        </div>

        {/* 시설 상세 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">시설 상세</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className={labelClass}>천고 (m)</label>
              <input type="number" step="0.1" value={form.ceilingHeight} onChange={(e) => setForm((p) => ({ ...p, ceilingHeight: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>바닥하중 (t/㎡)</label>
              <input type="number" step="0.1" value={form.floorLoad} onChange={(e) => setForm((p) => ({ ...p, floorLoad: e.target.value }))} className={inputClass} />
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
              <input type="date" value={form.availableFrom} onChange={(e) => setForm((p) => ({ ...p, availableFrom: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>설명</label>
              <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={4} className={`${inputClass} resize-none`} />
            </div>
          </div>
        </div>

        {/* 이미지 관리 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-2">이미지 관리</h2>
          <p className="text-xs text-gray-500 mb-4">드래그하여 순서 변경. 첫 번째 이미지가 썸네일입니다.</p>

          <label
            htmlFor="edit-file-input"
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 mb-4"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            이미지 추가
          </label>
          <input
            id="edit-file-input"
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="hidden"
            onChange={(e) => handleFileUpload(e.target.files)}
          />
          {isUploading && <p className="text-xs text-blue-600 mb-2">업로드 중...</p>}

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
                <img src={img.url} alt={`이미지 ${i + 1}`} className="w-24 h-24 object-cover" draggable={false} />
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
          ) : '수정 저장'}
        </button>
      </div>
    </div>
  )
}
