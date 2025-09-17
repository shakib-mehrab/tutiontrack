interface ProgressBarProps {
  progress: number;
  className?: string;
}

export function ProgressBar({ progress, className = '' }: ProgressBarProps) {
  const clampedProgress = Math.max(0, Math.min(progress, 100));
  
  const getWidthClass = () => {
    if (clampedProgress === 0) return 'w-0';
    if (clampedProgress <= 5) return 'w-1';
    if (clampedProgress <= 10) return 'w-2';
    if (clampedProgress <= 15) return 'w-3';
    if (clampedProgress <= 20) return 'w-4';
    if (clampedProgress <= 25) return 'w-1/4';
    if (clampedProgress <= 30) return 'w-5';
    if (clampedProgress <= 35) return 'w-6';
    if (clampedProgress <= 40) return 'w-7';
    if (clampedProgress <= 45) return 'w-8';
    if (clampedProgress <= 50) return 'w-1/2';
    if (clampedProgress <= 55) return 'w-9';
    if (clampedProgress <= 60) return 'w-10';
    if (clampedProgress <= 65) return 'w-11';
    if (clampedProgress <= 70) return 'w-12';
    if (clampedProgress <= 75) return 'w-3/4';
    if (clampedProgress <= 80) return 'w-14';
    if (clampedProgress <= 85) return 'w-16';
    if (clampedProgress <= 90) return 'w-20';
    if (clampedProgress < 100) return 'w-11/12';
    return 'w-full';
  };

  const getGradientClass = () => {
    if (clampedProgress >= 100) return 'bg-gradient-to-r from-emerald-500 to-green-500';
    if (clampedProgress >= 75) return 'bg-gradient-to-r from-blue-500 to-cyan-500';
    if (clampedProgress >= 50) return 'bg-gradient-to-r from-amber-500 to-yellow-500';
    return 'bg-gradient-to-r from-red-500 to-pink-500';
  };

  return (
    <div className={`w-full bg-white/20 rounded-full h-3 overflow-hidden ${className}`}>
      <div className={`h-3 rounded-full transition-all duration-500 ease-out ${getGradientClass()} shadow-lg ${getWidthClass()}`}>
        <div className="w-full h-full bg-gradient-to-r from-white/30 to-transparent animate-pulse"></div>
      </div>
    </div>
  );
}
