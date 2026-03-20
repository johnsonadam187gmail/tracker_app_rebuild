import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, type = 'text', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <input
            type={type}
            id={inputId}
            ref={ref}
            className={cn(
              'flex h-11 w-full rounded-lg border bg-white px-4 py-2.5 text-sm',
              'placeholder:text-slate-400 dark:placeholder:text-slate-500',
              'transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-offset-0',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'dark:bg-slate-800 dark:text-white',
              error
                ? 'border-red-500/70 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500/50'
                : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500/20 dark:border-slate-600',
              className
            )}
            {...props}
          />
          {error && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500">
              <AlertCircle className="w-4 h-4" />
            </div>
          )}
        </div>
        {error && <p className="text-xs text-red-500 flex items-center gap-1">{error}</p>}
        {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };
