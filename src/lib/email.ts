import { Resend } from 'resend'

function getEnv(key: string): string {
  const value = process.env[key]
  if (!value) throw new Error(`환경변수 ${key}가 설정되지 않았습니다`)
  return value
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const resend = new Resend(getEnv('RESEND_API_KEY'))

export interface InquiryData {
  listingId?: string
  listingAddress?: string
  companyName: string
  contactName: string
  phone: string
  email: string
  message?: string
}

export async function sendInquiryNotification(data: InquiryData): Promise<void> {
  const e = (s: string) => escapeHtml(s)
  await resend.emails.send({
    from: getEnv('RESEND_FROM_EMAIL'),
    to: getEnv('ADMIN_NOTIFICATION_EMAIL'),
    subject: `[물류창고 문의] ${e(data.companyName)} - ${e(data.listingAddress ?? '일반 문의')}`,
    html: `
      <h2>새 임대 문의가 접수되었습니다</h2>
      <table>
        <tr><td>회사명</td><td>${e(data.companyName)}</td></tr>
        <tr><td>담당자</td><td>${e(data.contactName)}</td></tr>
        <tr><td>연락처</td><td>${e(data.phone)}</td></tr>
        <tr><td>이메일</td><td>${e(data.email)}</td></tr>
        <tr><td>관심 매물</td><td>${e(data.listingAddress ?? '-')}</td></tr>
        <tr><td>메시지</td><td>${e(data.message ?? '-')}</td></tr>
      </table>
    `,
  })
}

export async function sendNewsletter(
  subject: string,
  htmlContent: string,
  subscribers: { email: string; name?: string }[]
): Promise<void> {
  const batchEmails = subscribers.map((sub) => ({
    from: getEnv('RESEND_FROM_EMAIL'),
    to: sub.email,
    subject,
    html: htmlContent.replace('{{name}}', sub.name ?? '구독자'),
  }))

  for (let i = 0; i < batchEmails.length; i += 100) {
    await resend.batch.send(batchEmails.slice(i, i + 100))
  }
}
