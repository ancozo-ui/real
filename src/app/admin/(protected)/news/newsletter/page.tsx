import { prisma } from '@/lib/prisma'
import NewsletterSendForm from './NewsletterSendForm'

export default async function AdminNewsletterPage() {
  const subscribers = await prisma.newsletterSubscriber.findMany({
    where: { active: true },
    select: { id: true, email: true, name: true },
  })

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">뉴스레터 발송</h1>
      <p className="text-sm text-gray-500 mb-6">
        현재 활성 구독자:{' '}
        <span className="font-semibold text-gray-700">{subscribers.length}명</span>
      </p>

      {subscribers.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-sm text-yellow-700">
          활성 구독자가 없습니다. 구독자가 생기면 발송할 수 있습니다.
        </div>
      ) : (
        <NewsletterSendForm subscriberCount={subscribers.length} />
      )}
    </div>
  )
}
