'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { optimizeCloudinaryUrl } from '@/lib/cloudinaryUrl'

interface ImageGalleryProps {
  images: { url: string; order: number }[]
  alt: string
}

export default function ImageGallery({ images, alt }: ImageGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const sorted = [...images]
    .sort((a, b) => a.order - b.order)
    .map((img) => ({ ...img, url: optimizeCloudinaryUrl(img.url, 1200) }))

  const closeLightbox = useCallback(() => setLightboxIndex(null), [])
  const goNext = useCallback(
    () => setLightboxIndex((prev) => (prev !== null ? (prev + 1) % sorted.length : null)),
    [sorted.length]
  )
  const goPrev = useCallback(
    () => setLightboxIndex((prev) => (prev !== null ? (prev - 1 + sorted.length) % sorted.length : null)),
    [sorted.length]
  )

  useEffect(() => {
    if (lightboxIndex === null) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox()
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowLeft') goPrev()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [lightboxIndex, closeLightbox, goNext, goPrev])

  if (sorted.length === 0) return null

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {sorted.map((img, i) => (
          <button
            key={img.url}
            onClick={() => setLightboxIndex(i)}
            className={`relative overflow-hidden rounded-lg bg-gray-100 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              i === 0 ? 'col-span-2 row-span-2' : ''
            }`}
            style={{ aspectRatio: i === 0 ? '4/3' : '1' }}
          >
            <Image
              src={img.url}
              alt={`${alt} ${i + 1}`}
              fill
              className="object-cover hover:scale-105 transition-transform duration-200"
              sizes="(max-width: 768px) 50vw, 25vw"
            />
          </button>
        ))}
      </div>

      {lightboxIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={closeLightbox}
        >
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
            onClick={closeLightbox}
            aria-label="닫기"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {sorted.length > 1 && (
            <>
              <button
                className="absolute left-4 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
                onClick={(e) => { e.stopPropagation(); goPrev() }}
                aria-label="이전"
              >
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                className="absolute right-4 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
                onClick={(e) => { e.stopPropagation(); goNext() }}
                aria-label="다음"
              >
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          <div
            className="relative max-w-4xl w-full mx-16"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative" style={{ aspectRatio: '16/10' }}>
              <Image
                src={sorted[lightboxIndex].url}
                alt={`${alt} ${lightboxIndex + 1}`}
                fill
                className="object-contain"
                sizes="90vw"
              />
            </div>
            <p className="text-center text-white/50 text-sm mt-3">
              {lightboxIndex + 1} / {sorted.length}
            </p>
          </div>
        </div>
      )}
    </>
  )
}
