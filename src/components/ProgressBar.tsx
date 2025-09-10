interface ProgressBarProps {
  progress: number;
  className?: string;
}

export function ProgressBar({ progress, className = '' }: ProgressBarProps) {
  const clampedProgress = Math.max(0, Math.min(progress, 100));
  
  const getWidthClass = () => {
    if (clampedProgress === 0) return 'w-0';
    if (clampedProgress <= 10) return 'w-1/12';
    if (clampedProgress <= 25) return 'w-1/4';
    if (clampedProgress <= 50) return 'w-1/2';
    if (clampedProgress <= 75) return 'w-3/4';
    if (clampedProgress < 100) return 'w-11/12';
    return 'w-full';
  };

  const getColorClass = () => {
    if (clampedProgress >= 100) return 'bg-green-500';
    if (clampedProgress >= 75) return 'bg-blue-500';
    if (clampedProgress >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className={`w-full bg-gray-200 rounded-full h-3 ${className}`}>
      <div className={`h-3 rounded-full transition-all duration-300 ${getColorClass()} ${getWidthClass()}`} />
    </div>
  );
}
