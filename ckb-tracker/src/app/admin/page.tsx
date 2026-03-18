'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Avatar } from '@/components/ui/Avatar';
import { RankBadge } from '@/components/ui/Badge';
import { useAuth } from '@/hooks/useAuth';
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
} from '@/lib/api';
import { formatDate, DAYS_OF_WEEK } from '@/lib/utils';
import type { User, ClassSchedule, Role, Term, TermTarget, Curriculum, Lesson, GymLocation, ClassType, Rank } from '@/types';

export default function AdminPage() {
  const { user, isAdmin, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('users');
  const [isLogin, setIsLogin] = useState(true);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
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

  const adminUsername = 'admin';
  const adminPassword = 'ckb2026';

  useEffect(() => {
    if (isAdmin) {
      loadAllData();
    }
  }, [isAdmin]);

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

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginForm.username === adminUsername && loginForm.password === adminPassword) {
      setIsLogin(false);
      loadAllData();
    } else {
      alert('Invalid credentials');
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

  const filteredUsers = users.filter(u =>
    `${u.first_name} ${u.last_name} ${u.email} ${u.rank}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tabs = [
    { id: 'users', label: '🥋 User Admin' },
    { id: 'classes', label: '📅 Class Schedule' },
    { id: 'gyms', label: '🏢 Gyms & Types' },
    { id: 'terms', label: '🗓️ Terms' },
    { id: 'targets', label: '🎯 Targets' },
    { id: 'lessons', label: '📚 Lessons' },
    { id: 'analytics', label: '📈 Performance Analytics' },
    { id: 'feedback', label: '📊 Feedback Analytics' },
  ];

  if (isLogin) {
    return (
      <div className="max-w-md mx-auto mt-20">
        <Card>
          <CardHeader>
            <CardTitle>Admin Login</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                label="Username"
                value={loginForm.username}
                onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
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
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Admin Settings</h1>

      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? 'default' : 'outline'}
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
                <p className="text-sm text-slate-500 mb-4">Total Active Members: {studentStats.totalStudents}</p>
                <div className="space-y-2">
                  {filteredUsers.map((u) => (
                    <div
                      key={u.user_uuid}
                      className={`flex items-center justify-between p-3 rounded-lg cursor-pointer ${selectedUser?.user_uuid === u.user_uuid ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 hover:bg-slate-100'}`}
                      onClick={() => handleSelectUser(u)}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar src={u.profile_image_url} firstName={u.first_name} lastName={u.last_name} />
                        <div>
                          <p className="font-medium">{u.first_name} {u.last_name}</p>
                          <p className="text-sm text-slate-500">{u.email}</p>
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
                    <label className="block text-sm font-medium text-slate-700 mb-1">Roles</label>
                    <div className="space-y-1">
                      {roles.map((role) => (
                        <label key={role.id} className="flex items-center gap-2">
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
                  <div key={cls.id} className="flex justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium">{cls.class_name}</p>
                      <p className="text-sm text-slate-500">{cls.day} {cls.time}</p>
                    </div>
                    <p className="font-medium">{cls.points} pts</p>
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
                  <div key={gym.id} className="p-3 bg-slate-50 rounded-lg">
                    <p className="font-medium">{gym.name}</p>
                    {gym.address && <p className="text-sm text-slate-500">{gym.address}</p>}
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
                  <div key={type.id} className="p-3 bg-slate-50 rounded-lg">
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
                  <div key={term.id} className="p-3 bg-slate-50 rounded-lg">
                    <p className="font-medium">{term.term_name}</p>
                    <p className="text-sm text-slate-500">
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
                    <div key={target.id} className="p-3 bg-slate-50 rounded-lg">
                      <p className="font-medium">{term?.term_name}</p>
                      <p className="text-sm text-slate-500">{target.rank}: {target.target} hours</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'lessons' && (
        <div className="space-y-6">
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

          <Card>
            <CardHeader>
              <CardTitle>Lessons</CardTitle>
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
        </div>
      )}

      {activeTab === 'analytics' && (
        <Card>
          <CardHeader>
            <CardTitle>Performance Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-500">Select a student to view their analytics...</p>
            <div className="mt-4 grid grid-cols-2 gap-4">
              {users.slice(0, 10).map((u) => (
                <div key={u.user_uuid} className="p-4 bg-slate-50 rounded-lg">
                  <p className="font-medium">{u.first_name} {u.last_name}</p>
                  <p className="text-sm text-slate-500">{u.rank}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'feedback' && (
        <Card>
          <CardHeader>
            <CardTitle>Feedback Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-500">Feedback analytics coming soon...</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
