import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'LOGIS | 물류창고 임대 플랫폼',
    template: '%s | LOGIS',
  },
  description: '전국 물류창고·공장·냉동창고 임대 매물을 한곳에서. 신뢰할 수 있는 물류 부동산 정보.',
  keywords: ['물류창고', '창고임대', '물류센터', '냉동창고', '공장임대', '풀필먼트'],
  openGraph: {
    siteName: 'LOGIS',
    locale: 'ko_KR',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
