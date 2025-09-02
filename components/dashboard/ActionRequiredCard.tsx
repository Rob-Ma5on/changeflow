'use client';

import React from 'react';
import Link from 'next/link';

interface ActionRequiredItem {
  id: string;
  type: 'ECR' | 'ECO' | 'ECN';
  number: string;
  title: string;
  status: string;
  priority?: string;
  age: number; // in hours
  dueDate?: string;
  assignee?: string;
  actionUrl: string;
  actionLabel: string;
}

interface ActionRequiredCardProps {
  item: ActionRequiredItem;
  urgencyLevel: 'overdue' | 'due-soon' | 'normal';
}

export default function ActionRequiredCard({ item, urgencyLevel }: ActionRequiredCardProps) {
  const getUrgencyStyles = () => {
    switch (urgencyLevel) {
      case 'overdue':
        return {
          container: 'border-red-300 bg-red-50',
          badge: 'bg-red-100 text-red-800 border-red-300',
          icon: 'text-red-600',
          action: 'bg-red-600 hover:bg-red-700 text-white'
        };
      case 'due-soon':
        return {
          container: 'border-yellow-300 bg-yellow-50',
          badge: 'bg-yellow-100 text-yellow-800 border-yellow-300',
          icon: 'text-yellow-600',
          action: 'bg-yellow-600 hover:bg-yellow-700 text-white'
        };
      default:
        return {
          container: 'border-gray-200 bg-white hover:bg-gray-50',
          badge: 'bg-gray-100 text-gray-800 border-gray-300',
          icon: 'text-gray-600',
          action: 'bg-blue-600 hover:bg-blue-700 text-white'
        };
    }
  };

  const getTypeIcon = () => {
    switch (item.type) {
      case 'ECR':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'ECO':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        );
      case 'ECN':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
    }
  };

  const getUrgencyIcon = () => {
    switch (urgencyLevel) {
      case 'overdue':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'due-soon':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const formatAge = (hours: number) => {
    if (hours < 24) {
      return `${Math.floor(hours)} hours`;
    } else {
      const days = Math.floor(hours / 24);
      return `${days} day${days === 1 ? '' : 's'}`;
    }
  };

  const formatDueDate = (dueDate: string) => {
    const date = new Date(dueDate);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 0) {
      return `Overdue by ${Math.floor(Math.abs(diffHours))} hours`;
    } else if (diffHours < 24) {
      return `Due in ${diffHours} hours`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `Due in ${diffDays} day${diffDays === 1 ? '' : 's'}`;
    }
  };

  const styles = getUrgencyStyles();

  return (
    <div className={`relative border rounded-lg p-4 transition-all duration-200 ${styles.container}`}>
      {/* Urgency Indicator */}
      {urgencyLevel !== 'normal' && (
        <div className={`absolute -top-2 -right-2 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${styles.badge}`}>
          {getUrgencyIcon()}
          <span className="uppercase tracking-wide">
            {urgencyLevel === 'overdue' ? 'Overdue' : 'Due Soon'}
          </span>
        </div>
      )}

      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          {/* Type Icon */}
          <div className={`flex-shrink-0 ${styles.icon}`}>
            {getTypeIcon()}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Link 
                href={`/dashboard/${item.type.toLowerCase()}/${item.id}`}
                className="font-medium text-gray-900 hover:text-blue-600 transition-colors"
              >
                {item.number}
              </Link>
              
              {/* Priority Badge */}
              {item.priority && (
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  item.priority === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                  item.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                  item.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {item.priority}
                </span>
              )}
            </div>

            <h3 className="text-sm text-gray-800 font-medium mb-2 line-clamp-2">
              {item.title}
            </h3>

            {/* Status and Age */}
            <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
              <div className="flex items-center gap-1">
                <span className="font-medium">Status:</span>
                <span className="capitalize">{item.status.replace(/_/g, ' ').toLowerCase()}</span>
              </div>
              
              <div className="flex items-center gap-1">
                <span className="font-medium">Age:</span>
                <span>{formatAge(item.age)}</span>
              </div>
              
              {item.assignee && (
                <div className="flex items-center gap-1">
                  <span className="font-medium">Assignee:</span>
                  <span>{item.assignee}</span>
                </div>
              )}
            </div>

            {/* Due Date */}
            {item.dueDate && (
              <div className={`text-xs font-medium mb-3 ${
                urgencyLevel === 'overdue' ? 'text-red-600' :
                urgencyLevel === 'due-soon' ? 'text-yellow-600' :
                'text-gray-600'
              }`}>
                {formatDueDate(item.dueDate)}
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="flex-shrink-0 ml-4">
          <Link
            href={item.actionUrl}
            className={`inline-flex items-center gap-1 px-3 py-2 text-xs font-medium rounded-md transition-colors ${styles.action}`}
          >
            <span>{item.actionLabel}</span>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}

// Helper function to determine urgency level
export function getUrgencyLevel(item: ActionRequiredItem): 'overdue' | 'due-soon' | 'normal' {
  if (!item.dueDate) {
    // Use age as fallback urgency indicator
    if (item.age > 120) { // 5+ days
      return 'overdue';
    } else if (item.age > 72) { // 3+ days
      return 'due-soon';
    }
    return 'normal';
  }

  const dueDate = new Date(item.dueDate);
  const now = new Date();
  const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursUntilDue < 0) {
    return 'overdue';
  } else if (hoursUntilDue <= 24) {
    return 'due-soon';
  }
  
  return 'normal';
}

// Container component for multiple action cards
interface ActionRequiredListProps {
  items: ActionRequiredItem[];
  title: string;
  maxItems?: number;
  showViewAll?: boolean;
  viewAllUrl?: string;
}

export function ActionRequiredList({ 
  items, 
  title, 
  maxItems = 5, 
  showViewAll = false, 
  viewAllUrl 
}: ActionRequiredListProps) {
  const displayItems = items.slice(0, maxItems);
  const overdueCount = items.filter(item => getUrgencyLevel(item) === 'overdue').length;
  const dueSoonCount = items.filter(item => getUrgencyLevel(item) === 'due-soon').length;

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
        <div className="text-center py-8 text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
          <p>No action required items</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          
          {/* Urgency Summary */}
          <div className="flex items-center gap-2">
            {overdueCount > 0 && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                {overdueCount} overdue
              </span>
            )}
            {dueSoonCount > 0 && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                {dueSoonCount} due soon
              </span>
            )}
          </div>
        </div>

        {showViewAll && viewAllUrl && items.length > maxItems && (
          <Link
            href={viewAllUrl}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            View all ({items.length})
          </Link>
        )}
      </div>

      <div className="space-y-3">
        {displayItems.map((item) => (
          <ActionRequiredCard
            key={item.id}
            item={item}
            urgencyLevel={getUrgencyLevel(item)}
          />
        ))}
      </div>

      {items.length > maxItems && !showViewAll && (
        <div className="mt-4 text-center">
          <span className="text-sm text-gray-500">
            Showing {maxItems} of {items.length} items
          </span>
        </div>
      )}
    </div>
  );
}