'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface ECR {
  id: string;
  ecrNumber: string;
  title: string;
  status: string;
  submitter: { name: string };
}

interface ECO {
  id: string;
  ecoNumber: string;
  title: string;
  status: string;
  ecrs: ECR[];
}

interface ECN {
  id: string;
  ecnNumber: string;
  title: string;
  status: string;
  eco?: ECO;
}

interface WorkflowData {
  ecrs: ECR[];
  ecos: ECO[];
  ecns: ECN[];
}

function WorkflowDiagram({ data }: { data: WorkflowData }) {
  const getStatusColor = (status: string, type: 'ECR' | 'ECO' | 'ECN') => {
    const colors = {
      ECR: {
        APPROVED: 'bg-green-100 text-green-800 border-green-200',
        CONVERTED: 'bg-blue-100 text-blue-800 border-blue-200',
        default: 'bg-gray-100 text-gray-800 border-gray-200'
      },
      ECO: {
        COMPLETED: 'bg-green-100 text-green-800 border-green-200',
        IN_PROGRESS: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        BACKLOG: 'bg-gray-100 text-gray-800 border-gray-200',
        default: 'bg-gray-100 text-gray-800 border-gray-200'
      },
      ECN: {
        EFFECTIVE: 'bg-green-100 text-green-800 border-green-200',
        DISTRIBUTED: 'bg-blue-100 text-blue-800 border-blue-200',
        APPROVED: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        default: 'bg-gray-100 text-gray-800 border-gray-200'
      }
    };
    return colors[type][status] || colors[type].default;
  };

  // Group ECRs by their ECO
  const bundledECRs = data.ecrs.filter(ecr => ecr.status === 'CONVERTED');
  const standaloneECRs = data.ecrs.filter(ecr => ecr.status !== 'CONVERTED');

  return (
    <div className="space-y-12">
      {/* Workflow Examples */}
      {data.ecos.map((eco) => {
        const linkedECRs = bundledECRs.filter(ecr => 
          data.ecos.find(e => e.id === eco.id && e.ecrs.some(linkedEcr => linkedEcr.id === ecr.id))
        );
        const relatedECN = data.ecns.find(ecn => ecn.eco?.id === eco.id);

        if (linkedECRs.length === 0) return null;

        return (
          <div key={eco.id} className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Workflow: {eco.ecoNumber}
            </h3>
            
            <div className="flex items-center justify-between">
              {/* ECRs Column */}
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-700 mb-3 text-center">
                  Engineering Change Requests
                </h4>
                <div className="space-y-3">
                  {eco.ecrs.map((ecr, index) => (
                    <div key={ecr.id} className="relative">
                      <Link
                        href={`/dashboard/ecr/${ecr.id}`}
                        className={`block px-3 py-2 rounded-lg border text-sm font-medium hover:shadow-md transition-shadow ${getStatusColor(ecr.status || 'CONVERTED', 'ECR')}`}
                      >
                        <div className="font-semibold">{ecr.ecrNumber}</div>
                        <div className="text-xs opacity-75 truncate">{ecr.title}</div>
                        <div className="text-xs opacity-60">by {ecr.submitter?.name || 'Unknown'}</div>
                      </Link>
                      
                      {/* Arrow pointing to ECO */}
                      {index === Math.floor(eco.ecrs.length / 2) && (
                        <div className="absolute right-0 top-1/2 transform translate-x-8 -translate-y-1/2">
                          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* ECO Column */}
              <div className="flex-1 mx-8">
                <h4 className="text-sm font-medium text-gray-700 mb-3 text-center">
                  Engineering Change Order
                </h4>
                <div className="relative">
                  <Link
                    href={`/dashboard/eco`}
                    className={`block px-4 py-3 rounded-lg border text-sm font-medium hover:shadow-md transition-shadow ${getStatusColor(eco.status, 'ECO')}`}
                  >
                    <div className="font-semibold text-center">{eco.ecoNumber}</div>
                    <div className="text-xs opacity-75 text-center truncate">{eco.title}</div>
                    <div className="text-xs opacity-60 text-center mt-1">
                      Bundles {eco.ecrs.length} ECR{eco.ecrs.length !== 1 ? 's' : ''}
                    </div>
                  </Link>
                  
                  {/* Arrow pointing to ECN */}
                  {relatedECN && (
                    <div className="absolute right-0 top-1/2 transform translate-x-8 -translate-y-1/2">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>

              {/* ECN Column */}
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-700 mb-3 text-center">
                  Engineering Change Notice
                </h4>
                {relatedECN ? (
                  <Link
                    href={`/dashboard/ecn/${relatedECN.id}`}
                    className={`block px-4 py-3 rounded-lg border text-sm font-medium hover:shadow-md transition-shadow ${getStatusColor(relatedECN.status, 'ECN')}`}
                  >
                    <div className="font-semibold text-center">{relatedECN.ecnNumber}</div>
                    <div className="text-xs opacity-75 text-center truncate">{relatedECN.title}</div>
                    <div className="text-xs opacity-60 text-center mt-1">
                      Status: {relatedECN.status.replace('_', ' ')}
                    </div>
                  </Link>
                ) : (
                  <div className="px-4 py-3 rounded-lg border border-dashed border-gray-300 text-center">
                    <div className="text-sm text-gray-500">
                      No ECN created yet
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      ECO must be completed first
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Standalone ECRs */}
      {standaloneECRs.length > 0 && (
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Standalone ECRs (Not Yet Bundled)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {standaloneECRs.map((ecr) => (
              <Link
                key={ecr.id}
                href={`/dashboard/ecr/${ecr.id}`}
                className={`block px-3 py-2 rounded-lg border text-sm font-medium hover:shadow-md transition-shadow ${getStatusColor(ecr.status, 'ECR')}`}
              >
                <div className="font-semibold">{ecr.ecrNumber}</div>
                <div className="text-xs opacity-75 truncate">{ecr.title}</div>
                <div className="text-xs opacity-60">by {ecr.submitter?.name || 'Unknown'}</div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function WorkflowPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<WorkflowData>({ ecrs: [], ecos: [], ecns: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all data in parallel
        const [ecrsResponse, ecosResponse, ecnsResponse] = await Promise.all([
          fetch('/api/ecr'),
          fetch('/api/eco'),
          fetch('/api/ecn'),
        ]);

        if (ecrsResponse.ok && ecosResponse.ok && ecnsResponse.ok) {
          const [ecrs, ecos, ecns] = await Promise.all([
            ecrsResponse.json(),
            ecosResponse.json(),
            ecnsResponse.json(),
          ]);

          setData({ ecrs, ecos, ecns });
        } else {
          console.error('Failed to fetch workflow data');
        }
      } catch (error) {
        console.error('Error fetching workflow data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Engineering Change Workflow</h1>
          <p className="text-gray-600 mt-2">
            Visual representation of ECR → ECO → ECN relationships
          </p>
        </div>
        <div className="flex space-x-3">
          <Link
            href="/dashboard/ecr"
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Manage ECRs
          </Link>
          <Link
            href="/dashboard/eco"
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Manage ECOs
          </Link>
          <Link
            href="/dashboard/ecn"
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Manage ECNs
          </Link>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Workflow Legend</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-blue-600 mb-2">ECRs (Engineering Change Requests)</h4>
            <p className="text-gray-600">
              Multiple approved ECRs can be bundled together into a single ECO for efficient implementation.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-green-600 mb-2">ECOs (Engineering Change Orders)</h4>
            <p className="text-gray-600">
              One ECO can contain multiple ECRs. Each ECO gets a unique number and manages the implementation.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-purple-600 mb-2">ECNs (Engineering Change Notices)</h4>
            <p className="text-gray-600">
              Each completed ECO produces exactly one ECN with a matching number for documentation and distribution.
            </p>
          </div>
        </div>
      </div>

      {/* Workflow Diagram */}
      <WorkflowDiagram data={data} />

      {/* Summary Stats */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{data.ecrs.length}</div>
            <div className="text-sm text-gray-500">Total ECRs</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{data.ecos.length}</div>
            <div className="text-sm text-gray-500">Total ECOs</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{data.ecns.length}</div>
            <div className="text-sm text-gray-500">Total ECNs</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {data.ecrs.filter(ecr => ecr.status === 'CONVERTED').length}
            </div>
            <div className="text-sm text-gray-500">Bundled ECRs</div>
          </div>
        </div>
      </div>
    </div>
  );
}