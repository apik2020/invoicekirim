'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

interface StatusData {
  status: string
  total: number
  count: number
}

interface RevenueByStatusChartProps {
  data: StatusData[]
}

const STATUS_COLORS = {
  PAID: '#84cc16',      // lime
  SENT: '#facc15',      // lemon
  OVERDUE: '#ec4899',   // pink
  DRAFT: '#f97316',     // orange
  CANCELED: '#9ca3af',  // gray
}

const STATUS_LABELS = {
  PAID: 'Lunas',
  SENT: 'Terkirim',
  OVERDUE: 'Terlambat',
  DRAFT: 'Draft',
  CANCELED: 'Dibatalkan',
}

export function RevenueByStatusChart({ data }: RevenueByStatusChartProps) {
  const chartData = data
    .filter((item) => item.total > 0)
    .map((item) => ({
      name: STATUS_LABELS[item.status as keyof typeof STATUS_LABELS] || item.status,
      value: item.total,
      count: item.count,
      color: STATUS_COLORS[item.status as keyof typeof STATUS_COLORS] || '#f97316',
    }))

  const totalRevenue = chartData.reduce((sum, item) => sum + item.value, 0)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div className="card p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Pendapatan per Status</h2>

      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={5}
            dataKey="value"
            label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
            labelLine={false}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #fed7aa',
              borderRadius: '12px',
            }}
            formatter={(value: number = 0, entry: any) => [
              formatCurrency(value),
              entry.payload.count > 0 ? `(${entry.payload.count} invoice)` : '',
            ]}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="mt-6 space-y-2">
        {chartData.map((item) => (
          <div key={item.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm font-medium text-gray-700">{item.name}</span>
            </div>
            <div className="text-sm font-bold text-gray-900">
              {formatCurrency(item.value)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
