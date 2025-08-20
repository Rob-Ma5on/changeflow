'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Toast from '@/components/Toast';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ECO {
  id: string;
  ecoNumber: string;
  title: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'BACKLOG' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  assignee?: { 
    id: string;
    name: string; 
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
}

function ECODetailModal({ eco, isOpen, onClose }: ECODetailModalProps) {
  if (!isOpen || !eco) return null;

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
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  eco.status === 'BACKLOG' ? 'bg-gray-100 text-gray-800' :
                  eco.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                  eco.status === 'REVIEW' ? 'bg-amber-100 text-amber-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {eco.status.replace('_', ' ')}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Priority</label>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  eco.priority === 'LOW' ? 'bg-green-100 text-green-800' :
                  eco.priority === 'MEDIUM' ? 'bg-amber-100 text-amber-800' :
                  eco.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                  'bg-red-100 text-red-800'
                }`}>
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

            {/* Linked ECR */}
            {eco.ecr && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Linked ECR</label>
                <Link 
                  href={`/dashboard/ecr/${eco.ecr.id}`}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  {eco.ecr.ecrNumber}: {eco.ecr.title}
                </Link>
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
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: eco.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'bg-green-100 text-green-800';
      case 'MEDIUM': return 'bg-amber-100 text-amber-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'CRITICAL': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    // Prevent click during drag
    if (!isDragging) {
      onClick();
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 cursor-move hover:shadow-md transition-shadow"
      onClick={handleClick}
    >
      {/* ECO Header */}
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-sm font-medium text-blue-600">
          {eco.ecoNumber}
        </h4>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(eco.priority)}`}>
          {eco.priority}
        </span>
      </div>

      {/* ECO Title */}
      <h5 className="text-sm font-medium text-gray-900 mb-3 line-clamp-2">
        {eco.title}
      </h5>

      {/* ECR References */}
      {(eco.ecrs && eco.ecrs.length > 0) ? (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-600">
              Bundled ECRs ({eco.ecrs.length})
            </span>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                // Toggle expansion logic would go here
              }}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              View All
            </button>
          </div>
          <div className="space-y-1">
            {eco.ecrs.slice(0, 2).map((ecr) => (
              <div key={ecr.id} className="text-xs bg-gray-50 px-2 py-1 rounded border">
                <span className="font-medium text-gray-700">{ecr.ecrNumber}</span>
                <span className="text-gray-500 ml-1 truncate">
                  - {ecr.title.length > 25 ? ecr.title.substring(0, 25) + '...' : ecr.title}
                </span>
              </div>
            ))}
            {eco.ecrs.length > 2 && (
              <div className="text-xs text-gray-500 px-2 py-1">
                +{eco.ecrs.length - 2} more ECRs
              </div>
            )}
          </div>
        </div>
      ) : eco.ecr ? (
        <div className="text-xs text-gray-500 mb-2">
          From {eco.ecr.ecrNumber}
        </div>
      ) : null}

      {/* ECN Creation Button for Completed ECOs */}
      {eco.status === 'COMPLETED' && onCreateECN && (
        <div className="mb-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCreateECN(eco.id);
            }}
            className="w-full px-2 py-1 text-xs font-medium text-purple-700 bg-purple-100 border border-purple-200 rounded hover:bg-purple-200 transition-colors"
          >
            Create ECN
          </button>
        </div>
      )}

      {/* Assignee and Target Date */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center">
          {eco.assignee ? (
            <>
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mr-2">
                <span className="text-white text-xs font-medium">
                  {eco.assignee.name.charAt(0)}
                </span>
              </div>
              <span>{eco.assignee.name}</span>
            </>
          ) : (
            <span className="text-gray-400">Unassigned</span>
          )}
        </div>
        {eco.targetDate && (
          <span className="text-gray-400">
            Due {new Date(eco.targetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        )}
      </div>
    </div>
  );
}

function KanbanColumn({ column, ecos, onECOClick, onCreateECN }: {
  column: Column;
  ecos: ECO[];
  onECOClick: (eco: ECO) => void;
  onCreateECN?: (ecoId: string) => void;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: column.id,
  });

  const style = {
    backgroundColor: isOver ? '#f0f9ff' : undefined,
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className="bg-gray-50 rounded-lg p-4 flex-1 min-h-[600px] transition-colors relative"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-900">{column.title}</h3>
        <span className="bg-gray-200 text-gray-600 px-2 py-1 text-xs rounded-full">
          {ecos.length}
        </span>
      </div>
      
      <SortableContext items={ecos.map(eco => eco.id)} strategy={verticalListSortingStrategy}>
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
      </SortableContext>
      
      {/* Invisible drop zone to ensure the entire column is droppable */}
      <div className="absolute inset-0 pointer-events-none" />
    </div>
  );
}

export default function ECOPage() {
  const { data: session } = useSession();
  const [ecos, setEcos] = useState<ECO[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedECO, setSelectedECO] = useState<ECO | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [showToast, setShowToast] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

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

  const getEcosForColumn = (columnStatus: 'BACKLOG' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED') => {
    return ecos.filter(eco => mapStatusToColumn(eco.status) === columnStatus);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // If dropped on a column, update the ECO status
    const targetColumn = columns.find(col => col.id === overId);
    if (targetColumn) {
      const ecoToUpdate = ecos.find(eco => eco.id === activeId);
      
      // Map column status to ECO status - preserve original status when possible
      const mapColumnToEcoStatus = (columnStatus: string, currentStatus: ECO['status']) => {
        switch (columnStatus) {
          case 'BACKLOG': 
            // If moving to backlog, preserve the original status if it belongs to backlog
            if (['DRAFT', 'SUBMITTED', 'APPROVED', 'BACKLOG'].includes(currentStatus)) {
              return currentStatus;
            }
            return 'BACKLOG'; // Default for items moved back to backlog
          case 'IN_PROGRESS': return 'IN_PROGRESS';
          case 'REVIEW': return 'REVIEW';
          case 'COMPLETED': return 'COMPLETED';
          default: return 'BACKLOG';
        }
      };
      
      const newEcoStatus = mapColumnToEcoStatus(targetColumn.status, ecoToUpdate.status);
      
      if (ecoToUpdate && mapStatusToColumn(ecoToUpdate.status) !== targetColumn.status) {
        // Optimistically update the UI
        setEcos(prevEcos =>
          prevEcos.map(eco =>
            eco.id === activeId ? { ...eco, status: newEcoStatus as any } : eco
          )
        );

        // Update the ECO status on the server
        try {
          const response = await fetch(`/api/eco/${activeId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: newEcoStatus }),
          });

          if (!response.ok) {
            // Revert the optimistic update if the API call failed
            setEcos(prevEcos =>
              prevEcos.map(eco =>
                eco.id === activeId ? { ...eco, status: ecoToUpdate.status } : eco
              )
            );
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            console.error('Failed to update ECO status:', response.status, errorData);
            // You could add a toast notification here if you have a notification system
            alert(`Failed to update ECO status: ${errorData.error || 'Unknown error'}`);
          } else {
            console.log(`Successfully updated ECO ${activeId} to status: ${newEcoStatus}`);
          }
        } catch (error) {
          // Revert the optimistic update if the API call failed
          setEcos(prevEcos =>
            prevEcos.map(eco =>
              eco.id === activeId ? { ...eco, status: ecoToUpdate.status } : eco
            )
          );
          console.error('Error updating ECO status:', error);
        }
      }
    }

    setActiveId(null);
  };

  const handleECOClick = (eco: ECO) => {
    setSelectedECO(eco);
    setIsModalOpen(true);
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

  const activeDragEco = activeId ? ecos.find(eco => eco.id === activeId) : null;

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
        <div className="flex space-x-3">
          <Link
            href="/dashboard/ecr/convert"
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            Convert ECR to ECO
          </Link>
          <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New ECO
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
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

        <DragOverlay>
          {activeDragEco ? (
            <ECOCard eco={activeDragEco} onClick={() => {}} />
          ) : null}
        </DragOverlay>
      </DndContext>

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