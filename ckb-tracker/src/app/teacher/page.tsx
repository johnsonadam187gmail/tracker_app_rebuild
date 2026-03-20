'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Avatar } from '@/components/ui/Avatar';
import { useAuth } from '@/hooks/useAuth';
import { classesApi, attendanceApi, feedbackApi, usersApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import type { ClassSchedule, Attendance, User, ClassFeedback } from '@/types';

export default function TeacherPage() {
  const { user, isTeacher, isAdmin, logout, teacherLogin } = useAuth();
  const [activeTab, setActiveTab] = useState<'attendance' | 'roster' | 'feedback'>('attendance');
  const [classes, setClasses] = useState<ClassSchedule[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClass, setSelectedClass] = useState<number | ''>('');
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<string>('');
  const [feedback, setFeedback] = useState<ClassFeedback[]>([]);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [classesFilter, setClassesFilter] = useState<number[]>([]);
  const [ratingFilter, setRatingFilter] = useState('all');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoaded, setIsLoaded] = useState(true);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    if (isTeacher || isAdmin) {
      loadInitialData();
    }
  }, [isTeacher, isAdmin]);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedClass && selectedDate) {
      loadAttendance();
    }
  }, [selectedClass, selectedDate]);

  useEffect(() => {
    if (autoRefresh && selectedClass && selectedDate) {
      const interval = setInterval(loadAttendance, 5000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, selectedClass, selectedDate]);

  const loadInitialData = async () => {
    try {
      const [classesData, usersData] = await Promise.all([
        classesApi.list(),
        usersApi.list(),
      ]);
      setClasses(classesData);
      setUsers(usersData);
      if (classesData.length > 0) {
        setSelectedClass(classesData[0].id);
      }
      const teacherList = usersData.filter(u => u.rank === 'Black' || u.rank === 'Brown');
      setTeachers(teacherList);
      if (user) {
        setSelectedTeacher(user.user_uuid);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoaded(true);
    }
  };

  const loadFeedback = async () => {
    if (!user) return;
    try {
      const data = await feedbackApi.getByTeacher(user.user_uuid);
      setFeedback(data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoaded(true);
    }
  };

  const loadAttendance = async () => {
    if (!selectedClass) return;
    try {
      const data = await attendanceApi.getByClass(selectedClass, selectedDate);
      setAttendance(data);
    } catch (error) {
      console.error('Error loading attendance:', error);
    }
  };

  const handleConfirm = async (id: number) => {
    setIsProcessing(true);
    try {
      await attendanceApi.confirm(id);
      loadAttendance();
    } catch (error) {
      console.error('Error confirming:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemove = async (id: number) => {
    setIsProcessing(true);
    try {
      await attendanceApi.cancel(id);
      loadAttendance();
    } catch (error) {
      console.error('Error removing:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkConfirm = async () => {
    if (selectedStudents.length === 0) return;
    setIsProcessing(true);
    try {
      await attendanceApi.bulkConfirm(selectedStudents);
      setSelectedStudents([]);
      loadAttendance();
    } catch (error) {
      console.error('Error bulk confirming:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkRemove = async () => {
    if (selectedStudents.length === 0) return;
    if (!confirm(`Remove ${selectedStudents.length} student(s) from attendance?`)) return;
    setIsProcessing(true);
    try {
      for (const id of selectedStudents) {
        await attendanceApi.cancel(id);
      }
      setSelectedStudents([]);
      loadAttendance();
    } catch (error) {
      console.error('Error bulk removing:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmAllPending = async () => {
    const pending = attendance.filter(a => a.status === 'pending').map(a => a.id);
    if (pending.length === 0) return;
    setSelectedStudents(pending);
    setIsProcessing(true);
    try {
      await attendanceApi.bulkConfirm(pending);
      loadAttendance();
    } catch (error) {
      console.error('Error confirming all:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleStudent = (id: number) => {
    setSelectedStudents(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleAddStudent = async (studentUuid: string) => {
    if (!selectedClass) return;
    setIsProcessing(true);
    try {
      await attendanceApi.direct(studentUuid, selectedClass, undefined, user?.user_uuid);
      loadAttendance();
    } catch (error) {
      console.error('Error adding student:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      await teacherLogin(loginForm.email, loginForm.password);
    } catch (error) {
      setLoginError('Invalid email or password');
    }
  };

  // DEBUG: Commenting out conditional returns to find the error
  /*
  const pendingCount = attendance.filter(a => a.status === 'pending').length;
  const confirmedCount = attendance.filter(a => a.status === 'confirmed').length;

  if (!isLoaded) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (!user || (!isTeacher && !isAdmin)) {
    return (
      <>
        
        <div className="max-w-md mx-auto pt-20">
          <Card>
            <CardHeader>
              <CardTitle>Teacher Login</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <Input
                    type="email"
                    value={loginForm.email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLoginForm({ ...loginForm, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                  <Input
                    type="password"
                    value={loginForm.password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLoginForm({ ...loginForm, password: e.target.value })}
                    required
                  />
                </div>
                {loginError && <p className="text-red-500 text-sm">{loginError}</p>}
                <Button type="submit" className="w-full">Login</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }
  */
  const pendingCount = attendance.filter(a => a.status === 'pending').length;
  const confirmedCount = attendance.filter(a => a.status === 'confirmed').length;

  if (!isLoaded) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (!user || (!isTeacher && !isAdmin)) {
    return (
      <>
        
        <div className="max-w-md mx-auto pt-20">
          <Card>
            <CardHeader>
              <CardTitle>Teacher Login</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <Input
                    type="email"
                    value={loginForm.email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLoginForm({ ...loginForm, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                  <Input
                    type="password"
                    value={loginForm.password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLoginForm({ ...loginForm, password: e.target.value })}
                    required
                  />
                </div>
                {loginError && <p className="text-red-500 text-sm">{loginError}</p>}
                <Button type="submit" className="w-full">Login</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Teacher Dashboard</h1>

      <div className="flex gap-2 mb-6">
        <Button
          variant={activeTab === 'attendance' ? 'primary' : 'outline'}
          onClick={() => setActiveTab('attendance')}
        >
          ✅ Confirm Attendance
        </Button>
        <Button
          variant={activeTab === 'roster' ? 'primary' : 'outline'}
          onClick={() => setActiveTab('roster')}
        >
          📋 Class Roster
        </Button>
        <Button
          variant={activeTab === 'feedback' ? 'primary' : 'outline'}
          onClick={() => { setActiveTab('feedback'); loadFeedback(); }}
        >
          💬 Feedback
        </Button>
      </div>

      {activeTab === 'attendance' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Confirm Attendance</CardTitle>
              <div className="flex gap-4">
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-auto"
                />
                <select
                  className="border rounded-md px-3 py-2"
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(Number(e.target.value))}
                >
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>{cls.class_name}</option>
                  ))}
                </select>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                  />
                  Auto-refresh (5s)
                </label>
                <Button variant="outline" size="sm" onClick={loadAttendance}>
                  🔄 Refresh
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{attendance.length}</p>
                <p className="text-slate-500 dark:text-slate-400">Total Students</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{pendingCount}</p>
                <p className="text-yellow-600 dark:text-yellow-400">⏳ Pending</p>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{confirmedCount}</p>
                <p className="text-green-600 dark:text-green-400">✅ Confirmed</p>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              {attendance.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-800 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {att.status === 'pending' && (
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(att.id)}
                        onChange={() => toggleStudent(att.id)}
                      />
                    )}
                    <Avatar
                      src={att.user?.profile_image_url}
                      firstName={att.user?.first_name}
                      lastName={att.user?.last_name}
                    />
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {att.user?.first_name} {att.user?.last_name}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Checked in: {new Date(att.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={att.status === 'confirmed' ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}>
                      {att.status === 'confirmed' ? '✅ Confirmed' : '⏳ Pending'}
                    </span>
                    {att.status === 'pending' && (
                      <>
                        <Button size="sm" onClick={() => handleConfirm(att.id)} disabled={isProcessing}>
                          ✓ Confirm
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleRemove(att.id)} disabled={isProcessing}>
                          ✕ Remove
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {selectedStudents.length > 0 && (
              <div className="flex gap-2 mb-4">
                <Button onClick={handleBulkConfirm} disabled={isProcessing}>
                  ✅ Confirm Selected ({selectedStudents.length})
                </Button>
                <Button variant="outline" onClick={handleBulkRemove} disabled={isProcessing}>
                  🗑️ Remove Selected ({selectedStudents.length})
                </Button>
              </div>
            )}

            {pendingCount > 0 && (
              <Button onClick={handleConfirmAllPending} disabled={isProcessing} className="w-full">
                ✅ CONFIRM ALL PENDING ({pendingCount})
              </Button>
            )}

            <div className="mt-4 border-t pt-4">
              <details>
                <summary className="cursor-pointer font-medium">+ Add Student Manually</summary>
                <div className="mt-2 p-3 bg-slate-50 rounded-lg">
                  <select
                    className="w-full border rounded-md p-2"
                    onChange={(e) => {
                      if (e.target.value) handleAddStudent(e.target.value);
                    }}
                    defaultValue=""
                  >
                    <option value="">Select a student...</option>
                    {users.map((u) => (
                      <option key={u.user_uuid} value={u.user_uuid}>
                        {u.first_name} {u.last_name}
                      </option>
                    ))}
                  </select>
                </div>
              </details>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'roster' && (
        <Card>
          <CardHeader>
            <CardTitle>Class Roster</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-4">
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-auto"
              />
              <select
                className="border rounded-md px-3 py-2"
                value={selectedClass}
                onChange={(e) => setSelectedClass(Number(e.target.value))}
              >
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>{cls.class_name}</option>
                ))}
              </select>
              <select
                className="border rounded-md px-3 py-2"
                value={selectedTeacher}
                onChange={(e) => setSelectedTeacher(e.target.value)}
              >
                <option value="">Select Teacher...</option>
                {teachers.map((t) => (
                  <option key={t.user_uuid} value={t.user_uuid}>
                    {t.first_name} {t.last_name} ({t.rank})
                  </option>
                ))}
              </select>
              <Button
                onClick={() => {
                  if (selectedTeacher) {
                    alert(`Teacher assigned for ${classes.find(c => c.id === selectedClass)?.class_name} on ${selectedDate}`);
                  }
                }}
                disabled={!selectedTeacher}
              >
                💾 Assign Teacher
              </Button>
            </div>

            <div className="border dark:border-slate-700 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-100 dark:bg-slate-800">
                  <tr>
                    <th className="text-left p-3 text-slate-700 dark:text-slate-300">Name</th>
                    <th className="text-left p-3 text-slate-700 dark:text-slate-300">Rank</th>
                    <th className="text-left p-3 text-slate-700 dark:text-slate-300">Check-in Time</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.map((att) => (
                    <tr key={att.id} className="border-t dark:border-slate-700">
                      <td className="p-3 text-slate-900 dark:text-white">
                        {att.user?.first_name} {att.user?.last_name}
                      </td>
                      <td className="p-3 text-slate-700 dark:text-slate-300">{att.user?.rank || '-'}</td>
                      <td className="p-3 text-slate-700 dark:text-slate-300">
                        {new Date(att.created_at).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-slate-500 dark:text-slate-400">Total Attendees: {attendance.length}</p>
          </CardContent>
        </Card>
      )}

      {activeTab === 'feedback' && (
        <Card>
          <CardHeader>
            <CardTitle>Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <details className="mb-4">
              <summary className="cursor-pointer font-medium mb-2 text-slate-700 dark:text-slate-300">🔽 Filters</summary>
              <div className="flex gap-4 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg flex-wrap">
                <div>
                  <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">Start Date</label>
                  <Input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    className="w-auto"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">End Date</label>
                  <Input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    className="w-auto"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">Rating</label>
                  <select
                    className="border dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-md px-3 py-2"
                    value={ratingFilter}
                    onChange={(e) => setRatingFilter(e.target.value)}
                  >
                    <option value="all">All Ratings</option>
                    <option value="positive">Positive</option>
                    <option value="negative">Negative</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">Classes</label>
                  <select
                    className="border dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-md px-3 py-2 min-w-[150px]"
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'all') {
                        setClassesFilter([]);
                      } else {
                        setClassesFilter([Number(val)]);
                      }
                    }}
                    value={classesFilter.length === 0 ? 'all' : classesFilter[0]}
                  >
                    <option value="all">All Classes</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>{cls.class_name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </details>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <p className="text-xl font-bold text-slate-900 dark:text-white">{feedback.length}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Total Feedback</p>
              </div>
              <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-xl font-bold text-green-600 dark:text-green-400">
                  {feedback.filter(f => f.rating === 'thumbs_up').length}
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">👍 Positive</p>
              </div>
              <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <p className="text-xl font-bold text-red-600 dark:text-red-400">
                  {feedback.filter(f => f.rating === 'thumbs_down').length}
                </p>
                <p className="text-sm text-red-600 dark:text-red-400">👎 Negative</p>
              </div>
            </div>

            <div className="border dark:border-slate-700 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-100 dark:bg-slate-800">
                  <tr>
                    <th className="text-left p-3 text-slate-700 dark:text-slate-300">Date</th>
                    <th className="text-left p-3 text-slate-700 dark:text-slate-300">Class</th>
                    <th className="text-left p-3 text-slate-700 dark:text-slate-300">Lesson</th>
                    <th className="text-left p-3 text-slate-700 dark:text-slate-300">Rating</th>
                    <th className="text-left p-3 text-slate-700 dark:text-slate-300">Comment</th>
                  </tr>
                </thead>
                <tbody>
                  {feedback
                    .filter(f => {
                      if (ratingFilter === 'positive' && f.rating !== 'thumbs_up') return false;
                      if (ratingFilter === 'negative' && f.rating !== 'thumbs_down') return false;
                      if (dateRange.start && f.created_at < dateRange.start) return false;
                      if (dateRange.end && f.created_at > dateRange.end + 'T23:59:59') return false;
                      return true;
                    })
                    .map((fb) => (
                      <tr key={fb.id} className="border-t dark:border-slate-700">
                        <td className="p-3 text-sm text-slate-700 dark:text-slate-300">{formatDate(fb.created_at)}</td>
                        <td className="p-3 text-sm text-slate-700 dark:text-slate-300">Class #{fb.class_instance_id || '-'}</td>
                        <td className="p-3 text-sm text-slate-700 dark:text-slate-300">-</td>
                        <td className="p-3">
                          <span className={fb.rating === 'thumbs_up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                            {fb.rating === 'thumbs_up' ? '👍' : '👎'}
                          </span>
                        </td>
                        <td className="p-3 text-sm text-slate-700 dark:text-slate-300">{fb.comment || '-'}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
    </>
  );
}
