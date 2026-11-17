// Pure class-name helpers, safe to use in server and client components.

export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}

export type Variant = 'primary' | 'outline' | 'soft' | 'dark' | 'ghost' | 'danger' | 'coral';
export type Size = 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm';

const variants: Record<Variant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-hover shadow-[var(--shadow-float)]',
  outline: 'bg-surface text-primary-deep border-[1.5px] border-primary-line hover:bg-mist',
  soft: 'bg-primary-soft text-primary-deep hover:bg-primary-line/60',
  dark: 'bg-ink text-white hover:bg-ink/90',
  ghost: 'bg-transparent text-muted hover:bg-mist hover:text-ink',
  danger: 'bg-coral-soft text-coral-ink hover:bg-coral/30',
  coral: 'bg-coral-soft text-coral-ink hover:bg-coral/30',
};
const sizes: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-[13px] rounded-xl gap-1.5',
  md: 'h-11 px-4 text-sm rounded-[14px] gap-2',
  lg: 'h-[54px] px-6 text-base rounded-2xl gap-2',
  icon: 'h-11 w-11 rounded-[14px]',
  'icon-sm': 'h-9 w-9 rounded-xl',
};

export function buttonClass(variant: Variant = 'primary', size: Size = 'md', className?: string) {
  return cn(
    'inline-flex items-center justify-center font-bold whitespace-nowrap transition-colors select-none',
    'disabled:opacity-50 disabled:pointer-events-none',
    variants[variant],
    sizes[size],
    className
  );
}

