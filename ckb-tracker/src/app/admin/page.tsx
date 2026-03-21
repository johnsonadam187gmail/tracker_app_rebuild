'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Avatar } from '@/components/ui/Avatar';
import { RankBadge } from '@/components/ui/Badge';
import { useAuth } from '@/hooks/useAuth';
import { useChartColors } from '@/hooks/useChartColors';
import {
  usersApi,
  classesApi,
  rolesApi,
  termsApi,
  termTargetsApi,
  curriculaApi,
  lessonsApi,
  gymLocationsApi,
  classTypesApi,
  feedbackApi,
  dashboardApi,
  classInstancesApi,
  kioskApi,
} from '@/lib/api';
import { formatDate, DAYS_OF_WEEK } from '@/lib/utils';
import { Camera, LogOut } from 'lucide-react';
import type { User, ClassSchedule, Role, Term, TermTarget, Curriculum, Lesson, GymLocation, ClassType, Rank } from '@/types';

export default function AdminPage() {
  const { user, isAdmin, isAuthenticated, isLoading, login, logout } = useAuth();
  const router = useRouter();
  const { colors } = useChartColors();
  const [activeTab, setActiveTab] = useState('users');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [users, setUsers] = useState<User[]>([]);
  const [classes, setClasses] = useState<ClassSchedule[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [targets, setTargets] = useState<TermTarget[]>([]);
  const [curricula, setCurricula] = useState<Curriculum[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [gymLocations, setGymLocations] = useState<GymLocation[]>([]);
  const [classTypes, setClassTypes] = useState<ClassType[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState<{
    first_name: string;
    last_name: string;
    email: string;
    rank: Rank;
    nicknames: string;
    last_graded_date: string;
    comments: string;
  }>({
    first_name: '',
    last_name: '',
    email: '',
    rank: 'White',
    nicknames: '',
    last_graded_date: '',
    comments: '',
  });
  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);
  const [classForm, setClassForm] = useState<{
    class_name: string;
    day: string;
    time: string;
    points: number;
    gym_id: string;
    class_type_id: string;
  }>({
    class_name: '',
    day: 'Monday',
    time: '18:00',
    points: 1,
    gym_id: '',
    class_type_id: '',
  });
  const [termForm, setTermForm] = useState({ term_name: '', start_date: '', end_date: '' });
  const [targetForm, setTargetForm] = useState<{ term_id: string; rank: Rank; target: number }>({ term_id: '', rank: 'White', target: 0 });
  const [curriculumForm, setCurriculumForm] = useState<{ class_id: string; name: string; description: string }>({ class_id: '', name: '', description: '' });
  const [lessonForm, setLessonForm] = useState<{ curriculum_id: string; title: string; description: string; lesson_plan_url: string; video_folder_url: string }>({ curriculum_id: '', title: '', description: '', lesson_plan_url: '', video_folder_url: '' });
  const [gymForm, setGymForm] = useState({ name: '', address: '' });
  const [classTypeForm, setClassTypeForm] = useState({ name: '' });
  const [isProcessing, setIsProcessing] = useState(false);
  const [studentStats, setStudentStats] = useState<{ totalStudents: number; totalClasses: number }>({ totalStudents: 0, totalClasses: 0 });
  const [lessonSubTab, setLessonSubTab] = useState<'curricula' | 'lessons' | 'assign' | 'teachers'>('curricula');
  const [passwordForm, setPasswordForm] = useState({ password: '', confirm_password: '' });
  const [photoMethod, setPhotoMethod] = useState<'upload' | 'camera'>('upload');
  const [classInstanceForm, setClassInstanceForm] = useState({ class_id: '', date: '', lesson_id: '', teacher_uuid: '' });
  const [classInstances, setClassInstances] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [teacherAssignmentForm, setTeacherAssignmentForm] = useState({ class_id: '', date: '', teacher_uuid: '' });
  const [studentPasswordStatus, setStudentPasswordStatus] = useState<{ hasPassword: boolean } | null>(null);
  const [kioskPin, setKioskPin] = useState({ current: '', newPin: '', confirm: '' });
  const [dbStats, setDbStats] = useState<any>(null);
  const [feedbackStats, setFeedbackStats] = useState<any>(null);
  const [performanceStats, setPerformanceStats] = useState<any>(null);
  const [selectedStudentAnalytics, setSelectedStudentAnalytics] = useState<User | null>(null);
  const [feedbackFilters, setFeedbackFilters] = useState({ startDate: '', endDate: '', classes: '', rating: 'all' });
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAdmin) {
      loadAllData();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (activeTab === 'lessons' || activeTab === 'assign') {
      loadClassInstances();
      loadTeachers();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'kiosk') {
      loadDbStats();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'feedback') {
      loadFeedbackAnalytics();
    }
  }, [activeTab, feedbackFilters]);

  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  const loadAllData = async () => {
    try {
      const [usersData, classesData, rolesData, termsData, targetsData, curriculaData, lessonsData, gymsData, typesData] = await Promise.all([
        usersApi.list(),
        classesApi.list(),
        rolesApi.list(),
        termsApi.list(),
        termTargetsApi.list(),
        curriculaApi.list(),
        lessonsApi.list(),
        gymLocationsApi.list(),
        classTypesApi.list(),
      ]);
      setUsers(usersData);
      setClasses(classesData);
      setRoles(rolesData);
      setTerms(termsData);
      setTargets(targetsData);
      setCurricula(curriculaData);
      setLessons(lessonsData);
      setGymLocations(gymsData);
      setClassTypes(typesData);
      setStudentStats({ totalStudents: usersData.length, totalClasses: classesData.length });
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(loginForm.email, loginForm.password, true);
    } catch (error) {
      alert('Invalid admin credentials');
    }
  };

  const handleSelectUser = async (u: User) => {
    setSelectedUser(u);
    setUserForm({
      first_name: u.first_name,
      last_name: u.last_name,
      email: u.email,
      rank: u.rank || 'White',
      nicknames: u.nicknames || '',
      last_graded_date: u.last_graded_date || '',
      comments: u.comments || '',
    });
    try {
      const userRoles = await rolesApi.getUserRoles(u.user_uuid);
      setSelectedRoles(userRoles.map(ur => ur.role_id));
    } catch (error) {
      console.error('Error loading roles:', error);
    }
  };

  const handleSaveUser = async () => {
    if (!selectedUser) return;
    setIsProcessing(true);
    try {
      await usersApi.update(selectedUser.user_uuid, userForm);
      await rolesApi.updateUserRoles(selectedUser.user_uuid, selectedRoles);
      loadAllData();
      setSelectedUser(null);
    } catch (error) {
      console.error('Error saving user:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateClass = async () => {
    setIsProcessing(true);
    try {
      await classesApi.create({
        class_name: classForm.class_name,
        day: classForm.day,
        time: classForm.time,
        points: classForm.points,
        gym_id: classForm.gym_id ? Number(classForm.gym_id) : undefined,
        class_type_id: classForm.class_type_id ? Number(classForm.class_type_id) : undefined,
      });
      loadAllData();
      setClassForm({ class_name: '', day: 'Monday', time: '18:00', points: 1, gym_id: '', class_type_id: '' });
    } catch (error) {
      console.error('Error creating class:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateTerm = async () => {
    setIsProcessing(true);
    try {
      await termsApi.create(termForm);
      loadAllData();
      setTermForm({ term_name: '', start_date: '', end_date: '' });
    } catch (error) {
      console.error('Error creating term:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateTarget = async () => {
    setIsProcessing(true);
    try {
      await termTargetsApi.create({
        term_id: Number(targetForm.term_id),
        rank: targetForm.rank as TermTarget['rank'],
        target: targetForm.target,
      });
      loadAllData();
      setTargetForm({ term_id: '', rank: 'White', target: 0 });
    } catch (error) {
      console.error('Error creating target:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateCurriculum = async () => {
    if (!curriculumForm.class_id) return;
    setIsProcessing(true);
    try {
      await curriculaApi.create({
        class_id: Number(curriculumForm.class_id),
        name: curriculumForm.name,
        description: curriculumForm.description,
      });
      loadAllData();
      setCurriculumForm({ class_id: '', name: '', description: '' });
    } catch (error) {
      console.error('Error creating curriculum:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateLesson = async () => {
    if (!lessonForm.curriculum_id) return;
    setIsProcessing(true);
    try {
      await lessonsApi.create({
        curriculum_id: Number(lessonForm.curriculum_id),
        title: lessonForm.title,
        description: lessonForm.description,
        lesson_plan_url: lessonForm.lesson_plan_url,
        video_folder_url: lessonForm.video_folder_url,
      });
      loadAllData();
      setLessonForm({ curriculum_id: '', title: '', description: '', lesson_plan_url: '', video_folder_url: '' });
    } catch (error) {
      console.error('Error creating lesson:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateGym = async () => {
    setIsProcessing(true);
    try {
      await gymLocationsApi.create(gymForm);
      loadAllData();
      setGymForm({ name: '', address: '' });
    } catch (error) {
      console.error('Error creating gym:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateClassType = async () => {
    setIsProcessing(true);
    try {
      await classTypesApi.create(classTypeForm);
      loadAllData();
      setClassTypeForm({ name: '' });
    } catch (error) {
      console.error('Error creating class type:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser) return;
    if (passwordForm.password !== passwordForm.confirm_password) {
      alert('Passwords do not match');
      return;
    }
    if (passwordForm.password.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }
    setIsProcessing(true);
    try {
      await usersApi.update(selectedUser.user_uuid, { password_hash: passwordForm.password });
      alert('Password reset successfully');
      setPasswordForm({ password: '', confirm_password: '' });
    } catch (error) {
      console.error('Error resetting password:', error);
      alert('Failed to reset password');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCheckPassword = async (uuid: string) => {
    try {
      const status = await usersApi.get(uuid);
      return !!status.password_hash;
    } catch {
      return false;
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
      alert('Could not access camera');
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
    setIsProcessing(true);
    try {
      const updatedUser = await usersApi.uploadPhoto(selectedUser.user_uuid, file);
      setSelectedUser({ ...selectedUser, profile_image_url: updatedUser.profile_image_url });
      loadAllData();
    } catch (error) {
      console.error('Photo upload error:', error);
      alert('Failed to upload photo');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeletePhoto = async () => {
    if (!selectedUser) return;
    if (!confirm('Delete profile photo?')) return;
    setIsProcessing(true);
    try {
      await usersApi.deletePhoto(selectedUser.user_uuid);
      setSelectedUser({ ...selectedUser, profile_image_url: undefined });
      loadAllData();
    } catch (error) {
      console.error('Delete photo error:', error);
      alert('Failed to delete photo');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateClassInstance = async () => {
    if (!classInstanceForm.class_id || !classInstanceForm.date) return;
    setIsProcessing(true);
    try {
      await classInstancesApi.create({
        class_id: Number(classInstanceForm.class_id),
        class_date: classInstanceForm.date,
        lesson_id: classInstanceForm.lesson_id ? Number(classInstanceForm.lesson_id) : undefined,
        teacher_uuid: classInstanceForm.teacher_uuid || undefined,
      });
      loadClassInstances();
      setClassInstanceForm({ class_id: '', date: '', lesson_id: '', teacher_uuid: '' });
      alert('Assignment created');
    } catch (error) {
      console.error('Error creating assignment:', error);
      alert('Failed to create assignment');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateTeacherAssignment = async () => {
    if (!teacherAssignmentForm.class_id || !teacherAssignmentForm.date || !teacherAssignmentForm.teacher_uuid) return;
    setIsProcessing(true);
    try {
      await classInstancesApi.create({
        class_id: Number(teacherAssignmentForm.class_id),
        class_date: teacherAssignmentForm.date,
        teacher_uuid: teacherAssignmentForm.teacher_uuid,
      });
      loadClassInstances();
      setTeacherAssignmentForm({ class_id: '', date: '', teacher_uuid: '' });
      alert('Teacher assigned');
    } catch (error) {
      console.error('Error assigning teacher:', error);
      alert('Failed to assign teacher');
    } finally {
      setIsProcessing(false);
    }
  };

  const loadClassInstances = async () => {
    try {
      const data = await classInstancesApi.list();
      setClassInstances(data);
    } catch (error) {
      console.error('Error loading instances:', error);
    }
  };

  const loadTeachers = async () => {
    try {
      const allUsers = await usersApi.list();
      setTeachers(allUsers.filter(u => u.rank === 'Black' || u.rank === 'Brown'));
    } catch (error) {
      console.error('Error loading teachers:', error);
    }
  };

  const handleUpdateKioskPin = async () => {
    if (kioskPin.newPin !== kioskPin.confirm) {
      alert('PINs do not match');
      return;
    }
    if (kioskPin.newPin.length < 4 || kioskPin.newPin.length > 6) {
      alert('PIN must be 4-6 digits');
      return;
    }
    setIsProcessing(true);
    try {
      await kioskApi.updatePin(kioskPin.current, kioskPin.newPin);
      alert('PIN updated successfully');
      setKioskPin({ current: '', newPin: '', confirm: '' });
    } catch (error) {
      console.error('Error updating PIN:', error);
      alert('Failed to update PIN');
    } finally {
      setIsProcessing(false);
    }
  };

  const loadDbStats = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/database/stats`);
      const data = await res.json();
      setDbStats(data);
    } catch (error) {
      console.error('Error loading db stats:', error);
    }
  };

  const loadFeedbackAnalytics = async () => {
    try {
      const stats = await feedbackApi.getAdminStats({
        start_date: feedbackFilters.startDate || undefined,
        end_date: feedbackFilters.endDate || undefined,
      });
      setFeedbackStats(stats);
    } catch (error) {
      console.error('Error loading feedback:', error);
    }
  };

  const loadStudentAnalytics = async (student: User) => {
    setSelectedStudentAnalytics(student);
    try {
      const [stats, trend] = await Promise.all([
        dashboardApi.getStats(student.user_uuid),
        dashboardApi.getAttendanceTrend(student.user_uuid, 90),
      ]);
      setPerformanceStats({ stats, trend });
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const filteredUsers = users.filter(u =>
    `${u.first_name} ${u.last_name} ${u.email} ${u.rank}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tabs = [
    { id: 'users', label: 'User Admin' },
    { id: 'classes', label: 'Class Schedule' },
    { id: 'gyms', label: 'Gyms & Types' },
    { id: 'terms', label: 'Terms' },
    { id: 'targets', label: 'Targets' },
    { id: 'lessons', label: 'Lessons' },
    { id: 'student-passwords', label: 'Student Passwords' },
    { id: 'analytics', label: 'Performance Analytics' },
    { id: 'feedback', label: 'Feedback Analytics' },
    { id: 'kiosk', label: 'Kiosk' },
    { id: 'database', label: 'Database' },
  ];

  if (!isAuthenticated || !isAdmin) {
    return (
      <>
        <div className="max-w-md mx-auto pt-20">
          <Card>
            <CardHeader>
              <CardTitle>Admin Login</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <Input
                  label="Email"
                  type="email"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                />
                <Input
                  label="Password"
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                />
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
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Settings</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500 dark:text-slate-400">{user?.email}</span>
            <Button variant="outline" size="sm" onClick={() => logout()}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? 'primary' : 'outline'}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {activeTab === 'users' && (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Members</CardTitle>
                  <Input
                    placeholder="Search by name, rank, or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Total Active Members: {studentStats.totalStudents}</p>
                <div className="space-y-2">
                  {filteredUsers.map((u) => (
                    <div
                      key={u.user_uuid}
                      className={`flex items-center justify-between p-3 rounded-lg cursor-pointer ${selectedUser?.user_uuid === u.user_uuid ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                      onClick={() => handleSelectUser(u)}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar src={u.profile_image_url} firstName={u.first_name} lastName={u.last_name} />
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">{u.first_name} {u.last_name}</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">{u.email}</p>
                        </div>
                      </div>
                      <RankBadge rank={u.rank} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            {selectedUser && (
              <Card>
                <CardHeader>
                  <CardTitle>Edit Member</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col items-center mb-4">
                    <Avatar
                      src={selectedUser.profile_image_url}
                      firstName={selectedUser.first_name}
                      lastName={selectedUser.last_name}
                      size="xl"
                    />
                    {selectedUser.profile_image_url && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDeletePhoto}
                        disabled={isProcessing}
                        className="text-red-500 dark:text-red-400 mt-2"
                      >
                        Delete Photo
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      label="First Name"
                      value={userForm.first_name}
                      onChange={(e) => setUserForm({ ...userForm, first_name: e.target.value })}
                    />
                    <Input
                      label="Last Name"
                      value={userForm.last_name}
                      onChange={(e) => setUserForm({ ...userForm, last_name: e.target.value })}
                    />
                  </div>
                  <Input
                    label="Email"
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  />
                  <Select
                    label="Rank"
                    value={userForm.rank}
                    onChange={(e) => setUserForm({ ...userForm, rank: e.target.value as Rank })}
                    options={['White', 'Blue', 'Purple', 'Brown', 'Black'].map(r => ({ value: r, label: r }))}
                  />
                  <Input
                    label="Nicknames"
                    value={userForm.nicknames}
                    onChange={(e) => setUserForm({ ...userForm, nicknames: e.target.value })}
                  />
                  <Input
                    label="Last Graded Date"
                    type="date"
                    value={userForm.last_graded_date}
                    onChange={(e) => setUserForm({ ...userForm, last_graded_date: e.target.value })}
                  />
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Roles</label>
                    <div className="space-y-1">
                      {roles.map((role) => (
                        <label key={role.id} className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                          <input
                            type="checkbox"
                            checked={selectedRoles.includes(role.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedRoles([...selectedRoles, role.id]);
                              } else {
                                setSelectedRoles(selectedRoles.filter(id => id !== role.id));
                              }
                            }}
                          />
                          {role.name}
                        </label>
                      ))}
                    </div>
                  </div>
                  <Input
                    label="Comments"
                    value={userForm.comments}
                    onChange={(e) => setUserForm({ ...userForm, comments: e.target.value })}
                  />
                  <Button className="w-full" onClick={handleSaveUser} disabled={isProcessing}>
                    Save Changes & Archive History
                  </Button>

                  <div className="border-t dark:border-slate-700 pt-4 mt-4">
                    <h4 className="font-medium mb-2 text-slate-900 dark:text-white">Reset Password</h4>
                    <Input
                      label="New Password"
                      type="password"
                      value={passwordForm.password}
                      onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })}
                    />
                    <Input
                      label="Confirm Password"
                      type="password"
                      value={passwordForm.confirm_password}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                      className="mt-2"
                    />
                    <Button
                      variant="outline"
                      className="w-full mt-2"
                      onClick={handleResetPassword}
                      disabled={isProcessing || !passwordForm.password}
                    >
                      Reset Password
                    </Button>
                  </div>

                  <div className="border-t dark:border-slate-700 pt-4">
                    <h4 className="font-medium mb-2 text-slate-900 dark:text-white">Photo Management</h4>
                    <div className="flex gap-2 mb-2">
                      <Button
                        variant={photoMethod === 'upload' ? 'primary' : 'outline'}
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setPhotoMethod('upload');
                          stopCamera();
                        }}
                      >
                        Upload
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
                        Camera
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
                        <video ref={videoRef} autoPlay playsInline muted className="w-full rounded" />
                        <div className="flex gap-2">
                          <Button size="sm" className="flex-1" onClick={capturePhoto}>Capture</Button>
                          <Button variant="outline" size="sm" onClick={stopCamera}>Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500 text-center">Click Camera to start</p>
                    )}
                    {photoMethod === 'upload' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-2"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isProcessing}
                      >
                        Choose Photo
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {activeTab === 'classes' && (
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Add New Class</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Class Name"
                value={classForm.class_name}
                onChange={(e) => setClassForm({ ...classForm, class_name: e.target.value })}
              />
              <Select
                label="Day"
                value={classForm.day}
                onChange={(e) => setClassForm({ ...classForm, day: e.target.value })}
                options={DAYS_OF_WEEK.map(d => ({ value: d, label: d }))}
              />
              <Input
                label="Time"
                type="time"
                value={classForm.time}
                onChange={(e) => setClassForm({ ...classForm, time: e.target.value })}
              />
              <Input
                label="Points"
                type="number"
                value={classForm.points}
                onChange={(e) => setClassForm({ ...classForm, points: Number(e.target.value) })}
              />
              <Select
                label="Gym Location"
                value={classForm.gym_id}
                onChange={(e) => setClassForm({ ...classForm, gym_id: e.target.value })}
                options={[{ value: '', label: 'Select...' }, ...gymLocations.map(g => ({ value: g.id.toString(), label: g.name }))]}
              />
              <Select
                label="Class Type"
                value={classForm.class_type_id}
                onChange={(e) => setClassForm({ ...classForm, class_type_id: e.target.value })}
                options={[{ value: '', label: 'Select...' }, ...classTypes.map(t => ({ value: t.id.toString(), label: t.name }))]}
              />
              <Button className="w-full" onClick={handleCreateClass} disabled={isProcessing}>
                Add Class
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Class Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {classes.map((cls) => (
                  <div key={cls.id} className="flex justify-between p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{cls.class_name}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{cls.day} {cls.time}</p>
                    </div>
                    <p className="font-medium text-slate-900 dark:text-white">{cls.points} pts</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'gyms' && (
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Gym Locations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Name"
                value={gymForm.name}
                onChange={(e) => setGymForm({ ...gymForm, name: e.target.value })}
              />
              <Input
                label="Address"
                value={gymForm.address}
                onChange={(e) => setGymForm({ ...gymForm, address: e.target.value })}
              />
              <Button className="w-full" onClick={handleCreateGym} disabled={isProcessing}>
                Add Gym
              </Button>
              <div className="space-y-2 mt-4">
                {gymLocations.map((gym) => (
                  <div key={gym.id} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    <p className="font-medium text-slate-900 dark:text-white">{gym.name}</p>
                    {gym.address && <p className="text-sm text-slate-500 dark:text-slate-400">{gym.address}</p>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Class Types</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Type Name"
                value={classTypeForm.name}
                onChange={(e) => setClassTypeForm({ ...classTypeForm, name: e.target.value })}
              />
              <Button className="w-full" onClick={handleCreateClassType} disabled={isProcessing}>
                Add Class Type
              </Button>
              <div className="space-y-2 mt-4">
                {classTypes.map((type) => (
                  <div key={type.id} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-900 dark:text-white">
                    {type.name}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'terms' && (
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Add Term</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Term Name"
                value={termForm.term_name}
                onChange={(e) => setTermForm({ ...termForm, term_name: e.target.value })}
              />
              <Input
                label="Start Date"
                type="date"
                value={termForm.start_date}
                onChange={(e) => setTermForm({ ...termForm, start_date: e.target.value })}
              />
              <Input
                label="End Date"
                type="date"
                value={termForm.end_date}
                onChange={(e) => setTermForm({ ...termForm, end_date: e.target.value })}
              />
              <Button className="w-full" onClick={handleCreateTerm} disabled={isProcessing}>
                Add Term
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Terms</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {terms.map((term) => (
                  <div key={term.id} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    <p className="font-medium text-slate-900 dark:text-white">{term.term_name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {formatDate(term.start_date)} - {formatDate(term.end_date)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'targets' && (
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Add Target</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                label="Term"
                value={targetForm.term_id}
                onChange={(e) => setTargetForm({ ...targetForm, term_id: e.target.value })}
                options={[{ value: '', label: 'Select...' }, ...terms.map(t => ({ value: t.id.toString(), label: t.term_name }))]}
              />
              <Select
                label="Rank"
                value={targetForm.rank}
                onChange={(e) => setTargetForm({ ...targetForm, rank: e.target.value as Rank })}
                options={['White', 'Blue', 'Purple', 'Brown', 'Black'].map(r => ({ value: r, label: r }))}
              />
              <Input
                label="Hours Required"
                type="number"
                value={targetForm.target}
                onChange={(e) => setTargetForm({ ...targetForm, target: Number(e.target.value) })}
              />
              <Button className="w-full" onClick={handleCreateTarget} disabled={isProcessing}>
                Add Target
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Targets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {targets.map((target) => {
                  const term = terms.find(t => t.id === target.term_id);
                  return (
                    <div key={target.id} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                      <p className="font-medium text-slate-900 dark:text-white">{term?.term_name}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{target.rank}: {target.target} hours</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'lessons' && (
        <div className="space-y-4">
          <div className="flex gap-2 mb-4">
            <Button
              variant={lessonSubTab === 'curricula' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setLessonSubTab('curricula')}
            >
              📖 Curricula
            </Button>
            <Button
              variant={lessonSubTab === 'lessons' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setLessonSubTab('lessons')}
            >
              📝 Lesson Library
            </Button>
            <Button
              variant={lessonSubTab === 'assign' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setLessonSubTab('assign')}
            >
              📅 Assign to Dates
            </Button>
            <Button
              variant={lessonSubTab === 'teachers' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setLessonSubTab('teachers')}
            >
              👨‍🏫 Teacher Assignments
            </Button>
          </div>

          {lessonSubTab === 'curricula' && (
            <Card>
              <CardHeader>
                <CardTitle>Curricula</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <Select
                    label="Class"
                    value={curriculumForm.class_id}
                    onChange={(e) => setCurriculumForm({ ...curriculumForm, class_id: e.target.value })}
                    options={[{ value: '', label: 'Select...' }, ...classes.map(c => ({ value: c.id.toString(), label: c.class_name }))]}
                  />
                  <Input
                    label="Name"
                    value={curriculumForm.name}
                    onChange={(e) => setCurriculumForm({ ...curriculumForm, name: e.target.value })}
                  />
                  <Input
                    label="Description"
                    value={curriculumForm.description}
                    onChange={(e) => setCurriculumForm({ ...curriculumForm, description: e.target.value })}
                  />
                </div>
                <Button onClick={handleCreateCurriculum} disabled={isProcessing}>
                  Create Curriculum
                </Button>
              </CardContent>
            </Card>
          )}

          {lessonSubTab === 'lessons' && (
            <Card>
              <CardHeader>
                <CardTitle>Lesson Library</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Curriculum"
                    value={lessonForm.curriculum_id}
                    onChange={(e) => setLessonForm({ ...lessonForm, curriculum_id: e.target.value })}
                    options={[{ value: '', label: 'Select...' }, ...curricula.map(c => ({ value: c.id.toString(), label: c.name || `Class ${c.class_id}` }))]}
                  />
                  <Input
                    label="Title"
                    value={lessonForm.title}
                    onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                  />
                </div>
                <Input
                  label="Description"
                  value={lessonForm.description}
                  onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                />
                <Input
                  label="Lesson Plan URL"
                  value={lessonForm.lesson_plan_url}
                  onChange={(e) => setLessonForm({ ...lessonForm, lesson_plan_url: e.target.value })}
                />
                <Input
                  label="Video Folder URL"
                  value={lessonForm.video_folder_url}
                  onChange={(e) => setLessonForm({ ...lessonForm, video_folder_url: e.target.value })}
                />
                <Button onClick={handleCreateLesson} disabled={isProcessing}>
                  Create Lesson
                </Button>
              </CardContent>
            </Card>
          )}

          {lessonSubTab === 'assign' && (
            <div className="grid grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Assign Lesson to Date</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Select
                    label="Class"
                    value={classInstanceForm.class_id}
                    onChange={(e) => setClassInstanceForm({ ...classInstanceForm, class_id: e.target.value })}
                    options={[{ value: '', label: 'Select...' }, ...classes.map(c => ({ value: c.id.toString(), label: c.class_name }))]}
                  />
                  <Input
                    label="Date"
                    type="date"
                    value={classInstanceForm.date}
                    onChange={(e) => setClassInstanceForm({ ...classInstanceForm, date: e.target.value })}
                  />
                  <Select
                    label="Lesson (optional)"
                    value={classInstanceForm.lesson_id}
                    onChange={(e) => setClassInstanceForm({ ...classInstanceForm, lesson_id: e.target.value })}
                    options={[{ value: '', label: 'Select...' }, ...lessons.map(l => ({ value: l.id.toString(), label: l.title }))]}
                  />
                  <Select
                    label="Teacher (optional)"
                    value={classInstanceForm.teacher_uuid}
                    onChange={(e) => setClassInstanceForm({ ...classInstanceForm, teacher_uuid: e.target.value })}
                    options={[{ value: '', label: 'Select...' }, ...teachers.map(t => ({ value: t.user_uuid, label: `${t.first_name} ${t.last_name}` }))]}
                  />
                  <Button onClick={handleCreateClassInstance} disabled={isProcessing}>
                    💾 Save Assignment
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Current Assignments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {classInstances.slice(0, 20).map((instance) => {
                      const cls = classes.find(c => c.id === instance.class_id);
                      const teacher = teachers.find(t => t.user_uuid === instance.teacher_uuid);
                      return (
                        <div key={instance.id} className="p-3 bg-slate-50 rounded-lg">
                          <p className="font-medium">{cls?.class_name || `Class ${instance.class_id}`}</p>
                          <p className="text-sm text-slate-500">{instance.class_date}</p>
                          {teacher && <p className="text-sm">Teacher: {teacher.first_name} {teacher.last_name}</p>}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {lessonSubTab === 'teachers' && (
            <div className="grid grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Assign Teacher to Class</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Select
                    label="Class"
                    value={teacherAssignmentForm.class_id}
                    onChange={(e) => setTeacherAssignmentForm({ ...teacherAssignmentForm, class_id: e.target.value })}
                    options={[{ value: '', label: 'Select...' }, ...classes.map(c => ({ value: c.id.toString(), label: c.class_name }))]}
                  />
                  <Input
                    label="Date"
                    type="date"
                    value={teacherAssignmentForm.date}
                    onChange={(e) => setTeacherAssignmentForm({ ...teacherAssignmentForm, date: e.target.value })}
                  />
                  <Select
                    label="Teacher"
                    value={teacherAssignmentForm.teacher_uuid}
                    onChange={(e) => setTeacherAssignmentForm({ ...teacherAssignmentForm, teacher_uuid: e.target.value })}
                    options={[{ value: '', label: 'Select...' }, ...teachers.map(t => ({ value: t.user_uuid, label: `${t.first_name} ${t.last_name} (${t.rank})` }))]}
                  />
                  <Button onClick={handleCreateTeacherAssignment} disabled={isProcessing}>
                    💾 Save Teacher Assignment
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Teacher Assignments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-3 bg-slate-50 rounded-lg">
                      <p className="text-xl font-bold">{classInstances.length}</p>
                      <p className="text-sm text-slate-500">Total</p>
                    </div>
                    <div className="text-center p-3 bg-slate-50 rounded-lg">
                      <p className="text-xl font-bold">{new Set(classInstances.map(i => i.teacher_uuid).filter(Boolean)).size}</p>
                      <p className="text-sm text-slate-500">Teachers</p>
                    </div>
                    <div className="text-center p-3 bg-slate-50 rounded-lg">
                      <p className="text-xl font-bold">{new Set(classInstances.map(i => i.class_id)).size}</p>
                      <p className="text-sm text-slate-500">Classes</p>
                    </div>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {classInstances.slice(0, 15).map((instance) => {
                      const cls = classes.find(c => c.id === instance.class_id);
                      const teacher = teachers.find(t => t.user_uuid === instance.teacher_uuid);
                      return (
                        <div key={instance.id} className="p-2 bg-slate-50 rounded text-sm">
                          <span className="font-medium">{cls?.class_name}</span> - {instance.class_date}
                          {teacher && <span className="text-slate-500"> ({teacher.first_name})</span>}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Select Student</label>
                <select
                  className="border rounded-md px-3 py-2 w-full max-w-md"
                  onChange={(e) => {
                    const student = users.find(u => u.user_uuid === e.target.value);
                    if (student) loadStudentAnalytics(student);
                  }}
                  defaultValue=""
                >
                  <option value="">Select a student...</option>
                  {users.map((u) => (
                    <option key={u.user_uuid} value={u.user_uuid}>
                      {u.first_name} {u.last_name} ({u.rank})
                    </option>
                  ))}
                </select>
              </div>

              {selectedStudentAnalytics && performanceStats ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-4 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    <Avatar
                      src={selectedStudentAnalytics.profile_image_url}
                      firstName={selectedStudentAnalytics.first_name}
                      lastName={selectedStudentAnalytics.last_name}
                      size="lg"
                    />
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">{selectedStudentAnalytics.first_name} {selectedStudentAnalytics.last_name}</h3>
                      <RankBadge rank={selectedStudentAnalytics.rank} />
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">{performanceStats.stats?.totalPoints || 0}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Total Points</p>
                    </div>
                    <div className="text-center p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">{performanceStats.stats?.totalClasses || 0}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Total Sessions</p>
                    </div>
                    <div className="text-center p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">{performanceStats.stats?.classesThisMonth || 0}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">This Month</p>
                    </div>
                    <div className="text-center p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">{performanceStats.stats?.lastClassDaysAgo ?? 'N/A'}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Days Since Last</p>
                    </div>
                  </div>

                  {performanceStats.trend && performanceStats.trend.length > 0 && (
                    <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                      <h4 className="font-medium mb-4 text-slate-900 dark:text-white">Attendance Trend (Last 90 Days)</h4>
                      <div className="space-y-2">
                        {performanceStats.trend.slice(0, 14).map((day: any) => (
                          <div key={day.date} className="flex items-center gap-4">
                            <span className="text-sm text-slate-500 dark:text-slate-400 w-24">{day.date}</span>
                            <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-4">
                              <div
                                className="bg-blue-500 h-4 rounded-full"
                                style={{ width: `${Math.min((day.points / 10) * 100, 100)}%` }}
                              />
                            </div>
                            <span className="text-sm w-16 text-right text-slate-700 dark:text-slate-300">{day.points} pts</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-slate-500 dark:text-slate-400">Select a student to view their analytics...</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'feedback' && (
        <Card>
          <CardHeader>
            <CardTitle>Feedback Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <details className="mb-4">
              <summary className="cursor-pointer font-medium mb-2 text-slate-700 dark:text-slate-300">🔽 Filters</summary>
              <div className="flex gap-4 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg flex-wrap">
                <Input
                  type="date"
                  label="Start Date"
                  value={feedbackFilters.startDate}
                  onChange={(e) => setFeedbackFilters({ ...feedbackFilters, startDate: e.target.value })}
                  className="w-auto"
                />
                <Input
                  type="date"
                  label="End Date"
                  value={feedbackFilters.endDate}
                  onChange={(e) => setFeedbackFilters({ ...feedbackFilters, endDate: e.target.value })}
                  className="w-auto"
                />
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Rating</label>
                  <select
                    className="border dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-md px-3 py-2"
                    value={feedbackFilters.rating}
                    onChange={(e) => setFeedbackFilters({ ...feedbackFilters, rating: e.target.value })}
                  >
                    <option value="all">All</option>
                    <option value="positive">Positive</option>
                    <option value="negative">Negative</option>
                  </select>
                </div>
              </div>
            </details>

            {feedbackStats ? (
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{feedbackStats.totalFeedback || 0}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Total</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{feedbackStats.positivePercent || 0}%</p>
                    <p className="text-sm text-green-600 dark:text-green-400">👍 Positive</p>
                  </div>
                  <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">{(100 - (feedbackStats.positivePercent || 0))}%</p>
                    <p className="text-sm text-red-600 dark:text-red-400">👎 Negative</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{feedbackStats.positiveCount || 0}</p>
                    <p className="text-sm text-blue-600 dark:text-blue-400">👍 Count</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-slate-500 dark:text-slate-400">Loading feedback data...</p>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'student-passwords' && (
        <Card>
          <CardHeader>
            <CardTitle>Student Password Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h4 className="font-medium mb-2 text-slate-900 dark:text-white">How Password System Works</h4>
              <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
                <li>• Students can set their own password after initial login</li>
                <li>• Admins can reset passwords from this panel</li>
                <li>• Passwords are hashed securely</li>
                <li>• Students without passwords cannot log in to the portal</li>
              </ul>
            </div>

            <h4 className="font-medium mb-4 text-slate-900 dark:text-white">Password Status</h4>
            <div className="border dark:border-slate-700 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-100 dark:bg-slate-800">
                  <tr>
                    <th className="text-left p-3 text-slate-700 dark:text-slate-300">Name</th>
                    <th className="text-left p-3 text-slate-700 dark:text-slate-300">Email</th>
                    <th className="text-left p-3 text-slate-700 dark:text-slate-300">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.user_uuid} className="border-t dark:border-slate-700">
                      <td className="p-3 text-slate-900 dark:text-white">{u.first_name} {u.last_name}</td>
                      <td className="p-3 text-sm text-slate-500 dark:text-slate-400">{u.email}</td>
                      <td className="p-3">
                        {u.password_hash ? (
                          <span className="text-green-600 dark:text-green-400">✅ Active</span>
                        ) : (
                          <span className="text-red-500 dark:text-red-400">❌ No Password</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'kiosk' && (
        <Card>
          <CardHeader>
            <CardTitle>Kiosk PIN Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h4 className="font-medium mb-2 text-slate-900 dark:text-white">How Kiosk Mode Works</h4>
              <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
                <li>• Students enter their PIN on the kiosk screen to check in</li>
                <li>• PIN is 4-6 digits</li>
                <li>• PIN is different from account password</li>
                <li>• PIN is used for quick self-check-in at the gym</li>
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-4 text-slate-900 dark:text-white">Change PIN</h4>
                <div className="space-y-4">
                  <Input
                    label="Current PIN"
                    type="password"
                    maxLength={6}
                    value={kioskPin.current}
                    onChange={(e) => setKioskPin({ ...kioskPin, current: e.target.value })}
                  />
                  <Input
                    label="New PIN (4-6 digits)"
                    type="password"
                    maxLength={6}
                    value={kioskPin.newPin}
                    onChange={(e) => setKioskPin({ ...kioskPin, newPin: e.target.value })}
                  />
                  <Input
                    label="Confirm New PIN"
                    type="password"
                    maxLength={6}
                    value={kioskPin.confirm}
                    onChange={(e) => setKioskPin({ ...kioskPin, confirm: e.target.value })}
                  />
                  <Button onClick={handleUpdateKioskPin} disabled={isProcessing}>
                    Update PIN
                  </Button>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-4">Current Status</h4>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-500">Default PIN: 1234</p>
                  {dbStats?.kiosk_pin_set ? (
                    <p className="text-green-600 mt-2">✅ Custom PIN is set</p>
                  ) : (
                    <p className="text-yellow-600 mt-2">⚠️ Using default PIN</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'database' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Database Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <p className="text-2xl font-bold">{dbStats?.size || 'N/A'}</p>
                  <p className="text-sm text-slate-500">Size</p>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <p className="text-2xl font-bold">{dbStats?.total_users || 0}</p>
                  <p className="text-sm text-slate-500">Users</p>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <p className="text-2xl font-bold">{dbStats?.total_attendance || 0}</p>
                  <p className="text-sm text-slate-500">Attendance</p>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <p className="text-2xl font-bold">{dbStats?.total_classes || 0}</p>
                  <p className="text-sm text-slate-500">Classes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Export</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={async () => {
                    try {
                      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/database/export-seed`);
                      const blob = await res.blob();
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'seed-data.json';
                      a.click();
                      URL.revokeObjectURL(url);
                    } catch (error) {
                      alert('Failed to export seed');
                    }
                  }}
                >
                  📦 Create Seed File
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={async () => {
                    try {
                      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/database/create-backup`);
                      const blob = await res.blob();
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                    } catch (error) {
                      alert('Failed to create backup');
                    }
                  }}
                >
                  💾 Create Backup
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Restore</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Upload Backup File</label>
                  <input
                    type="file"
                    accept=".json"
                    className="block w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-slate-100 dark:file:bg-slate-700 dark:file:text-white hover:file:bg-slate-200 dark:hover:file:bg-slate-600"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const formData = new FormData();
                      formData.append('file', file);
                      try {
                        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/database/restore`, {
                          method: 'POST',
                          body: formData,
                        });
                        if (res.ok) {
                          alert('Restored successfully');
                          loadAllData();
                        } else {
                          alert('Restore failed');
                        }
                      } catch (error) {
                        alert('Restore failed');
                      }
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-red-600 dark:text-red-400">Reset Database</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-slate-500 dark:text-slate-400">Warning: These actions cannot be undone!</p>
                <div className="flex gap-4">
                  <Button
                    variant="destructive"
                    onClick={async () => {
                      if (!confirm('This will delete all data except roles. Continue?')) return;
                      try {
                        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/database/reset`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ mode: 'empty' }),
                        });
                        if (res.ok) {
                          alert('Database reset');
                          loadAllData();
                          loadDbStats();
                        }
                      } catch (error) {
                        alert('Reset failed');
                      }
                    }}
                  >
                    🗑️ Empty (Keep Roles)
                  </Button>
                  <Button
                    variant="outline"
                    onClick={async () => {
                      if (!confirm('This will load seed data. Continue?')) return;
                      try {
                        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/database/reset`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ mode: 'seed' }),
                        });
                        if (res.ok) {
                          alert('Seed data loaded');
                          loadAllData();
                          loadDbStats();
                        }
                      } catch (error) {
                        alert('Seed failed');
                      }
                    }}
                  >
                    🌱 Load from Seed
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
      </div>
    </>
  );
}
