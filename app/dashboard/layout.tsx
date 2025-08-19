import Link from 'next/link';
import { ReactNode } from 'react';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Link href="/dashboard" className="text-2xl font-bold text-blue-600">
                ChangeFlow
              </Link>
              <nav className="hidden md:flex space-x-6">
                <Link
                  href="/dashboard"
                  className="text-gray-600 hover:text-blue-600 px-3 py-2 text-sm font-medium"
                >
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/ecr"
                  className="text-gray-600 hover:text-blue-600 px-3 py-2 text-sm font-medium"
                >
                  ECR
                </Link>
                <Link
                  href="/dashboard/eco"
                  className="text-gray-600 hover:text-blue-600 px-3 py-2 text-sm font-medium"
                >
                  ECO
                </Link>
                <Link
                  href="/dashboard/ecn"
                  className="text-gray-600 hover:text-blue-600 px-3 py-2 text-sm font-medium"
                >
                  ECN
                </Link>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Acme Manufacturing Co.
              </div>
              <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">A</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}