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

// ECR-specific export format
export const formatECRsForExport = (ecrs: ECRForExport[]) => {
  return ecrs.map((ecr) => ({
    'ECR Number': ecr.ecrNumber || '',
    'Title': ecr.title || '',
    'Description': ecr.description || '',
    'Priority': ecr.priority || '',
    'Status': ecr.status?.replace(/_/g, ' ') || '',
    'Category': ecr.category || '',
    'Impact Assessment': ecr.impactAssessment || '',
    'Justification': ecr.justification || '',
    'Submitter': ecr.submitter?.name || '',
    'Submitter Email': ecr.submitter?.email || '',
    'Assignee': ecr.assignee?.name || '',
    'Assignee Email': ecr.assignee?.email || '',
    'Target Date': ecr.targetDate ? new Date(ecr.targetDate).toLocaleDateString() : '',
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

// ECO-specific export format
export const formatECOsForExport = (ecos: ECOForExport[]) => {
  return ecos.map((eco) => ({
    'ECO Number': eco.ecoNumber || '',
    'Title': eco.title || '',
    'Status': eco.status?.replace(/_/g, ' ') || '',
    'Priority': eco.priority || '',
    'Linked ECR': eco.ecr?.ecrNumber || '',
    'ECR Title': eco.ecr?.title || '',
    'Bundled ECRs': eco.ecrs?.map((ecr) => ecr.ecrNumber).join(', ') || '',
    'Assignee': eco.assignee?.name || '',
    'Assignee Email': eco.assignee?.email || '',
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

// ECN-specific export format
export const formatECNsForExport = (ecns: ECNForExport[]) => {
  return ecns.map((ecn) => ({
    'ECN Number': ecn.ecnNumber || '',
    'Title': ecn.title || '',
    'Description': ecn.description || '',
    'Status': ecn.status?.replace(/_/g, ' ') || '',
    'Linked ECO': ecn.eco?.ecoNumber || '',
    'ECO Title': ecn.eco?.title || '',
    'Original ECR': ecn.eco?.ecr?.ecrNumber || '',
    'ECR Title': ecn.eco?.ecr?.title || '',
    'ECR Submitter': ecn.eco?.ecr?.submitter?.name || '',
    'Submitter': ecn.submitter?.name || '',
    'Submitter Email': ecn.submitter?.email || '',
    'Assignee': ecn.assignee?.name || '',
    'Assignee Email': ecn.assignee?.email || '',
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