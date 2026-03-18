'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

const navItems = [
  { href: '/', label: 'Attendance', icon: '🏠' },
  { href: '/login', label: 'Login', icon: '🔐' },
  { href: '/portal', label: 'My Portal', icon: '📊' },
  { href: '/teacher', label: 'Teacher', icon: '👨‍🏫' },
  { href: '/admin', label: 'Admin', icon: '⚙️' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isAuthenticated, user, isTeacher, isAdmin, logout } = useAuth();

  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen p-4 flex flex-col">
      <div className="mb-6">
        <h1 className="text-xl font-bold">CKB Tracker</h1>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const isHidden = item.href === '/teacher' && !isTeacher && !isAdmin;
          const isHiddenAdmin = item.href === '/admin' && !isAdmin;

          if (isHidden || isHiddenAdmin) return null;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md transition-colors',
                isActive
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              )}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {isAuthenticated && user && (
        <div className="border-t border-slate-700 pt-4 mt-4">
          <p className="text-sm text-slate-400 mb-2">Logged in as:</p>
          <p className="font-medium">{user.first_name} {user.last_name}</p>
          <button
            onClick={logout}
            className="mt-2 text-sm text-slate-400 hover:text-white"
          >
            Logout
          </button>
        </div>
      )}
    </aside>
  );
}
