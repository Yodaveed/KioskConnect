import { CheckCircle, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProgressIndicatorProps {
  steps: Array<{
    number: number;
    label: string;
    completed?: boolean;
  }>;
  currentStep: number;
  className?: string;
}

export function ProgressIndicator({ steps, currentStep, className }: ProgressIndicatorProps) {
  return (
    <div className={cn("bg-white shadow-sm border-b", className)} role="progressbar" aria-valuenow={currentStep} aria-valuemax={steps.length}>
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            {steps.map((step, index) => {
              const isCompleted = step.completed || step.number < currentStep;
              const isCurrent = step.number === currentStep;
              
              return (
                <div key={step.number} className="flex items-center space-x-2">
                  <div
                    className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors",
                      isCompleted
                        ? "bg-green-500 text-white"
                        : isCurrent
                        ? "bg-primary text-white"
                        : "bg-gray-200 text-gray-500"
                    )}
                    aria-label={`Step ${step.number}: ${step.label} ${
                      isCompleted ? '(completed)' : isCurrent ? '(current)' : '(upcoming)'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <span>{step.number}</span>
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-sm font-medium",
                      isCompleted || isCurrent ? "text-gray-900" : "text-gray-500"
                    )}
                  >
                    {step.label}
                  </span>
                  {index < steps.length - 1 && (
                    <div
                      className={cn(
                        "h-px bg-gray-300 ml-4",
                        isCompleted ? "bg-green-500" : ""
                      )}
                      style={{ width: '3rem' }}
                      aria-hidden="true"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="sr-only">
        Step {currentStep} of {steps.length}: {steps.find(s => s.number === currentStep)?.label}
      </div>
    </div>
  );
}