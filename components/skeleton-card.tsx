'use client'

interface SkeletonCardProps {
  className?: string
}

export default function SkeletonCard({ className = '' }: SkeletonCardProps) {
  return (
    <div 
      className={`bg-white rounded-lg p-4 animate-pulse ${className}`}
      style={{ border: '1px solid #E5E7EB' }}
    >
      {/* Header with badges */}
      <div className="flex items-start justify-between mb-3">
        <div className="h-6 bg-gray-200 rounded-full w-20"></div>
        <div className="h-6 bg-gray-200 rounded-full w-16"></div>
      </div>

      {/* Title */}
      <div className="space-y-2 mb-3">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>

      {/* Status badge */}
      <div className="mb-3">
        <div className="h-6 bg-gray-200 rounded-full w-24"></div>
      </div>

      {/* Footer */}
      <div className="pt-3 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
            <div className="h-3 bg-gray-200 rounded w-16"></div>
          </div>
          <div className="space-y-1">
            <div className="h-3 bg-gray-200 rounded w-20"></div>
            <div className="h-3 bg-gray-200 rounded w-16"></div>
          </div>
        </div>
      </div>
    </div>
  )
}