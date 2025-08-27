'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import ViewToggle, { ViewMode } from '@/components/view-toggle';
import FilterBar, { FilterState } from '@/components/filter-bar';
import ColumnHeader, { SortDirection } from '@/components/column-header';
import { exportToExcel, formatECNsForExport } from '@/components/export-utils';
import EntityCard from '@/components/entity-card';

interface ECN {
  id: string;
  ecnNumber: string;
  title: string;
  description: string;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'DISTRIBUTED' | 'EFFECTIVE' | 'CANCELLED';
  effectiveDate?: string;
  distributedAt?: string;
  customerNotificationRequired: string;
  responseDeadline?: string;
  implementationStatus: string;
  acknowledgmentStatus?: string;
  createdAt: string;
  submitter: { id: string; name: string; email: string };
  assignee?: { id: string; name: string; email: string };
  eco?: {
    id: string;
    ecoNumber: string;
    title: string;
    status: string;
    completedAt?: string;
    ecrs: {
      id: string;
      ecrNumber: string;
      title: string;
      submitter: { name: string };
    }[];
  };
}

interface ECNDetailModalProps {
  ecn: ECN | null;
  isOpen: boolean;
  onClose: () => void;
}

function ECNDetailModal({ ecn, isOpen, onClose }: ECNDetailModalProps) {
  if (!isOpen || !ecn) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{ecn.ecnNumber}</h2>
              <p className="text-gray-600">{ecn.title}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-6">
            {/* Traceability Chain */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-blue-900 mb-3">Traceability Chain</h3>
              <div className="flex items-center flex-wrap gap-2 text-sm">
                {ecn.eco?.ecrs && ecn.eco.ecrs.length > 0 && (
                  <>
                    {ecn.eco.ecrs.map((ecr, index) => (
                      <div key={ecr.id} className="flex items-center space-x-2">
                        <Link
                          href={`/dashboard/ecr/${ecr.id}`}
                          className="bg-gray-100 text-gray-800 px-2 py-1 rounded hover:bg-gray-200 flex items-center space-x-1"
                        >
                          <span>📝</span>
                          <span>{ecr.ecrNumber}</span>
                        </Link>
                        {index === ecn.eco.ecrs.length - 1 && (
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        )}
                      </div>
                    ))}
                  </>
                )}
                {ecn.eco && (
                  <>
                    <Link
                      href={`/dashboard/eco/${ecn.eco.id}`}
                      className="bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200"
                    >
                      {ecn.eco.ecoNumber}
                    </Link>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </>
                )}
                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded font-medium">
                  {ecn.ecnNumber}
                </span>
              </div>
              <p className="text-blue-700 text-sm mt-2">
                This ECN notifies of changes implemented through the linked ECO
                {ecn.eco?.ecrs && ecn.eco.ecrs.length > 0 && 
                  ` and ${ecn.eco.ecrs.length} original ECR${ecn.eco.ecrs.length > 1 ? 's' : ''}`
                }
              </p>
            </div>

            {/* Status and Dates */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  ecn.status === 'DRAFT' ? 'bg-gray-100 text-gray-800' :
                  ecn.status === 'PENDING_APPROVAL' ? 'bg-amber-100 text-amber-800' :
                  ecn.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                  ecn.status === 'DISTRIBUTED' ? 'bg-blue-100 text-blue-800' :
                  ecn.status === 'EFFECTIVE' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {ecn.status.replace('_', ' ')}
                </span>
              </div>
              {ecn.distributedAt && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Distributed Date</label>
                  <p className="text-gray-900">
                    {new Date(ecn.distributedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              )}
              {ecn.effectiveDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Effective Date</label>
                  <p className="text-gray-900">
                    {new Date(ecn.effectiveDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              )}
            </div>

            {/* Linked ECO Information */}
            {ecn.eco && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Linked ECO</label>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Link 
                      href={`/dashboard/eco`}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {ecn.eco.ecoNumber}: {ecn.eco.title}
                    </Link>
                    <span className="text-sm text-gray-500">
                      Completed: {ecn.eco.completedAt ? new Date(ecn.eco.completedAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  {ecn.eco.ecr && (
                    <div className="text-sm text-gray-600">
                      <strong>Original ECR:</strong> {ecn.eco.ecr.ecrNumber} - {ecn.eco.ecr.title}
                      <br />
                      <strong>Submitted by:</strong> {ecn.eco.ecr.submitter.name}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ECN Details */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <p className="text-gray-900 mt-1">{ecn.description}</p>
            </div>

            {/* Assignee */}
            {ecn.assignee && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Assigned To</label>
                <p className="text-gray-900">{ecn.assignee.name}</p>
              </div>
            )}

            {/* Created Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Created</label>
              <p className="text-gray-900">
                {new Date(ecn.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ECNPage() {
  const { data: session } = useSession();
  const [ecns, setEcns] = useState<ECN[]>([]);
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
  const [selectedECN, setSelectedECN] = useState<ECN | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const fetchECNs = async () => {
      try {
        const url = filters.status 
          ? `/api/ecn?status=${filters.status}`
          : '/api/ecn';
        
        const response = await fetch(url);
        if (response.ok) {
          const ecnData = await response.json();
          setEcns(ecnData);
        } else {
          console.error('Failed to fetch ECNs');
        }
      } catch (error) {
        console.error('Error fetching ECNs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchECNs();
  }, [filters.status]);

  const handleExport = async () => {
    if (sortedEcns.length === 0) {
      alert('No data to export');
      return;
    }

    setIsExporting(true);
    try {
      const exportData = formatECNsForExport(sortedEcns);
      const success = exportToExcel(exportData, 'ECNs', 'Engineering_Change_Notices');
      
      if (success) {
        alert(`Successfully exported ${sortedEcns.length} ECNs to Excel`);
      } else {
        alert('Failed to export data');
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  const filteredEcns = ecns.filter((ecn) => {
    const matchesSearch = !filters.search ||
      ecn.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      ecn.ecnNumber.toLowerCase().includes(filters.search.toLowerCase());
    const matchesStatus = !filters.status || ecn.status === filters.status;
    const matchesAssignee = !filters.assignee || ecn.assignee?.id === filters.assignee;
    const matchesImplementationStatus = !filters.category || ecn.implementationStatus === filters.category;
    
    return matchesSearch && matchesStatus && matchesAssignee && matchesImplementationStatus;
  });

  const handleSort = (key: string) => {
    let direction: SortDirection = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = null;
    }
    setSortConfig({ key, direction });
  };

  const sortedEcns = [...filteredEcns].sort((a, b) => {
    if (!sortConfig.direction) return 0;
    
    const aValue = a[sortConfig.key as keyof ECN];
    const bValue = b[sortConfig.key as keyof ECN];
    
    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      DRAFT: 'bg-gray-100 text-gray-800',
      PENDING_APPROVAL: 'bg-amber-100 text-amber-800',
      APPROVED: 'bg-green-100 text-green-800',
      DISTRIBUTED: 'bg-blue-100 text-blue-800',
      EFFECTIVE: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800'
    };
    return statusConfig[status as keyof typeof statusConfig] || 'bg-gray-100 text-gray-800';
  };

  const handleECNClick = (ecn: ECN) => {
    setSelectedECN(ecn);
    setIsModalOpen(true);
  };

  const statusOptions = [
    { value: 'DRAFT', label: 'Draft' },
    { value: 'PENDING_APPROVAL', label: 'Pending Approval' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'DISTRIBUTED', label: 'Distributed' },
    { value: 'EFFECTIVE', label: 'Effective' },
    { value: 'CANCELLED', label: 'Cancelled' }
  ];

  const implementationStatusOptions = [
    { value: 'NOT_STARTED', label: 'Not Started' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'COMPLETE', label: 'Complete' },
    { value: 'VERIFIED', label: 'Verified' }
  ];

  const assigneeOptions = ecns.reduce((acc, ecn) => {
    if (ecn.assignee && !acc.find(a => a.value === ecn.assignee!.id)) {
      acc.push({ value: ecn.assignee.id, label: ecn.assignee.name });
    }
    return acc;
  }, [] as { value: string; label: string }[]);

  const kanbanColumns = [
    { id: 'DRAFT', title: 'Draft', status: ['DRAFT'] },
    { id: 'PENDING_APPROVAL', title: 'Pending Approval', status: ['PENDING_APPROVAL'] },
    { id: 'APPROVED', title: 'Approved', status: ['APPROVED'] },
    { id: 'DISTRIBUTED', title: 'Distributed/Effective', status: ['DISTRIBUTED', 'EFFECTIVE'] }
  ];

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Engineering Change Notices</h1>
          <p className="text-gray-600 mt-2">Formal notifications of implemented changes</p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <Link
            href="/dashboard/ecn/new"
            className="inline-flex items-center px-3 sm:px-4 py-2 border border-transparent text-xs sm:text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New ECN
          </Link>
          <ViewToggle viewMode={viewMode} onViewChange={setViewMode} />
        </div>
      </div>

      {/* Filters */}
      <FilterBar
        filters={filters}
        onFiltersChange={setFilters}
        statusOptions={statusOptions}
        assigneeOptions={assigneeOptions}
        categoryOptions={implementationStatusOptions}
        showAssignee={true}
        showCategory={true}
        categoryLabel="Implementation Status"
        onExport={handleExport}
        exportDisabled={sortedEcns.length === 0}
        isExporting={isExporting}
      />

      {/* Main Content */}
      {viewMode === 'kanban' ? (
        // Kanban View
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {kanbanColumns.map((column) => {
            const columnEcns = sortedEcns.filter(ecn => column.status.includes(ecn.status));
            return (
              <div key={column.id} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">{column.title}</h3>
                  <span className="bg-gray-200 text-gray-700 text-xs font-medium px-2 py-1 rounded-full">
                    {columnEcns.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {columnEcns.map((ecn) => (
                    <EntityCard
                      key={ecn.id}
                      entityType="ECN"
                      number={ecn.ecnNumber}
                      title={ecn.title}
                      priority="MEDIUM" // ECNs don't have priority, use default
                      status={ecn.status}
                      assignee={ecn.assignee ? {
                        name: ecn.assignee.name,
                        email: ecn.assignee.email
                      } : undefined}
                      requestor={{
                        name: ecn.submitter.name,
                        email: ecn.submitter.email
                      }}
                      createdDate={ecn.createdAt}
                      dueDate={ecn.effectiveDate}
                      onClick={() => handleECNClick(ecn)}
                      linkedEntity={ecn.eco ? {
                        type: 'ECO',
                        id: ecn.eco.id,
                        number: ecn.eco.ecoNumber,
                        title: ecn.eco.title
                      } : undefined}
                      ecrCount={ecn.eco?.ecrs ? ecn.eco.ecrs.length : undefined}
                    />
                  ))}
                  {columnEcns.length === 0 && (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      No ECNs in {column.title.toLowerCase()}
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
          {sortedEcns.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <ColumnHeader
                      title="ECN Number"
                      sortKey="ecnNumber"
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
                      title="Customer Notification"
                      sortKey="customerNotificationRequired"
                      currentSort={sortConfig}
                      onSort={handleSort}
                      className="hidden md:table-cell"
                    />
                    <ColumnHeader
                      title="Response Deadline"
                      sortKey="responseDeadline"
                      currentSort={sortConfig}
                      onSort={handleSort}
                      className="hidden lg:table-cell"
                    />
                    <ColumnHeader
                      title="Implementation Status"
                      sortKey="implementationStatus"
                      currentSort={sortConfig}
                      onSort={handleSort}
                    />
                    <ColumnHeader
                      title="Acknowledgment Status"
                      sortKey="acknowledgmentStatus"
                      currentSort={sortConfig}
                      onSort={handleSort}
                      className="hidden lg:table-cell"
                    />
                    <ColumnHeader
                      title="Status"
                      sortKey="status"
                      currentSort={sortConfig}
                      onSort={handleSort}
                    />
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedEcns.map((ecn) => (
                    <tr 
                      key={ecn.id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleECNClick(ecn)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <span className="text-purple-600 hover:text-purple-800">
                          {ecn.ecnNumber}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="max-w-xs truncate">
                          {ecn.title}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden md:table-cell">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          ecn.customerNotificationRequired === 'FORMAL' ? 'bg-red-100 text-red-800' :
                          ecn.customerNotificationRequired === 'INFORMATIONAL' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {ecn.customerNotificationRequired?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden lg:table-cell">
                        {ecn.responseDeadline ? (
                          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                            {ecn.responseDeadline.replace('HOURS_', '').replace('DAYS_', '') + 
                             (ecn.responseDeadline.includes('HOURS') ? 'h' : 'd')}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          ecn.implementationStatus === 'NOT_STARTED' ? 'bg-gray-100 text-gray-800' :
                          ecn.implementationStatus === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                          ecn.implementationStatus === 'COMPLETE' ? 'bg-green-100 text-green-800' :
                          'bg-green-500 text-white'
                        }`}>
                          {ecn.implementationStatus?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden lg:table-cell">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          ecn.acknowledgmentStatus === 'Acknowledged' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {ecn.acknowledgmentStatus || 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(ecn.status)}`}>
                          {ecn.status.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              {ecns.length === 0 ? (
                <div>
                  <h3 className="text-lg font-medium">No ECNs found</h3>
                  <p className="mt-2">Create ECNs from completed ECOs to track change notices.</p>
                </div>
              ) : (
                <div>
                  <h3 className="text-lg font-medium">No ECNs match your filters</h3>
                  <button 
                    onClick={() => setFilters({
                      search: '',
                      status: '',
                      priority: '',
                      category: '',
                      assignee: '',
                      dateRange: { start: '', end: '' }
                    })}
                    className="mt-2 text-blue-600 hover:text-blue-800"
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Summary Stats */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {filteredEcns.filter(ecn => ecn.status === 'PENDING_APPROVAL').length}
            </div>
            <div className="text-sm text-gray-500">Pending Approval</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {filteredEcns.filter(ecn => ecn.status === 'APPROVED').length}
            </div>
            <div className="text-sm text-gray-500">Approved</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {filteredEcns.filter(ecn => ecn.status === 'DISTRIBUTED').length}
            </div>
            <div className="text-sm text-gray-500">Distributed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {filteredEcns.filter(ecn => ecn.status === 'EFFECTIVE').length}
            </div>
            <div className="text-sm text-gray-500">Effective</div>
          </div>
        </div>
      </div>

      {/* ECN Detail Modal */}
      <ECNDetailModal
        ecn={selectedECN}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedECN(null);
        }}
      />
    </div>
  );
}