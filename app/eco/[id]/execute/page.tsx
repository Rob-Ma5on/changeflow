'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { UserRole } from '@prisma/client';

interface Task {
  id: string;
  description: string;
  assignedTo: string;
  assignedUser?: {
    name: string;
    department?: string;
  };
  startDate: string;
  endDate: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';
  actualHours?: number;
  completedDate?: string;
}

interface TimeLog {
  id?: string;
  taskId: string;
  userId: string;
  hours: number;
  description: string;
  date: string;
  overtime: boolean;
  overtimeJustification?: string;
}

interface Issue {
  id?: string;
  title: string;
  description: string;
  impact: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  resolutionPlan: string;
  reportedBy: string;
  reportedDate: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'DEVIATION_APPROVED';
  deviationApproval?: {
    approvedBy: string;
    approvedDate: string;
    justification: string;
  };
}

interface Milestone {
  id: string;
  name: string;
  description: string;
  targetDate: string;
  completed: boolean;
  completedDate?: string;
  completedBy?: string;
}

export default function ECOExecute() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const ecoId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [eco, setEco] = useState<any>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  
  // Form states
  const [newTimeLog, setNewTimeLog] = useState<Partial<TimeLog>>({
    hours: 0,
    description: '',
    date: new Date().toISOString().split('T')[0],
    overtime: false
  });
  const [newIssue, setNewIssue] = useState<Partial<Issue>>({
    title: '',
    description: '',
    impact: 'MEDIUM',
    resolutionPlan: ''
  });
  const [selectedTaskId, setSelectedTaskId] = useState('');

  useEffect(() => {
    fetchECO();
  }, [ecoId]);

  const fetchECO = async () => {
    try {
      const response = await fetch(`/api/eco/${ecoId}/execute`);
      if (response.ok) {
        const data = await response.json();
        setEco(data.eco);
        setTasks(data.tasks || []);
        setTimeLogs(data.timeLogs || []);
        setIssues(data.issues || []);
        setMilestones(data.milestones || [
          {
            id: 'first-article',
            name: 'First Article Complete',
            description: 'Initial sample produced and approved',
            targetDate: '',
            completed: false
          },
          {
            id: 'pilot-run',
            name: 'Pilot Run Complete',
            description: 'Limited production run completed successfully',
            targetDate: '',
            completed: false
          },
          {
            id: 'full-implementation',
            name: 'Full Implementation',
            description: 'Change fully implemented in production',
            targetDate: '',
            completed: false
          }
        ]);
      } else {
        router.push('/dashboard/eco');
      }
    } catch (error) {
      console.error('Error fetching ECO execution data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = () => {
    if (tasks.length === 0) return 0;
    const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;
    return Math.round((completedTasks / tasks.length) * 100);
  };

  const calculateTotalHours = () => {
    return timeLogs.reduce((total, log) => total + log.hours, 0);
  };

  const calculateEstimatedVsActual = () => {
    const estimated = eco?.estimatedHours || 0;
    const actual = calculateTotalHours();
    return { estimated, actual, variance: actual - estimated };
  };

  const updateTaskStatus = async (taskId: string, status: string) => {
    setSaving(true);
    try {
      const response = await fetch(`/api/eco/${ecoId}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status,
          completedDate: status === 'COMPLETED' ? new Date().toISOString() : null
        })
      });
      
      if (response.ok) {
        setTasks(tasks.map(task =>
          task.id === taskId 
            ? { ...task, status: status as any, completedDate: status === 'COMPLETED' ? new Date().toISOString() : undefined }
            : task
        ));
      }
    } catch (error) {
      console.error('Error updating task status:', error);
    } finally {
      setSaving(false);
    }
  };

  const logTime = async () => {
    if (!selectedTaskId || !newTimeLog.hours || !newTimeLog.description) {
      alert('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const timeLogData = {
        ...newTimeLog,
        taskId: selectedTaskId,
        userId: session?.user?.id
      };

      const response = await fetch(`/api/eco/${ecoId}/time-log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(timeLogData)
      });

      if (response.ok) {
        const savedLog = await response.json();
        setTimeLogs([...timeLogs, savedLog]);
        setNewTimeLog({
          hours: 0,
          description: '',
          date: new Date().toISOString().split('T')[0],
          overtime: false
        });
        setSelectedTaskId('');
      }
    } catch (error) {
      console.error('Error logging time:', error);
    } finally {
      setSaving(false);
    }
  };

  const reportIssue = async () => {
    if (!newIssue.title || !newIssue.description) {
      alert('Please fill in title and description');
      return;
    }

    setSaving(true);
    try {
      const issueData = {
        ...newIssue,
        reportedBy: session?.user?.id,
        reportedDate: new Date().toISOString(),
        status: 'OPEN'
      };

      const response = await fetch(`/api/eco/${ecoId}/issues`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(issueData)
      });

      if (response.ok) {
        const savedIssue = await response.json();
        setIssues([...issues, savedIssue]);
        setNewIssue({
          title: '',
          description: '',
          impact: 'MEDIUM',
          resolutionPlan: ''
        });
      }
    } catch (error) {
      console.error('Error reporting issue:', error);
    } finally {
      setSaving(false);
    }
  };

  const updateMilestone = async (milestoneId: string, completed: boolean) => {
    setSaving(true);
    try {
      const response = await fetch(`/api/eco/${ecoId}/milestones/${milestoneId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          completed,
          completedDate: completed ? new Date().toISOString() : null,
          completedBy: completed ? session?.user?.id : null
        })
      });

      if (response.ok) {
        setMilestones(milestones.map(milestone =>
          milestone.id === milestoneId
            ? {
                ...milestone,
                completed,
                completedDate: completed ? new Date().toISOString() : undefined,
                completedBy: completed ? session?.user?.id : undefined
              }
            : milestone
        ));
      }
    } catch (error) {
      console.error('Error updating milestone:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading ECO execution...</div>;
  }

  if (!eco) {
    return <div className="text-center py-8">ECO not found</div>;
  }

  // Check if user is part of implementation team
  const canExecute = eco.implementationTeam?.includes(session?.user?.id) ||
                     session?.user?.role === 'ENGINEER' ||
                     session?.user?.role === 'MANAGER' ||
                     session?.user?.role === 'ADMIN';

  if (!canExecute) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">You don't have permission to access ECO execution</p>
      </div>
    );
  }

  const progress = calculateProgress();
  const hoursSummary = calculateEstimatedVsActual();

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">ECO Implementation Tracking</h1>
        <p className="text-gray-600">{eco.title}</p>
        <div className="mt-2 text-sm text-gray-500">
          ECO ID: {eco.ecoNumber} | Status: {eco.status}
        </div>
      </div>

      {/* Progress Dashboard */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Progress Dashboard</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-2">Overall Progress</h3>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div 
                className="bg-blue-600 h-4 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-1">{progress}% Complete</p>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">Time Summary</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Estimated:</span>
                <span>{hoursSummary.estimated}h</span>
              </div>
              <div className="flex justify-between">
                <span>Actual:</span>
                <span>{hoursSummary.actual}h</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Variance:</span>
                <span className={hoursSummary.variance > 0 ? 'text-red-600' : 'text-green-600'}>
                  {hoursSummary.variance > 0 ? '+' : ''}{hoursSummary.variance}h
                </span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">Key Metrics</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Total Tasks:</span>
                <span>{tasks.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Completed:</span>
                <span>{tasks.filter(t => t.status === 'COMPLETED').length}</span>
              </div>
              <div className="flex justify-between">
                <span>Open Issues:</span>
                <span className="text-red-600">{issues.filter(i => i.status === 'OPEN').length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Task Progress */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Task Completion</h2>
        
        <div className="space-y-3">
          {tasks.map((task) => (
            <div key={task.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div className="flex-1">
                <h3 className="font-medium">{task.description}</h3>
                <p className="text-sm text-gray-600">
                  Assigned to: {task.assignedUser?.name} | Due: {new Date(task.endDate).toLocaleDateString()}
                </p>
              </div>
              
              <div className="flex items-center space-x-3">
                <select
                  value={task.status}
                  onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                  disabled={saving}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="NOT_STARTED">Not Started</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="BLOCKED">Blocked</option>
                </select>
                
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  task.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                  task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                  task.status === 'BLOCKED' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {task.status.replace('_', ' ')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Time Tracking */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Time Tracking</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-3">Log Hours</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Task
                </label>
                <select
                  value={selectedTaskId}
                  onChange={(e) => setSelectedTaskId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select a task</option>
                  {tasks.map(task => (
                    <option key={task.id} value={task.id}>
                      {task.description}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hours
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={newTimeLog.hours}
                    onChange={(e) => setNewTimeLog({...newTimeLog, hours: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    min="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={newTimeLog.date}
                    onChange={(e) => setNewTimeLog({...newTimeLog, date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newTimeLog.description}
                  onChange={(e) => setNewTimeLog({...newTimeLog, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={2}
                  placeholder="What was worked on..."
                />
              </div>
              
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newTimeLog.overtime}
                    onChange={(e) => setNewTimeLog({...newTimeLog, overtime: e.target.checked})}
                    className="mr-2"
                  />
                  <span className="text-sm">Overtime</span>
                </label>
                
                {newTimeLog.overtime && (
                  <input
                    type="text"
                    placeholder="Justification for overtime"
                    value={newTimeLog.overtimeJustification || ''}
                    onChange={(e) => setNewTimeLog({...newTimeLog, overtimeJustification: e.target.value})}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                )}
              </div>
              
              <button
                onClick={logTime}
                disabled={saving || !selectedTaskId || !newTimeLog.hours}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Log Time
              </button>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-3">Recent Time Logs</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {timeLogs.slice(-5).map((log, index) => (
                <div key={index} className="p-3 border border-gray-200 rounded text-sm">
                  <div className="flex justify-between items-start">
                    <span className="font-medium">{log.hours}h</span>
                    <span className="text-gray-500">{new Date(log.date).toLocaleDateString()}</span>
                  </div>
                  <p className="text-gray-600 mt-1">{log.description}</p>
                  {log.overtime && (
                    <span className="inline-block mt-1 px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">
                      Overtime
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Issue Reporting */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Issue Reporting</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-3">Report New Issue</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Issue Title
                </label>
                <input
                  type="text"
                  value={newIssue.title}
                  onChange={(e) => setNewIssue({...newIssue, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Brief description of the issue"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Impact Level
                </label>
                <select
                  value={newIssue.impact}
                  onChange={(e) => setNewIssue({...newIssue, impact: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newIssue.description}
                  onChange={(e) => setNewIssue({...newIssue, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                  placeholder="Detailed description of the issue"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Resolution Plan
                </label>
                <textarea
                  value={newIssue.resolutionPlan}
                  onChange={(e) => setNewIssue({...newIssue, resolutionPlan: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                  placeholder="Proposed solution or next steps"
                />
              </div>
              
              <button
                onClick={reportIssue}
                disabled={saving || !newIssue.title || !newIssue.description}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                Report Issue
              </button>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-3">Active Issues</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {issues.filter(i => i.status !== 'RESOLVED').map((issue, index) => (
                <div key={index} className="p-3 border border-gray-200 rounded">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">{issue.title}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      issue.impact === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                      issue.impact === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                      issue.impact === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {issue.impact}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{issue.description}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    Status: {issue.status} | Reported: {new Date(issue.reportedDate).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Milestones */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Milestone Updates</h2>
        
        <div className="space-y-4">
          {milestones.map((milestone) => (
            <div key={milestone.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex-1">
                <h3 className="font-medium">{milestone.name}</h3>
                <p className="text-sm text-gray-600">{milestone.description}</p>
                {milestone.completed && milestone.completedDate && (
                  <p className="text-xs text-green-600 mt-1">
                    Completed on {new Date(milestone.completedDate).toLocaleDateString()}
                  </p>
                )}
              </div>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={milestone.completed}
                  onChange={(e) => updateMilestone(milestone.id, e.target.checked)}
                  disabled={saving}
                  className="mr-3 h-5 w-5"
                />
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  milestone.completed 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {milestone.completed ? 'Complete' : 'Pending'}
                </span>
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}