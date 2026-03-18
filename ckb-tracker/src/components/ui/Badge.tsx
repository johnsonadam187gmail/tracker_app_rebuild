import { cn, getRankColor } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'outline' | 'rank';
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        {
          'bg-slate-100 text-slate-800': variant === 'default',
          'border border-slate-300 text-slate-700': variant === 'outline',
        },
        className
      )}
    >
      {children}
    </span>
  );
}

export function RankBadge({ rank }: { rank?: string }) {
  if (!rank) return null;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        getRankColor(rank)
      )}
    >
      {rank}
    </span>
  );
}
