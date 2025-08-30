'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Toast from '@/components/Toast';

interface ECNDetail {
  id: string;
  ecnNumber: string;
  title: string;
  description: string;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'DISTRIBUTED' | 'EFFECTIVE' | 'CANCELLED';
  effectiveDate?: string;
  distributedAt?: string;
  createdAt: string;
  submitter: { id: string; name: string; email: string };
  assignee?: { id: string; name: string; email: string };
  eco?: {
    id: string;
    ecoNumber: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    completedAt?: string;
    submitter: { name: string; email: string };
    assignee?: { name: string; email: string };
  };
}

export default function ECNDetailPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const [ecn, setEcn] = useState<ECNDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const fetchECN = async () => {
      if (!params?.id) return;
      
      try {
        const response = await fetch(`/api/ecn/${params.id}`);
        if (response.ok) {
          const ecnData = await response.json();
          setEcn(ecnData);
        } else {
          console.error('Failed to fetch ECN');
        }
      } catch (error) {
        console.error('Error fetching ECN:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchECN();
  }, [params?.id]);

  const handleStatusUpdate = async (newStatus: string) => {
    if (!ecn) return;
    
    setUpdating(true);
    try {
      const updateData: { status: string; distributedAt?: string } = { status: newStatus };
      
      if (newStatus === 'DISTRIBUTED') {
        updateData.distributedAt = new Date().toISOString();
      }
      
      const response = await fetch(`/api/ecn/${ecn.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        const updatedEcn = await response.json();
        setEcn(updatedEcn);
        setToastMessage(`ECN status updated to ${newStatus.replace('_', ' ')}`);
        setToastType('success');
        setShowToast(true);
      } else {
        const errorData = await response.json();
        setToastMessage(errorData.error || 'Failed to update ECN status');
        setToastType('error');
        setShowToast(true);
      }
    } catch (error) {
      console.error('Error updating ECN status:', error);
      setToastMessage('An error occurred while updating the ECN');
      setToastType('error');
      setShowToast(true);
    } finally {
      setUpdating(false);
    }
  };

  const getNextStatus = (currentStatus: ECNDetail['status']): ECNDetail['status'] | null => {
    const statusFlow: Record<ECNDetail['status'], ECNDetail['status'] | null> = {
      'DRAFT': 'PENDING_APPROVAL',
      'PENDING_APPROVAL': 'APPROVED',
      'APPROVED': 'DISTRIBUTED',
      'DISTRIBUTED': 'EFFECTIVE',
      'EFFECTIVE': null,
      'CANCELLED': null
    };
    return statusFlow[currentStatus];
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      DRAFT: 'bg-gray-100 text-gray-800',
      PENDING_APPROVAL: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-blue-100 text-blue-800',
      DISTRIBUTED: 'bg-purple-100 text-purple-800',
      EFFECTIVE: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800'
    };
    return statusConfig[status as keyof typeof statusConfig] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!ecn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">ECN could not be found.</p>
      </div>
    );
  }

  const nextStatus = getNextStatus(ecn.status);

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">ECN {ecn.ecnNumber}</h1>
        <p className="text-lg text-gray-600 mb-8">{ecn.title}</p>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <span className={`mt-1 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(ecn.status)}`}>
                {ecn.status.replace('_', ' ')}
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Created</label>
              <p className="mt-1 text-gray-900">{new Date(ecn.createdAt).toLocaleDateString()}</p>
            </div>

            {ecn.effectiveDate && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Effective Date</label>
                <p className="mt-1 text-gray-900">{new Date(ecn.effectiveDate).toLocaleDateString()}</p>
              </div>
            )}

            {ecn.distributedAt && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Distributed</label>
                <p className="mt-1 text-gray-900">{new Date(ecn.distributedAt).toLocaleDateString()}</p>
              </div>
            )}
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <p className="mt-1 text-gray-900">{ecn.description}</p>
          </div>
        </div>

        {nextStatus && (
          <div className="mb-8">
            <button
              onClick={() => handleStatusUpdate(nextStatus)}
              disabled={updating}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {updating ? 'Updating...' : `Move to ${nextStatus.replace('_', ' ')}`}
            </button>
          </div>
        )}

        {ecn.eco && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Related ECO</h3>
            <Link
              href={`/dashboard/eco/${ecn.eco.id}`}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              {ecn.eco.ecoNumber}
            </Link>
            <p className="mt-1 text-gray-900">{ecn.eco.title}</p>
            <p className="mt-2 text-sm text-gray-600">{ecn.eco.description}</p>
          </div>
        )}

        <Toast
          message={toastMessage}
          type={toastType}
          isOpen={showToast}
          onClose={() => setShowToast(false)}
        />
      </div>
    </div>
  );
}