'use client';

import Link from 'next/link';

interface WorkflowStep {
  id: string;
  number: string;
  title: string;
  status: 'completed' | 'current' | 'future';
}

interface WorkflowBreadcrumbsProps {
  currentStep: 'ECR' | 'ECO' | 'ECN';
  ecr?: {
    id: string;
    ecrNumber: string;
    title: string;
  };
  eco?: {
    id: string;
    ecoNumber: string;
    title: string;
  };
  ecn?: {
    id: string;
    ecnNumber: string;
    title: string;
  };
}

export default function WorkflowBreadcrumbs({
  currentStep,
  ecr,
  eco,
  ecn
}: WorkflowBreadcrumbsProps) {
  const steps: WorkflowStep[] = [
    {
      id: 'ECR',
      number: ecr?.ecrNumber || 'ECR',
      title: ecr?.title || 'Engineering Change Request',
      status: currentStep === 'ECR' ? 'current' : ecr ? 'completed' : 'future'
    },
    {
      id: 'ECO',
      number: eco?.ecoNumber || 'ECO',
      title: eco?.title || 'Engineering Change Order',
      status: currentStep === 'ECO' ? 'current' : eco ? 'completed' : currentStep === 'ECN' ? 'completed' : 'future'
    },
    {
      id: 'ECN',
      number: ecn?.ecnNumber || 'ECN',
      title: ecn?.title || 'Engineering Change Notice',
      status: currentStep === 'ECN' ? 'current' : ecn ? 'completed' : 'future'
    }
  ];

  const getStepStyles = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          container: 'bg-green-50 border border-green-200 text-green-800 hover:bg-green-100',
          icon: 'text-green-600',
          text: 'text-green-900'
        };
      case 'current':
        return {
          container: 'bg-blue-50 border-2 border-blue-500 text-blue-800',
          icon: 'text-blue-600',
          text: 'text-blue-900 font-semibold'
        };
      case 'future':
        return {
          container: 'bg-gray-50 border border-gray-200 text-gray-500',
          icon: 'text-gray-400',
          text: 'text-gray-600'
        };
      default:
        return {
          container: 'bg-gray-50 border border-gray-200 text-gray-500',
          icon: 'text-gray-400',
          text: 'text-gray-600'
        };
    }
  };

  const renderStep = (step: WorkflowStep, index: number) => {
    const styles = getStepStyles(step.status);
    const isClickable = step.status === 'completed' || (step.status === 'current' && step.id === currentStep);
    const hasData = (step.id === 'ECR' && ecr) || (step.id === 'ECO' && eco) || (step.id === 'ECN' && ecn);

    const stepContent = (
      <div className={`flex items-center px-3 py-2 rounded-lg transition-colors ${styles.container} group relative`}>
        <div className="flex items-center space-x-2">
          {/* Icon */}
          <div className={`w-6 h-6 flex items-center justify-center ${styles.icon}`}>
            {step.status === 'completed' ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : step.status === 'current' ? (
              <div className="w-3 h-3 bg-current rounded-full"></div>
            ) : (
              <div className="w-3 h-3 border-2 border-current rounded-full"></div>
            )}
          </div>
          
          {/* Step Label */}
          <div className={styles.text}>
            <div className="text-sm">{step.number}</div>
          </div>
        </div>

        {/* Tooltip */}
        {hasData && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
            <div className="font-medium">{step.number}</div>
            <div className="text-xs text-gray-300">{step.title}</div>
            {/* Arrow */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
          </div>
        )}
      </div>
    );

    if (isClickable && hasData) {
      const href = step.id === 'ECR' ? `/dashboard/ecr/${ecr?.id}` :
                   step.id === 'ECO' ? `/dashboard/eco/${eco?.id}` :
                   `/dashboard/ecn/${ecn?.id}`;
      
      return (
        <Link key={step.id} href={href} className="block">
          {stepContent}
        </Link>
      );
    }

    return (
      <div key={step.id}>
        {stepContent}
      </div>
    );
  };

  return (
    <nav className="flex items-center space-x-1 mb-6">
      <div className="flex items-center space-x-1">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            {renderStep(step, index)}
            
            {/* Arrow between steps */}
            {index < steps.length - 1 && (
              <div className="mx-2 text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>
    </nav>
  );
}