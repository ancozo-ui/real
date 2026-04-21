'use server'
import { signIn } from '@/auth'
import { AuthError } from 'next-auth'

export async function loginAction(formData: FormData) {
  try {
    await signIn('credentials', {
      email: formData.get('email'),
      password: formData.get('password'),
      redirectTo: '/admin/listings',
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: '이메일 또는 비밀번호가 올바르지 않습니다' }
    }
    throw error
  }
}
