import { useEffect, useState } from 'react'

export default function StatsBar({ refreshKey }) {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.json())
      .then(setStats)
      .catch(() => {})
  }, [refreshKey])

  if (!stats) return null

  const cards = [
    {
      label: 'Total Employees',
      value: stats.total,
      icon: '👥',
      colorClass: 'stat-indigo',
    },
    {
      label: 'Active',
      value: stats.active,
      icon: '✅',
      colorClass: 'stat-green',
    },
    {
      label: 'Departments',
      value: Object.keys(stats.by_department).length,
      icon: '🏢',
      colorClass: 'stat-purple',
    },
    {
      label: 'New This Month',
      value: stats.new_this_month,
      icon: '🆕',
      colorClass: 'stat-pink',
    },
  ]

  return (
    <div className="stats-bar">
      {cards.map(card => (
        <div key={card.label} className={`stat-card ${card.colorClass}`}>
          <span className="stat-icon">{card.icon}</span>
          <div className="stat-text">
            <div className="stat-value">{card.value}</div>
            <div className="stat-label">{card.label}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
