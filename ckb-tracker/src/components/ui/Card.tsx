import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ children, className, hover = false }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-slate-200/80 bg-white shadow-sm',
        'dark:bg-slate-800/50 dark:border-slate-700/50',
        'transition-all duration-200',
        hover && 'hover:shadow-md hover:border-slate-300/80 dark:hover:border-slate-600/50',
        className
      )}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <div
      className={cn(
        'px-6 py-4 border-b border-slate-100 dark:border-slate-700/50',
        'bg-gradient-to-r from-slate-50/50 to-transparent dark:from-slate-800/50',
        className
      )}
    >
      {children}
    </div>
  );
}

interface CardTitleProps {
  children: ReactNode;
  className?: string;
  description?: string;
}

export function CardTitle({ children, className, description }: CardTitleProps) {
  return (
    <div>
      <h3 className={cn('text-lg font-semibold text-slate-900 dark:text-white', className)}>
        {children}
      </h3>
      {description && (
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
      )}
    </div>
  );
}

interface CardContentProps {
  children: ReactNode;
  className?: string;
}

export function CardContent({ children, className }: CardContentProps) {
  return <div className={cn('p-6', className)}>{children}</div>;
}

interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

export function CardFooter({ children, className }: CardFooterProps) {
  return (
    <div
      className={cn(
        'px-6 py-4 border-t border-slate-100 dark:border-slate-700/50',
        'bg-slate-50/50 dark:bg-slate-800/30',
        'rounded-b-xl',
        className
      )}
    >
      {children}
    </div>
  );
}
