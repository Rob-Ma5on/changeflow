'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Toast from '@/components/Toast';

interface ECR {
  id: string;
  ecrNumber: string;
  title: string;
  status: string;
  priority: string;
  submitter: { name: string };
  approvedAt?: string;
  costImpact?: number;
}

export default function ConvertECRPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [ecrs, setEcrs] = useState<ECR[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEcrIds, setSelectedEcrIds] = useState<string[]>([]);
  const [toast, setToast] = useState<{
    isOpen: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    isOpen: false,
    message: '',
    type: 'success'
  });

  useEffect(() => {
    const fetchApprovedECRs = async () => {
      try {
        const response = await fetch('/api/ecr?status=APPROVED');
        if (response.ok) {
          const ecrData = await response.json();
          setEcrs(ecrData);
        } else {
          console.error('Failed to fetch approved ECRs');
        }
      } catch (error) {
        console.error('Error fetching approved ECRs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchApprovedECRs();
  }, []);

  const handleToggleEcrSelection = (ecrId: string) => {
    setSelectedEcrIds(prev => 
      prev.includes(ecrId) 
        ? prev.filter(id => id !== ecrId)
        : [...prev, ecrId]
    );
  };

  const handleSelectAll = () => {
    setSelectedEcrIds(selectedEcrIds.length === ecrs.length ? [] : ecrs.map(ecr => ecr.id));
  };

  const handleCreateEcoFromSelected = () => {
    if (selectedEcrIds.length === 0) {
      setToast({
        isOpen: true,
        message: 'Please select at least one ECR to convert',
        type: 'error'
      });
      return;
    }

    const ecrIdsParam = selectedEcrIds.join(',');
    router.push(`/dashboard/eco/new?ecrIds=${ecrIdsParam}`);
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      LOW: 'bg-green-100 text-green-800',
      MEDIUM: 'bg-amber-100 text-amber-800',
      HIGH: 'bg-orange-100 text-orange-800',
      CRITICAL: 'bg-red-100 text-red-800'
    };
    return priorityConfig[priority as keyof typeof priorityConfig] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

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
          <h1 className="text-3xl font-bold text-gray-900">Convert ECR to ECO</h1>
          <p className="text-gray-600 mt-2">Select approved ECRs to convert to Engineering Change Orders</p>
        </div>
        <Link
          href="/dashboard/eco"
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to ECOs
        </Link>
      </div>

      {/* Instructions & Actions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex justify-between items-start">
          <div className="flex">
            <svg className="w-5 h-5 text-blue-400 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-blue-800">Bundle Approved ECRs into ECO</h3>
              <p className="mt-1 text-sm text-blue-700">
                Select one or more approved ECRs to bundle into a single ECO for coordinated implementation.
              </p>
            </div>
          </div>
          {selectedEcrIds.length > 0 && (
            <button
              onClick={handleCreateEcoFromSelected}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              Create ECO from Selected ({selectedEcrIds.length})
            </button>
          )}
        </div>
      </div>

      {/* Approved ECRs Table */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Select Approved ECRs to Bundle into ECO</h3>
          {ecrs.length > 0 && (
            <button
              onClick={handleSelectAll}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {selectedEcrIds.length === ecrs.length ? 'Deselect All' : 'Select All'}
            </button>
          )}
        </div>
        
        {ecrs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Select
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ECR Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitter
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cost Impact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Approved Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ecrs.map((ecr) => (
                  <tr key={ecr.id} className={`hover:bg-gray-50 ${selectedEcrIds.includes(ecr.id) ? 'bg-blue-50' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedEcrIds.includes(ecr.id)}
                        onChange={() => handleToggleEcrSelection(ecr.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link href={`/dashboard/ecr/${ecr.id}`} className="text-blue-600 hover:text-blue-800">
                        {ecr.ecrNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-xs truncate">
                        {ecr.title}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityBadge(ecr.priority)}`}>
                        {ecr.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {ecr.submitter.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(ecr.costImpact)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {ecr.approvedAt ? formatDate(ecr.approvedAt) : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No approved ECRs found</h3>
            <p className="mt-1 text-sm text-gray-500">
              No ECRs are currently approved and ready for conversion to ECOs.
            </p>
            <div className="mt-6">
              <Link
                href="/dashboard/ecr"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                View All ECRs
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isOpen={toast.isOpen}
        onClose={() => setToast(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}