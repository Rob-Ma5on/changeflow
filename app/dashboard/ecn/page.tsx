'use client';

import { useState, useEffect } from 'react';
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


export default function ECNPage() {
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
    
    // Handle null/undefined values
    if (aValue == null && bValue == null) return 0;
    if (aValue == null) return sortConfig.direction === 'asc' ? -1 : 1;
    if (bValue == null) return sortConfig.direction === 'asc' ? 1 : -1;
    
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
      <div className="space-y-6">
        {/* Info Banner Skeleton */}
        <div className="bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="h-5 w-5 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
            </div>
            <div className="ml-3 flex-1">
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-48 animate-pulse mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-full animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded w-80 animate-pulse mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-96 animate-pulse"></div>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="h-10 bg-gray-200 dark:bg-gray-600 rounded w-32 animate-pulse"></div>
          </div>
        </div>

        {/* Filter Bar Skeleton */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="h-10 bg-gray-200 dark:bg-gray-600 rounded w-72 animate-pulse"></div>
            <div className="flex gap-2">
              <div className="h-10 bg-gray-200 dark:bg-gray-600 rounded w-32 animate-pulse"></div>
              <div className="h-10 bg-gray-200 dark:bg-gray-600 rounded w-32 animate-pulse"></div>
              <div className="h-10 bg-gray-200 dark:bg-gray-600 rounded w-32 animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Kanban Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="h-5 bg-gray-200 dark:bg-gray-600 rounded w-24 animate-pulse"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded-full w-8 animate-pulse"></div>
              </div>
              <div className="space-y-3">
                {[1, 2].map((j) => (
                  <div key={j} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                    <div className="flex items-start justify-between mb-3">
                      <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-16 animate-pulse"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-12 animate-pulse"></div>
                    </div>
                    <div className="space-y-2 mb-3">
                      <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4 animate-pulse"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/2 animate-pulse"></div>
                    </div>
                    <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded-full w-20 animate-pulse mb-3"></div>
                    <div className="pt-3 border-t border-gray-100 dark:border-gray-600">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-gray-200 dark:bg-gray-600 rounded-full animate-pulse"></div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-16 animate-pulse"></div>
                        </div>
                        <div className="space-y-1">
                          <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-16 animate-pulse"></div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-12 animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Summary Skeleton */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-24 animate-pulse mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="text-center">
                <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded w-12 mx-auto animate-pulse mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-20 mx-auto animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-purple-800 dark:text-purple-200">
              Generate ECNs from Completed ECOs
            </h3>
            <div className="mt-1 text-sm text-purple-700 dark:text-purple-300">
              <p>ECNs are generated from completed ECOs to formally notify stakeholders of implemented changes. <Link href="/dashboard/eco?status=COMPLETED" className="font-medium text-purple-800 dark:text-purple-200 underline hover:text-purple-900 dark:hover:text-purple-100">View completed ECOs</Link> ready for ECN generation.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Engineering Change Notices</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">ECNs are generated from completed ECOs to formally notify of implemented changes</p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
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
              <div key={column.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{column.title}</h3>
                  <span className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs font-medium px-2 py-1 rounded-full">
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
                      onClick={() => window.location.href = `/dashboard/ecn/${ecn.id}`}
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
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
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
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {sortedEcns.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
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
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {sortedEcns.map((ecn) => (
                    <tr 
                      key={ecn.id} 
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                      onClick={() => window.location.href = `/dashboard/ecn/${ecn.id}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <span className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300">
                          {ecn.ecnNumber}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        <div className="max-w-xs truncate">
                          {ecn.title}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white hidden md:table-cell">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          ecn.customerNotificationRequired === 'FORMAL' ? 'bg-red-100 text-red-800' :
                          ecn.customerNotificationRequired === 'INFORMATIONAL' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {ecn.customerNotificationRequired?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white hidden lg:table-cell">
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white hidden lg:table-cell">
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
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {ecns.length === 0 ? (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">No ECNs found</h3>
                  <p className="mt-2 text-gray-500 dark:text-gray-400">Create ECNs from completed ECOs to track change notices.</p>
                </div>
              ) : (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">No ECNs match your filters</h3>
                  <button 
                    onClick={() => setFilters({
                      search: '',
                      status: '',
                      priority: '',
                      category: '',
                      assignee: '',
                      dateRange: { start: '', end: '' }
                    })}
                    className="mt-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
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
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {filteredEcns.filter(ecn => ecn.status === 'PENDING_APPROVAL').length}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Pending Approval</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {filteredEcns.filter(ecn => ecn.status === 'APPROVED').length}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Approved</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {filteredEcns.filter(ecn => ecn.status === 'DISTRIBUTED').length}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Distributed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {filteredEcns.filter(ecn => ecn.status === 'EFFECTIVE').length}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Effective</div>
          </div>
        </div>
      </div>

    </div>
  );
}