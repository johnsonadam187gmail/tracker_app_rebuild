'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { authApi, classesApi, newsApi } from '@/lib/api';
import type { News, ClassSchedule } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { 
  Shield, 
  Lock, 
  Mail, 
  AlertCircle,
  Calendar,
  Newspaper,
  LogIn
} from 'lucide-react';

import { DAYS_OF_WEEK } from '@/lib/utils';

export default function HomePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, roles, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [classes, setClasses] = useState<ClassSchedule[]>([]);
  const [news, setNews] = useState<News[]>([]);
  const [loginAttempted, setLoginAttempted] = useState(false);

  useEffect(() => {
    classesApi.list().then(setClasses).catch(console.error);
    newsApi.list(true).then(setNews).catch(console.error);
  }, []);

  useEffect(() => {
    if (!authLoading && loginAttempted && user && roles.length > 0) {
      router.push('/check-in');
      setLoginAttempted(false);
    }
  }, [authLoading, user, roles, loginAttempted, router]);

  useEffect(() => {
    if (!authLoading && isAuthenticated && user && roles.length > 0) {
      router.push('/check-in');
    }
  }, [authLoading, isAuthenticated, user, roles, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsFormLoading(true);
    setLoginAttempted(true);

    try {
      await login(email, password);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid credentials';
      setError(message);
      setLoginAttempted(false);
    } finally {
      setIsFormLoading(false);
    }
  };

  const getClassesForDay = (dayName: string) => {
    return classes.filter(c => c.day?.toLowerCase() === dayName.toLowerCase()).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  };

  const today = new Date();
  const todayDayName = DAYS_OF_WEEK[today.getDay()];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">CKB Tracker</h1>
          <p className="text-slate-400">Welcome to our martial arts school</p>
        </div>

        <Card className="bg-slate-800/80 border-slate-700/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Calendar className="w-5 h-5 text-blue-400" />
              Class Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-white">This Week&apos;s Schedule</h3>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {DAYS_OF_WEEK.map((day) => {
                const dayClasses = getClassesForDay(day);
                const isTodayDay = day === todayDayName;
                
                return (
                  <div 
                    key={day} 
                    className={`
                      min-h-[180px] rounded-lg p-2 border
                      ${isTodayDay 
                        ? 'bg-blue-500/10 border-blue-500/50' 
                        : 'bg-slate-700/30 border-slate-600/30'}
                    `}
                  >
                    <div className={`
                      text-center font-semibold text-sm mb-2 pb-2 border-b 
                      ${isTodayDay ? 'text-blue-400 border-blue-500/30' : 'text-slate-400 border-slate-600/30'}
                    `}>
                      {day}
                    </div>
                    <div className="space-y-2">
                      {dayClasses.length > 0 ? (
                        dayClasses.map((cls) => (
                          <div
                            key={cls.id}
                            className="p-2 bg-slate-700/50 rounded-lg border border-slate-600/50 opacity-75"
                          >
                            <p className="font-medium text-xs text-white truncate">{cls.class_name}</p>
                            <p className="text-xs text-slate-400">{cls.time}</p>
                            <p className="text-xs font-medium text-blue-400">{cls.points} pts</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-500 text-center py-2">No classes</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="max-w-md mx-auto">
          <Card className="bg-slate-800/80 border-slate-700/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <LogIn className="w-5 h-5 text-blue-400" />
                Sign In
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-11 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-11 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  isLoading={isFormLoading}
                >
                  Sign In
                </Button>
              </form>
            </CardContent>
          </Card>

          {news.length > 0 && (
            <Card className="bg-slate-800/80 border-slate-700/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Newspaper className="w-5 h-5 text-blue-400" />
                  News & Updates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {news.slice(0, 3).map(item => (
                  <div key={item.id} className="pb-4 border-b border-slate-700/50 last:border-0 last:pb-0">
                    <h4 className="font-medium text-white mb-1">{item.title}</h4>
                    <p className="text-sm text-slate-400 line-clamp-2">{item.content}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="text-center">
          <p className="text-slate-500 text-sm">
            Need help? Contact us at info@ckbtracker.com
          </p>
        </div>
      </div>
    </div>
  );
}
