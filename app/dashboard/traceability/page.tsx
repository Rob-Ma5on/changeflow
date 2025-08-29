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
    // Build the complete chain: ECRs → ECO → ECN
    const buildCompleteChain = () => {
      const chainItems = [];

      // Add ECRs if present
      if (chain.linkedECRs && chain.linkedECRs.length > 0) {
        chainItems.push({
          type: 'ECRs',
          items: chain.linkedECRs,
          color: 'gray'
        });
      }

      // Add parent ECO for ECNs
      if (chain.parentECO) {
        chainItems.push({
          type: 'ECO',
          items: [chain.parentECO],
          color: 'yellow'
        });
      }

      // Add child ECO for ECRs
      if (chain.childECO) {
        chainItems.push({
          type: 'ECO',
          items: [chain.childECO],
          color: 'yellow'
        });
      }

      // Add the main entity
      chainItems.push({
        type: chain.type,
        items: [chain],
        color: 'blue',
        isMain: true
      });

      // Add child ECNs
      if (chain.childECNs && chain.childECNs.length > 0) {
        chainItems.push({
          type: 'ECNs',
          items: chain.childECNs,
          color: 'green'
        });
      }

      return chainItems;
    };

    const completeChain = buildCompleteChain();

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        {/* Linear Chain Display */}
        <div className="flex flex-col items-center space-y-4">
          {completeChain.map((segment, segmentIndex) => (
            <div key={segmentIndex} className="flex flex-col items-center space-y-2">
              {/* Segment Items */}
              <div className="flex flex-wrap justify-center gap-3">
                {segment.items.map((item, itemIndex) => {
                  const isECR = segment.type === 'ECRs';
                  const isECO = segment.type === 'ECO';
                  const isECN = segment.type === 'ECNs';
                  const isMain = segment.isMain;
                  
                  const colorClasses = {
                    gray: 'bg-gray-50 border-gray-200 text-gray-600',
                    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-600',
                    blue: isMain ? 'bg-blue-50 border-2 border-blue-200 text-blue-600' : 'bg-blue-50 border-blue-200 text-blue-600',
                    green: 'bg-green-50 border-green-200 text-green-600'
                  };

                  const linkPath = isECR ? `/dashboard/ecr/${item.id}` :
                                 isECO ? `/dashboard/eco/${item.id}` :
                                 isECN ? `/dashboard/ecn/${item.id}` :
                                 `/dashboard/${chain.type.toLowerCase()}/${item.id}`;

                  const itemNumber = isECR ? item.ecrNumber :
                                   isECO ? item.ecoNumber :
                                   isECN ? item.ecnNumber :
                                   item.number;

                  const itemType = isECR ? 'ECR' :
                                 isECO ? 'ECO' :
                                 isECN ? 'ECN' :
                                 item.type;

                  return (
                    <div 
                      key={item.id || itemIndex} 
                      className={`${colorClasses[segment.color]} border rounded-lg ${isMain ? 'p-4' : 'p-3'} text-center`}
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        <span className={isMain ? "text-lg" : "text-sm"}>{getTypeIcon(itemType)}</span>
                        <Link
                          href={linkPath}
                          className={`${isMain ? 'font-bold' : 'font-semibold'} hover:opacity-80`}
                        >
                          {itemNumber}
                        </Link>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">{item.title}</p>
                      <div className="flex items-center justify-center space-x-2">
                        {getStatusBadge(item.status, itemType)}
                        {isMain && <span className="text-xs text-gray-500">by {item.submitter.name}</span>}
                        {isECR && <span className="text-xs text-gray-500">by {item.submitter.name}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Arrow (except for last segment) */}
              {segmentIndex < completeChain.length - 1 && (
                <div className="text-gray-400 text-xl">↓</div>
              )}
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="mt-6 pt-4 border-t border-gray-200 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Traceability Summary</h4>
          <p className="text-sm text-blue-700">
            {chain.type === 'ECR' && chain.childECO && chain.childECNs && chain.childECNs.length > 0 && 
              `ECR ${chain.number} was implemented through ${chain.childECO.ecoNumber} and communicated via ${chain.childECNs.map(ecn => ecn.ecnNumber).join(', ')}`}
            {chain.type === 'ECO' && chain.linkedECRs && chain.linkedECRs.length > 0 && chain.childECNs && chain.childECNs.length > 0 &&
              `ECO ${chain.number} implements ${chain.linkedECRs.length} ECR${chain.linkedECRs.length > 1 ? 's' : ''} (${chain.linkedECRs.map(ecr => ecr.ecrNumber).join(', ')}) and is communicated via ${chain.childECNs.map(ecn => ecn.ecnNumber).join(', ')}`}
            {chain.type === 'ECN' && chain.parentECO && chain.linkedECRs && chain.linkedECRs.length > 0 &&
              `ECN ${chain.number} communicates the implementation of ${chain.linkedECRs.length} ECR${chain.linkedECRs.length > 1 ? 's' : ''} (${chain.linkedECRs.map(ecr => ecr.ecrNumber).join(', ')}) through ${chain.parentECO.ecoNumber}`}
            {(!chain.linkedECRs || chain.linkedECRs.length === 0) && !chain.parentECO && !chain.childECO &&
              `${chain.type} ${chain.number} is not currently linked in a traceability chain`}
          </p>
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
              Search Results for &quot;{searchResults.query}&quot;
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