'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { UserRole } from '@prisma/client';

interface ECR {
  id: string;
  title: string;
  description: string;
  justification: string;
  submitter: {
    name: string;
    department?: string;
  };
  estimatedCost?: number;
  priority: string;
  createdAt: string;
}

interface BOMItem {
  partNumber: string;
  description: string;
  quantity: number;
  unitCost?: number;
}

const materialDispositionOptions = [
  { value: 'USE_AS_IS', label: 'Use As-Is', description: 'Existing inventory can be used without modification' },
  { value: 'REWORK', label: 'Rework', description: 'Existing inventory requires rework to meet new requirements' },
  { value: 'SCRAP', label: 'Scrap', description: 'Existing inventory must be scrapped' },
  { value: 'RETURN_SUPPLIER', label: 'Return to Supplier', description: 'Return inventory to supplier for credit' },
  { value: 'SEGREGATE', label: 'Segregate', description: 'Segregate inventory for alternate use' }
];

const effectivityOptions = [
  { value: 'IMMEDIATE', label: 'Immediate', description: 'Effective immediately upon approval' },
  { value: 'DATE_BASED', label: 'Date-Based', description: 'Effective on a specific date' },
  { value: 'SERIAL_BASED', label: 'Serial-Based', description: 'Effective starting from a specific serial number' }
];

const requiredResourceOptions = [
  'Engineering Support',
  'Quality Inspection',
  'Manufacturing Setup',
  'Tooling Changes',
  'Training Materials',
  'Documentation Updates',
  'Supplier Coordination',
  'Testing Equipment'
];

export default function CreateECOFromECR() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [approvedECRs, setApprovedECRs] = useState<ECR[]>([]);
  const [selectedECRs, setSelectedECRs] = useState<string[]>([]);
  
  // Form state
  const [ecoTitle, setEcoTitle] = useState('');
  const [workInstructions, setWorkInstructions] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('');
  const [effectivityType, setEffectivityType] = useState('IMMEDIATE');
  const [materialDisposition, setMaterialDisposition] = useState('USE_AS_IS');
  const [implementationTeam, setImplementationTeam] = useState<string[]>([]);
  const [estimatedHours, setEstimatedHours] = useState(0);
  const [requiredResources, setRequiredResources] = useState<string[]>([]);
  
  // BOM Changes
  const [partsToAdd, setPartsToAdd] = useState<BOMItem[]>([]);
  const [partsToRemove, setPartsToRemove] = useState<BOMItem[]>([]);
  const [partsToModify, setPartsToModify] = useState<{ old: BOMItem; new: BOMItem }[]>([]);
  
  // Document Updates
  const [drawingsToRevise, setDrawingsToRevise] = useState<string[]>(['']);
  const [proceduresToUpdate, setProceduresToUpdate] = useState<string[]>(['']);
  const [trainingMaterials, setTrainingMaterials] = useState<string[]>(['']);
  
  const [submitting, setSubmitting] = useState(false);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    fetchApprovedECRs();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedECRs.length > 0) {
      generateECOTitle();
    }
  }, [selectedECRs, approvedECRs]);

  const fetchApprovedECRs = async () => {
    try {
      const response = await fetch('/api/ecr?status=APPROVED');
      if (response.ok) {
        const data = await response.json();
        setApprovedECRs(data);
      }
    } catch (error) {
      console.error('Error fetching approved ECRs:', error);
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

  const generateECOTitle = () => {
    const selected = approvedECRs.filter(ecr => selectedECRs.includes(ecr.id));
    if (selected.length === 1) {
      setEcoTitle(`Implementation of ${selected[0].title}`);
    } else if (selected.length > 1) {
      setEcoTitle(`Combined Implementation: ${selected.map(ecr => ecr.title).join(', ')}`);
    }
  };

  const calculateCombinedImpact = () => {
    const selected = approvedECRs.filter(ecr => selectedECRs.includes(ecr.id));
    return {
      totalCost: selected.reduce((sum, ecr) => sum + (ecr.estimatedCost || 0), 0),
      highPriorityCount: selected.filter(ecr => ecr.priority === 'HIGH').length,
      ecrCount: selected.length
    };
  };

  const addBOMItem = (type: 'add' | 'remove') => {
    const newItem: BOMItem = { partNumber: '', description: '', quantity: 1, unitCost: 0 };
    if (type === 'add') {
      setPartsToAdd([...partsToAdd, newItem]);
    } else {
      setPartsToRemove([...partsToRemove, newItem]);
    }
  };

  const addModifyBOMItem = () => {
    const newItem = {
      old: { partNumber: '', description: '', quantity: 1, unitCost: 0 },
      new: { partNumber: '', description: '', quantity: 1, unitCost: 0 }
    };
    setPartsToModify([...partsToModify, newItem]);
  };

  const addStringArrayItem = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    current: string[]
  ) => {
    setter([...current, '']);
  };

  const updateStringArrayItem = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    current: string[],
    index: number,
    value: string
  ) => {
    const updated = [...current];
    updated[index] = value;
    setter(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedECRs.length === 0) {
      alert('Please select at least one approved ECR');
      return;
    }

    setSubmitting(true);

    try {
      const ecoData = {
        title: ecoTitle,
        workInstructions,
        effectiveDate: effectivityType === 'DATE_BASED' ? effectiveDate : null,
        effectivityType,
        materialDisposition,
        estimatedHours,
        requiredResources,
        implementationTeam,
        sourceECRIds: selectedECRs,
        partsToAdd: partsToAdd.filter(p => p.partNumber.trim()),
        partsToRemove: partsToRemove.filter(p => p.partNumber.trim()),
        partsToModify: partsToModify.filter(p => p.old.partNumber.trim() || p.new.partNumber.trim()),
        drawingsToRevise: drawingsToRevise.filter(d => d.trim()),
        proceduresToUpdate: proceduresToUpdate.filter(p => p.trim()),
        trainingMaterials: trainingMaterials.filter(t => t.trim())
      };

      const response = await fetch('/api/eco', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ecoData)
      });

      if (response.ok) {
        const eco = await response.json();
        router.push(`/dashboard/eco/${eco.id}`);
      } else {
        const error = await response.json();
        alert(`Error creating ECO: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating ECO:', error);
      alert('Error creating ECO');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading approved ECRs...</div>;
  }

  const impact = calculateCombinedImpact();

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Engineering Change Order</h1>
        <p className="text-gray-600">Select approved ECRs and create an implementation plan</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* ECR Selection Section */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Select Approved ECRs</h2>
          
          {approvedECRs.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No approved ECRs available for implementation</p>
          ) : (
            <div className="grid gap-4 mb-6">
              {approvedECRs.map((ecr) => (
                <div
                  key={ecr.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedECRs.includes(ecr.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onClick={() => {
                    setSelectedECRs(prev =>
                      prev.includes(ecr.id)
                        ? prev.filter(id => id !== ecr.id)
                        : [...prev, ecr.id]
                    );
                  }}
                >
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedECRs.includes(ecr.id)}
                      onChange={() => {}}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{ecr.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{ecr.description}</p>
                      <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                        <span>Submitted by: {ecr.submitter.name} ({ecr.submitter.department})</span>
                        <span>Priority: {ecr.priority}</span>
                        {ecr.estimatedCost && <span>Cost: ${ecr.estimatedCost.toLocaleString()}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedECRs.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Combined Impact Summary</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Selected ECRs:</span>
                  <span className="font-medium ml-2">{impact.ecrCount}</span>
                </div>
                <div>
                  <span className="text-gray-600">Total Estimated Cost:</span>
                  <span className="font-medium ml-2">${impact.totalCost.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-600">High Priority:</span>
                  <span className="font-medium ml-2">{impact.highPriorityCount}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {selectedECRs.length > 0 && (
          <>
            {/* ECO Details Section */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">ECO Details</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ECO Title *
                  </label>
                  <input
                    type="text"
                    value={ecoTitle}
                    onChange={(e) => setEcoTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Work Instructions *
                  </label>
                  <textarea
                    value={workInstructions}
                    onChange={(e) => setWorkInstructions(e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Detailed instructions for implementing this change..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Effectivity Type *
                  </label>
                  <select
                    value={effectivityType}
                    onChange={(e) => setEffectivityType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    {effectivityOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {effectivityType === 'DATE_BASED' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Effective Date *
                    </label>
                    <input
                      type="date"
                      value={effectiveDate}
                      onChange={(e) => setEffectiveDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Material Disposition *
                  </label>
                  <select
                    value={materialDisposition}
                    onChange={(e) => setMaterialDisposition(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    {materialDispositionOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label} - {option.description}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Resource Planning */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Resource Planning</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Implementation Team
                  </label>
                  <select
                    multiple
                    value={implementationTeam}
                    onChange={(e) => setImplementationTeam(Array.from(e.target.selectedOptions, option => option.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    size={6}
                  >
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.department || 'No Dept'})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple users</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estimated Hours
                  </label>
                  <input
                    type="number"
                    value={estimatedHours}
                    onChange={(e) => setEstimatedHours(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                  />
                </div>

                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Required Resources
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {requiredResourceOptions.map(resource => (
                      <label key={resource} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={requiredResources.includes(resource)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setRequiredResources([...requiredResources, resource]);
                            } else {
                              setRequiredResources(requiredResources.filter(r => r !== resource));
                            }
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm">{resource}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* BOM Changes */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">BOM Changes (if applicable)</h2>
              
              {/* Parts to Add */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-medium">Parts to Add</h3>
                  <button
                    type="button"
                    onClick={() => addBOMItem('add')}
                    className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Add Part
                  </button>
                </div>
                {partsToAdd.map((part, index) => (
                  <div key={index} className="grid grid-cols-4 gap-3 mb-2">
                    <input
                      type="text"
                      placeholder="Part Number"
                      value={part.partNumber}
                      onChange={(e) => {
                        const updated = [...partsToAdd];
                        updated[index].partNumber = e.target.value;
                        setPartsToAdd(updated);
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-md"
                    />
                    <input
                      type="text"
                      placeholder="Description"
                      value={part.description}
                      onChange={(e) => {
                        const updated = [...partsToAdd];
                        updated[index].description = e.target.value;
                        setPartsToAdd(updated);
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-md"
                    />
                    <input
                      type="number"
                      placeholder="Quantity"
                      value={part.quantity}
                      onChange={(e) => {
                        const updated = [...partsToAdd];
                        updated[index].quantity = parseInt(e.target.value) || 1;
                        setPartsToAdd(updated);
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-md"
                    />
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Unit Cost"
                      value={part.unitCost || ''}
                      onChange={(e) => {
                        const updated = [...partsToAdd];
                        updated[index].unitCost = parseFloat(e.target.value) || undefined;
                        setPartsToAdd(updated);
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                ))}
              </div>

              {/* Parts to Remove */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-medium">Parts to Remove</h3>
                  <button
                    type="button"
                    onClick={() => addBOMItem('remove')}
                    className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Add Part
                  </button>
                </div>
                {partsToRemove.map((part, index) => (
                  <div key={index} className="grid grid-cols-4 gap-3 mb-2">
                    <input
                      type="text"
                      placeholder="Part Number"
                      value={part.partNumber}
                      onChange={(e) => {
                        const updated = [...partsToRemove];
                        updated[index].partNumber = e.target.value;
                        setPartsToRemove(updated);
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-md"
                    />
                    <input
                      type="text"
                      placeholder="Description"
                      value={part.description}
                      onChange={(e) => {
                        const updated = [...partsToRemove];
                        updated[index].description = e.target.value;
                        setPartsToRemove(updated);
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-md"
                    />
                    <input
                      type="number"
                      placeholder="Quantity"
                      value={part.quantity}
                      onChange={(e) => {
                        const updated = [...partsToRemove];
                        updated[index].quantity = parseInt(e.target.value) || 1;
                        setPartsToRemove(updated);
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-md"
                    />
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Unit Cost"
                      value={part.unitCost || ''}
                      onChange={(e) => {
                        const updated = [...partsToRemove];
                        updated[index].unitCost = parseFloat(e.target.value) || undefined;
                        setPartsToRemove(updated);
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Document Updates */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Document Updates</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Drawings to Revise
                    </label>
                    <button
                      type="button"
                      onClick={() => addStringArrayItem(setDrawingsToRevise, drawingsToRevise)}
                      className="px-2 py-1 bg-blue-600 text-white text-xs rounded"
                    >
                      Add
                    </button>
                  </div>
                  {drawingsToRevise.map((drawing, index) => (
                    <input
                      key={index}
                      type="text"
                      value={drawing}
                      onChange={(e) => updateStringArrayItem(setDrawingsToRevise, drawingsToRevise, index, e.target.value)}
                      placeholder="Drawing number or name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md mb-2"
                    />
                  ))}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Procedures to Update
                    </label>
                    <button
                      type="button"
                      onClick={() => addStringArrayItem(setProceduresToUpdate, proceduresToUpdate)}
                      className="px-2 py-1 bg-blue-600 text-white text-xs rounded"
                    >
                      Add
                    </button>
                  </div>
                  {proceduresToUpdate.map((procedure, index) => (
                    <input
                      key={index}
                      type="text"
                      value={procedure}
                      onChange={(e) => updateStringArrayItem(setProceduresToUpdate, proceduresToUpdate, index, e.target.value)}
                      placeholder="Procedure name or number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md mb-2"
                    />
                  ))}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Training Materials
                    </label>
                    <button
                      type="button"
                      onClick={() => addStringArrayItem(setTrainingMaterials, trainingMaterials)}
                      className="px-2 py-1 bg-blue-600 text-white text-xs rounded"
                    >
                      Add
                    </button>
                  </div>
                  {trainingMaterials.map((material, index) => (
                    <input
                      key={index}
                      type="text"
                      value={material}
                      onChange={(e) => updateStringArrayItem(setTrainingMaterials, trainingMaterials, index, e.target.value)}
                      placeholder="Training material name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md mb-2"
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Submit Button */}
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
                disabled={submitting || selectedECRs.length === 0}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? 'Creating ECO...' : 'Create ECO'}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}