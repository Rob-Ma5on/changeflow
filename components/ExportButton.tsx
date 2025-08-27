'use client';

import { Download } from 'lucide-react';

interface ExportButtonProps {
  data: any[];
  filename: string;
  columns: {
    key: string;
    label: string;
    format?: 'date' | 'currency' | 'boolean' | 'status' | 'array';
  }[];
  className?: string;
}

export default function ExportButton({ data, filename, columns, className = '' }: ExportButtonProps) {
  const formatValue = (value: any, format?: string): string => {
    if (value === null || value === undefined) return '';
    
    switch (format) {
      case 'date':
        if (!value) return '';
        return new Date(value).toLocaleDateString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
      
      case 'currency':
        if (!value || isNaN(Number(value))) return '';
        return `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
      
      case 'boolean':
        return value ? 'Yes' : 'No';
      
      case 'status':
        return String(value).replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
      
      case 'array':
        return Array.isArray(value) ? value.join(', ') : String(value || '');
      
      default:
        return String(value || '');
    }
  };

  const getNestedValue = (obj: any, path: string): any => {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : null;
    }, obj);
  };

  const generateCSV = (): string => {
    // Create header row
    const headers = columns.map(col => `"${col.label}"`).join(',');
    
    // Create data rows
    const rows = data.map(item => {
      return columns.map(col => {
        const value = getNestedValue(item, col.key);
        const formattedValue = formatValue(value, col.format);
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        const escaped = String(formattedValue).replace(/"/g, '""');
        return `"${escaped}"`;
      }).join(',');
    });

    return [headers, ...rows].join('\n');
  };

  const downloadCSV = () => {
    const csvContent = generateCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Create download link
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const downloadFilename = `${filename}_${timestamp}.csv`;
    link.setAttribute('download', downloadFilename);
    
    // Trigger download
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    URL.revokeObjectURL(url);
  };

  if (!data || data.length === 0) {
    return (
      <button
        disabled
        className={`inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-400 bg-gray-100 cursor-not-allowed ${className}`}
      >
        <Download className="h-4 w-4 mr-2" />
        Export CSV
      </button>
    );
  }

  return (
    <button
      onClick={downloadCSV}
      className={`inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${className}`}
    >
      <Download className="h-4 w-4 mr-2" />
      Export CSV
    </button>
  );
}