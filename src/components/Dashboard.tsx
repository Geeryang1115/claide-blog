import { useEffect, useState } from 'react'
import { Monitor, CheckCircle2, XCircle, Clock, AlertTriangle, Infinity } from 'lucide-react'
import type { DeviceStats } from '@/types/device'

interface DashboardProps {
  onFilterChange?: (filter: 'all' | 'enabled' | 'disabled' | 'expiring' | 'expired' | 'permanent') => void
  activeFilter?: string
}

export default function Dashboard({ onFilterChange, activeFilter = 'all' }: DashboardProps) {
  const [stats, setStats] = useState<DeviceStats | null>(null)

  useEffect(() => {
    fetch('/api/devices?stats=1')
      .then((r) => r.json())
      .then(setStats)
  }, [])

  const cards = [
    {
      key: 'all' as const,
      label: '设备总数',
      value: stats?.total ?? 0,
      icon: Monitor,
      color: 'text-[#7B61FF]',
      bg: 'bg-[#7B61FF]/10',
    },
    {
      key: 'enabled' as const,
      label: '已启用',
      value: stats?.enabled ?? 0,
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
    {
      key: 'disabled' as const,
      label: '已禁用',
      value: stats?.disabled ?? 0,
      icon: XCircle,
      color: 'text-red-400',
      bg: 'bg-red-500/10',
    },
    {
      key: 'expiring' as const,
      label: '即将过期',
      value: stats?.expiringSoon ?? 0,
      icon: AlertTriangle,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
    },
    {
      key: 'expired' as const,
      label: '已过期',
      value: stats?.expired ?? 0,
      icon: Clock,
      color: 'text-rose-400',
      bg: 'bg-rose-500/10',
    },
    {
      key: 'permanent' as const,
      label: '永久授权',
      value: stats?.permanent ?? 0,
      icon: Infinity,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
      {cards.map((card) => {
        const Icon = card.icon
        const isActive = activeFilter === card.key
        return (
          <button
            key={card.key}
            onClick={() => onFilterChange?.(card.key)}
            className={`liquid-glass rounded-xl p-4 text-left transition-all duration-200 ${
              isActive
                ? 'ring-1 ring-[#7B61FF]/50 bg-white/[0.06]'
                : 'hover:bg-white/[0.04]'
            }`}
          >
            <div className={`inline-flex items-center justify-center w-9 h-9 rounded-lg ${card.bg} ${card.color} mb-3`}>
              <Icon className="h-4.5 w-4.5" />
            </div>
            <div className="text-2xl font-semibold text-[#EAEAEA] mb-0.5">
              {card.value}
            </div>
            <div className="text-xs text-[#7A7A7A]">{card.label}</div>
          </button>
        )
      })}
    </div>
  )
}
