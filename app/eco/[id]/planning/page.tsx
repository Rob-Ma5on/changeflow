'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { UserRole } from '@prisma/client';

interface Task {
  id?: string;
  description: string;
  assignedTo: string;
  startDate: string;
  endDate: string;
  dependencies: string[];
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';
}

interface ProcurementItem {
  id?: string;
  itemDescription: string;
  supplier: string;
  quantity: number;
  unitCost: number;
  leadTime: number;
  orderStatus: 'NOT_ORDERED' | 'ORDERED' | 'RECEIVED' | 'CANCELLED';
  orderDate?: string;
  expectedDelivery?: string;
}

interface QualityGate {
  id?: string;
  milestone: string;
  inspectionPoint: string;
  testRequirements: string;
  acceptanceCriteria: string;
  responsible: string;
  completed: boolean;
}

export default function ECOPlanning() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const ecoId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [eco, setEco] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  
  // Form state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [procurementItems, setProcurementItems] = useState<ProcurementItem[]>([]);
  const [qualityGates, setQualityGates] = useState<QualityGate[]>([]);

  const taskStatuses = [
    { value: 'NOT_STARTED', label: 'Not Started', color: 'bg-gray-100 text-gray-800' },
    { value: 'IN_PROGRESS', label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
    { value: 'COMPLETED', label: 'Completed', color: 'bg-green-100 text-green-800' },
    { value: 'BLOCKED', label: 'Blocked', color: 'bg-red-100 text-red-800' }
  ];

  const orderStatuses = [
    { value: 'NOT_ORDERED', label: 'Not Ordered', color: 'bg-gray-100 text-gray-800' },
    { value: 'ORDERED', label: 'Ordered', color: 'bg-blue-100 text-blue-800' },
    { value: 'RECEIVED', label: 'Received', color: 'bg-green-100 text-green-800' },
    { value: 'CANCELLED', label: 'Cancelled', color: 'bg-red-100 text-red-800' }
  ];

  useEffect(() => {
    fetchECO();
    fetchUsers();
  }, [ecoId]);

  const fetchECO = async () => {
    try {
      const response = await fetch(`/api/eco/${ecoId}`);
      if (response.ok) {
        const data = await response.json();
        setEco(data);
        
        // Load existing planning data if available
        if (data.tasks) setTasks(data.tasks);
        if (data.procurementItems) setProcurementItems(data.procurementItems);
        if (data.qualityGates) setQualityGates(data.qualityGates);
      } else {
        router.push('/dashboard/eco');
      }
    } catch (error) {
      console.error('Error fetching ECO:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const addTask = () => {
    const newTask: Task = {
      description: '',
      assignedTo: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      dependencies: [],
      status: 'NOT_STARTED'
    };
    setTasks([...tasks, newTask]);
  };

  const updateTask = (index: number, field: keyof Task, value: any) => {
    const updatedTasks = [...tasks];
    updatedTasks[index] = { ...updatedTasks[index], [field]: value };
    setTasks(updatedTasks);
  };

  const removeTask = (index: number) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };

  const addProcurementItem = () => {
    const newItem: ProcurementItem = {
      itemDescription: '',
      supplier: '',
      quantity: 1,
      unitCost: 0,
      leadTime: 5,
      orderStatus: 'NOT_ORDERED'
    };
    setProcurementItems([...procurementItems, newItem]);
  };

  const updateProcurementItem = (index: number, field: keyof ProcurementItem, value: any) => {
    const updatedItems = [...procurementItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setProcurementItems(updatedItems);
  };

  const removeProcurementItem = (index: number) => {
    setProcurementItems(procurementItems.filter((_, i) => i !== index));
  };

  const addQualityGate = () => {
    const newGate: QualityGate = {
      milestone: '',
      inspectionPoint: '',
      testRequirements: '',
      acceptanceCriteria: '',
      responsible: '',
      completed: false
    };
    setQualityGates([...qualityGates, newGate]);
  };

  const updateQualityGate = (index: number, field: keyof QualityGate, value: any) => {
    const updatedGates = [...qualityGates];
    updatedGates[index] = { ...updatedGates[index], [field]: value };
    setQualityGates(updatedGates);
  };

  const removeQualityGate = (index: number) => {
    setQualityGates(qualityGates.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const planningData = {
        tasks: tasks.filter(t => t.description.trim()),
        procurementItems: procurementItems.filter(p => p.itemDescription.trim()),
        qualityGates: qualityGates.filter(q => q.milestone.trim()),
        status: 'PLANNING'
      };

      const response = await fetch(`/api/eco/${ecoId}/planning`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(planningData)
      });

      if (response.ok) {
        alert('Planning data saved successfully');
        router.push(`/dashboard/eco/${ecoId}`);
      } else {
        const error = await response.json();
        alert(`Error saving planning data: ${error.error}`);
      }
    } catch (error) {
      console.error('Error saving planning data:', error);
      alert('Error saving planning data');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading ECO planning...</div>;
  }

  if (!eco) {
    return <div className="text-center py-8">ECO not found</div>;
  }

  // Check if user has permission to plan (ENGINEER + team)
  const canPlan = session?.user?.role === 'ENGINEER' || 
                  session?.user?.role === 'MANAGER' || 
                  session?.user?.role === 'ADMIN' ||
                  eco.implementationTeam?.includes(session?.user?.id);

  if (!canPlan) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">You don't have permission to access ECO planning</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">ECO Planning</h1>
        <p className="text-gray-600">{eco.title}</p>
        <div className="mt-2 text-sm text-gray-500">
          ECO ID: {eco.ecoNumber} | Status: {eco.status}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Task Breakdown */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Task Breakdown</h2>
            <button
              type="button"
              onClick={addTask}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Add Task
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Task Description
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned To
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Start Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    End Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tasks.map((task, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={task.description}
                        onChange={(e) => updateTask(index, 'description', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="Task description"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={task.assignedTo}
                        onChange={(e) => updateTask(index, 'assignedTo', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        <option value="">Select user</option>
                        {users.map(user => (
                          <option key={user.id} value={user.id}>
                            {user.name} ({user.department})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="date"
                        value={task.startDate}
                        onChange={(e) => updateTask(index, 'startDate', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="date"
                        value={task.endDate}
                        onChange={(e) => updateTask(index, 'endDate', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={task.status}
                        onChange={(e) => updateTask(index, 'status', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        {taskStatuses.map(status => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => removeTask(index)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Procurement Section */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Procurement</h2>
            <button
              type="button"
              onClick={addProcurementItem}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Add Item
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item Description
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Supplier
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Qty
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit Cost
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lead Time
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {procurementItems.map((item, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={item.itemDescription}
                        onChange={(e) => updateProcurementItem(index, 'itemDescription', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="Item description"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={item.supplier}
                        onChange={(e) => updateProcurementItem(index, 'supplier', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="Supplier name"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateProcurementItem(index, 'quantity', parseInt(e.target.value) || 1)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        min="1"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        step="0.01"
                        value={item.unitCost}
                        onChange={(e) => updateProcurementItem(index, 'unitCost', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        min="0"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={item.leadTime}
                        onChange={(e) => updateProcurementItem(index, 'leadTime', parseInt(e.target.value) || 1)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        min="1"
                        placeholder="Days"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={item.orderStatus}
                        onChange={(e) => updateProcurementItem(index, 'orderStatus', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        {orderStatuses.map(status => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => removeProcurementItem(index)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quality Gates */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Quality Gates</h2>
            <button
              type="button"
              onClick={addQualityGate}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              Add Quality Gate
            </button>
          </div>

          <div className="space-y-4">
            {qualityGates.map((gate, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Milestone
                    </label>
                    <input
                      type="text"
                      value={gate.milestone}
                      onChange={(e) => updateQualityGate(index, 'milestone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      placeholder="e.g., First Article Complete"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Inspection Point
                    </label>
                    <input
                      type="text"
                      value={gate.inspectionPoint}
                      onChange={(e) => updateQualityGate(index, 'inspectionPoint', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      placeholder="What will be inspected"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Test Requirements
                    </label>
                    <textarea
                      value={gate.testRequirements}
                      onChange={(e) => updateQualityGate(index, 'testRequirements', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      rows={2}
                      placeholder="Required tests and procedures"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Acceptance Criteria
                    </label>
                    <textarea
                      value={gate.acceptanceCriteria}
                      onChange={(e) => updateQualityGate(index, 'acceptanceCriteria', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      rows={2}
                      placeholder="What constitutes success"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Responsible Person
                    </label>
                    <select
                      value={gate.responsible}
                      onChange={(e) => updateQualityGate(index, 'responsible', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="">Select responsible person</option>
                      {users.filter(u => u.role === 'QUALITY' || u.role === 'ENGINEER').map(user => (
                        <option key={user.id} value={user.id}>
                          {user.name} ({user.department})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={gate.completed}
                        onChange={(e) => updateQualityGate(index, 'completed', e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Completed</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => removeQualityGate(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove Gate
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Planning Data'}
          </button>
        </div>
      </form>
    </div>
  );
}