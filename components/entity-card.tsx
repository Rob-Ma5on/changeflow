'use client'

interface EntityCardProps {
  entityType: 'ECR' | 'ECO' | 'ECN'
  number: string
  title: string
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  status: string
  requestor?: {
    name: string
    avatar?: string
    email: string
  }
  assignee?: {
    name: string
    avatar?: string
    email: string
  }
  createdDate: string
  dueDate?: string
  onClick?: () => void
  className?: string
  linkedEntity?: {
    type: 'ECR' | 'ECO' | 'ECN'
    id: string
    number: string
    title: string
  }
  ecrCount?: number // For ECO cards to show bundled ECR count
}

export default function EntityCard({
  entityType,
  number,
  title,
  priority,
  status,
  requestor,
  assignee,
  createdDate,
  dueDate,
  onClick,
  className = '',
  linkedEntity,
  ecrCount
}: EntityCardProps) {
  const getEntityBadgeStyle = () => {
    switch (entityType) {
      case 'ECR':
        return { backgroundColor: '#DBEAFE', color: '#3B82F6' }
      case 'ECO':
        return { backgroundColor: '#D1FAE5', color: '#10B981' }
      case 'ECN':
        return { backgroundColor: '#FEF3C7', color: '#F59E0B' }
      default:
        return { backgroundColor: '#F3F4F6', color: '#6B7280' }
    }
  }

  const getPriorityBadgeStyle = () => {
    switch (priority) {
      case 'HIGH':
        return { backgroundColor: '#EF4444', color: '#FFFFFF' }
      case 'MEDIUM':
        return { backgroundColor: '#EAB308', color: '#FFFFFF' }
      case 'LOW':
        return { backgroundColor: '#22C55E', color: '#FFFFFF' }
      default:
        return { backgroundColor: '#6B7280', color: '#FFFFFF' }
    }
  }

  const getStatusBadgeStyle = () => {
    switch (status) {
      case 'DRAFT':
        return { backgroundColor: '#F3F4F6', color: '#374151' }
      case 'PENDING_APPROVAL':
      case 'UNDER_REVIEW':
        return { backgroundColor: '#FEF3C7', color: '#D97706' }
      case 'APPROVED':
        return { backgroundColor: '#D1FAE5', color: '#059669' }
      case 'REJECTED':
      case 'CANCELLED':
        return { backgroundColor: '#FEE2E2', color: '#DC2626' }
      case 'IN_PROGRESS':
        return { backgroundColor: '#DBEAFE', color: '#2563EB' }
      case 'COMPLETED':
      case 'DISTRIBUTED':
      case 'EFFECTIVE':
        return { backgroundColor: '#D1FAE5', color: '#059669' }
      default:
        return { backgroundColor: '#F3F4F6', color: '#374151' }
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const person = assignee || requestor

  return (
    <div
      className={`bg-white rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer ${className}`}
      style={{ border: '1px solid #E5E7EB' }}
      onClick={onClick}
    >
      {/* Header with Number Badge and Priority */}
      <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
        <span 
          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
          style={getEntityBadgeStyle()}
        >
          {number}
        </span>
        <span 
          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
          style={getPriorityBadgeStyle()}
        >
          {priority}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2">
        {title}
      </h3>

      {/* Status Badge */}
      <div className="mb-3">
        <span 
          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
          style={getStatusBadgeStyle()}
        >
          {status.replace(/_/g, ' ')}
        </span>
      </div>

      {/* Linked Entity or ECR Count */}
      {linkedEntity && (
        <div className="mb-3 p-2 bg-gray-50 rounded-md">
          <div className="text-xs text-gray-600 mb-1">
            {entityType === 'ECR' ? 'Linked ECO:' : 
             entityType === 'ECO' ? 'Source ECRs:' : 
             'Source ECO:'}
          </div>
          <div className="text-xs font-medium text-blue-600 hover:text-blue-800 cursor-pointer">
            {linkedEntity.number}
          </div>
        </div>
      )}
      
      {ecrCount && ecrCount > 0 && (
        <div className="mb-3 p-2 bg-blue-50 rounded-md">
          <div className="text-xs font-medium text-blue-800">
            📝 {ecrCount} ECR{ecrCount > 1 ? 's' : ''} bundled
          </div>
        </div>
      )}

      {/* Footer with Person and Date */}
      <div className="flex items-start justify-between pt-3 border-t border-gray-100 flex-wrap gap-2">
        {/* Person (Requestor/Assignee) */}
        {person && (
          <div className="flex items-center space-x-2 min-w-0">
            {person.avatar ? (
              <img
                src={person.avatar}
                alt={person.name}
                className="w-6 h-6 rounded-full flex-shrink-0"
              />
            ) : (
              <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-medium text-gray-600">
                  {getInitials(person.name)}
                </span>
              </div>
            )}
            <span className="text-xs text-gray-600 truncate">
              {person.name}
            </span>
          </div>
        )}

        {/* Date */}
        <div className="text-xs text-gray-500 text-right flex-shrink-0">
          {dueDate ? (
            <div>
              <div>Due: {formatDate(dueDate)}</div>
              <div className="text-gray-400">Created: {formatDate(createdDate)}</div>
            </div>
          ) : (
            <div>Created: {formatDate(createdDate)}</div>
          )}
        </div>
      </div>
    </div>
  )
}