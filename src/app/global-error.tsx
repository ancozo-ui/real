'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="ko">
      <body>
        <div className="min-h-screen bg-white flex items-center justify-center px-4">
          <div className="text-center">
            <p className="text-5xl font-bold text-gray-200">500</p>
            <h1 className="mt-4 text-xl font-bold text-gray-900">서버 오류가 발생했습니다</h1>
            <p className="mt-2 text-sm text-gray-500">잠시 후 다시 시도해주세요.</p>
            <button
              onClick={reset}
              className="mt-6 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              다시 시도
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
