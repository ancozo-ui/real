'use client'
import { useActionState } from 'react'
import { loginAction } from './actions'

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string } | undefined, formData: FormData) => {
      const result = await loginAction(formData)
      return result
    },
    undefined
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">관리자 로그인</h1>

        <form action={formAction} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              이메일
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
              placeholder="admin@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              비밀번호
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
              placeholder="••••••••"
            />
          </div>

          {state?.error && (
            <p className="text-sm text-red-600">{state.error}</p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-2 px-4 bg-gray-900 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isPending ? '로그인 중...' : '로그인'}
          </button>
        </form>
      </div>
    </div>
  )
}
