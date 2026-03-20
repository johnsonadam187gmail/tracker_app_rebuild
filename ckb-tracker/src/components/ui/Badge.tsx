import { cn, getRankColor } from '@/lib/utils';
import { Award } from 'lucide-react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'outline' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md';
  className?: string;
}

export function Badge({ children, variant = 'default', size = 'md', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium',
        {
          'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300': variant === 'default',
          'border border-slate-300 text-slate-700 dark:border-slate-600 dark:text-slate-300': variant === 'outline',
          'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400': variant === 'success',
          'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400': variant === 'warning',
          'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400': variant === 'error',
        },
        {
          'px-2 py-0.5 text-xs': size === 'sm',
          'px-2.5 py-0.5 text-xs': size === 'md',
        },
        className
      )}
    >
      {children}
    </span>
  );
}

export function RankBadge({ rank, showIcon = true }: { rank?: string; showIcon?: boolean }) {
  if (!rank) return null;
  
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
        getRankColor(rank)
      )}
    >
      {showIcon && <Award className="w-3 h-3" />}
      {rank}
    </span>
  );
}
