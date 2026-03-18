'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  const { user, isTeacher, isAdmin, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'attendance' | 'roster' | 'feedback'>('attendance');
  const [classes, setClasses] = useState<ClassSchedule[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClass, setSelectedClass] = useState<number | ''>('');
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [feedback, setFeedback] = useState<ClassFeedback[]>([]);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [ratingFilter, setRatingFilter] = useState('all');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isTeacher || isAdmin) {
      loadInitialData();
    }
  }, [isTeacher, isAdmin]);

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
    } catch (error) {
      console.error('Error loading data:', error);
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

  const loadFeedback = async () => {
    try {
      const data = await feedbackApi.getByTeacher(user!.user_uuid);
      setFeedback(data);
    } catch (error) {
      console.error('Error loading feedback:', error);
    }
  };

  const pendingCount = attendance.filter(a => a.status === 'pending').length;
  const confirmedCount = attendance.filter(a => a.status === 'confirmed').length;

  if (isLoading || !user) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (!isTeacher && !isAdmin) {
    return (
      <div className="p-8 text-center">
        <p>You do not have permission to access this page.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Teacher Dashboard</h1>

      <div className="flex gap-2 mb-6">
        <Button
          variant={activeTab === 'attendance' ? 'default' : 'outline'}
          onClick={() => setActiveTab('attendance')}
        >
          ✅ Confirm Attendance
        </Button>
        <Button
          variant={activeTab === 'roster' ? 'default' : 'outline'}
          onClick={() => setActiveTab('roster')}
        >
          📋 Class Roster
        </Button>
        <Button
          variant={activeTab === 'feedback' ? 'default' : 'outline'}
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
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <p className="text-2xl font-bold">{attendance.length}</p>
                <p className="text-slate-500">Total Students</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
                <p className="text-yellow-600">⏳ Pending</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{confirmedCount}</p>
                <p className="text-green-600">✅ Confirmed</p>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              {attendance.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
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
                      <p className="font-medium">
                        {att.user?.first_name} {att.user?.last_name}
                      </p>
                      <p className="text-sm text-slate-500">
                        Checked in: {new Date(att.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={att.status === 'confirmed' ? 'text-green-600' : 'text-yellow-600'}>
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
            </div>

            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left p-3">Name</th>
                    <th className="text-left p-3">Rank</th>
                    <th className="text-left p-3">Check-in Time</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.map((att) => (
                    <tr key={att.id} className="border-t">
                      <td className="p-3">
                        {att.user?.first_name} {att.user?.last_name}
                      </td>
                      <td className="p-3">{att.user?.rank || '-'}</td>
                      <td className="p-3">
                        {new Date(att.created_at).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-slate-500">Total Attendees: {attendance.length}</p>
          </CardContent>
        </Card>
      )}

      {activeTab === 'feedback' && (
        <Card>
          <CardHeader>
            <CardTitle>Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-4">
              <Input
                type="date"
                placeholder="Start Date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="w-auto"
              />
              <Input
                type="date"
                placeholder="End Date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="w-auto"
              />
              <select
                className="border rounded-md px-3 py-2"
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value)}
              >
                <option value="all">All Ratings</option>
                <option value="positive">Positive</option>
                <option value="negative">Negative</option>
              </select>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <p className="text-xl font-bold">{feedback.length}</p>
                <p className="text-sm text-slate-500">Total Feedback</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-xl font-bold text-green-600">
                  {feedback.filter(f => f.rating === 'thumbs_up').length}
                </p>
                <p className="text-sm text-green-600">👍 Positive</p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <p className="text-xl font-bold text-red-600">
                  {feedback.filter(f => f.rating === 'thumbs_down').length}
                </p>
                <p className="text-sm text-red-600">👎 Negative</p>
              </div>
            </div>

            <div className="space-y-2">
              {feedback.map((fb) => (
                <div key={fb.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span>{fb.rating === 'thumbs_up' ? '👍' : '👎'}</span>
                      <span className="text-sm text-slate-500">{formatDate(fb.created_at)}</span>
                    </div>
                  </div>
                  {fb.comment && <p className="mt-2 text-sm">{fb.comment}</p>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
