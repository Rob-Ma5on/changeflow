'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Toast from '@/components/Toast';
import ViewToggle, { ViewMode } from '@/components/view-toggle';
import FilterBar, { FilterState } from '@/components/filter-bar';
import ColumnHeader, { SortDirection } from '@/components/column-header';
import { exportToExcel, formatECOsForExport } from '@/components/export-utils';
import EntityCard from '@/components/entity-card';

interface ECO {
  id: string;
  ecoNumber: string;
  title: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'BACKLOG' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  effectiveDate: string;
  materialDisposition: string;
  estimatedTotalCost?: number;
  inventoryImpact: boolean;
  effectivityType?: string;
  submitter?: {
    id: string;
    name: string;
    email: string;
  };
  assignee?: { 
    id: string;
    name: string;
    email: string;
  };
  ecr?: {
    id: string;
    ecrNumber: string;
    title: string;
  };
  ecrs?: {
    id: string;
    ecrNumber: string;
    title: string;
    submitter?: { name: string };
  }[];
  targetDate?: string;
  createdAt: string;
}

interface Column {
  id: string;
  title: string;
  status: ECO['status'];
  count: number;
}

interface ECODetailModalProps {
  eco: ECO | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate: (ecoId: string, newStatus: ECO['status']) => void;
}

function ECODetailModal({ eco, isOpen, onClose, onStatusUpdate }: ECODetailModalProps) {
  const [currentStatus, setCurrentStatus] = useState(eco?.status || 'BACKLOG');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (eco) {
      setCurrentStatus(eco.status);
    }
  }, [eco]);

  if (!isOpen || !eco) return null;

  const statusOptions = [
    { value: 'DRAFT', label: 'Draft' },
    { value: 'SUBMITTED', label: 'Submitted' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'BACKLOG', label: 'Backlog' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'REVIEW', label: 'Review' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'CANCELLED', label: 'Cancelled' }
  ];

  const handleStatusChange = async (newStatus: ECO['status']) => {
    if (newStatus === eco.status) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/eco/${eco.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setCurrentStatus(newStatus);
        onStatusUpdate(eco.id, newStatus);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Failed to update ECO status:', errorData);
        alert(`Failed to update status: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating ECO status:', error);
      alert('Failed to update status: Network error');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{eco.ecoNumber}</h2>
              <p className="text-gray-600">{eco.title}</p>
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
            {/* Status and Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={currentStatus}
                  onChange={(e) => handleStatusChange(e.target.value as ECO['status'])}
                  disabled={isUpdating}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white disabled:bg-gray-100"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {isUpdating && (
                  <p className="text-xs text-blue-600 mt-1">Updating status...</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Priority</label>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  eco.priority === 'LOW' ? 'text-white' :
                  eco.priority === 'MEDIUM' ? 'text-white' :
                  eco.priority === 'HIGH' ? 'text-white' :
                  'text-white'
                }`}
                style={{
                  backgroundColor: 
                    eco.priority === 'LOW' ? '#22C55E' :
                    eco.priority === 'MEDIUM' ? '#EAB308' :
                    eco.priority === 'HIGH' ? '#EF4444' :
                    '#6B7280'
                }}>
                  {eco.priority}
                </span>
              </div>
            </div>

            {/* Assignee */}
            {eco.assignee && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Assigned Engineer</label>
                <p className="text-gray-900">{eco.assignee.name}</p>
              </div>
            )}

            {/* Linked ECRs */}
            {eco.ecrs && eco.ecrs.length > 0 ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bundled ECRs ({eco.ecrs.length})</label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {eco.ecrs.map((ecr) => (
                    <div key={ecr.id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                      <span>📝</span>
                      <Link 
                        href={`/dashboard/ecr/${ecr.id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                      >
                        {ecr.ecrNumber}
                      </Link>
                      <span className="text-gray-600 text-sm truncate">
                        {ecr.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : eco.ecr && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Linked ECR</label>
                <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                  <span>📝</span>
                  <Link 
                    href={`/dashboard/ecr/${eco.ecr.id}`}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {eco.ecr.ecrNumber}
                  </Link>
                  <span className="text-gray-600">
                    {eco.ecr.title}
                  </span>
                </div>
              </div>
            )}

            {/* Target Date */}
            {eco.targetDate && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Target Date</label>
                <p className="text-gray-900">
                  {new Date(eco.targetDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            )}

            {/* Created Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Created</label>
              <p className="text-gray-900">
                {new Date(eco.createdAt).toLocaleDateString('en-US', {
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

function ECOCard({ eco, onClick, onCreateECN }: { eco: ECO; onClick: () => void; onCreateECN?: (ecoId: string) => void }) {
  return (
    <div className="relative">
      <EntityCard
        entityType="ECO"
        number={eco.ecoNumber}
        title={eco.title}
        priority={eco.priority as 'HIGH' | 'MEDIUM' | 'LOW'}
        status={eco.status}
        requestor={eco.submitter}
        assignee={eco.assignee}
        createdDate={eco.createdAt}
        dueDate={eco.targetDate}
        onClick={onClick}
        ecrCount={eco.ecrs?.length}
        linkedEntity={eco.ecr ? {
          type: 'ECR',
          id: eco.ecr.id,
          number: eco.ecr.ecrNumber,
          title: eco.ecr.title
        } : undefined}
      />
      
      {/* ECN Creation Button for Completed ECOs */}
      {eco.status === 'COMPLETED' && onCreateECN && (
        <div className="absolute top-2 right-2 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCreateECN(eco.id);
            }}
            className="px-2 py-1 text-xs font-medium text-purple-700 bg-purple-100 border border-purple-200 rounded hover:bg-purple-200 transition-colors"
          >
            Create ECN
          </button>
        </div>
      )}
    </div>
  );
}

function KanbanColumn({ column, ecos, onECOClick, onCreateECN }: {
  column: Column;
  ecos: ECO[];
  onECOClick: (eco: ECO) => void;
  onCreateECN?: (ecoId: string) => void;
}) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 flex-1 min-h-[600px]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-900">{column.title}</h3>
        <span className="bg-gray-200 text-gray-600 px-2 py-1 text-xs rounded-full">
          {ecos.length}
        </span>
      </div>
      
      <div className="space-y-3 min-h-[500px]">
        {ecos.map((eco) => (
          <ECOCard
            key={eco.id}
            eco={eco}
            onClick={() => onECOClick(eco)}
            onCreateECN={onCreateECN}
          />
        ))}
        
        {ecos.length === 0 && (
          <div className="text-center text-gray-400 text-sm py-8">
            No items in {column.title.toLowerCase()}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ECOPage() {
  const { data: session } = useSession();
  const [ecos, setEcos] = useState<ECO[]>([]);
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
  const [selectedECO, setSelectedECO] = useState<ECO | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [showToast, setShowToast] = useState(false);
  const [isExporting, setIsExporting] = useState(false);


  const columns: Column[] = [
    { id: 'BACKLOG', title: 'Backlog', status: 'BACKLOG', count: 0 },
    { id: 'IN_PROGRESS', title: 'In Progress', status: 'IN_PROGRESS', count: 0 },
    { id: 'REVIEW', title: 'Review', status: 'REVIEW', count: 0 },
    { id: 'COMPLETED', title: 'Completed', status: 'COMPLETED', count: 0 },
  ];

  useEffect(() => {
    const fetchECOs = async () => {
      try {
        const response = await fetch('/api/eco');
        if (response.ok) {
          const ecoData = await response.json();
          setEcos(ecoData);
        } else {
          console.error('Failed to fetch ECOs');
        }
      } catch (error) {
        console.error('Error fetching ECOs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchECOs();
  }, []);

  const handleExport = async () => {
    if (sortedEcos.length === 0) {
      setToastMessage('No data to export');
      setToastType('error');
      setShowToast(true);
      return;
    }

    setIsExporting(true);
    try {
      const exportData = formatECOsForExport(sortedEcos);
      const success = exportToExcel(exportData, 'ECOs', 'Engineering_Change_Orders');
      
      if (success) {
        setToastMessage(`Successfully exported ${sortedEcos.length} ECOs to Excel`);
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

  // Map ECO status to Kanban column status
  const mapStatusToColumn = (ecoStatus: ECO['status']): 'BACKLOG' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED' => {
    switch (ecoStatus) {
      case 'DRAFT':
      case 'SUBMITTED':
      case 'APPROVED':
      case 'BACKLOG':
        return 'BACKLOG';
      case 'IN_PROGRESS':
        return 'IN_PROGRESS';
      case 'REVIEW':
        return 'REVIEW';
      case 'COMPLETED':
        return 'COMPLETED';
      case 'CANCELLED':
        return 'COMPLETED'; // Show cancelled items in completed column
      default:
        return 'BACKLOG';
    }
  };

  const filteredEcos = ecos.filter((eco) => {
    const matchesSearch = !filters.search ||
      eco.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      eco.ecoNumber.toLowerCase().includes(filters.search.toLowerCase());
    const matchesStatus = !filters.status || eco.status === filters.status;
    const matchesPriority = !filters.priority || eco.priority === filters.priority;
    const matchesAssignee = !filters.assignee || eco.assignee?.id === filters.assignee;
    const matchesMaterialDisposition = !filters.category || eco.materialDisposition === filters.category;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesAssignee && matchesMaterialDisposition;
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

  const sortedEcos = [...filteredEcos].sort((a, b) => {
    if (!sortConfig.direction) return 0;
    
    const aValue = a[sortConfig.key as keyof ECO];
    const bValue = b[sortConfig.key as keyof ECO];
    
    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const getEcosForColumn = (columnStatus: 'BACKLOG' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED') => {
    return filteredEcos.filter(eco => mapStatusToColumn(eco.status) === columnStatus);
  };

  const statusOptions = [
    { value: 'DRAFT', label: 'Draft' },
    { value: 'SUBMITTED', label: 'Submitted' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'BACKLOG', label: 'Backlog' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'REVIEW', label: 'Review' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'CANCELLED', label: 'Cancelled' }
  ];

  const materialDispositionOptions = [
    { value: 'NO_IMPACT', label: 'No Impact' },
    { value: 'USE_AS_IS', label: 'Use As Is' },
    { value: 'REWORK', label: 'Rework' },
    { value: 'SCRAP', label: 'Scrap' },
    { value: 'RETURN_TO_VENDOR', label: 'Return to Vendor' },
    { value: 'SORT_INSPECT', label: 'Sort & Inspect' }
  ];

  const effectivityTypeOptions = [
    { value: 'DATE_BASED', label: 'Date Based' },
    { value: 'IMMEDIATE', label: 'Immediate' }
  ];

  const assigneeOptions = ecos.reduce((acc, eco) => {
    if (eco.assignee && !acc.find(a => a.value === eco.assignee!.id)) {
      acc.push({ value: eco.assignee.id, label: eco.assignee.name });
    }
    return acc;
  }, [] as { value: string; label: string }[]);


  const handleECOClick = (eco: ECO) => {
    setSelectedECO(eco);
    setIsModalOpen(true);
  };

  const handleStatusUpdate = (ecoId: string, newStatus: ECO['status']) => {
    setEcos(prevEcos =>
      prevEcos.map(eco =>
        eco.id === ecoId ? { ...eco, status: newStatus } : eco
      )
    );
    setToastMessage('ECO status updated successfully');
    setToastType('success');
    setShowToast(true);
  };

  const handleCreateECN = async (ecoId: string) => {
    try {
      const response = await fetch('/api/ecn/create-from-eco', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ecoId }),
      });

      if (response.ok) {
        const ecnData = await response.json();
        setToastMessage(`ECN ${ecnData.ecnNumber} created successfully`);
        setToastType('success');
        setShowToast(true);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        setToastMessage(`Failed to create ECN: ${errorData.error}`);
        setToastType('error');
        setShowToast(true);
      }
    } catch (error) {
      console.error('Error creating ECN:', error);
      setToastMessage('Failed to create ECN: Network error');
      setToastType('error');
      setShowToast(true);
    }
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Engineering Change Orders</h1>
          <p className="text-gray-600 mt-2">Track implementation progress</p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <Link
              href="/dashboard/ecr/convert"
              className="inline-flex items-center px-3 sm:px-4 py-2 border border-gray-300 text-xs sm:text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              <span className="hidden sm:inline">Convert ECR to ECO</span>
              <span className="sm:hidden">Convert</span>
            </Link>
            <Link
              href="/dashboard/eco/new"
              className="inline-flex items-center px-3 sm:px-4 py-2 border border-transparent text-xs sm:text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New ECO
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
        assigneeOptions={assigneeOptions}
        categoryOptions={materialDispositionOptions}
        showAssignee={true}
        showCategory={true}
        categoryLabel="Material Disposition"
        onExport={handleExport}
        exportDisabled={sortedEcos.length === 0}
        isExporting={isExporting}
      />

      {/* Main Content */}
      {viewMode === 'kanban' ? (
        // Kanban View
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              ecos={getEcosForColumn(column.status)}
              onECOClick={handleECOClick}
              onCreateECN={handleCreateECN}
            />
          ))}
        </div>
      ) : (
        // List View
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <ColumnHeader
                    title="ECO Number"
                    sortKey="ecoNumber"
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
                    title="Status"
                    sortKey="status"
                    currentSort={sortConfig}
                    onSort={handleSort}
                  />
                  <ColumnHeader
                    title="Effective Date"
                    sortKey="effectiveDate"
                    currentSort={sortConfig}
                    onSort={handleSort}
                    className="hidden md:table-cell"
                  />
                  <ColumnHeader
                    title="Material Disposition"
                    sortKey="materialDisposition"
                    currentSort={sortConfig}
                    onSort={handleSort}
                    className="hidden lg:table-cell"
                  />
                  <ColumnHeader
                    title="Estimated Cost"
                    sortKey="estimatedTotalCost"
                    currentSort={sortConfig}
                    onSort={handleSort}
                    className="hidden lg:table-cell"
                  />
                  <ColumnHeader
                    title="Inventory Impact"
                    sortKey="inventoryImpact"
                    currentSort={sortConfig}
                    onSort={handleSort}
                    className="hidden sm:table-cell"
                  />
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedEcos.map((eco) => (
                  <tr key={eco.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium cursor-pointer" onClick={() => handleECOClick(eco)}>
                      <span className="text-blue-600 hover:text-blue-800">
                        {eco.ecoNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-xs truncate">
                        {eco.title}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span 
                        className="px-2 py-1 text-xs font-medium rounded-full text-white"
                        style={{
                          backgroundColor: 
                            eco.priority === 'LOW' ? '#22C55E' :
                            eco.priority === 'MEDIUM' ? '#EAB308' :
                            eco.priority === 'HIGH' ? '#EF4444' :
                            '#6B7280'
                        }}
                      >
                        {eco.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        eco.status === 'DRAFT' ? 'bg-gray-100 text-gray-800' :
                        eco.status === 'BACKLOG' ? 'bg-gray-100 text-gray-800' :
                        eco.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                        eco.status === 'REVIEW' ? 'bg-amber-100 text-amber-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {eco.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                      {new Date(eco.effectiveDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden lg:table-cell">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        eco.materialDisposition === 'SCRAP' ? 'bg-red-100 text-red-800' :
                        eco.materialDisposition === 'REWORK' ? 'bg-yellow-100 text-yellow-800' :
                        eco.materialDisposition === 'NO_IMPACT' ? 'bg-green-100 text-green-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {eco.materialDisposition?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden lg:table-cell">
                      {eco.estimatedTotalCost ? 
                        `$${eco.estimatedTotalCost.toLocaleString()}` : 
                        '-'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden sm:table-cell">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        eco.inventoryImpact ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {eco.inventoryImpact ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
                      {new Date(eco.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleECOClick(eco)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </button>
                        {eco.status === 'COMPLETED' && (
                          <button
                            onClick={() => handleCreateECN(eco.id)}
                            className="text-purple-600 hover:text-purple-900"
                          >
                            Create ECN
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {sortedEcos.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {ecos.length === 0 ? (
                <div>
                  <h3 className="text-lg font-medium">No ECOs found</h3>
                  <p className="mt-2">Convert approved ECRs to ECOs to start implementation.</p>
                </div>
              ) : (
                <div>
                  <h3 className="text-lg font-medium">No ECOs match your filters</h3>
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
          {columns.map((column) => (
            <div key={column.id} className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {getEcosForColumn(column.status).length}
              </div>
              <div className="text-sm text-gray-500">{column.title}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ECO Detail Modal */}
      <ECODetailModal
        eco={selectedECO}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedECO(null);
        }}
        onStatusUpdate={handleStatusUpdate}
      />

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