# 🚀 물류창고 임대차 플랫폼 — 하네스 개발 가이드

## 파일 구성
```
00_ORCHESTRATOR.md        ← 총괄 지휘, 여기서 시작
01_AGENT_FOUNDATION.md    ← Phase 1 (단독 실행)
02_AGENT_AUTH_UPLOAD.md   ← Phase 2 (병렬)
03_AGENT_OCR.md           ← Phase 2 (병렬)
04_05_06_AGENTS.md        ← Phase 3 (병렬, 3개 에이전트 포함)
07_AGENT_UI_POLISH.md     ← Phase 4 (순차)
QA_AGENT.md               ← 각 단계 완료 시 호출
```

## 사용 방법

### 방법 A — Claude.ai에서 직접 사용
각 파일 내용을 새 대화에서 Claude에게 붙여넣기:
```
1. 새 대화 열기
2. 00_ORCHESTRATOR.md 내용 붙여넣기
3. Claude가 AGENT-01 호출 지시 → 01_AGENT_FOUNDATION.md 붙여넣기
4. 완료 보고 받으면 QA_AGENT.md 붙여넣기 (QA-01 범위 지정)
5. QA 통과 후 02 + 03 병렬 진행...
```

### 방법 B — Claude Code (권장, 진짜 병렬)
```bash
# 별도 터미널 3개에서 동시 실행 (Phase 2 예시)
terminal 1: claude < 02_AGENT_AUTH_UPLOAD.md
terminal 2: claude < 03_AGENT_OCR.md
terminal 3: # QA 대기

# 둘 다 완료되면
terminal 3: claude < QA_AGENT.md  # QA-02, QA-03 범위 지정
```

### 방법 C — 오케스트레이터 스크립트 (고급)
```python
# 별도 요청 시 Orchestrator 자동화 스크립트 생성 가능
# Anthropic API로 각 에이전트를 병렬 호출하는 Python 스크립트
```

## 실행 순서 다이어그램
```
START
  │
  ▼
[AGENT-01] Foundation
  │
  ▼
[QA-AGENT] QA-01 검증
  │ 통과
  ▼
┌─────────────────────┐
│  [AGENT-02] Auth   │  ←── 병렬
│  [AGENT-03] OCR    │  ←── 병렬
└─────────────────────┘
  │
  ▼
[QA-AGENT] QA-02 + QA-03
  │ 통과
  ▼
┌──────────────────────────────┐
│  [AGENT-04] Public Pages    │  ←── 병렬
│  [AGENT-05] Inquiry         │  ←── 병렬
│  [AGENT-06] News & RSS      │  ←── 병렬
└──────────────────────────────┘
  │
  ▼
[QA-AGENT] QA-04 + QA-05 + QA-06
  │ 통과
  ▼
[AGENT-07] UI Polish
  │
  ▼
[QA-AGENT] QA-07 + 최종 통합 검증 (L4)
  │ 통과
  ▼
🎉 배포 준비 완료
```

## QA 이슈 발생 시
```
CRITICAL → 즉시 해당 에이전트에 수정 지시 → QA 재호출
HIGH     → 24시간 내 수정 → 다음 Phase 진행 전 해결
MEDIUM   → 추적 목록에 추가, 배포 전 해결
LOW      → 별도 이슈로 관리
```

## GitHub
`https://github.com/ancozo-ui/real.git`

## Supabase
- Project ID: `tyezkwvhfxdokidcbhct`
- Region: `ap-northeast-1` (도쿄)
- DB URL 형식: `postgresql://postgres.tyezkwvhfxdokidcbhct:[PASSWORD]@aws-1-ap-northeast-1.pooler.supabase.com`
- ⚠️ `[PASSWORD]` 는 `.env` 파일에만 직접 입력 (채팅창 입력 금지)
