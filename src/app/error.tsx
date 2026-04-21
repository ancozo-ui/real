'use client'

import { useEffect } from 'react'
import Button from '@/app/components/ui/Button'

export default function Error({
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
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-5xl font-bold text-gray-200">오류</p>
        <h1 className="mt-4 text-xl font-bold text-gray-900">문제가 발생했습니다</h1>
        <p className="mt-2 text-sm text-gray-500">
          일시적인 오류입니다. 잠시 후 다시 시도해주세요.
        </p>
        <div className="mt-6">
          <Button onClick={reset}>다시 시도</Button>
        </div>
      </div>
    </div>
  )
}
