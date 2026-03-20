import { cn, getInitials } from '@/lib/utils';

interface AvatarProps {
  src?: string | null;
  firstName?: string;
  lastName?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Avatar({ src, firstName = '', lastName = '', size = 'md', className }: AvatarProps) {
  const sizeClasses = {
    xs: 'h-6 w-6 text-[10px]',
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-16 w-16 text-lg',
  };

  const initials = getInitials(firstName, lastName);
  const fullName = `${firstName} ${lastName}`.trim();

  if (src) {
    return (
      <img
        src={src}
        alt={fullName || 'Avatar'}
        className={cn(
          'rounded-full object-cover ring-2 ring-white dark:ring-slate-700',
          'shadow-sm',
          sizeClasses[size],
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-semibold',
        'bg-gradient-to-br from-blue-500 to-blue-600 text-white',
        'shadow-sm ring-2 ring-white dark:ring-slate-700',
        sizeClasses[size],
        className
      )}
      title={fullName}
    >
      {initials}
    </div>
  );
}
