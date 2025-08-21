'use client'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  color?: string
  className?: string
}

export default function LoadingSpinner({ 
  size = 'md', 
  color = '#0066CC',
  className = '' 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  }

  return (
    <div className={`animate-spin rounded-full border-2 border-transparent ${sizeClasses[size]} ${className}`}>
      <div 
        className="w-full h-full rounded-full border-2 border-transparent"
        style={{ 
          borderTopColor: color,
          borderRightColor: color 
        }}
      ></div>
    </div>
  )
}

interface LoadingOverlayProps {
  isVisible: boolean
  message?: string
  className?: string
}

export function LoadingOverlay({ 
  isVisible, 
  message = 'Loading...', 
  className = '' 
}: LoadingOverlayProps) {
  if (!isVisible) return null

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${className}`}>
      <div className="bg-white rounded-lg p-6 flex flex-col items-center space-y-4 shadow-xl">
        <LoadingSpinner size="lg" />
        <p className="text-gray-700 font-medium">{message}</p>
      </div>
    </div>
  )
}