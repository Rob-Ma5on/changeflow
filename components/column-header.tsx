'use client'

export type SortDirection = 'asc' | 'desc' | null

interface ColumnHeaderProps {
  title: string
  sortKey?: string
  currentSort?: {
    key: string
    direction: SortDirection
  }
  onSort?: (key: string) => void
  className?: string
}

export default function ColumnHeader({
  title,
  sortKey,
  currentSort,
  onSort,
  className = ''
}: ColumnHeaderProps) {
  const isSortable = sortKey && onSort
  const isActive = currentSort?.key === sortKey
  const direction = isActive ? currentSort.direction : null

  const handleClick = () => {
    if (isSortable) {
      onSort(sortKey)
    }
  }

  return (
    <th
      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
        isSortable ? 'cursor-pointer hover:bg-gray-50' : ''
      } ${className}`}
      onClick={handleClick}
    >
      <div className="flex items-center space-x-1">
        <span>{title}</span>
        {isSortable && (
          <div className="flex flex-col">
            <svg
              className={`w-3 h-3 ${
                isActive && direction === 'asc'
                  ? ''
                  : 'text-gray-400'
              }`}
              style={{
                color: isActive && direction === 'asc' ? '#0066CC' : undefined
              }}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
            <svg
              className={`w-3 h-3 -mt-1 ${
                isActive && direction === 'desc'
                  ? ''
                  : 'text-gray-400'
              }`}
              style={{
                color: isActive && direction === 'desc' ? '#0066CC' : undefined
              }}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )}
      </div>
    </th>
  )
}