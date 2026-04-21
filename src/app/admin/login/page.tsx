import { redirectIfAuthenticated } from '@/proxy'
import LoginForm from './LoginForm'

export default async function LoginPage() {
  await redirectIfAuthenticated('/admin/listings')
  return <LoginForm />
}
