import { cn, getInitials } from '@/lib/utils';

interface AvatarProps {
  src?: string | null;
  firstName?: string;
  lastName?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Avatar({ src, firstName = '', lastName = '', size = 'md', className }: AvatarProps) {
  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-16 w-16 text-lg',
  };

  if (src) {
    return (
      <img
        src={src}
        alt={`${firstName} ${lastName}`}
        className={cn('rounded-full object-cover', sizeClasses[size], className)}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-full bg-slate-200 flex items-center justify-center font-medium text-slate-600',
        sizeClasses[size],
        className
      )}
    >
      {getInitials(firstName, lastName)}
    </div>
  );
}
