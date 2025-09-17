interface ProgressBarProps {
  progress: number;
  className?: string;
}

export function ProgressBar({ progress, className = '' }: ProgressBarProps) {
  const clampedProgress = Math.max(0, Math.min(progress, 100));
  
  const getProgressColor = () => {
    if (clampedProgress >= 80) return 'bg-green-500';
    if (clampedProgress >= 60) return 'bg-blue-500';
    if (clampedProgress >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className={`w-full bg-slate-200 rounded-full overflow-hidden ${className}`}>
      <div 
        className={`h-full rounded-full progress-bar-fill ${getProgressColor()}`}
        data-progress={clampedProgress}
        style={{width: `${clampedProgress}%`}}
      >
        <div className="w-full h-full bg-gradient-to-r from-white/20 to-transparent"></div>
      </div>
    </div>
  );
}