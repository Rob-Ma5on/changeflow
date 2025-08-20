'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Toast from '@/components/Toast';

interface ECR {
  id: string;
  ecrNumber: string;
  title: string;
  status: string;
  urgency: string;
  submitter: { id: string; name: string; email: string };
  assignee?: { id: string; name: string; email: string };
  approver?: { id: string; name: string; email: string };
  organization: { id: string; name: string };
  createdAt: string;
  costImpact?: number;
  description: string;
  reason: string;
}

export default function ECRPage() {
  const { data: session } = useSession();
  const [ecrs, setEcrs] = useState<ECR[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState('all');
  const [selectedECRs, setSelectedECRs] = useState<string[]>([]);
  const [showBundleModal, setShowBundleModal] = useState(false);
  const [bundleTitle, setBundleTitle] = useState('');
  const [bundleDescription, setBundleDescription] = useState('');
  const [bundlePriority, setBundlePriority] = useState('MEDIUM');
  const [bundling, setBundling] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const fetchECRs = async () => {
      try {
        const response = await fetch('/api/ecr');
        if (response.ok) {
          const ecrData = await response.json();
          setEcrs(ecrData);
        } else {
          console.error('Failed to fetch ECRs');
        }
      } catch (error) {
        console.error('Error fetching ECRs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchECRs();
  }, []);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      DRAFT: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Draft' },
      SUBMITTED: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Submitted' },
      UNDER_REVIEW: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'Under Review' },
      APPROVED: { bg: 'bg-green-100', text: 'text-green-800', label: 'Approved' },
      CONVERTED: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Converted to ECO' },
      REJECTED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected' },
      IMPLEMENTED: { bg: 'bg-green-100', text: 'text-green-800', label: 'Implemented' },
      CANCELLED: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Cancelled' }
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.DRAFT;
    return `${config.bg} ${config.text}`;
  };

  const getStatusLabel = (status: string) => {
    const statusConfig = {
      DRAFT: 'Draft',
      SUBMITTED: 'Submitted',
      UNDER_REVIEW: 'Under Review',
      APPROVED: 'Approved',
      CONVERTED: 'Converted to ECO',
      REJECTED: 'Rejected',
      IMPLEMENTED: 'Implemented',
      CANCELLED: 'Cancelled'
    };
    return statusConfig[status as keyof typeof statusConfig] || status;
  };

  const getUrgencyBadge = (urgency: string) => {
    const urgencyConfig = {
      LOW: { bg: 'bg-green-100', text: 'text-green-800' },
      MEDIUM: { bg: 'bg-amber-100', text: 'text-amber-800' },
      HIGH: { bg: 'bg-orange-100', text: 'text-orange-800' },
      CRITICAL: { bg: 'bg-red-100', text: 'text-red-800' }
    };
    const config = urgencyConfig[urgency as keyof typeof urgencyConfig] || urgencyConfig.MEDIUM;
    return `${config.bg} ${config.text}`;
  };

  const filteredECRs = ecrs.filter((ecr) => {
    const matchesSearch = ecr.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ecr.ecrNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ecr.status === statusFilter;
    const matchesUrgency = urgencyFilter === 'all' || ecr.urgency === urgencyFilter;
    
    return matchesSearch && matchesStatus && matchesUrgency;
  });

  const approvedECRs = filteredECRs.filter(ecr => ecr.status === 'APPROVED');
  const selectedApprovedECRs = selectedECRs.filter(id => 
    approvedECRs.some(ecr => ecr.id === id)
  );

  const handleSelectECR = (ecrId: string) => {
    setSelectedECRs(prev => 
      prev.includes(ecrId) 
        ? prev.filter(id => id !== ecrId)
        : [...prev, ecrId]
    );
  };

  const handleSelectAll = () => {
    const allApprovedIds = approvedECRs.map(ecr => ecr.id);
    if (selectedApprovedECRs.length === allApprovedIds.length) {
      setSelectedECRs(prev => prev.filter(id => !allApprovedIds.includes(id)));
    } else {
      setSelectedECRs(prev => [...new Set([...prev, ...allApprovedIds])]);
    }
  };

  const handleBundleECRs = async () => {
    if (selectedApprovedECRs.length < 2) {
      setToastMessage('Please select at least 2 approved ECRs to bundle');
      setToastType('error');
      setShowToast(true);
      return;
    }

    if (!bundleTitle || !bundleDescription) {
      setToastMessage('Please provide title and description for the ECO');
      setToastType('error');
      setShowToast(true);
      return;
    }

    setBundling(true);
    try {
      const response = await fetch('/api/eco/bundle-ecrs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ecrIds: selectedApprovedECRs,
          title: bundleTitle,
          description: bundleDescription,
          priority: bundlePriority,
        }),
      });

      if (response.ok) {
        const ecoData = await response.json();
        setToastMessage(`ECO ${ecoData.ecoNumber} created successfully with ${selectedApprovedECRs.length} bundled ECRs`);
        setToastType('success');
        setShowToast(true);
        setShowBundleModal(false);
        setSelectedECRs([]);
        setBundleTitle('');
        setBundleDescription('');
        setBundlePriority('MEDIUM');
        
        // Refresh ECRs to show updated status
        const ecrResponse = await fetch('/api/ecr');
        if (ecrResponse.ok) {
          const updatedEcrs = await ecrResponse.json();
          setEcrs(updatedEcrs);
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        setToastMessage(`Failed to bundle ECRs: ${errorData.error}`);
        setToastType('error');
        setShowToast(true);
      }
    } catch (error) {
      console.error('Error bundling ECRs:', error);
      setToastMessage('Failed to bundle ECRs: Network error');
      setToastType('error');
      setShowToast(true);
    } finally {
      setBundling(false);
    }
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
          <h1 className="text-3xl font-bold text-gray-900">Engineering Change Requests</h1>
          <p className="text-gray-600 mt-2">Manage and track all change requests</p>
        </div>
        <div className="flex space-x-3">
          {selectedApprovedECRs.length >= 2 && (
            <button
              onClick={() => setShowBundleModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              Bundle {selectedApprovedECRs.length} ECRs into ECO
            </button>
          )}
          <Link
            href="/dashboard/ecr/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New ECR
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              id="search"
              placeholder="Search by title or ECR number..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="APPROVED">Approved</option>
              <option value="CONVERTED">Converted to ECO</option>
              <option value="REJECTED">Rejected</option>
              <option value="IMPLEMENTED">Implemented</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div>
            <label htmlFor="urgency" className="block text-sm font-medium text-gray-700 mb-1">
              Urgency
            </label>
            <select
              id="urgency"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value)}
            >
              <option value="all">All Urgencies</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>
        </div>
      </div>

      {/* ECR Table */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={selectedApprovedECRs.length > 0 && selectedApprovedECRs.length === approvedECRs.length}
                      onChange={handleSelectAll}
                      disabled={approvedECRs.length === 0}
                    />
                    Select
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ECR Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Urgency
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Requestor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estimated Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredECRs.map((ecr) => (
                <tr key={ecr.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {ecr.status === 'APPROVED' ? (
                      <input
                        type="checkbox"
                        checked={selectedECRs.includes(ecr.id)}
                        onChange={() => handleSelectECR(ecr.id)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                    ) : (
                      <span className="text-gray-400 text-xs">
                        {ecr.status !== 'APPROVED' ? 'Not eligible' : ''}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium cursor-pointer" onClick={() => window.location.href = `/dashboard/ecr/${ecr.id}`}>
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
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getUrgencyBadge(ecr.urgency)}`}>
                      {ecr.urgency}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(ecr.status)}`}>
                      {getStatusLabel(ecr.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {ecr.submitter.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(ecr.costImpact)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(ecr.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredECRs.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No ECRs found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter !== 'all' || urgencyFilter !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by creating your first Engineering Change Request.'}
            </p>
            {!searchTerm && statusFilter === 'all' && urgencyFilter === 'all' && (
              <div className="mt-6">
                <Link
                  href="/dashboard/ecr/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  New ECR
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bundle ECRs Modal */}
      {showBundleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Bundle ECRs into ECO</h2>
                  <p className="text-gray-600">Creating ECO from {selectedApprovedECRs.length} selected ECRs</p>
                </div>
                <button
                  onClick={() => setShowBundleModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Selected ECRs Preview */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Selected ECRs ({selectedApprovedECRs.length})
                  </label>
                  <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto">
                    {selectedApprovedECRs.map(ecrId => {
                      const ecr = ecrs.find(e => e.id === ecrId);
                      return ecr ? (
                        <div key={ecrId} className="text-sm text-gray-700 py-1">
                          <span className="font-medium">{ecr.ecrNumber}</span> - {ecr.title}
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>

                {/* ECO Details Form */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ECO Title *
                  </label>
                  <input
                    type="text"
                    value={bundleTitle}
                    onChange={(e) => setBundleTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter a descriptive title for the ECO"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ECO Description *
                  </label>
                  <textarea
                    value={bundleDescription}
                    onChange={(e) => setBundleDescription(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Describe the overall purpose and scope of this ECO"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={bundlePriority}
                    onChange={(e) => setBundlePriority(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>

              <div className="mt-8 flex justify-end space-x-3">
                <button
                  onClick={() => setShowBundleModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                  disabled={bundling}
                >
                  Cancel
                </button>
                <button
                  onClick={handleBundleECRs}
                  disabled={bundling || !bundleTitle || !bundleDescription}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {bundling ? 'Creating ECO...' : 'Create ECO'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <Toast
        message={toastMessage}
        type={toastType}
        isOpen={showToast}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
}