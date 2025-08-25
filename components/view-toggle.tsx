'use client'


export type ViewMode = 'kanban' | 'list'

interface ViewToggleProps {
  viewMode: ViewMode
  onViewChange: (mode: ViewMode) => void
}

export default function ViewToggle({ viewMode, onViewChange }: ViewToggleProps) {
  return (
    <div className="inline-flex rounded-lg border border-gray-300 bg-white" style={{ borderColor: '#E5E7EB' }}>
      <button
        onClick={() => onViewChange('kanban')}
        className={`px-3 py-2 text-sm font-medium rounded-l-lg transition-colors ${
          viewMode === 'kanban'
            ? 'text-white'
            : 'text-gray-700'
        }`}
        style={{
          backgroundColor: viewMode === 'kanban' ? '#0066CC' : 'transparent',
        }}
        onMouseEnter={(e) => {
          if (viewMode !== 'kanban') {
            e.currentTarget.style.backgroundColor = '#F9FAFB';
          }
        }}
        onMouseLeave={(e) => {
          if (viewMode !== 'kanban') {
            e.currentTarget.style.backgroundColor = 'transparent';
          }
        }}
      >
        <div className="flex items-center space-x-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          <span>Kanban</span>
        </div>
      </button>
      <button
        onClick={() => onViewChange('list')}
        className={`px-3 py-2 text-sm font-medium rounded-r-lg transition-colors ${
          viewMode === 'list'
            ? 'text-white'
            : 'text-gray-700'
        }`}
        style={{
          backgroundColor: viewMode === 'list' ? '#0066CC' : 'transparent',
        }}
        onMouseEnter={(e) => {
          if (viewMode !== 'list') {
            e.currentTarget.style.backgroundColor = '#F9FAFB';
          }
        }}
        onMouseLeave={(e) => {
          if (viewMode !== 'list') {
            e.currentTarget.style.backgroundColor = 'transparent';
          }
        }}
      >
        <div className="flex items-center space-x-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
          <span>List</span>
        </div>
      </button>
    </div>
  )
}