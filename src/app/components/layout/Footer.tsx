import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-8">
          <div>
            <p className="text-white font-bold text-lg mb-2">LOGIS</p>
            <p className="text-sm leading-relaxed">
              신뢰할 수 있는 물류 부동산 임대 플랫폼.<br />
              전국 창고·공장·물류센터를 한곳에서.
            </p>
          </div>
          <div>
            <p className="text-white text-sm font-semibold mb-3">서비스</p>
            <ul className="space-y-2 text-sm">
              <li><Link href="/listings" className="hover:text-white transition-colors">매물 목록</Link></li>
              <li><Link href="/listings?facilityType=WAREHOUSE" className="hover:text-white transition-colors">창고 임대</Link></li>
              <li><Link href="/listings?facilityType=COLD_CHAIN" className="hover:text-white transition-colors">냉동창고</Link></li>
              <li><Link href="/news" className="hover:text-white transition-colors">물류 뉴스</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-white text-sm font-semibold mb-3">정보</p>
            <ul className="space-y-2 text-sm">
              <li><Link href="/admin" className="hover:text-white transition-colors">관리자</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 text-xs text-center text-gray-500">
          <p>© {new Date().getFullYear()} LOGIS. All rights reserved.</p>
          <p className="mt-1">물류 부동산 임대 플랫폼 · 신뢰할 수 있는 창고 임대 정보</p>
        </div>
      </div>
    </footer>
  )
}
