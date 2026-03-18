'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, RankBadge } from '@/components/ui/Badge';
import { useAuth } from '@/hooks/useAuth';
import { dashboardApi, feedbackApi, attendanceApi } from '@/lib/api';
import { formatDate, getDaysAgo } from '@/lib/utils';
import type { DashboardStats, AttendanceTrend, ClassFeedback, Attendance } from '@/types';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function PortalPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'analytics' | 'feedback'>('analytics');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [attendanceTrend, setAttendanceTrend] = useState<AttendanceTrend[]>([]);
  const [recentAttendance, setRecentAttendance] = useState<Attendance[]>([]);
  const [feedbackHistory, setFeedbackHistory] = useState<ClassFeedback[]>([]);
  const [pendingFeedback, setPendingFeedback] = useState<{ attendance: Attendance; className: string }[]>([]);
  const [feedbackForm, setFeedbackForm] = useState<{ rating: string; comment: string }>({ rating: '', comment: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    try {
      const [statsData, trendData, attendanceData, feedbackData] = await Promise.all([
        dashboardApi.getStats(user.user_uuid),
        dashboardApi.getAttendanceTrend(user.user_uuid, 90),
        attendanceApi.getByUser(user.user_uuid),
        feedbackApi.getByUser(user.user_uuid),
      ]);
      setStats(statsData);
      setAttendanceTrend(trendData);
      setRecentAttendance(attendanceData.slice(0, 20));
      setFeedbackHistory(feedbackData);

      const pending = attendanceData
        .filter(a => {
          const classDate = new Date(a.attendance_date);
          const now = new Date();
          const daysDiff = Math.floor((now.getTime() - classDate.getTime()) / (1000 * 60 * 60 * 24));
          const hasFeedback = feedbackData.some(f => f.attendance_id === a.id);
          return daysDiff <= 7 && !hasFeedback;
        })
        .map(a => ({ attendance: a, className: a.class_schedule?.class_name || 'Class' }));
      setPendingFeedback(pending);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleSubmitFeedback = async (attendanceId: number) => {
    if (!feedbackForm.rating) return;
    setIsSubmitting(true);
    try {
      await feedbackApi.submit(attendanceId, feedbackForm.rating, feedbackForm.comment);
      setFeedbackForm({ rating: '', comment: '' });
      loadData();
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !user) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  const chartData = {
    labels: attendanceTrend.slice(-14).map(t => t.date),
    datasets: [
      {
        label: 'Classes',
        data: attendanceTrend.slice(-14).map(t => t.count),
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 1 } },
    },
  };

  return (
    <div className="max-w-6xl mx-auto">
      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Welcome, {user.first_name}!</h1>
              <p className="text-slate-500">{user.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <RankBadge rank={user.rank} />
                {user.nicknames && <Badge>{user.nicknames}</Badge>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2 mb-6">
        <Button
          variant={activeTab === 'analytics' ? 'default' : 'outline'}
          onClick={() => setActiveTab('analytics')}
        >
          📊 My Analytics
        </Button>
        <Button
          variant={activeTab === 'feedback' ? 'default' : 'outline'}
          onClick={() => setActiveTab('feedback')}
        >
          💬 Submit Feedback
        </Button>
      </div>

      {activeTab === 'analytics' && (
        <>
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="py-4 text-center">
                <p className="text-3xl font-bold">{stats?.totalClasses || 0}</p>
                <p className="text-slate-500">Total Classes</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4 text-center">
                <p className="text-3xl font-bold">{stats?.totalPoints || 0}</p>
                <p className="text-slate-500">Total Points</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4 text-center">
                <p className="text-3xl font-bold">{stats?.classesThisMonth || 0}</p>
                <p className="text-slate-500">This Month</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4 text-center">
                <p className="text-3xl font-bold">
                  {stats && stats.lastClassDaysAgo !== null ? `${stats.lastClassDaysAgo}d ago` : 'N/A'}
                </p>
                <p className="text-slate-500">Last Class</p>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Attendance Trend (Last 14 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <Bar data={chartData} options={chartOptions} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Attendance History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Date</th>
                      <th className="text-left py-2">Class</th>
                      <th className="text-left py-2">Points</th>
                      <th className="text-left py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentAttendance.map((att) => (
                      <tr key={att.id} className="border-b">
                        <td className="py-2">{formatDate(att.attendance_date)}</td>
                        <td className="py-2">{att.class_schedule?.class_name || 'Class'}</td>
                        <td className="py-2">{att.class_schedule?.points || 0}</td>
                        <td className="py-2">
                          <span className={att.status === 'confirmed' ? 'text-green-600' : 'text-yellow-600'}>
                            {att.status === 'confirmed' ? '✅' : '⏳'} {att.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {activeTab === 'feedback' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Submit Feedback</CardTitle>
              <p className="text-sm text-slate-500">Feedback must be submitted within 7 days of attending</p>
            </CardHeader>
            <CardContent>
              {pendingFeedback.length === 0 ? (
                <p className="text-slate-500 text-center py-4">No classes awaiting feedback</p>
              ) : (
                <div className="space-y-4">
                  {pendingFeedback.map(({ attendance, className }) => (
                    <div key={attendance.id} className="border rounded-lg p-4">
                      <p className="font-medium">{className}</p>
                      <p className="text-sm text-slate-500">{formatDate(attendance.attendance_date)}</p>
                      <div className="mt-3 space-y-3">
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`rating-${attendance.id}`}
                              checked={feedbackForm.rating === 'thumbs_up'}
                              onChange={() => setFeedbackForm({ ...feedbackForm, rating: 'thumbs_up' })}
                            />
                            👍 Thumbs Up
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`rating-${attendance.id}`}
                              checked={feedbackForm.rating === 'thumbs_down'}
                              onChange={() => setFeedbackForm({ ...feedbackForm, rating: 'thumbs_down' })}
                            />
                            👎 Thumbs Down
                          </label>
                        </div>
                        <textarea
                          className="w-full border rounded-md p-2 text-sm"
                          placeholder="Optional comment..."
                          value={feedbackForm.comment}
                          onChange={(e) => setFeedbackForm({ ...feedbackForm, comment: e.target.value })}
                          rows={2}
                        />
                        <Button
                          size="sm"
                          onClick={() => handleSubmitFeedback(attendance.id)}
                          disabled={!feedbackForm.rating || isSubmitting}
                        >
                          Submit
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Submitted Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              {feedbackHistory.length === 0 ? (
                <p className="text-slate-500 text-center py-4">No feedback submitted yet</p>
              ) : (
                <div className="space-y-3">
                  {feedbackHistory.map((fb) => (
                    <div key={fb.id} className="border rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <span>{fb.rating === 'thumbs_up' ? '👍' : '👎'}</span>
                        <span className="text-sm text-slate-500">{formatDate(fb.created_at)}</span>
                      </div>
                      {fb.comment && <p className="mt-2">{fb.comment}</p>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
