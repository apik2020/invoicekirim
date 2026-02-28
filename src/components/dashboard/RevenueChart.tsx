'use client'

import { Line, Bar, LineChart, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { format, parseISO } from 'date-fns'
import { id } from 'date-fns/locale'

interface RevenueData {
  month: string
  revenue: number
  paid: number
  pending: number
  count: number
}

interface RevenueChartProps {
  data: RevenueData[]
  period?: number
}

export function RevenueChart({ data, period = 12 }: RevenueChartProps) {
  // Format data for chart
  const chartData = data.map((item) => ({
    month: format(parseISO(item.month), 'MMM yyyy', { locale: id }),
    Pendapatan: Math.round(item.revenue),
    Lunas: Math.round(item.paid),
    Pending: Math.round(item.pending),
    Jumlah: item.count,
  }))

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
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Trend Pendapatan</h2>
        <select defaultValue="12" className="px-3 py-2 rounded-lg border border-orange-200 text-sm focus:outline-none focus:border-orange-500">
          <option value="6">6 Bulan Terakhir</option>
          <option value="12">12 Bulan Terakhir</option>
        </select>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f97316" strokeOpacity={0.2} />
          <XAxis
            dataKey="month"
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${(value / 1000000).toFixed(0)}jt`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #fed7aa',
              borderRadius: '12px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
            formatter={(value: number = 0) => formatCurrency(value)}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="Pendapatan"
            stroke="#f97316"
            strokeWidth={3}
            dot={{ fill: '#f97316', r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="Lunas"
            stroke="#84cc16"
            strokeWidth={2}
            dot={{ fill: '#84cc16', r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="Pending"
            stroke="#facc15"
            strokeWidth={2}
            dot={{ fill: '#facc15', r: 3 }}
            strokeDasharray="5 5"
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Invoice count bar chart */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h3 className="text-sm font-bold text-gray-600 mb-4">Jumlah Invoice per Bulan</h3>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f97316" strokeOpacity={0.1} />
            <XAxis
              dataKey="month"
              stroke="#6b7280"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#6b7280"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #fed7aa',
                borderRadius: '12px',
              }}
              formatter={(value: number = 0) => `${value} invoice`}
            />
            <Bar
              dataKey="Jumlah"
              fill="url(#gradient)"
              radius={[4, 4, 0, 0]}
            />
            <defs>
              <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.9}/>
                <stop offset="95%" stopColor="#facc15" stopOpacity={0.6}/>
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
