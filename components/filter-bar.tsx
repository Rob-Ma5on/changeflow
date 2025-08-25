'use client'

import { useState, useRef, useEffect } from 'react'

export interface FilterState {
  search: string
  status: string
  priority: string
  category: string
  assignee: string
  dateRange: {
    start: string
    end: string
  }
}

interface FilterBarProps {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  statusOptions: { value: string; label: string }[]
  categoryOptions?: { value: string; label: string }[]
  assigneeOptions?: { value: string; label: string }[]
  showAssignee?: boolean
  onExport?: () => void
  exportDisabled?: boolean
  isExporting?: boolean
}

export default function FilterBar({
  filters,
  onFiltersChange,
  statusOptions,
  categoryOptions = [],
  assigneeOptions = [],
  showAssignee = false,
  onExport,
  exportDisabled = false,
  isExporting = false
}: FilterBarProps) {
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const datePickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const updateFilter = (key: keyof FilterState, value: FilterState[keyof FilterState]) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const hasActiveFilters = () => {
    return (
      filters.search ||
      filters.status ||
      filters.priority ||
      filters.category ||
      filters.assignee ||
      filters.dateRange.start ||
      filters.dateRange.end
    )
  }

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      status: '',
      priority: '',
      category: '',
      assignee: '',
      dateRange: { start: '', end: '' }
    })
  }

  const priorityOptions = [
    { value: '', label: 'All Priorities' },
    { value: 'HIGH', label: 'High' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'LOW', label: 'Low' }
  ]

  return (
    <div className="bg-white rounded-lg p-4 mb-6" style={{ border: '1px solid #E5E7EB' }}>
      {/* Mobile Filter Toggle */}
      <div className="flex items-center justify-between mb-4 md:hidden">
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search..."
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="pl-10 pr-3 py-2 rounded-md focus:outline-none text-gray-900 w-full"
              style={{ 
                border: '1px solid #E5E7EB',
                focusRingColor: '#0066CC',
                focusBorderColor: '#0066CC'
              }}
              onFocus={(e) => {
                e.target.style.outline = '2px solid #0066CC';
                e.target.style.outlineOffset = '2px';
                e.target.style.borderColor = '#0066CC';
              }}
              onBlur={(e) => {
                e.target.style.outline = 'none';
                e.target.style.borderColor = '#E5E7EB';
              }}
            />
          </div>
        </div>
        <button
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          className="ml-4 p-2 rounded-md text-gray-400 hover:text-gray-600"
          style={{ border: '1px solid #E5E7EB' }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
          </svg>
        </button>
      </div>

      {/* Desktop Filters */}
      <div className="hidden md:flex flex-wrap gap-4 items-center">
        {/* Search Input */}
        <div className="flex-1 min-w-64">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search..."
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="pl-10 pr-3 py-2 rounded-md focus:outline-none text-gray-900 w-full"
              style={{ 
                border: '1px solid #E5E7EB',
                focusRingColor: '#0066CC',
                focusBorderColor: '#0066CC'
              }}
              onFocus={(e) => {
                e.target.style.outline = '2px solid #0066CC';
                e.target.style.outlineOffset = '2px';
                e.target.style.borderColor = '#0066CC';
              }}
              onBlur={(e) => {
                e.target.style.outline = 'none';
                e.target.style.borderColor = '#E5E7EB';
              }}
            />
          </div>
        </div>

        {/* Status Dropdown */}
        <select
          value={filters.status}
          onChange={(e) => updateFilter('status', e.target.value)}
          className="px-3 py-2 rounded-md focus:outline-none text-gray-900 bg-white"
          style={{ border: '1px solid #E5E7EB' }}
          onFocus={(e) => {
            e.target.style.outline = '2px solid #0066CC';
            e.target.style.outlineOffset = '2px';
            e.target.style.borderColor = '#0066CC';
          }}
          onBlur={(e) => {
            e.target.style.outline = 'none';
            e.target.style.borderColor = '#E5E7EB';
          }}
        >
          <option value="">All Statuses</option>
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Priority Dropdown */}
        <select
          value={filters.priority}
          onChange={(e) => updateFilter('priority', e.target.value)}
          className="px-3 py-2 rounded-md focus:outline-none text-gray-900 bg-white"
          style={{ border: '1px solid #E5E7EB' }}
          onFocus={(e) => {
            e.target.style.outline = '2px solid #0066CC';
            e.target.style.outlineOffset = '2px';
            e.target.style.borderColor = '#0066CC';
          }}
          onBlur={(e) => {
            e.target.style.outline = 'none';
            e.target.style.borderColor = '#E5E7EB';
          }}
        >
          {priorityOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Category Dropdown */}
        {categoryOptions.length > 0 && (
          <select
            value={filters.category}
            onChange={(e) => updateFilter('category', e.target.value)}
            className="px-3 py-2 rounded-md focus:outline-none text-gray-900 bg-white"
            style={{ border: '1px solid #E5E7EB' }}
            onFocus={(e) => {
              e.target.style.outline = '2px solid #0066CC';
              e.target.style.outlineOffset = '2px';
              e.target.style.borderColor = '#0066CC';
            }}
            onBlur={(e) => {
              e.target.style.outline = 'none';
              e.target.style.borderColor = '#E5E7EB';
            }}
          >
            <option value="">All Categories</option>
            {categoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}

        {/* Assignee Dropdown */}
        {showAssignee && assigneeOptions.length > 0 && (
          <select
            value={filters.assignee}
            onChange={(e) => updateFilter('assignee', e.target.value)}
            className="px-3 py-2 rounded-md focus:outline-none text-gray-900 bg-white"
            style={{ border: '1px solid #E5E7EB' }}
            onFocus={(e) => {
              e.target.style.outline = '2px solid #0066CC';
              e.target.style.outlineOffset = '2px';
              e.target.style.borderColor = '#0066CC';
            }}
            onBlur={(e) => {
              e.target.style.outline = 'none';
              e.target.style.borderColor = '#E5E7EB';
            }}
          >
            <option value="">All Assignees</option>
            {assigneeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}

        {/* Date Range Picker */}
        <div className="relative" ref={datePickerRef}>
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="px-3 py-2 rounded-md focus:outline-none text-gray-900 bg-white flex items-center space-x-2"
            style={{ border: '1px solid #E5E7EB' }}
            onFocus={(e) => {
              e.currentTarget.style.outline = '2px solid #0066CC';
              e.currentTarget.style.outlineOffset = '2px';
              e.currentTarget.style.borderColor = '#0066CC';
            }}
            onBlur={(e) => {
              e.currentTarget.style.outline = 'none';
              e.currentTarget.style.borderColor = '#E5E7EB';
            }}
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Date Range</span>
          </button>

          {showDatePicker && (
            <div className="absolute top-full left-0 mt-1 bg-white rounded-md shadow-lg z-10 p-4 min-w-64" style={{ border: '1px solid #E5E7EB' }}>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={filters.dateRange.start}
                    onChange={(e) => updateFilter('dateRange', { ...filters.dateRange, start: e.target.value })}
                    className="w-full px-3 py-2 rounded-md focus:outline-none text-gray-900"
                    style={{ border: '1px solid #E5E7EB' }}
                    onFocus={(e) => {
                      e.target.style.outline = '2px solid #0066CC';
                      e.target.style.outlineOffset = '2px';
                      e.target.style.borderColor = '#0066CC';
                    }}
                    onBlur={(e) => {
                      e.target.style.outline = 'none';
                      e.target.style.borderColor = '#E5E7EB';
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={filters.dateRange.end}
                    onChange={(e) => updateFilter('dateRange', { ...filters.dateRange, end: e.target.value })}
                    className="w-full px-3 py-2 rounded-md focus:outline-none text-gray-900"
                    style={{ border: '1px solid #E5E7EB' }}
                    onFocus={(e) => {
                      e.target.style.outline = '2px solid #0066CC';
                      e.target.style.outlineOffset = '2px';
                      e.target.style.borderColor = '#0066CC';
                    }}
                    onBlur={(e) => {
                      e.target.style.outline = 'none';
                      e.target.style.borderColor = '#E5E7EB';
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Export Button */}
        {onExport && (
          <button
            onClick={onExport}
            disabled={exportDisabled || isExporting}
            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Export to Excel"
          >
            {isExporting ? (
              <>
                <svg className="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="hidden sm:inline">Exporting...</span>
                <span className="sm:hidden">...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="hidden sm:inline">Export to Excel</span>
                <span className="sm:hidden">Export</span>
              </>
            )}
          </button>
        )}

        {/* Clear Filters Button */}
        {hasActiveFilters() && (
          <button
            onClick={clearFilters}
            className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-md transition-colors"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Mobile Filters */}
      {showMobileFilters && (
        <div className="md:hidden space-y-4 pt-4 border-t" style={{ borderColor: '#E5E7EB' }}>
          <div className="grid grid-cols-1 gap-4">
            {/* Status Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => updateFilter('status', e.target.value)}
                className="w-full px-3 py-2 rounded-md focus:outline-none text-gray-900 bg-white"
                style={{ border: '1px solid #E5E7EB' }}
                onFocus={(e) => {
                  e.target.style.outline = '2px solid #0066CC';
                  e.target.style.outlineOffset = '2px';
                  e.target.style.borderColor = '#0066CC';
                }}
                onBlur={(e) => {
                  e.target.style.outline = 'none';
                  e.target.style.borderColor = '#E5E7EB';
                }}
              >
                <option value="">All Statuses</option>
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={filters.priority}
                onChange={(e) => updateFilter('priority', e.target.value)}
                className="w-full px-3 py-2 rounded-md focus:outline-none text-gray-900 bg-white"
                style={{ border: '1px solid #E5E7EB' }}
                onFocus={(e) => {
                  e.target.style.outline = '2px solid #0066CC';
                  e.target.style.outlineOffset = '2px';
                  e.target.style.borderColor = '#0066CC';
                }}
                onBlur={(e) => {
                  e.target.style.outline = 'none';
                  e.target.style.borderColor = '#E5E7EB';
                }}
              >
                {priorityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Dropdown */}
            {categoryOptions.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => updateFilter('category', e.target.value)}
                  className="w-full px-3 py-2 rounded-md focus:outline-none text-gray-900 bg-white"
                  style={{ border: '1px solid #E5E7EB' }}
                  onFocus={(e) => {
                    e.target.style.outline = '2px solid #0066CC';
                    e.target.style.outlineOffset = '2px';
                    e.target.style.borderColor = '#0066CC';
                  }}
                  onBlur={(e) => {
                    e.target.style.outline = 'none';
                    e.target.style.borderColor = '#E5E7EB';
                  }}
                >
                  <option value="">All Categories</option>
                  {categoryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Assignee Dropdown */}
            {showAssignee && assigneeOptions.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
                <select
                  value={filters.assignee}
                  onChange={(e) => updateFilter('assignee', e.target.value)}
                  className="w-full px-3 py-2 rounded-md focus:outline-none text-gray-900 bg-white"
                  style={{ border: '1px solid #E5E7EB' }}
                  onFocus={(e) => {
                    e.target.style.outline = '2px solid #0066CC';
                    e.target.style.outlineOffset = '2px';
                    e.target.style.borderColor = '#0066CC';
                  }}
                  onBlur={(e) => {
                    e.target.style.outline = 'none';
                    e.target.style.borderColor = '#E5E7EB';
                  }}
                >
                  <option value="">All Assignees</option>
                  {assigneeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
              <div className="space-y-2">
                <input
                  type="date"
                  value={filters.dateRange.start}
                  onChange={(e) => updateFilter('dateRange', { ...filters.dateRange, start: e.target.value })}
                  className="w-full px-3 py-2 rounded-md focus:outline-none text-gray-900"
                  style={{ border: '1px solid #E5E7EB' }}
                  onFocus={(e) => {
                    e.target.style.outline = '2px solid #0066CC';
                    e.target.style.outlineOffset = '2px';
                    e.target.style.borderColor = '#0066CC';
                  }}
                  onBlur={(e) => {
                    e.target.style.outline = 'none';
                    e.target.style.borderColor = '#E5E7EB';
                  }}
                  placeholder="Start Date"
                />
                <input
                  type="date"
                  value={filters.dateRange.end}
                  onChange={(e) => updateFilter('dateRange', { ...filters.dateRange, end: e.target.value })}
                  className="w-full px-3 py-2 rounded-md focus:outline-none text-gray-900"
                  style={{ border: '1px solid #E5E7EB' }}
                  onFocus={(e) => {
                    e.target.style.outline = '2px solid #0066CC';
                    e.target.style.outlineOffset = '2px';
                    e.target.style.borderColor = '#0066CC';
                  }}
                  onBlur={(e) => {
                    e.target.style.outline = 'none';
                    e.target.style.borderColor = '#E5E7EB';
                  }}
                  placeholder="End Date"
                />
              </div>
            </div>

            {/* Export Button */}
            {onExport && (
              <button
                onClick={onExport}
                disabled={exportDisabled || isExporting}
                className="w-full inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Export to Excel"
              >
                {isExporting ? (
                  <>
                    <svg className="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Exporting...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export to Excel
                  </>
                )}
              </button>
            )}

            {/* Clear Filters Button */}
            {hasActiveFilters() && (
              <button
                onClick={clearFilters}
                className="w-full px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 rounded-md transition-colors"
                style={{ border: '1px solid #E5E7EB' }}
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}