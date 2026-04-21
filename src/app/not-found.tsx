import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-6xl font-bold text-gray-200">404</p>
        <h1 className="mt-4 text-2xl font-bold text-gray-900">페이지를 찾을 수 없습니다</h1>
        <p className="mt-2 text-sm text-gray-500">
          요청하신 페이지가 존재하지 않거나 이동되었습니다.
        </p>
        <div className="mt-8 flex gap-3 justify-center">
          <Link
            href="/"
            className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            홈으로
          </Link>
          <Link
            href="/listings"
            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            매물 목록
          </Link>
        </div>
      </div>
    </div>
  )
}
