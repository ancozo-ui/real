'use client'

import { useState } from 'react'

interface Props {
  subscriberCount: number
}

export default function NewsletterSendForm({ subscriberCount }: Props) {
  const [subject, setSubject] = useState('')
  const [content, setContent] = useState('')
  const [preview, setPreview] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success?: boolean; message?: string } | null>(null)

  async function handleSend() {
    if (!subject.trim() || !content.trim()) return
    if (!confirm(`${subscriberCount}명에게 뉴스레터를 발송합니다. 계속하시겠습니까?`)) return

    setLoading(true)
    setResult(null)

    try {
      const res = await fetch('/api/admin/newsletter/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, content }),
      })

      const data = await res.json()
      if (!res.ok) {
        setResult({ success: false, message: data.error ?? '발송 실패' })
      } else {
        setResult({ success: true, message: data.message })
      }
    } catch {
      setResult({ success: false, message: '서버 오류가 발생했습니다' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
      {result && (
        <div
          className={`p-3 rounded text-sm ${
            result.success
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-600'
          }`}
        >
          {result.message}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          제목 <span className="text-red-500">*</span>
        </label>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="뉴스레터 제목을 입력하세요"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          내용 <span className="text-red-500">*</span>
          <span className="text-gray-400 font-normal ml-1">(HTML 또는 텍스트, {'{{name}}'} 으로 이름 삽입)</span>
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={12}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="뉴스레터 내용을 입력하세요. {{name}}은 구독자 이름으로 치환됩니다."
        />
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setPreview(!preview)}
          disabled={!content.trim()}
          className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
        >
          {preview ? '편집으로 돌아가기' : '미리보기'}
        </button>
        <button
          type="button"
          onClick={handleSend}
          disabled={loading || !subject.trim() || !content.trim()}
          className="px-6 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? '발송 중...' : `${subscriberCount}명에게 발송`}
        </button>
      </div>

      {preview && content && (
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-700 mb-2">미리보기</p>
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <p className="text-xs text-gray-500 mb-2">제목: {subject || '(제목 없음)'}</p>
            <div
              className="text-sm text-gray-700"
              dangerouslySetInnerHTML={{
                __html: content.replace('{{name}}', '구독자'),
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
