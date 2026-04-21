'use client'

import { useActionState, useRef } from 'react'

interface Props {
  listingId: string
}

type State = { success: boolean; error?: string } | null

async function submitInquiry(_prev: State, formData: FormData): Promise<State> {
  const payload = {
    companyName: formData.get('companyName'),
    contactName: formData.get('contactName'),
    phone: formData.get('phone'),
    email: formData.get('email'),
    message: formData.get('message'),
    listingId: formData.get('listingId'),
    _hp: formData.get('_hp'), // honeypot
  }

  const res = await fetch('/api/inquiry', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (res.ok) return { success: true }

  const data = await res.json().catch(() => ({}))
  return { success: false, error: data.error ?? '오류가 발생했습니다. 다시 시도해주세요.' }
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (digits.length <= 3) return digits
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  if (digits.startsWith('02')) {
    // 서울 지역번호
    if (digits.length <= 9) return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`
    return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6, 10)}`
  }
  if (digits.length <= 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`
}

export default function InquiryForm({ listingId }: Props) {
  const [state, action, isPending] = useActionState(submitInquiry, null)
  const phoneRef = useRef<HTMLInputElement>(null)

  if (state?.success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
        <div className="text-3xl mb-3">✅</div>
        <p className="text-green-800 font-semibold text-lg">문의가 접수되었습니다</p>
        <p className="text-green-600 text-sm mt-1">담당자가 확인 후 연락드리겠습니다.</p>
      </div>
    )
  }

  return (
    <form action={action} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      {/* honeypot — 봇 방지용 hidden 필드, 사람은 보이지 않음 */}
      <input type="text" name="_hp" defaultValue="" className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <input type="hidden" name="listingId" value={listingId} />

      {state?.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {state.error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            회사명 <span className="text-red-500">*</span>
          </label>
          <input
            name="companyName"
            type="text"
            required
            maxLength={100}
            placeholder="(주)물류회사"
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            담당자명 <span className="text-red-500">*</span>
          </label>
          <input
            name="contactName"
            type="text"
            required
            maxLength={50}
            placeholder="홍길동"
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            연락처 <span className="text-red-500">*</span>
          </label>
          <input
            ref={phoneRef}
            name="phone"
            type="tel"
            required
            placeholder="010-0000-0000"
            onChange={(e) => {
              const formatted = formatPhone(e.target.value)
              e.target.value = formatted
            }}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            이메일 <span className="text-red-500">*</span>
          </label>
          <input
            name="email"
            type="email"
            required
            placeholder="example@company.com"
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          문의 내용
        </label>
        <textarea
          name="message"
          rows={4}
          maxLength={2000}
          placeholder="원하시는 면적, 입주 희망일, 기타 요청사항을 자유롭게 작성해주세요."
          className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isPending ? '제출 중...' : '문의 제출'}
      </button>

      <p className="text-xs text-gray-400 text-center">
        <span className="text-red-500">*</span> 필수 입력 항목
      </p>
    </form>
  )
}
