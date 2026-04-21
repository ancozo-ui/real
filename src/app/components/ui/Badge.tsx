export const FACILITY_BADGE_COLORS: Record<string, string> = {
  WAREHOUSE: 'bg-gray-100 text-gray-700',
  LOGISTICS: 'bg-blue-100 text-blue-700',
  COLD_CHAIN: 'bg-cyan-100 text-cyan-700',
  FULFILLMENT: 'bg-purple-100 text-purple-700',
  FACTORY: 'bg-orange-100 text-orange-700',
}

interface BadgeProps {
  facilityType: string
  label: string
  className?: string
}

export default function Badge({ facilityType, label, className = '' }: BadgeProps) {
  const colors = FACILITY_BADGE_COLORS[facilityType] ?? 'bg-gray-100 text-gray-700'
  return (
    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${colors} ${className}`}>
      {label}
    </span>
  )
}
