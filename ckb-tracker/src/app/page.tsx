'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { RankBadge } from '@/components/ui/Badge';
import { usersApi, classesApi, attendanceApi } from '@/lib/api';
import { cn, formatDate, debounce } from '@/lib/utils';
import type { User, ClassSchedule, Attendance } from '@/types';

export default function AttendancePage() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [classes, setClasses] = useState<ClassSchedule[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<Attendance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionTimeLeft, setSessionTimeLeft] = useState(120);
  const [showNewMemberForm, setShowNewMemberForm] = useState(false);
  const [newMember, setNewMember] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirm_password: '',
    nicknames: '',
    rank: 'White',
    comments: '',
  });

  useEffect(() => {
    classesApi.list().then(setClasses).catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedUser) {
      const fetchTodayAttendance = async () => {
        try {
          const today = new Date().toISOString().split('T')[0];
          const attendance = await attendanceApi.getByUser(selectedUser.user_uuid);
          setTodayAttendance(attendance.filter(a => a.attendance_date === today));
        } catch (error) {
          console.error('Error fetching attendance:', error);
        }
      };
      fetchTodayAttendance();
    }
  }, [selectedUser]);

  useEffect(() => {
    if (selectedUser && sessionTimeLeft > 0) {
      const timer = setInterval(() => {
        setSessionTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [selectedUser, sessionTimeLeft]);

  const handleSearch = useCallback(
    debounce(async (query: string) => {
      if (query.length < 2) {
        setSearchResults([]);
        return;
      }
      try {
        const results = await usersApi.search(query);
        setSearchResults(results);
      } catch (error) {
        console.error('Search error:', error);
      }
    }, 300),
    []
  );

  useEffect(() => {
    handleSearch(searchQuery);
  }, [searchQuery, handleSearch]);

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setSearchQuery('');
    setSearchResults([]);
    setSessionTimeLeft(120);
  };

  const handleCheckIn = async (classId: number) => {
    if (!selectedUser) return;
    setIsLoading(true);
    try {
      await attendanceApi.checkIn(selectedUser.user_uuid, classId);
      const today = new Date().toISOString().split('T')[0];
      const attendance = await attendanceApi.getByUser(selectedUser.user_uuid);
      setTodayAttendance(attendance.filter(a => a.attendance_date === today));
    } catch (error) {
      console.error('Check-in error:', error);
      alert('Failed to check in. You may already be checked in for this class.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelCheckIn = async (attendanceId: number) => {
    setIsLoading(true);
    try {
      await attendanceApi.cancel(attendanceId);
      const today = new Date().toISOString().split('T')[0];
      const attendance = await attendanceApi.getByUser(selectedUser!.user_uuid);
      setTodayAttendance(attendance.filter(a => a.attendance_date === today));
    } catch (error) {
      console.error('Cancel error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartOver = () => {
    if (confirm('Are you sure you want to start over?')) {
      setSelectedUser(null);
      setSessionTimeLeft(120);
      setTodayAttendance([]);
    }
  };

  const handleCreateMember = async () => {
    if (newMember.password !== newMember.confirm_password) {
      alert('Passwords do not match');
      return;
    }
    setIsLoading(true);
    try {
      const user = await usersApi.create({
        first_name: newMember.first_name,
        last_name: newMember.last_name,
        email: newMember.email,
        password_hash: newMember.password,
        nicknames: newMember.nicknames,
        rank: newMember.rank as User['rank'],
        comments: newMember.comments,
      });
      setSelectedUser(user);
      setShowNewMemberForm(false);
      setNewMember({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        confirm_password: '',
        nicknames: '',
        rank: 'White',
        comments: '',
      });
    } catch (error) {
      console.error('Create member error:', error);
      alert('Failed to create member');
    } finally {
      setIsLoading(false);
    }
  };

  const getAttendanceStatus = (classId: number): { status: string; attendance?: Attendance } => {
    const attendance = todayAttendance.find(a => a.class_id === classId);
    if (!attendance) return { status: 'not_checked_in' };
    return { status: attendance.status, attendance };
  };

  const formatTimeLeft = () => {
    const minutes = Math.floor(sessionTimeLeft / 60);
    const seconds = sessionTimeLeft % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={cn('min-h-screen', theme === 'dark' && 'dark')}>
      <div className="flex justify-end mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        >
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </Button>
      </div>

      {!selectedUser ? (
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Welcome to CKB Tracker</CardTitle>
              <p className="text-slate-600">{formatDate(new Date())}</p>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <Input
                  placeholder="Search for yourself... (minimum 2 characters)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="text-lg"
                />
              </div>

              {searchResults.length > 0 && (
                <div className="space-y-2 mb-6">
                  {searchResults.map((user) => (
                    <div
                      key={user.user_uuid}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer"
                      onClick={() => handleSelectUser(user)}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={user.profile_image_url}
                          firstName={user.first_name}
                          lastName={user.last_name}
                          size="lg"
                        />
                        <div>
                          <p className="font-medium">
                            {user.first_name} {user.last_name}
                            {user.nicknames && ` (${user.nicknames})`}
                          </p>
                          <p className="text-sm text-slate-500">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <RankBadge rank={user.rank} />
                        <Button size="sm">Select</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowNewMemberForm(!showNewMemberForm)}
              >
                {showNewMemberForm ? 'Cancel' : '+ Add New Member'}
              </Button>

              {showNewMemberForm && (
                <div className="mt-4 p-4 bg-slate-50 rounded-lg space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="First Name"
                      value={newMember.first_name}
                      onChange={(e) => setNewMember({ ...newMember, first_name: e.target.value })}
                    />
                    <Input
                      label="Last Name"
                      value={newMember.last_name}
                      onChange={(e) => setNewMember({ ...newMember, last_name: e.target.value })}
                    />
                  </div>
                  <Input
                    label="Email"
                    type="email"
                    value={newMember.email}
                    onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                  />
                  <Input
                    label="Password"
                    type="password"
                    value={newMember.password}
                    onChange={(e) => setNewMember({ ...newMember, password: e.target.value })}
                  />
                  <Input
                    label="Confirm Password"
                    type="password"
                    value={newMember.confirm_password}
                    onChange={(e) => setNewMember({ ...newMember, confirm_password: e.target.value })}
                  />
                  <Input
                    label="Nicknames"
                    value={newMember.nicknames}
                    onChange={(e) => setNewMember({ ...newMember, nicknames: e.target.value })}
                    placeholder="Optional"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Rank</label>
                      <select
                        className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2"
                        value={newMember.rank}
                        onChange={(e) => setNewMember({ ...newMember, rank: e.target.value })}
                      >
                        <option value="White">White</option>
                        <option value="Blue">Blue</option>
                        <option value="Purple">Purple</option>
                        <option value="Brown">Brown</option>
                        <option value="Black">Black</option>
                      </select>
                    </div>
                  </div>
                  <Input
                    label="Comments"
                    value={newMember.comments}
                    onChange={(e) => setNewMember({ ...newMember, comments: e.target.value })}
                    placeholder="Optional"
                  />
                  <Button className="w-full" onClick={handleCreateMember} disabled={isLoading}>
                    {isLoading ? 'Creating...' : 'Create Member'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto">
          <Card className="mb-6">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar
                    src={selectedUser.profile_image_url}
                    firstName={selectedUser.first_name}
                    lastName={selectedUser.last_name}
                    size="xl"
                  />
                  <div>
                    <h2 className="text-xl font-bold">
                      {selectedUser.first_name} {selectedUser.last_name}
                      {selectedUser.nicknames && ` (${selectedUser.nicknames})`}
                    </h2>
                    <p className="text-slate-500">{selectedUser.email}</p>
                    <RankBadge rank={selectedUser.rank} />
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500">Session Time</p>
                  <p className={cn('text-2xl font-bold', sessionTimeLeft < 30 && 'text-red-500')}>
                    {formatTimeLeft()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Today&apos;s Classes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {classes.map((cls) => {
                  const { status, attendance } = getAttendanceStatus(cls.id);
                  
                  return (
                    <div
                      key={cls.id}
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{cls.class_name}</p>
                        <p className="text-sm text-slate-500">
                          {cls.day} {cls.time} • {cls.points} pts
                        </p>
                      </div>
                      <div>
                        {status === 'not_checked_in' && (
                          <Button
                            onClick={() => handleCheckIn(cls.id)}
                            disabled={isLoading}
                          >
                            ✅ Check In
                          </Button>
                        )}
                        {status === 'pending' && (
                          <div className="flex items-center gap-2">
                            <span className="text-yellow-600">⏳ Pending</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancelCheckIn(attendance!.id)}
                            >
                              🗑️ Cancel
                            </Button>
                          </div>
                        )}
                        {status === 'confirmed' && (
                          <span className="text-green-600 font-medium">✅ Confirmed</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {classes.length === 0 && (
                <p className="text-center text-slate-500 py-8">No classes scheduled</p>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-4 mt-6">
            <Button className="flex-1" variant="outline" onClick={handleStartOver}>
              🔄 Start Over - New Student
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
