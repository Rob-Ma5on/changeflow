'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ECO {
  id: string;
  ecoNumber: string;
  title: string;
  status: string;
  priority: string;
  submitter: { name: string };
  assignee?: { name: string };
  targetDate?: string;
  ecr?: { ecrNumber: string };
}

const KANBAN_COLUMNS = [
  { id: 'DRAFT', title: 'Backlog', status: ['DRAFT', 'SUBMITTED'] },
  { id: 'IN_PROGRESS', title: 'In Progress', status: ['APPROVED', 'IN_PROGRESS'] },
  { id: 'REVIEW', title: 'Review', status: ['REVIEW'] },
  { id: 'COMPLETED', title: 'Complete', status: ['COMPLETED', 'CANCELLED'] }
];

export default function ECOPage() {
  const [ecos, setEcos] = useState<ECO[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedItem, setDraggedItem] = useState<ECO | null>(null);

  useEffect(() => {
    const fetchECOs = async () => {
      try {
        // Mock data for now - replace with actual API call
        const mockECOs: ECO[] = [
          {
            id: '1',
            ecoNumber: 'ECO-0001',
            title: 'Implement Material Specification Update for Component X',
            status: 'IN_PROGRESS',
            priority: 'HIGH',
            submitter: { name: 'Admin User' },
            assignee: { name: 'John Engineer' },
            targetDate: '2024-02-15T00:00:00Z',
            ecr: { ecrNumber: 'ECR-0002' }
          },
          {
            id: '2',
            ecoNumber: 'ECO-0002',
            title: 'Widget Assembly Process Improvement',
            status: 'DRAFT',
            priority: 'MEDIUM',
            submitter: { name: 'Sarah Manager' },
            assignee: { name: 'Mike Designer' },
            targetDate: '2024-03-01T00:00:00Z',
            ecr: { ecrNumber: 'ECR-0001' }
          },
          {
            id: '3',
            ecoNumber: 'ECO-0003',
            title: 'Safety Enhancement Implementation',
            status: 'APPROVED',
            priority: 'CRITICAL',
            submitter: { name: 'Lisa Safety' },
            assignee: { name: 'John Engineer' },
            targetDate: '2024-02-28T00:00:00Z'
          },
          {
            id: '4',
            ecoNumber: 'ECO-0004',
            title: 'Packaging Design Update',
            status: 'COMPLETED',
            priority: 'LOW',
            submitter: { name: 'Mike Designer' },
            assignee: { name: 'Sarah Manager' },
            targetDate: '2024-01-30T00:00:00Z'
          }
        ];
        setEcos(mockECOs);
      } catch (error) {
        console.error('Error fetching ECOs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchECOs();
  }, []);

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
      month: 'short',
      day: 'numeric'
    });
  };

  const handleDragStart = (eco: ECO) => {
    setDraggedItem(eco);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    if (draggedItem) {
      const newStatus = columnId === 'REVIEW' ? 'REVIEW' : columnId;
      setEcos(prevEcos =>
        prevEcos.map(eco =>
          eco.id === draggedItem.id ? { ...eco, status: newStatus } : eco
        )
      );
      setDraggedItem(null);
    }
  };

  const getEcosForColumn = (columnStatuses: string[]) => {
    return ecos.filter(eco => columnStatuses.includes(eco.status));
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
          <h1 className="text-3xl font-bold text-gray-900">Engineering Change Orders</h1>
          <p className="text-gray-600 mt-2">Track implementation progress with Kanban board</p>
        </div>
        <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700">
          <span className="mr-2">+</span>
          New ECO
        </button>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {KANBAN_COLUMNS.map((column) => (
          <div key={column.id} className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-900">{column.title}</h3>
              <span className="bg-gray-200 text-gray-600 px-2 py-1 text-xs rounded-full">
                {getEcosForColumn(column.status).length}
              </span>
            </div>
            
            <div
              className="space-y-3 min-h-[400px]"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {getEcosForColumn(column.status).map((eco) => (
                <div
                  key={eco.id}
                  draggable
                  onDragStart={() => handleDragStart(eco)}
                  onDragEnd={handleDragEnd}
                  className={`bg-white p-4 rounded-lg shadow-sm border border-gray-200 cursor-move hover:shadow-md transition-shadow ${
                    draggedItem?.id === eco.id ? 'opacity-50' : ''
                  }`}
                >
                  {/* ECO Header */}
                  <div className="flex items-start justify-between mb-2">
                    <Link 
                      href={`/dashboard/eco/${eco.id}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      {eco.ecoNumber}
                    </Link>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityBadge(eco.priority)}`}>
                      {eco.priority}
                    </span>
                  </div>

                  {/* ECO Title */}
                  <h4 className="text-sm font-medium text-gray-900 mb-3 line-clamp-2">
                    {eco.title}
                  </h4>

                  {/* ECR Reference */}
                  {eco.ecr && (
                    <div className="text-xs text-gray-500 mb-2">
                      From {eco.ecr.ecrNumber}
                    </div>
                  )}

                  {/* Assignee and Target Date */}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mr-2">
                        <span className="text-white text-xs font-medium">
                          {eco.assignee?.name.charAt(0) || '?'}
                        </span>
                      </div>
                      <span>{eco.assignee?.name || 'Unassigned'}</span>
                    </div>
                    {eco.targetDate && (
                      <span className="text-gray-400">
                        Due {formatDate(eco.targetDate)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              
              {/* Empty state for columns */}
              {getEcosForColumn(column.status).length === 0 && (
                <div className="text-center text-gray-400 text-sm py-8">
                  No items in {column.title.toLowerCase()}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {KANBAN_COLUMNS.map((column) => (
            <div key={column.id} className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {getEcosForColumn(column.status).length}
              </div>
              <div className="text-sm text-gray-500">{column.title}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}