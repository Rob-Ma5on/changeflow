'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface TraceabilityChain {
  id: string;
  number: string;
  type: 'ECR' | 'ECO' | 'ECN';
  title: string;
  status: string;
  createdAt: string;
  submitter: { name: string };
  linkedECRs?: Array<{
    id: string;
    ecrNumber: string;
    title: string;
    status: string;
    submitter: { name: string };
  }>;
  parentECO?: {
    id: string;
    ecoNumber: string;
    title: string;
    status: string;
  };
  childECO?: {
    id: string;
    ecoNumber: string;
    title: string;
    status: string;
  };
  childECNs?: Array<{
    id: string;
    ecnNumber: string;
    title: string;
    status: string;
  }>;
}

interface SearchResults {
  query: string;
  totalResults: number;
  chains: TraceabilityChain[];
}

export default function TraceabilityPage() {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/traceability/search?q=${encodeURIComponent(searchQuery.trim())}`);
      if (response.ok) {
        const results = await response.json();
        setSearchResults(results);
      } else {
        console.error('Search failed');
      }
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string, type: string) => {
    let config: { bg: string; text: string } = { bg: 'bg-gray-100', text: 'text-gray-800' };
    
    if (type === 'ECR') {
      const statusMap = {
        DRAFT: { bg: 'bg-gray-100', text: 'text-gray-800' },
        PENDING_APPROVAL: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
        APPROVED: { bg: 'bg-green-100', text: 'text-green-800' },
        REJECTED: { bg: 'bg-red-100', text: 'text-red-800' },
        CONVERTED: { bg: 'bg-blue-100', text: 'text-blue-800' }
      };
      config = statusMap[status as keyof typeof statusMap] || config;
    } else if (type === 'ECO') {
      const statusMap = {
        DRAFT: { bg: 'bg-gray-100', text: 'text-gray-800' },
        BACKLOG: { bg: 'bg-blue-100', text: 'text-blue-800' },
        IN_PROGRESS: { bg: 'bg-amber-100', text: 'text-amber-800' },
        TESTING: { bg: 'bg-purple-100', text: 'text-purple-800' },
        COMPLETED: { bg: 'bg-green-100', text: 'text-green-800' },
        CANCELLED: { bg: 'bg-red-100', text: 'text-red-800' }
      };
      config = statusMap[status as keyof typeof statusMap] || config;
    } else if (type === 'ECN') {
      const statusMap = {
        DRAFT: { bg: 'bg-gray-100', text: 'text-gray-800' },
        PENDING_APPROVAL: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
        APPROVED: { bg: 'bg-green-100', text: 'text-green-800' },
        DISTRIBUTED: { bg: 'bg-blue-100', text: 'text-blue-800' },
        CLOSED: { bg: 'bg-slate-100', text: 'text-slate-800' }
      };
      config = statusMap[status as keyof typeof statusMap] || config;
    }

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ECR':
        return '📝';
      case 'ECO':
        return '🔧';
      case 'ECN':
        return '📢';
      default:
        return '📄';
    }
  };

  const renderChainVisualization = (chain: TraceabilityChain) => {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="flex flex-col space-y-4">
          {/* Main Entity */}
          <div className="flex items-center justify-center">
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 text-center">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-lg">{getTypeIcon(chain.type)}</span>
                <Link
                  href={`/dashboard/${chain.type.toLowerCase()}/${chain.id}`}
                  className="font-bold text-blue-600 hover:text-blue-800"
                >
                  {chain.number}
                </Link>
              </div>
              <p className="text-sm text-gray-600 mb-2">{chain.title}</p>
              <div className="flex items-center justify-center space-x-2">
                {getStatusBadge(chain.status, chain.type)}
                <span className="text-xs text-gray-500">by {chain.submitter.name}</span>
              </div>
            </div>
          </div>

          {/* Relationships */}
          <div className="flex flex-col items-center space-y-4">
            
            {/* Parent ECO (for ECNs) */}
            {chain.parentECO && (
              <>
                <div className="text-gray-400">↑</div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm">{getTypeIcon('ECO')}</span>
                    <Link
                      href={`/dashboard/eco/${chain.parentECO.id}`}
                      className="font-semibold text-yellow-600 hover:text-yellow-800"
                    >
                      {chain.parentECO.ecoNumber}
                    </Link>
                  </div>
                  <p className="text-xs text-gray-600">{chain.parentECO.title}</p>
                  {getStatusBadge(chain.parentECO.status, 'ECO')}
                </div>
              </>
            )}

            {/* Child ECO (for ECRs) */}
            {chain.childECO && (
              <>
                <div className="text-gray-400">↓</div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm">{getTypeIcon('ECO')}</span>
                    <Link
                      href={`/dashboard/eco/${chain.childECO.id}`}
                      className="font-semibold text-yellow-600 hover:text-yellow-800"
                    >
                      {chain.childECO.ecoNumber}
                    </Link>
                  </div>
                  <p className="text-xs text-gray-600">{chain.childECO.title}</p>
                  {getStatusBadge(chain.childECO.status, 'ECO')}
                </div>
              </>
            )}

            {/* Child ECNs (for ECOs and ECRs) */}
            {chain.childECNs && chain.childECNs.length > 0 && (
              <>
                <div className="text-gray-400">↓</div>
                <div className="flex flex-wrap justify-center gap-3">
                  {chain.childECNs.map((ecn) => (
                    <div key={ecn.id} className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm">{getTypeIcon('ECN')}</span>
                        <Link
                          href={`/dashboard/ecn/${ecn.id}`}
                          className="font-semibold text-green-600 hover:text-green-800"
                        >
                          {ecn.ecnNumber}
                        </Link>
                      </div>
                      <p className="text-xs text-gray-600">{ecn.title}</p>
                      {getStatusBadge(ecn.status, 'ECN')}
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Linked ECRs (for ECOs and ECNs) */}
            {chain.linkedECRs && chain.linkedECRs.length > 0 && chain.type !== 'ECR' && (
              <>
                <div className="text-gray-400">
                  {chain.type === 'ECN' ? '↑' : '↑'}
                </div>
                <div className="flex flex-wrap justify-center gap-3">
                  {chain.linkedECRs.map((ecr) => (
                    <div key={ecr.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm">{getTypeIcon('ECR')}</span>
                        <Link
                          href={`/dashboard/ecr/${ecr.id}`}
                          className="font-semibold text-gray-600 hover:text-gray-800"
                        >
                          {ecr.ecrNumber}
                        </Link>
                      </div>
                      <p className="text-xs text-gray-600">{ecr.title}</p>
                      <div className="flex items-center justify-center space-x-1">
                        {getStatusBadge(ecr.status, 'ECR')}
                        <span className="text-xs text-gray-500">by {ecr.submitter.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (!session) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Traceability Search</h1>
        <p className="text-gray-600">
          Search for any ECR, ECO, or ECN number to view the complete traceability chain
        </p>
      </div>

      {/* Search Form */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <form onSubmit={handleSearch} className="flex space-x-4">
          <div className="flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter ECR, ECO, or ECN number (e.g., ECR-25-001, ECO-25-001, ECN-25-001)"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !searchQuery.trim()}
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>
      </div>

      {/* Search Results */}
      {searchResults && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Search Results for "{searchResults.query}"
            </h2>
            <span className="text-gray-600">
              {searchResults.totalResults} result{searchResults.totalResults !== 1 ? 's' : ''} found
            </span>
          </div>

          {searchResults.chains.length === 0 ? (
            <div className="bg-white shadow rounded-lg p-8 text-center">
              <p className="text-gray-500 text-lg">No results found for your search query.</p>
              <p className="text-gray-400 text-sm mt-2">
                Try searching for a specific ECR, ECO, or ECN number or keywords from titles.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {searchResults.chains.map((chain) => renderChainVisualization(chain))}
            </div>
          )}
        </div>
      )}

      {/* Help Text */}
      {!searchResults && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">How to Use Traceability Search</h3>
          <div className="text-blue-800 space-y-2">
            <p>• Search by number: ECR-25-001, ECO-25-001, ECN-25-001</p>
            <p>• Search by title or description keywords</p>
            <p>• View complete relationship chains between ECRs, ECOs, and ECNs</p>
            <p>• Click on any item in the chain to view detailed information</p>
          </div>
          
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded border">
              <div className="flex items-center space-x-2 mb-2">
                <span>📝</span>
                <strong>ECR</strong>
              </div>
              <p className="text-sm text-gray-600">Engineering Change Request - Initiates the change process</p>
            </div>
            <div className="bg-white p-4 rounded border">
              <div className="flex items-center space-x-2 mb-2">
                <span>🔧</span>
                <strong>ECO</strong>
              </div>
              <p className="text-sm text-gray-600">Engineering Change Order - Approves and implements changes</p>
            </div>
            <div className="bg-white p-4 rounded border">
              <div className="flex items-center space-x-2 mb-2">
                <span>📢</span>
                <strong>ECN</strong>
              </div>
              <p className="text-sm text-gray-600">Engineering Change Notice - Communicates implemented changes</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}