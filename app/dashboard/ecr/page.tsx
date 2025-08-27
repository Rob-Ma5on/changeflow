'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Toast from '@/components/Toast';
import ViewToggle, { ViewMode } from '@/components/view-toggle';
import FilterBar, { FilterState } from '@/components/filter-bar';
import EntityCard from '@/components/entity-card';
import ColumnHeader, { SortDirection } from '@/components/column-header';
import SkeletonCard from '@/components/skeleton-card';
import EmptyState, { ECREmptyState, FilterEmptyState } from '@/components/empty-state';
import { exportToExcel, formatECRsForExport } from '@/components/export-utils';

interface ECR {
  id: string;
  ecrNumber: string;
  title: string;
  status: string;
  urgency: string;
  priority: string;
  customerImpact: string;
  estimatedCostRange?: string;
  targetImplementationDate?: string;
  submitter: { id: string; name: string; email: string };
  assignee?: { id: string; name: string; email: string };
  approver?: { id: string; name: string; email: string };
  organization: { id: string; name: string };
  createdAt: string;
  costImpact?: number;
  description: string;
  reason: string;
  eco?: {
    id: string;
    ecoNumber: string;
    title: string;
    status: string;
  };
}

export default function ECRPage() {
  const { data: session } = useSession();
  const [ecrs, setEcrs] = useState<ECR[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: '',
    priority: '',
    category: '',
    assignee: '',
    dateRange: { start: '', end: '' }
  });
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: SortDirection }>({ key: '', direction: null });
  const [selectedECRs, setSelectedECRs] = useState<string[]>([]);
  const [showBundleModal, setShowBundleModal] = useState(false);
  const [bundleTitle, setBundleTitle] = useState('');
  const [bundleDescription, setBundleDescription] = useState('');
  const [bundlePriority, setBundlePriority] = useState('MEDIUM');
  const [bundling, setBundling] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [showToast, setShowToast] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

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

  const handleExport = async () => {
    if (sortedECRs.length === 0) {
      setToastMessage('No data to export');
      setToastType('error');
      setShowToast(true);
      return;
    }

    setIsExporting(true);
    try {
      const exportData = formatECRsForExport(sortedECRs);
      const success = exportToExcel(exportData, 'ECRs', 'Engineering_Change_Requests');
      
      if (success) {
        setToastMessage(`Successfully exported ${sortedECRs.length} ECRs to Excel`);
        setToastType('success');
      } else {
        setToastMessage('Failed to export data');
        setToastType('error');
      }
    } catch (error) {
      console.error('Export error:', error);
      setToastMessage('Failed to export data');
      setToastType('error');
    } finally {
      setIsExporting(false);
      setShowToast(true);
    }
  };

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

  const getUrgencyStyle = (urgency: string) => {
    const urgencyConfig = {
      LOW: { backgroundColor: '#22C55E', color: '#FFFFFF' },
      MEDIUM: { backgroundColor: '#EAB308', color: '#FFFFFF' },
      HIGH: { backgroundColor: '#EF4444', color: '#FFFFFF' },
      CRITICAL: { backgroundColor: '#EF4444', color: '#FFFFFF' }
    };
    return urgencyConfig[urgency as keyof typeof urgencyConfig] || urgencyConfig.MEDIUM;
  };

  const filteredECRs = ecrs.filter((ecr) => {
    const matchesSearch = !filters.search ||
      ecr.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      ecr.ecrNumber.toLowerCase().includes(filters.search.toLowerCase());
    const matchesStatus = !filters.status || ecr.status === filters.status;
    const matchesPriority = !filters.priority || ecr.priority === filters.priority;
    const matchesCustomerImpact = !filters.category || ecr.customerImpact === filters.category;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesCustomerImpact;
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
      const response = await fetch('/api/eco/bundle', {
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

  const handleSort = (key: string) => {
    let direction: SortDirection = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = null;
    }
    setSortConfig({ key, direction });
  };

  const sortedECRs = [...filteredECRs].sort((a, b) => {
    if (!sortConfig.direction) return 0;
    
    const aValue = a[sortConfig.key as keyof ECR];
    const bValue = b[sortConfig.key as keyof ECR];
    
    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const statusOptions = [
    { value: 'DRAFT', label: 'Draft' },
    { value: 'SUBMITTED', label: 'Submitted' },
    { value: 'UNDER_REVIEW', label: 'Under Review' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'CONVERTED', label: 'Converted to ECO' },
    { value: 'REJECTED', label: 'Rejected' },
    { value: 'IMPLEMENTED', label: 'Implemented' },
    { value: 'CANCELLED', label: 'Cancelled' }
  ];

  const priorityOptions = [
    { value: 'CRITICAL', label: 'Critical' },
    { value: 'HIGH', label: 'High' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'LOW', label: 'Low' }
  ];

  const customerImpactOptions = [
    { value: 'DIRECT_IMPACT', label: 'Direct Impact' },
    { value: 'INDIRECT_IMPACT', label: 'Indirect Impact' },
    { value: 'NO_IMPACT', label: 'No Impact' }
  ];

  const kanbanColumns = [
    { id: 'DRAFT', title: 'Draft', status: ['DRAFT'] },
    { id: 'REVIEW', title: 'Under Review', status: ['SUBMITTED', 'UNDER_REVIEW'] },
    { id: 'APPROVED', title: 'Approved', status: ['APPROVED'] },
    { id: 'COMPLETE', title: 'Complete', status: ['CONVERTED', 'IMPLEMENTED', 'REJECTED', 'CANCELLED'] }
  ];

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
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="h-8 bg-gray-200 rounded w-80 animate-pulse mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-60 animate-pulse"></div>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded w-24 animate-pulse"></div>
          </div>
        </div>

        {/* Filter Bar Skeleton */}
        <div className="bg-white rounded-lg p-4 mb-6 border border-gray-200">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="h-10 bg-gray-200 rounded flex-1 min-w-64 animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded w-28 animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded w-36 animate-pulse"></div>
          </div>
        </div>

        {/* Content Skeleton - Kanban by default */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="h-5 bg-gray-200 rounded w-24 animate-pulse"></div>
                <div className="h-6 w-6 bg-gray-200 rounded-full animate-pulse"></div>
              </div>
              <div className="space-y-3">
                {Array.from({ length: 3 }, (_, j) => (
                  <SkeletonCard key={j} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Engineering Change Requests</h1>
          <p className="text-gray-600 mt-2">Manage and track all change requests</p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex flex-col sm:flex-row gap-2">
            {selectedApprovedECRs.length >= 2 && (
              <button
                onClick={() => setShowBundleModal(true)}
                className="inline-flex items-center px-3 sm:px-4 py-2 border border-transparent text-xs sm:text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                <span className="hidden sm:inline">Bundle {selectedApprovedECRs.length} ECRs into ECO</span>
                <span className="sm:hidden">Bundle ({selectedApprovedECRs.length})</span>
              </button>
            )}
            <Link
              href="/dashboard/ecr/new"
              className="inline-flex items-center px-3 sm:px-4 py-2 border border-transparent text-xs sm:text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New ECR
            </Link>
          </div>
          <ViewToggle viewMode={viewMode} onViewChange={setViewMode} />
        </div>
      </div>

      {/* Filters */}
      <FilterBar
        filters={filters}
        onFiltersChange={setFilters}
        statusOptions={statusOptions}
        priorityOptions={priorityOptions}
        categoryOptions={customerImpactOptions}
        showPriority={true}
        showCategory={true}
        categoryLabel="Customer Impact"
        onExport={handleExport}
        exportDisabled={sortedECRs.length === 0}
        isExporting={isExporting}
      />

      {/* Main Content */}
      {sortedECRs.length === 0 ? (
        // Empty State
        ecrs.length === 0 ? (
          <ECREmptyState />
        ) : (
          <FilterEmptyState onClearFilters={() => setFilters({
            search: '',
            status: '',
            priority: '',
            category: '',
            assignee: '',
            dateRange: { start: '', end: '' }
          })} />
        )
      ) : viewMode === 'kanban' ? (
        // Kanban View
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {kanbanColumns.map((column) => {
            const columnECRs = sortedECRs.filter(ecr => column.status.includes(ecr.status));
            return (
              <div key={column.id} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">{column.title}</h3>
                  <span className="bg-gray-200 text-gray-700 text-xs font-medium px-2 py-1 rounded-full">
                    {columnECRs.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {columnECRs.map((ecr) => (
                    <div key={ecr.id} className="relative">
                      {ecr.status === 'APPROVED' && (
                        <input
                          type="checkbox"
                          checked={selectedECRs.includes(ecr.id)}
                          onChange={() => handleSelectECR(ecr.id)}
                          className="absolute top-2 right-2 z-10 text-blue-600 focus:ring-blue-500"
                        />
                      )}
                      <EntityCard
                        entityType="ECR"
                        number={ecr.ecrNumber}
                        title={ecr.title}
                        priority={ecr.urgency as 'HIGH' | 'MEDIUM' | 'LOW'}
                        status={ecr.status}
                        requestor={{
                          name: ecr.submitter.name,
                          email: ecr.submitter.email
                        }}
                        createdDate={ecr.createdAt}
                        onClick={() => window.location.href = `/dashboard/ecr/${ecr.id}`}
                        className={ecr.status === 'APPROVED' ? 'pr-8' : ''}
                        linkedEntity={ecr.eco ? {
                          type: 'ECO',
                          id: ecr.eco.id,
                          number: ecr.eco.ecoNumber,
                          title: ecr.eco.title
                        } : undefined}
                      />
                    </div>
                  ))}
                  {columnECRs.length === 0 && (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      No ECRs in {column.title.toLowerCase()}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // List View
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
                  <ColumnHeader
                    title="ECR Number"
                    sortKey="ecrNumber"
                    currentSort={sortConfig}
                    onSort={handleSort}
                  />
                  <ColumnHeader
                    title="Title"
                    sortKey="title"
                    currentSort={sortConfig}
                    onSort={handleSort}
                  />
                  <ColumnHeader
                    title="Priority"
                    sortKey="priority"
                    currentSort={sortConfig}
                    onSort={handleSort}
                  />
                  <ColumnHeader
                    title="Customer Impact"
                    sortKey="customerImpact"
                    currentSort={sortConfig}
                    onSort={handleSort}
                    className="hidden md:table-cell"
                  />
                  <ColumnHeader
                    title="Status"
                    sortKey="status"
                    currentSort={sortConfig}
                    onSort={handleSort}
                  />
                  <ColumnHeader
                    title="Cost Range"
                    sortKey="estimatedCostRange"
                    currentSort={sortConfig}
                    onSort={handleSort}
                    className="hidden lg:table-cell"
                  />
                  <ColumnHeader
                    title="Target Date"
                    sortKey="targetImplementationDate"
                    currentSort={sortConfig}
                    onSort={handleSort}
                    className="hidden lg:table-cell"
                  />
                  <ColumnHeader
                    title="Created Date"
                    sortKey="createdAt"
                    currentSort={sortConfig}
                    onSort={handleSort}
                    className="hidden sm:table-cell"
                  />
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedECRs.map((ecr) => (
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
                      <span 
                        className={`px-2 py-1 text-xs font-medium rounded-full text-white ${
                          ecr.priority === 'CRITICAL' ? 'bg-red-500' :
                          ecr.priority === 'HIGH' ? 'bg-orange-500' :
                          ecr.priority === 'MEDIUM' ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}
                      >
                        {ecr.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden md:table-cell">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        ecr.customerImpact === 'DIRECT_IMPACT' ? 'bg-red-100 text-red-800' :
                        ecr.customerImpact === 'INDIRECT_IMPACT' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {ecr.customerImpact?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(ecr.status)}`}>
                        {getStatusLabel(ecr.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden lg:table-cell">
                      {ecr.estimatedCostRange ? (
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          {ecr.estimatedCostRange.replace(/_/g, ' ').replace('FROM ', '$').replace('TO', '-$').replace('UNDER', '<$').replace('OVER', '>$')}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden lg:table-cell">
                      {ecr.targetImplementationDate ? formatDate(ecr.targetImplementationDate) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
                      {formatDate(ecr.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
                        <div key={ecrId} className="text-sm text-gray-900 py-1">
                          <span className="font-semibold">{ecr.ecrNumber}</span> - {ecr.title}
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