'use client'

import * as XLSX from 'xlsx';

export interface ExportData {
  [key: string]: string | number | boolean | Date | null | undefined;
}

export const exportToExcel = (
  data: ExportData[],
  filename: string,
  sheetName: string = 'Sheet1'
) => {
  try {
    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Set column widths for better readability
    const columnWidths = Object.keys(data[0] || {}).map((key) => {
      const maxLength = Math.max(
        key.length,
        ...data.map((row) => String(row[key] || '').length)
      );
      return { wch: Math.min(Math.max(maxLength + 2, 10), 50) };
    });
    
    worksheet['!cols'] = columnWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 10);
    const finalFilename = `${filename}_${timestamp}.xlsx`;

    // Write and download file
    XLSX.writeFile(workbook, finalFilename);
    
    return true;
  } catch (error) {
    console.error('Export failed:', error);
    return false;
  }
};

interface ECRForExport {
  ecrNumber?: string;
  title?: string;
  description?: string;
  priority?: string;
  status?: string;
  category?: string;
  impactAssessment?: string;
  justification?: string;
  submitter?: { name?: string; email?: string };
  assignee?: { name?: string; email?: string };
  targetDate?: string | Date;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

// ECR-specific export format with Phase 1 fields
export const formatECRsForExport = (ecrs: any[]) => {
  return ecrs.map((ecr) => ({
    'ECR Number': ecr.ecrNumber || '',
    'Title': ecr.title || '',
    'Description': ecr.description || '',
    'Business Justification': ecr.reason || '',
    'Priority': ecr.priority || '',
    'Status': ecr.status?.replace(/_/g, ' ') || '',
    'Reason for Change': ecr.reasonForChange || '',
    'Customer Impact': ecr.customerImpact?.replace(/_/g, ' ') || '',
    'Estimated Cost Range': ecr.estimatedCostRange?.replace(/_/g, ' ') || '',
    'Target Implementation Date': ecr.targetImplementationDate ? new Date(ecr.targetImplementationDate).toLocaleDateString() : '',
    'Stakeholders': ecr.stakeholders || '',
    'Submitter': ecr.submitter?.name || '',
    'Submitter Email': ecr.submitter?.email || '',
    'Assignee': ecr.assignee?.name || '',
    'Assignee Email': ecr.assignee?.email || '',
    'Approver': ecr.approver?.name || '',
    'Cost Impact': ecr.costImpact ? `$${Number(ecr.costImpact).toLocaleString()}` : '',
    'Schedule Impact': ecr.scheduleImpact || '',
    'Implementation Plan': ecr.implementationPlan || '',
    'Affected Products': ecr.affectedProducts || '',
    'Affected Documents': ecr.affectedDocuments || '',
    'Created Date': ecr.createdAt ? new Date(ecr.createdAt).toLocaleDateString() : '',
    'Updated Date': ecr.updatedAt ? new Date(ecr.updatedAt).toLocaleDateString() : ''
  }));
};

interface ECOForExport {
  ecoNumber?: string;
  title?: string;
  status?: string;
  priority?: string;
  ecr?: { ecrNumber?: string; title?: string };
  ecrs?: Array<{ ecrNumber?: string }>;
  assignee?: { name?: string; email?: string };
  targetDate?: string | Date;
  createdAt?: string | Date;
  completedAt?: string | Date;
}

// ECO-specific export format with Phase 1 fields
export const formatECOsForExport = (ecos: any[]) => {
  return ecos.map((eco) => ({
    'ECO Number': eco.ecoNumber || '',
    'Title': eco.title || '',
    'Description': eco.description || '',
    'Status': eco.status?.replace(/_/g, ' ') || '',
    'Priority': eco.priority || '',
    'Effective Date': eco.effectiveDate ? new Date(eco.effectiveDate).toLocaleDateString() : '',
    'Effectivity Type': eco.effectivityType?.replace(/_/g, ' ') || '',
    'Material Disposition': eco.materialDisposition?.replace(/_/g, ' ') || '',
    'Document Updates': eco.documentUpdates || '',
    'Implementation Team': eco.implementationTeam || '',
    'Inventory Impact': eco.inventoryImpact ? 'Yes' : 'No',
    'Estimated Total Cost': eco.estimatedTotalCost ? `$${Number(eco.estimatedTotalCost).toLocaleString()}` : '',
    'Bundled ECRs': eco.ecrs?.map((ecr: any) => ecr.ecrNumber).join(', ') || '',
    'Submitter': eco.submitter?.name || '',
    'Submitter Email': eco.submitter?.email || '',
    'Assignee': eco.assignee?.name || '',
    'Assignee Email': eco.assignee?.email || '',
    'Approver': eco.approver?.name || '',
    'Implementation Plan': eco.implementationPlan || '',
    'Testing Plan': eco.testingPlan || '',
    'Rollback Plan': eco.rollbackPlan || '',
    'Resources Required': eco.resourcesRequired || '',
    'Estimated Effort': eco.estimatedEffort || '',
    'Target Date': eco.targetDate ? new Date(eco.targetDate).toLocaleDateString() : '',
    'Created Date': eco.createdAt ? new Date(eco.createdAt).toLocaleDateString() : '',
    'Completed Date': eco.completedAt ? new Date(eco.completedAt).toLocaleDateString() : ''
  }));
};

interface ECNForExport {
  ecnNumber?: string;
  title?: string;
  description?: string;
  status?: string;
  eco?: {
    ecoNumber?: string;
    title?: string;
    ecr?: {
      ecrNumber?: string;
      title?: string;
      submitter?: { name?: string };
    };
  };
  submitter?: { name?: string; email?: string };
  assignee?: { name?: string; email?: string };
  effectiveDate?: string | Date;
  distributedAt?: string | Date;
  createdAt?: string | Date;
}

// ECN-specific export format with Phase 1 fields
export const formatECNsForExport = (ecns: any[]) => {
  return ecns.map((ecn) => ({
    'ECN Number': ecn.ecnNumber || '',
    'Title': ecn.title || '',
    'Description': ecn.description || '',
    'Status': ecn.status?.replace(/_/g, ' ') || '',
    'Distribution List': ecn.distributionList || '',
    'Internal Stakeholders': ecn.internalStakeholders || '',
    'Customer Notification Required': ecn.customerNotificationRequired?.replace(/_/g, ' ') || '',
    'Response Deadline': ecn.responseDeadline?.replace(/_/g, ' ') || '',
    'Implementation Status': ecn.implementationStatus?.replace(/_/g, ' ') || '',
    'Actual Implementation Date': ecn.actualImplementationDate ? new Date(ecn.actualImplementationDate).toLocaleDateString() : '',
    'Acknowledgment Status': ecn.acknowledgmentStatus || '',
    'Final Documentation Summary': ecn.finalDocumentationSummary || '',
    'Closure Approver': ecn.closureApprover || '',
    'Closure Date': ecn.closureDate ? new Date(ecn.closureDate).toLocaleDateString() : '',
    'Linked ECO': ecn.eco?.ecoNumber || '',
    'ECO Title': ecn.eco?.title || '',
    'Original ECR': ecn.eco?.ecrs?.[0]?.ecrNumber || '',
    'ECR Title': ecn.eco?.ecrs?.[0]?.title || '',
    'ECR Submitter': ecn.eco?.ecrs?.[0]?.submitter?.name || '',
    'Submitter': ecn.submitter?.name || '',
    'Submitter Email': ecn.submitter?.email || '',
    'Assignee': ecn.assignee?.name || '',
    'Assignee Email': ecn.assignee?.email || '',
    'Changes Implemented': ecn.changesImplemented || '',
    'Affected Items': ecn.affectedItems || '',
    'Disposition Instructions': ecn.dispositionInstructions || '',
    'Verification Method': ecn.verificationMethod || '',
    'Effective Date': ecn.effectiveDate ? new Date(ecn.effectiveDate).toLocaleDateString() : '',
    'Distributed Date': ecn.distributedAt ? new Date(ecn.distributedAt).toLocaleDateString() : '',
    'Created Date': ecn.createdAt ? new Date(ecn.createdAt).toLocaleDateString() : ''
  }));
};

interface ExportButtonProps {
  onExport: () => void;
  disabled?: boolean;
  isExporting?: boolean;
  className?: string;
}

export function ExportButton({ 
  onExport, 
  disabled = false, 
  isExporting = false,
  className = ''
}: ExportButtonProps) {
  return (
    <button
      onClick={onExport}
      disabled={disabled || isExporting}
      className={`inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      title="Export to Excel"
    >
      {isExporting ? (
        <>
          <svg className="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Exporting...
        </>
      ) : (
        <>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="hidden sm:inline">Export to Excel</span>
          <span className="sm:hidden">Export</span>
        </>
      )}
    </button>
  );
}