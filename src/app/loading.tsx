import { Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <div className="min-h-screen bg-fresh-bg flex items-center justify-center p-4">
      <div className="text-center">
        <Loader2 className="w-16 h-16 text-orange-600 animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Memuat...</p>
      </div>
    </div>
  )
}
