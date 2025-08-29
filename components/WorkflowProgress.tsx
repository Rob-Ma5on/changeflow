'use client';

interface WorkflowStep {
  id: number;
  title: string;
  description: string;
  icon: 'request' | 'plan' | 'notify';
}

interface WorkflowProgressProps {
  currentStep: 1 | 2 | 3;
  completedSteps: number[];
  sourceInfo?: {
    ecrNumbers?: string[];
    ecoNumber?: string;
  };
}

export default function WorkflowProgress({
  currentStep,
  completedSteps,
  sourceInfo
}: WorkflowProgressProps) {
  const steps: WorkflowStep[] = [
    {
      id: 1,
      title: 'Change Requested',
      description: 'Engineering change request submitted and approved',
      icon: 'request'
    },
    {
      id: 2,
      title: 'Implementation Planning',
      description: 'Detailed plan created for implementing the change',
      icon: 'plan'
    },
    {
      id: 3,
      title: 'Notification & Closure',
      description: 'Stakeholders notified of implemented changes',
      icon: 'notify'
    }
  ];

  const getStepStatus = (stepId: number) => {
    if (completedSteps.includes(stepId)) return 'completed';
    if (stepId === currentStep) return 'active';
    return 'future';
  };

  const getStepIcon = (step: WorkflowStep, status: string) => {
    if (status === 'completed') {
      return (
        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      );
    }

    const iconMap = {
      request: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      plan: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
      notify: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM11.613 15.932c-.299-.002-.61-.016-.933-.05-2.024-.214-3.621-1.861-3.621-3.982 0-2.24 1.821-4.058 4.067-4.058s4.067 1.818 4.067 4.058c0 .537-.108 1.048-.303 1.515m1.746 1.345a5.965 5.965 0 01-1.746 1.345M12 4V2m6.364 1.636l-1.414 1.414M20 12h2M4 12H2m1.636-6.364l1.414 1.414m12.728 0l1.414-1.414" />
        </svg>
      )
    };

    return iconMap[step.icon];
  };

  const getStepStyles = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          circle: 'bg-green-500 border-green-500 text-white',
          line: 'bg-green-500',
          title: 'text-green-700 font-medium',
          description: 'text-green-600'
        };
      case 'active':
        return {
          circle: 'bg-blue-500 border-blue-500 text-white animate-pulse',
          line: 'bg-gray-300',
          title: 'text-blue-700 font-semibold',
          description: 'text-blue-600'
        };
      case 'future':
        return {
          circle: 'bg-gray-200 border-gray-300 text-gray-500',
          line: 'bg-gray-300',
          title: 'text-gray-500',
          description: 'text-gray-400'
        };
      default:
        return {
          circle: 'bg-gray-200 border-gray-300 text-gray-500',
          line: 'bg-gray-300',
          title: 'text-gray-500',
          description: 'text-gray-400'
        };
    }
  };

  const renderSourceInfo = (stepId: number) => {
    if (stepId === 1 && sourceInfo?.ecrNumbers?.length) {
      return (
        <div className="mt-2 text-xs text-gray-600">
          {sourceInfo.ecrNumbers.map((number, index) => (
            <div key={number} className="font-mono">
              {number}
            </div>
          ))}
        </div>
      );
    }

    if (stepId === 2 && sourceInfo?.ecoNumber) {
      return (
        <div className="mt-2 text-xs text-gray-600">
          <div className="font-mono">{sourceInfo.ecoNumber}</div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        {/* Desktop: Horizontal Layout */}
        <div className="hidden lg:flex items-center justify-between w-full">
          {steps.map((step, index) => {
            const status = getStepStatus(step.id);
            const styles = getStepStyles(status);
            const isLastStep = index === steps.length - 1;

            return (
              <div key={step.id} className="flex items-center flex-1">
                {/* Step Circle and Content */}
                <div className="flex flex-col items-center text-center">
                  <div className={`relative w-12 h-12 rounded-full border-2 flex items-center justify-center ${styles.circle} transition-all duration-300`}>
                    {getStepIcon(step, status)}
                    {status === 'active' && (
                      <div className="absolute inset-0 rounded-full border-2 border-blue-400 animate-ping"></div>
                    )}
                  </div>
                  <div className="mt-3 max-w-xs">
                    <div className={`text-sm ${styles.title}`}>{step.title}</div>
                    <div className={`text-xs mt-1 ${styles.description}`}>{step.description}</div>
                    {renderSourceInfo(step.id)}
                  </div>
                </div>

                {/* Connecting Line */}
                {!isLastStep && (
                  <div className="flex-1 mx-4">
                    <div className={`h-1 ${styles.line} transition-colors duration-300`}></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Mobile: Vertical Layout */}
        <div className="lg:hidden space-y-4">
          {steps.map((step, index) => {
            const status = getStepStatus(step.id);
            const styles = getStepStyles(status);
            const isLastStep = index === steps.length - 1;

            return (
              <div key={step.id} className="flex items-start">
                {/* Step Circle */}
                <div className="flex flex-col items-center">
                  <div className={`relative w-10 h-10 rounded-full border-2 flex items-center justify-center ${styles.circle} transition-all duration-300`}>
                    {getStepIcon(step, status)}
                    {status === 'active' && (
                      <div className="absolute inset-0 rounded-full border-2 border-blue-400 animate-ping"></div>
                    )}
                  </div>
                  {!isLastStep && (
                    <div className="mt-2">
                      <div className={`w-1 h-8 ${styles.line} transition-colors duration-300`}></div>
                    </div>
                  )}
                </div>

                {/* Step Content */}
                <div className="ml-4 flex-1">
                  <div className={`text-sm ${styles.title}`}>{step.title}</div>
                  <div className={`text-xs mt-1 ${styles.description}`}>{step.description}</div>
                  {renderSourceInfo(step.id)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}