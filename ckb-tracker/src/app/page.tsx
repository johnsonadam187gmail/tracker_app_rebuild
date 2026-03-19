'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { RankBadge } from '@/components/ui/Badge';
import { usersApi, classesApi, attendanceApi } from '@/lib/api';
import { cn, formatDate, debounce } from '@/lib/utils';
import type { User, ClassSchedule, Attendance } from '@/types';
import { Camera, Upload, Trash2, Sun, Moon, Check, UserPlus, Plus } from 'lucide-react';

export default function AttendancePage() {
  const pathname = usePathname();
  const router = useRouter();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [classes, setClasses] = useState<ClassSchedule[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<Attendance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionTimeLeft, setSessionTimeLeft] = useState(120);
  const [showNewMemberForm, setShowNewMemberForm] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [photoMethod, setPhotoMethod] = useState<'upload' | 'camera'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
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

  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

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
    setShowCompleteConfirm(false);
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
      stopCamera();
      setSelectedUser(null);
      setSessionTimeLeft(120);
      setTodayAttendance([]);
      setShowCompleteConfirm(false);
      setShowPhotoUpload(false);
    }
  };

  const handleComplete = () => {
    setShowCompleteConfirm(true);
  };

  const confirmComplete = () => {
    stopCamera();
    setSelectedUser(null);
    setSessionTimeLeft(120);
    setTodayAttendance([]);
    setShowCompleteConfirm(false);
    setShowPhotoUpload(false);
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

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Camera access error:', error);
      alert('Could not access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current || !selectedUser) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      canvas.toBlob(async (blob) => {
        if (blob && selectedUser) {
          const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
          await uploadPhoto(file);
        }
      }, 'image/jpeg', 0.8);
    }
    stopCamera();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedUser) {
      await uploadPhoto(file);
    }
  };

  const uploadPhoto = async (file: File) => {
    if (!selectedUser) return;
    setIsUploadingPhoto(true);
    try {
      const updatedUser = await usersApi.uploadPhoto(selectedUser.user_uuid, file);
      setSelectedUser({ ...selectedUser, profile_image_url: updatedUser.profile_image_url });
    } catch (error) {
      console.error('Photo upload error:', error);
      alert('Failed to upload photo');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleDeletePhoto = async () => {
    if (!selectedUser) return;
    if (!confirm('Delete profile photo?')) return;
    setIsLoading(true);
    try {
      await usersApi.deletePhoto(selectedUser.user_uuid);
      setSelectedUser({ ...selectedUser, profile_image_url: undefined });
    } catch (error) {
      console.error('Delete photo error:', error);
      alert('Failed to delete photo');
    } finally {
      setIsLoading(false);
    }
  };

  const getAttendanceStatus = (classId: number): { status: string; attendance?: Attendance } => {
    const attendance = todayAttendance.find(a => a.class_id === classId);
    if (!attendance) return { status: 'not_checked_in' };
    return { status: attendance.status, attendance };
  };

  const hasCheckedIn = todayAttendance.length > 0;

  const formatTimeLeft = () => {
    const minutes = Math.floor(sessionTimeLeft / 60);
    const seconds = sessionTimeLeft % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const navItems = [
    { href: '/', label: 'Check In', icon: Check },
    { href: '/portal', label: 'Student Portal', icon: UserPlus },
    { href: '/teacher', label: 'Teacher', icon: UserPlus },
    { href: '/admin', label: 'Admin', icon: UserPlus },
  ];

  return (
    <div className={cn('min-h-screen bg-slate-50 dark:bg-slate-950', theme === 'dark' && 'dark')}>
      {/* Top Navigation Bar */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-1">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white mr-8">CKB Tracker</h1>
              <nav className="flex gap-1">
                {navItems.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <div className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                      pathname === item.href 
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" 
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    )}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                  </Link>
                ))}
              </nav>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-6">
        {/* New Member Form (collapsible) */}
        {showNewMemberForm && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Add New Member</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowNewMemberForm(false)}>
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent>
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
                  label="Nicknames (optional)"
                  value={newMember.nicknames}
                  onChange={(e) => setNewMember({ ...newMember, nicknames: e.target.value })}
                />
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Rank</label>
                  <select
                    className="flex h-10 w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2"
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
                <Input
                  label="Comments (optional)"
                  value={newMember.comments}
                  onChange={(e) => setNewMember({ ...newMember, comments: e.target.value })}
                />
              </div>
              <Button className="mt-4 w-full" onClick={handleCreateMember} disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create Member'}
              </Button>
            </CardContent>
          </Card>
        )}

        {!selectedUser ? (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Welcome to CKB Tracker</CardTitle>
                <p className="text-slate-600 dark:text-slate-400">{formatDate(new Date())}</p>
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
                  <div className="space-y-2">
                    {searchResults.map((user) => (
                      <div
                        key={user.user_uuid}
                        className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
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
                            <p className="font-medium text-slate-900 dark:text-white">
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
              </CardContent>
            </Card>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowNewMemberForm(!showNewMemberForm)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Member
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Complete Confirmation */}
            {showCompleteConfirm && (
              <Card className="border-2 border-green-500 bg-green-50 dark:bg-green-900/20">
                <CardContent className="py-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                    <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                    Complete Session?
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    You have checked into {todayAttendance.length} class(es) today.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Button variant="outline" onClick={() => setShowCompleteConfirm(false)}>
                      Go Back
                    </Button>
                    <Button onClick={confirmComplete}>
                      Complete - Done
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Student Info Header */}
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Avatar
                        src={selectedUser.profile_image_url}
                        firstName={selectedUser.first_name}
                        lastName={selectedUser.last_name}
                        size="xl"
                      />
                      <button
                        onClick={() => setShowPhotoUpload(!showPhotoUpload)}
                        className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600"
                      >
                        <Camera className="w-4 h-4" />
                      </button>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                        {selectedUser.first_name} {selectedUser.last_name}
                        {selectedUser.nicknames && ` (${selectedUser.nicknames})`}
                      </h2>
                      <p className="text-slate-500">{selectedUser.email}</p>
                      <RankBadge rank={selectedUser.rank} />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Session Time</p>
                    <p className={cn('text-3xl font-bold', sessionTimeLeft < 30 && 'text-red-500')}>
                      {formatTimeLeft()}
                    </p>
                  </div>
                </div>

                {/* Photo Upload Panel */}
                {showPhotoUpload && (
                  <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="flex gap-2 mb-3">
                      <Button
                        variant={photoMethod === 'upload' ? 'default' : 'outline'}
                        size="sm"
                        className="flex-1"
                        onClick={() => { setPhotoMethod('upload'); stopCamera(); }}
                      >
                        <Upload className="w-4 h-4 mr-1" /> Upload
                      </Button>
                      <Button
                        variant={photoMethod === 'camera' ? 'default' : 'outline'}
                        size="sm"
                        className="flex-1"
                        onClick={() => { setPhotoMethod('camera'); startCamera(); }}
                      >
                        <Camera className="w-4 h-4 mr-1" /> Camera
                      </Button>
                    </div>

                    {photoMethod === 'upload' ? (
                      <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    ) : cameraStream ? (
                      <div className="space-y-2">
                        <video ref={videoRef} autoPlay playsInline muted className="w-full max-w-sm mx-auto rounded" />
                        <div className="flex gap-2 justify-center">
                          <Button size="sm" onClick={capturePhoto} disabled={isUploadingPhoto}>Capture</Button>
                          <Button variant="outline" size="sm" onClick={stopCamera}>Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500 text-center">Click Camera to start</p>
                    )}

                    <div className="flex gap-2 mt-3 justify-center">
                      {photoMethod === 'upload' && (
                        <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploadingPhoto}>
                          Choose Photo
                        </Button>
                      )}
                      {selectedUser.profile_image_url && (
                        <Button variant="ghost" size="sm" onClick={handleDeletePhoto} className="text-red-500">
                          <Trash2 className="w-4 h-4 mr-1" /> Delete
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Classes */}
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
                        className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">{cls.class_name}</p>
                          <p className="text-sm text-slate-500">
                            {cls.day} {cls.time} • {cls.points} pts
                          </p>
                        </div>
                        <div>
                          {status === 'not_checked_in' && (
                            <Button onClick={() => handleCheckIn(cls.id)} disabled={isLoading}>
                              ✅ Check In
                            </Button>
                          )}
                          {status === 'pending' && (
                            <div className="flex items-center gap-2">
                              <span className="text-yellow-600">⏳ Pending</span>
                              <Button variant="outline" size="sm" onClick={() => handleCancelCheckIn(attendance!.id)}>
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

            {/* Actions */}
            <div className="flex gap-4">
              {hasCheckedIn && (
                <Button className="flex-1" onClick={handleComplete}>
                  ✅ Complete - Done
                </Button>
              )}
              <Button className={hasCheckedIn ? 'flex-1' : 'w-full'} variant="outline" onClick={handleStartOver}>
                🔄 Start Over - New Student
              </Button>
            </div>
          </div>
        )}
      </main>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
