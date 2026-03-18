import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <div className={cn('rounded-lg border border-slate-200 bg-white shadow-sm', className)}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: CardProps) {
  return <div className={cn('px-6 py-4 border-b border-slate-200', className)}>{children}</div>;
}

export function CardTitle({ children, className }: CardProps) {
  return <h3 className={cn('text-lg font-semibold', className)}>{children}</h3>;
}

export function CardContent({ children, className }: CardProps) {
  return <div className={cn('p-6', className)}>{children}</div>;
}
