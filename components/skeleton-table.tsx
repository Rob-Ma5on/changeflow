'use client'

interface SkeletonTableProps {
  columns: number
  rows?: number
  className?: string
}

export default function SkeletonTable({ columns, rows = 5, className = '' }: SkeletonTableProps) {
  return (
    <div className={`bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          {/* Header */}
          <thead className="bg-gray-50">
            <tr>
              {Array.from({ length: columns }, (_, i) => (
                <th key={i} className="px-6 py-3">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                </th>
              ))}
            </tr>
          </thead>
          
          {/* Body */}
          <tbody className="bg-white divide-y divide-gray-200">
            {Array.from({ length: rows }, (_, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50">
                {Array.from({ length: columns }, (_, colIndex) => (
                  <td key={colIndex} className="px-6 py-4 whitespace-nowrap">
                    <div className="animate-pulse">
                      {colIndex === 0 ? (
                        // First column - typically a link/number
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                      ) : colIndex === 1 ? (
                        // Second column - typically title/description
                        <div className="space-y-1">
                          <div className="h-4 bg-gray-200 rounded w-32"></div>
                          <div className="h-3 bg-gray-200 rounded w-20"></div>
                        </div>
                      ) : colIndex === columns - 1 ? (
                        // Last column - typically actions
                        <div className="flex space-x-2">
                          <div className="h-6 bg-gray-200 rounded w-12"></div>
                          <div className="h-6 bg-gray-200 rounded w-16"></div>
                        </div>
                      ) : (
                        // Middle columns - badges or data
                        <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                      )}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}