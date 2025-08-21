'use client'

import Link from 'next/link'

interface EmptyStateProps {
  type: 'ECR' | 'ECO' | 'ECN' | 'search' | 'filter' | 'traceability'
  title: string
  description: string
  actionButton?: {
    label: string
    href?: string
    onClick?: () => void
  }
  className?: string
}

export default function EmptyState({ 
  type, 
  title, 
  description, 
  actionButton, 
  className = '' 
}: EmptyStateProps) {
  const getIcon = () => {
    switch (type) {
      case 'ECR':
        return (
          <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )
      case 'ECO':
        return (
          <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        )
      case 'ECN':
        return (
          <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
          </svg>
        )
      case 'search':
        return (
          <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        )
      case 'filter':
        return (
          <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
        )
      case 'traceability':
        return (
          <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        )
      default:
        return (
          <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        )
    }
  }

  const getAccentColor = () => {
    switch (type) {
      case 'ECR':
        return '#3B82F6'
      case 'ECO':
        return '#10B981'
      case 'ECN':
        return '#F59E0B'
      default:
        return '#0066CC'
    }
  }

  return (
    <div className={`text-center py-12 px-4 ${className}`}>
      <div className="mb-6">
        {getIcon()}
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {title}
      </h3>
      
      <p className="text-gray-500 mb-6 max-w-md mx-auto">
        {description}
      </p>
      
      {actionButton && (
        <div>
          {actionButton.href ? (
            <Link
              href={actionButton.href}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white hover:opacity-90 transition-opacity"
              style={{ backgroundColor: getAccentColor() }}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {actionButton.label}
            </Link>
          ) : (
            <button
              onClick={actionButton.onClick}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white hover:opacity-90 transition-opacity"
              style={{ backgroundColor: getAccentColor() }}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {actionButton.label}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// Specialized empty state components for common use cases
export function ECREmptyState() {
  return (
    <EmptyState
      type="ECR"
      title="No Engineering Change Requests"
      description="Get started by creating your first ECR to track and manage engineering changes."
      actionButton={{
        label: "Create New ECR",
        href: "/dashboard/ecr/new"
      }}
    />
  )
}

export function ECOEmptyState() {
  return (
    <EmptyState
      type="ECO"
      title="No Engineering Change Orders"
      description="ECOs are created from approved ECRs. Start by creating and approving ECRs, then bundle them into ECOs."
      actionButton={{
        label: "View ECRs",
        href: "/dashboard/ecr"
      }}
    />
  )
}

export function ECNEmptyState() {
  return (
    <EmptyState
      type="ECN"
      title="No Engineering Change Notices"
      description="ECNs are generated from completed ECOs to formally notify stakeholders of implemented changes."
      actionButton={{
        label: "View ECOs",
        href: "/dashboard/eco"
      }}
    />
  )
}

export function SearchEmptyState({ searchTerm }: { searchTerm: string }) {
  return (
    <EmptyState
      type="search"
      title="No results found"
      description={`No items match your search for "${searchTerm}". Try adjusting your search terms or clearing filters.`}
      actionButton={{
        label: "Clear Search",
        onClick: () => window.location.reload()
      }}
    />
  )
}

export function FilterEmptyState({ onClearFilters }: { onClearFilters: () => void }) {
  return (
    <EmptyState
      type="filter"
      title="No items match your filters"
      description="Try adjusting your filter criteria to see more results, or clear all filters to view everything."
      actionButton={{
        label: "Clear Filters",
        onClick: onClearFilters
      }}
    />
  )
}