'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { RankBadge } from '@/components/ui/Badge';
import { usersApi, classesApi, attendanceApi } from '@/lib/api';
import { cn, formatDate, debounce } from '@/lib/utils';
import type { User, ClassSchedule, Attendance } from '@/types';
import { 
  Camera, 
  Upload, 
  Trash2, 
  CheckCircle2, 
  Clock,
  UserPlus,
  Plus,
  Search,
  X,
  ChevronRight,
  AlertCircle,
  Check,
  Calendar
} from 'lucide-react';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIME_SLOTS = ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'];

export default function AttendancePage() {
  const router = useRouter();
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
    if (confirm('Start over with a new student?')) {
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

  const classesByDayAndTime = useMemo(() => {
    const map: Record<string, Record<string, ClassSchedule[]>> = {};
    DAYS_OF_WEEK.forEach(day => {
      map[day] = {};
      TIME_SLOTS.forEach(slot => {
        map[day][slot] = [];
      });
    });
    classes.forEach(cls => {
      if (map[cls.day] && map[cls.day][cls.time]) {
        map[cls.day][cls.time].push(cls);
      }
    });
    return map;
  }, [classes]);

  const today = DAYS_OF_WEEK[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
  const [selectedClass, setSelectedClass] = useState<ClassSchedule | null>(null);
  const [showCheckInConfirm, setShowCheckInConfirm] = useState(false);

  const handleClassClick = (cls: ClassSchedule) => {
    const { status, attendance } = getAttendanceStatus(cls.id);
    if (status === 'not_checked_in') {
      setSelectedClass(cls);
      setShowCheckInConfirm(true);
    } else if (status === 'pending' && attendance) {
      if (confirm('Cancel this check-in?')) {
        handleCancelCheckIn(attendance.id);
      }
    }
  };

  const confirmCheckIn = async () => {
    if (!selectedClass) return;
    await handleCheckIn(selectedClass.id);
    setSelectedClass(null);
    setShowCheckInConfirm(false);
  };

  const formatTimeLeft = () => {
    const minutes = Math.floor(sessionTimeLeft / 60);
    const seconds = sessionTimeLeft % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {showCompleteConfirm && (
        <Card className="border-2 border-emerald-500/50 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-900/20 dark:to-slate-900">
          <CardContent className="py-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center ring-4 ring-emerald-500/20">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              Complete Check-In Session?
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              You have checked into {todayAttendance.length} class{todayAttendance.length !== 1 ? 'es' : ''} today.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => setShowCompleteConfirm(false)}>
                Go Back
              </Button>
              <Button variant="success" onClick={confirmComplete}>
                <Check className="w-4 h-4 mr-2" />
                Complete Session
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!selectedUser ? (
        <div className="space-y-6 animate-in">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                  Welcome to Check-In
                </h1>
                <p className="text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2">
                  <Clock className="w-4 h-4" />
                  {formatDate(new Date())}
                </p>
              </div>

              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <Search className="w-5 h-5" />
                </div>
                <Input
                  placeholder="Search your name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 text-base"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {searchResults.length > 0 && (
                <div className="mt-4 space-y-2">
                  {searchResults.map((user) => (
                    <button
                      key={user.user_uuid}
                      onClick={() => handleSelectUser(user)}
                      className={cn(
                        "w-full flex items-center gap-4 p-4 rounded-xl text-left",
                        "bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800",
                        "transition-all duration-200 group"
                      )}
                    >
                      <Avatar
                        src={user.profile_image_url}
                        firstName={user.first_name}
                        lastName={user.last_name}
                        size="lg"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {user.first_name} {user.last_name}
                        </p>
                        {user.nicknames && (
                          <p className="text-sm text-slate-500 dark:text-slate-400">{user.nicknames}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <RankBadge rank={user.rank} />
                        <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-1 transition-all" />
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {searchQuery.length >= 2 && searchResults.length === 0 && (
                <div className="mt-4 text-center py-8">
                  <div className="w-12 h-12 mx-auto mb-3 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-slate-400" />
                  </div>
                  <p className="text-slate-500 dark:text-slate-400">No results found</p>
                  <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                    Try a different name or add yourself as a new member
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Button
            variant="outline"
            className="w-full h-12 text-base"
            onClick={() => setShowNewMemberForm(!showNewMemberForm)}
          >
            <UserPlus className="w-5 h-5 mr-2" />
            {showNewMemberForm ? 'Cancel' : 'Add New Member'}
          </Button>

          {showNewMemberForm && (
            <Card className="animate-in">
              <CardHeader>
                <CardTitle>New Member Registration</CardTitle>
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
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Rank
                    </label>
                    <select
                      className="flex h-11 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white"
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
                  <div className="col-span-2">
                    <Input
                      label="Comments (optional)"
                      value={newMember.comments}
                      onChange={(e) => setNewMember({ ...newMember, comments: e.target.value })}
                    />
                  </div>
                </div>
                <Button 
                  className="w-full mt-6" 
                  onClick={handleCreateMember} 
                  disabled={isLoading}
                  isLoading={isLoading}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Member
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <div className="space-y-6 animate-in">
          <Card className="overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-blue-500 to-blue-600" />
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar
                      src={selectedUser.profile_image_url}
                      firstName={selectedUser.first_name}
                      lastName={selectedUser.last_name}
                      size="xl"
                      className="ring-4 ring-slate-100 dark:ring-slate-800"
                    />
                    <button
                      onClick={() => setShowPhotoUpload(!showPhotoUpload)}
                      className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors shadow-lg"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                      {selectedUser.first_name} {selectedUser.last_name}
                    </h2>
                    {selectedUser.nicknames && (
                      <p className="text-slate-500 dark:text-slate-400">"{selectedUser.nicknames}"</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <RankBadge rank={selectedUser.rank} />
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={cn(
                    "px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800",
                    sessionTimeLeft < 30 && "bg-red-100 dark:bg-red-900/20 animate-pulse"
                  )}>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Session Time</p>
                    <p className={cn(
                      "text-2xl font-bold tabular-nums",
                      sessionTimeLeft < 30 ? "text-red-600 dark:text-red-400" : "text-slate-900 dark:text-white"
                    )}>
                      {formatTimeLeft()}
                    </p>
                  </div>
                </div>
              </div>

              {showPhotoUpload && (
                <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="flex gap-2 mb-3">
                    <Button
                      variant={photoMethod === 'upload' ? 'primary' : 'outline'}
                      size="sm"
                      className="flex-1"
                      onClick={() => { setPhotoMethod('upload'); stopCamera(); }}
                    >
                      <Upload className="w-4 h-4 mr-1" /> Upload
                    </Button>
                    <Button
                      variant={photoMethod === 'camera' ? 'primary' : 'outline'}
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
                      <video ref={videoRef} autoPlay playsInline muted className="w-full max-w-sm mx-auto rounded-lg" />
                      <div className="flex gap-2 justify-center">
                        <Button size="sm" onClick={capturePhoto} disabled={isUploadingPhoto}>
                          Capture
                        </Button>
                        <Button variant="outline" size="sm" onClick={stopCamera}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 text-center py-2">Click Camera to start</p>
                  )}

                  <div className="flex gap-2 mt-3 justify-center">
                    {photoMethod === 'upload' && (
                      <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploadingPhoto}>
                        Choose Photo
                      </Button>
                    )}
                    {selectedUser.profile_image_url && (
                      <Button variant="ghost" size="sm" onClick={handleDeletePhoto} className="text-red-500 hover:text-red-600">
                        <Trash2 className="w-4 h-4 mr-1" /> Delete
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Weekly Schedule
                </CardTitle>
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  {todayAttendance.length} checked in today
                </span>
              </div>
            </CardHeader>
            <CardContent>
              {classes.length > 0 ? (
                <>
                  <div className="mb-4 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded">Checked In</span>
                    <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded">Pending</span>
                    <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded">Available</span>
                  </div>
                  <div className="overflow-x-auto">
                    <div className="min-w-[800px]">
                      <div className="grid grid-cols-8 gap-2 mb-2">
                        <div className="text-center font-medium text-sm text-slate-500 dark:text-slate-400 py-2">Time</div>
                        {DAYS_OF_WEEK.map(day => (
                          <div 
                            key={day} 
                            className={cn(
                              "text-center font-medium text-sm py-2 rounded",
                              day === today ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" : "text-slate-600 dark:text-slate-300"
                            )}
                          >
                            {day.slice(0, 3)}
                            {day === today && <span className="ml-1 text-xs">(Today)</span>}
                          </div>
                        ))}
                      </div>
                      {TIME_SLOTS.map(slot => {
                        const hasClassesOnDay = DAYS_OF_WEEK.some(day => classesByDayAndTime[day][slot].length > 0);
                        if (!hasClassesOnDay) return null;
                        return (
                          <div key={slot} className="grid grid-cols-8 gap-2 mb-2">
                            <div className="text-center text-sm text-slate-500 dark:text-slate-400 py-3">
                              {slot}
                            </div>
                            {DAYS_OF_WEEK.map(day => {
                              const dayClasses = classesByDayAndTime[day][slot];
                              return (
                                <div key={day} className="min-h-[80px] p-1">
                                  {dayClasses.map(cls => {
                                    const { status } = getAttendanceStatus(cls.id);
                                    return (
                                      <button
                                        key={cls.id}
                                        onClick={() => handleClassClick(cls)}
                                        className={cn(
                                          "w-full text-left p-2 rounded-lg text-xs mb-1 transition-all",
                                          status === 'confirmed' 
                                            ? "bg-emerald-100 dark:bg-emerald-900/40 border border-emerald-300 dark:border-emerald-700 cursor-default"
                                            : status === 'pending'
                                            ? "bg-amber-100 dark:bg-amber-900/40 border border-amber-300 dark:border-amber-700 cursor-pointer hover:bg-amber-200 dark:hover:bg-amber-900/60"
                                            : "bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 cursor-pointer"
                                        )}
                                      >
                                        <p className="font-semibold text-slate-900 dark:text-white truncate">{cls.class_name}</p>
                                        <p className="text-slate-500 dark:text-slate-400">{cls.points} pts</p>
                                        {status === 'confirmed' && (
                                          <p className="text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                                            <CheckCircle2 className="w-3 h-3" /> Done
                                          </p>
                                        )}
                                        {status === 'pending' && (
                                          <p className="text-amber-600 dark:text-amber-400 mt-1">Pending</p>
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 mx-auto mb-3 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-slate-400" />
                  </div>
                  <p className="text-slate-500 dark:text-slate-400">No classes scheduled</p>
                </div>
              )}
            </CardContent>

            {showCheckInConfirm && selectedClass && (
              <CardFooter className="border-t dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center justify-between w-full">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">
                      Check in to {selectedClass.class_name}?
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {selectedClass.day} at {selectedClass.time} • {selectedClass.points} points
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => { setSelectedClass(null); setShowCheckInConfirm(false); }}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={confirmCheckIn} disabled={isLoading} isLoading={isLoading}>
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Confirm Check In
                    </Button>
                  </div>
                </div>
              </CardFooter>
            )}

            {!showCheckInConfirm && (
              <CardFooter className="flex gap-3 border-t dark:border-slate-700">
                {hasCheckedIn && (
                  <Button className="flex-1" onClick={handleComplete}>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Complete Session
                  </Button>
                )}
                <Button variant="outline" onClick={handleStartOver}>
                  <X className="w-4 h-4 mr-2" />
                  {hasCheckedIn ? 'Cancel / Start Over' : 'Cancel Session'}
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
