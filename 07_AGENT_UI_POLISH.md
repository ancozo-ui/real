# 🎨 AGENT-07: UI Polish

## 역할
당신은 **UI Polish Agent**입니다.  
모든 Feature Agent의 작업을 통합하여 일관된 디자인 시스템을 적용하고  
반응형, 접근성, SEO, 성능을 최적화합니다.

---

## 📥 INPUT
- 모든 이전 에이전트의 완성 파일
- 현재 상태 감사: 불일치 컴포넌트, 빠진 모바일 처리 목록

## 📤 OUTPUT 계약
```
src/
  app/
    globals.css          ← 디자인 토큰, 글로벌 스타일
    layout.tsx           ← 루트 레이아웃 (메타, 폰트, 헤더/푸터)
  components/
    ui/                  ← 공통 UI 컴포넌트
      Button.tsx
      Badge.tsx
      Skeleton.tsx
      Toast.tsx
      Modal.tsx
    layout/
      Header.tsx         ← 공개 헤더 (로고, 내비, 모바일 메뉴)
      Footer.tsx         ← 공개 푸터 (뉴스레터 구독 폼 포함)
tailwind.config.ts       ← 완성된 디자인 시스템
```

---

## 🎨 디자인 시스템

### 컬러 팔레트
```typescript
// tailwind.config.ts
colors: {
  brand: {
    50:  '#f0f9ff',
    100: '#e0f2fe',
    500: '#0ea5e9',   // 주 색상
    600: '#0284c7',
    900: '#0c4a6e',
  },
  warehouse: {
    steel:  '#64748b',   // 창고/산업적 느낌
    iron:   '#374151',
    orange: '#f97316',   // 강조 (도크, CTA)
  }
}
```

### 타이포그래피
```typescript
fontFamily: {
  sans: ['Pretendard Variable', 'Pretendard', 'sans-serif'],
  mono: ['JetBrains Mono', 'monospace'],
}
```

### 공통 컴포넌트 규칙
- `Button`: variant (primary/secondary/ghost/danger) + size (sm/md/lg)
- `Badge`: FacilityType별 색상 매핑
- `Skeleton`: 목록 로딩 상태
- `Toast`: 성공/에러 알림

---

## 🛠️ 작업 목록

### 1. 디자인 감사 (Design Audit)
각 에이전트 산출물 검토:
- 일관되지 않은 버튼 스타일 통일
- 폼 에러 메시지 스타일 통일
- 로딩 상태 누락 확인 및 추가
- 다크모드 대응 여부 확인

### 2. 반응형 체크리스트
- [ ] 매물 목록: 모바일 1열, 태블릿 2열, 데스크톱 3열
- [ ] 필터: 모바일 하단 시트, 데스크톱 사이드바
- [ ] 이미지 갤러리: 스와이프 지원
- [ ] 관리자 테이블: 모바일 카드뷰 폴백

### 3. 성능 최적화
```typescript
// 이미지 최적화
<Image
  src={listing.images[0]?.url}
  alt={listing.addressMasked}
  fill
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  loading="lazy"
/>

// Cloudinary 자동 최적화 URL
const optimizedUrl = url.replace('/upload/', '/upload/f_auto,q_auto,w_800/')
```

### 4. 접근성
- 모든 이미지에 alt 텍스트
- 폼 라벨 연결
- 키보드 내비게이션
- 색상 대비 WCAG AA 기준

### 5. 404 / 에러 페이지
```
src/app/
  not-found.tsx
  error.tsx
  global-error.tsx
```

### 6. `robots.txt` + `sitemap.ts`
```typescript
// src/app/sitemap.ts
export default async function sitemap() {
  const listings = await prisma.listing.findMany({
    where: { status: 'PUBLISHED' },
    select: { id: true, updatedAt: true },
  })
  return [
    { url: 'https://yourdomain.com', lastModified: new Date() },
    { url: 'https://yourdomain.com/listings', lastModified: new Date() },
    ...listings.map((l) => ({
      url: `https://yourdomain.com/listings/${l.id}`,
      lastModified: l.updatedAt,
    })),
  ]
}
```

---

## ✅ 완료 기준
- [ ] Lighthouse 점수: Performance ≥ 80, Accessibility ≥ 90, SEO ≥ 90
- [ ] 모바일 375px에서 레이아웃 깨짐 없음
- [ ] 모든 이미지 next/image 사용
- [ ] 404/에러 페이지 존재
- [ ] sitemap.ts, robots.txt 생성

---

## 🔔 완료 신호
```
AGENT-07 완료 보고
✅ 디자인 시스템: 통일 완료
✅ 반응형: 375px~1440px 검증
✅ Lighthouse: [점수 기록]
👉 QA-AGENT 최종 통합 검증 요청
```
