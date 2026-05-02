'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { RankBadge } from '@/components/ui/Badge';
import { usersApi, classesApi, attendanceApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { cn, formatDate, debounce, DAYS_OF_WEEK } from '@/lib/utils';
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
  LogOut
} from 'lucide-react';

export default function CheckInPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, roles, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [classes, setClasses] = useState<ClassSchedule[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<Attendance[]>([]);
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [error, setError] = useState('');
  const [sessionTimeLeft, setSessionTimeLeft] = useState(120);
  const [showNewMemberForm, setShowNewMemberForm] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [photoMethod, setPhotoMethod] = useState<'upload' | 'camera'>('upload');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraInitializing, setIsCameraInitializing] = useState(false);
  const [showPhotoPositionModal, setShowPhotoPositionModal] = useState(false);
  const [pendingPhotoFile, setPendingPhotoFile] = useState<File | null>(null);
  const [pendingPhotoPreview, setPendingPhotoPreview] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
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

  const isTablet = roles.some(r => r.name === 'Tablet');
  const isAdmin = roles.some(r => r.name === 'Admin');
  const isStudent = !isTablet && !isAdmin && roles.some(r => r.name === 'Student');
  const isTeacher = roles.some(r => r.name === 'Teacher');

  const today = new Date();
  const todayDayName = DAYS_OF_WEEK[today.getDay()];

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      if (isStudent || isTeacher) {
        setSelectedUser(user);
        setSessionTimeLeft(120);
      }
    }
  }, [authLoading, isAuthenticated, isStudent, isTeacher, user]);

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
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
    }
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleSearch = useCallback(
    debounce(async (query: string) => {
      if (query.length < 2) {
        setSearchResults([]);
        return;
      }
      try {
        let results = await usersApi.search(query);
        if (!isTablet && !isAdmin && user) {
          const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
          const searchLower = query.toLowerCase();
          results = results.filter(r => 
            r.user_uuid === user.user_uuid ||
            fullName.includes(searchLower) ||
            `${r.first_name} ${r.last_name}`.toLowerCase().includes(searchLower)
          );
        }
        setSearchResults(results);
      } catch (error) {
        console.error('Search error:', error);
      }
    }, 300),
    [isTablet, isAdmin, user]
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
    setIsFormLoading(true);
    setError('');
    try {
      await attendanceApi.checkIn(selectedUser.user_uuid, classId);
      const today = new Date().toISOString().split('T')[0];
      const attendance = await attendanceApi.getByUser(selectedUser.user_uuid);
      setTodayAttendance(attendance.filter(a => a.attendance_date === today));
    } catch (error: any) {
      const message = error?.response?.data?.detail || error?.message || 'Failed to check in';
      setError(message);
      console.error('Check-in error:', error);
    } finally {
      setIsFormLoading(false);
    }
  };

  const handleCancelCheckIn = async (attendanceId: number) => {
    setIsFormLoading(true);
    try {
      await attendanceApi.cancel(attendanceId);
      const today = new Date().toISOString().split('T')[0];
      const attendance = await attendanceApi.getByUser(selectedUser!.user_uuid);
      setTodayAttendance(attendance.filter(a => a.attendance_date === today));
    } catch (error) {
      console.error('Cancel error:', error);
    } finally {
      setIsFormLoading(false);
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
    setIsFormLoading(true);
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
      setIsFormLoading(false);
    }
  };

  const startCamera = async () => {
    setCameraError(null);
    setIsCameraInitializing(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } 
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error: unknown) {
      console.error('Camera access error:', error);
      const err = error as { name?: string; message?: string };
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera permission denied. Please allow camera access in your browser settings.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('No camera found on this device.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setCameraError('Camera is in use by another app or browser tab.');
      } else {
        setCameraError('Could not access camera. Please check permissions.');
      }
    } finally {
      setIsCameraInitializing(false);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setCameraError(null);
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
    const preview = URL.createObjectURL(file);
    setPendingPhotoFile(file);
    setPendingPhotoPreview(preview);
    setDragOffset({ x: 0, y: 0 });
    setShowPhotoPositionModal(true);
    stopCamera();
  };

  const handleConfirmPhotoPosition = async () => {
    if (!selectedUser || !pendingPhotoFile) return;
    setIsUploadingPhoto(true);
    try {
      const updatedUser = await usersApi.uploadPhoto(
        selectedUser.user_uuid, 
        pendingPhotoFile, 
        dragOffset.x, 
        dragOffset.y
      );
      setSelectedUser({ 
        ...selectedUser, 
        profile_image_url: updatedUser.profile_image_url,
        image_offset_x: updatedUser.image_offset_x,
        image_offset_y: updatedUser.image_offset_y
      });
      setShowPhotoPositionModal(false);
      setPendingPhotoFile(null);
      setPendingPhotoPreview(null);
    } catch (error) {
      console.error('Photo upload error:', error);
      alert('Failed to upload photo');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleRetakePhoto = () => {
    setShowPhotoPositionModal(false);
    setPendingPhotoFile(null);
    if (pendingPhotoPreview) {
      URL.revokeObjectURL(pendingPhotoPreview);
    }
    setPendingPhotoPreview(null);
    setDragOffset({ x: 0, y: 0 });
  };

  const handlePhotoDrag = (e: React.MouseEvent) => {
    const container = e.currentTarget as HTMLDivElement;
    const rect = container.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const offsetX = (mouseX - centerX) / centerX;
    const offsetY = (mouseY - centerY) / centerY;
    setDragOffset({
      x: Math.max(-1, Math.min(1, -offsetX)),
      y: Math.max(-1, Math.min(1, -offsetY))
    });
  };

  const handleDeletePhoto = async () => {
    if (!selectedUser) return;
    if (!confirm('Delete profile photo?')) return;
    setIsFormLoading(true);
    try {
      await usersApi.deletePhoto(selectedUser.user_uuid);
      setSelectedUser({ ...selectedUser, profile_image_url: undefined });
    } catch (error) {
      console.error('Delete photo error:', error);
      alert('Failed to delete photo');
    } finally {
      setIsFormLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
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

  const canSearch = isTablet || isAdmin;

  if (authLoading || !isAuthenticated) {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold">CKB</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Check-In</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">{isTablet ? 'Tablet Mode' : 'Check-In'}</p>
          </div>
        </div>
      {isTablet && (
        <Button variant="outline" size="sm" onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      )}
    </div>

    {error && (
      <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg text-red-600 dark:text-red-400">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        {error}
      </div>
    )}

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
                  {isStudent ? 'Welcome' : 'Welcome to Check-In'}
                </h1>
                <p className="text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2">
                  <Clock className="w-4 h-4" />
                  {formatDate(new Date())}
                </p>
              </div>

              {canSearch && (
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
              )}

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
                        offsetX={user.image_offset_x}
                        offsetY={user.image_offset_y}
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

              {canSearch && searchQuery.length >= 2 && searchResults.length === 0 && (
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

          {canSearch && (
            <Button
              variant="outline"
              className="w-full h-12 text-base"
              onClick={() => setShowNewMemberForm(!showNewMemberForm)}
            >
              <UserPlus className="w-5 h-5 mr-2" />
              {showNewMemberForm ? 'Cancel' : 'Add New Member'}
            </Button>
          )}

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
                  disabled={isFormLoading}
                  isLoading={isFormLoading}
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
                      offsetX={selectedUser.image_offset_x}
                      offsetY={selectedUser.image_offset_y}
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
                      <p className="text-slate-500 dark:text-slate-400">&quot;{selectedUser.nicknames}&quot;</p>
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
                      onClick={() => { 
                        setPhotoMethod('camera'); 
                        startCamera(); 
                      }}
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
                  ) : cameraError ? (
                    <div className="text-center py-2">
                      <p className="text-sm text-red-500 dark:text-red-400 mb-2">{cameraError}</p>
                      <Button variant="outline" size="sm" onClick={startCamera}>
                        Try Again
                      </Button>
                    </div>
                  ) : isCameraInitializing ? (
                    <div className="text-center py-2">
                      <p className="text-sm text-slate-500 dark:text-slate-400">Initializing camera...</p>
                    </div>
                  ) : (
                    <div className="text-center py-2">
                      <Button variant="outline" size="sm" onClick={startCamera}>
                        Start Camera
                      </Button>
                    </div>
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

          <Card className="p-4 md:p-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg md:text-xl">This Week&apos;s Classes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 md:gap-3">
                {DAYS_OF_WEEK.map((day) => {
                  const dayClasses = classes.filter(c => c.day?.toLowerCase() === day.toLowerCase()).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
                  const isTodayDay = day === todayDayName;
                  
                   return (
                     <div 
                       key={day} 
                       className={`
                         min-h-[160px] md:min-h-[200px] rounded-lg p-2 md:p-3 border
                         ${isTodayDay 
                           ? 'bg-blue-500/10 border-blue-500/50' 
                           : 'bg-slate-100 dark:bg-slate-700/30 border-slate-200 dark:border-slate-600/30'}
                       `}
                     >
                       <div className={`
                         text-center font-semibold text-sm mb-2 pb-2 border-b 
                         ${isTodayDay ? 'text-blue-400 border-blue-500/30' : 'text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-600/30'}
                       `}>
                         {day}
                       </div>
                       <div className="space-y-2">
                         {dayClasses.length > 0 ? (
                           dayClasses.map((cls) => {
                             const { status, attendance } = getAttendanceStatus(cls.id);
                             
                             return (
                               <div
                                 key={cls.id}
                                 className={cn(
                                   "p-2 rounded-lg border text-xs",
                                   status === 'confirmed' 
                                     ? "bg-emerald-50 dark:bg-emerald-500/20 border-emerald-200 dark:border-emerald-500/50"
                                     : status === 'pending'
                                     ? "bg-amber-50 dark:bg-amber-500/20 border-amber-200 dark:border-amber-500/50"
                                     : "bg-slate-100 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600/50"
                                 )}
                               >
                                 <p className="font-medium text-slate-900 dark:text-white truncate">{cls.class_name}</p>
                                 <p className="text-slate-500 dark:text-slate-400">{cls.time}</p>
                                 <p className="text-blue-400 font-medium">{cls.points} pts</p>
                                <div className="mt-1">
                                  {status === 'not_checked_in' && (
                                    <Button 
                                      size="sm"
                                      className="w-full text-xs"
                                      onClick={() => handleCheckIn(cls.id)} 
                                      disabled={isFormLoading}
                                    >
                                      Check In
                                    </Button>
                                  )}
                                  {status === 'pending' && (
                                    <div className="flex flex-col gap-1">
                                      <span className="text-center text-amber-400 text-xs font-medium">
                                        Pending
                                      </span>
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        className="w-full text-xs text-red-400"
                                        onClick={() => handleCancelCheckIn(attendance!.id)}
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                  )}
                                  {status === 'confirmed' && (
                                    <span className="block text-center text-emerald-400 text-xs font-medium">
                                      ✓ Confirmed
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-xs text-slate-500 text-center py-2">No classes</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
            {hasCheckedIn && (
              <CardFooter className="flex gap-3">
                <Button className="flex-1" onClick={handleComplete}>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Complete Session
                </Button>
                <Button variant="outline" onClick={handleStartOver}>
                  Start Over
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />

      {showPhotoPositionModal && pendingPhotoPreview && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              Adjust Photo Position
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Drag the photo to position it within the circle
            </p>
            <div 
              className="relative w-48 h-48 mx-auto rounded-full overflow-hidden cursor-move bg-slate-100 dark:bg-slate-800 border-4 border-slate-200 dark:border-slate-700"
              onMouseDown={(e) => {
                const container = e.currentTarget as HTMLDivElement;
                const handleMouseMove = (moveEvent: MouseEvent) => {
                  const rect = container.getBoundingClientRect();
                  const centerX = rect.width / 2;
                  const centerY = rect.height / 2;
                  const mouseX = moveEvent.clientX - rect.left;
                  const mouseY = moveEvent.clientY - rect.top;
                  const offsetX = (mouseX - centerX) / centerX;
                  const offsetY = (mouseY - centerY) / centerY;
                  setDragOffset({
                    x: Math.max(-1, Math.min(1, -offsetX)),
                    y: Math.max(-1, Math.min(1, -offsetY))
                  });
                };
                const handleMouseUp = () => {
                  document.removeEventListener('mousemove', handleMouseMove);
                  document.removeEventListener('mouseup', handleMouseUp);
                };
                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
              }}
            >
              <img
                src={pendingPhotoPreview}
                alt="Position preview"
                className="absolute w-[200%] h-[200%] max-w-none"
                style={{
                  objectPosition: `${50 - dragOffset.x * 50}% ${50 - dragOffset.y * 50}%`,
                  left: '0',
                  top: '0',
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
                draggable={false}
              />
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" className="flex-1" onClick={handleRetakePhoto}>
                Retake
              </Button>
              <Button className="flex-1" onClick={handleConfirmPhotoPosition} disabled={isUploadingPhoto}>
                {isUploadingPhoto ? 'Saving...' : 'Confirm'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
